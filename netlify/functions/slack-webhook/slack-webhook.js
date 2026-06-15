/**
 * Netlify Function: slack-webhook
 *
 * Receives YCode webhook payloads (form.submitted events), filters obvious
 * spam, and forwards only valid leads to Slack as Block Kit messages.
 *
 * Environment variable required:
 *   SLACK_WEBHOOK_URL — Slack Incoming Webhook URL (https://hooks.slack.com/services/...)
 *
 * Spam rules are intentionally simple and explicit — easy to adjust per site.
 */

const https = require("https");
const http = require("http");

// ────────────────────────────────────────────────────────────────────────────
// Spam detection heuristics
// ────────────────────────────────────────────────────────────────────────────

/**
 * Heuristic: does the string look like a randomly-generated identifier?
 * Targets patterns like "aB3xK9mQw", "abc123xyz", consonant-only gibberish.
 */
function looksRandom(value) {
  if (!value) return false;
  const len = value.length;
  if (len < 2) return true;

  // Repeating same character
  if (/^(.)\1+$/.test(value)) return true;

  // Alternating consonant-vowel with mixed case (e.g. "XaZeBoQu")
  if (/^[A-Z][a-z](?:[A-Z][a-z])+$/.test(value) && len <= 12) return true;

  // High ratio of digits (e.g. "abc123xyz456")
  const digitRatio = (value.match(/\d/g) || []).length / len;
  if (digitRatio >= 0.3 && len <= 16) return true;

  // All consonants, ≥ 4 chars (e.g. "bcfghjklmnpq")
  if (/^[bcdfghjklmnpqrstvwxz]+$/i.test(value) && len >= 4 && len <= 12) {
    return true;
  }

  // Mixed upper+lower+digits, no punctuation/spaces, 6-15 chars
  // — typical of auto-generated tokens
  if (
    len >= 6 &&
    len <= 15 &&
    !/\s/.test(value) &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    !/[.,;:'"!?&@#%^*()\-_=+[\]{}|\\/]/.test(value)
  ) {
    return true;
  }

  return false;
}

/**
 * Loose email check: must have @ with something on both sides + dot in domain.
 */
function emailLooksInvalid(email) {
  if (!email) return false; // optional field
  return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Phone heuristics: too few digits, all same digit, or sequential.
 */
function phoneLooksSuspicious(phone) {
  if (!phone) return false;

  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return false;
  if (digits.length < 7) return true;

  // All same digit ("5555555555", "0000000000")
  if (/^(\d)\1+$/.test(digits)) return true;

  // Sequential ascending or descending
  if (
    /^(?:0(?=1)|1(?=2)|2(?=3)|3(?=4)|4(?=5)|5(?=6)|6(?=7)|7(?=8)|8(?=9)|9(?=0)){6,}\d$/.test(
      digits,
    )
  ) {
    return true;
  }
  if (
    /^(?:9(?=8)|8(?=7)|7(?=6)|6(?=5)|5(?=4)|4(?=3)|3(?=2)|2(?=1)|1(?=0)|0(?=9)){6,}\d$/.test(
      digits,
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Run all spam checks against the parsed fields object.
 * Returns { spam: true, reasons: [...] } or { spam: false }.
 */
function detectSpam(fields) {
  if (!fields || typeof fields !== "object") {
    return { spam: true, reasons: ["empty_fields"] };
  }

  const reasons = [];

  // ── honeypot ──────────────────────────────────────────────────────────
  // Common honeypot field names on Ycode/Bauhem forms
  const honeypotKeys = ["honeypot", "hp", "url", "website", "fax"];
  for (const key of honeypotKeys) {
    const val = String(fields[key] || "").trim();
    if (val.length > 0) {
      reasons.push(`honeypot_filled:${key}`);
    }
  }

  // ── name ──────────────────────────────────────────────────────────────
  const name = String(fields.name || "").trim();
  if (name && looksRandom(name)) {
    reasons.push("name_looks_random");
  }

  // ── message ───────────────────────────────────────────────────────────
  // Ycode form fields may be called "message" or "Message" or "notes"
  const messageKeys = ["message", "Message", "notes", "Notes"];
  let message = "";
  for (const key of messageKeys) {
    if (fields[key]) {
      message = String(fields[key]).trim();
      break;
    }
  }
  if (message) {
    if (message.length < 8) {
      reasons.push("message_too_short");
    }
    if (looksRandom(message) && message.length <= 60) {
      reasons.push("message_looks_random");
    }
  }

  // ── email ─────────────────────────────────────────────────────────────
  const emailKeys = ["email", "Email", "courriel", "Courriel"];
  let email = "";
  for (const key of emailKeys) {
    if (fields[key]) {
      email = String(fields[key]).trim();
      break;
    }
  }
  if (email && emailLooksInvalid(email)) {
    reasons.push("email_invalid");
  }

  // ── phone ─────────────────────────────────────────────────────────────
  const phoneKeys = ["phone", "Phone", "telephone", "Telephone", "tel"];
  let phone = "";
  for (const key of phoneKeys) {
    if (fields[key]) {
      phone = String(fields[key]).trim();
      break;
    }
  }
  if (phone && phoneLooksSuspicious(phone)) {
    reasons.push("phone_suspicious");
  }

  return {
    spam: reasons.length > 0,
    reasons,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Slack message builder (Block Kit)
// ────────────────────────────────────────────────────────────────────────────

function buildSlackBlocks(data, metadata, timestamp) {
  const blocks = [];

  // Header
  blocks.push({
    type: "header",
    text: { type: "plain_text", text: "\u{1F4EC} New Form Submission", emoji: true },
  });

  // Timestamp + submission ID
  blocks.push({
    type: "section",
    fields: [
      {
        type: "mrkdwn",
        text: `*Time:*\n${new Date(timestamp).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}`,
      },
      {
        type: "mrkdwn",
        text: `*Submission ID:*\n\`${data.submission_id}\``,
      },
    ],
  });

  // Page URL if available
  if (metadata && metadata.page_url) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Page:* <${metadata.page_url}|${metadata.page_url}>`,
      },
    });
  }

  // Divider
  blocks.push({ type: "divider" });

  // Form fields
  if (data.fields && typeof data.fields === "object") {
    const fieldEntries = Object.entries(data.fields);
    if (fieldEntries.length > 0) {
      const slackFields = fieldEntries.map(function ([key, value]) {
        const displayValue = String(value != null ? value : "-");
        return { type: "mrkdwn", text: `*${key}:*\n${displayValue}` };
      });

      blocks.push({
        type: "section",
        fields: slackFields,
      });
    }
  }

  // Context footer
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Sent via YCode webhook \u2022 ${new Date().toISOString()}`,
      },
    ],
  });

  return { blocks };
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP helpers
// ────────────────────────────────────────────────────────────────────────────

function postJson(urlString, jsonPayload) {
  return new Promise(function (resolve, reject) {
    var url = new URL(urlString);
    var body = JSON.stringify(jsonPayload);
    var transport = url.protocol === "https:" ? https : http;

    var req = transport.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      function (res) {
        var data = "";
        res.on("data", function (chunk) {
          data += chunk;
        });
        res.on("end", function () {
          resolve({ status: res.statusCode, body: data });
        });
      },
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────────────────────

exports.handler = async function (event) {
  var slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!slackWebhookUrl) {
    console.error("SLACK_WEBHOOK_URL environment variable is not set");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "SLACK_WEBHOOK_URL not configured" }),
    };
  }

  // Only accept POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  // Parse JSON body
  var payload;
  try {
    payload = JSON.parse(event.body);
  } catch (_e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  // ── Spam detection ────────────────────────────────────────────────────

  var fields = (payload.data && payload.data.fields) || {};
  var spamResult = detectSpam(fields);

  if (spamResult.spam) {
    // Log for debugging — visible in Netlify Function logs
    console.log(
      JSON.stringify({
        event: "spam_blocked",
        timestamp: new Date().toISOString(),
        reasons: spamResult.reasons,
        preview: {
          name: String(fields.name || "").slice(0, 60),
          email: String(fields.email || "").slice(0, 60),
          message: String(fields.message || fields.Message || "").slice(0, 120),
          page: (payload.metadata && payload.metadata.page_url) || "-",
        },
      }),
    );

    // Neutral success — bots get no useful feedback
    return {
      statusCode: 200,
      body: "ok",
    };
  }

  // ── Forward to Slack ──────────────────────────────────────────────────

  try {
    var slackMessage = buildSlackBlocks(
      payload.data || {},
      payload.metadata,
      payload.timestamp,
    );

    var result = await postJson(slackWebhookUrl, slackMessage);

    return {
      statusCode: result.status,
      body: result.status === 200 ? "ok" : result.body,
    };
  } catch (error) {
    console.error("Slack webhook delivery failed:", error.message);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

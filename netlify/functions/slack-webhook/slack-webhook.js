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
// Spam detection — honeypot + whitelist
// ────────────────────────────────────────────────────────────────────────────
//
// YCode does NOT preserve HTML name="honeypot" in webhook payloads.
// Instead, it sends layer-id-prefixed keys like:
//   "lyr-contact-hero-form-instance-lyr-mqfjh0a6y99hfg"
//
// Strategy: any field key NOT in the known-fields whitelist that has a
// non-empty value is the honeypot being filled by a bot.

var KNOWN_FIELDS = ["name", "email", "phone", "message", "service"];

/**
 * Run spam check. Only one rule: was an unknown field (honeypot) filled?
 * Returns { spam: boolean, reason: string|null }
 */
function detectSpam(fields) {
  if (!fields || typeof fields !== "object") {
    return { spam: true, reason: "empty_fields" };
  }

  for (var key in fields) {
    if (Object.prototype.hasOwnProperty.call(fields, key) && KNOWN_FIELDS.indexOf(key) === -1) {
      var val = String(fields[key] || "").trim();
      if (val.length > 0) {
        return { spam: true, reason: "honeypot_filled" };
      }
    }
  }

  return { spam: false, reason: null };
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
  } catch (e) {
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
        reason: spamResult.reason,
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

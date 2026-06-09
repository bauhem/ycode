/**
 * Netlify Function: slack-webhook
 *
 * Receives YCode webhook payloads (form.submitted events) and forwards them
 * to Slack as formatted messages using Slack's Incoming Webhook API.
 *
 * Environment variable required:
 *   SLACK_WEBHOOK_URL — Slack Incoming Webhook URL (https://hooks.slack.com/services/...)
 */

const https = require("https");
const http = require("http");

/**
 * Build a Slack Block Kit message from YCode form submission data.
 */
function buildSlackBlocks(data, metadata, timestamp) {
  const blocks = [];

  // Header
  blocks.push({
    type: "header",
    text: { type: "plain_text", text: "📬 New Form Submission", emoji: true },
  });

  // Timestamp + submission ID
  blocks.push({
    type: "section",
    fields: [
      { type: "mrkdwn", text: `*Time:*\n${new Date(timestamp).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}` },
      { type: "mrkdwn", text: `*Submission ID:*\n\`${data.submission_id}\`` },
    ],
  });

  // Page URL if available
  if (metadata && metadata.page_url) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Page:* <${metadata.page_url}|${metadata.page_url}>` },
    });
  }

  // Divider
  blocks.push({ type: "divider" });

  // Form fields
  if (data.fields && typeof data.fields === "object") {
    const fieldEntries = Object.entries(data.fields);
    if (fieldEntries.length > 0) {
      const fields = fieldEntries.map(([key, value]) => {
        const displayValue = String(value ?? "-");
        return { type: "mrkdwn", text: `*${key}:*\n${displayValue}` };
      });

      blocks.push({
        type: "section",
        fields,
      });
    }
  }

  // Context footer
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Sent via YCode webhook • ${new Date().toISOString()}`,
      },
    ],
  });

  return { blocks };
}

/**
 * POST JSON payload to a URL and return { status, body }.
 */
function postJson(urlString, jsonPayload) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const body = JSON.stringify(jsonPayload);
    const transport = url.protocol === "https:" ? https : http;

    const req = transport.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () =>
          resolve({ status: res.statusCode, body: data })
        );
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

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

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  try {
    const slackMessage = buildSlackBlocks(
      payload.data || {},
      payload.metadata,
      payload.timestamp
    );

    const result = await postJson(slackWebhookUrl, slackMessage);

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

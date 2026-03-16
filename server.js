/*
  LightMatch — Server
  Serves the React app and proxies Anthropic API calls.
  API key is read from the ANTHROPIC_API_KEY environment variable.
  In CodeSandbox: add it in Sandbox > Settings > Environment Variables
*/

const express = require("express");
const cors    = require("cors");
const fetch   = require("node-fetch");
const path    = require("path");
const fs      = require("fs");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ── Serve built React app ────────────────────────────────────────────────────
const buildDir = path.join(__dirname, "client", "dist");
const devHtml  = path.join(__dirname, "client", "index.html");

if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir));
}

// ── Health / status ──────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  res.json({
    status: "ok",
    apiKeyConfigured: !!(key && key.startsWith("sk-")),
    message: (key && key.startsWith("sk-"))
      ? "Ready"
      : "Add ANTHROPIC_API_KEY in CodeSandbox > Settings > Environment Variables"
  });
});

// ── Anthropic proxy ──────────────────────────────────────────────────────────
app.post("/api/messages", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || !apiKey.startsWith("sk-")) {
    return res.status(500).json({
      error: {
        message: "ANTHROPIC_API_KEY not configured. In CodeSandbox: open Settings → Environment Variables → add ANTHROPIC_API_KEY = sk-ant-..."
      }
    });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta":    "web-search-2025-03-05"
      },
      body: JSON.stringify(req.body)
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);

  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).json({ error: { message: "Proxy error: " + err.message } });
  }
});

// ── SPA fallback ─────────────────────────────────────────────────────────────
app.get("*", (req, res) => {
  const built = path.join(buildDir, "index.html");
  if (fs.existsSync(built)) {
    res.sendFile(built);
  } else {
    res.status(200).send(`<!DOCTYPE html>
<html><head><title>LightMatch</title></head>
<body style="font-family:sans-serif;padding:40px;background:#f4f6f9;color:#1a2438">
  <h2>LightMatch is starting...</h2>
  <p>The React app needs to be built first.</p>
  <p>In the CodeSandbox terminal run: <code style="background:#e8eef8;padding:4px 8px;border-radius:4px">cd client && npm install && npm run build</code></p>
  <p>Then restart the server: <code style="background:#e8eef8;padding:4px 8px;border-radius:4px">node server.js</code></p>
</body></html>`);
  }
});

app.listen(PORT, () => {
  console.log("\n  LightMatch running on port " + PORT);
  console.log("  API key: " + (process.env.ANTHROPIC_API_KEY ? "configured ✓" : "NOT SET — add in CodeSandbox Environment Variables"));
  console.log("");
});

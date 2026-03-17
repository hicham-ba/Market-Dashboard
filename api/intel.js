// Vercel Pro allows up to 60s, free tier 10s
// Set max duration to handle Claude + web search latency
export const config = {
  maxDuration: 60
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const key = process.env.ANTHROPIC_KEY;
  if (!key) {
    return res.status(500).json({ error: "ANTHROPIC_KEY not configured in Vercel environment variables" });
  }

  try {
    const body = req.body;
    if (!body || !body.prompt) {
      return res.status(400).json({ error: "Missing prompt in body" });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: body.prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return res.status(response.status).json({ 
        error: "Anthropic API returned " + response.status,
        detail: errText.substring(0, 500)
      });
    }

    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=30");
    return res.status(200).json(data);
  } catch (e) {
    console.error("Intel handler error:", e);
    return res.status(500).json({ error: e.message, stack: e.stack ? e.stack.substring(0, 300) : "" });
  }
}

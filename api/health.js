export const config = {
  maxDuration: 30
};

export default async function handler(req, res) {
  const finnhub = process.env.FINNHUB_KEY ? "configured (" + process.env.FINNHUB_KEY.substring(0, 4) + "...)" : "MISSING";
  const anthropic = process.env.ANTHROPIC_KEY ? "configured (" + process.env.ANTHROPIC_KEY.substring(0, 8) + "...)" : "MISSING";

  let finnhubTest = "not tested";
  let anthropicTest = "not tested";

  // Test Finnhub
  if (process.env.FINNHUB_KEY) {
    try {
      const r = await fetch("https://finnhub.io/api/v1/quote?symbol=AAPL&token=" + process.env.FINNHUB_KEY);
      const d = await r.json();
      if (d.c && d.c > 0) finnhubTest = "OK - AAPL=$" + d.c;
      else finnhubTest = "ERROR - " + JSON.stringify(d).substring(0, 200);
    } catch (e) { finnhubTest = "FETCH FAILED - " + e.message; }
  }

  // Test Anthropic
  if (process.env.ANTHROPIC_KEY) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 50,
          messages: [{ role: "user", content: "Say OK" }]
        })
      });
      if (r.ok) {
        const d = await r.json();
        anthropicTest = "OK - model responded";
      } else {
        const errText = await r.text();
        anthropicTest = "ERROR " + r.status + " - " + errText.substring(0, 200);
      }
    } catch (e) { anthropicTest = "FETCH FAILED - " + e.message; }
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).json({
    finnhubKey: finnhub,
    anthropicKey: anthropic,
    finnhubTest: finnhubTest,
    anthropicTest: anthropicTest,
    timestamp: new Date().toISOString()
  });
}

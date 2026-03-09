export default async function handler(req, res) {
  const finnhub = process.env.FINNHUB_KEY ? "configured (" + process.env.FINNHUB_KEY.substring(0, 4) + "...)" : "MISSING";
  const anthropic = process.env.ANTHROPIC_KEY ? "configured (" + process.env.ANTHROPIC_KEY.substring(0, 8) + "...)" : "MISSING";

  // Quick test Finnhub
  let finnhubTest = "not tested";
  if (process.env.FINNHUB_KEY) {
    try {
      const r = await fetch("https://finnhub.io/api/v1/quote?symbol=AAPL&token=" + process.env.FINNHUB_KEY);
      const d = await r.json();
      if (d.c && d.c > 0) {
        finnhubTest = "OK - AAPL=$" + d.c;
      } else {
        finnhubTest = "ERROR - " + JSON.stringify(d);
      }
    } catch (e) {
      finnhubTest = "FETCH FAILED - " + e.message;
    }
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).json({
    finnhubKey: finnhub,
    anthropicKey: anthropic,
    finnhubTest: finnhubTest,
    timestamp: new Date().toISOString()
  });
}

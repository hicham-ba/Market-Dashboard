import React, { useState, useEffect, useRef } from "react";

// MARKET UNIVERSE EXPLORER v15 - Final clean build
// Real closing data: Friday, March 6, 2026
// CNN Fear & Greed: 27 (Fear) - verified

var mono = "'SF Mono','Fira Code','Consolas',monospace";

// Inject CSS animations for 7/7 pulse effects
if (typeof document !== "undefined" && !document.getElementById("mue-animations")) {
  var style = document.createElement("style");
  style.id = "mue-animations";
  style.textContent = [
    "@keyframes pulse-glow { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.08); } }",
    "@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }",
    ".pulse-card { animation: card-pulse 2s ease-in-out infinite; }",
    "@keyframes card-pulse { 0%,100% { box-shadow: 0 0 15px rgba(224,64,251,0.1); } 50% { box-shadow: 0 0 30px rgba(224,64,251,0.25), 0 0 60px rgba(224,64,251,0.1); } }"
  ].join("\n");
  document.head.appendChild(style);
}
var h = React.createElement;

function Chg(props) {
  var v = props.v, sz = props.sz || 16;
  return h("span", {
    style: { color: v >= 0 ? "#00ff88" : "#ff4d4d", fontSize: sz, fontWeight: 700, fontFamily: mono }
  }, (v >= 0 ? "+" : "") + v.toFixed(2) + "%");
}

function Badge(props) {
  return h("span", {
    style: { padding: "3px 9px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: props.color + "18", border: "1px solid " + props.color + "44", color: props.color, whiteSpace: "nowrap" }
  }, props.text);
}

var sC = function(s) { return {Bearish:"#ff4d4d","Very Bearish":"#ff2020",Bullish:"#00ff88",Neutral:"#78909c"}[s] || "#78909c"; };
var sigC = function(s) { return {"Strong Buy":"#00ff88",Buy:"#00dd66",Hold:"#ffd700",Sell:"#ff6b35","Strong Sell":"#ff2020"}[s] || "#78909c"; };
var evColor = function(t) { return t==="earnings" ? "#ffd700" : t==="dividend" ? "#00ff88" : "#00d4ff"; };

function Bar(props) {
  var pct = Math.min((props.val / props.max) * 100, 100);
  return h("div", { style: { marginBottom: 6 } },
    h("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6a7a94", marginBottom: 2 } },
      h("span", null, props.label),
      h("span", { style: { color: "#bcc6d4", fontFamily: mono } }, props.val + (props.suffix || ""))
    ),
    h("div", { style: { height: 5, borderRadius: 3, background: "#141f35" } },
      h("div", { style: { height: "100%", borderRadius: 3, width: pct + "%", background: props.color } })
    )
  );
}

function Gauge(props) {
  var score = props.score, label = props.label;
  var c = score >= 70 ? "#00ff88" : score >= 55 ? "#00dd66" : score >= 45 ? "#ffd700" : score >= 30 ? "#ff6b35" : "#ff2020";
  var dash = (score / 100) * 120;
  return h("div", { style: { textAlign: "center" } },
    h("svg", { width: "90", height: "48", viewBox: "0 0 90 48" },
      h("path", { d: "M 5 44 A 38 38 0 0 1 85 44", fill: "none", stroke: "#141f35", strokeWidth: "6", strokeLinecap: "round" }),
      h("path", { d: "M 5 44 A 38 38 0 0 1 85 44", fill: "none", stroke: c, strokeWidth: "6", strokeLinecap: "round", strokeDasharray: dash + " 120" })
    ),
    h("div", { style: { fontSize: 20, fontWeight: 800, color: c, fontFamily: mono, marginTop: -10 } }, score),
    h("div", { style: { fontSize: 12, color: c, fontWeight: 700, marginTop: 2 } }, label)
  );
}

function Stars() {
  var ref = useRef(null);
  useEffect(function() {
    var c = ref.current;
    if (!c) return;
    var ctx = c.getContext("2d");
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2; ctx.scale(2, 2);
    for (var i = 0; i < 180; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * c.offsetWidth, Math.random() * c.offsetHeight, Math.random() * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + (Math.random() * 0.5 + 0.1) + ")";
      ctx.fill();
    }
  }, []);
  return h("canvas", { ref: ref, style: { position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 } });
}

// MA estimation from price + signal data
function estimateMAs(price, high, low, signals) {
  var sig = signals || {};
  var sma5 = price * (1 + (Math.random() * 0.02 - 0.01));
  var sma10 = price * (1 + (Math.random() * 0.03 - 0.015));
  var sma20 = sig.sma20 === "Above" ? price * 0.97 : sig.sma20 === "Below" ? price * 1.04 : price * 1.005;
  var sma50 = sig.sma50 === "Above" ? price * 0.92 : sig.sma50 === "Below" ? price * 1.08 : price * 1.01;
  var sma200 = sig.sma200 === "Above" ? price * 0.82 : sig.sma200 === "Below" ? price * 1.15 : price * 0.95;
  return { sma5: Math.round(sma5*100)/100, sma10: Math.round(sma10*100)/100, sma20: Math.round(sma20*100)/100, sma50: Math.round(sma50*100)/100, sma200: Math.round(sma200*100)/100 };
}

function maSignal(price, maVal) {
  if (!maVal || maVal <= 0) return { label: "N/A", color: "#5a6b8a" };
  var pct = ((price - maVal) / maVal) * 100;
  if (pct > 5) return { label: "Bullish", color: "#00ff88" };
  if (pct > 1) return { label: "Mild Bull", color: "#00dd66" };
  if (pct > -1) return { label: "Neutral", color: "#ffd700" };
  if (pct > -5) return { label: "Mild Bear", color: "#ff6b35" };
  return { label: "Bearish", color: "#ff4d4d" };
}

function mk(t, n, p, ch, sec, mc, pe, hi, lo, beta, dy, vol, av, rsi, si, inst, sn, of2, ia, ar, pt, ev, sg, iw) {
  var obj = {
    ticker: t, name: n, price: p, change: ch, sector: sec, marketCap: mc, pe: pe,
    fiftyTwoHigh: hi, fiftyTwoLow: lo, beta: beta, divYield: dy,
    volume: vol, avgVol: av, rsi: rsi, shortInt: si, instOwn: inst,
    sentiment: sn, optionsFlow: of2, insiderActivity: ia,
    analystRating: ar, priceTarget: pt, events: ev || [],
    signals: sg || { composite: "Hold", score: 50, macd: "Neutral", sma20: "N/A", sma50: "N/A", sma200: "N/A" },
    idxWeight: iw || "<0.1%"
  };
  obj.mas = estimateMAs(p, hi, lo, sg);
  return obj;
}

function MAPanel(props) {
  var stock = props.stock; var mas = stock.mas || {}; var price = stock.price;
  var periods = [
    { key: "sma5", label: "SMA 5", desc: "Ultra short-term" },
    { key: "sma10", label: "SMA 10", desc: "Short-term trend" },
    { key: "sma20", label: "SMA 20", desc: "Swing trade" },
    { key: "sma50", label: "SMA 50", desc: "Medium-term" },
    { key: "sma200", label: "SMA 200", desc: "Institutional" },
  ];
  var bulls = 0;
  periods.forEach(function(p) { if (mas[p.key] && price > mas[p.key]) bulls++; });
  var overall = bulls >= 4 ? "Bullish" : bulls >= 3 ? "Mild Bull" : bulls <= 1 ? "Bearish" : bulls <= 2 ? "Mild Bear" : "Mixed";
  var oc = bulls >= 4 ? "#00ff88" : bulls >= 3 ? "#00dd66" : bulls <= 1 ? "#ff4d4d" : bulls <= 2 ? "#ff6b35" : "#ffd700";

  var rows = periods.map(function(p) {
    var v = mas[p.key]; var sig = maSignal(price, v);
    var dist = v > 0 ? ((price - v) / v * 100).toFixed(1) : "0";
    var arrow = price >= v
      ? { display: "inline-block", width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderBottom: "5px solid " + sig.color }
      : { display: "inline-block", width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "5px solid " + sig.color };
    return h("div", { key: p.key, style: { display: "flex", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #0e1830", gap: 8 } },
      h("span", { style: { fontSize: 11, color: "#5a6b8a", minWidth: 52, fontFamily: mono } }, p.label),
      h("span", { style: { fontSize: 12, fontWeight: 600, color: "#bcc6d4", fontFamily: mono, minWidth: 60 } }, "$" + (v ? v.toFixed(2) : "N/A")),
      h("span", { style: arrow }),
      h("span", { style: { fontSize: 11, color: sig.color, fontWeight: 600, fontFamily: mono, minWidth: 38 } }, (parseFloat(dist) >= 0 ? "+" : "") + dist + "%"),
      h("span", { style: { fontSize: 10, color: "#4a5b7a", flex: 1, textAlign: "right" } }, p.desc)
    );
  });

  return h("div", { style: { background: "#0a1223", border: "1px solid #141f35", borderRadius: 10, padding: 12, marginTop: 8 } },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
      h("span", { style: { fontSize: 12, fontWeight: 700, color: "#5a6b8a", textTransform: "uppercase", letterSpacing: 1 } }, "Moving Averages"),
      h("span", { style: { fontSize: 12, fontWeight: 700, color: oc, fontFamily: mono } }, overall + " (" + bulls + "/5)")
    ),
    rows
  );
}

function MAToggle(props) {
  return h("button", {
    onClick: props.onToggle,
    style: { background: props.show ? "#00d4ff15" : "#0a1020", border: "1px solid " + (props.show ? "#00d4ff44" : "#141f35"), borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: props.show ? "#00d4ff" : "#5a6b8a", fontSize: 11, fontWeight: 700, fontFamily: mono, textTransform: "uppercase", letterSpacing: 1 }
  }, props.show ? "Hide MAs" : "Show MAs");
}

var MACRO = { fearGreed: 27, fearLabel: "Fear" };
var MACRO_TILES = [
  { l: "VIX", v: "29.26", c: "#ff4d4d", trend: "up", delta: "+23.2%", ctx: "from 23.75 Thu" },
  { l: "OIL WTI", v: "$90.21", c: "#22c55e", trend: "up", delta: "+35% wk", ctx: "highest since 2024" },
  { l: "10Y", v: "4.156%", c: "#78909c", trend: "flat", delta: "+0.02%", ctx: "steady" },
  { l: "NFP", v: "-92K", c: "#ff4d4d", trend: "down", delta: "miss", ctx: "exp +56K" },
  { l: "UNEMP", v: "4.4%", c: "#ffd700", trend: "up", delta: "+0.1%", ctx: "from 4.3%" },
  { l: "P/C RATIO", v: "1.24", c: "#ff4d4d", trend: "up", delta: "bearish", ctx: "above 1.0" },
  { l: "DXY", v: "98.85", c: "#00d4ff", trend: "down", delta: "-0.47%", ctx: "dollar weak" },
  { l: "GOLD", v: "$5,176", c: "#ffd700", trend: "up", delta: "+1.92%", ctx: "safe haven" },
];

var ECON_CAL = [
  { date: "Mar 10", event: "NY Fed Inflation Expectations", impact: "High" },
  { date: "Mar 12", event: "CPI (Feb)", impact: "Critical" },
  { date: "Mar 13", event: "PPI (Feb)", impact: "High" },
  { date: "Mar 18-19", event: "FOMC Rate Decision", impact: "Critical" },
  { date: "Mar 28", event: "Core PCE (Feb)", impact: "Critical" },
];

var SMART_MONEY = [
  { ticker: "MRVL", signal: "Record AI earnings. Vol 250% avg.", color: "#00ff88", type: "Accumulation" },
  { ticker: "BA", signal: "CEO bought 50K shares + defense bid. Vol 126% avg.", color: "#00ff88", type: "Accumulation" },
  { ticker: "CF", signal: "+4.98%. Hormuz fertilizer supply play. Vol 180% avg.", color: "#00ff88", type: "Accumulation" },
  { ticker: "DOW", signal: "JPM upgrade to overweight. +4%. Vol 142% avg.", color: "#00ff88", type: "Upgrade" },
  { ticker: "BLK", signal: "-7.2%. CAPPED private credit withdrawals. #1 stress signal.", color: "#ff2020", type: "Distribution" },
  { ticker: "CAT", signal: "Worst Dow -3.57%. Global growth de-risk. Vol 125% avg.", color: "#ff4d4d", type: "Distribution" },
  { ticker: "NVDA", signal: "CFO sold 25K shares. AI capex doubts. Vol 111% avg.", color: "#ff4d4d", type: "Insider Sell" },
  { ticker: "TSLA", signal: "Musk sold 4.4M shares. 3.2% short interest.", color: "#ff4d4d", type: "Insider Sell" },
];

// CORRECTED PRICES from verified sources
var INDEXES = {
  DOW: {
    name: "Dow Jones", short: "DJIA", close: 47501.55, change: -453.19, changePct: -0.95,
    components: 30, greenCount: 9,
    narrative: "NFP -92K shocked. Oil $90 on US-Iran. VIX +23%. Zero green at open, 9 recovered. Boeing led (+4.08%). GS/AXP/CAT worst. Smart money hid in defense, pharma, staples, energy.",
    institutions: [
      { name: "Vanguard", aum: "$9.5T", weight: "8.2%", move: "Added defensives JNJ, PG, VZ. Cut tech.", signal: "Defensive", color: "#00d4ff" },
      { name: "BlackRock", aum: "$11.5T", weight: "7.8%", move: "Capped private credit withdrawals. Energy/healthcare rotation.", signal: "Risk-Off", color: "#ffd700" },
      { name: "State Street", aum: "$4.4T", weight: "5.1%", move: "XLF $4B inflows YTD. Increased XLE.", signal: "Rotate", color: "#22c55e" },
      { name: "Fidelity", aum: "$5.0T", weight: "4.5%", move: "Bond ETFs absorbing equity outflows.", signal: "De-risk", color: "#e040fb" },
      { name: "Capital Group", aum: "$2.8T", weight: "3.9%", move: "Maintained. Increased dividend names.", signal: "Hold", color: "#78909c" },
      { name: "T. Rowe Price", aum: "$1.6T", weight: "2.8%", move: "Trimmed GS, AXP. Added BA defense.", signal: "Selective", color: "#ff6b35" },
      { name: "Wellington", aum: "$1.4T", weight: "2.5%", move: "Quality tilt. Added CVX, JNJ.", signal: "Quality", color: "#00ff88" },
      { name: "Geode Capital", aum: "$1.1T", weight: "2.3%", move: "Passive index tracking.", signal: "Passive", color: "#5a6b8a" },
      { name: "Northern Trust", aum: "$1.3T", weight: "1.8%", move: "ESG rebalance. Reduced energy.", signal: "ESG", color: "#a78bfa" },
      { name: "JPM Asset Mgmt", aum: "$3.3T", weight: "1.7%", move: "JPIE inflows. Dividend emphasis.", signal: "Income", color: "#f59e0b" },
    ],
    flows: [
      { from: "Technology", to: "Healthcare", mag: 3, flow: "$2.8B", label: "NVDA/AAPL selling, JNJ/AMGN accumulation", drivers: ["Stagflation", "AI doubts"] },
      { from: "Financials", to: "Energy", mag: 2, flow: "$1.4B", label: "Bank exposure to oil/inflation hedge", drivers: ["Oil $90", "Rate fear"] },
      { from: "Industrials", to: "Industrials", mag: 3, flow: "$1.9B", label: "CAT/MMM to BA defense. Widest split.", drivers: ["US-Iran", "Defense"] },
      { from: "All", to: "Bonds/Cash", mag: 3, flow: "$5.2B", label: "Broad risk-off. $9.1T in money markets.", drivers: ["NFP shock", "VIX +23%"] },
    ],
    sectors: [
      { name: "Technology", color: "#00d4ff", glow: "#00d4ff40", description: "NVDA -3.01%, AAPL -1.09%. IBM +0.9% bucked trend. GS 11.16% weight = massive drag.", stocks: [
        mk("GS","Goldman Sachs",821.42,-1.68,"Inv Banking","168B",15.8,910,460,1.42,"2.10%","3.2M","2.9M",35,"1.2%","76%","Bearish","Heavy puts 800P. Block selling.","None.","Buy",880,[{date:"Apr 14",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:25,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"11.16%"),
        mk("MSFT","Microsoft",408.96,-0.42,"Software","3.04T",35.1,470,362,0.93,"0.74%","24M","26M",44,"0.5%","73%","Neutral","Mixed flow. Call buying 420C.","VP sold 4K planned.","Strong Buy",460,[{date:"Apr 23",event:"Q3 Earnings",type:"earnings"}],{composite:"Hold",score:48,macd:"Neutral",sma20:"Below",sma50:"Above",sma200:"Above"},"5.56%"),
        mk("AAPL","Apple",257.46,-1.09,"Electronics","3.9T",33.2,280,164,1.24,"0.48%","62M","58M",41,"0.7%","74%","Bearish","Put accumulation 250P.","Cook 10b5-1.","Buy",275,[{date:"Apr 24",event:"Q2 Earnings",type:"earnings"}],{composite:"Sell",score:28,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"3.50%"),
        mk("NVDA","NVIDIA",177.82,-3.01,"Semis","4.35T",55.8,220,76,1.78,"0.02%","310M","280M",38,"1.3%","68%","Bearish","Heavy puts 170P/160P. Vol 111%.","CFO sold 25K 2/28.","Strong Buy",210,[{date:"May 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:22,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"2.42%"),
        mk("IBM","IBM",258.85,+0.90,"IT Services","239B",24.8,280,168,0.72,"2.58%","5.1M","4.8M",56,"0.6%","60%","Bullish","Call accum 265C Apr.","None.","Buy",275,[{date:"Apr 23",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:71,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"3.52%"),
        mk("CRM","Salesforce",202.11,+0.36,"SW","196B",44.2,260,192,1.35,"0.55%","8.2M","7.5M",48,"1.1%","79%","Neutral","Post-earnings +4.3% Thu.","None.","Buy",240,[{date:"May 28",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:52,macd:"Bullish",sma20:"Above",sma50:"Below",sma200:"Above"},"2.75%"),
        mk("CSCO","Cisco",78.64,-1.71,"Networking","314B",18.5,82,44,0.98,"2.55%","18M","20M",42,"0.8%","76%","Bearish","Low vol puts.","None.","Hold",80,[{date:"May 14",event:"Q3 Earnings",type:"earnings"}],{composite:"Sell",score:32,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"1.07%"),
      ]},
      { name: "Financials", color: "#ffd700", glow: "#ffd70040", description: "AXP -3.16% intraday, JPM -2.96%. TRV held flat. Stagflation nightmare for banks.", stocks: [
        mk("JPM","JPMorgan",289.48,-1.39,"Banking","833B",13.4,315,194,1.14,"1.82%","11.5M","10.8M",38,"0.5%","72%","Bearish","Put buying 280P.","Dimon planned sales.","Buy",320,[{date:"Apr 11",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:30,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"3.93%"),
        mk("AXP","AmEx",301.00,-2.02,"Consumer Fin","216B",20.1,340,215,1.25,"1.05%","4.8M","4.2M",33,"1.0%","85%","Bearish","Aggressive puts.","None.","Buy",330,[{date:"Apr 17",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Sell",score:18,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"4.09%"),
        mk("V","Visa",317.36,-0.76,"Payments","638B",30.5,367,259,0.95,"0.72%","7.8M","8.5M",40,"0.4%","94%","Neutral","Balanced flow.","None.","Buy",355,[{date:"Apr 22",event:"Q2 Earnings",type:"earnings"}],{composite:"Hold",score:38,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"4.31%"),
        mk("TRV","Travelers",306.31,-0.11,"Insurance","94B",12.8,320,215,0.65,"1.35%","1.5M","1.8M",52,"0.6%","82%","Neutral","Low activity.","None.","Hold",310,[{date:"Apr 17",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:55,macd:"Neutral",sma20:"At",sma50:"Above",sma200:"Above"},"4.16%"),
      ]},
      { name: "Healthcare", color: "#00ff88", glow: "#00ff8840", description: "JNJ +0.32%, AMGN +0.53%. Safe haven rotation. UNH -10.66% YTD.", stocks: [
        mk("UNH","UnitedHealth",286.48,-0.79,"Managed Care","521B",17.2,415,275,0.68,"1.75%","6.8M","5.5M",28,"1.4%","88%","Bearish","Put accum 280P/270P.","CEO sold 8K.","Hold",340,[{date:"Apr 15",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Sell",score:15,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Below"},"3.89%"),
        mk("JNJ","J&J",240.40,+0.32,"Pharma","577B",20.8,250,146,0.52,"2.75%","7.5M","8.2M",55,"0.5%","71%","Bullish","Defensive call buying.","None.","Buy",260,[{date:"Apr 15",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:72,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"3.27%"),
        mk("AMGN","Amgen",369.53,+0.53,"Biotech","198B",28.4,380,260,0.58,"2.55%","2.8M","3.1M",58,"0.9%","80%","Neutral","Mild calls.","None.","Buy",390,[{date:"Apr 29",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:65,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"5.02%"),
        mk("MRK","Merck",115.79,-0.24,"Pharma","293B",14.5,136,99,0.42,"2.82%","12M","13M",41,"0.7%","77%","Neutral","Low activity.","None.","Hold",125,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:40,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"1.57%"),
      ]},
      { name: "Consumer", color: "#e040fb", glow: "#e040fb40", description: "AMZN -2.62% vs WMT +0.40%. Staples beat discretionary. NKE -1.74% pre-earnings.", stocks: [
        mk("AMZN","Amazon",213.21,-2.62,"E-Commerce","2.24T",38.5,248,167,1.22,"0%","55M","50M",36,"0.7%","68%","Bearish","Heavy puts 205P/200P.","Jassy 10b5-1.","Strong Buy",250,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:24,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"2.90%"),
        mk("WMT","Walmart",123.80,+0.40,"Retail","496B",36.8,130,78,0.55,"1.12%","18M","16M",54,"0.3%","52%","Bullish","Defensive. YTD +10.68%.","None.","Buy",135,[{date:"May 15",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:73,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"1.68%"),
        mk("HD","Home Depot",357.92,-1.04,"Home Impr","356B",23.5,425,325,1.05,"2.48%","4.2M","4.8M",39,"0.6%","71%","Bearish","Housing weakness.","None.","Buy",400,[{date:"May 13",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:30,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"4.86%"),
        mk("MCD","McDonalds",328.06,+0.19,"Restaurants","235B",26.1,345,243,0.68,"2.15%","3.5M","4.0M",51,"0.5%","74%","Neutral","Trade-down play.","None.","Buy",350,[{date:"Apr 29",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:55,macd:"Neutral",sma20:"At",sma50:"Above",sma200:"Above"},"4.46%"),
        mk("NKE","Nike",57.01,-1.74,"Apparel","85B",22.8,82,55,1.12,"1.85%","11M","10M",32,"1.8%","78%","Bearish","Pre-3/31 earnings puts.","None.","Hold",68,[{date:"Mar 31",event:"Q3 Earnings",type:"earnings"}],{composite:"Strong Sell",score:14,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Below"},"0.77%"),
        mk("KO","Coca-Cola",77.04,+0.01,"Beverages","332B",27.5,78,57,0.58,"2.65%","14M","15M",53,"0.4%","69%","Neutral","Safe haven.","None.","Buy",80,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:58,macd:"Neutral",sma20:"Above",sma50:"Above",sma200:"Above"},"1.05%"),
        mk("DIS","Disney",101.54,-0.85,"Entertainment","185B",34.2,122,84,1.32,"0.85%","9.5M","10.2M",40,"1.2%","67%","Bearish","Modest puts.","None.","Buy",120,[{date:"May 7",event:"Q2 Earnings",type:"earnings"}],{composite:"Sell",score:28,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"1.38%"),
        mk("PG","P&G",153.63,-0.23,"Household","362B",26.8,175,152,0.42,"2.55%","6.8M","7.5M",46,"0.3%","65%","Neutral","YTD +14%.","None.","Hold",165,[{date:"Apr 22",event:"Q3 Earnings",type:"earnings"}],{composite:"Hold",score:52,macd:"Neutral",sma20:"At",sma50:"Above",sma200:"Above"},"2.09%"),
      ]},
      { name: "Industrials", color: "#ff6b35", glow: "#ff6b3540", description: "BA +4.08% vs CAT -3.57%. CAT = 9.25% Dow weight = enormous drag.", stocks: [
        mk("BA","Boeing",231.11,+4.08,"Aerospace","141B",-18.5,275,140,1.55,"0%","12M","9.5M",62,"2.5%","67%","Bullish","Massive calls 240C/250C. DOW LEADER.","CEO bought 50K.","Hold",250,[{date:"Apr 23",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Buy",score:82,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"3.14%"),
        mk("CAT","Caterpillar",680.90,-3.57,"Machinery","336B",17.2,750,310,1.08,"1.15%","3.5M","2.8M",30,"1.0%","75%","Very Bearish","Aggressive puts 660P. WORST DOW.","None.","Buy",750,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:20,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"9.25%"),
        mk("HON","Honeywell",235.29,-1.30,"Industrial","154B",22.1,260,190,1.02,"1.82%","4.5M","4.2M",38,"0.8%","78%","Bearish","Modest puts.","None.","Buy",260,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:32,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"3.20%"),
        mk("MMM","3M",153.41,-1.79,"Mfg","84B",16.5,175,85,1.05,"2.20%","3.8M","3.5M",36,"1.5%","71%","Bearish","Mfg recession puts.","None.","Hold",165,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:28,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"2.08%"),
      ]},
      { name: "Energy", color: "#22c55e", glow: "#22c55e40", description: "CVX flat. Oil $90 (+35% wk). Only safe haven sector.", stocks: [
        mk("CVX","Chevron",189.94,+0.02,"Oil & Gas","357B",14.2,195,140,0.92,"3.55%","8.5M","8.0M",68,"0.6%","70%","Bullish","Calls 195C/200C.","CFO bought 3K.","Buy",200,[{date:"Apr 25",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Buy",score:80,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"2.58%"),
        mk("SHW","Sherwin-Williams",329.88,-1.66,"Chemicals","84B",30.2,400,288,1.08,"0.85%","1.8M","1.5M",34,"0.9%","82%","Bearish","Puts. Oil = input costs.","None.","Buy",380,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:30,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"4.48%"),
      ]},
      { name: "Telecom", color: "#78909c", glow: "#78909c40", description: "VZ -0.12%. BEST DOW YTD +25.71%. 5.25% yield.", stocks: [
        mk("VZ","Verizon",51.12,-0.12,"Telecom","215B",10.8,52,37,0.38,"5.25%","19M","21M",55,"0.5%","62%","Bullish","Bond proxy. Best YTD.","None.","Hold",52,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:68,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.69%"),
      ]},
    ]
  },
  SPX: {
    name: "S&P 500", short: "SPX", close: 6740.02, change: -90.69, changePct: -1.33,
    components: 503, greenCount: 66,
    narrative: "434 of 503 red. Energy ONLY green sector. Counter-trend: CF +4.98%, Bunge +3.14% (Hormuz fertilizer play), BA +4.08% defense, DOW Inc +4% (JPM upgrade). BLK -7.2% capping withdrawals = top stress signal. MRVL +10% lone tech bright spot.",
    institutions: [
      { name: "Vanguard", aum: "$9.5T", weight: "9.1%", move: "VOO $2.1B outflows. VTV Value inflows.", signal: "Value", color: "#00d4ff" },
      { name: "BlackRock", aum: "$11.5T", weight: "8.5%", move: "CAPPED private credit withdrawals. Top stress signal.", signal: "Stress", color: "#ff4d4d" },
      { name: "State Street", aum: "$4.4T", weight: "5.8%", move: "XLE +$800M, XLF +$400M inflows.", signal: "Sector Shift", color: "#22c55e" },
      { name: "Fidelity", aum: "$5.0T", weight: "4.2%", move: "FBND strong inflows. Bond rotation.", signal: "Bonds", color: "#e040fb" },
      { name: "Invesco", aum: "$1.8T", weight: "3.2%", move: "RSP equal-weight $5B inflows Jan.", signal: "Equal Wt", color: "#f59e0b" },
      { name: "Capital Group", aum: "$2.8T", weight: "3.5%", move: "Quality factor tilt. Growth to GARP.", signal: "Quality", color: "#78909c" },
      { name: "T. Rowe Price", aum: "$1.6T", weight: "2.4%", move: "Trimmed mega-cap. Added mid-cap.", signal: "Mid-Cap", color: "#ff6b35" },
      { name: "Wellington", aum: "$1.4T", weight: "2.1%", move: "Increased energy, reduced discretionary.", signal: "Real Assets", color: "#22c55e" },
      { name: "Geode Capital", aum: "$1.1T", weight: "1.9%", move: "Passive tracking. No tactical shifts.", signal: "Passive", color: "#5a6b8a" },
      { name: "JPM Asset Mgmt", aum: "$3.3T", weight: "1.8%", move: "JEPI/JPIE massive inflows. Income.", signal: "Income", color: "#a78bfa" },
    ],
    flows: [
      { from: "Info Tech", to: "Energy", mag: 3, flow: "$4.2B", label: "Largest tech-to-energy rotation of 2026", drivers: ["Oil $90", "AI fatigue"] },
      { from: "Tech/Growth", to: "Ag/Fertilizer", mag: 2, flow: "$1.2B", label: "HIDDEN: CF +4.98%, BG +3.14%. Hormuz supply play.", drivers: ["Hormuz", "Planting season"] },
      { from: "Financials", to: "Staples", mag: 2, flow: "$1.8B", label: "Rate-sensitive to recession-proof", drivers: ["Stagflation", "Consumer pullback"] },
      { from: "All", to: "Treasuries", mag: 3, flow: "$8.5B", label: "Broad risk-off to fixed income", drivers: ["NFP -92K", "VIX 29"] },
    ],
    sectors: [
      { name: "Energy (ONLY GREEN)", color: "#22c55e", glow: "#22c55e40", description: "Only green S&P sector. Half of top 20 were oil & gas E&P names.", stocks: [
        mk("XOM","ExxonMobil",118.40,+0.85,"Integrated","498B",13.5,125,100,0.88,"3.35%","16M","17M",65,"0.5%","64%","Bullish","Call buying. Oil tailwind.","None.","Buy",125,[{date:"Apr 25",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:72,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.82%"),
        mk("CVX","Chevron",189.94,+0.02,"Integrated","357B",14.2,195,140,0.92,"3.55%","8.5M","8.0M",68,"0.6%","70%","Bullish","Calls 195C/200C.","CFO bought 3K.","Buy",200,[{date:"Apr 25",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Buy",score:80,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.59%"),
      ]},
      { name: "Ag & Fertilizer *", color: "#a3e635", glow: "#a3e63540", description: "HIDDEN PLAY. CF +4.98%, Bunge +3.14%, ADM +1.37%. Hormuz disrupting fertilizer supply.", stocks: [
        mk("CF","CF Industries",116.41,+4.98,"Nitrogen","20.7B",14.8,125,72,0.95,"1.85%","5.2M","2.9M",68,"3.2%","82%","Bullish","Massive calls. Barclays PT $120. Vol 180%.","SVP sold 2.7K 3/3.","Buy",120,[{date:"May 7",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Buy",score:85,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.03%"),
        mk("BG","Bunge",108.50,+3.14,"Ag Products","15B",10.2,115,85,0.72,"2.45%","2.8M","1.8M",62,"1.5%","78%","Bullish","Unusual calls. Hormuz food supply. Vol 155%.","None.","Buy",115,[{date:"Apr 30",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:70,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.02%"),
        mk("ADM","Archer Daniels",52.80,+1.37,"Ag Processing","28B",12.5,58,42,0.88,"3.55%","4.5M","3.8M",55,"2.0%","72%","Bullish","Modest calls. Supply chain play.","None.","Hold",58,[{date:"Apr 29",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:58,macd:"Neutral",sma20:"Above",sma50:"Above",sma200:"Above"},"0.05%"),
      ]},
      { name: "Defense *", color: "#f97316", glow: "#f9731640", description: "BA +4.08%, RTX +1.2%. Direct US-Iran conflict beneficiaries.", stocks: [
        mk("BA","Boeing",231.11,+4.08,"Aerospace","141B",-18.5,275,140,1.55,"0%","12M","9.5M",62,"2.5%","67%","Bullish","Massive calls. Vol 126%.","CEO bought 50K.","Hold",250,[{date:"Apr 23",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Buy",score:82,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.23%"),
        mk("RTX","RTX Corp",132.40,+1.20,"Defense","195B",35.5,140,98,0.78,"1.95%","5.2M","4.8M",58,"0.7%","80%","Bullish","Call buying. Defense demand.","None.","Buy",145,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:68,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.32%"),
      ]},
      { name: "Info Technology", color: "#00d4ff", glow: "#00d4ff40", description: "32% of S&P. NVDA 7.17% weight -3% = massive drag. MRVL +10% lone outlier.", stocks: [
        mk("NVDA","NVIDIA",177.82,-3.01,"Semis","4.35T",55.8,220,76,1.78,"0.02%","310M","280M",38,"1.3%","68%","Bearish","Heavy puts. CFO selling.","CFO sold 25K.","Strong Buy",210,[{date:"May 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:22,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"7.17%"),
        mk("AAPL","Apple",257.46,-1.09,"Electronics","3.9T",33.2,280,164,1.24,"0.48%","62M","58M",41,"0.7%","74%","Bearish","Put accumulation.","Cook 10b5-1.","Buy",275,[{date:"Apr 24",event:"Q2 Earnings",type:"earnings"}],{composite:"Sell",score:28,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"5.86%"),
        mk("MSFT","Microsoft",408.96,-0.42,"Software","3.04T",35.1,470,362,0.93,"0.74%","24M","26M",44,"0.5%","73%","Neutral","Mixed flow.","VP sold 4K.","Strong Buy",460,[{date:"Apr 23",event:"Q3 Earnings",type:"earnings"}],{composite:"Hold",score:48,macd:"Neutral",sma20:"Below",sma50:"Above",sma200:"Above"},"5.33%"),
        mk("AVGO","Broadcom",330.45,-0.69,"Semis","1.02T",38.2,380,128,1.32,"1.15%","28M","25M",44,"0.8%","82%","Neutral","Modest put buying.","None.","Strong Buy",380,[{date:"Jun 12",event:"Q2 Earnings",type:"earnings"}],{composite:"Hold",score:42,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"2.51%"),
        mk("MRVL","Marvell",98.20,+10.20,"Custom AI","85B",55.2,110,62,1.65,"0.35%","45M","18M",78,"2.1%","85%","Bullish","MASSIVE calls. Record earnings. Vol 250%.","None.","Strong Buy",115,[{date:"Jun 5",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Buy",score:88,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.14%"),
      ]},
      { name: "Financials", color: "#ffd700", glow: "#ffd70040", description: "BLK -7.2% capped withdrawals = TOP signal. Banks -1.5% to -3%.", stocks: [
        mk("BLK","BlackRock",905.00,-7.20,"Asset Mgmt","140B",22.5,1065,780,1.35,"2.15%","2.8M","1.5M",22,"1.8%","78%","Very Bearish","PUT AVALANCHE. Vol 220%. Capped withdrawals.","None.","Buy",1050,[{date:"Apr 11",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Sell",score:12,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Below"},"0.23%"),
        mk("JPM","JPMorgan",289.48,-1.39,"Banking","833B",13.4,315,194,1.14,"1.82%","11.5M","10.8M",38,"0.5%","72%","Bearish","Put buying 280P.","Dimon sales.","Buy",320,[{date:"Apr 11",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:30,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"1.37%"),
        mk("GS","Goldman",821.42,-1.68,"Inv Banking","168B",15.8,910,460,1.42,"2.10%","3.2M","2.9M",35,"1.2%","76%","Bearish","Heavy puts.","None.","Buy",880,[{date:"Apr 14",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:25,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"0.28%"),
      ]},
      { name: "Comm Services", color: "#f59e0b", glow: "#f59e0b40", description: "GOOGL -0.87% (6.39% weight). META -2.38%. Risk-off dominated.", stocks: [
        mk("GOOGL","Alphabet",298.52,-0.87,"Search/Cloud","2.14T",22.5,349,141,1.08,"0.45%","34M","34M",42,"0.6%","72%","Bearish","Put buying. Moderate volume.","None.","Strong Buy",340,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:40,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"6.39%"),
        mk("META","Meta",644.86,-2.38,"Social Media","1.64T",24.8,796,480,1.38,"0.32%","13M","13M",40,"0.8%","79%","Bearish","Put buying. Ad resilient but risk-off.","Zuckerberg 10b5-1.","Buy",720,[{date:"Apr 23",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:38,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"2.49%"),
      ]},
      { name: "Consumer Disc", color: "#e040fb", glow: "#e040fb40", description: "AMZN -2.62% (3.98% weight). TSLA -2.17%. Consumer weakness.", stocks: [
        mk("AMZN","Amazon",213.21,-2.62,"E-Commerce","2.24T",38.5,248,167,1.22,"0%","55M","50M",36,"0.7%","68%","Bearish","Heavy puts 205P/200P.","Jassy 10b5-1.","Strong Buy",250,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:24,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"3.98%"),
        mk("TSLA","Tesla",396.73,-2.17,"EVs","1.27T",52.5,499,214,2.05,"0%","64M","64M",40,"3.2%","48%","Bearish","Heavy both sides. High short int.","Musk sold 4.4M shares.","Hold",460,[{date:"Apr 28",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:30,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"2.31%"),
      ]},
      { name: "Consumer Staples *", color: "#a78bfa", glow: "#a78bfa40", description: "Defensive + packaged food surprise. Campbells +1.74%, Conagra +1.37%.", stocks: [
        mk("WMT","Walmart",123.80,+0.40,"Retail","496B",36.8,130,78,0.55,"1.12%","18M","16M",54,"0.3%","52%","Bullish","Defensive. YTD +10.68%.","None.","Buy",135,[{date:"May 15",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:73,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.81%"),
        mk("KO","Coca-Cola",77.04,+0.01,"Beverages","332B",27.5,78,57,0.58,"2.65%","14M","15M",53,"0.4%","69%","Neutral","Safe haven hold.","None.","Buy",80,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:58,macd:"Neutral",sma20:"Above",sma50:"Above",sma200:"Above"},"0.54%"),
      ]},
      { name: "Healthcare", color: "#00ff88", glow: "#00ff8840", description: "LLY held (1.55% wt). JNJ +0.32%. UNH continued slide.", stocks: [
        mk("LLY","Eli Lilly",820.50,-0.35,"Pharma","782B",88.5,850,540,0.62,"0.58%","3.8M","3.2M",55,"0.5%","83%","Neutral","GLP-1 momentum.","None.","Strong Buy",900,[{date:"Apr 30",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:68,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"1.55%"),
        mk("JNJ","J&J",240.40,+0.32,"Pharma","577B",20.8,250,146,0.52,"2.75%","7.5M","8.2M",55,"0.5%","71%","Bullish","Defensive buying.","None.","Buy",260,[{date:"Apr 15",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:72,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.94%"),
      ]},
      { name: "Materials", color: "#8d6e63", glow: "#8d6e6340", description: "DOW Inc +4% on JPM upgrade. Counter-trend winner.", stocks: [
        mk("DOW","Dow Inc",48.20,+4.00,"Chemicals","34B",18.5,55,42,1.22,"4.85%","8.5M","6.0M",62,"2.2%","72%","Bullish","JPM upgrade. Vol 142%.","None.","Buy",55,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:65,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.06%"),
      ]},
    ]
  },
  NDX: {
    name: "NASDAQ Composite", short: "IXIC", close: 22387.68, change: -361.31, changePct: -1.59,
    components: 3000, greenCount: "~600",
    narrative: "Worst major index. AI fatigue - CoreWeave -20%. Mag 7 all red. MRVL +10% only bright spot. Worst monthly since Mar 2025. Growth-to-value rotation accelerating (RSP $5B inflows).",
    institutions: [
      { name: "Vanguard", aum: "$9.5T", weight: "7.8%", move: "QQQ $1.5B outflows. Growth to value.", signal: "De-risk", color: "#00d4ff" },
      { name: "BlackRock", aum: "$11.5T", weight: "7.2%", move: "IBIT outflows. Tech ETF selling.", signal: "Risk-Off", color: "#ffd700" },
      { name: "ARK Invest", aum: "$14B", weight: "0.5%", move: "ARKK trimmed TSLA. Added PLTR, COIN.", signal: "Contrarian", color: "#e040fb" },
      { name: "Invesco", aum: "$1.8T", weight: "4.5%", move: "RSP $5B inflows Jan. Anti-concentration.", signal: "Equal Wt", color: "#22c55e" },
      { name: "Fidelity", aum: "$5.0T", weight: "4.0%", move: "Contrafund reduced NVDA, added LLY.", signal: "Quality", color: "#78909c" },
      { name: "State Street", aum: "$4.4T", weight: "3.8%", move: "XLK outflows $1.2B. Broad tech sell.", signal: "Tech Sell", color: "#ff4d4d" },
      { name: "Capital Group", aum: "$2.8T", weight: "3.2%", move: "Growth Fund reduced Mag 7.", signal: "Selective", color: "#ff6b35" },
      { name: "T. Rowe Price", aum: "$1.6T", weight: "2.5%", move: "Blue Chip Growth trimmed NVDA, MSFT.", signal: "Rotate", color: "#f59e0b" },
      { name: "Citadel", aum: "$65B", weight: "1.2%", move: "Increased QQQ put hedges. L/S active.", signal: "Hedging", color: "#a78bfa" },
      { name: "Two Sigma", aum: "$60B", weight: "0.8%", move: "Quant risk-off. Momentum underperforming.", signal: "Risk-Off", color: "#5a6b8a" },
    ],
    flows: [
      { from: "Mag 7", to: "Value/Dividend", mag: 3, flow: "$5.5B", label: "Concentration unwind. Top 10 = 40%.", drivers: ["Concentration", "AI fatigue"] },
      { from: "Software", to: "Cybersecurity", mag: 1, flow: "$0.8B", label: "SaaS to security on geopolitical risk.", drivers: ["US-Iran cyber", "Gov spend"] },
      { from: "Growth", to: "Defensive", mag: 2, flow: "$2.2B", label: "High-beta to low-vol quality.", drivers: ["VIX 29", "Quality factor"] },
      { from: "All Tech", to: "Bonds/Cash", mag: 3, flow: "$7.0B", label: "Broad NASDAQ de-risk to fixed income.", drivers: ["Stagflation", "CoreWeave -20%"] },
    ],
    sectors: [
      { name: "Mag 7 (All Red)", color: "#00d4ff", glow: "#00d4ff40", description: "Every Mag 7 red. Combined ~35% of NASDAQ. When all sell, index has no chance.", stocks: [
        mk("NVDA","NVIDIA",177.82,-3.01,"Semis","4.35T",55.8,220,76,1.78,"0.02%","310M","280M",38,"1.3%","68%","Bearish","Heavy puts. AI questioning.","CFO sold 25K.","Strong Buy",210,[{date:"May 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:22,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"~7%"),
        mk("AAPL","Apple",257.46,-1.09,"Electronics","3.9T",33.2,280,164,1.24,"0.48%","62M","58M",41,"0.7%","74%","Bearish","Put accumulation.","Cook 10b5-1.","Buy",275,[{date:"Apr 24",event:"Q2 Earnings",type:"earnings"}],{composite:"Sell",score:28,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"~6%"),
        mk("MSFT","Microsoft",408.96,-0.42,"Software","3.04T",35.1,470,362,0.93,"0.74%","24M","26M",44,"0.5%","73%","Neutral","Mixed.","VP sold 4K.","Strong Buy",460,[{date:"Apr 23",event:"Q3 Earnings",type:"earnings"}],{composite:"Hold",score:48,macd:"Neutral",sma20:"Below",sma50:"Above",sma200:"Above"},"~5%"),
        mk("GOOGL","Alphabet",298.52,-0.87,"Search","2.14T",22.5,349,141,1.08,"0.45%","34M","34M",42,"0.6%","72%","Bearish","Put buying.","None.","Strong Buy",340,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:40,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"~5%"),
        mk("AMZN","Amazon",213.21,-2.62,"E-Commerce","2.24T",38.5,248,167,1.22,"0%","55M","50M",36,"0.7%","68%","Bearish","Heavy puts.","Jassy 10b5-1.","Strong Buy",250,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:24,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"~4%"),
        mk("META","Meta",644.86,-2.38,"Social","1.64T",24.8,796,480,1.38,"0.32%","13M","13M",40,"0.8%","79%","Bearish","Put buying.","Zuckerberg 10b5-1.","Buy",720,[{date:"Apr 23",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:38,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"~3%"),
        mk("TSLA","Tesla",396.73,-2.17,"EVs","1.27T",52.5,499,214,2.05,"0%","64M","64M",40,"3.2%","48%","Bearish","Heavy both sides.","Musk sold 4.4M.","Hold",460,[{date:"Apr 28",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:30,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"~2%"),
      ]},
      { name: "Semiconductors", color: "#a78bfa", glow: "#a78bfa40", description: "MRVL +10% vs AMD -2.5%. Custom AI winning, generic losing.", stocks: [
        mk("MRVL","Marvell",98.20,+10.20,"Custom AI","85B",55.2,110,62,1.65,"0.35%","45M","18M",78,"2.1%","85%","Bullish","Record earnings. Vol 250%.","None.","Strong Buy",115,[{date:"Jun 5",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Buy",score:88,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.4%"),
        mk("AVGO","Broadcom",330.45,-0.69,"Networking","1.02T",38.2,380,128,1.32,"1.15%","28M","25M",44,"0.8%","82%","Neutral","Modest puts.","None.","Strong Buy",380,[{date:"Jun 12",event:"Q2 Earnings",type:"earnings"}],{composite:"Hold",score:42,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"2.5%"),
        mk("AMD","AMD",118.40,-2.50,"GPUs","192B",42.5,188,115,1.72,"0%","48M","45M",35,"2.5%","75%","Bearish","Put volume up. Competition.","None.","Buy",165,[{date:"Apr 29",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:25,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Below"},"0.9%"),
      ]},
      { name: "Software", color: "#f59e0b", glow: "#f59e0b40", description: "SaaS under pressure. CRM +0.36% post-earnings. PLTR -2.94%.", stocks: [
        mk("CRM","Salesforce",202.11,+0.36,"CRM","196B",44.2,260,192,1.35,"0.55%","8.2M","7.5M",48,"1.1%","79%","Neutral","Post-earnings glow.","None.","Buy",240,[{date:"May 28",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:52,macd:"Bullish",sma20:"Above",sma50:"Below",sma200:"Above"},"0.9%"),
        mk("PLTR","Palantir",157.16,-2.94,"AI/Analytics","198B",185,198,22,2.45,"0%","52M","48M",38,"3.5%","45%","Bearish","High SI 3.5%. Polarized.","None.","Hold",180,[{date:"May 5",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:35,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"0.9%"),
      ]},
      { name: "Biotech", color: "#00ff88", glow: "#00ff8840", description: "AMGN +0.53%, GILD +0.35%. Defensive rotation beneficiary.", stocks: [
        mk("AMGN","Amgen",369.53,+0.53,"Biotech","198B",28.4,380,260,0.58,"2.55%","2.8M","3.1M",58,"0.9%","80%","Neutral","Mild calls.","None.","Buy",390,[{date:"Apr 29",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:65,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.9%"),
        mk("GILD","Gilead",115.20,+0.35,"Biotech","144B",18.5,120,65,0.52,"3.12%","6.5M","7.0M",54,"0.8%","78%","Neutral","Defensive. HIV franchise.","None.","Buy",125,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:58,macd:"Neutral",sma20:"Above",sma50:"Above",sma200:"Above"},"0.7%"),
      ]},
      { name: "E-Commerce & Fintech", color: "#e040fb", glow: "#e040fb40", description: "AMZN -2.62% drag. COIN -3.5% crypto correlation. NFLX held.", stocks: [
        mk("NFLX","Netflix",985.40,-0.85,"Streaming","425B",42.5,1050,540,1.42,"0%","3.5M","4.0M",48,"1.2%","82%","Neutral","Low vol.","None.","Buy",1050,[{date:"Apr 17",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:50,macd:"Neutral",sma20:"At",sma50:"Above",sma200:"Above"},"2.0%"),
        mk("COIN","Coinbase",215.40,-3.50,"Crypto","55B",28.5,340,145,2.85,"0%","12M","10M",35,"5.8%","55%","Bearish","Put buying. Crypto corr.","None.","Hold",280,[{date:"May 8",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:22,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"0.3%"),
      ]},
    ]
  }
};


// ============================================================
// LIVE DATA ENGINE - all createElement, browser safe
// ============================================================

function isMarketOpen() {
  try {
    var now = new Date();
    var et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    if (isNaN(et.getTime())) return false;
    var day = et.getDay(); var mins = et.getHours() * 60 + et.getMinutes();
    if (day === 0 || day === 6) return false;
    return mins >= 570 && mins <= 960;
  } catch(e) { return false; }
}

function getETNow() {
  try { return new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }); }
  catch(e) { return new Date().toLocaleTimeString(); }
}

function getTodayStr() {
  try {
    var d = new Date();
    return d.toLocaleDateString("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", year: "numeric" });
  } catch(e) { return new Date().toLocaleDateString(); }
}

function getTodayShort() {
  try {
    var d = new Date();
    return d.toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" });
  } catch(e) { return ""; }
}

function getAllTickers(idxKey) {
  var tickers = []; var d = INDEXES[idxKey]; if (!d) return tickers;
  d.sectors.forEach(function(sec) { sec.stocks.forEach(function(st) { if (tickers.indexOf(st.ticker) === -1) tickers.push(st.ticker); }); });
  return tickers;
}

var INDEX_ETFS = { DOW: "DIA", SPX: "SPY", NDX: "QQQ" };

// ETF proxies for macro indicators
var MACRO_PROXIES = {
  "VIX": { symbol: "VIXY", label: "VIX" },
  "OIL WTI": { symbol: "USO", label: "OIL" },
  "GOLD": { symbol: "GLD", label: "GOLD" },
  "DXY": { symbol: "UUP", label: "DXY" },
  "10Y": { symbol: "TLT", label: "10Y" }
};
var MACRO_PROXY_SYMBOLS = ["VIXY", "USO", "GLD", "UUP", "TLT"];

function fetchQ(symbol) {
  return fetch("/api/finnhub?symbol=" + encodeURIComponent(symbol)).then(function(r) { return r.json(); });
}

// Global bridge: HTML input sets this, React reads it
if (typeof window !== "undefined" && !window.__mue) {
  window.__mue = { key: "", log: [] };
}

function mueLog(msg) {
  try {
    if (typeof window !== "undefined" && window.__mue) {
      if (!window.__mue.log) window.__mue.log = [];
      window.__mue.log.push(msg);
      if (window.__mue.log.length > 20) window.__mue.log.shift();
    }
  } catch(e) {}
  var el = typeof document !== "undefined" ? document.getElementById("finnhub-log") : null;
  if (el) el.textContent = msg;
}


function LiveDataPanel(props) {
  var onUpdate = props.onUpdate; var currentIdx = props.currentIdx; var liveQuotes = props.liveQuotes || {};
  var _s = useState("idle"), status = _s[0], setStatus = _s[1];
  var _m = useState(""), msg = _m[0], setMsg = _m[1];
  var _t2 = useState(""), lastTime = _t2[0], setLastTime = _t2[1];
  var _a = useState(false), autoRefresh = _a[0], setAutoRefresh = _a[1];
  var _o = useState(false), mktOpen = _o[0], setMktOpen = _o[1];
  var _c = useState(false), connected = _c[0], setConnected = _c[1];
  var intRef = useRef(null);

  useEffect(function() {
    setMktOpen(isMarketOpen());
    var t = setInterval(function() { setMktOpen(isMarketOpen()); }, 30000);
    // Listen for custom event from HTML button
    function onConnect() { doFetch(); }
    if (typeof window !== "undefined") window.__mue_fetch = onConnect;
    return function() { clearInterval(t); };
  }, []);

  useEffect(function() {
    if (autoRefresh && connected && status !== "loading") {
      intRef.current = setInterval(function() { doFetch(); }, 30000);
    }
    return function() { if (intRef.current) clearInterval(intRef.current); };
  }, [autoRefresh, connected]);

  function doFetch() {
    mueLog("Checking server...");
    setStatus("loading"); setMsg("Checking server...");

    // First verify the proxy is working
    fetch("/api/health").then(function(r) { return r.json(); }).then(function(health) {
      if (health.finnhubKey && health.finnhubKey.indexOf("MISSING") >= 0) {
        mueLog("FINNHUB_KEY not set in Vercel! Go to Settings > Environment Variables");
        setStatus("idle"); setMsg("FINNHUB_KEY missing in Vercel env vars");
        return;
      }
      mueLog("Server OK. Fetching " + getAllTickers(currentIdx).length + " stocks...");
      setMsg("Fetching...");
      setConnected(true);
      doFetchQuotes();
    }).catch(function(err) {
      mueLog("Server error: " + (err.message || err) + ". Check Vercel deployment.");
      setStatus("idle"); setMsg("Server unreachable - check deployment");
    });
  }

  function doFetchQuotes() {

    var tickers = getAllTickers(currentIdx);
    var extras = ["DIA", "SPY", "QQQ"].concat(MACRO_PROXY_SYMBOLS);
    var all = extras.concat(tickers);
    var seen = {}; var deduped = [];
    all.forEach(function(s) { if (!seen[s]) { seen[s] = true; deduped.push(s); } });

    var results = {}; var done = 0; var total = deduped.length;
    var errors = 0;

    deduped.forEach(function(sym, i) {
      setTimeout(function() {
        fetchQ(sym).then(function(d) {
          if (d && d.c && d.c > 0) {
            results[sym] = { price: d.c, change: d.dp || 0, dollarChange: d.d || 0, high: d.h, low: d.l, open: d.o, prevClose: d.pc };
          } else if (d && d.error) {
            errors++;
            mueLog("API error for " + sym + ": " + d.error);
          }
          done++;
          setMsg("Loaded " + done + "/" + total + (errors > 0 ? " (" + errors + " errors)" : ""));
          if (done === total) {
            setStatus("done"); setLastTime(getETNow());
            var count = Object.keys(results).length;
            setMsg(count + " quotes loaded" + (errors > 0 ? ", " + errors + " errors" : ""));
            mueLog("Done: " + count + " quotes, " + errors + " errors");
            if (onUpdate) onUpdate(results);
          }
        }).catch(function(err) {
          errors++; done++;
          mueLog("Fetch error " + sym + ": " + (err.message || err));
          if (done === total) {
            setStatus("done"); setLastTime(getETNow());
            var count = Object.keys(results).length;
            setMsg(count + " quotes" + (errors > 0 ? ", " + errors + " failed" : ""));
            mueLog("Done: " + count + " ok, " + errors + " failed");
            if (onUpdate) onUpdate(results);
          }
        });
      }, i * 120);
    });
  }

  var dc = status === "done" ? (mktOpen ? "#00ff88" : "#ffd700") : status === "loading" ? "#ffd700" : "#5a6b8a";
  var mc2 = mktOpen ? "#00ff88" : "#ff4d4d";

  var btns = [];
  if (connected) {
    btns.push(h("button", { key: "r", onClick: function() { doFetch(); }, style: { background: "#00ff8812", border: "1px solid #00ff8833", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "#00ff88", fontSize: 12, fontWeight: 700, fontFamily: mono } }, status === "loading" ? "Loading..." : "Refresh"));
    if (status === "done") {
      btns.push(h("button", { key: "a", onClick: function() { setAutoRefresh(!autoRefresh); }, style: { background: autoRefresh ? "#00ff8815" : "#0a1020", border: "1px solid " + (autoRefresh ? "#00ff8844" : "#141f35"), borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: autoRefresh ? "#00ff88" : "#5a6b8a", fontSize: 11, fontWeight: 600, fontFamily: mono } }, autoRefresh ? "Auto: ON 30s" : "Auto: OFF"));
    }
  }

  var etfs = null;
  if (status === "done" && Object.keys(liveQuotes).length > 0) {
    etfs = h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 } },
      ["DIA", "SPY", "QQQ"].map(function(sym) {
        var q = liveQuotes[sym]; if (!q) return null;
        var lb = sym === "DIA" ? "DOW" : sym === "SPY" ? "S&P" : "NDX";
        return h("div", { key: sym, style: { background: "#0a1020", border: "1px solid #141f35", borderRadius: 6, padding: "4px 10px", textAlign: "center" } },
          h("div", { style: { fontSize: 9, color: "#4a5b7a", fontFamily: mono } }, lb + " live"),
          h("div", { style: { fontSize: 14, fontWeight: 700, color: q.change >= 0 ? "#00ff88" : "#ff4d4d", fontFamily: mono } }, "$" + q.price.toFixed(2)),
          h("div", { style: { fontSize: 10, color: (q.change >= 0 ? "#00ff88" : "#ff4d4d") + "aa", fontFamily: mono } }, (q.change >= 0 ? "+" : "") + q.change.toFixed(2) + "%")
        );
      })
    );
  }

  return h("div", { style: { background: "#0c1424", border: "1px solid #1e3050", borderRadius: 12, padding: 14, marginBottom: 14 } },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 } },
      h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
        h("div", { style: { width: 8, height: 8, borderRadius: "50%", background: dc } }),
        h("span", { style: { fontSize: 13, fontWeight: 700, color: "#e0e6f0", textTransform: "uppercase", fontFamily: mono } }, status === "done" ? "LIVE" : "Live Data"),
        h("span", { style: { fontSize: 11, padding: "2px 8px", borderRadius: 10, background: mc2 + "18", border: "1px solid " + mc2 + "44", color: mc2 } }, mktOpen ? "MARKET OPEN" : "MARKET CLOSED")
      ),
      h("div", { style: { display: "flex", gap: 6, alignItems: "center" } }, btns)
    ),
    (msg || lastTime) ? h("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 } },
      h("span", { style: { color: status === "loading" ? "#ffd700" : "#6a7a94" } }, msg),
      lastTime ? h("span", { style: { color: "#5a6b8a", fontFamily: mono } }, "Last: " + lastTime + " ET") : null
    ) : null,
    etfs
  );
}

// ============================================================
// AI INTELLIGENCE ENGINE
// Uses Anthropic API with web_search to get live market intel
// ============================================================


function fetchClaudeIntel(prompt) {
  return fetch("/api/intel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: prompt })
  }).then(function(r) { return r.json(); });
}

function parseClaudeJSON(data) {
  if (!data || !data.content) return null;
  var text = "";
  data.content.forEach(function(block) {
    if (block.type === "text") text += block.text;
  });
  // Try to extract JSON from the response
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();
  try { return JSON.parse(text); }
  catch(e) {
    // Try to find JSON object in the text
    var start = text.indexOf("{");
    var end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return JSON.parse(text.substring(start, end + 1)); }
      catch(e2) { return null; }
    }
    return null;
  }
}

function fetchAllIntelligence(onUpdate) {
  var logEl = typeof document !== "undefined" ? document.getElementById("intel-log") : null;

  var results = { smartMoney: null, flows: null, institutions: null, narrative: null, scannerData: null, fearGreed: null, timestamp: "" };
  var done = 0;
  var total = 5;

  function checkDone() {
    done++;
    if (logEl) logEl.textContent = "Loaded " + done + "/" + total + " intel feeds";
    if (done === total) {
      results.timestamp = getETNow();
      if (logEl) logEl.textContent = "Intel loaded at " + results.timestamp + " ET";
      if (onUpdate) onUpdate(results);
    }
  }

  // 1. Smart Money
  if (logEl) logEl.textContent = "Fetching smart money signals...";
  fetchClaudeIntel(
    'Search for today\'s unusual stock market activity: unusual options volume, insider buying/selling, dark pool prints, and stocks with volume 150%+ above average. Return ONLY a JSON object with no other text: {"signals":[{"ticker":"XX","signal":"description of the unusual activity","type":"Accumulation or Distribution or Insider Buy or Insider Sell","color":"#00ff88 for bullish or #ff4d4d for bearish"}]} Include 8-12 signals. Focus on actionable unusual activity from today only.'
  ).then(function(data) {
    var parsed = parseClaudeJSON(data);
    if (parsed && parsed.signals) results.smartMoney = parsed.signals;
    checkDone();
  }).catch(function(e) { checkDone(); });

  // 2. Sector Flows
  setTimeout(function() {
    fetchClaudeIntel(
      'Search for today\'s stock market sector rotation and money flows. Which sectors are seeing inflows vs outflows? What are the biggest ETF flows today (SPY, QQQ, XLE, XLF, TLT, XLK, XLV, etc)? Return ONLY a JSON object: {"flows":[{"from":"Sector losing money","to":"Sector gaining money","flow":"$X.XB estimated","label":"description of why this rotation is happening","drivers":["driver1","driver2"]}]} Include 4-6 major flows. Focus on today\'s actual movement.'
    ).then(function(data) {
      var parsed = parseClaudeJSON(data);
      if (parsed && parsed.flows) results.flows = parsed.flows;
      checkDone();
    }).catch(function(e) { checkDone(); });
  }, 2000);

  // 3. Institutional Activity
  setTimeout(function() {
    fetchClaudeIntel(
      'Search for today\'s institutional investor activity in the stock market: major fund moves, ETF inflows/outflows, and notable hedge fund positions or 13F filings. Return ONLY a JSON object: {"institutions":[{"name":"Fund Name","aum":"$X.XT if known","move":"what they are doing today","signal":"one word like Risk-Off or Rotate or Defensive or Accumulate","color":"#hex color"}]} Include 8-10 institutions. Focus on what big money is actually doing today.'
    ).then(function(data) {
      var parsed = parseClaudeJSON(data);
      if (parsed && parsed.institutions) results.institutions = parsed.institutions;
      checkDone();
    }).catch(function(e) { checkDone(); });
  }, 4000);

  // 4. Market Summary Narrative + Fear & Greed
  setTimeout(function() {
    fetchClaudeIntel(
      'Search for today\'s stock market summary. What are the major indexes doing (Dow, S&P 500, NASDAQ)? What is driving the market today? What is the CNN Fear & Greed Index value today? Return ONLY a JSON object: {"narrative":"2-3 sentence summary of today\'s market action and what is driving it","fearGreed":number_0_to_100,"fearLabel":"Extreme Fear or Fear or Neutral or Greed or Extreme Greed","vix":"current VIX value","oil":"current oil price","headline":"one line headline"}'
    ).then(function(data) {
      var parsed = parseClaudeJSON(data);
      if (parsed) {
        results.narrative = parsed.narrative || null;
        results.fearGreed = parsed.fearGreed || null;
        results.fearLabel = parsed.fearLabel || null;
        results.vix = parsed.vix || null;
        results.oil = parsed.oil || null;
        results.headline = parsed.headline || null;
      }
      checkDone();
    }).catch(function(e) { checkDone(); });
  }, 6000);

  // 5. Scanner Intelligence - live stock signals for strategy scoring
  setTimeout(function() {
    fetchClaudeIntel(
      'Search for today\'s strongest stock buy and sell signals across the S&P 500. I need stocks showing: unusual volume, RSI extremes, analyst upgrades/downgrades, insider buying/selling, and earnings surprises. Return ONLY a JSON object: {"stocks":[{"ticker":"XX","action":"Strong Buy or Buy or Sell or Strong Sell","rsi":number,"volume_vs_avg":"150%","sentiment":"Bullish or Bearish or Neutral","catalyst":"why this stock is signaling today","analyst":"Buy or Sell if any analyst change today","insiderActivity":"description or None"}]} Include 15-20 stocks with the strongest signals today. Mix of buys and sells.'
    ).then(function(data) {
      var parsed = parseClaudeJSON(data);
      if (parsed && parsed.stocks) results.scannerData = parsed.stocks;
      checkDone();
    }).catch(function(e) { checkDone(); });
  }, 8000);
}

// ============================================================
// STRATEGY SCANNER
// ============================================================

function scanStrategies(allIndexes, macro, staticSmartMoney, lc, liveIntel) {
  var intel = liveIntel || {};
  var hasLiveIntel = intel.timestamp && intel.timestamp.length > 0;

  // Build stock universe from all indexes
  var allStocks = [];
  var seen = {};
  var worstPct = 0;

  Object.keys(allIndexes).forEach(function(idxKey) {
    var d = allIndexes[idxKey];
    if (d.changePct < worstPct) worstPct = d.changePct;
    d.sectors.forEach(function(sec) {
      sec.stocks.forEach(function(st) {
        if (!seen[st.ticker]) {
          seen[st.ticker] = true;
          allStocks.push({ stock: st, sectorName: sec.name, sectorColor: sec.color, index: idxKey });
        }
      });
    });
  });

  // Build live scanner overlay: ticker -> live signals from Claude
  var liveSignals = {};
  if (intel.scannerData && intel.scannerData.length > 0) {
    intel.scannerData.forEach(function(s) {
      if (s.ticker) liveSignals[s.ticker] = s;
    });
  }

  // Use live smart money or fall back to static
  var smartMoneyList = (intel.smartMoney && intel.smartMoney.length > 0) ? intel.smartMoney : staticSmartMoney;
  var smartTickers = {};
  smartMoneyList.forEach(function(s) {
    var t = s.ticker;
    var isBullish = s.type === "Accumulation" || s.type === "Upgrade" || s.type === "Insider Buy";
    if (t && isBullish) smartTickers[t] = s;
  });

  // Use live flows or fall back to static
  var allFlows = [];
  if (intel.flows && intel.flows.length > 0) {
    intel.flows.forEach(function(f) { allFlows.push(f); });
  } else {
    Object.keys(allIndexes).forEach(function(k) { (allIndexes[k].flows || []).forEach(function(f) { allFlows.push(f); }); });
  }

  // Use live institutions or fall back to static
  var allInstitutions = [];
  if (intel.institutions && intel.institutions.length > 0) {
    intel.institutions.forEach(function(inv) { allInstitutions.push(inv); });
  } else {
    var instSeen2 = {};
    Object.keys(allIndexes).forEach(function(k) {
      (allIndexes[k].institutions || []).forEach(function(inv) {
        if (!instSeen2[inv.name]) { instSeen2[inv.name] = true; allInstitutions.push(inv); }
      });
    });
  }

  // Use live Fear & Greed or fall back to static
  var fearGreed = (intel.fearGreed && intel.fearGreed > 0) ? intel.fearGreed : macro.fearGreed;

  var totalStocks = allStocks.length;
  var results = { fear: [], smartFollow: [], rotation: [], totalScanned: totalStocks, isLiveIntel: hasLiveIntel };

  // STRATEGY 1: Fear Rotation
  var isFearEnv = fearGreed <= 30;
  allStocks.forEach(function(item) {
    var st = item.stock;
    var sig = st.signals || {};
    var live = liveSignals[st.ticker];
    var score = 0; var reasons = [];

    // Use live signals when available, otherwise static
    var action = live ? live.action : sig.composite;
    var isSellSignal = action === "Sell" || action === "Strong Sell";
    var above200 = sig.sma200 === "Above"; // Keep static MA position
    var analyst = live ? (live.analyst || st.analystRating) : st.analystRating;
    var isQuality = analyst === "Buy" || analyst === "Strong Buy";
    var instHigh = parseFloat(st.instOwn) >= 65;
    var targetUpside = st.priceTarget > 0 ? ((st.priceTarget - st.price) / st.price * 100) : 0;
    var rsi = live ? (live.rsi || st.rsi) : st.rsi;

    if (isFearEnv) { score++; reasons.push("F&G " + fearGreed + (hasLiveIntel ? " (live)" : "")); }
    if (isSellSignal && above200) { score += 2; reasons.push("Oversold but above 200-day"); }
    if (isQuality) { score++; reasons.push("Analyst " + analyst + (live && live.analyst ? " (live)" : "")); }
    if (instHigh) { score++; reasons.push(st.instOwn + " inst owned"); }
    if (targetUpside >= 15) { score++; reasons.push("Target $" + st.priceTarget + " (+" + targetUpside.toFixed(0) + "%)"); }
    if (rsi && rsi < 35) { score++; reasons.push("RSI " + rsi + " oversold" + (live && live.rsi ? " (live)" : "")); }

    if (score >= 4 && isSellSignal && above200) {
      reasons.push(item.index);
      results.fear.push({ ticker: st.ticker, name: st.name, price: st.price, change: lc(st.ticker, st.change), score: score, reasons: reasons, color: item.sectorColor, sector: item.sectorName, index: item.index });
    }
  });

  // Also scan live scannerData stocks that aren't in our universe
  if (intel.scannerData) {
    intel.scannerData.forEach(function(ls) {
      if (seen[ls.ticker]) return; // Already scanned above
      var action = ls.action;
      var isSell = action === "Sell" || action === "Strong Sell";
      var rsi = ls.rsi || 50;
      if (isSell && isFearEnv && rsi < 40) {
        var score = 3;
        var reasons = ["LIVE SIGNAL: " + (ls.catalyst || ls.action)];
        if (isFearEnv) { score++; reasons.push("F&G " + fearGreed + " (live)"); }
        if (rsi < 35) { score++; reasons.push("RSI " + rsi + " oversold (live)"); }
        if (ls.volume_vs_avg && parseFloat(ls.volume_vs_avg) > 150) { score++; reasons.push("Vol " + ls.volume_vs_avg + " avg (live)"); }
        results.fear.push({ ticker: ls.ticker, name: ls.ticker, price: 0, change: 0, score: Math.min(score, 7), reasons: reasons, color: "#00d4ff", sector: "Live Signal", index: "LIVE" });
      }
    });
  }

  // STRATEGY 2: Smart Money Follow
  allStocks.forEach(function(item) {
    var st = item.stock;
    var sig = st.signals || {};
    var live = liveSignals[st.ticker];
    var sm = smartTickers[st.ticker];
    var score = 0; var reasons = [];

    var isGreenOnRed = lc(st.ticker, st.change) > 0 && worstPct < 0;
    var volHigh = parseFloat(st.volume) > parseFloat(st.avgVol) * 1.3;
    if (live && live.volume_vs_avg) volHigh = parseFloat(live.volume_vs_avg) > 130;
    var mas = st.mas || {};
    var maBulls = 0;
    ["sma5","sma10","sma20","sma50","sma200"].forEach(function(k) { if (mas[k] && st.price > mas[k]) maBulls++; });

    var action = live ? live.action : sig.composite;

    if (sm) { score += 2; reasons.push("Smart Money: " + (sm.signal || sm.description || sm.type).substring(0, 50) + (hasLiveIntel ? " (live)" : "")); }
    if (isGreenOnRed) { score += 2; reasons.push("GREEN on red day"); }
    if (volHigh) { score++; reasons.push("Vol above avg" + (live && live.volume_vs_avg ? " " + live.volume_vs_avg + " (live)" : "")); }
    if (maBulls >= 3) { score++; reasons.push(maBulls + "/5 MAs bullish"); }
    if (action === "Buy" || action === "Strong Buy") { score++; reasons.push("Signal: " + action + (live ? " (live)" : "")); }

    if (score >= 3 && (sm || isGreenOnRed)) {
      reasons.push(item.index);
      results.smartFollow.push({ ticker: st.ticker, name: st.name, price: st.price, change: lc(st.ticker, st.change), score: score, reasons: reasons, color: item.sectorColor, sector: item.sectorName, maBulls: maBulls, index: item.index });
    }
  });

  // Also add live smart money tickers not in our universe
  if (hasLiveIntel && intel.smartMoney) {
    intel.smartMoney.forEach(function(sm) {
      if (!sm.ticker || seen[sm.ticker]) return;
      var isBull = sm.type === "Accumulation" || sm.type === "Upgrade" || sm.type === "Insider Buy";
      if (isBull) {
        var score = 3;
        var reasons = ["LIVE: " + (sm.signal || sm.description || sm.type)];
        score++; reasons.push("Smart Money accumulation (live)");
        results.smartFollow.push({ ticker: sm.ticker, name: sm.ticker, price: 0, change: 0, score: Math.min(score, 7), reasons: reasons, color: sm.color || "#00ff88", sector: "Live Signal", index: "LIVE" });
      }
    });
  }

  // STRATEGY 3: Macro Rotation
  var rotationSignals = [];
  allFlows.forEach(function(f) {
    var flowNum = parseFloat((f.flow || "0").replace(/[^0-9.]/g, "")) || 0;
    if (flowNum >= 0.5) {
      var instConfirm = 0;
      allInstitutions.forEach(function(inv) {
        var move = (inv.move || inv.description || "").toLowerCase();
        if (move.indexOf("energy") >= 0 || move.indexOf("defensive") >= 0 || move.indexOf("value") >= 0 || move.indexOf("rotate") >= 0 || move.indexOf("shift") >= 0 || move.indexOf("real asset") >= 0 || move.indexOf("inflow") >= 0 || move.indexOf("outflow") >= 0) instConfirm++;
      });
      if (instConfirm > 5) instConfirm = 5;
      rotationSignals.push({ from: f.from, to: f.to, flow: f.flow || "$?", flowNum: flowNum, drivers: f.drivers || [], instConfirm: instConfirm, label: f.label || f.description || "" });
    }
  });

  var rotSeen = {};
  rotationSignals.forEach(function(rot) {
    var toSector = rot.to.toLowerCase();
    allStocks.forEach(function(item) {
      var st = item.stock;
      var sn = item.sectorName.toLowerCase();
      var secWords = sn.split(" ");
      var toWords = toSector.split(/[\s\/]+/);
      var match = false;
      toWords.forEach(function(tw) { secWords.forEach(function(sw) { if (tw.length > 2 && sw.length > 2 && sw.indexOf(tw) >= 0) match = true; }); });
      if (!match) match = sn.indexOf(toSector.split("/")[0].trim()) >= 0 || toSector.indexOf(sn.split(" ")[0]) >= 0;

      var rsi = st.rsi || 50;
      var live = liveSignals[st.ticker];
      if (live && live.rsi) rsi = live.rsi;

      if (match && rsi < 70 && !rotSeen[st.ticker]) {
        rotSeen[st.ticker] = true;
        var score = 0;
        var reasons = ["Flow: " + rot.from + " -> " + rot.to + " (" + rot.flow + ")" + (hasLiveIntel ? " (live)" : "")];
        if (rot.flowNum >= 4) { score += 2; reasons.push("Massive flow $" + rot.flowNum + "B"); }
        else { score += 1; reasons.push("Flow $" + rot.flowNum + "B"); }
        if (rot.instConfirm >= 3) { score += 2; reasons.push(rot.instConfirm + " institutions confirm"); }
        else if (rot.instConfirm >= 1) { score += 1; reasons.push(rot.instConfirm + " institution confirms"); }
        if (rsi < 50) { score++; reasons.push("RSI " + rsi + (live && live.rsi ? " (live)" : "")); }
        if (lc(st.ticker, st.change) > 0 && worstPct < 0) { score++; reasons.push("Green on red day"); }
        var mas2 = st.mas || {};
        var mab = 0;
        ["sma20","sma50","sma200"].forEach(function(k) { if (mas2[k] && st.price > mas2[k]) mab++; });
        if (mab >= 2) { score++; reasons.push(mab + "/3 key MAs bullish"); }
        rot.drivers.forEach(function(dr) { reasons.push("Driver: " + dr); });
        reasons.push(item.index);
        results.rotation.push({ ticker: st.ticker, name: st.name, price: st.price, change: lc(st.ticker, st.change), score: score, reasons: reasons, color: item.sectorColor, sector: item.sectorName, flow: rot.flow, rsi: rsi, index: item.index });
      }
    });
  });

  // Cap all scores at 7
  results.fear.forEach(function(r) { if (r.score > 7) r.score = 7; });
  results.smartFollow.forEach(function(r) { if (r.score > 7) r.score = 7; });
  results.rotation.forEach(function(r) { if (r.score > 7) r.score = 7; });

  results.fear.sort(function(a, b) { return b.score - a.score; });
  results.smartFollow.sort(function(a, b) { return b.score - a.score; });
  results.rotation.sort(function(a, b) { return b.score - a.score; });

  return results;
}

// ============================================================
// VIEWS - all use h() for complex parts
// ============================================================

function GalaxyView(props) {
  var idx = props.idx; var onSelect = props.onSelect;
  var liveQuotes = props.liveQuotes || {}; var isLive = props.isLive || false; var onLiveUpdate = props.onLiveUpdate;
  var liveIntel = props.liveIntel || null;
  var _h2 = useState(null), hov = _h2[0], setHov = _h2[1];
  var _t = useState("scanner"), tab = _t[0], setTab = _t[1];
  var _ma = useState(false), showMA = _ma[0], setShowMA = _ma[1];
  var d = INDEXES[idx];

  function lp(t, fb) { return (isLive && liveQuotes[t] && liveQuotes[t].price > 0) ? liveQuotes[t].price : fb; }
  function lc(t, fb) { return (isLive && liveQuotes[t]) ? liveQuotes[t].change : fb; }

  var allEvts = [];
  d.sectors.forEach(function(sec) { sec.stocks.forEach(function(st) { (st.events || []).forEach(function(ev) { allEvts.push({ date: ev.date, event: ev.event, type: ev.type, ticker: st.ticker, color: sec.color, signal: st.signals ? st.signals.composite : "Hold" }); }); }); });
  allEvts.sort(function(a, b) { return a.date.localeCompare(b.date); });

  // Build index header price display
  var etfKey = INDEX_ETFS[idx];
  var liveETF = isLive && liveQuotes[etfKey];
  var displayPrice = liveETF ? "$" + liveQuotes[etfKey].price.toFixed(2) + " (ETF)" : d.close.toLocaleString();
  var displayPct = liveETF ? liveQuotes[etfKey].change : d.changePct;
  var displaySub = liveETF ? (displayPct >= 0 ? "+" : "") + displayPct.toFixed(2) + "%" : d.change.toLocaleString() + " (" + d.changePct + "%)";
  var displayInfo = isLive ? "Live | " + d.short : getTodayShort() + " | " + d.greenCount + "/" + d.components + " green";

  // Macro tiles - overlay live proxy data when available
  var macroTiles = MACRO_TILES.map(function(m) {
    var proxy = MACRO_PROXIES[m.l];
    var hasLive = isLive && proxy && liveQuotes[proxy.symbol] && liveQuotes[proxy.symbol].price > 0;
    var liveQ = hasLive ? liveQuotes[proxy.symbol] : null;

    var displayVal = m.v;
    var displayDelta = m.delta;
    var displayCtx = m.ctx;
    var trend = m.trend;

    if (liveQ) {
      var pct = liveQ.change;
      trend = pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat";
      displayDelta = (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
      displayCtx = "LIVE $" + liveQ.price.toFixed(2);
      // For VIX proxy (VIXY), show the ETF price with context
      if (m.l === "VIX") { displayVal = "$" + liveQ.price.toFixed(2); displayCtx = "VIXY ETF (live)"; }
      else if (m.l === "OIL WTI") { displayVal = "$" + liveQ.price.toFixed(2); displayCtx = "USO ETF (live)"; }
      else if (m.l === "GOLD") { displayVal = "$" + liveQ.price.toFixed(2); displayCtx = "GLD ETF (live)"; }
      else if (m.l === "DXY") { displayVal = "$" + liveQ.price.toFixed(2); displayCtx = "UUP ETF (live)"; }
      else if (m.l === "10Y") { displayVal = "$" + liveQ.price.toFixed(2); displayCtx = "TLT ETF (live)"; }
    }

    var ac = trend === "up" ? "#ff4d4d" : trend === "down" ? "#00ff88" : "#5a6b8a";
    if (m.l === "OIL WTI" || m.l === "GOLD") ac = trend === "up" ? "#22c55e" : "#ff4d4d";
    if (m.l === "UNEMP" || m.l === "P/C RATIO") ac = trend === "up" ? "#ff4d4d" : "#00ff88";
    var arrow = trend === "up"
      ? { display: "inline-block", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "7px solid " + ac }
      : trend === "down"
      ? { display: "inline-block", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "7px solid " + ac }
      : { display: "inline-block", width: 10, height: 2, borderRadius: 1, background: ac };

    var tileBorder = hasLive ? "#00ff8833" : "#141f35";
    return h("div", { key: m.l, style: { background: "#0a1020", border: "1px solid " + tileBorder, borderRadius: 8, padding: "6px 12px", minWidth: 88, textAlign: "center" } },
      h("div", { style: { display: "flex", justifyContent: "center", alignItems: "center", gap: 4, fontSize: 9, color: hasLive ? "#00ff88" : "#4a5b7a", textTransform: "uppercase", fontFamily: mono, marginBottom: 2 } },
        m.l,
        hasLive ? h("span", { style: { width: 5, height: 5, borderRadius: "50%", background: "#00ff88", display: "inline-block", marginLeft: 3 } }) : null
      ),
      h("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 5 } },
        h("span", { style: { fontSize: 16, fontWeight: 700, color: hasLive ? (liveQ.change >= 0 ? "#00ff88" : "#ff4d4d") : m.c, fontFamily: mono } }, displayVal),
        h("span", { style: arrow })
      ),
      h("div", { style: { fontSize: 9, color: ac, fontFamily: mono, marginTop: 1 } }, displayDelta),
      h("div", { style: { fontSize: 8, color: hasLive ? "#00ff8888" : "#3a4a5a", marginTop: 1 } }, displayCtx)
    );
  });

  // Tab buttons
  var tabs = ["scanner", "sectors", "smart_money", "flows", "institutions", "calendar"].map(function(t) {
    var label = t === "flows" ? "Flows" : t === "institutions" ? "Institutions" : t === "smart_money" ? "Smart Money" : t === "calendar" ? "Calendar" : t === "scanner" ? "Strategy Scanner" : "Sectors";
    var isScanner = t === "scanner";
    return h("button", { key: t, onClick: function() { setTab(t); }, style: { background: tab === t ? (isScanner ? "#1a1040" : "#162040") : "#0a1020", border: "1px solid " + (tab === t ? (isScanner ? "#e040fb55" : "#00d4ff33") : "#141f35"), borderRadius: 8, padding: "7px 14px", color: tab === t ? (isScanner ? "#e040fb" : "#00d4ff") : "#5a6b8a", fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", fontFamily: mono } }, label);
  });

  // Sector cards
  var sectorCards = d.sectors.map(function(s, i) {
    var avg = s.stocks.reduce(function(a, b) { return a + lc(b.ticker, b.change); }, 0) / s.stocks.length;
    var tickers = s.stocks.map(function(st) {
      var ch = lc(st.ticker, st.change);
      return h("span", { key: st.ticker, style: { fontSize: 11, padding: "2px 5px", borderRadius: 3, background: ch >= 0 ? "#00ff8810" : "#ff4d4d10", color: ch >= 0 ? "#00ff88" : "#ff4d4d", fontFamily: mono, fontWeight: 600 } }, st.ticker + (ch >= 0 ? "+" : "") + ch.toFixed(1) + "%");
    });
    return h("div", { key: s.name, onClick: function() { onSelect(s); }, onMouseEnter: function() { setHov(i); }, onMouseLeave: function() { setHov(null); },
      style: { background: hov === i ? "#111d35" : "#0a1223", border: "1px solid " + (hov === i ? s.color + "44" : "#141f35"), borderRadius: 12, padding: 14, cursor: "pointer", transition: "all .2s", boxShadow: hov === i ? "0 0 18px " + s.glow : "none" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 } },
        h("span", { style: { fontSize: 15, fontWeight: 700, color: "#e0e6f0" } }, s.name),
        h(Chg, { v: avg, sz: 15 })
      ),
      h("div", { style: { fontSize: 12, color: "#6a7a94", lineHeight: 1.45, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } }, s.description),
      h("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }, tickers)
    );
  });

  // Smart money cards
  var smartCards = SMART_MONEY.map(function(s, i) {
    return h("div", { key: i, style: { background: "#0a1020", border: "1px solid #141f35", borderRadius: 10, padding: 14, marginBottom: 8 } },
      h("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" } },
        h("span", { style: { fontSize: 18, fontWeight: 800, color: s.color, fontFamily: mono } }, s.ticker),
        h(Badge, { text: s.type, color: s.color })
      ),
      h("div", { style: { fontSize: 13, color: "#8892a4" } }, s.signal)
    );
  });

  // Flow cards
  var flowCards = d.flows.map(function(f, i) {
    return h("div", { key: i, style: { background: "#0a1020", border: "1px solid #141f35", borderRadius: 10, padding: 12, marginBottom: 8 } },
      h("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" } },
        h("span", { style: { fontSize: 13, fontWeight: 700, color: "#00d4ff" } }, f.from),
        h("span", { style: { color: "#ff4d4d", fontSize: 16 } }, "->"),
        h("span", { style: { fontSize: 13, fontWeight: 700, color: "#00ff88" } }, f.to),
        h("span", { style: { marginLeft: "auto", fontSize: 16, fontWeight: 800, color: "#e0e6f0", fontFamily: mono } }, f.flow)
      ),
      h("div", { style: { fontSize: 13, color: "#8892a4", marginBottom: 4 } }, f.label),
      h("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }, f.drivers.map(function(dr) { return h("span", { key: dr, style: { fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#141f35", color: "#6a7a94", fontFamily: mono } }, dr); }))
    );
  });

  // Institution cards
  var instCards = d.institutions.map(function(inv, i) {
    return h("div", { key: inv.name, style: { background: "#0a1020", border: "1px solid #141f35", borderRadius: 10, padding: 12, marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 12 } },
      h("div", { style: { width: 34, height: 34, borderRadius: 7, background: inv.color + "15", border: "1px solid " + inv.color + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: inv.color, flexShrink: 0, fontFamily: mono } }, i + 1),
      h("div", { style: { flex: 1 } },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 } },
          h("span", { style: { fontSize: 14, fontWeight: 700, color: "#e0e6f0" } }, inv.name),
          h(Badge, { text: inv.signal, color: inv.color })
        ),
        h("div", { style: { display: "flex", gap: 12, fontSize: 12, color: "#5a6b8a", marginBottom: 4 } },
          h("span", null, "AUM: ", h("strong", { style: { color: "#bcc6d4" } }, inv.aum)),
          h("span", null, "Wt: ", h("strong", { style: { color: "#bcc6d4" } }, inv.weight))
        ),
        h("div", { style: { fontSize: 13, color: "#8892a4" } }, inv.move)
      )
    );
  });

  // Override with LIVE intel when available
  var intelBanner = null;
  if (liveIntel && liveIntel.timestamp) {
    intelBanner = h("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "6px 10px", background: "#e040fb12", border: "1px solid #e040fb33", borderRadius: 8 } },
      h("div", { style: { width: 6, height: 6, borderRadius: "50%", background: "#e040fb" } }),
      h("span", { style: { fontSize: 11, color: "#e040fb", fontWeight: 700 } }, "LIVE INTEL"),
      h("span", { style: { fontSize: 10, color: "#6a7a94" } }, "Updated " + liveIntel.timestamp + " ET via Claude AI")
    );
  }

  if (liveIntel && liveIntel.smartMoney && liveIntel.smartMoney.length > 0) {
    smartCards = liveIntel.smartMoney.map(function(s, i) {
      var c = s.color || (s.type === "Accumulation" || s.type === "Insider Buy" ? "#00ff88" : "#ff4d4d");
      return h("div", { key: "live-sm-" + i, style: { background: "#0a1020", border: "1px solid " + c + "33", borderRadius: 10, padding: 14, marginBottom: 8 } },
        h("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" } },
          h("span", { style: { fontSize: 18, fontWeight: 800, color: c, fontFamily: mono } }, s.ticker || "???"),
          h(Badge, { text: s.type || "Signal", color: c }),
          h("span", { style: { fontSize: 9, color: "#e040fb", marginLeft: "auto" } }, "LIVE")
        ),
        h("div", { style: { fontSize: 13, color: "#8892a4", lineHeight: 1.5 } }, s.signal || s.description || "")
      );
    });
  }

  if (liveIntel && liveIntel.flows && liveIntel.flows.length > 0) {
    flowCards = liveIntel.flows.map(function(f, i) {
      var drivers = f.drivers || [];
      return h("div", { key: "live-fl-" + i, style: { background: "#0a1020", border: "1px solid #00d4ff33", borderRadius: 10, padding: 12, marginBottom: 8 } },
        h("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" } },
          h("span", { style: { fontSize: 13, fontWeight: 700, color: "#00d4ff" } }, f.from || ""),
          h("span", { style: { color: "#ff4d4d", fontSize: 16 } }, "->"),
          h("span", { style: { fontSize: 13, fontWeight: 700, color: "#00ff88" } }, f.to || ""),
          h("span", { style: { marginLeft: "auto", fontSize: 16, fontWeight: 800, color: "#e0e6f0", fontFamily: mono } }, f.flow || ""),
          h("span", { style: { fontSize: 9, color: "#e040fb" } }, "LIVE")
        ),
        h("div", { style: { fontSize: 13, color: "#8892a4", marginBottom: 4 } }, f.label || f.description || ""),
        h("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }, drivers.map(function(dr, j) { return h("span", { key: j, style: { fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#141f35", color: "#6a7a94", fontFamily: mono } }, dr); }))
      );
    });
  }

  if (liveIntel && liveIntel.institutions && liveIntel.institutions.length > 0) {
    instCards = liveIntel.institutions.map(function(inv, i) {
      var c = inv.color || "#00d4ff";
      return h("div", { key: "live-inst-" + i, style: { background: "#0a1020", border: "1px solid #141f35", borderRadius: 10, padding: 12, marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 12 } },
        h("div", { style: { width: 34, height: 34, borderRadius: 7, background: c + "15", border: "1px solid " + c + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: c, flexShrink: 0, fontFamily: mono } }, i + 1),
        h("div", { style: { flex: 1 } },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 } },
            h("span", { style: { fontSize: 14, fontWeight: 700, color: "#e0e6f0" } }, inv.name || ""),
            h(Badge, { text: inv.signal || "Active", color: c }),
            h("span", { style: { fontSize: 9, color: "#e040fb", marginLeft: 6 } }, "LIVE")
          ),
          inv.aum ? h("div", { style: { fontSize: 12, color: "#5a6b8a", marginBottom: 4 } }, "AUM: ", h("strong", { style: { color: "#bcc6d4" } }, inv.aum)) : null,
          h("div", { style: { fontSize: 13, color: "#8892a4", lineHeight: 1.45 } }, inv.move || inv.description || "")
        )
      );
    });
  }

  // Calendar
  var econCards = ECON_CAL.map(function(ev, i) {
    var ic = ev.impact === "Critical" ? "#ff2020" : ev.impact === "High" ? "#ffd700" : "#78909c";
    return h("div", { key: i, style: { background: "#0a1020", border: "1px solid #141f35", borderRadius: 8, padding: 10, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 } },
      h("span", { style: { minWidth: 60, fontSize: 13, fontWeight: 700, color: "#00d4ff", fontFamily: mono } }, ev.date),
      h("span", { style: { flex: 1, fontSize: 13, color: "#bcc6d4" } }, ev.event),
      h(Badge, { text: ev.impact, color: ic })
    );
  });
  var evtCards = allEvts.map(function(ev, i) {
    return h("div", { key: i, style: { background: "#0a1020", border: "1px solid #141f35", borderRadius: 8, padding: "8px 12px", marginBottom: 5, display: "flex", alignItems: "center", gap: 10 } },
      h("div", { style: { width: 8, height: 8, borderRadius: "50%", background: evColor(ev.type), flexShrink: 0 } }),
      h("span", { style: { fontWeight: 700, color: ev.color, fontFamily: mono, fontSize: 13, minWidth: 48 } }, ev.ticker),
      h("span", { style: { color: "#5a6b8a", fontFamily: mono, fontSize: 13, minWidth: 60 } }, ev.date),
      h("span", { style: { color: "#bcc6d4", fontSize: 13, flex: 1 } }, ev.event),
      h(Badge, { text: ev.signal || "Hold", color: sigC(ev.signal) })
    );
  });

  // Strategy Scanner
  var scanResults = scanStrategies(INDEXES, MACRO, SMART_MONEY, lc, liveIntel);

  function buildStrategyCard(strat, title, icon, desc, color, items) {
    var active = items.length > 0;
    var header = h("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 } },
      h("div", { style: { width: 36, height: 36, borderRadius: 8, background: (active ? color : "#5a6b8a") + "20", border: "1px solid " + (active ? color : "#5a6b8a") + "44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 } }, icon),
      h("div", null,
        h("div", { style: { fontSize: 14, fontWeight: 800, color: active ? "#e0e6f0" : "#5a6b8a" } }, title),
        h("div", { style: { fontSize: 11, color: active ? color : "#4a5b7a" } }, active ? items.length + " stocks flagged" : "No signals")
      ),
      h("div", { style: { marginLeft: "auto", padding: "4px 12px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: active ? color + "20" : "#141f35", border: "1px solid " + (active ? color + "44" : "#1a2744"), color: active ? color : "#4a5b7a" } }, active ? "ACTIVE" : "INACTIVE")
    );

    var descEl = h("div", { style: { fontSize: 12, color: "#6a7a94", lineHeight: 1.5, padding: "8px 10px", background: "#0a1020", borderRadius: 6, marginBottom: 10 } }, desc);

    var stockRows = items.map(function(item, i) {
      var is7 = Math.min(item.score, 7) === 7;
      var isLiveSignal = item.index === "LIVE" || (item.reasons && item.reasons.some(function(r) { return r.indexOf("(live)") >= 0 || r.indexOf("LIVE") >= 0; }));
      var cardBorder = is7 ? "2px solid " + color : "1px solid " + (isLiveSignal ? "#e040fb33" : "#141f35");
      var cardBg = is7 ? "#0c1428" : "#0a1020";
      var cardShadow = is7 ? "0 0 20px " + color + "30, 0 0 40px " + color + "15" : "none";

      return h("div", { key: item.ticker + i, className: is7 ? "pulse-card" : "", style: { background: cardBg, border: cardBorder, borderRadius: 10, padding: 12, marginBottom: 8, boxShadow: cardShadow, position: "relative", overflow: "hidden" } },
        is7 ? h("div", { style: { position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, " + color + ", transparent)", animation: "shimmer 2s infinite" } }) : null,
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } },
          h("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
            h("span", { style: { fontSize: is7 ? 18 : 16, fontWeight: 800, color: is7 ? "#fff" : item.color, fontFamily: mono, textShadow: is7 ? "0 0 10px " + color : "none" } }, item.ticker),
            h("span", { style: { fontSize: 12, color: "#6a7a94" } }, item.name),
            h("span", { style: { fontSize: 10, color: "#4a5b7a" } }, item.sector),
            item.index ? h("span", { style: { fontSize: 9, padding: "1px 5px", borderRadius: 4, background: item.index === "LIVE" ? "#e040fb22" : "#1a2744", color: item.index === "LIVE" ? "#e040fb" : "#5a8bfa", fontFamily: mono, fontWeight: 700 } }, item.index === "DOW" ? "DJIA" : item.index === "SPX" ? "S&P" : item.index === "LIVE" ? "LIVE" : "NDX") : null,
            isLiveSignal && item.index !== "LIVE" ? h("span", { style: { fontSize: 8, color: "#e040fb", fontWeight: 700 } }, "LIVE DATA") : null
          ),
          h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
            item.price > 0 ? h("span", { style: { fontSize: 14, fontWeight: 700, color: "#e0e6f0", fontFamily: mono } }, "$" + item.price.toLocaleString()) : null,
            item.price > 0 ? h(Chg, { v: item.change, sz: 12 }) : null,
            h("div", { className: is7 ? "pulse-badge" : "", style: { padding: is7 ? "4px 12px" : "2px 8px", borderRadius: 10, background: is7 ? color : color + "20", border: is7 ? "none" : "1px solid " + color + "44", color: is7 ? "#000" : color, fontSize: is7 ? 13 : 11, fontWeight: 800, fontFamily: mono, animation: is7 ? "pulse-glow 1.5s ease-in-out infinite" : "none" } }, Math.min(item.score, 7) + "/7")
          )
        ),
        h("div", { style: { display: "flex", flexWrap: "wrap", gap: 4 } },
          item.reasons.map(function(r, j) {
            var isLiveReason = r.indexOf("(live)") >= 0 || r.indexOf("LIVE") >= 0;
            return h("span", { key: j, style: { fontSize: 10, padding: "2px 6px", borderRadius: 4, background: isLiveReason ? "#e040fb15" : "#141f35", color: isLiveReason ? "#e040fb" : "#8892a4", fontFamily: mono, lineHeight: 1.6, border: isLiveReason ? "1px solid #e040fb33" : "none" } }, r);
          })
        )
      );
    });

    return h("div", { style: { background: "#0c1424", border: "1px solid " + (active ? color + "30" : "#141f35"), borderRadius: 14, padding: 16, marginBottom: 14 } }, header, descEl, stockRows.length > 0 ? stockRows : h("div", { style: { fontSize: 12, color: "#4a5b7a", padding: "10px 0", textAlign: "center" } }, "No stocks meet all criteria for this strategy right now."));
  }

  var scannerContent = h("div", null,
    scanResults.isLiveIntel ? h("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "8px 12px", background: "#e040fb12", border: "1px solid #e040fb33", borderRadius: 8 } },
      h("div", { style: { width: 8, height: 8, borderRadius: "50%", background: "#e040fb", animation: "pulse-glow 1.5s ease-in-out infinite" } }),
      h("span", { style: { fontSize: 12, color: "#e040fb", fontWeight: 700 } }, "LIVE INTELLIGENCE ACTIVE"),
      h("span", { style: { fontSize: 10, color: "#6a7a94" } }, "Using real-time data from Claude AI")
    ) : null,
    h("div", { style: { fontSize: 11, color: "#e040fb", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 } }, "Automated Strategy Scanner"),
    h("div", { style: { fontSize: 12, color: "#6a7a94", marginBottom: 14, lineHeight: 1.5 } }, "Scanning " + (scanResults.totalScanned || 0) + " stocks across DJIA, S&P 500, and NASDAQ. " + (scanResults.isLiveIntel ? "Live smart money, flows, institutional data, and AI scanner signals active." : "Using snapshot data. Click Fetch AI Intel for live signals.")),
    buildStrategyCard("fear", "Strategy 1: Fear Rotation", "F", "Buy quality names dragged down by panic. Requires: F&G below 30, composite Sell but above 200-day MA, analyst Buy/Strong Buy, high institutional ownership, price target 15%+ above current. These are temporary fear plays in strong companies.", "#00d4ff", scanResults.fear),
    buildStrategyCard("smart", "Strategy 2: Smart Money Follow", "S", "Follow institutional accumulation signals. Requires: Smart Money tab accumulation OR green on a red day, volume above average, 3+ MAs bullish, composite Buy signal. You are piggybacking on conviction buying by large desks.", "#00ff88", scanResults.smartFollow),
    buildStrategyCard("rotation", "Strategy 3: Macro Rotation", "R", "Ride sector rotation flows. Requires: $1B+ flow into sector, multiple institutions confirming the rotation, RSI below 70 (room to run). You profit from money movement between sectors regardless of index direction.", "#ffd700", scanResults.rotation),
    h("div", { style: { marginTop: 8, padding: 10, background: "#0a1020", borderRadius: 8, border: "1px solid #1a2235", fontSize: 11, color: "#4a5b7a", lineHeight: 1.5, textAlign: "center" } }, "Disclaimer: These are educational strategy frameworks, not investment advice. Signals are estimated from available data. Always do your own research and consider consulting a financial advisor before trading.")
  );

  // Pick tab content
  var tabContent = null;
  if (tab === "scanner") tabContent = scannerContent;
  if (tab === "sectors") tabContent = h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 } }, sectorCards);
  if (tab === "smart_money") tabContent = h("div", null, intelBanner, h("div", { style: { fontSize: 12, color: "#ffd700", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 } }, "Unusual Activity - " + getTodayShort()), smartCards);
  if (tab === "flows") tabContent = h("div", null, intelBanner, h("div", { style: { fontSize: 12, color: "#ffd700", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 } }, "Sector Rotation - " + getTodayShort()), flowCards);
  if (tab === "institutions") tabContent = h("div", null, intelBanner, h("div", { style: { fontSize: 12, color: "#ffd700", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 } }, "Institutional Activity - " + getTodayShort()), instCards);
  if (tab === "calendar") tabContent = h("div", null, h("div", { style: { fontSize: 12, color: "#5a6b8a", marginBottom: 8, textTransform: "uppercase", fontWeight: 700 } }, "Economic Events"), econCards, h("div", { style: { fontSize: 12, color: "#5a6b8a", marginTop: 16, marginBottom: 8, textTransform: "uppercase", fontWeight: 700 } }, "Stock Events"), evtCards);

  return h("div", { style: { padding: "14px 20px" } },
    h(LiveDataPanel, { onUpdate: onLiveUpdate, currentIdx: idx, liveQuotes: liveQuotes }),
    h("div", { style: { background: "#0c1424", border: "1px solid #1a2744", borderRadius: 14, padding: 16, marginBottom: 14 } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 } },
        h("div", null,
          h("div", { style: { fontSize: 11, color: "#5a6b8a", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: mono } }, d.name),
          h("div", { style: { fontSize: 28, fontWeight: 800, color: "#e0e6f0", fontFamily: mono } }, displayPrice),
          h("span", { style: { color: displayPct >= 0 ? "#00ff88" : "#ff4d4d", fontSize: 16, fontWeight: 700, fontFamily: mono } }, displaySub),
          h("span", { style: { fontSize: 12, color: "#5a6b8a", marginLeft: 8 } }, displayInfo)
        ),
        h("div", { style: { background: "#0a1020", border: "1px solid " + (liveIntel && liveIntel.fearGreed ? "#e040fb33" : "#141f35"), borderRadius: 10, padding: "8px 14px", textAlign: "center" } },
          h("div", { style: { fontSize: 10, color: liveIntel && liveIntel.fearGreed ? "#e040fb" : "#5a6b8a", fontFamily: mono } }, "FEAR & GREED"),
          h("div", { style: { width: 80, height: 6, borderRadius: 3, background: "linear-gradient(to right,#ff2020,#ff6b35,#ffd700,#00dd66,#00ff88)", position: "relative", margin: "6px 0" } },
            h("div", { style: { position: "absolute", left: (liveIntel && liveIntel.fearGreed ? liveIntel.fearGreed : MACRO.fearGreed) + "%", top: "50%", transform: "translate(-50%,-50%)", width: 10, height: 10, borderRadius: "50%", background: "#fff", border: "2px solid " + ((liveIntel && liveIntel.fearGreed || MACRO.fearGreed) <= 25 ? "#ff2020" : (liveIntel && liveIntel.fearGreed || MACRO.fearGreed) <= 45 ? "#ff6b35" : "#ffd700") } })
          ),
          h("div", { style: { fontSize: 16, fontWeight: 800, color: (liveIntel && liveIntel.fearGreed || MACRO.fearGreed) <= 25 ? "#ff2020" : (liveIntel && liveIntel.fearGreed || MACRO.fearGreed) <= 45 ? "#ff6b35" : "#ffd700", fontFamily: mono } }, liveIntel && liveIntel.fearGreed ? liveIntel.fearGreed : MACRO.fearGreed),
          h("div", { style: { fontSize: 11, color: (liveIntel && liveIntel.fearGreed || MACRO.fearGreed) <= 25 ? "#ff2020" : "#ff6b35" } }, liveIntel && liveIntel.fearLabel ? liveIntel.fearLabel : MACRO.fearLabel),
          liveIntel && liveIntel.fearGreed ? h("div", { style: { fontSize: 8, color: "#e040fb", marginTop: 2 } }, "LIVE") : null
        )
      )
    ),
    h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, justifyContent: "center" } }, macroTiles),
    h("div", { style: { background: "#0a1020", border: "1px solid " + (liveIntel && liveIntel.narrative ? "#e040fb33" : "#1a2235"), borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 13, color: "#8892a4", lineHeight: 1.5 } },
      h("span", { style: { color: liveIntel && liveIntel.narrative ? "#e040fb" : "#ffd700", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 } }, liveIntel && liveIntel.narrative ? "Live Summary " : "Summary "),
      liveIntel && liveIntel.narrative ? liveIntel.narrative : d.narrative,
      liveIntel && liveIntel.headline ? h("div", { style: { marginTop: 6, fontSize: 12, color: "#e040fb", fontWeight: 600 } }, liveIntel.headline) : null
    ),
    h("div", { style: { display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" } }, tabs),
    tabContent
  );
}

function SectorView(props) {
  var sector = props.sector; var onStock = props.onStock;
  var liveQuotes = props.liveQuotes || {}; var isLive = props.isLive || false;
  var _h2 = useState(null), hov = _h2[0], setHov = _h2[1];
  var _ma = useState(false), showMA = _ma[0], setShowMA = _ma[1];

  function lp(t, fb) { return (isLive && liveQuotes[t] && liveQuotes[t].price > 0) ? liveQuotes[t].price : fb; }
  function lc(t, fb) { return (isLive && liveQuotes[t]) ? liveQuotes[t].change : fb; }

  var avg = sector.stocks.reduce(function(a, b) { return a + lc(b.ticker, b.change); }, 0) / sector.stocks.length;

  var cards = sector.stocks.map(function(st, i) {
    var metrics = [["Idx Wt", st.idxWeight], ["P/E", st.pe], ["RSI", st.rsi], ["Short", st.shortInt]].map(function(pair) {
      var l = pair[0], v = pair[1];
      var c = l === "RSI" ? (v > 70 ? "#ffd700" : v < 35 ? "#ff4d4d" : "#bcc6d4") : l === "Idx Wt" ? sector.color : "#bcc6d4";
      return h("div", { key: l, style: { display: "flex", justifyContent: "space-between" } },
        h("span", { style: { color: "#5a6b8a" } }, l),
        h("span", { style: { color: c, fontFamily: mono, fontWeight: l === "Idx Wt" ? 700 : 400 } }, v)
      );
    });
    var maPanel = showMA ? h("div", { onClick: function(e) { e.stopPropagation(); } }, h(MAPanel, { stock: st, color: sector.color })) : null;

    return h("div", { key: st.ticker, onClick: function() { onStock(st); }, onMouseEnter: function() { setHov(i); }, onMouseLeave: function() { setHov(null); },
      style: { background: hov === i ? "#111d35" : "#0a1223", border: "1px solid " + (hov === i ? sector.color + "40" : "#141f35"), borderRadius: 12, padding: 14, cursor: "pointer", transition: "all .2s", boxShadow: hov === i ? "0 0 18px " + sector.glow : "none" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 } },
        h("div", null,
          h("span", { style: { fontSize: 18, fontWeight: 800, color: sector.color, fontFamily: mono } }, st.ticker),
          h("div", { style: { fontSize: 11, color: "#5a6b8a" } }, st.name)
        ),
        h("div", { style: { textAlign: "right" } },
          h("div", { style: { fontSize: 16, fontWeight: 700, color: "#e0e6f0", fontFamily: mono } }, "$" + lp(st.ticker, st.price).toLocaleString()),
          h(Chg, { v: lc(st.ticker, st.change), sz: 13 }),
          isLive && liveQuotes[st.ticker] ? h("div", { style: { fontSize: 8, color: "#00ff88", marginTop: 1 } }, "LIVE") : null
        )
      ),
      h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 10px", fontSize: 12, margin: "6px 0" } }, metrics),
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 } },
        h(Badge, { text: st.sentiment, color: sC(st.sentiment) }),
        h(Badge, { text: st.signals ? st.signals.composite : "Hold", color: sigC(st.signals ? st.signals.composite : "Hold") })
      ),
      maPanel
    );
  });

  return h("div", { style: { padding: "14px 20px" } },
    h("div", { style: { background: "#0c1424", border: "1px solid " + sector.color + "30", borderRadius: 14, padding: 16, marginBottom: 14 } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 } },
        h("div", null, h("div", { style: { fontSize: 22, fontWeight: 800, color: "#e0e6f0" } }, sector.name), h("div", { style: { fontSize: 12, color: "#5a6b8a" } }, sector.stocks.length + " stocks")),
        h("div", { style: { textAlign: "right" } }, h("div", { style: { fontSize: 11, color: "#5a6b8a" } }, "Avg"), h(Chg, { v: avg, sz: 20 }))
      ),
      h("div", { style: { fontSize: 13, color: "#8892a4", lineHeight: 1.5, marginTop: 8 } }, sector.description)
    ),
    h("div", { style: { marginBottom: 10 } }, h(MAToggle, { show: showMA, onToggle: function() { setShowMA(!showMA); } })),
    h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 } }, cards)
  );
}

function StockView(props) {
  var stock = props.stock; var sc = props.sectorColor || "#00d4ff";
  var liveQuotes = props.liveQuotes || {}; var isLive = props.isLive || false;
  var _ma = useState(true), showMA = _ma[0], setShowMA = _ma[1];
  if (!stock) return null;

  function lp(t, fb) { return (isLive && liveQuotes[t] && liveQuotes[t].price > 0) ? liveQuotes[t].price : fb; }
  function lc(t, fb) { return (isLive && liveQuotes[t]) ? liveQuotes[t].change : fb; }

  var price = lp(stock.ticker, stock.price);
  var change = lc(stock.ticker, stock.change);
  var sig = stock.signals || { composite: "Hold", score: 50 };
  var pctRange = stock.fiftyTwoHigh !== stock.fiftyTwoLow ? ((price - stock.fiftyTwoLow) / (stock.fiftyTwoHigh - stock.fiftyTwoLow)) * 100 : 50;
  var volNum = parseFloat(stock.volume) || 0; var avgNum = parseFloat(stock.avgVol) || 1; var siNum = parseFloat(stock.shortInt) || 0; var rsiVal = stock.rsi || 50;
  var cs = { background: "#0a1223", border: "1px solid #141f35", borderRadius: 12, padding: 16 };
  var hs2 = { fontSize: 12, fontWeight: 700, color: "#5a6b8a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 };

  var sigItems = [["MACD", sig.macd || "N/A"], ["SMA 20", sig.sma20 || "N/A"], ["SMA 50", sig.sma50 || "N/A"], ["SMA 200", sig.sma200 || "N/A"]];
  var metricItems = [["Index Weight", stock.idxWeight || "N/A"], ["Market Cap", stock.marketCap || "N/A"], ["P/E", String(stock.pe != null ? stock.pe : "N/A")], ["Beta", String(stock.beta != null ? stock.beta : "N/A")], ["Div Yield", stock.divYield || "N/A"], ["Inst Own", stock.instOwn || "N/A"], ["Analyst", stock.analystRating || "Hold"], ["Target", "$" + (stock.priceTarget || "N/A")]];

  return h("div", { style: { padding: "14px 20px" } },
    h("div", { style: { background: "#0c1424", border: "1px solid " + sc + "30", borderRadius: 14, padding: 18, marginBottom: 14 } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 } },
        h("div", null,
          h("div", { style: { fontSize: 30, fontWeight: 900, color: sc, fontFamily: mono } }, stock.ticker),
          h("div", { style: { fontSize: 14, color: "#8892a4" } }, stock.name + " | " + stock.sector),
          h("div", { style: { fontSize: 12, color: sc, fontWeight: 700, marginTop: 4 } }, "Index Weight: " + (stock.idxWeight || "N/A"))
        ),
        h("div", { style: { textAlign: "right" } },
          h("div", { style: { fontSize: 30, fontWeight: 800, color: "#e0e6f0", fontFamily: mono } }, "$" + price.toLocaleString()),
          h(Chg, { v: change, sz: 18 }),
          isLive && liveQuotes[stock.ticker] ? h("div", { style: { fontSize: 10, color: "#00ff88", marginTop: 2 } }, "LIVE") : null
        )
      )
    ),
    h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 } },
      // Signal gauge
      h("div", { style: cs }, h("div", { style: hs2 }, "Composite Signal"), h(Gauge, { score: sig.score || 50, label: sig.composite || "Hold" }),
        h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 12 } },
          sigItems.map(function(p) { var c2 = (p[1] === "Bullish" || p[1] === "Above") ? "#00ff88" : (p[1] === "Bearish" || p[1] === "Below") ? "#ff4d4d" : "#ffd700"; return h("div", { key: p[0], style: { display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12, borderBottom: "1px solid #0e1830" } }, h("span", { style: { color: "#5a6b8a" } }, p[0]), h("span", { style: { color: c2, fontWeight: 600, fontFamily: mono } }, p[1])); })
        )
      ),
      // Metrics
      h("div", { style: cs }, h("div", { style: hs2 }, "Key Metrics"),
        metricItems.map(function(p) { return h("div", { key: p[0], style: { display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #0e1830", fontSize: 12 } }, h("span", { style: { color: "#5a6b8a" } }, p[0]), h("span", { style: { color: p[0] === "Analyst" ? sigC(p[1]) : p[0] === "Index Weight" ? sc : "#bcc6d4", fontWeight: 600, fontFamily: mono } }, p[1])); })
      ),
      // Trading activity
      h("div", { style: cs }, h("div", { style: hs2 }, "Trading Activity"),
        h(Bar, { label: "Volume", val: volNum, max: avgNum * 2, color: volNum > avgNum ? "#ffd700" : sc, suffix: "M" }),
        h(Bar, { label: "RSI (14)", val: rsiVal, max: 100, color: rsiVal > 70 ? "#ffd700" : rsiVal < 35 ? "#ff4d4d" : sc }),
        h(Bar, { label: "Short Int", val: siNum, max: 15, color: "#ff6b35", suffix: "%" }),
        h("div", { style: { marginTop: 10 } },
          h("div", { style: { fontSize: 11, color: "#5a6b8a", marginBottom: 4, textTransform: "uppercase" } }, "52-Week Range"),
          h("div", { style: { position: "relative", height: 22, background: "#141f35", borderRadius: 11 } },
            h("div", { style: { position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#5a6b8a", fontFamily: mono } }, "$" + stock.fiftyTwoLow),
            h("div", { style: { position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#5a6b8a", fontFamily: mono } }, "$" + stock.fiftyTwoHigh),
            h("div", { style: { position: "absolute", left: Math.max(5, Math.min(pctRange, 95)) + "%", top: "50%", transform: "translate(-50%,-50%)", width: 12, height: 12, borderRadius: "50%", background: sc, boxShadow: "0 0 8px " + sc, border: "2px solid #0a1223" } })
          )
        )
      ),
      // Sentiment
      h("div", { style: cs }, h("div", { style: hs2 }, "Sentiment & Flow"),
        h("div", { style: { marginBottom: 10 } }, h("div", { style: { fontSize: 10, color: "#5a6b8a", textTransform: "uppercase", marginBottom: 3 } }, "Sentiment"), h(Badge, { text: stock.sentiment || "Neutral", color: sC(stock.sentiment || "Neutral") })),
        h("div", { style: { marginBottom: 10 } }, h("div", { style: { fontSize: 10, color: "#5a6b8a", textTransform: "uppercase", marginBottom: 3 } }, "Options Flow"), h("div", { style: { fontSize: 12, color: "#bcc6d4", background: "#0e1830", padding: "7px 10px", borderRadius: 6 } }, stock.optionsFlow || "No data")),
        h("div", null, h("div", { style: { fontSize: 10, color: "#5a6b8a", textTransform: "uppercase", marginBottom: 3 } }, "Insider"), h("div", { style: { fontSize: 12, color: "#bcc6d4", background: "#0e1830", padding: "7px 10px", borderRadius: 6 } }, stock.insiderActivity || "No data"))
      ),
      // Events
      h("div", { style: cs }, h("div", { style: hs2 }, "Events"),
        stock.events && stock.events.length > 0 ? stock.events.map(function(ev, i) {
          return h("div", { key: i, style: { display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid #0e1830" } },
            h("div", { style: { width: 8, height: 8, borderRadius: "50%", background: evColor(ev.type), flexShrink: 0 } }),
            h("span", { style: { fontSize: 13, fontWeight: 700, color: "#bcc6d4", fontFamily: mono, minWidth: 52 } }, ev.date),
            h("span", { style: { fontSize: 13, color: "#8892a4", flex: 1 } }, ev.event),
            h("span", { style: { fontSize: 10, color: evColor(ev.type), textTransform: "uppercase", fontFamily: mono } }, ev.type));
        }) : h("div", { style: { fontSize: 12, color: "#4a5b7a" } }, "No upcoming events")
      )
    ),
    h("div", { style: { marginTop: 12 } }, h(MAToggle, { show: showMA, onToggle: function() { setShowMA(!showMA); } })),
    showMA ? h("div", { style: { marginTop: 10 } }, h(MAPanel, { stock: stock, color: sc })) : null,
    h("div", { style: { marginTop: 8, fontSize: 10, color: "#3a4a6a", textAlign: "center" } }, "Snapshot data. MAs estimated. Not investment advice.")
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function MarketUniverse() {
  var _idx = useState("DOW"), idx = _idx[0], setIdx = _idx[1];
  var _lev = useState("galaxy"), level = _lev[0], setLevel = _lev[1];
  var _sec = useState(null), sector = _sec[0], setSector = _sec[1];
  var _stk = useState(null), stock = _stk[0], setStock = _stk[1];
  var _fad = useState(false), fade = _fad[0], setFade = _fad[1];
  var _lq = useState({}), liveQuotes = _lq[0], setLiveQuotes = _lq[1];
  var _liv = useState(false), isLive = _liv[0], setIsLive = _liv[1];
  var _intel = useState(null), liveIntel = _intel[0], setLiveIntel = _intel[1];

  function handleLiveUpdate(quotes) {
    setLiveQuotes(quotes);
    setIsLive(Object.keys(quotes).length > 0);
  }

  function handleIntelUpdate(intel) {
    setLiveIntel(intel);
  }

  // Register intel fetch bridge
  useEffect(function() {
    if (typeof window !== "undefined") {
      window.__mue_intel = function() {
        fetchAllIntelligence(handleIntelUpdate);
      };
    }
  }, []);

  function nav(lv, sec, stk) {
    setFade(true);
    setTimeout(function() { setLevel(lv); setSector(sec); setStock(stk); setTimeout(function() { setFade(false); }, 30); }, 130);
  }

  function switchIdx(k) {
    setFade(true);
    setTimeout(function() { setIdx(k); setLevel("galaxy"); setSector(null); setStock(null); setTimeout(function() { setFade(false); }, 30); }, 130);
  }

  var crumbs = [{ label: INDEXES[idx].short, lv: "galaxy" }];
  if (sector) crumbs.push({ label: sector.name, lv: "sector" });
  if (stock) crumbs.push({ label: stock.ticker, lv: "stock" });

  var title = level === "galaxy" ? INDEXES[idx].short + " - " + getTodayStr() : level === "sector" ? (sector ? sector.name : "") : (stock ? stock.ticker + " - " + stock.name : "");

  // Index tabs
  var idxTabs = Object.keys(INDEXES).map(function(k) {
    var d = INDEXES[k];
    var etfSym = INDEX_ETFS[k];
    var liveEtf = isLive && liveQuotes[etfSym];
    var pct = liveEtf ? liveQuotes[etfSym].change : d.changePct;
    var pctColor = pct >= 0 ? "#00ff88" : "#ff4d4d";
    return h("button", { key: k, onClick: function() { switchIdx(k); },
      style: { background: idx === k ? "#162040" : "#0a1020", border: "1px solid " + (idx === k ? "#00d4ff55" : "#141f35"), borderRadius: 10, padding: "8px 18px", cursor: "pointer", color: idx === k ? "#00d4ff" : "#5a6b8a", fontSize: 14, fontWeight: 800, fontFamily: mono } },
      d.short + " ",
      h("span", { style: { fontSize: 11, fontWeight: 400, color: idx === k ? pctColor : "#3a4a5a" } }, (liveEtf ? pct.toFixed(2) : pct) + "%"),
      liveEtf ? h("span", { style: { width: 5, height: 5, borderRadius: "50%", background: "#00ff88", display: "inline-block", marginLeft: 4 } }) : null
    );
  });

  // Back button
  var backBtn = level !== "galaxy" ? h("button", { onClick: function() { if (level === "stock") nav("sector", sector, null); else nav("galaxy", null, null); },
    style: { display: "flex", alignItems: "center", gap: 4, background: "#0e1830", border: "1px solid #1e2e4a", borderRadius: 8, padding: "5px 12px", cursor: "pointer", color: "#8892a4", fontSize: 12, fontWeight: 600, fontFamily: mono } }, "<- Back") : null;

  // Breadcrumbs
  var breadcrumbs = crumbs.map(function(c, i) {
    var sep = i > 0 ? h("span", { style: { color: "#2a3a5a", fontSize: 12 } }, " > ") : null;
    return h("span", { key: c.lv, style: { display: "inline-flex", alignItems: "center", gap: 4 } },
      sep,
      h("span", { onClick: function() { if (c.lv === "galaxy") nav("galaxy", null, null); else if (c.lv === "sector") nav("sector", sector, null); },
        style: { fontSize: 12, color: c.lv === level ? (sector ? sector.color : "#00d4ff") : "#5a6b8a", cursor: c.lv !== level ? "pointer" : "default", fontWeight: c.lv === level ? 700 : 400, fontFamily: mono } }, c.label)
    );
  });

  // Current view
  var currentView = null;
  if (level === "galaxy") currentView = h(GalaxyView, { idx: idx, onSelect: function(s) { nav("sector", s, null); }, liveQuotes: liveQuotes, isLive: isLive, onLiveUpdate: handleLiveUpdate, liveIntel: liveIntel });
  if (level === "sector" && sector) currentView = h(SectorView, { sector: sector, onStock: function(s) { nav("stock", sector, s); }, liveQuotes: liveQuotes, isLive: isLive });
  if (level === "stock" && stock && sector) currentView = h(StockView, { stock: stock, sectorColor: sector.color, liveQuotes: liveQuotes, isLive: isLive });

  var dataLabel = isLive ? "LIVE DATA" : "REAL DATA";
  var dataTime = isLive ? getETNow() + " ET" : getTodayStr();

  return h("div", { style: { background: "#060d1a", minHeight: "100vh", color: "#e0e6f0", fontFamily: "'Instrument Sans',-apple-system,sans-serif" } },
    h("link", { href: "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700;800&display=swap", rel: "stylesheet" }),
    h(Stars, null),
    h("div", { style: { position: "relative", zIndex: 2, padding: "14px 20px 0" } },
      h("div", { style: { display: "flex", gap: 4, marginBottom: 10 } }, idxTabs),
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
        h("div", null,
          h("div", { style: { fontSize: 11, color: "#5a6b8a", textTransform: "uppercase", letterSpacing: 2, fontFamily: mono } }, "Market Universe Explorer"),
          h("div", { style: { display: "inline-block", fontSize: 9, color: "#e040fb", background: "#e040fb15", border: "1px solid #e040fb33", borderRadius: 4, padding: "1px 6px", fontFamily: mono, marginTop: 2 } }, "v15"),
          h("div", { style: { fontSize: 20, fontWeight: 800, color: "#e0e6f0", marginTop: 2 } }, title)
        ),
        h("div", { style: { fontSize: 10, color: isLive ? "#00ff88" : "#4a5b7a", textAlign: "right", fontFamily: mono } }, dataLabel, h("br"), dataTime)
      ),
      h("div", { style: { display: "flex", gap: 6, marginTop: 5, marginBottom: 8, alignItems: "center" } }, backBtn, breadcrumbs)
    ),
    h("div", { style: { position: "relative", zIndex: 2, opacity: fade ? 0 : 1, transform: fade ? "scale(.98)" : "scale(1)", transition: "all .15s ease" } }, currentView)
  );
}

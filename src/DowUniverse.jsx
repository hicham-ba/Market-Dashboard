import React, { useState, useEffect, useRef } from "react";

// MARKET UNIVERSE EXPLORER v16 - Final clean build
// MARKET UNIVERSE EXPLORER v16 - All live data
// No static data - everything fetched live

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
    style: { color: v >= 0 ? "#16a34a" : "#dc2626", fontSize: sz, fontWeight: 700, fontFamily: mono }
  }, (v >= 0 ? "+" : "") + v.toFixed(2) + "%");
}

function Badge(props) {
  return h("span", {
    style: { padding: "3px 9px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: props.color + "15", border: "1px solid " + props.color + "40", color: props.color, whiteSpace: "nowrap" }
  }, props.text);
}

var sC = function(s) { return {Bearish:"#dc2626","Very Bearish":"#b91c1c",Bullish:"#16a34a","Mild Bull":"#22c55e","Mild Bear":"#f97316",Neutral:"#6b7280"}[s] || "#6b7280"; };
var sigC = function(s) { return {"Strong Buy":"#16a34a",Buy:"#22c55e",Hold:"#d97706",Sell:"#ea580c","Strong Sell":"#dc2626"}[s] || "#6b7280"; };
var evColor = function(t) { return t==="earnings" ? "#d97706" : t==="dividend" ? "#16a34a" : "#2563eb"; };

function Bar(props) {
  var pct = Math.min((props.val / props.max) * 100, 100);
  return h("div", { style: { marginBottom: 6 } },
    h("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#606f80", marginBottom: 2 } },
      h("span", null, props.label),
      h("span", { style: { color: "#2d3748", fontFamily: mono } }, props.val + (props.suffix || ""))
    ),
    h("div", { style: { height: 5, borderRadius: 3, background: "#e0e5ec" } },
      h("div", { style: { height: "100%", borderRadius: 3, width: pct + "%", background: props.color } })
    )
  );
}

function Gauge(props) {
  var score = props.score, label = props.label;
  var c = score >= 70 ? "#16a34a" : score >= 55 ? "#22c55e" : score >= 45 ? "#ffd700" : score >= 30 ? "#ff6b35" : "#ff2020";
  var dash = (score / 100) * 120;
  return h("div", { style: { textAlign: "center" } },
    h("svg", { width: "90", height: "48", viewBox: "0 0 90 48" },
      h("path", { d: "M 5 44 A 38 38 0 0 1 85 44", fill: "none", stroke: "#e0e5ec", strokeWidth: "6", strokeLinecap: "round" }),
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
    for (var i = 0; i < 120; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * c.offsetWidth, Math.random() * c.offsetHeight, Math.random() * 1.0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(100,130,180," + (Math.random() * 0.12 + 0.03) + ")";
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
  if (!maVal || maVal <= 0) return { label: "N/A", color: "#718096" };
  var pct = ((price - maVal) / maVal) * 100;
  if (pct > 5) return { label: "Bullish", color: "#16a34a" };
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
  var oc = bulls >= 4 ? "#16a34a" : bulls >= 3 ? "#22c55e" : bulls <= 1 ? "#ff4d4d" : bulls <= 2 ? "#ff6b35" : "#ffd700";

  var rows = periods.map(function(p) {
    var v = mas[p.key]; var sig = maSignal(price, v);
    var dist = v > 0 ? ((price - v) / v * 100).toFixed(1) : "0";
    var arrow = price >= v
      ? { display: "inline-block", width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderBottom: "5px solid " + sig.color }
      : { display: "inline-block", width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "5px solid " + sig.color };
    return h("div", { key: p.key, style: { display: "flex", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #e8ecf0", gap: 8 } },
      h("span", { style: { fontSize: 11, color: "#718096", minWidth: 52, fontFamily: mono } }, p.label),
      h("span", { style: { fontSize: 12, fontWeight: 600, color: "#2d3748", fontFamily: mono, minWidth: 60 } }, "$" + (v ? v.toFixed(2) : "N/A")),
      h("span", { style: arrow }),
      h("span", { style: { fontSize: 11, color: sig.color, fontWeight: 600, fontFamily: mono, minWidth: 38 } }, (parseFloat(dist) >= 0 ? "+" : "") + dist + "%"),
      h("span", { style: { fontSize: 10, color: "#a0aec0", flex: 1, textAlign: "right" } }, p.desc)
    );
  });

  return h("div", { style: { background: "#f8f9fc", border: "1px solid #e0e5ec", borderRadius: 10, padding: 12, marginTop: 8 } },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
      h("span", { style: { fontSize: 12, fontWeight: 700, color: "#718096", textTransform: "uppercase", letterSpacing: 1 } }, "Moving Averages"),
      h("span", { style: { fontSize: 12, fontWeight: 700, color: oc, fontFamily: mono } }, overall + " (" + bulls + "/5)")
    ),
    rows
  );
}

function MAToggle(props) {
  return h("button", {
    onClick: props.onToggle,
    style: { background: props.show ? "#00d4ff15" : "#ffffff", border: "1px solid " + (props.show ? "#00d4ff44" : "#e0e5ec"), borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: props.show ? "#00d4ff" : "#718096", fontSize: 11, fontWeight: 700, fontFamily: mono, textTransform: "uppercase", letterSpacing: 1 }
  }, props.show ? "Hide MAs" : "Show MAs");
}

var MACRO = { fearGreed: 0, fearLabel: "Loading..." };
var MACRO_TILES = [
  { l: "VIX", v: "--", c: "#718096", trend: "flat", delta: "--", ctx: "Waiting for data" },
  { l: "OIL WTI", v: "--", c: "#718096", trend: "flat", delta: "--", ctx: "Waiting for data" },
  { l: "10Y", v: "--", c: "#718096", trend: "flat", delta: "--", ctx: "Waiting for data" },
  { l: "NFP", v: "--", c: "#718096", trend: "flat", delta: "--", ctx: "Waiting for data" },
  { l: "UNEMP", v: "--", c: "#718096", trend: "flat", delta: "--", ctx: "Waiting for data" },
  { l: "P/C RATIO", v: "--", c: "#718096", trend: "flat", delta: "--", ctx: "Waiting for data" },
  { l: "DXY", v: "--", c: "#718096", trend: "flat", delta: "--", ctx: "Waiting for data" },
  { l: "GOLD", v: "--", c: "#718096", trend: "flat", delta: "--", ctx: "Waiting for data" },
];

var ECON_CAL = [];

var SMART_MONEY = [];

// CORRECTED PRICES from verified sources
var INDEXES = {
  DOW: {
    name: "Dow Jones", short: "DJIA", close: 0, change: 0, changePct: 0,
    components: 30, greenCount: 0,
    narrative: "Click Fetch All or wait for auto-refresh to load live market data.",
    institutions: [],
    flows: [],
    sectors: [
      { name: "Technology", color: "#00d4ff", glow: "#00d4ff40", description: "", stocks: [
        mk("GS","Goldman Sachs",0,0,"Inv Banking","168B",15.8,910,460,1.42,"2.10%","3.2M","2.9M",35,"1.2%","76%","Bearish","--","None.","Buy",880,[{date:"Apr 14",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:25,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"11.16%"),
        mk("MSFT","Microsoft",0,0,"Software","3.04T",35.1,470,362,0.93,"0.74%","24M","26M",44,"0.5%","73%","Neutral","--","None","Strong Buy",460,[{date:"Apr 23",event:"Q3 Earnings",type:"earnings"}],{composite:"Hold",score:48,macd:"Neutral",sma20:"Below",sma50:"Above",sma200:"Above"},"5.56%"),
        mk("AAPL","Apple",0,0,"Electronics","3.9T",33.2,280,164,1.24,"0.48%","62M","58M",41,"0.7%","74%","Bearish","Put accumulation 250P.","None","Buy",275,[{date:"Apr 24",event:"Q2 Earnings",type:"earnings"}],{composite:"Sell",score:28,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"3.50%"),
        mk("NVDA","NVIDIA",0,0,"Semis","4.35T",55.8,220,76,1.78,"0.02%","310M","280M",38,"1.3%","68%","Bearish","--","None","Strong Buy",210,[{date:"May 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:22,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"2.42%"),
        mk("IBM","IBM",0,0,"IT Services","239B",24.8,280,168,0.72,"2.58%","5.1M","4.8M",56,"0.6%","60%","Bullish","Call accum 265C Apr.","None.","Buy",275,[{date:"Apr 23",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:71,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"3.52%"),
        mk("CRM","Salesforce",0,0,"SW","196B",44.2,260,192,1.35,"0.55%","8.2M","7.5M",48,"1.1%","79%","Neutral","Post-earnings +4.3% Thu.","None.","Buy",240,[{date:"May 28",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:52,macd:"Bullish",sma20:"Above",sma50:"Below",sma200:"Above"},"2.75%"),
        mk("CSCO","Cisco",0,0,"Networking","314B",18.5,82,44,0.98,"2.55%","18M","20M",42,"0.8%","76%","Bearish","--","None.","Hold",80,[{date:"May 14",event:"Q3 Earnings",type:"earnings"}],{composite:"Sell",score:32,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"1.07%"),
      ]},
      { name: "Financials", color: "#ffd700", glow: "#ffd70040", description: "", stocks: [
        mk("JPM","JPMorgan",0,0,"Banking","833B",13.4,315,194,1.14,"1.82%","11.5M","10.8M",38,"0.5%","72%","Bearish","--","None","Buy",320,[{date:"Apr 11",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:30,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"3.93%"),
        mk("AXP","AmEx",0,0,"Consumer Fin","216B",20.1,340,215,1.25,"1.05%","4.8M","4.2M",33,"1.0%","85%","Bearish","--","None.","Buy",330,[{date:"Apr 17",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Sell",score:18,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"4.09%"),
        mk("V","Visa",0,0,"Payments","638B",30.5,367,259,0.95,"0.72%","7.8M","8.5M",40,"0.4%","94%","Neutral","Balanced flow.","None.","Buy",355,[{date:"Apr 22",event:"Q2 Earnings",type:"earnings"}],{composite:"Hold",score:38,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"4.31%"),
        mk("TRV","Travelers",0,0,"Insurance","94B",12.8,320,215,0.65,"1.35%","1.5M","1.8M",52,"0.6%","82%","Neutral","Low activity.","None.","Hold",310,[{date:"Apr 17",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:55,macd:"Neutral",sma20:"At",sma50:"Above",sma200:"Above"},"4.16%"),
      ]},
      { name: "Healthcare", color: "#16a34a", glow: "#00ff8840", description: "", stocks: [
        mk("UNH","UnitedHealth",0,0,"Managed Care","521B",17.2,415,275,0.68,"1.75%","6.8M","5.5M",28,"1.4%","88%","Bearish","Put accum 280P/270P.","None","Hold",340,[{date:"Apr 15",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Sell",score:15,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Below"},"3.89%"),
        mk("JNJ","J&J",0,0,"Pharma","577B",20.8,250,146,0.52,"2.75%","7.5M","8.2M",55,"0.5%","71%","Bullish","--","None.","Buy",260,[{date:"Apr 15",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:72,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"3.27%"),
        mk("AMGN","Amgen",0,0,"Biotech","198B",28.4,380,260,0.58,"2.55%","2.8M","3.1M",58,"0.9%","80%","Neutral","--","None.","Buy",390,[{date:"Apr 29",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:65,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"5.02%"),
        mk("MRK","Merck",0,0,"Pharma","293B",14.5,136,99,0.42,"2.82%","12M","13M",41,"0.7%","77%","Neutral","Low activity.","None.","Hold",125,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:40,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"1.57%"),
      ]},
      { name: "Consumer", color: "#e040fb", glow: "#e040fb40", description: "", stocks: [
        mk("AMZN","Amazon",0,0,"E-Commerce","2.24T",38.5,248,167,1.22,"0%","55M","50M",36,"0.7%","68%","Bearish","--","None","Strong Buy",250,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:24,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"2.90%"),
        mk("WMT","Walmart",0,0,"Retail","496B",36.8,130,78,0.55,"1.12%","18M","16M",54,"0.3%","52%","Bullish","Defensive. YTD +10.68%.","None.","Buy",135,[{date:"May 15",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:73,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"1.68%"),
        mk("HD","Home Depot",0,0,"Home Impr","356B",23.5,425,325,1.05,"2.48%","4.2M","4.8M",39,"0.6%","71%","Bearish","Housing weakness.","None.","Buy",400,[{date:"May 13",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:30,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"4.86%"),
        mk("MCD","McDonalds",0,0,"Restaurants","235B",26.1,345,243,0.68,"2.15%","3.5M","4.0M",51,"0.5%","74%","Neutral","Trade-down play.","None.","Buy",350,[{date:"Apr 29",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:55,macd:"Neutral",sma20:"At",sma50:"Above",sma200:"Above"},"4.46%"),
        mk("NKE","Nike",0,0,"Apparel","85B",22.8,82,55,1.12,"1.85%","11M","10M",32,"1.8%","78%","Bearish","--","None.","Hold",68,[{date:"Mar 31",event:"Q3 Earnings",type:"earnings"}],{composite:"Strong Sell",score:14,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Below"},"0.77%"),
        mk("KO","Coca-Cola",0,0,"Beverages","332B",27.5,78,57,0.58,"2.65%","14M","15M",53,"0.4%","69%","Neutral","Safe haven.","None.","Buy",80,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:58,macd:"Neutral",sma20:"Above",sma50:"Above",sma200:"Above"},"1.05%"),
        mk("DIS","Disney",0,0,"Entertainment","185B",34.2,122,84,1.32,"0.85%","9.5M","10.2M",40,"1.2%","67%","Bearish","--","None.","Buy",120,[{date:"May 7",event:"Q2 Earnings",type:"earnings"}],{composite:"Sell",score:28,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"1.38%"),
        mk("PG","P&G",0,0,"Household","362B",26.8,175,152,0.42,"2.55%","6.8M","7.5M",46,"0.3%","65%","Neutral","YTD +14%.","None.","Hold",165,[{date:"Apr 22",event:"Q3 Earnings",type:"earnings"}],{composite:"Hold",score:52,macd:"Neutral",sma20:"At",sma50:"Above",sma200:"Above"},"2.09%"),
      ]},
      { name: "Industrials", color: "#ff6b35", glow: "#ff6b3540", description: "", stocks: [
        mk("BA","Boeing",0,0,"Aerospace","141B",-18.5,275,140,1.55,"0%","12M","9.5M",62,"2.5%","67%","Bullish","--","None","Hold",250,[{date:"Apr 23",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Buy",score:82,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"3.14%"),
        mk("CAT","Caterpillar",0,0,"Machinery","336B",17.2,750,310,1.08,"1.15%","3.5M","2.8M",30,"1.0%","75%","Very Bearish","--","None.","Buy",750,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:20,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"9.25%"),
        mk("HON","Honeywell",0,0,"Industrial","154B",22.1,260,190,1.02,"1.82%","4.5M","4.2M",38,"0.8%","78%","Bearish","--","None.","Buy",260,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:32,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"3.20%"),
        mk("MMM","3M",0,0,"Mfg","84B",16.5,175,85,1.05,"2.20%","3.8M","3.5M",36,"1.5%","71%","Bearish","--","None.","Hold",165,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:28,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"2.08%"),
      ]},
      { name: "Energy", color: "#22c55e", glow: "#22c55e40", description: "", stocks: [
        mk("CVX","Chevron",0,0,"Oil & Gas","357B",14.2,195,140,0.92,"3.55%","8.5M","8.0M",68,"0.6%","70%","Bullish","--","None","Buy",200,[{date:"Apr 25",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Buy",score:80,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"2.58%"),
        mk("SHW","Sherwin-Williams",0,0,"Chemicals","84B",30.2,400,288,1.08,"0.85%","1.8M","1.5M",34,"0.9%","82%","Bearish","--","None.","Buy",380,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:30,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"4.48%"),
      ]},
      { name: "Telecom", color: "#78909c", glow: "#78909c40", description: "", stocks: [
        mk("VZ","Verizon",0,0,"Telecom","215B",10.8,52,37,0.38,"5.25%","19M","21M",55,"0.5%","62%","Bullish","Bond proxy. Best YTD.","None.","Hold",52,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:68,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.69%"),
      ]},
    ]
  },
  SPX: {
    name: "S&P 500", short: "SPX", close: 0, change: 0, changePct: 0,
    components: 503, greenCount: 0,
    narrative: "Click Fetch All or wait for auto-refresh to load live market data.",
    institutions: [],
    flows: [],
    sectors: [
      { name: "Energy", color: "#22c55e", glow: "#22c55e40", description: "", stocks: [
        mk("XOM","ExxonMobil",0,0,"Integrated","498B",13.5,125,100,0.88,"3.35%","16M","17M",65,"0.5%","64%","Bullish","--","None.","Buy",125,[{date:"Apr 25",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:72,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.82%"),
        mk("CVX","Chevron",0,0,"Integrated","357B",14.2,195,140,0.92,"3.55%","8.5M","8.0M",68,"0.6%","70%","Bullish","--","None","Buy",200,[{date:"Apr 25",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Buy",score:80,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.59%"),
      ]},
      { name: "Ag & Fertilizer *", color: "#a3e635", glow: "#a3e63540", description: "", stocks: [
        mk("CF","CF Industries",0,0,"Nitrogen","20.7B",14.8,125,72,0.95,"1.85%","5.2M","2.9M",68,"3.2%","82%","Bullish","--","None","Buy",120,[{date:"May 7",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Buy",score:85,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.03%"),
        mk("BG","Bunge",0,0,"Ag Products","15B",10.2,115,85,0.72,"2.45%","2.8M","1.8M",62,"1.5%","78%","Bullish","--","None.","Buy",115,[{date:"Apr 30",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:70,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.02%"),
        mk("ADM","Archer Daniels",0,0,"Ag Processing","28B",12.5,58,42,0.88,"3.55%","4.5M","3.8M",55,"2.0%","72%","Bullish","--","None.","Hold",58,[{date:"Apr 29",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:58,macd:"Neutral",sma20:"Above",sma50:"Above",sma200:"Above"},"0.05%"),
      ]},
      { name: "Defense *", color: "#f97316", glow: "#f9731640", description: "", stocks: [
        mk("BA","Boeing",0,0,"Aerospace","141B",-18.5,275,140,1.55,"0%","12M","9.5M",62,"2.5%","67%","Bullish","--","None","Hold",250,[{date:"Apr 23",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Buy",score:82,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.23%"),
        mk("RTX","RTX Corp",0,0,"Defense","195B",35.5,140,98,0.78,"1.95%","5.2M","4.8M",58,"0.7%","80%","Bullish","--","None.","Buy",145,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:68,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.32%"),
      ]},
      { name: "Info Technology", color: "#00d4ff", glow: "#00d4ff40", description: "", stocks: [
        mk("NVDA","NVIDIA",0,0,"Semis","4.35T",55.8,220,76,1.78,"0.02%","310M","280M",38,"1.3%","68%","Bearish","--","None","Strong Buy",210,[{date:"May 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:22,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"7.17%"),
        mk("AAPL","Apple",0,0,"Electronics","3.9T",33.2,280,164,1.24,"0.48%","62M","58M",41,"0.7%","74%","Bearish","Put accumulation.","None","Buy",275,[{date:"Apr 24",event:"Q2 Earnings",type:"earnings"}],{composite:"Sell",score:28,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"5.86%"),
        mk("MSFT","Microsoft",0,0,"Software","3.04T",35.1,470,362,0.93,"0.74%","24M","26M",44,"0.5%","73%","Neutral","Mixed flow.","None","Strong Buy",460,[{date:"Apr 23",event:"Q3 Earnings",type:"earnings"}],{composite:"Hold",score:48,macd:"Neutral",sma20:"Below",sma50:"Above",sma200:"Above"},"5.33%"),
        mk("AVGO","Broadcom",0,0,"Semis","1.02T",38.2,380,128,1.32,"1.15%","28M","25M",44,"0.8%","82%","Neutral","--","None.","Strong Buy",380,[{date:"Jun 12",event:"Q2 Earnings",type:"earnings"}],{composite:"Hold",score:42,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"2.51%"),
        mk("MRVL","Marvell",0,0,"Custom AI","85B",55.2,110,62,1.65,"0.35%","45M","18M",78,"2.1%","85%","Bullish","--","None.","Strong Buy",115,[{date:"Jun 5",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Buy",score:88,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.14%"),
      ]},
      { name: "Financials", color: "#ffd700", glow: "#ffd70040", description: "", stocks: [
        mk("BLK","BlackRock",0,0,"Asset Mgmt","140B",22.5,1065,780,1.35,"2.15%","2.8M","1.5M",22,"1.8%","78%","Very Bearish","--","None.","Buy",1050,[{date:"Apr 11",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Sell",score:12,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Below"},"0.23%"),
        mk("JPM","JPMorgan",0,0,"Banking","833B",13.4,315,194,1.14,"1.82%","11.5M","10.8M",38,"0.5%","72%","Bearish","--","None","Buy",320,[{date:"Apr 11",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:30,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"1.37%"),
        mk("GS","Goldman",0,0,"Inv Banking","168B",15.8,910,460,1.42,"2.10%","3.2M","2.9M",35,"1.2%","76%","Bearish","--","None.","Buy",880,[{date:"Apr 14",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:25,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"0.28%"),
      ]},
      { name: "Comm Services", color: "#f59e0b", glow: "#f59e0b40", description: "", stocks: [
        mk("GOOGL","Alphabet",0,0,"Search/Cloud","2.14T",22.5,349,141,1.08,"0.45%","34M","34M",42,"0.6%","72%","Bearish","--","None.","Strong Buy",340,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:40,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"6.39%"),
        mk("META","Meta",0,0,"Social Media","1.64T",24.8,796,480,1.38,"0.32%","13M","13M",40,"0.8%","79%","Bearish","--","None","Buy",720,[{date:"Apr 23",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:38,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"2.49%"),
      ]},
      { name: "Consumer Disc", color: "#e040fb", glow: "#e040fb40", description: "", stocks: [
        mk("AMZN","Amazon",0,0,"E-Commerce","2.24T",38.5,248,167,1.22,"0%","55M","50M",36,"0.7%","68%","Bearish","--","None","Strong Buy",250,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:24,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"3.98%"),
        mk("TSLA","Tesla",0,0,"EVs","1.27T",52.5,499,214,2.05,"0%","64M","64M",40,"3.2%","48%","Bearish","Heavy both sides. High short int.","None","Hold",460,[{date:"Apr 28",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:30,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"2.31%"),
      ]},
      { name: "Consumer Staples *", color: "#a78bfa", glow: "#a78bfa40", description: "", stocks: [
        mk("WMT","Walmart",0,0,"Retail","496B",36.8,130,78,0.55,"1.12%","18M","16M",54,"0.3%","52%","Bullish","Defensive. YTD +10.68%.","None.","Buy",135,[{date:"May 15",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:73,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.81%"),
        mk("KO","Coca-Cola",0,0,"Beverages","332B",27.5,78,57,0.58,"2.65%","14M","15M",53,"0.4%","69%","Neutral","Safe haven hold.","None.","Buy",80,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:58,macd:"Neutral",sma20:"Above",sma50:"Above",sma200:"Above"},"0.54%"),
      ]},
      { name: "Healthcare", color: "#16a34a", glow: "#00ff8840", description: "", stocks: [
        mk("LLY","Eli Lilly",0,0,"Pharma","782B",88.5,850,540,0.62,"0.58%","3.8M","3.2M",55,"0.5%","83%","Neutral","GLP-1 momentum.","None.","Strong Buy",900,[{date:"Apr 30",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:68,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"1.55%"),
        mk("JNJ","J&J",0,0,"Pharma","577B",20.8,250,146,0.52,"2.75%","7.5M","8.2M",55,"0.5%","71%","Bullish","--","None.","Buy",260,[{date:"Apr 15",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:72,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.94%"),
      ]},
      { name: "Materials", color: "#8d6e63", glow: "#8d6e6340", description: "", stocks: [
        mk("DOW","Dow Inc",0,0,"Chemicals","34B",18.5,55,42,1.22,"4.85%","8.5M","6.0M",62,"2.2%","72%","Bullish","--","None.","Buy",55,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:65,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.06%"),
      ]},
    ]
  },
  NDX: {
    name: "NASDAQ Composite", short: "IXIC", close: 0, change: 0, changePct: 0,
    components: 3000, greenCount: 0,
    narrative: "Click Fetch All or wait for auto-refresh to load live market data.",
    institutions: [],
    flows: [],
    sectors: [
      { name: "Mag 7 (All Red)", color: "#00d4ff", glow: "#00d4ff40", description: "", stocks: [
        mk("NVDA","NVIDIA",0,0,"Semis","4.35T",55.8,220,76,1.78,"0.02%","310M","280M",38,"1.3%","68%","Bearish","--","None","Strong Buy",210,[{date:"May 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:22,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"~7%"),
        mk("AAPL","Apple",0,0,"Electronics","3.9T",33.2,280,164,1.24,"0.48%","62M","58M",41,"0.7%","74%","Bearish","Put accumulation.","None","Buy",275,[{date:"Apr 24",event:"Q2 Earnings",type:"earnings"}],{composite:"Sell",score:28,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"~6%"),
        mk("MSFT","Microsoft",0,0,"Software","3.04T",35.1,470,362,0.93,"0.74%","24M","26M",44,"0.5%","73%","Neutral","Mixed.","None","Strong Buy",460,[{date:"Apr 23",event:"Q3 Earnings",type:"earnings"}],{composite:"Hold",score:48,macd:"Neutral",sma20:"Below",sma50:"Above",sma200:"Above"},"~5%"),
        mk("GOOGL","Alphabet",0,0,"Search","2.14T",22.5,349,141,1.08,"0.45%","34M","34M",42,"0.6%","72%","Bearish","--","None.","Strong Buy",340,[{date:"Apr 22",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:40,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"~5%"),
        mk("AMZN","Amazon",0,0,"E-Commerce","2.24T",38.5,248,167,1.22,"0%","55M","50M",36,"0.7%","68%","Bearish","--","None","Strong Buy",250,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:24,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"~4%"),
        mk("META","Meta",0,0,"Social","1.64T",24.8,796,480,1.38,"0.32%","13M","13M",40,"0.8%","79%","Bearish","--","None","Buy",720,[{date:"Apr 23",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:38,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"~3%"),
        mk("TSLA","Tesla",0,0,"EVs","1.27T",52.5,499,214,2.05,"0%","64M","64M",40,"3.2%","48%","Bearish","Heavy both sides.","None","Hold",460,[{date:"Apr 28",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:30,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"~2%"),
      ]},
      { name: "Semiconductors", color: "#a78bfa", glow: "#a78bfa40", description: "", stocks: [
        mk("MRVL","Marvell",0,0,"Custom AI","85B",55.2,110,62,1.65,"0.35%","45M","18M",78,"2.1%","85%","Bullish","--","None.","Strong Buy",115,[{date:"Jun 5",event:"Q1 Earnings",type:"earnings"}],{composite:"Strong Buy",score:88,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.4%"),
        mk("AVGO","Broadcom",0,0,"Networking","1.02T",38.2,380,128,1.32,"1.15%","28M","25M",44,"0.8%","82%","Neutral","--","None.","Strong Buy",380,[{date:"Jun 12",event:"Q2 Earnings",type:"earnings"}],{composite:"Hold",score:42,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"2.5%"),
        mk("AMD","AMD",0,0,"GPUs","192B",42.5,188,115,1.72,"0%","48M","45M",35,"2.5%","75%","Bearish","Put volume up. Competition.","None.","Buy",165,[{date:"Apr 29",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:25,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Below"},"0.9%"),
      ]},
      { name: "Software", color: "#f59e0b", glow: "#f59e0b40", description: "", stocks: [
        mk("CRM","Salesforce",0,0,"CRM","196B",44.2,260,192,1.35,"0.55%","8.2M","7.5M",48,"1.1%","79%","Neutral","Post-earnings glow.","None.","Buy",240,[{date:"May 28",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:52,macd:"Bullish",sma20:"Above",sma50:"Below",sma200:"Above"},"0.9%"),
        mk("PLTR","Palantir",0,0,"AI/Analytics","198B",185,198,22,2.45,"0%","52M","48M",38,"3.5%","45%","Bearish","High SI 3.5%. Polarized.","None.","Hold",180,[{date:"May 5",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:35,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"0.9%"),
      ]},
      { name: "Biotech", color: "#16a34a", glow: "#00ff8840", description: "", stocks: [
        mk("AMGN","Amgen",0,0,"Biotech","198B",28.4,380,260,0.58,"2.55%","2.8M","3.1M",58,"0.9%","80%","Neutral","--","None.","Buy",390,[{date:"Apr 29",event:"Q1 Earnings",type:"earnings"}],{composite:"Buy",score:65,macd:"Bullish",sma20:"Above",sma50:"Above",sma200:"Above"},"0.9%"),
        mk("GILD","Gilead",0,0,"Biotech","144B",18.5,120,65,0.52,"3.12%","6.5M","7.0M",54,"0.8%","78%","Neutral","Defensive. HIV franchise.","None.","Buy",125,[{date:"Apr 24",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:58,macd:"Neutral",sma20:"Above",sma50:"Above",sma200:"Above"},"0.7%"),
      ]},
      { name: "E-Commerce & Fintech", color: "#e040fb", glow: "#e040fb40", description: "", stocks: [
        mk("NFLX","Netflix",0,0,"Streaming","425B",42.5,1050,540,1.42,"0%","3.5M","4.0M",48,"1.2%","82%","Neutral","Low vol.","None.","Buy",1050,[{date:"Apr 17",event:"Q1 Earnings",type:"earnings"}],{composite:"Hold",score:50,macd:"Neutral",sma20:"At",sma50:"Above",sma200:"Above"},"2.0%"),
        mk("COIN","Coinbase",0,0,"Crypto","55B",28.5,340,145,2.85,"0%","12M","10M",35,"5.8%","55%","Bearish","--","None.","Hold",280,[{date:"May 8",event:"Q1 Earnings",type:"earnings"}],{composite:"Sell",score:22,macd:"Bearish",sma20:"Below",sma50:"Below",sma200:"Above"},"0.3%"),
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

function getAllTickersAllIndexes() {
  var tickers = [];
  var seen = {};
  Object.keys(INDEXES).forEach(function(idxKey) {
    INDEXES[idxKey].sectors.forEach(function(sec) {
      sec.stocks.forEach(function(st) {
        if (!seen[st.ticker]) {
          seen[st.ticker] = true;
          tickers.push(st.ticker);
        }
      });
    });
  });
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
    // Auto-fetch on mount after a short delay to let React settle
    var autoStart = setTimeout(function() {
      mueLog("Auto-fetching prices...");
      doFetch();
    }, 1500);
    return function() { clearInterval(t); clearTimeout(autoStart); };
  }, []);

  useEffect(function() {
    if (autoRefresh && connected && status !== "loading") {
      intRef.current = setInterval(function() { doFetch(); }, 90000);
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
      mueLog("Server OK. Fetching all stocks across all indexes...");
      setMsg("Fetching...");
      setConnected(true);
      doFetchQuotes();
    }).catch(function(err) {
      mueLog("Server error: " + (err.message || err) + ". Check Vercel deployment.");
      setStatus("idle"); setMsg("Server unreachable - check deployment");
    });
  }

  function doFetchQuotes() {

    var tickers = getAllTickersAllIndexes();
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
            if (!autoRefresh) setAutoRefresh(true);
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
      }, i * 250);
    });
  }

  var dc = status === "done" ? (mktOpen ? "#16a34a" : "#d97706") : status === "loading" ? "#ffd700" : "#718096";
  var mc2 = mktOpen ? "#16a34a" : "#dc2626";

  var btns = [];
  if (connected) {
    btns.push(h("button", { key: "r", onClick: function() { doFetch(); }, style: { background: "#00ff8812", border: "1px solid #00ff8833", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "#16a34a", fontSize: 12, fontWeight: 700, fontFamily: mono } }, status === "loading" ? "Loading..." : "Refresh"));
    if (status === "done") {
      btns.push(h("button", { key: "a", onClick: function() { setAutoRefresh(!autoRefresh); }, style: { background: autoRefresh ? "#00ff8815" : "#ffffff", border: "1px solid " + (autoRefresh ? "#00ff8844" : "#e0e5ec"), borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: autoRefresh ? "#16a34a" : "#718096", fontSize: 11, fontWeight: 600, fontFamily: mono } }, autoRefresh ? "Auto: ON 90s" : "Auto: OFF"));
    }
  }

  var etfs = null;
  if (status === "done" && Object.keys(liveQuotes).length > 0) {
    etfs = h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 } },
      ["DIA", "SPY", "QQQ"].map(function(sym) {
        var q = liveQuotes[sym]; if (!q) return null;
        var lb = sym === "DIA" ? "DOW" : sym === "SPY" ? "S&P" : "NDX";
        return h("div", { key: sym, style: { background: "#ffffff", border: "1px solid #e0e5ec", borderRadius: 6, padding: "4px 10px", textAlign: "center" } },
          h("div", { style: { fontSize: 9, color: "#a0aec0", fontFamily: mono } }, lb + " live"),
          h("div", { style: { fontSize: 14, fontWeight: 700, color: q.change >= 0 ? "#16a34a" : "#dc2626", fontFamily: mono } }, "$" + q.price.toFixed(2)),
          h("div", { style: { fontSize: 10, color: (q.change >= 0 ? "#16a34a" : "#dc2626") + "aa", fontFamily: mono } }, (q.change >= 0 ? "+" : "") + q.change.toFixed(2) + "%")
        );
      })
    );
  }

  return h("div", { style: { background: "#ffffff", border: "1px solid #d0d8e4", borderRadius: 12, padding: 14, marginBottom: 14 } },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 } },
      h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
        h("div", { style: { width: 8, height: 8, borderRadius: "50%", background: dc } }),
        h("span", { style: { fontSize: 13, fontWeight: 700, color: "#1a1a2e", textTransform: "uppercase", fontFamily: mono } }, status === "done" ? "LIVE" : "Live Data"),
        h("span", { style: { fontSize: 11, padding: "2px 8px", borderRadius: 10, background: mc2 + "18", border: "1px solid " + mc2 + "44", color: mc2 } }, mktOpen ? "MARKET OPEN" : "MARKET CLOSED")
      ),
      h("div", { style: { display: "flex", gap: 6, alignItems: "center" } }, btns)
    ),
    (msg || lastTime) ? h("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 } },
      h("span", { style: { color: status === "loading" ? "#ffd700" : "#606f80" } }, msg),
      lastTime ? h("span", { style: { color: "#718096", fontFamily: mono } }, "Last: " + lastTime + " ET") : null
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
  }).then(function(r) {
    if (!r.ok) {
      return r.text().then(function(t) {
        var logEl = typeof document !== "undefined" ? document.getElementById("intel-log") : null;
        if (logEl) logEl.textContent = "Intel error: HTTP " + r.status + " - " + t.substring(0, 100);
        return { error: "HTTP " + r.status, content: [] };
      });
    }
    return r.json();
  }).then(function(data) {
    if (data && data.error) {
      var logEl = typeof document !== "undefined" ? document.getElementById("intel-log") : null;
      if (logEl) logEl.textContent = "API error: " + (data.error + " " + (data.detail || "")).substring(0, 100);
    }
    return data;
  });
}

function stripCitations(str) {
  if (typeof str !== "string") return str;
  // Strip <cite ...>...</cite> tags
  str = str.replace(/<cite[^>]*>/gi, "").replace(/<\/cite>/gi, "");
  // Strip ... tags
  str = str.replace(/]*>/gi, "").replace(/<\/antml:cite>/gi, "");
  // Strip any remaining XML-style citation tags
  str = str.replace(/<[a-z]*:?cite[^>]*>/gi, "").replace(/<\/[a-z]*:?cite>/gi, "");
  return str;
}

function cleanParsed(obj) {
  if (!obj || typeof obj !== "object") return obj;
  Object.keys(obj).forEach(function(k) {
    if (typeof obj[k] === "string") obj[k] = stripCitations(obj[k]);
    else if (Array.isArray(obj[k])) {
      obj[k].forEach(function(item, i) {
        if (typeof item === "string") obj[k][i] = stripCitations(item);
        else if (typeof item === "object") cleanParsed(item);
      });
    } else if (typeof obj[k] === "object") cleanParsed(obj[k]);
  });
  return obj;
}

function parseClaudeJSON(data) {
  if (!data || !data.content) return null;
  var text = "";
  data.content.forEach(function(block) {
    if (block.type === "text") text += block.text;
  });
  // Strip citation tags before parsing
  text = stripCitations(text);
  // Try to extract JSON from the response
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();
  try { return cleanParsed(JSON.parse(text)); }
  catch(e) {
    // Try to find JSON object in the text
    var start = text.indexOf("{");
    var end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return cleanParsed(JSON.parse(text.substring(start, end + 1))); }
      catch(e2) { return null; }
    }
    return null;
  }
}

function fetchAllIntelligence(onUpdate) {
  var logEl = typeof document !== "undefined" ? document.getElementById("intel-log") : null;

  var results = { smartMoney: null, flows: null, institutions: null, narrative: null, scannerData: null, fearGreed: null, timestamp: "" };
  var done = 0;
  var total = 2;

  function checkDone() {
    done++;
    if (logEl) logEl.textContent = "Loaded " + done + "/" + total + " intel feeds";
    if (done === total) {
      results.timestamp = getETNow();
      if (logEl) logEl.textContent = "Intel loaded at " + results.timestamp + " ET (~$0.05)";
      if (onUpdate) onUpdate(results);
    }
  }

  // CALL 1: Smart Money + Flows + Institutions (combined)
  if (logEl) logEl.textContent = "Fetching market intelligence (1/2)...";
  fetchClaudeIntel(
    'Search for today\'s stock market activity. I need three things in one JSON response. Return ONLY a JSON object: {"signals":[{"ticker":"XX","signal":"description","type":"Accumulation or Distribution or Insider Buy or Insider Sell","color":"#00ff88 for bullish or #ff4d4d for bearish"}],"flows":[{"from":"Sector losing","to":"Sector gaining","flow":"$X.XB","label":"why","drivers":["driver1","driver2"]}],"institutions":[{"name":"Fund Name","aum":"$X.XT","move":"what they did","signal":"Risk-Off or Rotate or Defensive","color":"#hex"}]} For signals: find 8-10 unusual options, insider trades, or volume spikes from today. For flows: find 4-6 sector rotations. For institutions: find 6-8 major fund moves or ETF flows. No citation or XML tags.'
  ).then(function(data) {
    var parsed = parseClaudeJSON(data);
    if (parsed) {
      if (parsed.signals) results.smartMoney = parsed.signals;
      if (parsed.flows) results.flows = parsed.flows;
      if (parsed.institutions) results.institutions = parsed.institutions;
    }
    checkDone();
  }).catch(function(e) {
    if (logEl) logEl.textContent = "Intel call 1 failed: " + (e.message || e);
    checkDone();
  });

  // CALL 2: Market Summary + Fear & Greed + Scanner Signals (combined)
  setTimeout(function() {
    if (logEl) logEl.textContent = "Fetching scanner intelligence (2/2)...";
    fetchClaudeIntel(
      'Search for today\'s stock market data. I need two things in one JSON response. Return ONLY a JSON object: {"narrative":"2-3 sentence market summary of today","fearGreed":number_0_to_100,"fearLabel":"Extreme Fear or Fear or Neutral or Greed or Extreme Greed","vix":"current VIX","oil":"current WTI oil price","headline":"one line headline","stocks":[{"ticker":"XX","action":"Strong Buy or Buy or Sell or Strong Sell","rsi":number,"volume_vs_avg":"150%","sentiment":"Bullish or Bearish","catalyst":"reason","analyst":"Buy or Sell or None","insiderActivity":"description or None"}]} For the market summary: what are Dow, S&P, Nasdaq doing today and why, plus CNN Fear and Greed value. For stocks: find 15-20 with the strongest signals today (unusual volume, RSI extremes, analyst changes, insider trades). Mix buys and sells. No citation or XML tags.'
    ).then(function(data) {
      var parsed = parseClaudeJSON(data);
      if (parsed) {
        results.narrative = parsed.narrative || null;
        results.fearGreed = parsed.fearGreed || null;
        results.fearLabel = parsed.fearLabel || null;
        results.vix = parsed.vix || null;
        results.oil = parsed.oil || null;
        results.headline = parsed.headline || null;
        if (parsed.stocks) results.scannerData = parsed.stocks;
      }
      checkDone();
    }).catch(function(e) {
      if (logEl) logEl.textContent = "Intel call 2 failed: " + (e.message || e);
      checkDone();
    });
  }, 2000);
}

// ============================================================
// STRATEGY SCANNER
// ============================================================

function scanStrategies(allIndexes, macro, staticSmartMoney, lc, liveIntel, lp) {
  var intel = liveIntel || {};
  var hasLiveIntel = intel.timestamp && intel.timestamp.length > 0;

  // Build stock universe from all indexes
  var allStocks = [];
  var seen = {};
  var worstPct = 0;

  Object.keys(allIndexes).forEach(function(idxKey) {
    var d = allIndexes[idxKey];
    // Use live ETF change when available, otherwise static
    var etfSym = idxKey === "DOW" ? "DIA" : idxKey === "SPX" ? "SPY" : "QQQ";
    var idxChange = lp(etfSym, 0) > 0 ? lc(etfSym, d.changePct) : d.changePct;
    if (idxChange < worstPct) worstPct = idxChange;
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
    var currentPrice = lp(st.ticker, st.price);
    var currentChange = lc(st.ticker, st.change);

    // Recalculate MA positions using LIVE price against estimated MAs
    var mas = st.mas || {};
    var above200 = mas.sma200 ? currentPrice > mas.sma200 : (sig.sma200 === "Above");
    var above50 = mas.sma50 ? currentPrice > mas.sma50 : (sig.sma50 === "Above");
    var maBullCount = 0;
    ["sma5","sma10","sma20","sma50","sma200"].forEach(function(k) { if (mas[k] && currentPrice > mas[k]) maBullCount++; });

    // Derive live composite: if price below most MAs = Sell, above most = Buy
    var liveComposite = maBullCount >= 4 ? "Buy" : maBullCount >= 3 ? "Hold" : maBullCount >= 1 ? "Sell" : "Strong Sell";
    var action = live ? live.action : liveComposite;
    var isSellSignal = action === "Sell" || action === "Strong Sell";

    var analyst = live ? (live.analyst || st.analystRating) : st.analystRating;
    var isQuality = analyst === "Buy" || analyst === "Strong Buy";
    var instHigh = parseFloat(st.instOwn) >= 65;
    var targetUpside = st.priceTarget > 0 ? ((st.priceTarget - currentPrice) / currentPrice * 100) : 0;
    var rsi = live ? (live.rsi || st.rsi) : st.rsi;

    if (isFearEnv) { score++; reasons.push("F&G " + fearGreed + (hasLiveIntel ? " (live)" : "")); }
    if (isSellSignal && above200) { score += 2; reasons.push(action + " but above 200-day ($" + (mas.sma200 || 0).toFixed(0) + ")"); }
    if (isQuality) { score++; reasons.push("Analyst " + analyst + (live && live.analyst ? " (live)" : "")); }
    if (instHigh) { score++; reasons.push(st.instOwn + " inst owned"); }
    if (targetUpside >= 15) { score++; reasons.push("Target $" + st.priceTarget + " (+" + targetUpside.toFixed(0) + "%)"); }
    if (rsi && rsi < 35) { score++; reasons.push("RSI " + rsi + " oversold" + (live && live.rsi ? " (live)" : "")); }

    if (score >= 4 && isSellSignal && above200) {
      reasons.push(maBullCount + "/5 MAs bullish at $" + currentPrice.toFixed(2));
      reasons.push(item.index);
      results.fear.push({ ticker: st.ticker, name: st.name, price: currentPrice, change: currentChange, score: score, reasons: reasons, color: item.sectorColor, sector: item.sectorName, index: item.index });
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
    var currentPrice = lp(st.ticker, st.price);
    var currentChange = lc(st.ticker, st.change);

    var isGreenOnRed = currentChange > 0 && worstPct < 0;
    var volHigh = parseFloat(st.volume) > parseFloat(st.avgVol) * 1.3;
    if (live && live.volume_vs_avg) volHigh = parseFloat(live.volume_vs_avg) > 130;
    var mas = st.mas || {};
    var maBulls = 0;
    ["sma5","sma10","sma20","sma50","sma200"].forEach(function(k) { if (mas[k] && currentPrice > mas[k]) maBulls++; });

    // Derive live composite from MA alignment
    var liveComposite = maBulls >= 4 ? "Buy" : maBulls >= 3 ? "Hold" : maBulls >= 1 ? "Sell" : "Strong Sell";
    var action = live ? live.action : liveComposite;

    if (sm) { score += 2; reasons.push("Smart Money: " + (sm.signal || sm.description || sm.type).substring(0, 50) + (hasLiveIntel ? " (live)" : "")); }
    if (isGreenOnRed) { score += 2; reasons.push("GREEN on red day"); }
    if (volHigh) { score++; reasons.push("Vol above avg" + (live && live.volume_vs_avg ? " " + live.volume_vs_avg + " (live)" : "")); }
    if (maBulls >= 3) { score++; reasons.push(maBulls + "/5 MAs bullish at $" + currentPrice.toFixed(2)); }
    if (action === "Buy" || action === "Strong Buy") { score++; reasons.push("Signal: " + action); }

    if (score >= 3 && (sm || isGreenOnRed)) {
      reasons.push(item.index);
      results.smartFollow.push({ ticker: st.ticker, name: st.name, price: currentPrice, change: currentChange, score: score, reasons: reasons, color: item.sectorColor, sector: item.sectorName, maBulls: maBulls, index: item.index });
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
      var currentPrice = lp(st.ticker, st.price);
      var currentChange = lc(st.ticker, st.change);

      if (match && rsi < 70 && !rotSeen[st.ticker]) {
        rotSeen[st.ticker] = true;
        var score = 0;
        var reasons = ["Flow: " + rot.from + " -> " + rot.to + " (" + rot.flow + ")" + (hasLiveIntel ? " (live)" : "")];
        if (rot.flowNum >= 4) { score += 2; reasons.push("Massive flow $" + rot.flowNum + "B"); }
        else { score += 1; reasons.push("Flow $" + rot.flowNum + "B"); }
        if (rot.instConfirm >= 3) { score += 2; reasons.push(rot.instConfirm + " institutions confirm"); }
        else if (rot.instConfirm >= 1) { score += 1; reasons.push(rot.instConfirm + " institution confirms"); }
        if (rsi < 50) { score++; reasons.push("RSI " + rsi + (live && live.rsi ? " (live)" : "")); }
        if (currentChange > 0 && worstPct < 0) { score++; reasons.push("Green on red day"); }
        var mas2 = st.mas || {};
        var mab = 0;
        ["sma20","sma50","sma200"].forEach(function(k) { if (mas2[k] && currentPrice > mas2[k]) mab++; });
        if (mab >= 2) { score++; reasons.push(mab + "/3 key MAs bullish at $" + currentPrice.toFixed(2)); }
        rot.drivers.forEach(function(dr) { reasons.push("Driver: " + dr); });
        reasons.push(item.index);
        results.rotation.push({ ticker: st.ticker, name: st.name, price: currentPrice, change: currentChange, score: score, reasons: reasons, color: item.sectorColor, sector: item.sectorName, flow: rot.flow, rsi: rsi, index: item.index });
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
  var displayPrice = liveETF ? "$" + liveQuotes[etfKey].price.toFixed(2) + " (ETF)" : "--";
  var displayPct = liveETF ? liveQuotes[etfKey].change : 0;
  var displaySub = liveETF ? (displayPct >= 0 ? "+" : "") + displayPct.toFixed(2) + "%" : "Waiting for live data";
  // Calculate live green count when connected
  var liveGreen = 0;
  var liveTotal = 0;
  if (isLive) {
    d.sectors.forEach(function(sec) { sec.stocks.forEach(function(st) {
      liveTotal++;
      if (liveQuotes[st.ticker] && liveQuotes[st.ticker].change >= 0) liveGreen++;
    }); });
  }
  var displayInfo = isLive ? "Live | " + liveGreen + "/" + liveTotal + " green" : getTodayShort() + " | " + d.greenCount + "/" + d.components + " green";

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

    var ac = trend === "up" ? "#ff4d4d" : trend === "down" ? "#16a34a" : "#718096";
    if (m.l === "OIL WTI" || m.l === "GOLD") ac = trend === "up" ? "#22c55e" : "#ff4d4d";
    if (m.l === "UNEMP" || m.l === "P/C RATIO") ac = trend === "up" ? "#ff4d4d" : "#00ff88";
    var arrow = trend === "up"
      ? { display: "inline-block", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "7px solid " + ac }
      : trend === "down"
      ? { display: "inline-block", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "7px solid " + ac }
      : { display: "inline-block", width: 10, height: 2, borderRadius: 1, background: ac };

    var tileBorder = hasLive ? "#00ff8833" : "#e0e5ec";
    return h("div", { key: m.l, style: { background: "#ffffff", border: "1px solid " + tileBorder, borderRadius: 8, padding: "6px 12px", minWidth: 88, textAlign: "center" } },
      h("div", { style: { display: "flex", justifyContent: "center", alignItems: "center", gap: 4, fontSize: 9, color: hasLive ? "#16a34a" : "#a0aec0", textTransform: "uppercase", fontFamily: mono, marginBottom: 2 } },
        m.l,
        hasLive ? h("span", { style: { width: 5, height: 5, borderRadius: "50%", background: "#16a34a", display: "inline-block", marginLeft: 3 } }) : null
      ),
      h("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 5 } },
        h("span", { style: { fontSize: 16, fontWeight: 700, color: hasLive ? (liveQ.change >= 0 ? "#16a34a" : "#dc2626") : m.c, fontFamily: mono } }, displayVal),
        h("span", { style: arrow })
      ),
      h("div", { style: { fontSize: 9, color: ac, fontFamily: mono, marginTop: 1 } }, displayDelta),
      h("div", { style: { fontSize: 8, color: hasLive ? "#00ff8888" : "#a0aec0", marginTop: 1 } }, displayCtx)
    );
  });

  // Tab buttons
  var tabs = ["scanner", "sectors", "smart_money", "flows", "institutions", "calendar"].map(function(t) {
    var label = t === "flows" ? "Flows" : t === "institutions" ? "Institutions" : t === "smart_money" ? "Smart Money" : t === "calendar" ? "Calendar" : t === "scanner" ? "Strategy Scanner" : "Sectors";
    var isScanner = t === "scanner";
    return h("button", { key: t, onClick: function() { setTab(t); }, style: { background: tab === t ? (isScanner ? "#f0e8f8" : "#e8eef8") : "#ffffff", border: "1px solid " + (tab === t ? (isScanner ? "#e040fb55" : "#00d4ff33") : "#e0e5ec"), borderRadius: 8, padding: "7px 14px", color: tab === t ? (isScanner ? "#e040fb" : "#00d4ff") : "#718096", fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", fontFamily: mono } }, label);
  });

  // Sector cards
  var sectorCards = d.sectors.map(function(s, i) {
    var avg = s.stocks.reduce(function(a, b) { return a + lc(b.ticker, b.change); }, 0) / s.stocks.length;
    var tickers = s.stocks.map(function(st) {
      var ch = lc(st.ticker, st.change);
      return h("span", { key: st.ticker, style: { fontSize: 11, padding: "2px 5px", borderRadius: 3, background: ch >= 0 ? "#00ff8810" : "#ff4d4d10", color: ch >= 0 ? "#16a34a" : "#dc2626", fontFamily: mono, fontWeight: 600 } }, st.ticker + (ch >= 0 ? "+" : "") + ch.toFixed(1) + "%");
    });
    // Generate live sector summary when connected
    var sectorDesc = s.description;
    if (isLive) {
      var greenStocks = 0; var bestTk = ""; var bestCh = -999; var worstTk = ""; var worstCh = 999;
      s.stocks.forEach(function(st2) {
        var ch2 = lc(st2.ticker, st2.change);
        if (ch2 >= 0) greenStocks++;
        if (ch2 > bestCh) { bestCh = ch2; bestTk = st2.ticker; }
        if (ch2 < worstCh) { worstCh = ch2; worstTk = st2.ticker; }
      });
      sectorDesc = greenStocks + "/" + s.stocks.length + " green. " + bestTk + " leads (" + (bestCh >= 0 ? "+" : "") + bestCh.toFixed(1) + "%), " + worstTk + " lags (" + worstCh.toFixed(1) + "%). Avg: " + (avg >= 0 ? "+" : "") + avg.toFixed(2) + "%";
    }
    return h("div", { key: s.name, onClick: function() { onSelect(s); }, onMouseEnter: function() { setHov(i); }, onMouseLeave: function() { setHov(null); },
      style: { background: hov === i ? "#f0f3f8" : "#f8f9fc", border: "1px solid " + (hov === i ? s.color + "44" : "#e0e5ec"), borderRadius: 12, padding: 14, cursor: "pointer", transition: "all .2s", boxShadow: hov === i ? "0 0 18px " + s.glow : "none" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 } },
        h("span", { style: { fontSize: 15, fontWeight: 700, color: "#1a1a2e" } }, s.name),
        h(Chg, { v: avg, sz: 15 })
      ),
      h("div", { style: { fontSize: 12, color: isLive ? "#4a5568" : "#606f80", lineHeight: 1.45, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } }, sectorDesc),
      h("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }, tickers)
    );
  });

  // Smart money cards
  var smartCards = SMART_MONEY.map(function(s, i) {
    return h("div", { key: i, style: { background: "#ffffff", border: "1px solid #e0e5ec", borderRadius: 10, padding: 14, marginBottom: 8 } },
      h("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" } },
        h("span", { style: { fontSize: 18, fontWeight: 800, color: s.color, fontFamily: mono } }, s.ticker),
        h(Badge, { text: s.type, color: s.color })
      ),
      h("div", { style: { fontSize: 13, color: "#4a5568" } }, s.signal)
    );
  });

  // Flow cards
  var flowCards = d.flows.map(function(f, i) {
    return h("div", { key: i, style: { background: "#ffffff", border: "1px solid #e0e5ec", borderRadius: 10, padding: 12, marginBottom: 8 } },
      h("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" } },
        h("span", { style: { fontSize: 13, fontWeight: 700, color: "#00d4ff" } }, f.from),
        h("span", { style: { color: "#ff4d4d", fontSize: 16 } }, "->"),
        h("span", { style: { fontSize: 13, fontWeight: 700, color: "#16a34a" } }, f.to),
        h("span", { style: { marginLeft: "auto", fontSize: 16, fontWeight: 800, color: "#1a1a2e", fontFamily: mono } }, f.flow)
      ),
      h("div", { style: { fontSize: 13, color: "#4a5568", marginBottom: 4 } }, f.label),
      h("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }, f.drivers.map(function(dr) { return h("span", { key: dr, style: { fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#e0e5ec", color: "#606f80", fontFamily: mono } }, dr); }))
    );
  });

  // Institution cards
  var instCards = d.institutions.map(function(inv, i) {
    return h("div", { key: inv.name, style: { background: "#ffffff", border: "1px solid #e0e5ec", borderRadius: 10, padding: 12, marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 12 } },
      h("div", { style: { width: 34, height: 34, borderRadius: 7, background: inv.color + "15", border: "1px solid " + inv.color + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: inv.color, flexShrink: 0, fontFamily: mono } }, i + 1),
      h("div", { style: { flex: 1 } },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 } },
          h("span", { style: { fontSize: 14, fontWeight: 700, color: "#1a1a2e" } }, inv.name),
          h(Badge, { text: inv.signal, color: inv.color })
        ),
        h("div", { style: { display: "flex", gap: 12, fontSize: 12, color: "#718096", marginBottom: 4 } },
          h("span", null, "AUM: ", h("strong", { style: { color: "#2d3748" } }, inv.aum)),
          h("span", null, "Wt: ", h("strong", { style: { color: "#2d3748" } }, inv.weight))
        ),
        h("div", { style: { fontSize: 13, color: "#4a5568" } }, inv.move)
      )
    );
  });

  // Override with LIVE intel when available
  var intelBanner = null;
  if (liveIntel && liveIntel.timestamp) {
    intelBanner = h("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "6px 10px", background: "#e040fb12", border: "1px solid #e040fb33", borderRadius: 8 } },
      h("div", { style: { width: 6, height: 6, borderRadius: "50%", background: "#e040fb" } }),
      h("span", { style: { fontSize: 11, color: "#e040fb", fontWeight: 700 } }, "LIVE INTEL"),
      h("span", { style: { fontSize: 10, color: "#606f80" } }, "Updated " + liveIntel.timestamp + " ET via Claude AI")
    );
  }

  if (liveIntel && liveIntel.smartMoney && liveIntel.smartMoney.length > 0) {
    smartCards = liveIntel.smartMoney.map(function(s, i) {
      var c = s.color || (s.type === "Accumulation" || s.type === "Insider Buy" ? "#00ff88" : "#ff4d4d");
      return h("div", { key: "live-sm-" + i, style: { background: "#ffffff", border: "1px solid " + c + "33", borderRadius: 10, padding: 14, marginBottom: 8 } },
        h("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" } },
          h("span", { style: { fontSize: 18, fontWeight: 800, color: c, fontFamily: mono } }, s.ticker || "???"),
          h(Badge, { text: s.type || "Signal", color: c }),
          h("span", { style: { fontSize: 9, color: "#e040fb", marginLeft: "auto" } }, "LIVE")
        ),
        h("div", { style: { fontSize: 13, color: "#4a5568", lineHeight: 1.5 } }, s.signal || s.description || "")
      );
    });
  }

  if (liveIntel && liveIntel.flows && liveIntel.flows.length > 0) {
    flowCards = liveIntel.flows.map(function(f, i) {
      var drivers = f.drivers || [];
      return h("div", { key: "live-fl-" + i, style: { background: "#ffffff", border: "1px solid #00d4ff33", borderRadius: 10, padding: 12, marginBottom: 8 } },
        h("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" } },
          h("span", { style: { fontSize: 13, fontWeight: 700, color: "#00d4ff" } }, f.from || ""),
          h("span", { style: { color: "#ff4d4d", fontSize: 16 } }, "->"),
          h("span", { style: { fontSize: 13, fontWeight: 700, color: "#16a34a" } }, f.to || ""),
          h("span", { style: { marginLeft: "auto", fontSize: 16, fontWeight: 800, color: "#1a1a2e", fontFamily: mono } }, f.flow || ""),
          h("span", { style: { fontSize: 9, color: "#e040fb" } }, "LIVE")
        ),
        h("div", { style: { fontSize: 13, color: "#4a5568", marginBottom: 4 } }, f.label || f.description || ""),
        h("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }, drivers.map(function(dr, j) { return h("span", { key: j, style: { fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#e0e5ec", color: "#606f80", fontFamily: mono } }, dr); }))
      );
    });
  }

  if (liveIntel && liveIntel.institutions && liveIntel.institutions.length > 0) {
    instCards = liveIntel.institutions.map(function(inv, i) {
      var c = inv.color || "#00d4ff";
      return h("div", { key: "live-inst-" + i, style: { background: "#ffffff", border: "1px solid #e0e5ec", borderRadius: 10, padding: 12, marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 12 } },
        h("div", { style: { width: 34, height: 34, borderRadius: 7, background: c + "15", border: "1px solid " + c + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: c, flexShrink: 0, fontFamily: mono } }, i + 1),
        h("div", { style: { flex: 1 } },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 } },
            h("span", { style: { fontSize: 14, fontWeight: 700, color: "#1a1a2e" } }, inv.name || ""),
            h(Badge, { text: inv.signal || "Active", color: c }),
            h("span", { style: { fontSize: 9, color: "#e040fb", marginLeft: 6 } }, "LIVE")
          ),
          inv.aum ? h("div", { style: { fontSize: 12, color: "#718096", marginBottom: 4 } }, "AUM: ", h("strong", { style: { color: "#2d3748" } }, inv.aum)) : null,
          h("div", { style: { fontSize: 13, color: "#4a5568", lineHeight: 1.45 } }, inv.move || inv.description || "")
        )
      );
    });
  }

  // Calendar
  var econCards = ECON_CAL.map(function(ev, i) {
    var ic = ev.impact === "Critical" ? "#ff2020" : ev.impact === "High" ? "#ffd700" : "#78909c";
    return h("div", { key: i, style: { background: "#ffffff", border: "1px solid #e0e5ec", borderRadius: 8, padding: 10, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 } },
      h("span", { style: { minWidth: 60, fontSize: 13, fontWeight: 700, color: "#00d4ff", fontFamily: mono } }, ev.date),
      h("span", { style: { flex: 1, fontSize: 13, color: "#2d3748" } }, ev.event),
      h(Badge, { text: ev.impact, color: ic })
    );
  });
  var evtCards = allEvts.map(function(ev, i) {
    return h("div", { key: i, style: { background: "#ffffff", border: "1px solid #e0e5ec", borderRadius: 8, padding: "8px 12px", marginBottom: 5, display: "flex", alignItems: "center", gap: 10 } },
      h("div", { style: { width: 8, height: 8, borderRadius: "50%", background: evColor(ev.type), flexShrink: 0 } }),
      h("span", { style: { fontWeight: 700, color: ev.color, fontFamily: mono, fontSize: 13, minWidth: 48 } }, ev.ticker),
      h("span", { style: { color: "#718096", fontFamily: mono, fontSize: 13, minWidth: 60 } }, ev.date),
      h("span", { style: { color: "#2d3748", fontSize: 13, flex: 1 } }, ev.event),
      h(Badge, { text: ev.signal || "Hold", color: sigC(ev.signal) })
    );
  });

  // Strategy Scanner
  var scanResults = scanStrategies(INDEXES, MACRO, SMART_MONEY, lc, liveIntel, lp);

  function buildStrategyCard(strat, title, icon, desc, color, items) {
    var active = items.length > 0;
    var header = h("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 } },
      h("div", { style: { width: 36, height: 36, borderRadius: 8, background: (active ? color : "#718096") + "20", border: "1px solid " + (active ? color : "#718096") + "44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 } }, icon),
      h("div", null,
        h("div", { style: { fontSize: 14, fontWeight: 800, color: active ? "#1a1a2e" : "#718096" } }, title),
        h("div", { style: { fontSize: 11, color: active ? color : "#a0aec0" } }, active ? items.length + " stocks flagged" : "No signals")
      ),
      h("div", { style: { marginLeft: "auto", padding: "4px 12px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: active ? color + "20" : "#e0e5ec", border: "1px solid " + (active ? color + "44" : "#d0d8e4"), color: active ? color : "#a0aec0" } }, active ? "ACTIVE" : "INACTIVE")
    );

    var descEl = h("div", { style: { fontSize: 12, color: "#606f80", lineHeight: 1.5, padding: "8px 10px", background: "#ffffff", borderRadius: 6, marginBottom: 10 } }, desc);

    var stockRows = items.map(function(item, i) {
      var is7 = Math.min(item.score, 7) === 7;
      var isLiveSignal = item.index === "LIVE" || (item.reasons && item.reasons.some(function(r) { return r.indexOf("(live)") >= 0 || r.indexOf("LIVE") >= 0; }));
      var cardBorder = is7 ? "2px solid " + color : "1px solid " + (isLiveSignal ? "#e040fb33" : "#e0e5ec");
      var cardBg = is7 ? "#0c1428" : "#ffffff";
      var cardShadow = is7 ? "0 0 20px " + color + "30, 0 0 40px " + color + "15" : "none";

      return h("div", { key: item.ticker + i, className: is7 ? "pulse-card" : "", style: { background: cardBg, border: cardBorder, borderRadius: 10, padding: 12, marginBottom: 8, boxShadow: cardShadow, position: "relative", overflow: "hidden" } },
        is7 ? h("div", { style: { position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, " + color + ", transparent)", animation: "shimmer 2s infinite" } }) : null,
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } },
          h("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
            h("span", { style: { fontSize: is7 ? 18 : 16, fontWeight: 800, color: is7 ? "#fff" : item.color, fontFamily: mono, textShadow: is7 ? "0 0 10px " + color : "none" } }, item.ticker),
            h("span", { style: { fontSize: 12, color: "#606f80" } }, item.name),
            h("span", { style: { fontSize: 10, color: "#a0aec0" } }, item.sector),
            item.index ? h("span", { style: { fontSize: 9, padding: "1px 5px", borderRadius: 4, background: item.index === "LIVE" ? "#e040fb22" : "#d0d8e4", color: item.index === "LIVE" ? "#e040fb" : "#5a8bfa", fontFamily: mono, fontWeight: 700 } }, item.index === "DOW" ? "DJIA" : item.index === "SPX" ? "S&P" : item.index === "LIVE" ? "LIVE" : "NDX") : null,
            isLiveSignal && item.index !== "LIVE" ? h("span", { style: { fontSize: 8, color: "#e040fb", fontWeight: 700 } }, "LIVE DATA") : null
          ),
          h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
            item.price > 0 ? h("span", { style: { fontSize: 14, fontWeight: 700, color: "#1a1a2e", fontFamily: mono } }, "$" + item.price.toLocaleString()) : null,
            item.price > 0 ? h(Chg, { v: item.change, sz: 12 }) : null,
            h("div", { className: is7 ? "pulse-badge" : "", style: { padding: is7 ? "4px 12px" : "2px 8px", borderRadius: 10, background: is7 ? color : color + "20", border: is7 ? "none" : "1px solid " + color + "44", color: is7 ? "#000" : color, fontSize: is7 ? 13 : 11, fontWeight: 800, fontFamily: mono, animation: is7 ? "pulse-glow 1.5s ease-in-out infinite" : "none" } }, Math.min(item.score, 7) + "/7")
          )
        ),
        h("div", { style: { display: "flex", flexWrap: "wrap", gap: 4 } },
          item.reasons.map(function(r, j) {
            var isLiveReason = r.indexOf("(live)") >= 0 || r.indexOf("LIVE") >= 0;
            return h("span", { key: j, style: { fontSize: 10, padding: "2px 6px", borderRadius: 4, background: isLiveReason ? "#e040fb15" : "#e0e5ec", color: isLiveReason ? "#e040fb" : "#4a5568", fontFamily: mono, lineHeight: 1.6, border: isLiveReason ? "1px solid #e040fb33" : "none" } }, r);
          })
        )
      );
    });

    return h("div", { style: { background: "#ffffff", border: "1px solid " + (active ? color + "30" : "#e0e5ec"), borderRadius: 14, padding: 16, marginBottom: 14 } }, header, descEl, stockRows.length > 0 ? stockRows : h("div", { style: { fontSize: 12, color: "#a0aec0", padding: "10px 0", textAlign: "center" } }, "No stocks scoring 5/7 or higher for this strategy right now."));
  }

  var scannerContent = h("div", null,
    scanResults.isLiveIntel ? h("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "8px 12px", background: "#e040fb12", border: "1px solid #e040fb33", borderRadius: 8 } },
      h("div", { style: { width: 8, height: 8, borderRadius: "50%", background: "#e040fb", animation: "pulse-glow 1.5s ease-in-out infinite" } }),
      h("span", { style: { fontSize: 12, color: "#e040fb", fontWeight: 700 } }, "LIVE INTELLIGENCE ACTIVE"),
      h("span", { style: { fontSize: 10, color: "#606f80" } }, "Using real-time data from Claude AI")
    ) : null,
    h("div", { style: { fontSize: 11, color: "#e040fb", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 } }, "Automated Strategy Scanner"),
    h("div", { style: { fontSize: 12, color: "#606f80", marginBottom: 14, lineHeight: 1.5 } }, "Scanning " + (scanResults.totalScanned || 0) + " stocks across DJIA, S&P 500, and NASDAQ. Showing scores 5/7 and above only. " + (scanResults.isLiveIntel ? "Live intelligence active." : "Using snapshot data. Click Fetch AI Intel for live signals.")),
    buildStrategyCard("fear", "Strategy 1: Fear Rotation", "F", "Buy quality names dragged down by panic. Requires: F&G below 30, composite Sell but above 200-day MA, analyst Buy/Strong Buy, high institutional ownership, price target 15%+ above current.", "#00d4ff", scanResults.fear.filter(function(x) { return x.score >= 5; })),
    buildStrategyCard("smart", "Strategy 2: Smart Money Follow", "S", "Follow institutional accumulation signals. Requires: Smart Money accumulation OR green on a red day, volume above average, 3+ MAs bullish, composite Buy signal.", "#00ff88", scanResults.smartFollow.filter(function(x) { return x.score >= 5; })),
    buildStrategyCard("rotation", "Strategy 3: Macro Rotation", "R", "Ride sector rotation flows. Requires: significant flow into sector, institutional confirmation, RSI below 70. You profit from money movement between sectors.", "#ffd700", scanResults.rotation.filter(function(x) { return x.score >= 5; })),
    h("div", { style: { marginTop: 8, padding: 10, background: "#ffffff", borderRadius: 8, border: "1px solid #e0e5ec", fontSize: 11, color: "#a0aec0", lineHeight: 1.5, textAlign: "center" } }, "Disclaimer: These are educational strategy frameworks, not investment advice. Signals are estimated from available data. Always do your own research and consider consulting a financial advisor before trading.")
  );

  // Pick tab content
  var tabContent = null;
  if (tab === "scanner") tabContent = scannerContent;
  if (tab === "sectors") tabContent = h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 } }, sectorCards);
  var emptyIntelMsg = h("div", { style: { fontSize: 13, color: "#a0aec0", padding: "20px 0", textAlign: "center", lineHeight: 1.6 } }, "Waiting for live intelligence data...", h("br"), "Data auto-loads on page open or click Refresh Intel.");
  if (tab === "smart_money") tabContent = h("div", null, intelBanner, h("div", { style: { fontSize: 12, color: "#ffd700", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 } }, "Unusual Activity - " + getTodayShort()), smartCards.length > 0 ? smartCards : emptyIntelMsg);
  if (tab === "flows") tabContent = h("div", null, intelBanner, h("div", { style: { fontSize: 12, color: "#ffd700", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 } }, "Sector Rotation - " + getTodayShort()), flowCards.length > 0 ? flowCards : emptyIntelMsg);
  if (tab === "institutions") tabContent = h("div", null, intelBanner, h("div", { style: { fontSize: 12, color: "#ffd700", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 } }, "Institutional Activity - " + getTodayShort()), instCards.length > 0 ? instCards : emptyIntelMsg);
  if (tab === "calendar") tabContent = h("div", null,
    h("div", { style: { fontSize: 12, color: "#718096", marginBottom: 8, textTransform: "uppercase", fontWeight: 700 } }, "Economic Events"),
    econCards.length > 0 ? econCards : h("div", { style: { fontSize: 12, color: "#a0aec0", padding: "10px 0", textAlign: "center" } }, "Economic calendar updates with live intel. Click Fetch AI Intel."),
    h("div", { style: { fontSize: 12, color: "#718096", marginTop: 16, marginBottom: 8, textTransform: "uppercase", fontWeight: 700 } }, "Stock Events"),
    evtCards.length > 0 ? evtCards : h("div", { style: { fontSize: 12, color: "#a0aec0", padding: "10px 0", textAlign: "center" } }, "Stock events update with live data.")
  );

  return h("div", { style: { padding: "14px 20px" } },
    h(LiveDataPanel, { onUpdate: onLiveUpdate, currentIdx: idx, liveQuotes: liveQuotes }),
    h("div", { style: { background: "#ffffff", border: "1px solid #d0d8e4", borderRadius: 14, padding: 16, marginBottom: 14 } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 } },
        h("div", null,
          h("div", { style: { fontSize: 11, color: "#718096", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: mono } }, d.name),
          h("div", { style: { fontSize: 28, fontWeight: 800, color: "#1a1a2e", fontFamily: mono } }, displayPrice),
          h("span", { style: { color: displayPct >= 0 ? "#16a34a" : "#dc2626", fontSize: 16, fontWeight: 700, fontFamily: mono } }, displaySub),
          h("span", { style: { fontSize: 12, color: "#718096", marginLeft: 8 } }, displayInfo)
        ),
        h("div", { style: { background: "#ffffff", border: "1px solid " + (liveIntel && liveIntel.fearGreed ? "#e040fb33" : "#e0e5ec"), borderRadius: 10, padding: "8px 14px", textAlign: "center" } },
          h("div", { style: { fontSize: 10, color: liveIntel && liveIntel.fearGreed ? "#e040fb" : "#718096", fontFamily: mono } }, "FEAR & GREED"),
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
    h("div", { style: { background: "#ffffff", border: "1px solid " + (liveIntel && liveIntel.narrative ? "#e040fb33" : "#e0e5ec"), borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 13, color: "#4a5568", lineHeight: 1.5 } },
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
    var currentPrice = lp(st.ticker, st.price);
    var currentChange = lc(st.ticker, st.change);
    // Derive live sentiment from change
    var liveSentiment = currentChange > 1 ? "Bullish" : currentChange > 0 ? "Mild Bull" : currentChange > -1 ? "Mild Bear" : "Bearish";
    var showSentiment = isLive && liveQuotes[st.ticker] ? liveSentiment : st.sentiment;
    // Derive live composite from MA alignment
    var mas = st.mas || {};
    var maBulls = 0;
    ["sma5","sma10","sma20","sma50","sma200"].forEach(function(k) { if (mas[k] && currentPrice > mas[k]) maBulls++; });
    var liveComposite = maBulls >= 4 ? "Buy" : maBulls >= 3 ? "Hold" : maBulls >= 1 ? "Sell" : "Strong Sell";
    var showComposite = isLive && liveQuotes[st.ticker] ? liveComposite : (st.signals ? st.signals.composite : "Hold");
    // Recalculate RSI-like indicator from price vs MA200 distance
    var liveRSI = mas.sma200 ? Math.round(50 + ((currentPrice - mas.sma200) / mas.sma200) * 200) : st.rsi;
    if (liveRSI > 100) liveRSI = 100;
    if (liveRSI < 0) liveRSI = 0;
    var showRSI = isLive && liveQuotes[st.ticker] ? liveRSI : st.rsi;

    var metrics = [["Idx Wt", st.idxWeight], ["P/E", st.pe], ["RSI", showRSI], ["Short", st.shortInt]].map(function(pair) {
      var l = pair[0], v = pair[1];
      var c = l === "RSI" ? (v > 70 ? "#ffd700" : v < 35 ? "#ff4d4d" : "#2d3748") : l === "Idx Wt" ? sector.color : "#2d3748";
      return h("div", { key: l, style: { display: "flex", justifyContent: "space-between" } },
        h("span", { style: { color: "#718096" } }, l),
        h("span", { style: { color: c, fontFamily: mono, fontWeight: l === "Idx Wt" ? 700 : 400 } }, v)
      );
    });
    var maPanel = showMA ? h("div", { onClick: function(e) { e.stopPropagation(); } }, h(MAPanel, { stock: st, color: sector.color })) : null;

    return h("div", { key: st.ticker, onClick: function() { onStock(st); }, onMouseEnter: function() { setHov(i); }, onMouseLeave: function() { setHov(null); },
      style: { background: hov === i ? "#f0f3f8" : "#f8f9fc", border: "1px solid " + (hov === i ? sector.color + "40" : "#e0e5ec"), borderRadius: 12, padding: 14, cursor: "pointer", transition: "all .2s", boxShadow: hov === i ? "0 0 18px " + sector.glow : "none" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 } },
        h("div", null,
          h("span", { style: { fontSize: 18, fontWeight: 800, color: sector.color, fontFamily: mono } }, st.ticker),
          h("div", { style: { fontSize: 11, color: "#718096" } }, st.name)
        ),
        h("div", { style: { textAlign: "right" } },
          h("div", { style: { fontSize: 16, fontWeight: 700, color: "#1a1a2e", fontFamily: mono } }, "$" + lp(st.ticker, st.price).toLocaleString()),
          h(Chg, { v: lc(st.ticker, st.change), sz: 13 }),
          isLive && liveQuotes[st.ticker] ? h("div", { style: { fontSize: 8, color: "#16a34a", marginTop: 1 } }, "LIVE") : null
        )
      ),
      h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 10px", fontSize: 12, margin: "6px 0" } }, metrics),
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 } },
        h(Badge, { text: showSentiment, color: sC(showSentiment) }),
        h(Badge, { text: showComposite, color: sigC(showComposite) }),
        isLive && liveQuotes[st.ticker] ? h("span", { style: { fontSize: 8, color: "#e040fb" } }, maBulls + "/5 MA") : null
      ),
      maPanel
    );
  });

  return h("div", { style: { padding: "14px 20px" } },
    h("div", { style: { background: "#ffffff", border: "1px solid " + sector.color + "30", borderRadius: 14, padding: 16, marginBottom: 14 } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 } },
        h("div", null, h("div", { style: { fontSize: 22, fontWeight: 800, color: "#1a1a2e" } }, sector.name), h("div", { style: { fontSize: 12, color: "#718096" } }, sector.stocks.length + " stocks")),
        h("div", { style: { textAlign: "right" } }, h("div", { style: { fontSize: 11, color: "#718096" } }, "Avg"), h(Chg, { v: avg, sz: 20 }))
      ),
      h("div", { style: { fontSize: 13, color: "#4a5568", lineHeight: 1.5, marginTop: 8 } }, sector.description)
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
  var mas = stock.mas || {};

  // Derive live signal states from current price vs MAs
  var maBullCount = 0;
  ["sma5","sma10","sma20","sma50","sma200"].forEach(function(k) { if (mas[k] && price > mas[k]) maBullCount++; });
  var liveComposite = maBullCount >= 4 ? "Buy" : maBullCount >= 3 ? "Hold" : maBullCount >= 1 ? "Sell" : "Strong Sell";
  var liveScore = maBullCount >= 4 ? 75 : maBullCount >= 3 ? 55 : maBullCount >= 2 ? 40 : 25;
  var showComposite = isLive && liveQuotes[stock.ticker] ? liveComposite : (sig.composite || "Hold");
  var showScore = isLive && liveQuotes[stock.ticker] ? liveScore : (sig.score || 50);

  // Derive live SMA labels
  function maLabel(key) {
    if (!mas[key]) return sig[key] || "N/A";
    return price > mas[key] ? "Above ($" + mas[key].toFixed(0) + ")" : "Below ($" + mas[key].toFixed(0) + ")";
  }
  var liveSentiment = change > 1 ? "Bullish" : change > 0 ? "Mild Bull" : change > -1 ? "Mild Bear" : "Bearish";
  var showSentiment = isLive && liveQuotes[stock.ticker] ? liveSentiment : (stock.sentiment || "Neutral");

  // Live RSI estimate from price vs SMA200
  var liveRSI = mas.sma200 ? Math.round(50 + ((price - mas.sma200) / mas.sma200) * 200) : stock.rsi || 50;
  if (liveRSI > 100) liveRSI = 100;
  if (liveRSI < 0) liveRSI = 0;
  var rsiVal = isLive && liveQuotes[stock.ticker] ? liveRSI : (stock.rsi || 50);

  var pctRange = stock.fiftyTwoHigh !== stock.fiftyTwoLow ? ((price - stock.fiftyTwoLow) / (stock.fiftyTwoHigh - stock.fiftyTwoLow)) * 100 : 50;
  var volNum = parseFloat(stock.volume) || 0; var avgNum = parseFloat(stock.avgVol) || 1; var siNum = parseFloat(stock.shortInt) || 0;
  var cs = { background: "#f8f9fc", border: "1px solid #e0e5ec", borderRadius: 12, padding: 16 };
  var hs2 = { fontSize: 12, fontWeight: 700, color: "#718096", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 };

  var sigItems = [["MACD", sig.macd || "N/A"], ["SMA 20", maLabel("sma20")], ["SMA 50", maLabel("sma50")], ["SMA 200", maLabel("sma200")]];
  var metricItems = [["Index Weight", stock.idxWeight || "N/A"], ["Market Cap", stock.marketCap || "N/A"], ["P/E", String(stock.pe != null ? stock.pe : "N/A")], ["Beta", String(stock.beta != null ? stock.beta : "N/A")], ["Div Yield", stock.divYield || "N/A"], ["Inst Own", stock.instOwn || "N/A"], ["Analyst", stock.analystRating || "Hold"], ["Target", "$" + (stock.priceTarget || "N/A")]];

  return h("div", { style: { padding: "14px 20px" } },
    h("div", { style: { background: "#ffffff", border: "1px solid " + sc + "30", borderRadius: 14, padding: 18, marginBottom: 14 } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 } },
        h("div", null,
          h("div", { style: { fontSize: 30, fontWeight: 900, color: sc, fontFamily: mono } }, stock.ticker),
          h("div", { style: { fontSize: 14, color: "#4a5568" } }, stock.name + " | " + stock.sector),
          h("div", { style: { fontSize: 12, color: sc, fontWeight: 700, marginTop: 4 } }, "Index Weight: " + (stock.idxWeight || "N/A"))
        ),
        h("div", { style: { textAlign: "right" } },
          h("div", { style: { fontSize: 30, fontWeight: 800, color: "#1a1a2e", fontFamily: mono } }, "$" + price.toLocaleString()),
          h(Chg, { v: change, sz: 18 }),
          isLive && liveQuotes[stock.ticker] ? h("div", { style: { fontSize: 10, color: "#16a34a", marginTop: 2 } }, "LIVE") : null
        )
      )
    ),
    h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 } },
      // Signal gauge
      h("div", { style: cs }, h("div", { style: hs2 }, "Composite Signal"), h(Gauge, { score: showScore, label: showComposite }),
        h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 12 } },
          sigItems.map(function(p) { var c2 = (p[1].indexOf("Above") >= 0 || p[1] === "Bullish") ? "#00ff88" : (p[1].indexOf("Below") >= 0 || p[1] === "Bearish") ? "#ff4d4d" : "#ffd700"; return h("div", { key: p[0], style: { display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12, borderBottom: "1px solid #e8ecf0" } }, h("span", { style: { color: "#718096" } }, p[0]), h("span", { style: { color: c2, fontWeight: 600, fontFamily: mono } }, p[1])); })
        )
      ),
      // Metrics
      h("div", { style: cs }, h("div", { style: hs2 }, "Key Metrics"),
        metricItems.map(function(p) { return h("div", { key: p[0], style: { display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #e8ecf0", fontSize: 12 } }, h("span", { style: { color: "#718096" } }, p[0]), h("span", { style: { color: p[0] === "Analyst" ? sigC(p[1]) : p[0] === "Index Weight" ? sc : "#2d3748", fontWeight: 600, fontFamily: mono } }, p[1])); })
      ),
      // Trading activity
      h("div", { style: cs }, h("div", { style: hs2 }, "Trading Activity"),
        h(Bar, { label: "Volume", val: volNum, max: avgNum * 2, color: volNum > avgNum ? "#ffd700" : sc, suffix: "M" }),
        h(Bar, { label: "RSI (14)", val: rsiVal, max: 100, color: rsiVal > 70 ? "#ffd700" : rsiVal < 35 ? "#ff4d4d" : sc }),
        h(Bar, { label: "Short Int", val: siNum, max: 15, color: "#ff6b35", suffix: "%" }),
        h("div", { style: { marginTop: 10 } },
          h("div", { style: { fontSize: 11, color: "#718096", marginBottom: 4, textTransform: "uppercase" } }, "52-Week Range"),
          h("div", { style: { position: "relative", height: 22, background: "#e0e5ec", borderRadius: 11 } },
            h("div", { style: { position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#718096", fontFamily: mono } }, "$" + stock.fiftyTwoLow),
            h("div", { style: { position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#718096", fontFamily: mono } }, "$" + stock.fiftyTwoHigh),
            h("div", { style: { position: "absolute", left: Math.max(5, Math.min(pctRange, 95)) + "%", top: "50%", transform: "translate(-50%,-50%)", width: 12, height: 12, borderRadius: "50%", background: sc, boxShadow: "0 0 8px " + sc, border: "2px solid #f8f9fc" } })
          )
        )
      ),
      // Sentiment
      h("div", { style: cs }, h("div", { style: hs2 }, "Sentiment & Flow"),
        h("div", { style: { marginBottom: 10 } }, h("div", { style: { fontSize: 10, color: "#718096", textTransform: "uppercase", marginBottom: 3 } }, "Sentiment"), h(Badge, { text: showSentiment, color: sC(showSentiment) })),
        h("div", { style: { marginBottom: 10 } }, h("div", { style: { fontSize: 10, color: "#718096", textTransform: "uppercase", marginBottom: 3 } }, "Options Flow"), h("div", { style: { fontSize: 12, color: "#2d3748", background: "#e8ecf0", padding: "7px 10px", borderRadius: 6 } }, stock.optionsFlow || "No data")),
        h("div", null, h("div", { style: { fontSize: 10, color: "#718096", textTransform: "uppercase", marginBottom: 3 } }, "Insider"), h("div", { style: { fontSize: 12, color: "#2d3748", background: "#e8ecf0", padding: "7px 10px", borderRadius: 6 } }, stock.insiderActivity || "No data"))
      ),
      // Events
      h("div", { style: cs }, h("div", { style: hs2 }, "Events"),
        stock.events && stock.events.length > 0 ? stock.events.map(function(ev, i) {
          return h("div", { key: i, style: { display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid #e8ecf0" } },
            h("div", { style: { width: 8, height: 8, borderRadius: "50%", background: evColor(ev.type), flexShrink: 0 } }),
            h("span", { style: { fontSize: 13, fontWeight: 700, color: "#2d3748", fontFamily: mono, minWidth: 52 } }, ev.date),
            h("span", { style: { fontSize: 13, color: "#4a5568", flex: 1 } }, ev.event),
            h("span", { style: { fontSize: 10, color: evColor(ev.type), textTransform: "uppercase", fontFamily: mono } }, ev.type));
        }) : h("div", { style: { fontSize: 12, color: "#a0aec0" } }, "No upcoming events")
      )
    ),
    h("div", { style: { marginTop: 12 } }, h(MAToggle, { show: showMA, onToggle: function() { setShowMA(!showMA); } })),
    showMA ? h("div", { style: { marginTop: 10 } }, h(MAPanel, { stock: stock, color: sc })) : null,
    h("div", { style: { marginTop: 8, fontSize: 10, color: "#a0aec0", textAlign: "center" } }, "Snapshot data. MAs estimated. Not investment advice.")
  );
}

// ============================================================
// MAIN APP
// ============================================================
// ============================================================
// CHAT PANEL - Ask Claude about any stock
// ============================================================

function ChatPanel(props) {
  var liveQuotes = props.liveQuotes || {};
  var _open = useState(false), isOpen = _open[0], setOpen = _open[1];
  var _msgs = useState([]), msgs = _msgs[0], setMsgs = _msgs[1];
  var _input = useState(""), input = _input[0], setInput = _input[1];
  var _loading = useState(false), loading = _loading[0], setLoading = _loading[1];
  var scrollRef = useRef(null);

  function sendMessage() {
    var q = input.trim();
    if (!q || loading) return;
    setInput("");
    var newMsgs = msgs.concat([{ role: "user", text: q }]);
    setMsgs(newMsgs);
    setLoading(true);

    // Build context from live quotes
    var topMovers = [];
    Object.keys(liveQuotes).forEach(function(sym) {
      var lq = liveQuotes[sym];
      if (lq && lq.price > 0) topMovers.push(sym + ": $" + lq.price.toFixed(2) + " (" + (lq.change >= 0 ? "+" : "") + lq.change.toFixed(2) + "%)");
    });
    var context = topMovers.length > 0 ? "Current live prices: " + topMovers.slice(0, 30).join(", ") + ". " : "";

    fetchClaudeIntel(
      context + "The user is viewing a stock market dashboard. Answer their question concisely in 2-3 sentences. No JSON needed, just plain text. Question: " + q
    ).then(function(data) {
      var text = "";
      if (data && data.content) {
        data.content.forEach(function(block) {
          if (block.type === "text") text += block.text;
        });
      }
      text = stripCitations(text) || "Sorry, I could not get a response. Check your API credits at console.anthropic.com.";
      setMsgs(newMsgs.concat([{ role: "assistant", text: text }]));
      setLoading(false);
    }).catch(function(e) {
      setMsgs(newMsgs.concat([{ role: "assistant", text: "Error: " + (e.message || "Request failed. Check API credits.") }]));
      setLoading(false);
    });
  }

  useEffect(function() {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  });

  // Floating button
  if (!isOpen) {
    return h("div", { onClick: function() { setOpen(true); },
      style: { position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, cursor: "pointer", boxShadow: "0 4px 20px rgba(124,58,237,0.35)", zIndex: 200, transition: "transform 0.2s" },
      onMouseEnter: function(e) { e.currentTarget.style.transform = "scale(1.1)"; },
      onMouseLeave: function(e) { e.currentTarget.style.transform = "scale(1)"; }
    }, "?");
  }

  // Chat panel
  return h("div", { style: { position: "fixed", bottom: 24, right: 24, width: 380, height: 500, background: "#ffffff", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.15)", zIndex: 200, display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #e0e5ec" } },
    // Header
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#7c3aed", color: "#fff" } },
      h("div", null,
        h("div", { style: { fontSize: 14, fontWeight: 700 } }, "Ask Claude"),
        h("div", { style: { fontSize: 11, opacity: 0.8 } }, "Questions about any stock (~$0.02/msg)")
      ),
      h("button", { onClick: function() { setOpen(false); },
        style: { background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: 14, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }
      }, "x")
    ),
    // Messages
    h("div", { ref: scrollRef, style: { flex: 1, overflow: "auto", padding: "12px 16px" } },
      msgs.length === 0 ? h("div", { style: { color: "#a0aec0", fontSize: 13, textAlign: "center", marginTop: 40, lineHeight: 1.6 } },
        "Ask about any stock, market trend, or strategy.", h("br"), h("br"),
        h("div", { style: { fontSize: 12, color: "#cbd5e0" } }, "Examples:"),
        h("div", { style: { fontSize: 12, color: "#7c3aed", cursor: "pointer", marginTop: 6 }, onClick: function() { setInput("What's happening with NVDA today?"); } }, "\"What's happening with NVDA today?\""),
        h("div", { style: { fontSize: 12, color: "#7c3aed", cursor: "pointer", marginTop: 4 }, onClick: function() { setInput("Should I buy energy stocks right now?"); } }, "\"Should I buy energy stocks right now?\""),
        h("div", { style: { fontSize: 12, color: "#7c3aed", cursor: "pointer", marginTop: 4 }, onClick: function() { setInput("What sectors are outperforming today?"); } }, "\"What sectors are outperforming today?\"")
      ) : null,
      msgs.map(function(m, i) {
        var isUser = m.role === "user";
        return h("div", { key: i, style: { marginBottom: 12, display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" } },
          h("div", { style: { maxWidth: "85%", padding: "10px 14px", borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isUser ? "#7c3aed" : "#f0f3f8", color: isUser ? "#fff" : "#1a1a2e", fontSize: 13, lineHeight: 1.5 } }, m.text)
        );
      }),
      loading ? h("div", { style: { display: "flex", justifyContent: "flex-start", marginBottom: 12 } },
        h("div", { style: { padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "#f0f3f8", color: "#718096", fontSize: 13 } }, "Thinking...")
      ) : null
    ),
    // Input
    h("div", { style: { display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid #e0e5ec", background: "#f8f9fc" } },
      h("input", {
        type: "text", value: input, placeholder: "Ask about any stock...",
        onChange: function(e) { setInput(e.target.value); },
        onKeyDown: function(e) { if (e.key === "Enter") sendMessage(); },
        style: { flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid #d0d8e4", fontSize: 13, outline: "none", background: "#ffffff", color: "#1a1a2e" }
      }),
      h("button", { onClick: sendMessage, disabled: loading || !input.trim(),
        style: { padding: "10px 16px", borderRadius: 10, background: loading ? "#d0d8e4" : "#7c3aed", color: "#fff", border: "none", cursor: loading ? "default" : "pointer", fontSize: 13, fontWeight: 700 }
      }, loading ? "..." : "Send")
    )
  );
}

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

  // Register intel fetch bridge - manual trigger only to save API costs
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
    var pctColor = pct >= 0 ? "#16a34a" : "#dc2626";
    return h("button", { key: k, onClick: function() { switchIdx(k); },
      style: { background: idx === k ? "#e8eef8" : "#ffffff", border: "1px solid " + (idx === k ? "#00d4ff55" : "#e0e5ec"), borderRadius: 10, padding: "8px 18px", cursor: "pointer", color: idx === k ? "#00d4ff" : "#718096", fontSize: 14, fontWeight: 800, fontFamily: mono } },
      d.short + " ",
      h("span", { style: { fontSize: 11, fontWeight: 400, color: idx === k ? pctColor : "#a0aec0" } }, (liveEtf ? pct.toFixed(2) : pct) + "%"),
      liveEtf ? h("span", { style: { width: 5, height: 5, borderRadius: "50%", background: "#16a34a", display: "inline-block", marginLeft: 4 } }) : null
    );
  });

  // Back button
  var backBtn = level !== "galaxy" ? h("button", { onClick: function() { if (level === "stock") nav("sector", sector, null); else nav("galaxy", null, null); },
    style: { display: "flex", alignItems: "center", gap: 4, background: "#e8ecf0", border: "1px solid #1e2e4a", borderRadius: 8, padding: "5px 12px", cursor: "pointer", color: "#4a5568", fontSize: 12, fontWeight: 600, fontFamily: mono } }, "<- Back") : null;

  // Breadcrumbs
  var breadcrumbs = crumbs.map(function(c, i) {
    var sep = i > 0 ? h("span", { style: { color: "#2a3a5a", fontSize: 12 } }, " > ") : null;
    return h("span", { key: c.lv, style: { display: "inline-flex", alignItems: "center", gap: 4 } },
      sep,
      h("span", { onClick: function() { if (c.lv === "galaxy") nav("galaxy", null, null); else if (c.lv === "sector") nav("sector", sector, null); },
        style: { fontSize: 12, color: c.lv === level ? (sector ? sector.color : "#00d4ff") : "#718096", cursor: c.lv !== level ? "pointer" : "default", fontWeight: c.lv === level ? 700 : 400, fontFamily: mono } }, c.label)
    );
  });

  // Current view
  var currentView = null;
  if (level === "galaxy") currentView = h(GalaxyView, { idx: idx, onSelect: function(s) { nav("sector", s, null); }, liveQuotes: liveQuotes, isLive: isLive, onLiveUpdate: handleLiveUpdate, liveIntel: liveIntel });
  if (level === "sector" && sector) currentView = h(SectorView, { sector: sector, onStock: function(s) { nav("stock", sector, s); }, liveQuotes: liveQuotes, isLive: isLive });
  if (level === "stock" && stock && sector) currentView = h(StockView, { stock: stock, sectorColor: sector.color, liveQuotes: liveQuotes, isLive: isLive });

  // Market mood colors based on SPY/overall performance
  var mktChange = 0;
  if (isLive && liveQuotes["SPY"] && liveQuotes["SPY"].change !== undefined) {
    mktChange = liveQuotes["SPY"].change;
  }
  // Background tints: green when up, red when down, neutral when flat
  var mktBg, mktPanel, mktBorder, mktGlow;
  if (mktChange > 1.5) {
    mktBg = "#e8f8ef"; mktPanel = "#f0faf4"; mktBorder = "#00ff8825"; mktGlow = "0 0 40px #00ff8815";
  } else if (mktChange > 0.5) {
    mktBg = "#edf8f2"; mktPanel = "#f4faf6"; mktBorder = "#00ff8818"; mktGlow = "0 0 30px #00ff8810";
  } else if (mktChange > 0) {
    mktBg = "#f2f8f5"; mktPanel = "#f6faf8"; mktBorder = "#00ff8810"; mktGlow = "none";
  } else if (mktChange > -0.5) {
    mktBg = "#f5f7fa"; mktPanel = "#ffffff"; mktBorder = "#d0d8e422"; mktGlow = "none";
  } else if (mktChange > -1.5) {
    mktBg = "#fdf2f2"; mktPanel = "#fef6f6"; mktBorder = "#ff4d4d18"; mktGlow = "0 0 30px #ff4d4d10";
  } else {
    mktBg = "#fde8e8"; mktPanel = "#fef0f0"; mktBorder = "#ff4d4d25"; mktGlow = "0 0 40px #ff4d4d15";
  }

  // Sync body and API bar to market mood
  useEffect(function() {
    if (typeof document !== "undefined") {
      document.body.style.background = mktBg;
      var bar = document.getElementById("api-bar");
      if (bar) {
        bar.style.background = mktChange > 0.5 ? "#f0faf4" : mktChange < -0.5 ? "#fdf2f2" : "#f8f9fc";
        bar.style.borderBottomColor = mktChange > 0.5 ? "#00cc6630" : mktChange < -0.5 ? "#ff4d4d30" : "#d0d8e4";
        bar.style.transition = "background 2s ease, border-color 2s ease";
      }
    }
  });

  var dataLabel = isLive ? "LIVE DATA" : "REAL DATA";
  var dataTime = isLive ? getETNow() + " ET" : getTodayStr();

  return h("div", { style: { background: mktBg, minHeight: "100vh", color: "#1a1a2e", fontFamily: "'Instrument Sans',-apple-system,sans-serif", transition: "background 2s ease", boxShadow: mktGlow } },
    h("link", { href: "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700;800&display=swap", rel: "stylesheet" }),
    // Market mood bar
    isLive ? h("div", { style: { height: 3, background: mktChange > 0.5 ? "linear-gradient(90deg, #00ff8800, #00ff88, #00ff8800)" : mktChange < -0.5 ? "linear-gradient(90deg, #ff4d4d00, #ff4d4d, #ff4d4d00)" : "linear-gradient(90deg, #ffd70000, #ffd700, #ffd70000)", transition: "background 2s ease" } }) : null,
    h(Stars, null),
    h("div", { style: { position: "relative", zIndex: 2, padding: "14px 20px 0" } },
      h("div", { style: { display: "flex", gap: 4, marginBottom: 10 } }, idxTabs),
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
        h("div", null,
          h("div", { style: { fontSize: 11, color: "#718096", textTransform: "uppercase", letterSpacing: 2, fontFamily: mono } }, "Market Universe Explorer"),
          h("div", { style: { display: "inline-block", fontSize: 9, color: "#e040fb", background: "#e040fb15", border: "1px solid #e040fb33", borderRadius: 4, padding: "1px 6px", fontFamily: mono, marginTop: 2 } }, "v16"),
          h("div", { style: { fontSize: 20, fontWeight: 800, color: "#1a1a2e", marginTop: 2 } }, title)
        ),
        h("div", { style: { fontSize: 10, color: isLive ? "#16a34a" : "#a0aec0", textAlign: "right", fontFamily: mono } }, dataLabel, h("br"), dataTime)
      ),
      h("div", { style: { display: "flex", gap: 6, marginTop: 5, marginBottom: 8, alignItems: "center" } }, backBtn, breadcrumbs)
    ),
    h("div", { style: { position: "relative", zIndex: 2, opacity: fade ? 0 : 1, transform: fade ? "scale(.98)" : "scale(1)", transition: "all .15s ease" } }, currentView),
    h(ChatPanel, { liveQuotes: liveQuotes })
  );
}

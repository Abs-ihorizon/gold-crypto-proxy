import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

let cache = { ts: 0, data: null };

// ✅ Root
app.get("/", (req, res) => {
  res.send("✅ Gold & Silver Worldwide Currency Proxy Running");
});

// ✅ Metals + All Currency Conversion
app.get("/api/metals", async (req, res) => {
  try {
    const now = Date.now();
    if (cache.data && now - cache.ts < 60000) {
      return res.json(cache.data);
    }

    // ✅ Gold & Silver USD Prices
    const goldRes = await fetch("https://api.metals.live/v1/spot/gold");
    const silverRes = await fetch("https://api.metals.live/v1/spot/silver");

    const goldData = await goldRes.json();   // [{ price: 2345 }]
    const silverData = await silverRes.json(); // [{ price: 27 }]

    const goldUSD = goldData[0].price;    // per ounce
    const silverUSD = silverData[0].price;

    // ✅ Currency Rates (FREE)
    const fxRes = await fetch("https://api.exchangerate.host/latest?base=USD");
    const fxData = await fxRes.json();

    const gram = 31.1034768;

    // ✅ Convert into multiple currencies
    const result = {
      updated: new Date().toUTCString(),
      gold_per_gram: {},
      silver_per_gram: {}
    };

    for (const [currency, rate] of Object.entries(fxData.rates)) {
      result.gold_per_gram[currency] = ((goldUSD / gram) * rate).toFixed(2);
      result.silver_per_gram[currency] = ((silverUSD / gram) * rate).toFixed(2);
    }

    cache = { ts: now, data: result };
    res.json(result);

  } catch (err) {
    console.error("Metals Error:", err);
    res.status(500).json({
      error: "Metals conversion failed",
      details: err.message
    });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Worldwide Gold & Silver Proxy Running on", PORT);
});

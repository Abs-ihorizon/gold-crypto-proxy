import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

let cache = { ts: 0, data: null };

app.get("/", (req, res) => {
  res.send("✅ Gold & Silver Worldwide Currency Proxy Running");
});

app.get("/api/metals", async (req, res) => {
  try {
    const now = Date.now();
    if (cache.data && now - cache.ts < 60000) {
      return res.json(cache.data);
    }

    // ✅ 1) Gold & Silver USD Price
    const metalRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=gold,silver&vs_currencies=usd"
    );
    const metalData = await metalRes.json();

    if (!metalData.gold || !metalData.silver) {
      throw new Error("Gold/Silver data missing from CoinGecko");
    }

    const goldUSD = metalData.gold.usd;
    const silverUSD = metalData.silver.usd;

    // ✅ 2) Currency Conversion
    const fxRes = await fetch("https://open.er-api.com/v6/latest/USD");
    const fxData = await fxRes.json();

    if (!fxData.rates) {
      throw new Error("Currency API did not return rates");
    }

    const gram = 31.1034768;

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Worldwide Gold & Silver Proxy Running on", PORT);
});

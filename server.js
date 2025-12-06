import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const METALS_KEY = process.env.METALS_API_KEY;

let metalsCache = { ts: 0, data: null };
let cryptoCache = { ts: 0, data: null };

// Root route
app.get("/", (req, res) => {
  res.send("✅ Proxy Server is Running. Use /api/metals or /api/crypto");
});

// Metals route
app.get("/api/metals", async (req, res) => {
  try {
    const now = Date.now();
    if (metalsCache.data && now - metalsCache.ts < 60000) return res.json(metalsCache.data);

    const response = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=${METALS_KEY}&base=USD&symbols=XAU,XAG,PKR,EUR,GBP`
    );
    const data = await response.json();
    metalsCache = { ts: now, data };
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Metals API failed" });
  }
});

// Crypto route
app.get("/api/crypto", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,pkr`
    );
    const data = await response.json();
    cryptoCache = { ts: Date.now(), data };
    res.json(data);
  } catch {
    res.status(500).json({ error: "Crypto API failed" });
  }
});

app.listen(3000, () => console.log("✅ Proxy running on port 3000"));

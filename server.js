import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors()); // ✅ Allow cross-origin requests

// Environment variable for Metals API key
const METALS_KEY = process.env.METALS_API_KEY;

// Simple caching to reduce API calls
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

    // Return cached data if less than 60 seconds old
    if (metalsCache.data && now - metalsCache.ts < 60000) {
      return res.json(metalsCache.data);
    }

    const response = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=${METALS_KEY}&base=USD&symbols=XAU,XAG,PKR,EUR,GBP`
    );

    if (!response.ok) {
      throw new Error(`Metals API response not OK: ${response.status}`);
    }

    const data = await response.json();
    metalsCache = { ts: now, data };
    res.json(data);
  } catch (err) {
    console.error("Metals fetch error:", err);
    res.status(500).json({ error: "Metals API failed", details: err.message });
  }
});

// Crypto route
app.get("/api/crypto", async (req, res) => {
  try {
    const now = Date.now();

    // Return cached data if less than 60 seconds old
    if (cryptoCache.data && now - cryptoCache.ts < 60000) {
      return res.json(cryptoCache.data);
    }

    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,pkr"
    );

    if (!response.ok) {
      throw new Error(`Crypto API response not OK: ${response.status}`);
    }

    const data = await response.json();
    cryptoCache = { ts: now, data };
    res.json(data);
  } catch (err) {
    console.error("Crypto fetch error:", err);
    res.status(500).json({ error: "Crypto API failed", details: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Proxy running on port ${PORT}`));

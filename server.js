const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
// Serve static files from the current directory (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));
app.use(express.json());

const dataFile = path.join(__dirname, 'bitcoin_data.json');

// Initialize JSON file if it doesn't exist
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify([]));
    console.log('Created bitcoin_data.json');
} else {
    console.log('Using existing bitcoin_data.json');
}

let latestPrice = null;

// Function to fetch price from Coinbase
async function fetchBitcoinPrice() {
    try {
        const response = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        latestPrice = parseFloat(data.data.amount);
        
        const timestamp = new Date().toISOString();
        const newEntry = { timestamp, price: latestPrice };

        // Read existing data
        const fileContent = fs.readFileSync(dataFile, 'utf8');
        const history = JSON.parse(fileContent);
        
        // Append new entry
        history.push(newEntry);
        
        // Save back to file
        fs.writeFileSync(dataFile, JSON.stringify(history, null, 2));
        
        console.log(`[${new Date().toLocaleTimeString()}] Saved price: $${latestPrice.toLocaleString()}`);
    } catch (e) {
        console.error("Error fetching price from Coinbase:", e.message);
    }
}

// Fetch price immediately on startup, then every 60 seconds
fetchBitcoinPrice();
setInterval(fetchBitcoinPrice, 60000);

// --- API Endpoints ---

// Get the latest price
app.get('/api/price', (req, res) => {
    if (latestPrice !== null) {
        res.json({ price: latestPrice });
    } else {
        res.status(503).json({ error: "Price not yet fetched." });
    }
});

// Get historical prices
app.get('/api/history', (req, res) => {
    try {
        const fileContent = fs.readFileSync(dataFile, 'utf8');
        const history = JSON.parse(fileContent);
        
        // Optionally, you can filter this to only return the last 24 hours, 
        // but for now we are returning everything as requested.
        res.json(history);
    } catch (e) {
        res.status(500).json({ error: "Failed to read history data." });
    }
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
    console.log(`Access your website at http://localhost:${port}/index.html`);
});

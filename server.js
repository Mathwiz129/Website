const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
// Serve static files from the current directory (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'bitcoin_data.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            price REAL NOT NULL
        )`);
    }
});

let latestPrice = null;

// Function to fetch price from CoinGecko
async function fetchBitcoinPrice() {
    try {
        // Native fetch is available in Node.js 18+
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        latestPrice = data.bitcoin.usd;
        
        // Save to DB
        db.run(`INSERT INTO prices (price) VALUES (?)`, [latestPrice], function(err) {
            if (err) {
                return console.error('Error inserting price into DB:', err.message);
            }
            console.log(`[${new Date().toLocaleTimeString()}] Saved price: $${latestPrice.toLocaleString()} (ID: ${this.lastID})`);
        });
    } catch (e) {
        console.error("Error fetching price from CoinGecko:", e.message);
    }
}

// Fetch price immediately on startup, then every 60 seconds
fetchBitcoinPrice();
setInterval(fetchBitcoinPrice, 60000);

// --- API Endpoints ---

// Get the latest price (used by the realtime clock/HUD)
app.get('/api/price', (req, res) => {
    if (latestPrice !== null) {
        res.json({ price: latestPrice });
    } else {
        res.status(503).json({ error: "Price not yet fetched." });
    }
});

// Get historical prices (used to populate the page on load)
// Returns all prices from the last 24 hours.
app.get('/api/history', (req, res) => {
    const query = `
        SELECT timestamp, price 
        FROM prices 
        WHERE timestamp >= datetime('now', '-1 day')
        ORDER BY timestamp ASC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
    console.log(`Access your website at http://localhost:${port}/index.html`);
});

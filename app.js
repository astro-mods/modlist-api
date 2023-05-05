require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json());

// Health Check

app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Healthy' });
});

// Database connection pool
const pool = mysql.createPool(process.env.DATABASE_URL);

// Routes
app.get('/mods', async (req, res) => {
  try {
    let { limit, offset, author } = req.query;
    limit = parseInt(limit);
    offset = parseInt(offset);
    
    // Set default values if limit or offset are not provided
    limit = limit || 10;
    offset = offset || 0;

    let sql = 'SELECT * FROM Mods';

    if (author) {
      sql += ' WHERE modAuthor = ?';
    }

    sql += ' LIMIT ? OFFSET ?';

    const params = author ? [author, limit, offset] : [limit, offset];

    // Ensure that limit is not greater than 100
    limit = Math.min(limit, 100);

    const [mods, fields] = await pool.query(sql, params);

    return res.json(mods);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a specific mod:
//Method: GET
//URL: /mods/{modID}
//Example: /mods/UITools
app.get('/mods/:modID', async (req, res) => {
  try {
    const { modID } = req.params;

    const [mods, fields] = await pool.query('SELECT * FROM Mods WHERE modID = ?', [modID]);

    if (mods.length === 0) {
      return res.status(404).json({ message: 'Mod not found' });
    }

    return res.json(mods[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


// Export the app for testing
module.exports = app;

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json());


// Database connection pool
const pool = mysql.createPool(process.env.DATABASE_URL);

// Routes
app.get('/mods', async (req, res) => {
    try {
      let { limit, offset } = req.query;
      
      // Set default values if limit or offset are not provided
      limit = limit || 10;
      offset = offset || 0;
  
      // Ensure that limit is not greater than 100
      limit = Math.min(limit, 100);
  
      const [mods, fields] = await pool.query('SELECT * FROM Mods LIMIT ? OFFSET ?', [limit, offset]);
  
      return res.json(mods);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
});
  

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

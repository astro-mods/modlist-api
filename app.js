require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');


const app = express();
const PORT = process.env.PORT || 3000;

const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

//Get all versions of a specific mod:
//Method: GET
//URL: /mods/{modID}/versions
//Example: /mods/UITools/versions
app.get('/mods/:modID/versions', async (req, res) => {
  try {
    const { modID } = req.params;

    const [versions, fields2] = await pool.query('SELECT * FROM ModVersions WHERE modID = ?', [modID]);

    if (versions.length === 0) {
      return res.status(404).json({ message: 'Mod or versions not found' });
    }

    return res.json(versions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

//Get a specific version of a mod:
//Method: GET
//URL: /mods/{modID}/versions/{versionNumber}
//Example: /mods/UITools/versions/1.0

app.get('/mods/:modID/versions/:versionNumber', async (req, res) => {
  try {
    const { modID, versionNumber } = req.params;

    const [versions, fields2] = await pool.query('SELECT * FROM ModVersions WHERE modID = ? AND versionNumber = ?', [modID, versionNumber]);

    if (versions.length === 0) {
      return res.status(404).json({ message: 'Mod or version not found' });
    }

    return res.json(versions[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all files for a specific mod version:
//Method: GET
//URL: /versions/{versionId}/files
//Example: /versions/11/files
app.get('/versions/:versionID/files', async (req, res) => {
  try {
    const { versionID } = req.params;

    const [files, fields2] = await pool.query('SELECT * FROM ModFiles WHERE modVersionID = ?', [versionID]);
    
    if (files.length === 0) {
      return res.status(404).json({ message: 'Mod, version, or files not found' });
    }

    return res.json(files);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


// Get a specific file for a specific mod version:
//Method: GET
//URL: /versions/{versionId}/files/{fileID}
//Example: /versions/11/files/1
app.get('/versions/:versionID/files/:fileID', async (req, res) => {
  try {
    const { versionID, fileID } = req.params;

    const [files, fields2] = await pool.query('SELECT * FROM ModFiles WHERE modVersionID = ? AND fileID = ?', [versionID, fileID]);

    if (files.length === 0) {
      return res.status(404).json({ message: 'Mod, version, or file not found' });
    }

    return res.json(files[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

//Get all dependencies for a specific mod version:
//Method: GET
//URL: /versions/{versionId}/dependencies
//Example: /versions/11/dependencies

app.get('/versions/:versionId/dependencies', async (req, res) => {
  try {
    const { versionId } = req.params;

    const [dependencies, fields2] = await pool.query('SELECT * FROM ModDependencies WHERE modVersionId = ?', [versionId]);

    if (dependencies.length === 0) {
      return res.status(404).json({ message: 'Mod, version, or dependencies not found' });
    }

    return res.json(dependencies);
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

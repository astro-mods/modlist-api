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

// Get total of whatever needed:
///Example: mods?tags=partpacks?q=vanilla

app.get('/total/mods', async (req, res) => {
  try {
    const { q } = req.query;
    let { tags } = req.query;


    let sql = 'SELECT COUNT(*) FROM Mods';

    //seperate tags by commas
    if (tags) {
      tags = tags.replace(/\s/g, '');
      const tagsArray = tags.split(',');
      
      //add tags to sql query
      sql += ' WHERE (';
      for (let i = 0; i < tagsArray.length; i++) {
        sql += 'modTags LIKE ?';
        if (i < tagsArray.length - 1) {
          sql += ' AND ';
        }
      }
      sql += ')';
    }

    //add search query to sql query
    if (q) {
      if (tags) {
        sql += ' AND ';
      } else {
        sql += ' WHERE ';
      }
      sql += 'modName LIKE ?';
    }

    const params = [];

    //add tags to params
    if (tags) {
      const tagsArray = tags.split(',');
      for (let i = 0; i < tagsArray.length; i++) {
        params.push(`%${tagsArray[i]}%`);
      }
    }

    //add search query to params
    if (q) {
      params.push(`%${q}%`);
    }
    
    const [total, fields] = await pool.query(sql, params);


    return res.json(total[0]['count(*)']);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


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
//URL: /files/{fileID}
//Example: /files/1
app.get('/files/:fileID', async (req, res) => {
  try {
    const { fileID } = req.params;

    const [files, fields2] = await pool.query('SELECT * FROM ModFiles WHERE fileID = ?', [fileID]);

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

    const [dependencies, fields2] = await pool.query('SELECT * FROM ModDependencies WHERE modVersionID = ?', [versionId]);

    if (dependencies.length === 0) {
      return res.status(404).json({ message: 'Mod, version, or dependencies not found' });
    }

    return res.json(dependencies);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

//Get everything required to install a specific mod version:
//Method: GET
//URL: /all/{modId}/{versionId}
//Example: /all/UITools/1.0.0?dependencies=optional
//Default Example: /all/UITools/latest?dependencies=required
//When a dependency is optional, it will be included in the response if ?dependencies=optional is provided.

app.get('/all/:modId/:versionNumberInput', async (req, res) => {
  try {
    const { modId, versionNumberInput } = req.params;
    const { dependencies } = req.query;

    let versionNumber = versionNumberInput;

    // if versionNumber is latest then we need to get the latest version number from the database
    if (versionNumber === 'latest') {
      const [version, fields] = await pool.query('SELECT * FROM ModVersions WHERE modID = ? ORDER BY versionNumber DESC LIMIT 1', [modId]);
      versionNumber = version[0].versionNumber;
    }


    const [mod, fields] = await pool.query('SELECT * FROM Mods WHERE modID = ?', [modId]);

    if (mod.length === 0) {
      return res.status(404).json({ message: 'Mod not found' });
    }

    const [version, fields2] = await pool.query('SELECT * FROM ModVersions WHERE modID = ? AND versionNumber = ?', [modId, versionNumber]);

    if (version.length === 0) {
      return res.status(404).json({ message: 'Version not found' });
    }

    const [files, fields3] = await pool.query('SELECT * FROM ModFiles WHERE modVersionID = ?', [version[0].modVersionID]);

    if (files.length === 0) {
      return res.status(404).json({ message: 'Files not found' });
    }

    const [dependencies2, fields4] = await pool.query('SELECT * FROM ModDependencies WHERE modVersionID = ?', [version[0].modVersionID]);
    //There can be no dependencies, so we don't need to check for a 404 here.

    // End of Queries

    // Start of Response

    const response = {
      mod: mod[0],
      version: version[0],
      files: files,
    };

    // End of Response

    // Start of Optional Dependencies

    // If there are no dependencies, we can just return the response

    if (dependencies2.length === 0) {
      return res.json(response);
    }

    // If there are dependencies, we need to check if the user wants to install the dependencies with optional and required or only the required dependencies.
    
    // If the user wants to install the optional dependencies, we can just add the dependencies to the response and return it.

    if (dependencies === 'optional') {
      response.dependencies = dependencies2;
      return res.json(response);
    }

    // If the user wants to install only the required dependencies, we need to filter out the optional dependencies.

    const requiredDependencies = dependencies2.filter((dependency) => dependency.dependencyType === 'required');

    // If there are no required dependencies, we can just return the response

    if (requiredDependencies.length === 0) {
      return res.json(response);
    }

    // If there are required dependencies, we need to add them to the response and return it.

    response.dependencies = requiredDependencies;
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

//Get every file required to install a specific mod version:
//Method: GET
//URL: /simple/{modId}/{versionNumber}
//Example: /simple/UITools/1.0.0?dependencies=optional
//Default Example: /simple/UITools/latest?dependencies=required
//When a dependency is optional, it will be included in the response if ?dependencies=optional is provided.
//This endpoint returns all file rows for that mod and all of its dependencies by looping.
//Completely different from /install/{modId}/{versionNumber}.

// That endpoint can be done later if we want to.

//Search by mod name:
//Method: GET
//URL: /search/{fragment of mod name}
//Example: /search/UITo

app.get('/search/:fragment', async (req, res) => {
  try {
    const { fragment } = req.params;

    const [mods, fields] = await pool.query('SELECT * FROM Mods WHERE modName LIKE ?', [`%${fragment}%`]);

    if (mods.length === 0) {
      return res.status(404).json({ message: 'Mod not found' });
    }

    return res.json(mods);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// List Mods with tags:
//Method: GET
//URL: /tags/{tag}
//Example: /tags/qol?limit=10&offset=0

app.get('/tags/:tags', async (req, res) => {
  try {
    let { tags } = req.params;
    let { limit, offset } = req.query;
    limit = parseInt(limit);
    offset = parseInt(offset);

    // Set default values if limit or offset are not provided
    limit = limit || 10;
    offset = offset || 0;


    // Ensure that limit is not greater than 100
    limit = Math.min(limit, 100);

    //remove spaces from tags
    tags = tags.replace(/\s/g, '');
    //seperate tags by commas
    const tagsArray = tags.split(',');

    let sql = 'SELECT * FROM Mods WHERE (';
    for (let i = 0; i < tagsArray.length; i++) {
      sql += 'modTags LIKE ?';
      if (i < tagsArray.length - 1) {
        sql += ' AND ';
      }
    }
    sql += ') LIMIT ? OFFSET ?';

    const params = [];

    for (let i = 0; i < tagsArray.length; i++) {
      params.push(`%${tagsArray[i]}%`);
    }

    params.push(limit, offset);


    const [mods, fields] = await pool.query(sql, params);

    if (mods.length === 0) {
      return res.status(404).json({ message: 'Mod not found' });
    }

    return res.json(mods);
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

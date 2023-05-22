require('dotenv').config();

const express = require('express');
const swagger = require('./swagger');
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

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check the health of the API
 *     description: Returns a JSON object with a message indicating the health of the API
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the health of the API
 *                   example: Healthy
 */
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Healthy' });
});

// Database connection pool
const pool = mysql.createPool(process.env.DATABASE_URL);

// Routes

/**
 * @swagger
 * /total/mods:
 *   get:
 *     summary: Get the total number of mods
 *     description: Returns the total number of mods in the database that match the specified tags and search query
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: A search query to filter the mods by name
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: A comma-separated list of tags to filter the mods by
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: The total number of mods that match the specified tags and search query
 *                   example: 10
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the error
 *                   example: Internal server error
 */
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

// something
// GET
//blahblah
app.get('/version/alternative/:modId/:versionNumberInput', async (req, res) => {
  try {
    const { modId, versionNumberInput } = req.params;
    const { dependencies } = req.query;

    let versionNumber = versionNumberInput;

    // if versionNumber is latest then we need to get the latest version number from the database
    if (versionNumber === 'latest') {
      const [version1, fields8] = await pool.query('SELECT * FROM ModVersions WHERE modID = ? AND versionNumber = ? ORDER BY versionNumber DESC LIMIT 1', [modId, "latest"]);
      let version = version1;
      // if there is no latest version then we need to get the latest version number from the database
      if (version1.length === 0) {
        const [version2, fields] = await pool.query('SELECT * FROM ModVersions WHERE modID = ? ORDER BY versionNumber DESC LIMIT 1', [modId]);
        version = version2;
      }      
      versionNumber = version[0].versionNumber;
    }

    const [version, fields2] = await pool.query('SELECT * FROM ModVersions WHERE modID = ? AND versionNumber = ?', [modId, versionNumber]);

    if (version.length === 0) {
      return res.status(404).json({ message: 'Version not found' });
    }
    
    // End of Queries

    // Start of Response

    const response = version[0];

    return res.json(response);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /mods:
 *   get:
 *     summary: Get a list of mods
 *     description: Retrieve a list of mods from the database, optionally filtered by search query and tags.
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: A search query to filter mods by name.
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: A comma-separated list of tags to filter mods by.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The maximum number of mods to return.
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: The number of mods to skip before returning results.
 *     responses:
 *       200:
 *         description: A list of mods matching the search criteria.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   modID:
 *                     type: string
 *                     description: The ID of the mod.
 *                   modName:
 *                     type: string
 *                     description: The name of the mod.
 *                   modDescription:
 *                     type: string
 *                     description: A description of the mod.
 *                   modAuthor:
 *                     type: string
 *                     description: The author of the mod.
 *                   modVersion:
 *                     type: string
 *                     description: The version of the mod.
 *                   modReleaseDate:
 *                     type: string
 *                     format: date-time
 *                     description: The release date of the mod.
 *                   modTags:
 *                     type: string
 *                     description: A comma-separated list of tags associated with the mod.
 *                   modIcon:
 *                     type: string
 *                     nullable: true
 *                     description: The URL of the mod's icon.
 *                   github:
 *                     type: string
 *                     nullable: true
 *                     description: The GitHub repository URL associated with the mod.
 *                   forum:
 *                     type: string
 *                     nullable: true
 *                     description: The forum URL associated with the mod.
 *                   donation:
 *                     type: string
 *                     nullable: true
 *                     description: The donation URL associated with the mod.
 *                   sponsor:
 *                     type: boolean
 *                     description: Whether the mod is currently sponsored.
 *                 example:
 *                   modID: ANAIS
 *                   modName: ANAIS
 *                   modDescription: Advanced NAvigation Innovative System
 *                   modAuthor: Altaïr
 *                   modVersion: 1.0.1
 *                   modReleaseDate: 2023-04-24T04:00:00.000Z
 *                   modTags: navigation, transfer, docking, gravity assist
 *                   modIcon: null
 *                   github: null
 *                   forum: null
 *                   donation: null
 *                   sponsor: false
 *     404:
 *       description: No mods found matching the search criteria.
 *     500:
 *       description: Internal server error.
 */
app.get('/mods', async (req, res) => {
  try {
    let { q, tags, limit, offset } = req.query;
    let fragment = q;
    limit = parseInt(limit);
    offset = parseInt(offset);

    // Set default values if limit or offset are not provided
    limit = limit || 10;
    offset = offset || 0;

    // Ensure that limit is not greater than 100
    limit = Math.min(limit, 100);
    
    let sql = 'SELECT * FROM Mods';
    const params = [];

    if (fragment) {
      sql += ' WHERE modName LIKE ?';
      params.push(`%${fragment}%`);
    }
    // Separate tags by commas
    if (tags) {
      tags = tags.replace(/\s/g, '');
      const tagsArray = tags.split(',');

      // Add tags to SQL query
      if (fragment) {
      sql += ' AND (';
      } else {
        sql += ' WHERE (';
      }
      for (let i = 0; i < tagsArray.length; i++) {
        sql += 'modTags LIKE ?';
        if (i < tagsArray.length - 1) {
          sql += ' AND ';
        }
      }
      sql += ')';
    }

    // Order By -- TODO: Order by downloads from another table
    sql += ' ORDER BY modName ASC';

    sql += ' LIMIT ? OFFSET ?';

    // Add tags to params
    if (tags) {
      const tagsArray = tags.split(',');
      for (let i = 0; i < tagsArray.length; i++) {
        params.push(`%${tagsArray[i]}%`);
      }
    }

    params.push(limit, offset);

    const [mods, fields] = await pool.query(sql, params);

    if (mods.length === 0) {  
      return res.status(404).json({ message: 'Mod not found' });
    }

    // Add modInfo table fields to each mod
    for (let i = 0; i < mods.length; i++) {
      const mod = mods[i];
      const [modInfo, fields2] = await pool.query('SELECT * FROM ModInfo WHERE modID = ?', [mod.modID]);
      
      if (modInfo.length > 0) {
        const { github, forum, donation } = modInfo[0];
        mod.github = github || null; // Assign null if github is falsy
        mod.forum = forum || null; // Assign null if forum is falsy
        mod.donation = donation || null; // Assign null if donation is falsy
      } else {
        // Handle the case where no modInfo is found for the given modID
        mod.github = null;
        mod.forum = null;
        mod.donation = null;
      }
      
      delete mod.modInfo; // Optionally, remove the modInfo property if it's no longer needed
    }

        // Get Sponsored Mod from Sponsors table and add it to the front
    // Sponsor is determined by current date "1"	"parteditor"	"2023-05-15"	"2023-05-17"
    const [sponsors, fields3] = await pool.query('SELECT * FROM Sponsors WHERE start <= ? AND end >= ?', [new Date(), new Date()]);
    // if sponsor mod lenght is not null and fragment is null
    
    if (sponsors.length > 0 && q === undefined && offset === 0 && tags === undefined) {
      const sponsor = sponsors[0];
      const [sponsorMod, fields4] = await pool.query('SELECT * FROM Mods WHERE modID = ?', [sponsor.modID]);
      if (sponsorMod.length > 0) {
      

        // Add modInfo table fields to mod
        const [modInfo, fields5] = await pool.query('SELECT * FROM ModInfo WHERE modID = ?', [sponsor.modID]);
        if (modInfo.length > 0) {
          const { github, forum, donation } = modInfo[0];
          sponsorMod[0].github = github || null; // Assign null if github is falsy
          sponsorMod[0].forum = forum || null; // Assign null if forum is falsy
          sponsorMod[0].donation = donation || null; // Assign null if donation is falsy
          sponsorMod[0].sponsor = true;
          delete sponsorMod[0].modInfo; // Optionally, remove the modInfo property if it's no longer needed
        } else {
          // Handle the case where no modInfo is found for the given modID
          sponsorMod[0].github = null;
          sponsorMod[0].forum = null;
          sponsorMod[0].donation = null;
          sponsorMod[0].sponsor = true;
        }
        mods.unshift(sponsorMod[0]);
      }
    }
         


    return res.json(mods);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});



// List all file links for downloading a specific mod version
//Method: GET
//URL: /download/{versionId}/
//Example: /download/3/

/**
 * @swagger
 * /download/{versionId}:
 *   get:
 *     summary: Download all dependencies for a mod version
 *     description: Retrieve a list of all dependencies for a mod version, and download the files associated with those dependencies.
 *     parameters:
 *       - in: path
 *         name: versionId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the mod version to download dependencies for.
 *     responses:
 *       200:
 *         description: A list of files associated with the mod version's dependencies.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fileURL:
 *                     type: string
 *                     description: The URL of the file to download.
 *                   fileType:
 *                     type: string
 *                     description: The type of file to download.
 *                 example:
 *                   fileURL: https://example.com/mods/dependencies/dependency1.zip
 *                   fileType: zip
 *     404:
 *       description: No dependencies found for the specified mod version.
 *     500:
 *       description: Internal server error.
 */
async function getAllDependencies(versionId, pool) {
  const allDependencies = await getAllDependenciesHelper([versionId], pool, new Set());
  return Array.from(allDependencies);
}

async function getAllDependenciesHelper(versionIds, pool, fetchedDependencies) {
  const idsToFetch = versionIds.filter((id) => !fetchedDependencies.has(id));
  if (idsToFetch.length === 0) {
    // All dependencies have been fetched, return a Set of unique IDs as strings
    return Array.from(fetchedDependencies).map((id) => id.toString());
  }

  const [dependencies, fields] = await pool.query('SELECT * FROM ModDependencies WHERE modVersionID IN (?)', [idsToFetch]);
  const dependencyModIDs = dependencies.map((dependency) => dependency.dependencyModID);

  let dependencyVersionIDs = [];
  if (dependencyModIDs.length > 0) {
    const [dependencyVersions, fields2] = await pool.query('SELECT * FROM ModVersions WHERE modID IN (?)', [dependencyModIDs]);
    dependencyVersionIDs = dependencyVersions.map((dependencyVersion) => dependencyVersion.modVersionID);
  }

  const nestedDependencies = await getAllDependenciesHelper(dependencyVersionIDs, pool, new Set([...fetchedDependencies, ...idsToFetch]));
  const allDependencies = new Set([...dependencyVersionIDs, ...nestedDependencies].map((id) => id.toString()));
  return allDependencies;
}

app.get('/download/:versionId', async (req, res) => {
  try {
    const { versionId } = req.params;

    // Save all dependencies to a Set

    let dependencyToDownlodIds = new Set();

    const allDependencies = await getAllDependencies(versionId, pool);
    dependencyToDownlodIds = allDependencies;
        
    const [dependencyFiles, fields] = await pool.query('SELECT fileURL, fileType FROM ModFiles WHERE modVersionID IN (?)', [dependencyToDownlodIds]);

    res.json(dependencyFiles);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


// Call the Swagger middleware
swagger(app);

// Export the app for testing
module.exports = app;

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

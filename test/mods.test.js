const request = require('supertest');
const app = require('../app');

describe('GET /mods', () => {
    test('responds with JSON', (done) => {
        request(app)
        .get('/mods')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });
});

  
describe('GET /mods/:modID', () => {
  test('should return the correct mod', async () => {
    // Make a request to the endpoint
    const res = await request(app).get('/mods/modIDTEST');
    
    // Check that the response has a 200 status code
    expect(res.statusCode).toBe(200);
    
    // Check that the response body contains the correct mod
    expect(res.body).toEqual({
      modID: 'modIDTEST',
      modIcon: null,
      modName: 'ModID Test',
      modAuthor: 'nim',
      modDescription: 'This is not a mod and it is used for API tests.',
      modVersion: '0.0.1',
      modReleaseDate: '2023-05-04T04:00:00.000Z',
      modTags: 'test,official'
    });
  });

  test('should return a 404 if the mod is not found', async () => {
    // Make a request to the endpoint with an invalid mod ID
    const res = await request(app).get('/mods/invalidModIDTEST');
    
    // Check that the response has a 404 status code
    expect(res.statusCode).toBe(404);
    
    // Check that the response body contains the correct message
    expect(res.body).toEqual({
      message: 'Mod not found'
    });
  });
});

describe('GET /mods/:modID/versions', () => {
  test('should return the correct versions', async () => {
    // Make a request to the endpoint
    const res = await request(app).get('/mods/modIDTEST/versions');
    
    // Check that the response has a 200 status code
    expect(res.statusCode).toBe(200);
    
    // Check that the response body contains the correct versions
    expect(res.body).toEqual([
      {
        modVersionID: 11,
        modID: 'modIDTEST',
        versionNumber: '1.0.1',
        releaseDate: '2023-05-05T04:00:00.000Z',
        changelog: 'Added nothing this is a test version.'
      }
    ]);
  });

  test('should return a 404 if the mod is not found', async () => {
    // Make a request to the endpoint with an invalid mod ID
    const res = await request(app).get('/mods/invalidModIDTEST/versions');
    
    // Check that the response has a 404 status code
    expect(res.statusCode).toBe(404);
    
    // Check that the response body contains the correct message
    expect(res.body).toEqual({
      message: 'Mod or versions not found'
    });
  });
}
);

describe('GET /mods/:modID/versions/:versionNumber', () => {
  test('should return the correct version', async () => {
    // Make a request to the endpoint
    const res = await request(app).get('/mods/modIDTEST/versions/1.0.1');
    
    // Check that the response has a 200 status code
    expect(res.statusCode).toBe(200);
    
    // Check that the response body contains the correct version
    expect(res.body).toEqual({
      modVersionID: 11,
      modID: 'modIDTEST',
      versionNumber: '1.0.1',
      releaseDate: '2023-05-05T04:00:00.000Z',
      changelog: 'Added nothing this is a test version.'
    });
  });

  test('should return a 404 if the version is not found', async () => {
    // Make a request to the endpoint with an invalid version number
    const res = await request(app).get('/mods/modIDTEST/versions/invalidVersionNumber');
    
    // Check that the response has a 404 status code
    expect(res.statusCode).toBe(404);
    
    // Check that the response body contains the correct message
    expect(res.body).toEqual({
      message: 'Mod or version not found'
    });
  });
});


describe('GET /versions/:versionID/files', () => {
  test('should return the correct files', async () => {
    // Make a request to the endpoint
    const res = await request(app).get('/versions/11/files');
    
    // Check that the response has a 200 status code
    expect(res.statusCode).toBe(200);
    
    // Check that the response body contains the correct files
    expect(res.body).toEqual([
      {
        fileID: 8,
        modVersionID: "11",
        fileType: "mod",
        fileSize: 1,
        fileURL: "cdn.astromods.xyz/test",
        uploadDate: null
      }
    ]);
  });
  
  test('should return a 404 if the version is not found', async () => {
    // Make a request to the endpoint with an invalid version ID
    const res = await request(app).get('/versions/invalidVersionID/files');
    
    // Check that the response has a 404 status code
    expect(res.statusCode).toBe(404);
    
    // Check that the response body contains the correct message
    expect(res.body).toEqual({
      message: 'Mod, version, or files not found'
    });
  });
});

describe('GET /versions/:versionID/files/:fileID', () => {
  test('should return the correct file', async () => {
    // Make a request to the endpoint
    const res = await request(app).get('/versions/11/files/8');
    
    // Check that the response has a 200 status code
    expect(res.statusCode).toBe(200);
    
    // Check that the response body contains the correct file
    expect(res.body).toEqual({
      fileID: 8,
      modVersionID: "11",
      fileType: "mod",
      fileSize: 1,
      fileURL: "cdn.astromods.xyz/test",
      uploadDate: null
    });
  }
  );

  test('should return a 404 if the file is not found', async () => {
    // Make a request to the endpoint with an invalid file ID
    const res = await request(app).get('/versions/11/files/invalidFileID');
    
    // Check that the response has a 404 status code
    expect(res.statusCode).toBe(404);
    
    // Check that the response body contains the correct message
    expect(res.body).toEqual({
      message: 'Mod, version, or file not found'
    });
  }
  );
}
);


describe('GET /versions/:versionID/dependencies', () => {
  test('should return the correct dependencies', async () => {
    // Make a request to the endpoint
    const res = await request(app).get('/versions/11/dependencies');
    
    // Check that the response has a 200 status code
    expect(res.statusCode).toBe(200);
    
    // Check that the response body contains the correct dependencies
    expect(res.body).toEqual([
      {
        id: 4,
        modVersionID: "11",
        dependencyModID: "UITools",
        minimumDependencyVersion: "1.0.0",
        maximumDependencyVersion: "1.0.1",
        dependencyType: "optional"
      }
    ]);
  }
  );

  test('should return a 404 if the version is not found', async () => {
    // Make a request to the endpoint with an invalid version ID
    const res = await request(app).get('/versions/invalidVersionID/dependencies');
    
    // Check that the response has a 404 status code
    expect(res.statusCode).toBe(404);
    
    // Check that the response body contains the correct message
    expect(res.body).toEqual({
      message: 'Mod, version, or dependencies not found'
    });
  }
  );
});



  
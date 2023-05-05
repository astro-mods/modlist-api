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
  
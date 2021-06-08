const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const cache = require('memory-cache');
const crypto = require('crypto');
const querystring = require('querystring');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express()
dotenv.config()
var options = {
  host: 'https://gateway.marvel.com',
  method: 'GET'
};

const ts = Date.now();
const publicKey = process.env.MARVEL_PUBLIC_KEY;
const privateKey = process.env.MARVEL_PRIVATE_KEY;

const hash = crypto.createHash('md5').update(ts + privateKey + publicKey).digest('hex')
const cqueries = {
  ts: ts,
  apikey: publicKey,
  hash: hash
}

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const query = cqueries;
query.limit = 100
const queryString = querystring.stringify(query)

/**
 * @swagger
 * GET /characters:
 *   get:
 *     summary: Retrieve a list of IDs of Marvel characters
 *     tags: 
 *       - Characters
 *     description: Retrieve a list of IDs of Marvel characters from Marvel API. Returned IDs can be used get Marcel character's information when requests on endpoint `/characters/:characterId`.
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: false
 *         default: 100
 *         description: Maximum ID of the characters to retrieve. Maximum is 100, more than 100 will be set to 100.
 *         schema:
 *           type: integer
 *       - in: path
 *         name: offset
 *         required: false
 *         default: 0
 *         description: Offset of results to be queries,
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: integer
 *               example: [1009159,1009160,1010784,1011275,1011012,1011298,1010827,1009740,1010748,1009161]
*/
app.get('/characters', (req, res) => {
  (async () => {
    const offset = parseInt(req.query.offset || 0);
    let limit = parseInt(req.query.limit || 100);
    if (limit > 100) {
      limit = 100;
    }
    const cacheKey = 'characters-' + offset + '-' + limit; 
    let data = cache.get(cacheKey);
    
    if (data) {
      return res.send(data);
    }

    const response = await axios.get(`${options.host}/v1/public/characters?${queryString}`);

    const result = response.data.data.results;
    let ids = result.map(({ id }) => id);

    const cacheTime = 1000 * 60 * 60; // 1 hour
    cache.put(cacheKey, ids, cacheTime);
  
    res.send(ids);
  })();
});

/**
 * @swagger
 * GET /characters/:characterId:
 *   get:
 *     summary: Retrieve a Marvel character's information.
 *     tags: 
 *       - Characters
 *     parameters:
 *       - in: path
 *         name: characterId
 *         required: true
 *         description: ID of Marvel character that desired to get.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Marvel character's information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The character ID.
 *                   example: 1017100
 *                 name:
 *                   type: string
 *                   description: The character's name.
 *                   example: A-Bomb (HAS)
 *                 description:
 *                   type: string
 *                   description: The description of character.
 *                   example: Rick Jones has been Hulk's best bud since day one, but now he's more than a friend...he's a teammate! Transformed by a Gamma energy explosion, A-Bomb's thick, armored skin is just as strong and powerful as it is blue. And when he curls into action, he uses it like a giant bowling ball of destruction! 
 */
app.get('/characters/:characterId', (req, res) => {
  (async () => {
    const characterId = req.params.characterId;
    const response = await axios.get(`${options.host}/v1/public/characters/${characterId}?${queryString}`);
    const result = response.data.data.results;
    const filter = {
      id: result[0].id,
      name: result[0].name,
      description: result[0].description
    };
    console.log(filter)
    
    res.send(filter);
  })();
});

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Express API for JSONPlaceholder',
    version: '1.0.0',
  },
};

const swaggerOptions = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['index.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.listen(process.env.APP_PORT, () => {
  console.log(`Example app listening at http://localhost:${process.env.APP_PORT}`)
});

module.exports = app;

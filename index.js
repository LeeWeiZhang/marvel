const express = require('express');
let dotenv = require('dotenv');
const axios = require('axios');
var cache = require('memory-cache');
const crypto = require('crypto');
const querystring = require('querystring');


const app = express()
dotenv.config()
var options = {
  host: 'http://gateway.marvel.com',
  path: '/',
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

app.get('/characters', (req, res) => {
  (async () => {
    const offset = parseInt(req.query.offset || 0);
    const limit = parseInt(req.query.limit || 100);
    try {
      const cacheKey = 'characters-' + offset + '-' + limit; 
      let data = cache.get(cacheKey);
      
      if (data) {
        res.send(data);
        return;
      }

      const response = await axios.get(`${options.host}/v1/public/characters?${queryString}`)

      // console.log(response.data.data);
      // console.log(response.data.explanation);
      const result = response.data.data.results;
      let ids = result.map(({ id }) => id)

      cache.put(cacheKey, ids, 100000); // Time in ms
    
      res.send(ids)

      // res.send(response.data.data.results)
    } catch (error) {
      console.log(error.response.body);
    }
  })();
  
});

app.listen(process.env.APP_PORT, () => {
  console.log(`Example app listening at http://localhost:${process.env.APP_PORT}`)
})
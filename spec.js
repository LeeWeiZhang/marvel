const app = require('./index');
const chai = require('chai')
const chaiHttp = require('chai-http');
const assert = require('chai').assert;
const should = chai.should();
const expect = chai.expect;

chai.use(chaiHttp);

describe('GET /characters', () => {
  it('should return list of character\'s ids', async () => {
    const res = await chai
      .request(app)
      .get('/characters')
      .timeout(10000)
      .send();
      expect(res.status).to.equal(200);
      assert.isArray(res.body);
  });
});

describe('GET /characters/:characterId', () => {
  it('character information of the id specify', async () => {
    const res = await chai
      .request(app)
      .get('/characters/1017100')
      .timeout(10000)
      .send();
      
    expect(res.status).to.equal(200);
    res.body.should.have.property('id');
    res.body.should.have.property('name');
    res.body.should.have.property('description');
  });
});

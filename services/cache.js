//----------- Redis Cache --------------

const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

//Restricting routes to be cached
mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;

  this.hashKey = JSON.stringify(options.key || 'default_key');
  //make cache() chainable in use
  return this;
}


mongoose.Query.prototype.exec = async function () {
  console.log('Iam About to run a query');

  if(!this.useCache){
    return exec.apply(this, arguments);
  }

  //Key generation
  const key = JSON.stringify(Object.assign({},this.getQuery(), {
    collection: this.mongooseCollection.name
  }));
  console.log(key);

  //check if key is there in redis
  const cacheValue = await client.hget(this.hashKey, key);

  if(cacheValue){
    console.log("data from Redis");
    const doc = JSON.parse(cacheValue);
    //Hydrating arrays
    return Array.isArray(doc)
        ? doc.map(d => new this.model(d))
        : new this.model(doc);
  }

//Hydrating Models -- giving mongo actually what it needs i.e more than JSON
  const result = await exec.apply(this, arguments);

  client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10);

   return result;

};

module.exports = {
  clearHash(hashKey){
    client.del(JSON.stringify(hashKey));
  }
};
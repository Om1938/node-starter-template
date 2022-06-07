const { MongoClient } = require("mongodb");

let db = (async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
  const dbName = process.env.DB_NAME || "template";
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    await client.connect();
    console.log("Conected to MongoDB");
    return client.db(dbName);
  } catch (err) {
    console.log("Unable to connect to mongo DB" + err);
  }
})();

module.exports = db;

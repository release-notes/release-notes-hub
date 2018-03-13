const MongoClient = require('mongodb').MongoClient;
const { mongoose: mongoConfig } = require('../../config/application');

const assembleConnectionUri = ({ host, port, user, password, database }) => {
  let connectionUri = `mongodb://`;

  if (user && password) connectionUri += `${user}:${password}@`;

  connectionUri += host;

  if (port) connectionUri += `:${port}`;
  if (database) connectionUri += `/${database}`;

  return connectionUri;
};

module.exports = async function() {
  const connectionString = assembleConnectionUri(mongoConfig.connection);

  const client = await MongoClient.connect(connectionString);

  return {
    client,
    db: client.db(),
    close() {
      client.close();
    }
  };
};

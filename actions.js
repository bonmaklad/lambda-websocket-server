import AWS from 'aws-sdk';
import mariadb from 'mariadb';

const ENDPOINT = 'wss://ysvh3kcbwg.execute-api.ap-southeast-2.amazonaws.com/production/';
const client = new AWS.ApiGatewayManagementApi({ endpoint: ENDPOINT });

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

const sendToOne = async (id, body) => {
  try {
    await client.postToConnection({
      'ConnectionId': id,
      'Data': Buffer.from(JSON.stringify(body)),
    }).promise();
  } catch (err) {
    console.error(err);
  }
};

const sendToAll = async (ids, body) => {
  const all = ids.map(i => sendToOne(i, body));
  return Promise.all(all);
};

export const $connect = async () => {
  return {};
};

export const setName = async (payload, meta) => {
  const connection = await pool.getConnection();
  try {
    const query = "INSERT INTO users (id, name) VALUES (?, ?)";
    await connection.query(query, [meta.id, payload.user]);

    const result = await connection.query("SELECT user FROM users");
    const users = result.map(row => row.user);

    await sendToAll(Object.keys(users), { members: users });
    await sendToAll(Object.keys(users), { systemMessage: `${payload.user} has joined the chat` });
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }

  return {};
};

export const sendPublic = async (payload, meta) => {
  const connection = await pool.getConnection();
  try {
    const query = "SELECT user FROM users WHERE id = ?";
    const result = await connection.query(query, [meta.connectionId]);
    const senderUser = result[0].user;

    const message = `${senderUser}: ${payload.message}`;
    await sendToAll(Object.keys(ids), { publicMessage: message });
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }

  return {};
};

export const sendPrivate = async (payload, meta) => {
  const connection = await pool.getConnection();
  try {
    const senderQuery = "SELECT user FROM users WHERE id = ?";
    const senderResult = await connection.query(senderQuery, [meta.connectionId]);
    const senderUser = senderResult[0].user;

    const receiverQuery = "SELECT id FROM users WHERE user = ?";
    const receiverResult = await connection.query(receiverQuery, [payload.to]);
    const receiverId = receiverResult[0].id;

    const message = `${senderUser}: ${payload.message}`;
    await sendToOne(receiverId, { privateMessage: message });
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }

  return {};
};

export const $disconnect = async (payload, meta) => {
  const connection = await pool.getConnection();
  try {
    const deleteQuery = "DELETE FROM users WHERE id = ?";
    await connection.query(deleteQuery, [meta.id]);

    const result = await connection.query("SELECT user FROM users");
    const users = result.map(row => row.user);

    await sendToAll(Object.keys(users), { systemMessage: `${users[meta.id]} has left the chat` });
    delete users[meta.id];

    await sendToAll(Object.keys(users), { members: Object.values(users) });
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }

  return {};
};


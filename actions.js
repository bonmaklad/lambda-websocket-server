import AWS from 'aws-sdk';
import mariadb from 'mariadb';



const ENDPOINT = 'wss://ysvh3kcbwg.execute-api.ap-southeast-2.amazonaws.com/production/';
const client = new AWS.ApiGatewayManagementApi({ endpoint: ENDPOINT });

const pool = mariadb.createPool({
  host: "messengerdb.cva032mpvazr.ap-southeast-2.rds.amazonaws.com",
  user: "admin",
  password: "73s95dFG1!",
  database: "messenger",
  connectionLimit: 20,
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

export const setName = async (payload) => {
  const connection = await pool.getConnection();
  try {
    const selectQuery = "SELECT name, email, photo FROM messenger.users WHERE email = ?";
    const insertQuery = "INSERT INTO messenger.users (name, email) VALUES (?, ?)";

    const result = await connection.query(selectQuery, [payload.email]);
    if (result.length > 0) {
      // User already exists, return the name, email, and photo
      const { name, email, photo } = result[0];
      return { name, email, photo };
    } else {
      // User doesn't exist, create a new entry
      await connection.query(insertQuery, [payload.name, payload.email]);

      // Return the name, email, and null photo for the newly created user
      return { name: payload.name, email: payload.email, photo: null };
    }
  } catch (err) {
    console.error(err);
    throw err; // Rethrow the error to be caught by the caller
  } finally {
    if (connection) {
      connection.release();
    }
  }
};






export const updateName = async (payload, meta) => {
  const connection = await pool.getConnection();
  try {
    const query = "UPDATE users SET name = ? WHERE id = ?";
    await connection.query(query, [payload.name, payload.id]);

    // Return the updated name in the response
    return { name: payload.name };
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


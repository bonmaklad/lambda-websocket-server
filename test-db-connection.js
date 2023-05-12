import mariadb from 'mariadb';

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

(async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Database connection successful!');
    // You can perform additional database operations here
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    if (connection) {
      connection.end();
    }
  }
})();


require("dotenv").config();
const oracledb = require("oracledb");

// Oracle 연결 옵션
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT, // localhost:1521/orcl 이런거
};

// 공통 query 함수
async function query(sql, binds = {}, options = {}) {
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(sql, binds, options);
    return result;
  } catch (err) {
    console.error("DB ERROR:", err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Close error:", e);
      }
    }
  }
}

module.exports = { query };

// db/pool.js
const oracledb = require("oracledb");
require("dotenv").config();

async function initDB() {
  try {
    // Windows에서 Instant Client 사용 시
    if (process.env.DB_LIB_DIR) {
      oracledb.initOracleClient({ libDir: process.env.DB_LIB_DIR });
    }

    await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT,
    });

    console.log("Oracle DB Pool Created");
  } catch (err) {
    console.error("DB Connection Error:", err);
  }
}

module.exports = { initDB };

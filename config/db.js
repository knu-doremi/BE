const oracledb = require('oracledb');
require('dotenv').config();

let pool;

/**
 * Oracle DB 연결 풀 초기화
 */
async function initializeDB() {
  try {
    if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_CONNECTION_STRING) {
      console.log('DB 설정이 없습니다. DB 기능을 사용할 수 없습니다.');
      return null;
    }

    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
    });
    console.log('Oracle DB 연결 풀 생성 완료');
    return pool;
  } catch (err) {
    console.error('DB 연결 오류:', err);
    throw err;
  }
}

/**
 * DB 연결 풀 가져오기
 */
function getPool() {
  if (!pool) {
    throw new Error('DB 연결 풀이 초기화되지 않았습니다. initializeDB()를 먼저 호출하세요.');
  }
  return pool;
}

/**
 * DB 연결 풀 종료
 */
async function closePool() {
  if (pool) {
    await pool.close();
    console.log('DB 연결 풀 종료 완료');
  }
}

module.exports = {
  initializeDB,
  getPool,
  closePool,
};


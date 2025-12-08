const { getPool } = require('../config/db');
const oracledb = require('oracledb');

/**
 * LIKES 테이블 관련 데이터 접근 로직
 */

/**
 * 특정 게시물에 user가 좋아요를 눌렀는지 확인
 * @param {number} POST_ID - 게시물 ID
 * @param {string} USER_ID - 사용자 ID
 * @returns {Promise<boolean>} 좋아요 여부
 */
async function checkLike(POST_ID, USER_ID) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT 1 
       FROM LIKES 
       WHERE POST_ID = :post_id AND USER_ID = :user_id`,
      {
        post_id: { val: POST_ID, type: oracledb.NUMBER },
        user_id: USER_ID,
      }
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('좋아요 확인 오류:', error);
    throw error;
  } finally {
    await connection.close();
  }
}

module.exports = {
  checkLike,
};

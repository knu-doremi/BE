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

/**
 * 좋아요 추가
 * @param {number} POST_ID - 게시물 ID
 * @param {string} USER_ID - 사용자 ID
 * @returns {Promise<boolean>} 추가 성공 여부
 */
async function addLike(POST_ID, USER_ID) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    // 이미 좋아요가 있는지 확인
    const isLiked = await checkLike(POST_ID, USER_ID);
    if (isLiked) {
      return false; // 이미 좋아요가 있으면 추가하지 않음
    }
    
    const result = await connection.execute(
      `INSERT INTO LIKES (POST_ID, USER_ID) 
       VALUES (:post_id, :user_id)`,
      {
        post_id: { val: POST_ID, type: oracledb.NUMBER },
        user_id: USER_ID,
      },
      { autoCommit: true }
    );
    
    return result.rowsAffected > 0;
  } catch (error) {
    console.error('좋아요 추가 오류:', error);
    throw error;
  } finally {
    await connection.close();
  }
}

/**
 * 좋아요 취소
 * @param {number} POST_ID - 게시물 ID
 * @param {string} USER_ID - 사용자 ID
 * @returns {Promise<boolean>} 취소 성공 여부
 */
async function deleteLike(POST_ID, USER_ID) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `DELETE FROM LIKES 
       WHERE POST_ID = :post_id AND USER_ID = :user_id`,
      {
        post_id: { val: POST_ID, type: oracledb.NUMBER },
        user_id: USER_ID,
      },
      { autoCommit: true }
    );
    
    return result.rowsAffected > 0;
  } catch (error) {
    console.error('좋아요 취소 오류:', error);
    throw error;
  } finally {
    await connection.close();
  }
}

/**
 * 좋아요 토글 (있으면 삭제, 없으면 추가)
 * @param {number} POST_ID - 게시물 ID
 * @param {string} USER_ID - 사용자 ID
 * @returns {Promise<boolean>} 토글 후 좋아요 상태 (true: 좋아요됨, false: 좋아요 취소됨)
 */
async function toggleLike(POST_ID, USER_ID) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    // 1. 좋아요 존재 여부 확인 (autoCommit: false로 트랜잭션 시작)
    const checkResult = await connection.execute(
      `SELECT 1 
       FROM LIKES 
       WHERE POST_ID = :post_id AND USER_ID = :user_id`,
      {
        post_id: { val: POST_ID, type: oracledb.NUMBER },
        user_id: USER_ID,
      },
      { autoCommit: false }
    );
    
    let isLiked = false;
    
    if (checkResult.rows.length > 0) {
      // 2. 이미 존재하면 삭제 (좋아요 취소)
      await connection.execute(
        `DELETE FROM LIKES 
         WHERE POST_ID = :post_id AND USER_ID = :user_id`,
        {
          post_id: { val: POST_ID, type: oracledb.NUMBER },
          user_id: USER_ID,
        },
        { autoCommit: false }
      );
      isLiked = false;
    } else {
      // 3. 없으면 추가 (좋아요)
      await connection.execute(
        `INSERT INTO LIKES (POST_ID, USER_ID) 
         VALUES (:post_id, :user_id)`,
        {
          post_id: { val: POST_ID, type: oracledb.NUMBER },
          user_id: USER_ID,
        },
        { autoCommit: false }
      );
      isLiked = true;
    }
    
    // 트랜잭션 커밋
    await connection.commit();
    
    return isLiked;
  } catch (error) {
    // 트랜잭션 롤백
    await connection.rollback();
    console.error('좋아요 토글 오류:', error);
    throw error;
  } finally {
    await connection.close();
  }
}

/**
 * 유저가 받은 총 좋아요 수 조회
 * @param {string} USER_ID - 사용자 ID
 * @returns {Promise<number>} 총 좋아요 수
 */
async function countReceivedLikes(USER_ID) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT COUNT(l.POST_ID) AS TotalLikes 
       FROM POST p
       JOIN LIKES l ON p.POST_ID = l.POST_ID
       WHERE p.USER_ID = :user_id`,
      {
        user_id: USER_ID,
      }
    );
    
    const totalLikes = result.rows.length > 0 && result.rows[0][0] !== null 
      ? Number(result.rows[0][0]) 
      : 0;
    
    return totalLikes;
  } catch (error) {
    console.error('좋아요 집계 오류:', error);
    throw error;
  } finally {
    await connection.close();
  }
}

module.exports = {
  checkLike,
  addLike,
  deleteLike,
  toggleLike,
  countReceivedLikes,
};

const { getPool } = require('../config/db');
const oracledb = require('oracledb');

/**
 * HASHTAG 테이블 관련 데이터 접근 로직
 */

/**
 * 해시태그 생성
 * @param {string} hashtagName - 해시태그 이름
 * @param {number} postId - 게시물 ID
 * @returns {Promise<number>} 생성된 HASHTAG_ID
 */
async function createHashtag(hashtagName, postId) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `INSERT INTO HASHTAG (Hashtag_id, Hashtag_name, Post_id) 
       VALUES (NVL((SELECT MAX(Hashtag_id) FROM HASHTAG), 0) + 1, :hashtag_name, :post_id) 
       RETURNING Hashtag_id INTO :hashtag_id`,
      {
        hashtag_name: hashtagName,
        post_id: postId,
        hashtag_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
      },
      { autoCommit: true }
    );
    
    return result.outBinds.hashtag_id[0];
  } finally {
    await connection.close();
  }
}

/**
 * 게시물 ID로 해시태그 목록 조회
 * @param {number} postId - 게시물 ID
 * @returns {Promise<Array>} 해시태그 목록
 */
async function getHashtagsByPostId(postId) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT Hashtag_id, Hashtag_name, Post_id 
       FROM HASHTAG 
       WHERE Post_id = :post_id 
       ORDER BY Hashtag_id`,
      {
        post_id: postId,
      }
    );
    
    const hashtags = result.rows.map(row => ({
      hashtagId: row[0] ? Number(row[0]) : null,
      hashtagName: row[1] ? String(row[1]) : null,
      postId: row[2] ? Number(row[2]) : null,
    }));
    
    return hashtags;
  } finally {
    await connection.close();
  }
}

/**
 * 해시태그 이름으로 게시물 목록 조회
 * @param {string} hashtagName - 해시태그 이름
 * @returns {Promise<Array>} 게시물 ID 목록
 */
async function getPostIdsByHashtag(hashtagName) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT DISTINCT Post_id 
       FROM HASHTAG 
       WHERE Hashtag_name = :hashtag_name 
       ORDER BY Post_id DESC`,
      {
        hashtag_name: hashtagName,
      }
    );
    
    const postIds = result.rows.map(row => row[0] ? Number(row[0]) : null).filter(id => id !== null);
    
    return postIds;
  } finally {
    await connection.close();
  }
}

/**
 * 해시태그 삭제
 * @param {number} hashtagId - 해시태그 ID
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
async function deleteHashtag(hashtagId) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `DELETE FROM HASHTAG WHERE Hashtag_id = :hashtag_id`,
      {
        hashtag_id: { val: hashtagId, type: oracledb.NUMBER },
      },
      { autoCommit: true }
    );
    
    return result.rowsAffected > 0;
  } finally {
    await connection.close();
  }
}

/**
 * 게시물의 모든 해시태그 삭제
 * @param {number} postId - 게시물 ID
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
async function deleteHashtagsByPostId(postId) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `DELETE FROM HASHTAG WHERE Post_id = :post_id`,
      {
        post_id: { val: postId, type: oracledb.NUMBER },
      },
      { autoCommit: true }
    );
    
    return result.rowsAffected > 0;
  } finally {
    await connection.close();
  }
}

/**
 * 인기 해시태그 조회 (게시물 수 기준)
 * @param {number} limit - 조회할 해시태그 개수 (기본값: 10)
 * @returns {Promise<Array>} 인기 해시태그 목록
 */
async function getPopularHashtags(limit = 10) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT Hashtag_name, COUNT(*) as PostCount
       FROM HASHTAG
       GROUP BY Hashtag_name
       ORDER BY PostCount DESC, Hashtag_name
       FETCH FIRST :limit ROWS ONLY`,
      {
        limit: limit,
      }
    );
    
    const hashtags = result.rows.map(row => ({
      hashtagName: row[0] ? String(row[0]) : null,
      postCount: row[1] ? Number(row[1]) : 0,
    }));
    
    return hashtags;
  } finally {
    await connection.close();
  }
}

/**
 * 해시태그 존재 여부 확인
 * @param {string} hashtagName - 해시태그 이름
 * @param {number} postId - 게시물 ID
 * @returns {Promise<boolean>} 존재 여부
 */
async function hashtagExists(hashtagName, postId) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT Hashtag_id FROM HASHTAG 
       WHERE Hashtag_name = :hashtag_name AND Post_id = :post_id`,
      {
        hashtag_name: hashtagName,
        post_id: postId,
      }
    );
    
    return result.rows.length > 0;
  } finally {
    await connection.close();
  }
}

module.exports = {
  createHashtag,
  getHashtagsByPostId,
  getPostIdsByHashtag,
  deleteHashtag,
  deleteHashtagsByPostId,
  getPopularHashtags,
  hashtagExists,
};

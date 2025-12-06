const { getPool } = require('../config/db');
const oracledb = require('oracledb');

/**
 * POST 테이블 관련 데이터 접근 로직
 */

/**
 * 게시물 생성
 * @param {string} content - 게시물 내용
 * @param {string} userId - 작성자 ID
 * @returns {Promise<number>} 생성된 POST_ID
 */
async function createPost(content, userId) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `INSERT INTO POST (CONTENT, USER_ID, CREATED_AT) 
       VALUES (:content, :user_id, SYSDATE) 
       RETURNING POST_ID INTO :post_id`,
      {
        content: content,
        user_id: userId,
        post_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
      },
      { autoCommit: true }
    );
    
    return result.outBinds.post_id[0];
  } finally {
    await connection.close();
  }
}

/**
 * 게시물 조회
 * @param {number} postId - 게시물 ID
 * @returns {Promise<Object|null>} 게시물 정보
 */
async function getPostById(postId) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT POST_ID, CONTENT, CREATED_AT, USER_ID 
       FROM POST WHERE POST_ID = :post_id`,
      {
        post_id: postId,
      }
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    // 순환 참조를 방지하기 위해 명시적으로 값만 추출
    const returnedPostId = row[0] ? Number(row[0]) : null;
    const content = row[1] ? String(row[1]) : null;
    const createdAt = row[2] ? (row[2] instanceof Date ? row[2].toISOString() : String(row[2])) : null;
    const userId = row[3] ? String(row[3]) : null;
    
    return {
      postId: returnedPostId,
      content: content,
      createdAt: createdAt,
      userId: userId,
    };
  } finally {
    await connection.close();
  }
}

/**
 * 게시물 존재 여부 확인
 * @param {number} postId - 게시물 ID
 * @returns {Promise<boolean>} 존재 여부
 */
async function postExists(postId) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT POST_ID FROM POST WHERE POST_ID = :post_id`,
      {
        post_id: { val: postId, type: oracledb.NUMBER },
      }
    );
    
    return result.rows.length > 0;
  } finally {
    await connection.close();
  }
}

/**
 * 게시물 수정
 * @param {number} postId - 게시물 ID
 * @param {string} content - 수정할 내용
 * @returns {Promise<boolean>} 수정 성공 여부
 */
async function updatePost(postId, content) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `UPDATE POST SET CONTENT = :content WHERE POST_ID = :post_id`,
      {
        content: content,
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
 * 게시물 삭제
 * @param {number} postId - 게시물 ID
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
async function deletePost(postId) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `DELETE FROM POST WHERE POST_ID = :post_id`,
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
 * 사용자의 게시물 목록 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array>} 게시물 목록
 */
async function getPostsByUserId(userId) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT p.POST_ID, p.CONTENT, p.CREATED_AT, p.USER_ID 
       FROM POST p, USERS u 
       WHERE p.USER_ID = u.USER_ID AND p.USER_ID = :user_id 
       ORDER BY p.CREATED_AT DESC`,
      {
        user_id: userId,
      }
    );
    
    // 순환 참조 방지를 위해 명시적으로 값만 추출
    return result.rows.map(row => {
      const returnedPostId = row[0] ? Number(row[0]) : null;
      const content = row[1] ? String(row[1]) : null;
      const createdAt = row[2] ? (row[2] instanceof Date ? row[2].toISOString() : String(row[2])) : null;
      const returnedUserId = row[3] ? String(row[3]) : null;
      
      return {
        postId: returnedPostId,
        content: content,
        createdAt: createdAt,
        userId: returnedUserId,
      };
    });
  } finally {
    await connection.close();
  }
}

module.exports = {
  createPost,
  getPostById,
  postExists,
  updatePost,
  deletePost,
  getPostsByUserId,
};


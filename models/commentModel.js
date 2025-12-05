const { getPool } = require('../config/db');
const oracledb = require('oracledb');

/**
 * COMMENTS 테이블 관련 데이터 접근 로직
 * Comments model class
 */

/**
 * 댓글 생성
 * @param {number} POST_ID - 게시물 ID
 * @param {string} USER_ID - 작성자 ID
 * @param {string} TEXT - 댓글 내용
 * @param {number|null} PARENT_COMMENT_ID - 부모 댓글 ID (답글인 경우)
 * @returns {Promise<number>} 생성된 COMMENT_ID
 */
async function createComment(POST_ID, USER_ID, TEXT, PARENT_COMMENT_ID = null) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `INSERT INTO COMMENTS (POST_ID, USER_ID, TEXT, PARENT_COMMENT_ID, CREATED_AT) 
       VALUES (:post_id, :user_id, :text, :parent_comment_id, SYSDATE) 
       RETURNING COMMENT_ID INTO :comment_id`,
      {
        post_id: { val: POST_ID, type: oracledb.NUMBER },
        user_id: USER_ID,
        text: TEXT,
        parent_comment_id: PARENT_COMMENT_ID ? { val: PARENT_COMMENT_ID, type: oracledb.NUMBER } : null,
        comment_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
      },
      { autoCommit: true }
    );
    
    return result.outBinds.comment_id[0];
  } finally {
    await connection.close();
  }
}

/**
 * 게시물의 댓글 목록 조회 (부모 댓글만, 답글은 제외)
 * @param {number} POST_ID - 게시물 ID
 * @returns {Promise<Array>} 댓글 목록
 */
async function getCommentsByPostId(POST_ID) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT COMMENT_ID, PARENT_COMMENT_ID, CREATED_AT, POST_ID, USER_ID, TEXT
       FROM COMMENTS 
       WHERE POST_ID = :post_id
       ORDER BY CREATED_AT ASC`,
      {
        post_id: { val: POST_ID, type: oracledb.NUMBER },
      }
    );
    
    return result.rows.map(row => ({
      COMMENT_ID: row[0],
      PARENT_COMMENT_ID: row[1],
      CREATED_AT: row[2],
      POST_ID: row[3],
      USER_ID: row[4],
      TEXT: row[5],
    }));
  } finally {
    await connection.close();
  }
}

/**
 * 부모 댓글의 답글 목록 조회
 * @param {number} PARENT_COMMENT_ID - 부모 댓글 ID
 * @returns {Promise<Array>} 답글 목록
 */
async function getRepliesByParentId(PARENT_COMMENT_ID) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT COMMENT_ID, PARENT_COMMENT_ID, CREATED_AT, POST_ID, USER_ID, TEXT
       FROM COMMENTS 
       WHERE PARENT_COMMENT_ID = :parent_comment_id
       ORDER BY CREATED_AT ASC`,
      {
        parent_comment_id: { val: PARENT_COMMENT_ID, type: oracledb.NUMBER },
      }
    );
    
    return result.rows.map(row => ({
      COMMENT_ID: row[0],
      PARENT_COMMENT_ID: row[1],
      CREATED_AT: row[2],
      POST_ID: row[3],
      USER_ID: row[4],
      TEXT: row[5],
    }));
  } finally {
    await connection.close();
  }
}

/**
 * 댓글 조회
 * @param {number} COMMENT_ID - 댓글 ID
 * @returns {Promise<Object|null>} 댓글 정보
 */
async function getCommentById(COMMENT_ID) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT COMMENT_ID, PARENT_COMMENT_ID, CREATED_AT, POST_ID, USER_ID, TEXT
       FROM COMMENTS 
       WHERE COMMENT_ID = :comment_id`,
      {
        comment_id: { val: COMMENT_ID, type: oracledb.NUMBER },
      }
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      COMMENT_ID: row[0],
      PARENT_COMMENT_ID: row[1],
      CREATED_AT: row[2],
      POST_ID: row[3],
      USER_ID: row[4],
      TEXT: row[5],
    };
  } finally {
    await connection.close();
  }
}

/**
 * 댓글 삭제
 * @param {number} COMMENT_ID - 댓글 ID
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
async function deleteComment(COMMENT_ID) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const result = await connection.execute(
      `DELETE FROM COMMENTS WHERE COMMENT_ID = :comment_id`,
      {
        comment_id: { val: COMMENT_ID, type: oracledb.NUMBER },
      },
      { autoCommit: true }
    );
    
    return result.rowsAffected > 0;
  } finally {
    await connection.close();
  }
}

module.exports = {
  createComment,
  getCommentsByPostId,
  getRepliesByParentId,
  getCommentById,
  deleteComment
};

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
      },
      {
        fetchAsString: [oracledb.CLOB] // CLOB를 자동으로 문자열로 변환
      }
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    // 순환 참조를 방지하기 위해 명시적으로 값만 추출
    const returnedPostId = row[0] ? Number(row[0]) : null;
    
    // CONTENT 처리: fetchAsString 옵션으로 이미 문자열로 변환됨
    let content = null;
    if (row[1] != null) {
      if (typeof row[1] === 'string') {
        content = row[1];
      } else if (row[1] && typeof row[1].getData === 'function') {
        // getData()가 필요한 경우 (비동기)
        content = await row[1].getData();
        row[1].destroy(); // LOB 리소스 해제
      } else {
        content = String(row[1]);
      }
    }
    
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
      },
      {
        fetchAsString: [oracledb.CLOB] // CLOB를 자동으로 문자열로 변환
      }
    );
    
    // 순환 참조 방지를 위해 명시적으로 값만 추출
    // fetchAsString 옵션으로 CLOB가 이미 문자열로 변환됨
    const posts = [];
    for (const row of result.rows) {
      const returnedPostId = row[0] ? Number(row[0]) : null;
      
      // CONTENT 처리: fetchAsString 옵션으로 이미 문자열로 변환됨
      let content = null;
      if (row[1] != null) {
        if (typeof row[1] === 'string') {
          content = row[1];
        } else if (row[1] && typeof row[1].getData === 'function') {
          // getData()가 필요한 경우 (비동기)
          content = await row[1].getData();
          row[1].destroy(); // LOB 리소스 해제
        } else {
          content = String(row[1]);
        }
      }
      
      const createdAt = row[2] ? (row[2] instanceof Date ? row[2].toISOString() : String(row[2])) : null;
      const returnedUserId = row[3] ? String(row[3]) : null;
      
      posts.push({
        postId: returnedPostId,
        content: content,
        createdAt: createdAt,
        userId: returnedUserId,
      });
    }
    
    return posts;
  } finally {
    await connection.close();
  }
}

/**
 * 추천 게시물 조회 (가중치 기반 알고리즘 적용)
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array>} 추천 게시물 목록
 */
async function getRecommendedPosts(userId) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    const sql = `
      WITH UserPrefs AS (
        SELECT l.Label_name, COUNT(*) as Weight
        FROM LIKES k
        JOIN IMAGE i ON k.Post_id = i.Post_id
        JOIN LABEL l ON i.Image_dir = l.Image_dir
        WHERE k.User_id = :user_id
        GROUP BY l.Label_name
      ),
      PostScores AS (
        SELECT p.Post_id, SUM(up.Weight) as TotalScore
        FROM POST p
        JOIN IMAGE i ON p.Post_id = i.Post_id
        JOIN LABEL l ON i.Image_dir = l.Image_dir
        JOIN UserPrefs up ON l.Label_name = up.Label_name
        WHERE p.User_id != :user_id
        GROUP BY p.Post_id
      )
      SELECT p.Post_id, p.Content, p.Created_at, p.User_id,
             (SELECT COUNT(*) FROM LIKES l WHERE l.Post_id = p.Post_id) as LikeCount,
             NULL as RepImage
      FROM POST p
      JOIN PostScores ps ON p.Post_id = ps.Post_id
      ORDER BY ps.TotalScore DESC, p.Created_at DESC
    `;
    
    const result = await connection.execute(
      sql,
      {
        user_id: userId,
      },
      {
        fetchAsString: [oracledb.CLOB] // CLOB를 자동으로 문자열로 변환
      }
    );
    
    // 순환 참조 방지를 위해 명시적으로 값만 추출
    const posts = [];
    for (const row of result.rows) {
      const returnedPostId = row[0] ? Number(row[0]) : null;
      
      // CONTENT 처리: fetchAsString 옵션으로 이미 문자열로 변환됨
      let content = null;
      if (row[1] != null) {
        if (typeof row[1] === 'string') {
          content = row[1];
        } else if (row[1] && typeof row[1].getData === 'function') {
          // getData()가 필요한 경우 (비동기)
          content = await row[1].getData();
          row[1].destroy(); // LOB 리소스 해제
        } else {
          content = String(row[1]);
        }
      }
      
      const createdAt = row[2] ? (row[2] instanceof Date ? row[2].toISOString() : String(row[2])) : null;
      const returnedUserId = row[3] ? String(row[3]) : null;
      const likeCount = row[4] ? Number(row[4]) : 0;
      const repImage = row[5] !== null ? String(row[5]) : null;
      
      posts.push({
        postId: returnedPostId,
        content: content,
        createdAt: createdAt,
        userId: returnedUserId,
        likeCount: likeCount,
        repImage: repImage,
      });
    }
    
    return posts;
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
  getRecommendedPosts,
};


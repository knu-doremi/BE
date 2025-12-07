const { getPool } = require("../config/db.js");

module.exports = {
    checkBookmark: async (postId, userId) => {
        const sql = `
            SELECT 1 
            FROM BOOKMARK 
            WHERE Post_id = :postId 
            AND User_id = :userId
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            const result = await conn.execute(
                sql,
                { postId, userId },
                { outFormat: 4002 } // oracledb.OUT_FORMAT_OBJECT와 동일
            );

            return result.rows.length > 0;
        } catch (error) {
            console.error("CHECK BOOKMARK ERROR:", error);
            throw error;
        } finally {
            await conn.close();
        }
    },

    addBookmark: async (postId, userId) => {
        const sql = `
            INSERT INTO BOOKMARK (Bookmark_id, Post_id, User_id)
            VALUES (
                (SELECT NVL(MAX(Bookmark_id), 0) + 1 FROM BOOKMARK),
                :postId,
                :userId
            )
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            const result = await conn.execute(
                sql,
                { postId, userId },
                { autoCommit: true }
            );

            return result.rowsAffected > 0;
        } finally {
            await conn.close();
        }
    },

    deleteBookmark: async (postId, userId) => {
        const sql = `
            DELETE FROM BOOKMARK
            WHERE Post_id = :postId
            AND User_id = :userId
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            const result = await conn.execute(
                sql,
                { postId, userId },
                { autoCommit: true }
            );

            // 삭제된 row 개수로 성공 여부 판단
            return result.rowsAffected > 0;

        } finally {
            await conn.close();
        }
    },

    findBookmarkedPosts: async (userId) => {
        const sql = `
            SELECT 
                p.Post_id,
                p.Content,
                p.Created_at,
                p.User_id,
                (SELECT COUNT(*) FROM LIKES l WHERE l.Post_id = p.Post_id) AS LikeCount,
                NULL AS RepImage
            FROM POST p
            JOIN BOOKMARK b ON p.Post_id = b.Post_id
            WHERE b.User_id = :userId
            ORDER BY b.Bookmark_id DESC
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            const result = await conn.execute(
                sql,
                { userId },
                { outFormat: 4002 }
            );

            // 안전한 매핑
            const posts = result.rows.map(row => ({
                postId: row.POST_ID,
                content: row.Content,
                createdAt: row.CREATED_AT,
                userId: row.USER_ID,
                repImage: row.REPIMAGE,
                likeCount: row.LIKECOUNT
            }));

            return posts;   // ← 이 값만 JSON으로 반환됨 (circle 없음)

        } finally {
            await conn.close();
        }
    }
}
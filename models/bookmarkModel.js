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
    }

}
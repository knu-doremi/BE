const { getPool } = require("../config/db.js"); // pool 초기화된 db.js 가져오기

module.exports = {
    isFollow: async (me, target) => {
        const checkSql = `
            SELECT COUNT(*) AS cnt
            FROM FOLLOW
            WHERE FOLLOWER_ID = :me
              AND FOLLOWING_ID = :target
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            const result = await conn.execute(checkSql, { me, target });

            const count = result.rows[0][0];
            return count > 0;   // true / false
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            await conn.close();
        }
    },

    follow: async (me, target) => {
        const insertSql = `
            INSERT INTO FOLLOW (Follower_id, Following_id)
            VALUES (:me, :target)
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            await conn.execute(insertSql, { me, target }, { autoCommit: true });
            return true;  // 성공
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            await conn.close();
        }
    },

    unfollow: async (me, target) => {
        const deleteSql = `
            DELETE FROM FOLLOW
            WHERE Follower_id = :me
              AND Following_id = :target
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            await conn.execute(
                deleteSql,
                { me, target },
                { autoCommit: true }
            );
            return true;   // 성공 시 true 리턴
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            await conn.close();
        }
    },

    // userId의 팔로우 수 카운트
    countFollowers: async (userId) => {
        const sql = `
            SELECT COUNT(*) AS cnt
            FROM FOLLOW
            WHERE FOLLOWING_ID = :userId
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            const result = await conn.execute(sql, { userId });

            const count = result.rows[0][0];

            return count; // 숫자 반환
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            await conn.close();
        }
    },

    countFollowing: async (userId) => {
        const sql = `
            SELECT COUNT(*) AS cnt
            FROM FOLLOW
            WHERE FOLLOWER_ID = :userId
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            const result = await conn.execute(sql, { userId });

            // Oracle rows → [ [ count ] ]
            const count = result.rows[0][0];

            return count;  // 숫자 반환
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            await conn.close();
        }
    }
};

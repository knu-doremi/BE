const { getPool } = require("../config/db.js"); // pool 초기화된 db.js 가져오기

module.exports = {
    // 로그인
    login: async (userid, password) => {
        const sql = `
            SELECT User_id, Password, Name, Sex,
                TO_CHAR(Birth_date, 'YYYYMMDD') AS BirthStr
            FROM USERS
            WHERE User_id = :userid AND Password = :password
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            const result = await conn.execute(sql, { userid, password });

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            const meta = result.metaData.map(col => col.name);

            // 자동 매핑 (OBJECT 형태로)
            const userObj = Object.fromEntries(
                row.map((value, index) => [meta[index], value])
            );

            return userObj; // 배열 아님!
        } finally {
            await conn.close();
        }
    },

    // 비밀번호 찾기
    searchpassword: async (username, userid, sex, birthdate) => {
        const sql = `
            SELECT Password
            FROM USERS
            WHERE Name = :username
              AND User_id = :userid
              AND Sex = :sex
              AND TO_CHAR(Birth_date, 'YYYYMMDD') = :birthdate
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            const result = await conn.execute(sql, { username, userid, sex, birthdate });
            if (result.rows.length > 0) {
                return result.rows[0][0];  // 비밀번호 반환
            }
            return null;
        } finally {
            await conn.close();
        }
    },

    // 아이디 중복 체크
    checkid: async (userid) => {
        const sql = `
            SELECT COUNT(*) AS COUNT
            FROM USERS
            WHERE User_id = :userid
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            const result = await conn.execute(sql, { userid });
            if (result.rows.length > 0) {
                return Number(result.rows[0][0]);  // 중복된 아이디 수 반환
            }
            return 0;
        } finally {
            await conn.close();
        }
    },

    // 회원가입
    register: async (userid, password, name, sex, birthdate) => {
        const sql = `
            INSERT INTO USERS (User_id, Password, Name, Sex, Birth_date)
            VALUES (:userid, :password, :name, :sex, TO_DATE(:birthdate, 'YYYYMMDD'))
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            const result = await conn.execute(
                sql,
                { userid, password, name, sex, birthdate },
                { autoCommit: true }
            );
            return result;
        } catch (error) {
            console.error("REGISTER ERROR:", error);

            // 이미 존재하는 아이디일 때 Oracle Error Code 는 ORA-00001
            if (error.errorNum === 1) {
                return { duplicate: true }; // 컨트롤러에 전달할 목적
            }

            throw error;  // 다른 에러는 그대로 던짐
        } finally {
            await conn.close();
        }
    },
    
    update: async (userid, password, name) => {
        const sql = `
            UPDATE USERS
            SET Password = :password, Name = :name
            WHERE User_id = :userid
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            const result = await conn.execute(
                sql,
                { userid, password, name },
                { autoCommit: true }
            );
            return result.rowsAffected > 0;
        } finally {
            await conn.close();
        }
    },

    // 추천 유저 조회 (가중치 기반 알고리즘 적용, 팔로우하지 않은 유저만)
    getRecommendedUsers: async (userId) => {
        const sql = `
            WITH UserPrefs AS (
                SELECT l.Label_name, COUNT(*) as Weight
                FROM LIKES k
                JOIN IMAGE i ON k.Post_id = i.Post_id
                JOIN LABEL l ON i.Image_dir = l.Image_dir
                WHERE k.User_id = :user_id
                GROUP BY l.Label_name
            ),
            UserScores AS (
                SELECT p.User_id, SUM(up.Weight) as TotalScore
                FROM POST p
                JOIN IMAGE i ON p.Post_id = i.Post_id
                JOIN LABEL l ON i.Image_dir = l.Image_dir
                JOIN UserPrefs up ON l.Label_name = up.Label_name
                WHERE p.User_id != :user_id
                GROUP BY p.User_id
            )
            SELECT u.User_id, u.Name, us.TotalScore
            FROM USERS u
            JOIN UserScores us ON u.User_id = us.User_id
            WHERE NOT EXISTS (
                SELECT 1 
                FROM FOLLOW f 
                WHERE f.FOLLOWER_ID = :user_id 
                  AND f.FOLLOWING_ID = u.User_id
            )
            ORDER BY us.TotalScore DESC
            FETCH FIRST 5 ROWS ONLY
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            const result = await conn.execute(sql, { user_id: userId });

            const users = result.rows.map(row => ({
                userId: row[0] ? String(row[0]) : null,
                name: row[1] ? String(row[1]) : null,
                score: row[2] ? Number(row[2]) : 0
            }));

            return users;
        } catch (error) {
            console.error("GET RECOMMENDED USERS ERROR:", error);
            throw error;
        } finally {
            await conn.close();
        }
    }
};
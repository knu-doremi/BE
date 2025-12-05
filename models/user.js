const { getPool } = require("../config/db.js"); // pool 초기화된 db.js 가져오기

module.exports = {
    // 로그인
    login: async (userid, password) => {
        console.log("login model called");
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
            if (result.rows.length > 0) {
                return result.rows[0];  // 로그인 성공
            }
            return null;
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
                return result.rows[0].PASSWORD;
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
                return Number(result.rows[0].COUNT);
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
        } finally {
            await conn.close();
        }
    }
};
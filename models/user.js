const { autoCommit } = require("oracledb");
let db = require("./oracle.js");

module.exports = {
    login: async (userid, password) => {
        const sql = `
            SELECT User_id, Password, Name, Sex,
                   TO_CHAR(Birth_date, 'YYYYMMDD') AS BirthStr
            FROM USERS
            WHERE User_id = :userid AND Password = :password
        `;

        const result = await db.query(sql, { userid, password });

        if (result.rows.length > 0) {
            return result.rows[0]; // 로그인 성공
        }

        return null; // 결과 없음
    },

    searchpassword: async (username, userid, sex, birthdate) => {
        const sql = `
            SELECT Password
            FROM USERS
            WHERE Name = :username
              AND User_id = :userid
              AND Sex = :sex
              AND TO_CHAR(Birth_date, 'YYYYMMDD') = :birthdate
        `;

        const result = await db.query(sql, { username, userid, sex, birthdate });

        if (result.rows.length > 0) {
            return result.rows[0].PASSWORD; // 비밀번호 반환
        }

        return null; // 결과 없음
    },

    checkid: async (userid) => {
        const sql = `
            SELECT COUNT(*) AS COUNT
            FROM USERS
            WHERE User_id = :userid
        `;
        const result = await db.query(sql, { userid });

        if (result.rows.length > 0) {
            return Number(result.rows[0].COUNT); // 중복된 아이디 수 반환
        }

        return 0; // 결과 없음
    },

    register: async (userid, password, name, sex, birthdate) => {
        const sql = `
            INSERT INTO USERS (User_id, Password, Name, Sex, Birth_date)
            VALUES (:userid, :password, :name, :sex, TO_DATE(:birthdate, 'YYYYMMDD'))
        `;
        const result = await db.query(sql, { userid, password, name, sex, birthdate }, {autoCommit: true});
        return result;
    }
};
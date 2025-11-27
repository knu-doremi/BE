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
    }
};

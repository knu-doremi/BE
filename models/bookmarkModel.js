const { getPool } = require("../config/db.js");
const oracledb = require('oracledb');

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
        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            // 1. 게시물 존재 여부 확인 (트랜잭션 시작)
            const checkPost = await conn.execute(
                `SELECT 1 FROM POST WHERE POST_ID = :postId`,
                { postId },
                { autoCommit: false }
            );

            if (checkPost.rows.length === 0) {
                // 존재하지 않는 게시물
                return { success: false, message: '존재하지 않거나 삭제된 게시물입니다.' };
            }

            // 2. 이미 북마크 되어 있는지 확인
            const checkBookmark = await conn.execute(
                `SELECT 1 FROM BOOKMARK WHERE POST_ID = :postId AND USER_ID = :userId`,
                { postId, userId },
                { autoCommit: false }
            );

            if (checkBookmark.rows.length > 0) {
                return { success: false, message: '이미 북마크에 등록된 게시물입니다.' };
            }

            // 3. 북마크 추가
            await conn.execute(
                `INSERT INTO BOOKMARK (Bookmark_id, Post_id, User_id)
                VALUES (BOOKMARK_SEQ.NEXTVAL, :postId, :userId)`,
                { postId, userId },
                { autoCommit: false }
            );

            // 트랜잭션 커밋
            await conn.commit();

            return { success: true, message: '북마크가 추가되었습니다.' };

        } catch (err) {
            await conn.rollback();

            if (err.errorNum === 2291) {
                console.warn(`[북마크 실패] 존재하지 않는 게시물 ID: ${postId}`);
                return { success: false, message: '존재하지 않거나 삭제된 게시물입니다.' };
            }

            if (err.errorNum === 1) {
                return { success: false, message: '이미 북마크에 등록된 게시물입니다.' };
            }

            console.error('북마크 추가 중 DB 오류:', err);
            throw err;

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
        /**
         * 이미지 경로 포맷팅 (조회 시 /uploads/를 앞에 붙임)
         * @param {string} imageDir - DB에 저장된 이미지 경로 (파일명 또는 전체 경로)
         * @returns {string} 포맷팅된 이미지 경로
         */
        function formatImageDir(imageDir) {
            if (!imageDir) return null;
            const dir = String(imageDir);
            // 이미 /uploads/로 시작하면 그대로 반환, 아니면 /uploads/를 붙임
            return dir.startsWith('/uploads/') ? dir : `/uploads/${dir}`;
        }

        const sql = `
            SELECT 
                p.Post_id,
                p.Content,
                p.Created_at,
                p.User_id,
                u.Name,
                (SELECT COUNT(*) FROM LIKES l WHERE l.Post_id = p.Post_id) AS LikeCount
            FROM POST p
            JOIN BOOKMARK b ON p.Post_id = b.Post_id
            LEFT JOIN USERS u ON p.User_id = u.User_id
            WHERE b.User_id = :userId
            ORDER BY b.Bookmark_id DESC
        `;

        const pool = getPool();
        const conn = await pool.getConnection();

        try {
            const result = await conn.execute(
                sql,
                { userId },
                {
                    fetchAsString: [oracledb.CLOB] // CLOB를 자동으로 문자열로 변환
                }
            );

            // 순환 참조 방지를 위해 명시적으로 값만 추출
            const posts = [];
            for (const row of result.rows) {
                const postId = row[0] ? Number(row[0]) : null;
                
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
                const username = row[4] ? String(row[4]) : null;
                const likeCount = row[5] ? Number(row[5]) : 0;
                
                // 해당 게시물의 첫 번째 이미지 경로만 조회 (게시물당 이미지 하나만)
                const imageResult = await conn.execute(
                    `SELECT Image_dir FROM IMAGE WHERE Post_id = :post_id AND ROWNUM = 1`,
                    { post_id: postId }
                );
                
                // 이미지 경로를 단일 문자열로 반환 (첫 번째 이미지만, /uploads/ 포함)
                const imageDir = imageResult.rows.length > 0 && imageResult.rows[0][0] 
                    ? formatImageDir(imageResult.rows[0][0]) 
                    : null;

                posts.push({
                    postId: postId,
                    content: content,
                    createdAt: createdAt,
                    userId: userId,
                    username: username,
                    likeCount: likeCount,
                    imageDir: imageDir
                });
            }

            return posts;

        } finally {
            await conn.close();
        }
    }
};
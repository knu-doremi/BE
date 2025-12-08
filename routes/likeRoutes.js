const express = require('express');
const { checkLike, toggleLike, countReceivedLikes } = require('../controllers/likeController');

const router = express.Router();

// 특정 게시물에 user가 좋아요를 눌렀는지 확인
// GET /api/likes/posts/:POST_ID?USER_ID=xxx
router.get('/posts/:POST_ID', checkLike);

// 좋아요 토글 (있으면 삭제, 없으면 추가)
// POST /api/likes/posts/:POST_ID?USER_ID=xxx
router.post('/posts/:POST_ID', toggleLike);

// 유저가 받은 총 좋아요 수 조회
// GET /api/likes/users/:USER_ID/received
router.get('/users/:USER_ID/received', countReceivedLikes);

module.exports = router;

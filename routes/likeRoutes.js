const express = require('express');
const { checkLike } = require('../controllers/likeController');

const router = express.Router();

// 특정 게시물에 user가 좋아요를 눌렀는지 확인
// GET /api/likes/posts/:POST_ID?USER_ID=xxx
router.get('/posts/:POST_ID', checkLike);

module.exports = router;

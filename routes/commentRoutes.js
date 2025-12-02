const express = require('express');
const { getComments } = require('../controllers/commentController');

const router = express.Router();

// 게시물의 댓글 목록 조회
router.get('/posts/:POST_ID', getComments);
router.get('/posts/:Post_id', getComments);
router.get('/posts/:postId', getComments);

module.exports = router;


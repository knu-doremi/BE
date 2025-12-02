const express = require('express');
const { getComments, createComment } = require('../controllers/commentController');

const router = express.Router();

// 게시물의 댓글 목록 조회
router.get('/posts/:POST_ID', getComments);
router.get('/posts/:Post_id', getComments);
router.get('/posts/:postId', getComments);

// 댓글 작성 (게시물에 직접 댓글)
router.post('/', createComment);

module.exports = router;


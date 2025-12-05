const express = require('express');
const { getComments, createComment, createReply, deleteComment } = require('../controllers/commentController');

const router = express.Router();

// 게시물의 댓글 목록 조회
router.get('/posts/:POST_ID', getComments);

// 댓글 작성 (게시물에 직접 댓글)
router.post('/', createComment);

// 답글 작성 (댓글에 답글)
router.post('/reply', createReply);

// 댓글 삭제
router.delete('/:COMMENT_ID', deleteComment);

module.exports = router;


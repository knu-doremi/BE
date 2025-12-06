const express = require('express');
const { getPost, getPostsByUser } = require('../controllers/postController');

const router = express.Router();

// user_id를 통해서 게시물 목록 조회
router.get('/user/:user_id', getPostsByUser);

// post_id를 통해서 게시물 조회
router.get('/:post_id', getPost);

module.exports = router;

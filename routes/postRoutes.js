const express = require('express');
const { getPost } = require('../controllers/postController');

const router = express.Router();

// post_id를 통해서 게시물 조회
router.get('/:post_id', getPost);

module.exports = router;

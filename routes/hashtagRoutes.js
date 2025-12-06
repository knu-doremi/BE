const express = require('express');
const { searchPostsByHashtag } = require('../controllers/hashtagController');

const router = express.Router();

// 해시태그로 게시물 검색
router.get('/search/:hashtag_name', searchPostsByHashtag);

module.exports = router;

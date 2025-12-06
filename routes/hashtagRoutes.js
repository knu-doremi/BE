const express = require('express');
const { searchPostsByHashtag, getHashtagsByPost, searchHashtagsByTerm } = require('../controllers/hashtagController');

const router = express.Router();

// 해시태그 자동완성 검색 (쿼리 파라미터로 검색)
router.get('/auto', searchHashtagsByTerm);

// 해시태그로 게시물 검색
router.get('/search/:hashtag_name', searchPostsByHashtag);

// 게시물 ID로 해시태그 목록 조회
router.get('/post/:post_id', getHashtagsByPost);

module.exports = router;

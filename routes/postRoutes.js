const express = require('express');
const { getPost, getPostsByUser, getRecommendedPostsByUser, getFollowingPostsByUser } = require('../controllers/postController');

const router = express.Router();

// user_id를 통해서 추천 게시물 조회
router.get('/recommended/:user_id', getRecommendedPostsByUser);

// user_id를 통해서 팔로우한 유저의 게시물 조회
router.get('/following/:user_id', getFollowingPostsByUser);

// user_id를 통해서 게시물 목록 조회
router.get('/user/:user_id', getPostsByUser);

// post_id를 통해서 게시물 조회
router.get('/:post_id', getPost);

module.exports = router;

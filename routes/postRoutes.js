const express = require('express');
const multer = require('multer');
const path = require('path');
const { getPost, getPostsByUser, getRecommendedPostsByUser, getFollowingPostsByUser, deletePostByUser, uploadPost } = require('../controllers/postController');

const router = express.Router();

// Multer 설정 (메모리 스토리지 사용 - 이미지 버퍼를 메모리에 저장)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  },
});

// 게시물 업로드 (이미지, 해시태그 포함)
// single('image') - 단일 이미지, array('images', 10) - 다중 이미지 (최대 10개)
router.post('/', upload.single('image'), uploadPost);

// user_id를 통해서 추천 게시물 조회
router.get('/recommended/:user_id', getRecommendedPostsByUser);

// user_id를 통해서 팔로우한 유저의 게시물 조회
router.get('/following/:user_id', getFollowingPostsByUser);

// user_id를 통해서 게시물 목록 조회
router.get('/user/:user_id', getPostsByUser);

// post_id를 통해서 게시물 삭제
router.delete('/:post_id', deletePostByUser);

// post_id를 통해서 게시물 조회
router.get('/:post_id', getPost);

module.exports = router;

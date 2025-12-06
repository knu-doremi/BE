const { getPostById, getPostsByUserId, getRecommendedPosts, getFollowingPosts, deletePost, createPost, createImage, saveLabels, createHashtag } = require('../models/postModel');
const vision = require('@google-cloud/vision');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Google Vision API 클라이언트 초기화
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './google-credentials.json',
});

// 이미지 저장 디렉토리
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * 이미지를 PNG로 변환하는 함수
 */
async function convertToPNG(imageBuffer) {
  try {
    const pngBuffer = await sharp(imageBuffer)
      .ensureAlpha()
      .removeAlpha()
      .toFormat('png')
      .toBuffer();
    return pngBuffer;
  } catch (error) {
    throw new Error(`이미지 변환 오류: ${error.message}`);
  }
}

/**
 * Google Vision API를 사용한 이미지 라벨링
 */
async function detectLabels(imageBuffer) {
  try {
    // 이미지를 PNG로 변환
    const pngBuffer = await convertToPNG(imageBuffer);
    
    // Vision API 요청
    const [result] = await client.labelDetection({
      image: { content: pngBuffer },
    });
    
    // 오류 확인
    if (result.error) {
      throw new Error(`API 오류: ${result.error.message}`);
    }
    
    // 라벨 추출
    const labels = result.labelAnnotations || [];
    const tags = labels.map(label => label.description);
    return tags.length > 0 ? tags : ['태그 없음'];
  } catch (error) {
    console.error('라벨링 오류:', error);
    throw error;
  }
}

/**
 * post_id를 통해서 게시물 조회
 */
async function getPost(req, res) {
  try {
    // POST_ID 등 다양한 형식 지원
    const POST_ID = req.params.POST_ID || req.params.Post_id || req.params.postId || req.params.post_id;
    
    if (!POST_ID) {
      return res.status(400).json({ 
        result: false, 
        error: 'POST_ID가 필요합니다.' 
      });
    }
    
    const POST_ID_NUM = parseInt(POST_ID, 10);
    if (isNaN(POST_ID_NUM)) {
      return res.status(400).json({ 
        result: false, 
        error: '유효하지 않은 게시물 ID입니다.' 
      });
    }
    
    // 게시물 조회
    const post = await getPostById(POST_ID_NUM);
    
    if (!post) {
      return res.status(404).json({ 
        result: false, 
        error: '게시물을 찾을 수 없습니다.' 
      });
    }
    
    // 순환 참조 방지를 위해 명시적으로 객체 생성
    const cleanPost = {
      postId: post.postId,
      content: post.content,
      createdAt: post.createdAt,
      userId: post.userId,
      likeCount: post.likeCount || 0,
      repImage: post.repImage || null,
      imageDirs: post.imageDirs || [], // 모든 이미지 경로 배열
    };
    
    res.status(200).json({ 
      result: true, 
      post: cleanPost 
    });
  } catch (error) {
    console.error('게시물 조회 오류:', error);
    console.error('에러 스택:', error.stack);
    res.status(500).json({ 
      result: false, 
      error: error.message || '게시물 조회 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * user_id를 통해서 게시물 목록 조회
 */
async function getPostsByUser(req, res) {
  try {
    // USER_ID 등 다양한 형식 지원
    const USER_ID = req.params.USER_ID || req.params.User_id || req.params.userId || req.params.user_id;
    
    if (!USER_ID) {
      return res.status(400).json({ 
        result: false, 
        error: 'USER_ID가 필요합니다.' 
      });
    }
    
    // 게시물 목록 조회
    const posts = await getPostsByUserId(USER_ID);
    
    // 순환 참조 방지를 위해 명시적으로 배열 정리
    const cleanPosts = posts.map(post => ({
      postId: post.postId,
      content: post.content,
      createdAt: post.createdAt,
      userId: post.userId,
      imageDir: post.imageDir || null, // 단일 이미지 경로 (문자열)
    }));
    
    res.status(200).json({ 
      result: true, 
      posts: cleanPosts 
    });
  } catch (error) {
    console.error('게시물 목록 조회 오류:', error);
    console.error('에러 스택:', error.stack);
    res.status(500).json({ 
      result: false, 
      error: error.message || '게시물 목록 조회 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * 추천 게시물 조회
 */
async function getRecommendedPostsByUser(req, res) {
  try {
    // USER_ID 등 다양한 형식 지원
    const USER_ID = req.params.USER_ID || req.params.User_id || req.params.userId || req.params.user_id;
    
    if (!USER_ID) {
      return res.status(400).json({ 
        result: false, 
        error: 'USER_ID가 필요합니다.' 
      });
    }
    
    // 추천 게시물 조회
    const posts = await getRecommendedPosts(USER_ID);
    
    // 순환 참조 방지를 위해 명시적으로 배열 정리
    const cleanPosts = posts.map(post => ({
      postId: post.postId,
      content: post.content,
      createdAt: post.createdAt,
      userId: post.userId,
      likeCount: post.likeCount,
      imageDir: post.imageDir || null, // 단일 이미지 경로 (문자열)
    }));
    
    res.status(200).json({ 
      result: true, 
      posts: cleanPosts 
    });
  } catch (error) {
    console.error('추천 게시물 조회 오류:', error);
    console.error('에러 스택:', error.stack);
    res.status(500).json({ 
      result: false, 
      error: error.message || '추천 게시물 조회 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * 팔로우한 유저의 게시물 조회
 */
async function getFollowingPostsByUser(req, res) {
  try {
    // USER_ID 등 다양한 형식 지원
    const USER_ID = req.params.USER_ID || req.params.User_id || req.params.userId || req.params.user_id;
    
    if (!USER_ID) {
      return res.status(400).json({ 
        result: false, 
        error: 'USER_ID가 필요합니다.' 
      });
    }
    
    // 팔로우한 유저의 게시물 조회
    const posts = await getFollowingPosts(USER_ID);
    
    // 순환 참조 방지를 위해 명시적으로 배열 정리
    const cleanPosts = posts.map(post => ({
      postId: post.postId,
      content: post.content,
      createdAt: post.createdAt,
      userId: post.userId,
      imageDir: post.imageDir || null, // 단일 이미지 경로 (문자열)
    }));
    
    res.status(200).json({ 
      result: true, 
      posts: cleanPosts 
    });
  } catch (error) {
    console.error('팔로우 게시물 조회 오류:', error);
    console.error('에러 스택:', error.stack);
    res.status(500).json({ 
      result: false, 
      error: error.message || '팔로우 게시물 조회 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * 게시물 삭제
 */
async function deletePostByUser(req, res) {
  try {
    // POST_ID 등 다양한 형식 지원
    const POST_ID = req.params.POST_ID || req.params.Post_id || req.params.postId || req.params.post_id;
    
    if (!POST_ID) {
      return res.status(400).json({ 
        result: false, 
        error: 'POST_ID가 필요합니다.' 
      });
    }
    
    const POST_ID_NUM = parseInt(POST_ID, 10);
    if (isNaN(POST_ID_NUM)) {
      return res.status(400).json({ 
        result: false, 
        error: '유효하지 않은 게시물 ID입니다.' 
      });
    }
    
    // USER_ID 등 다양한 형식 지원 (body 또는 query에서)
    const USER_ID = req.body.USER_ID || req.body.User_id || req.body.userId || req.body.user_id ||
                    req.query.USER_ID || req.query.User_id || req.query.userId || req.query.user_id;
    
    if (!USER_ID) {
      return res.status(400).json({ 
        result: false, 
        error: 'USER_ID가 필요합니다.' 
      });
    }
    
    // 게시물 조회하여 작성자 확인
    const post = await getPostById(POST_ID_NUM);
    
    if (!post) {
      return res.status(404).json({ 
        result: false, 
        error: '게시물을 찾을 수 없습니다.' 
      });
    }
    
    // 작성자와 현재 사용자가 일치하는지 확인
    if (post.userId !== USER_ID) {
      return res.status(403).json({ 
        result: false, 
        error: '게시물을 삭제할 권한이 없습니다.' 
      });
    }
    
    // 게시물 삭제
    const deleted = await deletePost(POST_ID_NUM);
    
    if (!deleted) {
      return res.status(500).json({ 
        result: false, 
        error: '게시물 삭제에 실패했습니다.' 
      });
    }
    
    res.status(200).json({ 
      result: true, 
      message: '게시물이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('게시물 삭제 오류:', error);
    console.error('에러 스택:', error.stack);
    res.status(500).json({ 
      result: false, 
      error: error.message || '게시물 삭제 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * 게시물 업로드 (이미지, 해시태그 포함)
 */
async function uploadPost(req, res) {
  try {
    // USER_ID, CONTENT 등 다양한 형식 지원
    const USER_ID = req.body.USER_ID || req.body.User_id || req.body.userId || req.body.user_id;
    const CONTENT = req.body.CONTENT || req.body.Content || req.body.content;
    const HASHTAGS = req.body.HASHTAGS || req.body.Hashtags || req.body.hashtags || [];
    
    if (!USER_ID || !CONTENT) {
      return res.status(400).json({ 
        result: false, 
        error: 'USER_ID와 CONTENT가 필요합니다.' 
      });
    }
    
    // 해시태그 처리
    let hashtagArray = [];
    if (typeof HASHTAGS === 'string') {
      hashtagArray = HASHTAGS.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } else if (Array.isArray(HASHTAGS)) {
      hashtagArray = HASHTAGS.map(tag => typeof tag === 'string' ? tag.trim() : tag).filter(tag => tag && tag.length > 0);
    }
    hashtagArray = hashtagArray.map(tag => tag.replace(/^#+/, ''));
    
    // 1. 게시물 생성
    const POST_ID = await createPost(CONTENT, USER_ID);
    
    // 2. 이미지 처리 (이미지가 있는 경우)
    let imageDir = null;
    const imageDirs = [];
    
    // req.file (단일 이미지) 또는 req.files (다중 이미지) 처리
    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : (req.file ? [req.file] : []);
    
    if (files.length > 0) {
      for (const file of files) {
        try {
          // 이미지 파일을 디스크에 저장
          const timestamp = Date.now();
          const ext = path.extname(file.originalname);
          const filename = `${timestamp}_${file.originalname}`;
          const filePath = path.join(uploadDir, filename);
          
          fs.writeFileSync(filePath, file.buffer);
          
          // IMAGE 테이블에 파일명만 저장 (경로 제외)
          const savedImageDir = await createImage(filename, POST_ID);
          imageDirs.push(savedImageDir);
          
          // 첫 번째 이미지를 대표 이미지로 설정
          if (!imageDir) {
            imageDir = savedImageDir;
          }
          
          // 이미지 라벨링은 비동기로 처리 (응답은 먼저 반환)
          detectLabels(file.buffer)
            .then(labels => {
              console.log(`라벨링 완료 (POST_ID: ${POST_ID}, Image: ${savedImageDir}): ${labels.join(', ')}`);
              return saveLabels(savedImageDir, labels);
            })
            .then(() => {
              console.log(`라벨 DB 저장 완료 (POST_ID: ${POST_ID}, Image: ${savedImageDir})`);
            })
            .catch(error => {
              console.error(`라벨링/저장 실패 (POST_ID: ${POST_ID}, Image: ${savedImageDir}):`, error);
              // 라벨링 실패해도 게시물은 생성되었으므로 에러만 로깅
            });
        } catch (error) {
          console.error('이미지 처리 오류:', error);
          // 이미지 처리 실패해도 게시물은 생성되었으므로 계속 진행
        }
      }
    }
    
    // 3. 해시태그 저장
    const createdHashtags = [];
    if (hashtagArray.length > 0) {
      for (const hashtagName of hashtagArray) {
        try {
          const HASHTAG_ID = await createHashtag(hashtagName, POST_ID);
          createdHashtags.push({
            HASHTAG_ID: HASHTAG_ID,
            HASHTAG_NAME: hashtagName,
          });
        } catch (error) {
          console.error(`해시태그 저장 실패 (${hashtagName}):`, error);
          // 해시태그 저장 실패해도 게시물은 생성되었으므로 계속 진행
        }
      }
    }
    
    // 4. 성공 응답 (이미지 라벨링은 백그라운드에서 진행)
    // 조회 시 /uploads/를 앞에 붙여서 사용하므로 응답에도 포함
    res.status(201).json({ 
      result: true, 
      message: '게시물이 작성되었습니다.',
      POST_ID: POST_ID,
      imageDir: imageDir ? `/uploads/${imageDir}` : null, // 대표 이미지 (첫 번째 이미지)
      imageDirs: imageDirs.map(dir => `/uploads/${dir}`), // 모든 이미지 경로 배열
      HASHTAGS: createdHashtags 
    });
  } catch (error) {
    console.error('게시물 업로드 오류:', error);
    console.error('에러 스택:', error.stack);
    res.status(500).json({ 
      result: false, 
      error: error.message || '게시물 업로드 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

module.exports = {
  getPost,
  getPostsByUser,
  getRecommendedPostsByUser,
  getFollowingPostsByUser,
  deletePostByUser,
  uploadPost,
};

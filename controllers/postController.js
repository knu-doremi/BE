const { getPostById, getPostsByUserId, getRecommendedPosts, getFollowingPosts } = require('../models/postModel');

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
      imageDirs: post.imageDirs || [], // 이미지 경로 배열 포함
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
      repImage: post.repImage,
      imageDirs: post.imageDirs || [], // 이미지 경로 배열 포함
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
      imageDirs: post.imageDirs || [], // 이미지 경로 배열 포함
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

module.exports = {
  getPost,
  getPostsByUser,
  getRecommendedPostsByUser,
  getFollowingPostsByUser,
};

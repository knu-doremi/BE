const { getPostIdsByHashtag } = require('../models/hashtagModel');
const { getPostById } = require('../models/postModel');

/**
 * 해시태그로 게시물 검색
 */
async function searchPostsByHashtag(req, res) {
  try {
    const HASHTAG_NAME = req.params.HASHTAG_NAME || req.params.Hashtag_name || req.params.hashtagName || req.params.hashtag_name;
    
    if (!HASHTAG_NAME) {
      return res.status(400).json({ 
        result: false, 
        error: 'HASHTAG_NAME이 필요합니다.' 
      });
    }
    
    // 해시태그 이름으로 게시물 ID 목록 조회
    const postIds = await getPostIdsByHashtag(HASHTAG_NAME);
    
    if (postIds.length === 0) {
      return res.status(200).json({ 
        result: true, 
        posts: [],
        hashtagName: HASHTAG_NAME,
        message: '해당 해시태그로 검색된 게시물이 없습니다.' 
      });
    }
    
    // 각 게시물 ID로 게시물 정보 조회
    const posts = [];
    for (const postId of postIds) {
      try {
        const post = await getPostById(postId);
        if (post) {
          posts.push({
            postId: post.postId,
            content: post.content,
            createdAt: post.createdAt,
            userId: post.userId,
            likeCount: post.likeCount || 0,
            imageDir: post.imageDir || null,
          });
        }
      } catch (error) {
        console.error(`게시물 조회 실패 (POST_ID: ${postId}):`, error);
        // 개별 게시물 조회 실패해도 계속 진행
      }
    }
    
    res.status(200).json({ 
      result: true, 
      hashtagName: HASHTAG_NAME,
      posts: posts,
      count: posts.length
    });
  } catch (error) {
    console.error('해시태그 게시물 검색 오류:', error);
    console.error('에러 스택:', error.stack);
    res.status(500).json({ 
      result: false, 
      error: error.message || '해시태그 게시물 검색 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

module.exports = {
  searchPostsByHashtag,
};

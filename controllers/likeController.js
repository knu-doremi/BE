const likeModel = require('../models/likeModel');
const { postExists } = require('../models/postModel');

/**
 * 특정 게시물에 user가 좋아요를 눌렀는지 확인
 */
async function checkLike(req, res) {
  try {
    // POST_ID, USER_ID 등 다양한 형식 지원
    const POST_ID = req.params.POST_ID || req.params.Post_id || req.params.postId || req.params.post_id;
    const USER_ID = req.query.USER_ID || req.query.User_id || req.query.userId || req.query.user_id;
    
    if (!POST_ID) {
      return res.status(400).json({ 
        result: false, 
        error: 'POST_ID가 필요합니다.' 
      });
    }
    
    if (!USER_ID) {
      return res.status(400).json({ 
        result: false, 
        error: 'USER_ID가 필요합니다.' 
      });
    }
    
    const POST_ID_NUM = parseInt(POST_ID, 10);
    if (isNaN(POST_ID_NUM)) {
      return res.status(400).json({ 
        result: false, 
        error: '유효하지 않은 게시물 ID입니다.' 
      });
    }
    
    // 게시물 존재 확인
    const exists = await postExists(POST_ID_NUM);
    if (!exists) {
      return res.status(404).json({ 
        result: false, 
        error: '게시물을 찾을 수 없습니다.' 
      });
    }
    
    // 좋아요 여부 확인
    const isLiked = await likeModel.checkLike(POST_ID_NUM, USER_ID);
    
    res.status(200).json({ 
      result: true, 
      postId: POST_ID_NUM,
      userId: USER_ID,
      isLiked: isLiked
    });
  } catch (error) {
    console.error('좋아요 확인 오류:', error);
    res.status(500).json({ 
      result: false, 
      error: error.message || '좋아요 확인 중 오류가 발생했습니다.' 
    });
  }
}

module.exports = {
  checkLike,
};

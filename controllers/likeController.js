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

/**
 * 좋아요 추가
 */
async function addLike(req, res) {
  try {
    // POST_ID, USER_ID 등 다양한 형식 지원
    const POST_ID = req.body.POST_ID || req.body.Post_id || req.body.postId || req.body.post_id;
    const USER_ID = req.body.USER_ID || req.body.User_id || req.body.userId || req.body.user_id;
    
    if (!POST_ID || !USER_ID) {
      return res.status(400).json({ 
        result: false, 
        error: 'POST_ID와 USER_ID가 필요합니다.' 
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
    
    // 이미 좋아요가 있는지 확인
    const isLiked = await likeModel.checkLike(POST_ID_NUM, USER_ID);
    if (isLiked) {
      return res.status(400).json({ 
        result: false, 
        error: '이미 좋아요를 누른 게시물입니다.' 
      });
    }
    
    // 좋아요 추가
    const success = await likeModel.addLike(POST_ID_NUM, USER_ID);
    
    if (!success) {
      return res.status(500).json({ 
        result: false, 
        error: '좋아요 추가에 실패했습니다.' 
      });
    }
    
    res.status(200).json({ 
      result: true, 
      message: '좋아요가 추가되었습니다.',
      postId: POST_ID_NUM,
      userId: USER_ID
    });
  } catch (error) {
    console.error('좋아요 추가 오류:', error);
    res.status(500).json({ 
      result: false, 
      error: error.message || '좋아요 추가 중 오류가 발생했습니다.' 
    });
  }
}

/**
 * 좋아요 취소
 */
async function deleteLike(req, res) {
  try {
    // POST_ID, USER_ID 등 다양한 형식 지원 (params와 query에서 받음)
    const POST_ID = req.params.POST_ID || req.params.Post_id || req.params.postId || req.params.post_id;
    const USER_ID = req.query.USER_ID || req.query.User_id || req.query.userId || req.query.user_id;
    
    if (!POST_ID || !USER_ID) {
      return res.status(400).json({ 
        result: false, 
        error: 'POST_ID와 USER_ID가 필요합니다.' 
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
    
    // 좋아요 취소
    const success = await likeModel.deleteLike(POST_ID_NUM, USER_ID);
    
    if (!success) {
      return res.status(404).json({ 
        result: false, 
        error: '좋아요를 찾을 수 없습니다.' 
      });
    }
    
    res.status(200).json({ 
      result: true, 
      message: '좋아요가 취소되었습니다.',
      postId: POST_ID_NUM,
      userId: USER_ID
    });
  } catch (error) {
    console.error('좋아요 취소 오류:', error);
    res.status(500).json({ 
      result: false, 
      error: error.message || '좋아요 취소 중 오류가 발생했습니다.' 
    });
  }
}

/**
 * 좋아요 토글 (있으면 삭제, 없으면 추가)
 */
async function toggleLike(req, res) {
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
    
    // 좋아요 토글
    const isLiked = await likeModel.toggleLike(POST_ID_NUM, USER_ID);
    
    res.status(200).json({ 
      result: true, 
      postId: POST_ID_NUM,
      userId: USER_ID,
      isLiked: isLiked,
      message: isLiked ? '좋아요가 추가되었습니다.' : '좋아요가 취소되었습니다.'
    });
  } catch (error) {
    console.error('좋아요 토글 오류:', error);
    res.status(500).json({ 
      result: false, 
      error: error.message || '좋아요 처리 중 오류가 발생했습니다.' 
    });
  }
}

/**
 * 유저가 받은 총 좋아요 수 조회
 */
async function countReceivedLikes(req, res) {
  try {
    // USER_ID 등 다양한 형식 지원
    const USER_ID = req.params.USER_ID || req.params.User_id || req.params.userId || req.params.user_id;
    
    if (!USER_ID) {
      return res.status(400).json({ 
        result: false, 
        error: 'USER_ID가 필요합니다.' 
      });
    }
    
    // 총 좋아요 수 조회
    const totalLikes = await likeModel.countReceivedLikes(USER_ID);
    
    res.status(200).json({ 
      result: true,
      userId: USER_ID,
      totalLikes: totalLikes
    });
  } catch (error) {
    console.error('좋아요 집계 오류:', error);
    res.status(500).json({ 
      result: false, 
      error: error.message || '좋아요 집계 중 오류가 발생했습니다.' 
    });
  }
}

module.exports = {
  checkLike,
  addLike,
  deleteLike,
  toggleLike,
  countReceivedLikes,
};

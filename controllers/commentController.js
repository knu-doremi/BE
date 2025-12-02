const commentModel = require('../models/commentModel');
const { postExists } = require('../models/postModel');

/**
 * 게시물의 댓글 목록 조회
 */
async function getComments(req, res) {
  try {
    // POST_ID 등 다양한 형식 지원
    const POST_ID = req.params.POST_ID || req.params.Post_id || req.params.postId;
    
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
    
    // 게시물 존재 확인
    const exists = await postExists(POST_ID_NUM);
    if (!exists) {
      return res.status(404).json({ 
        result: false, 
        error: '게시물을 찾을 수 없습니다.' 
      });
    }
    
    // 댓글 목록 조회
    const comments = await commentModel.getCommentsByPostId(POST_ID_NUM);
    
    // 각 댓글에 답글 추가
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        // 부모 댓글인 경우에만 답글 조회
        if (!comment.PARENT_COMMENT_ID) {
          const replies = await commentModel.getRepliesByParentId(comment.COMMENT_ID);
          return {
            ...comment,
            replies: replies,
          };
        }
        return comment;
      })
    );
    
    // 부모 댓글만 필터링 (답글은 replies에 포함)
    const parentComments = commentsWithReplies.filter(comment => !comment.PARENT_COMMENT_ID);
    
    res.status(200).json({ 
      result: true, 
      comments: parentComments 
    });
  } catch (error) {
    console.error('댓글 목록 조회 오류:', error);
    res.status(500).json({ 
      result: false, 
      error: error.message || '댓글 목록 조회 중 오류가 발생했습니다.' 
    });
  }
}

/**
 * 댓글 작성 (게시물에 직접 댓글)
 */
async function createComment(req, res) {
  try {
    // POST_ID, USER_ID, TEXT 등 다양한 형식 지원
    const POST_ID = req.body.POST_ID || req.body.Post_id || req.body.postId;
    const USER_ID = req.body.USER_ID || req.body.User_id || req.body.userId;
    const TEXT = req.body.TEXT || req.body.Text || req.body.text;
    
    if (!POST_ID || !USER_ID || !TEXT) {
      return res.status(400).json({ 
        result: false, 
        error: 'POST_ID, USER_ID, TEXT가 필요합니다.' 
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
    
    // 댓글 생성 (부모 댓글 없음)
    const COMMENT_ID = await commentModel.createComment(POST_ID_NUM, USER_ID, TEXT, null);
    
    res.status(201).json({ 
      result: true, 
      message: '댓글이 작성되었습니다.',
      COMMENT_ID: COMMENT_ID 
    });
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    res.status(500).json({ 
      result: false, 
      error: error.message || '댓글 작성 중 오류가 발생했습니다.' 
    });
  }
}

module.exports = {
  getComments,
  createComment,
};


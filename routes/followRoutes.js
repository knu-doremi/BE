const {Router} = require('express');
const router = Router();
const followmodel = require('../models/follow.js');

// 1) /follow -> POST (팔로우 여부에 따라, 추가 및 삭제)
router.post('', async (req, res) => {
    try {
        const {followerId, followeeId} = req.body;
        const result = await followmodel.toggleFollow(followerId, followeeId);

        if (result.following) {
            // 팔로우 취소
        } else {
            // 팔로우 추가
        }
        res.status(200).json({ result: true, following: result.following });
    } catch (error) {
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

module.exports = router;
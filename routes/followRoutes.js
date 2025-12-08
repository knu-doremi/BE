const {Router} = require('express');
const router = Router();
const followmodel = require('../models/followModel');

// 1) /follow -> POST (팔로우 여부에 따라, 추가 및 삭제)
router.post('', async (req, res) => {
    try {
        const {followerId, followingId} = req.body;
        const result = await followmodel.isFollow(followerId, followingId);

        if (result) {
            console.log(result);
            console.log('Unfollow logic here');
        } else {
            console.log(result);
            console.log('Follow logic here');
            // 팔로우 추가
        }
        res.status(200).json({ result: true, following: result});
    } catch (error) {
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

module.exports = router;
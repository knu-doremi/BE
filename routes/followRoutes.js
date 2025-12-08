const {Router} = require('express');
const router = Router();
const followmodel = require('../models/followModel');

// 1) 팔로우 -> post
router.post('', async (req, res) => {
    try {
        const { followerId, followingId } = req.body;

        // 현재 팔로우 여부 확인
        const isFollowing = await followmodel.isFollow(followerId, followingId);

        if (isFollowing) {
            await followmodel.unfollow(followerId, followingId);
        } else {
            await followmodel.follow(followerId, followingId);
        }

        // 결과 반환: 현재 상태를 클라이언트에게 알려줌
        res.status(200).json({
            result: true,
            following: !isFollowing     // 언팔했으면 false, 팔로우했으면 true
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            result: false,
            message: 'Internal server error'
        });
    }
});

// 2) 팔로우 상태 확인 -> post
router.post('/state', async (req, res) => {
    try {
        const { followerId, followingId } = req.body; 
        const isFollowing = await followmodel.isFollow(followerId, followingId);

        res.status(200).json({
            result: true,
            following: isFollowing
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            result: false,
            message: 'Internal server error'
        });
    }
});

// 3) 팔로잉, 팔로워 수 반환 -> post
router.post('/counts', async (req, res) => {
    try {
        const { userId } = req.body;
        const followingCount = await followmodel.countFollowing(userId);
        const followerCount = await followmodel.countFollowers(userId);
        res.status(200).json({
            result: true,
            followingCount: followingCount,
            followerCount: followerCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            result: false,
            message: 'Internal server error'
        });
    }
});


module.exports = router;
const {Router} = require ("express");
const router = Router();
const bookmarkModel = require ("../models/bookmarkModel.js");

router.post('/list', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                result: false,
                message: "userId is required"
            });
        }

        const posts = await bookmarkModel.findBookmarkedPosts(userId);

        res.status(200).json({
            result: true,
            count: posts.length,
            posts: posts
        });

    } catch (error) {
        console.error("LIST BOOKMARKS API ERROR:", error);
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

router.post('/check', async (req, res) => {
    try {
        const { postId, userId } = req.body;

        const isBookmarked = await bookmarkModel.checkBookmark(postId, userId);

        res.status(200).json({
            result: true,
            isBookmarked: isBookmarked
        });
    } catch (error) {
        console.error("CHECK BOOKMARK API ERROR:", error);
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

router.post('/add', async (req, res) => {
    try {
        const { postId, userId } = req.body;

        if (!postId || !userId) {
            return res.status(400).json({
                result: false,
                message: "postId and userId are required"
            });
        }

        const success = await bookmarkModel.addBookmark(postId, userId);

        res.status(200).json({
            result: success,
            message: success ? "Bookmark added" : "Failed to add bookmark"
        });

    } catch (error) {
        console.error("ADD BOOKMARK API ERROR:", error);
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

router.post('/delete', async (req, res) => {
    try {
        const { postId, userId } = req.body;

        if (!postId || !userId) {
            return res.status(400).json({
                result: false,
                message: "postId and userId are required"
            });
        }

        const success = await bookmarkModel.deleteBookmark(postId, userId);

        res.status(200).json({
            result: success,
            message: success ? "Bookmark deleted" : "Failed to delete bookmark"
        });

    } catch (error) {
        console.error("DELETE BOOKMARK API ERROR:", error);
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

module.exports = router;

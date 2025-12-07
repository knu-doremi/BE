const {Router} = require ("express");
const router = Router();
const bookmarkModel = require ("../models/bookmarkModel.js");

router.post('/bookmark/check', async (req, res) => {
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

const {Router} = require ("express");
const router = Router();
const usermodel = require ("../models/userModel.js");

/*
router.get('/', async (req, res) => {
    res.json({message: "User route works!"});
});*/

// 1) /login -> POST
router.post('/login', async (req, res) => {
    try {
        const {userid, password} = req.body;
        const user = await usermodel.login(userid, password);

        if (!user) {
            return res.status(401).json({ result: false, message: 'Invalid userid or password' });
        }
        res.status(200).json({result: true, user: user});
    } catch (error) {
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

// 2) /register -> POST
router.post('/register', async (req, res) => {
    try {
        const {userid, password, name, sex, birthdate} = req.body;

        const result = await usermodel.register(userid, password, name, sex, birthdate);

        if (result.duplicate) {
            return res.status(400).json({ result: false, message: 'Username already exists' });
        }

        res.status(200).json({result: true, message: 'User registered successfully'});
    } catch (error) {
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

// 3) /searchpassword -> POST
router.post('/searchpassword',
    
     async (req, res) => {
    try {
        const {username, userid, sex, birthdate} = req.body;

        const password  = await usermodel.searchpassword(username, userid, sex, birthdate);

        if (!password) {
            return res.status(401).json({ result: false, message: 'No matching user found' });
        }

        res.status(200).json({result: true, password: password});
    } catch (error) {
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

// 4) /checkid -> GET
router.get('/checkid', async (req, res) => {
    try {
        const { userid } = req.query;
        const count = await usermodel.checkid(userid);

        if (count > 0) {
            return res.status(400).json({ result: false, count: count, message: 'Username already exists' });
        }
        res.status(200).json({ result: true, count: count, message: 'Username is available' });
    } catch (error) {
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

// 5) /update -> POST
router.post('/update', async (req, res) => {
    try {
        const {userid, password, name} = req.body;

        const result = await usermodel.update(userid, password, name);

        if (!result) {
            return res.status(400).json({ result: false, message: 'Update failed' });
        }

        res.status(200).json({result: true, message: 'User updated successfully'});
    } catch (error) {
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

// 6) /recommended/:user_id -> GET (추천 유저 조회)
router.get('/recommended/:user_id', async (req, res) => {
    try {
        const USER_ID = req.params.user_id || req.params.USER_ID || req.params.User_id;
        
        if (!USER_ID) {
            return res.status(400).json({ 
                result: false, 
                error: 'USER_ID가 필요합니다.' 
            });
        }

        const users = await usermodel.getRecommendedUsers(USER_ID);

        res.status(200).json({
            result: true,
            users: users,
            count: users.length
        });
    } catch (error) {
        console.error('추천 유저 조회 오류:', error);
        res.status(500).json({ 
            result: false, 
            error: error.message || '추천 유저 조회 중 오류가 발생했습니다.' 
        });
    }
});

// 6) /searchuser -> POST
router.post('/searchuser', async (req, res) => {
    try {
        const { userId } = req.body;
        const users = await usermodel.searchuser(userId);
        res.status(200).json({ result: true, users: users });
    } catch (error) {
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

module.exports = router;
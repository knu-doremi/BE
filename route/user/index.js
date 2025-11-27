const {Router} = require ("express");
const router = Router();
const usermodel = require ("../../models/user.js");

/*
router.get('/', async (req, res) => {
    res.json({message: "User route works!"});
});*/

// 1) /api/login -> POST
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

// 2) /api/register -> POST
router.post('/register', async (req, res) => {
    try {
        const {userid, password, name, sex, birthdate} = req.body;

        await usermodel.register(userid, password, name, sex, birthdate);

        res.status(200).json({result: true, message: 'User registered successfully'});
    } catch (error) {
        res.status(500).json({ result: false, message: 'Internal server error' });
    }
});

// 3) /api/searchpassword -> POST
router.post('/searchpassword', async (req, res) => {
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

// 4) /api/checkid -> GET
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



module.exports = router;
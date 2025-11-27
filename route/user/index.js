const {Router} = require ("express");
const router = Router();
const usermodel = require ("../../models/user.js");

// const userService = require ("$/../service/userService");

router.get('/', async (req, res) => {
    res.json({message: "User route works!"});
});

// 1) /api/user/login -> POST
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

// 2) /api/user/register -> POST
router.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    // 여기에 회원가입 로직 추가
    res.json({ result: true, message: `Registered user ${username}` });
});

// 3) /api/user/searchpassword -> POST
router.post('/searchpassword', async (req, res) => {
    const { email } = req.body;
    // 여기에 비밀번호 찾기 로직 추가
    res.json({ result: true, message: `Password reset link sent to ${email}` });
});

// 4) /api/user/checkid -> GET
router.get('/checkid', async (req, res) => {
    const { username } = req.query;
    // 여기에 아이디 중복 확인 로직 추가
    res.json({ result: true, message: `Username ${username} is available` });
});



module.exports = router;
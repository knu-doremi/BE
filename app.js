const express = require('express');
const app = express();

app.use(express.json());

// /api/user 라우터 등록
app.use('/api', require('./route/user'));

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({ result: false, message: err.message });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

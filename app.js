const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// /api/user 라우터 등록
app.use('/api/user', require('./routes/userRoutes'));

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({ result: false, message: err.message });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

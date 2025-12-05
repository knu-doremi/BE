const express = require('express');
const path = require('path');
const cors = require('cors');
const { initializeDB, closePool } = require('./config/db');

// 라우트 import
const userRoutes = require('./routes/userRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();

// CORS 설정 - 프론트엔드에서 외부 백엔드 서버 접근 허용
app.use(cors({
  origin: '*', // 모든 origin 허용 (프로덕션에서는 특정 origin만 허용 권장)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false // 쿠키 사용 시 true로 변경
}));

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (업로드된 이미지 접근)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API 라우트

app.use('/api/user', userRoutes);
app.use('/api/comments', commentRoutes);

// 서버 시작
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // DB 초기화 (선택적 - DB 설정이 없어도 이미지 업로드는 가능)
    await initializeDB();
  } catch (error) {
    console.log('DB 초기화 실패 (이미지 업로드만 가능):', error.message);
  }

  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log('='.repeat(60) + '\n');
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('서버 종료 중...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('서버 종료 중...');
  await closePool();
  process.exit(0);
});
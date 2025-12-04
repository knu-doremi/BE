const express = require('express');
const path = require('path');
const cors = require('cors');
const { initializeDB, closePool } = require('./config/db');

// 라우트 import
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const likeRoutes = require('./routes/likeRoutes');
const commentRoutes = require('./routes/commentRoutes');
const hashtagRoutes = require('./routes/hashtagRoutes');

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
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/hashtags', hashtagRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.send('Hello World');
});

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
    console.log('📋 사용 가능한 API 엔드포인트:\n');
    
    // 기본 라우트
    console.log('  🌐 기본');
    console.log(`     GET  http://localhost:${PORT}/`);
    console.log('        설명: 서버 상태 확인\n');
    
    // 인증 라우트
    console.log('  🔐 인증 (Auth) - /api/auth');
    console.log(`     POST http://localhost:${PORT}/api/auth/register`);
    console.log(`     POST http://localhost:${PORT}/api/auth/signup`);
    console.log('        설명: 회원가입');
    console.log('        Body: { USER_ID, PASSWORD, NAME, SEX, BIRTH_DATE }');
    console.log('        지원 형식: USER_ID/User_id/userid, PASSWORD/Password/password 등\n');
    
    console.log(`     POST http://localhost:${PORT}/api/auth/login`);
    console.log('        설명: 로그인');
    console.log('        Body: { USER_ID, PASSWORD }');
    console.log('        지원 형식: USER_ID/User_id/userid, PASSWORD/Password/password\n');
    
    console.log(`     POST http://localhost:${PORT}/api/auth/logout`);
    console.log('        설명: 로그아웃\n');
    
    console.log(`     POST http://localhost:${PORT}/api/auth/searchpassword`);
    console.log('        설명: 비밀번호 찾기');
    console.log('        Body: { NAME, USER_ID, SEX, BIRTH_DATE }');
    console.log('        지원 형식: NAME/Name/name, USER_ID/User_id/userid 등\n');
    
    console.log(`     GET  http://localhost:${PORT}/api/auth/checkid?USER_ID=test1`);
    console.log('        설명: 아이디 중복 확인');
    console.log('        Query: USER_ID (또는 User_id, userid)\n');
    
    // 게시물 라우트
    console.log('  📝 게시물 (Posts) - /api/posts');
    console.log(`     POST http://localhost:${PORT}/api/posts`);
    console.log('        설명: 게시물 생성 (해시태그 포함)');
    console.log('        Body: { CONTENT, USER_ID, HASHTAGS (배열 또는 쉼표 구분 문자열) }');
    console.log('        지원 형식: CONTENT/Content/content, USER_ID/User_id/userId 등\n');
    
    console.log(`     POST http://localhost:${PORT}/api/posts/upload-image`);
    console.log('        설명: 이미지 업로드 및 라벨링 (Google Vision API)');
    console.log('        Content-Type: multipart/form-data');
    console.log('        Field: image (jpg, jpeg, png, gif, bmp, webp, 최대 10MB)');
    console.log('        Body: { POST_ID }');
    console.log('        응답: { imagePath, labels: [...] }\n');
    
    // 댓글 라우트
    console.log('  💬 댓글 (Comments) - /api/comments');
    console.log(`     GET  http://localhost:${PORT}/api/comments/posts/:POST_ID`);
    console.log('        설명: 게시물의 댓글 목록 조회 (답글 포함)\n');
    
    console.log(`     POST http://localhost:${PORT}/api/comments`);
    console.log('        설명: 게시물에 댓글 작성');
    console.log('        Body: { POST_ID, USER_ID, TEXT }\n');
    
    console.log(`     POST http://localhost:${PORT}/api/comments/reply`);
    console.log('        설명: 댓글에 답글 작성');
    console.log('        Body: { PARENT_COMMENT_ID, USER_ID, TEXT }\n');
    
    console.log(`     DELETE http://localhost:${PORT}/api/comments/:COMMENT_ID`);
    console.log('        설명: 댓글 삭제\n');
    
    // 해시태그 라우트
    console.log('  #️⃣  해시태그 (Hashtags) - /api/hashtags');
    console.log(`     GET  http://localhost:${PORT}/api/hashtags/search?HASHTAG_NAME=태그명`);
    console.log('        설명: 해시태그로 게시물 검색');
    console.log('        Query: HASHTAG_NAME, limit (선택), offset (선택)\n');
    
    console.log(`     GET  http://localhost:${PORT}/api/hashtags/autocomplete?searchTerm=검색어`);
    console.log('        설명: 해시태그 자동완성 검색');
    console.log('        Query: searchTerm (또는 search, q), limit (선택)\n');
    
    console.log(`     GET  http://localhost:${PORT}/api/hashtags/posts/:POST_ID`);
    console.log('        설명: 게시물의 해시태그 목록 조회\n');
    
    // 좋아요 라우트
    console.log('  ❤️  좋아요 (Likes) - /api/likes');
    console.log(`     POST http://localhost:${PORT}/api/likes`);
    console.log('        설명: 좋아요 추가/제거 (토글)');
    console.log('        Body: { postId (number), userId (string) }');
    console.log('        응답: { success: true, action: "liked" | "unliked" }\n');
    
    console.log(`     GET  http://localhost:${PORT}/api/likes/:postId`);
    console.log('        설명: 게시물의 좋아요 수 조회');
    console.log('        Params: postId (number)');
    console.log('        응답: { likeCount: number }\n');
    
    // 정적 파일
    console.log('  📁 정적 파일');
    console.log(`     GET  http://localhost:${PORT}/uploads/:filename`);
    console.log('        설명: 업로드된 이미지 파일 접근\n');
    
    console.log('='.repeat(60));
    console.log('💡 참고: USER 테이블 컬럼명');
    console.log('   - USER_ID, PASSWORD, NAME, SEX, BIRTH_DATE');
    console.log('   - 다양한 필드명 형식 지원 (대소문자, 언더스코어 등)');
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


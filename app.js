const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

// lectures.json 파일 불러오기
const lecturesData = require('./lectures.json');

// CSP 헤더 설정
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self';"
    );
    next();
});

// Express 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'base');
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// lectures 데이터를 모든 뷰에서 사용할 수 있도록 설정
app.use((req, res, next) => {
    res.locals.lectures = lecturesData.lectures;
    next();
});

// 루트 경로
app.get('/', (req, res) => {
    res.render('index', {
        title: '생성형 AI 이해하기',
        description: '생성형 AI를 활용한 업무 혁신',
        path: req.path,
        lectures: lecturesData.lectures,
        layout: 'base',  // base 레이아웃 사용
        indexPage: true  // index 페이지 여부 표시
    });
});

// 강의 라우트들
['01', '02', '03', '04', '05', '06'].forEach(num => {
    app.get(`/lecture${num}`, (req, res) => {
        const lecture = lecturesData.lectures.find(l => l.link === `/lecture${num}`);
        if (!lecture) {
            return res.status(404).send('강의를 찾을 수 없습니다.');
        }
        res.render(`lecture${num}`, {
            title: `제${lecture.number} : ${lecture.title}`,
            description: lecture.description,
            path: req.path,
            lectures: lecturesData.lectures,
            layout: 'base'  // 명시적으로 base 레이아웃 사용
        });
    });
});

// 404 에러 처리
app.use((req, res) => {
    res.status(404).render('404', {
        title: '페이지를 찾을 수 없습니다',
        description: '요청하신 페이지가 존재하지 않습니다.',
        path: req.path,
        lectures: lecturesData.lectures
    });
});

module.exports = app; 
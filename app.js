const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

// lectures.json 파일 불러오기
const lecturesData = require('./lectures.json');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'base');
app.use(expressLayouts);
app.use(express.static('public'));
app.use('/images', express.static('images'));

// lectures 데이터를 전달하는 미들웨어
app.use((req, res, next) => {
    res.locals.lectures = lecturesData.lectures;
    next();
});

// 라우팅
app.get('/', (req, res) => {
    res.render('index', { 
        layout: false,
        lectures: lecturesData.lectures,
        path: req.path
    });
});

app.get('/lecture01', (req, res) => {
    res.render('lecture01', {
        title: "제1강 : 인공지능이란 무엇인가",
        description: "인공지능의 기초와 발전 과정",
        path: req.path
    });
});

app.get('/lecture02', (req, res) => {
    res.render('lecture02', {
        title: '제2강: 디지털 리터러시와 일 잘하는 조직 만들기',
        description: "조직의 디지털 전환과 리더십",
        path: req.path
    });
});

app.get('/lecture03', (req, res) => {
    res.render('lecture03', {
        title: "제3강 : 프롬프트 엔지니어링",
        description: "프롬프트에 대한 이해와 CO-STAR 기법",
        path: req.path
    });
});

app.get('/lecture04', (req, res) => {
    res.render('lecture04', {
        title: '4강: 페르소나 설정과 피드백',
        description: '생성형 AI와의 효과적인 소통을 위한 페르소나 설정과 피드백 방법을 알아봅니다.',
        path: '/lecture04'
    });
});

app.get('/lecture05', (req, res) => {
    res.render('lecture05', {
        title: "제5강 : 생성형 AI를 활용한 연설문 작성",
        description: "15분 분량의 연설문 작성하기",
        path: req.path
    });
});

app.get('/lecture06', (req, res) => {
    res.render('lecture06', {
        title: "제6강 : 생성형 AI를 활용한 보고서 작성 실제",
        description: "실제 업무 예시를 통한 프롬프트 활용",
        path: req.path
    });
});

app.get('/qna', (req, res) => {
    res.render('QNA', {
        title: 'Q&A',
        description: '생성형 AI 활용에 대한 자주 묻는 질문과 주의사항을 안내합니다.',
        path: '/qna'
    });
});

app.get('/mygpts', (req, res) => {
    res.render('mygpts', {
        title: 'MyGPTs 설정 예시',
        description: 'AI 썸네일 제작을 위한 MyGPT 설정 과정을 살펴봅니다.',
        path: '/mygpts'
    });
});

// 포트 설정
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Vercel을 위한 export
module.exports = app; 
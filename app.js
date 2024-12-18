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
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// lectures 데이터를 전달하는 미들웨어
app.use((req, res, next) => {
    res.locals.lectures = lecturesData.lectures;
    next();
});

// 강의 라우트들
['01', '02', '03', '04', '05', '06'].forEach(num => {
    app.get(`/lecture${num}`, (req, res) => {
        const lecture = lecturesData.lectures.find(l => l.link === `/lecture${num}`);
        res.render(`lecture${num}`, {
            title: `제${lecture.number} : ${lecture.title}`,
            description: lecture.description,
            path: req.path
        });
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
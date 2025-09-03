const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

// Vercel KV 연결 시도 (로컬 개발 시 fallback)
let kv = null;
let isKvAvailable = false;

try {
    const kvModule = require('@vercel/kv');
    kv = kvModule.kv;
    // 환경변수 확인
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        isKvAvailable = true;
        console.log('✅ Vercel KV 연결 가능');
    } else {
        console.log('⚠️  로컬 개발 모드: Vercel KV 환경변수 없음, 메모리 저장소 사용');
    }
} catch (error) {
    console.log('⚠️  로컬 개발 모드: @vercel/kv 사용 불가, 메모리 저장소 사용');
}

// 로컬 개발용 메모리 저장소
const localStorage = {
    totalVisitors: parseInt(process.env.INIT_TOTAL_VISITORS) || 0,
    dailyVisitors: {},
    visitorIPs: new Set(),
    maxIPsToStore: 10000 // 메모리 누수 방지를 위한 최대 IP 저장 수
};

// lectures.json 파일 불러오기
const lecturesData = require('./lectures.json');

// CSP 헤더 설정
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self' https://vercel.live; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://vercel.live https://*.vercel.app https://unpkg.com; " +
        "script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://vercel.live https://*.vercel.app https://unpkg.com; " +
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https://vercel.live https://*.vercel.app;"
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

// 프록시 신뢰 설정 (Vercel/Netlify 등)
app.set('trust proxy', true);

// IP 추출 유틸리티 함수
function getClientIP(req) {
    return req.headers['x-real-ip'] || 
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-client-ip'] ||
           req.headers['cf-connecting-ip'] || // Cloudflare
           req.ip ||
           req.socket.remoteAddress ||
           'unknown';
}

// 메모리 정리 함수
function cleanupMemoryStorage(today) {
    try {
        // 7일 이전 dailyVisitors 데이터 삭제
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
        
        Object.keys(localStorage.dailyVisitors).forEach(date => {
            if (date < cutoffDate) {
                delete localStorage.dailyVisitors[date];
            }
        });
        
        // visitorIPs Set 크기 제한 (최신 방문자만 유지)
        if (localStorage.visitorIPs.size > localStorage.maxIPsToStore) {
            const ipsArray = Array.from(localStorage.visitorIPs);
            // 오늘 방문자는 유지하고 나머지는 정리
            const todayIPs = ipsArray.filter(ip => ip.startsWith(today + ':'));
            const oldIPs = ipsArray.filter(ip => !ip.startsWith(today + ':'));
            
            // 오래된 IP 중 절반 제거
            const toRemove = oldIPs.slice(0, Math.floor(oldIPs.length / 2));
            toRemove.forEach(ip => localStorage.visitorIPs.delete(ip));
            
            console.log(`🧹 메모리 정리: ${toRemove.length}개 오래된 IP 제거`);
        }
    } catch (error) {
        console.error('Memory cleanup error:', error);
    }
}

// 방문자 카운터 미들웨어
const visitorCounter = async (req, res, next) => {
    try {
        // 정적 파일 요청, API 호출, 봇 요청은 카운트하지 않음
        const userAgent = req.headers['user-agent'] || 'unknown';
        const isBot = /bot|crawler|spider|scraper/i.test(userAgent);
        const isStaticFile = /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$/i.test(req.path);
        const isApiCall = req.path.startsWith('/api/');
        
        if (isBot || isStaticFile || isApiCall) {
            return next();
        }
        
        const clientIP = getClientIP(req);
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
        const ipKey = `${today}:${clientIP}:${Buffer.from(userAgent).toString('base64').slice(0, 10)}`;
        
        if (isKvAvailable && kv) {
            // Vercel KV 사용
            const hasVisitedToday = await kv.get(`visitor_ips:${ipKey}`);
            
            if (!hasVisitedToday) {
                // 새로운 방문자인 경우
                await kv.set(`visitor_ips:${ipKey}`, '1', { ex: 86400 });
                await kv.incr('total_visitors');
                
                const dailyKey = `daily_visitors:${today}`;
                await kv.incr(dailyKey);
                await kv.expire(dailyKey, 604800);
            }
        } else {
            // 로컬 메모리 저장소 사용
            if (!localStorage.visitorIPs.has(ipKey)) {
                localStorage.visitorIPs.add(ipKey);
                localStorage.totalVisitors++;
                
                if (!localStorage.dailyVisitors[today]) {
                    localStorage.dailyVisitors[today] = 0;
                }
                localStorage.dailyVisitors[today]++;
                
                // 메모리 정리 로직 개선
                cleanupMemoryStorage(today);
            }
        }
    } catch (error) {
        console.error('방문자 카운터 오류:', {
            error: error.message,
            ip: req.ip || 'unknown',
            path: req.path,
            userAgent: req.headers['user-agent']?.substring(0, 100) || 'unknown',
            timestamp: new Date().toISOString()
        });
        // 에러가 발생해도 페이지 로딩은 계속
    }
    next();
};

// 방문자 카운터 미들웨어 적용 (정적 파일 제외)
app.use(visitorCounter);

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
        layout: false  // 레이아웃 사용하지 않음
    });
});

// MyGPTs 페이지 라우트 추가
app.get('/mygpts', (req, res) => {
    res.render('mygpts', {
        title: 'MyGPTs 설정 사례',
        description: 'MyGPTs를 활용한 실제 설정 사례를 살펴봅니다.',
        path: '/mygpts',
        lectures: lecturesData.lectures
    });
});

// 강의 라우트들
['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13'].forEach(num => {
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

// 테스트 페이지 라우트 추가
app.get('/test-pdf', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-pdf.html'));
});

// Quiz 페이지 라우트 추가
app.get('/quiz', (req, res) => {
    res.render('quiz', {
        title: '생성형 AI 이해도 평가 퀴즈',
        description: '당신의 AI 지식 수준을 확인해보세요',
        path: '/quiz',
        lectures: lecturesData.lectures,
        layout: false  // 퀴즈 페이지는 독립적인 레이아웃 사용
    });
});

// QNA 페이지 라우트 추가
app.get('/qna', (req, res) => {
    res.render('QNA', {
        title: 'Q&A - 자주 묻는 질문',
        description: '생성형 AI 관련 자주 묻는 질문들을 모아놓았습니다.',
        path: '/qna',
        lectures: lecturesData.lectures
    });
});

app.get('/contact', (req, res) => {
    res.render('contact', {
        title: 'Contact - 문의하기',
        description: '생성형 AI 관련 문의하기',
        path: '/contact',
        lectures: lecturesData.lectures
    });
});

// promt platform 리디렉션 라우트
app.get('/promt', (req, res) => {
    res.redirect('https://prompt-parkyongkyus-projects.vercel.app/library');
});

// 방문자 카운트 API 엔드포인트
app.get('/api/visitors', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let totalVisitors = 0;
        let dailyVisitors = 0;
        let storageMode = 'unknown';
        
        if (isKvAvailable && kv) {
            // Vercel KV 사용
            const [totalResult, dailyResult] = await Promise.all([
                kv.get('total_visitors').catch(() => null),
                kv.get(`daily_visitors:${today}`).catch(() => null)
            ]);
            
            totalVisitors = parseInt(totalResult) || 0;
            dailyVisitors = parseInt(dailyResult) || 0;
            storageMode = 'vercel-kv';
        } else {
            // 로컬 메모리 저장소 사용
            totalVisitors = parseInt(localStorage.totalVisitors) || 0;
            dailyVisitors = parseInt(localStorage.dailyVisitors[today]) || 0;
            storageMode = 'local-memory';
        }
        
        // 데이터 검증
        if (totalVisitors < 0) totalVisitors = 0;
        if (dailyVisitors < 0) dailyVisitors = 0;
        if (dailyVisitors > totalVisitors) dailyVisitors = totalVisitors;
        
        const response = {
            success: true,
            totalVisitors,
            dailyVisitors,
            date: today,
            mode: storageMode,
            timestamp: new Date().toISOString()
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('방문자 수 조회 오류:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        res.status(500).json({
            success: false,
            totalVisitors: 0,
            dailyVisitors: 0,
            date: new Date().toISOString().split('T')[0],
            error: '방문자 수를 불러오는데 실패했습니다',
            mode: 'error',
            timestamp: new Date().toISOString()
        });
    }
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
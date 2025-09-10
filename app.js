const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const nodemailer = require('nodemailer');

// 환경변수 로드
require('dotenv').config();

// Supabase 연결 설정 (우선순위)
const { createClient } = require('@supabase/supabase-js');
let supabase = null;
let isSupabaseAvailable = false;

try {
    // Supabase 환경변수 검증
    const isValidSupabase = process.env.SUPABASE_URL && 
                           process.env.SUPABASE_ANON_KEY &&
                           process.env.SUPABASE_URL !== 'your_supabase_url' &&
                           process.env.SUPABASE_ANON_KEY !== 'your_supabase_anon_key' &&
                           process.env.SUPABASE_URL.startsWith('https://');
    
    if (isValidSupabase) {
        supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        isSupabaseAvailable = true;
        console.log('✅ Supabase 연결 성공');
    } else {
        console.log('⚠️  Supabase 환경변수 설정 필요 - 대체 저장소 사용');
    }
} catch (error) {
    console.log('⚠️  Supabase 연결 실패:', error.message);
}

// Vercel KV 연결 시도 (Supabase 대체제)
let kv = null;
let isKvAvailable = false;

if (!isSupabaseAvailable) {
    try {
        const kvModule = require('@vercel/kv');
        
        // URL이 실제 값인지 확인 (기본값이 아닌지)
        const isValidUrl = process.env.KV_REST_API_URL && 
                          process.env.KV_REST_API_TOKEN &&
                          process.env.KV_REST_API_URL !== 'your_kv_url' &&
                          process.env.KV_REST_API_TOKEN !== 'your_kv_token' &&
                          process.env.KV_REST_API_URL.startsWith('https://');
        
        if (isValidUrl) {
            kv = kvModule.kv;
            isKvAvailable = true;
            console.log('✅ Vercel KV 연결 가능 (Supabase 대체)');
        } else {
            console.log('⚠️  로컬 개발 모드: 메모리 저장소 사용');
            console.log('💡 개발 환경에서는 로컬 메모리로 정상 작동합니다.');
        }
    } catch (error) {
        console.log('⚠️  로컬 개발 모드: 외부 저장소 사용 불가, 메모리 저장소 사용');
    }
}

// 로컬 개발용 메모리 저장소
const localStorage = {
    totalVisitors: parseInt(process.env.INIT_TOTAL_VISITORS) || 0,
    dailyVisitors: {},
    visitorIPs: new Set(),
    maxIPsToStore: 10000 // 메모리 누수 방지를 위한 최대 IP 저장 수
};

// =====================================================
// Supabase 헬퍼 함수들
// =====================================================

// Supabase 방문자 증가 함수
async function incrementSupabaseVisitor(ipAddress, userAgent = null, pagePath = '/') {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase.rpc('increment_visitor', {
            visitor_ip: ipAddress,
            visit_date: today,
            user_agent_str: userAgent,
            page_path_str: pagePath
        });
        
        if (error) {
            console.error('Supabase 방문자 증가 오류:', error);
            return null;
        }
        
        return {
            isNewVisitor: data.isNewVisitor,
            dailyVisitors: data.dailyVisitors,
            totalVisitors: data.totalVisitors,
            storageMode: 'supabase'
        };
    } catch (error) {
        console.error('Supabase 연결 오류:', error);
        return null;
    }
}

// Supabase 방문자 통계 조회 함수
async function getSupabaseVisitorStats(targetDate = null) {
    try {
        const date = targetDate || new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase.rpc('get_visitor_stats', {
            target_date: date
        });
        
        if (error) {
            console.error('Supabase 통계 조회 오류:', error);
            return null;
        }
        
        return {
            dailyVisitors: data.dailyVisitors || 0,
            totalVisitors: data.totalVisitors || 0,
            storageMode: 'supabase'
        };
    } catch (error) {
        console.error('Supabase 연결 오류:', error);
        return null;
    }
}

// 로컬 데이터를 Supabase로 마이그레이션
async function migrateLocalDataToSupabase() {
    if (!isSupabaseAvailable || localStorage.totalVisitors === 0) {
        return false;
    }
    
    try {
        const today = new Date().toISOString().split('T')[0];
        const dailyCount = localStorage.dailyVisitors[today] || 0;
        
        const { data, error } = await supabase.rpc('migrate_local_data', {
            initial_total: localStorage.totalVisitors,
            initial_daily: dailyCount,
            target_date: today
        });
        
        if (error) {
            console.error('마이그레이션 오류:', error);
            return false;
        }
        
        console.log('✅ 로컬 데이터 Supabase 마이그레이션 완료:', data);
        return true;
    } catch (error) {
        console.error('마이그레이션 실행 오류:', error);
        return false;
    }
}

// 안전한 Supabase 작업 실행 (fallback 포함)
async function safeSupabaseOperation(operation, fallbackFn = null) {
    if (!isSupabaseAvailable) {
        return fallbackFn ? await fallbackFn() : null;
    }
    
    try {
        const result = await operation();
        return result;
    } catch (error) {
        console.error('Supabase 작업 실패, fallback 실행:', error.message);
        return fallbackFn ? await fallbackFn() : null;
    }
}

// lectures.json 파일 불러오기
const lecturesData = require('./lectures.json');

// CSP 헤더 설정
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self' https://vercel.live https://*.gqai.kr; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://vercel.live https://*.vercel.app https://unpkg.com https://*.gqai.kr https://www.googletagmanager.com; " +
        "script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://vercel.live https://*.vercel.app https://unpkg.com https://*.gqai.kr https://www.googletagmanager.com; " +
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com https://*.gqai.kr; " +
        "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://*.gqai.kr; " +
        "img-src 'self' data: https: https://*.gqai.kr; " +
        "connect-src 'self' https://vercel.live https://*.vercel.app https://*.gqai.kr https://cdn.jsdelivr.net https://www.google-analytics.com https://analytics.google.com " + process.env.SUPABASE_URL + "; " +
        "frame-src 'self' https://*.gqai.kr https://vercel.live;"
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

// JSON 파싱 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 방문자 카운터 미들웨어 (Supabase 우선)
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
        const today = new Date().toISOString().split('T')[0];
        const ipKey = `${today}:${clientIP}:${Buffer.from(userAgent).toString('base64').slice(0, 10)}`;
        let visitorProcessed = false;
        
        // 1단계: Supabase 우선 시도
        if (isSupabaseAvailable && !visitorProcessed) {
            const result = await safeSupabaseOperation(
                () => incrementSupabaseVisitor(clientIP, userAgent, req.path),
                null
            );
            
            if (result) {
                visitorProcessed = true;
                // 로컬 메모리 동기화 (선택적)
                if (result.isNewVisitor) {
                    localStorage.totalVisitors = Math.max(localStorage.totalVisitors, result.totalVisitors);
                    localStorage.dailyVisitors[today] = Math.max(localStorage.dailyVisitors[today] || 0, result.dailyVisitors);
                }
            }
        }
        
        // 2단계: Supabase 실패 시 Vercel KV 시도
        if (!visitorProcessed && isKvAvailable && kv) {
            try {
                const hasVisitedToday = await kv.get(`visitor_ips:${ipKey}`);
                
                if (!hasVisitedToday) {
                    // 새로운 방문자인 경우
                    await kv.set(`visitor_ips:${ipKey}`, '1', { ex: 86400 });
                    await kv.incr('total_visitors');
                    
                    const dailyKey = `daily_visitors:${today}`;
                    await kv.incr(dailyKey);
                    await kv.expire(dailyKey, 604800);
                    visitorProcessed = true;
                }
            } catch (kvError) {
                console.error('KV 방문자 처리 오류:', kvError.message);
            }
        }
        
        // 3단계: 모든 외부 저장소 실패 시 로컬 메모리 사용
        if (!visitorProcessed) {
            if (!localStorage.visitorIPs.has(ipKey)) {
                localStorage.visitorIPs.add(ipKey);
                localStorage.totalVisitors++;
                
                if (!localStorage.dailyVisitors[today]) {
                    localStorage.dailyVisitors[today] = 0;
                }
                localStorage.dailyVisitors[today]++;
                
                // 메모리 정리 로직
                cleanupMemoryStorage(today);
                visitorProcessed = true;
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

// =====================================================
// 서브도메인 리디렉트 설정 (통합된 gqai.kr 하위 도메인으로 연결)
// =====================================================

// 서브도메인 매핑 객체
const subdomainMappings = {
    '/prompt': 'https://prompt.gqai.kr',
    '/genpro': 'https://genpro.gqai.kr', 
    '/news': 'https://news.gqai.kr',
    '/bill': 'https://bill.gqai.kr'
};

// 서브도메인 리디렉트 미들웨어
Object.entries(subdomainMappings).forEach(([path, subdomain]) => {
    app.use(path, (req, res) => {
        // 원본 경로에서 서브패스 제거 후 서브도메인으로 리디렉트
        const targetPath = req.originalUrl.replace(path, '') || '/';
        const redirectUrl = subdomain + targetPath;
        
        console.log(`🔀 리디렉트: ${req.originalUrl} → ${redirectUrl}`);
        res.redirect(302, redirectUrl);
    });
});

// =====================================================
// 앱 시작 시 마이그레이션 실행
// =====================================================
(async () => {
    try {
        // Supabase 연결 확인 및 마이그레이션
        if (isSupabaseAvailable) {
            console.log('🔄 Supabase 연결 확인 중...');
            
            // 연결 테스트
            const testResult = await safeSupabaseOperation(
                () => getSupabaseVisitorStats(),
                null
            );
            
            if (testResult) {
                console.log('✅ Supabase 연결 정상');
                
                // 로컬 데이터가 있으면 마이그레이션
                if (localStorage.totalVisitors > 0) {
                    console.log('🔄 로컬 메모리 데이터를 Supabase로 마이그레이션 중...');
                    const migrationResult = await migrateLocalDataToSupabase();
                    
                    if (migrationResult) {
                        console.log('✅ 마이그레이션 완료');
                        // 마이그레이션 후 로컬 메모리 초기화 (선택적)
                        // localStorage.totalVisitors = 0;
                        // localStorage.dailyVisitors = {};
                    } else {
                        console.log('⚠️ 마이그레이션 실패, 로컬 메모리 유지');
                    }
                }
            } else {
                console.log('⚠️ Supabase 연결 실패, fallback 모드로 실행');
            }
        }
    } catch (initError) {
        console.error('앱 초기화 오류:', initError.message);
    }
})();

// lectures 데이터를 모든 뷰에서 사용할 수 있도록 설정
app.use((req, res, next) => {
    res.locals.lectures = lecturesData.lectures;
    next();
});

// 루트 경로 - 랜딩 페이지로 변경
app.get('/', (req, res) => {
    res.render('landing', {
        title: 'GQ AI - 생성형 AI 플랫폼',
        description: 'AI 러닝 플랫폼과 프롬프트 라이브러리로 구성된 통합 AI 서비스',
        path: '/',
        lectures: lecturesData.lectures,
        layout: false  // 독립적인 레이아웃 사용
    });
});

// AI 러닝 플랫폼 페이지 (기존 메인 페이지)
app.get('/learning', (req, res) => {
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

// 교육문의 페이지 라우트 추가
app.get('/education-inquiry', (req, res) => {
    res.render('education-inquiry', {
        title: '교육문의 - GQ AI ',
        description: 'GQ AI 교육 문의하기',
        path: '/education-inquiry',
        lectures: lecturesData.lectures,
        layout: false  // 독립적인 레이아웃 사용
    });
});

// 보좌진전문과정 페이지 라우트 추가
app.get('/legislative-assistant-program', (req, res) => {
    res.render('legislative-assistant-program', {
        title: '보좌진전문과정 - GQ AI',
        description: '국회 보좌진을 위한 AI 전문 교육과정',
        path: '/legislative-assistant-program',
        lectures: lecturesData.lectures,
        layout: false  // 독립적인 레이아웃 사용
    });
});

// 랜딩 페이지 라우트 추가
app.get('/landing', (req, res) => {
    res.render('landing', {
        title: 'GQ AI - 생성형 AI 플랫폼',
        description: 'AI 러닝 플랫폼과 프롬프트 라이브러리로 구성된 통합 AI 서비스',
        path: '/landing',
        lectures: lecturesData.lectures,
        layout: false  // 독립적인 레이아웃 사용
    });
});

// prompt platform은 프록시 미들웨어가 처리

// 교육 문의 폼 제출 처리
app.post('/education-inquiry', async (req, res) => {
    try {
        const {
            company,
            name,
            phone,
            email,
            message
        } = req.body;

        // 메일 전송 설정 (Gmail 사용 예시)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // 환경변수에서 설정
                pass: process.env.EMAIL_PASS  // 환경변수에서 설정
            }
        });

        // 메일 내용 구성 (자유양식)
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.RECEIVER_EMAIL, // 받을 이메일 주소
            subject: `[GQ AI] 교육 문의 - ${company} (${name})`,
            html: `
                <h2>교육 문의가 접수되었습니다</h2>
                
                <h3>기본 정보</h3>
                <ul>
                    <li><strong>단체명/기관명:</strong> ${company}</li>
                    <li><strong>담당자명:</strong> ${name}</li>
                    <li><strong>연락처:</strong> ${phone}</li>
                    <li><strong>이메일:</strong> ${email}</li>
                </ul>

                <h3>교육 문의 내용</h3>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; border-left: 4px solid #007bff;">
                    <p style="white-space: pre-line;">${message || '내용 없음'}</p>
                </div>

                <hr>
                <p><small>접수 시간: ${new Date().toLocaleString('ko-KR')}</small></p>
            `
        };

        // 메일 전송
        await transporter.sendMail(mailOptions);

        res.json({ 
            success: true, 
            message: '문의가 성공적으로 접수되었습니다!' 
        });
    } catch (error) {
        console.error('메일 전송 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
        });
    }
});

// 보좌진전문과정 문의 폼 제출 처리
app.post('/legislative-assistant-program', async (req, res) => {
    try {
        const {
            name,
            office,
            phone,
            email,
            message
        } = req.body;

        // 메일 전송 설정
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // 메일 내용 구성 (보좌진전문과정)
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.RECEIVER_EMAIL,
            subject: `[GQ AI] 보좌진전문과정 문의 - ${office} (${name})`,
            html: `
                <h2>🏛️ 보좌진전문과정 문의가 접수되었습니다</h2>
                
                <h3>기본 정보</h3>
                <ul>
                    <li><strong>담당자명:</strong> ${name}</li>
                    <li><strong>의원실명:</strong> ${office}</li>
                    <li><strong>연락처:</strong> ${phone}</li>
                    <li><strong>이메일:</strong> ${email}</li>
                </ul>

                <h3>문의 내용</h3>
                <div style="background-color: #f0f8ff; padding: 20px; border-radius: 5px; border-left: 4px solid #1e3c72;">
                    <p style="white-space: pre-line;">${message || '내용 없음'}</p>
                </div>

                <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin-top: 20px;">
                    <p><strong>📋 보좌진전문과정 특징:</strong></p>
                    <ul>
                        <li>의원실별 맞춤 교육</li>
                        <li>소그룹 집중 교육 (5-10명)</li>
                        <li>실무 중심 커리큘럼</li>
                        <li>현장/온라인/혼합형 진행</li>
                    </ul>
                </div>

                <hr>
                <p><small>접수 시간: ${new Date().toLocaleString('ko-KR')}</small></p>
            `
        };

        // 메일 전송
        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: '보좌진전문과정 문의가 성공적으로 접수되었습니다!'
        });

    } catch (error) {
        console.error('보좌진전문과정 문의 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        });
    }
});

// 방문자 카운트 API 엔드포인트 (Supabase 우선)
app.get('/api/visitors', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let totalVisitors = 0;
        let dailyVisitors = 0;
        let storageMode = 'unknown';
        let result = null;
        
        // 1단계: Supabase 우선 시도
        if (isSupabaseAvailable) {
            result = await safeSupabaseOperation(
                () => getSupabaseVisitorStats(today),
                null
            );
            
            if (result) {
                totalVisitors = result.totalVisitors;
                dailyVisitors = result.dailyVisitors;
                storageMode = 'supabase';
            }
        }
        
        // 2단계: Supabase 실패 시 Vercel KV 시도
        if (!result && isKvAvailable && kv) {
            try {
                const [totalResult, dailyResult] = await Promise.all([
                    kv.get('total_visitors').catch(() => null),
                    kv.get(`daily_visitors:${today}`).catch(() => null)
                ]);
                
                totalVisitors = parseInt(totalResult) || 0;
                dailyVisitors = parseInt(dailyResult) || 0;
                storageMode = 'vercel-kv';
                result = { totalVisitors, dailyVisitors };
            } catch (kvError) {
                console.error('KV 조회 오류:', kvError.message);
            }
        }
        
        // 3단계: 모든 외부 저장소 실패 시 로컬 메모리 사용
        if (!result) {
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
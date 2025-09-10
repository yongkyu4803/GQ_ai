# Google Analytics 4 (GA4) 통합 가이드

GQ_AI 프로젝트에 Google Analytics 4를 통합하여 상세한 사용자 분석을 구현하는 완전한 가이드입니다.

## 📋 개요

### 현재 시스템과의 통합
- **기존**: Supabase 기반 실시간 방문자 통계
- **추가**: Google Analytics 4 상세 분석
- **목표**: 두 시스템의 장점을 활용한 종합적인 분석 환경

## 🚀 Google Analytics 4 설정

### 1. GA4 계정 및 속성 생성

1. **Google Analytics 접속**
   - [Google Analytics](https://analytics.google.com/) 이동
   - Google 계정으로 로그인

2. **계정 생성**
   ```
   계정 이름: GQ_AI_Analytics
   국가/지역: 대한민국
   데이터 공유 설정: 필요에 따라 선택
   ```

3. **속성 생성**
   ```
   속성 이름: GQ_AI 웹사이트
   시간대: (GMT+09:00) 서울
   통화: 대한민국 원(KRW)
   ```

4. **데이터 스트림 설정**
   ```
   플랫폼: 웹
   웹사이트 URL: https://your-domain.com
   스트림 이름: GQ_AI 웹 스트림
   ```

5. **측정 ID 확인**
   - 형식: `G-XXXXXXXXXX`
   - 이 ID를 환경변수에 저장할 예정

## 🔧 프로젝트 통합 구현

### 1. 환경변수 설정

`.env` 파일에 추가:
```env
# Google Analytics 설정
GA_MEASUREMENT_ID=G-XXXXXXXXXX
NODE_ENV=production
```

### 2. 기본 GTM 스크립트 통합

**views/base.ejs 수정** - `<head>` 섹션에 추가:

```html
<% if (process.env.GA_MEASUREMENT_ID && process.env.NODE_ENV === 'production') { %>
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=<%= process.env.GA_MEASUREMENT_ID %>"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  
  gtag('config', '<%= process.env.GA_MEASUREMENT_ID %>', {
    page_title: document.title,
    page_location: window.location.href,
    custom_map: {
      'custom_parameter_1': 'lecture_number'
    }
  });
  
  // 개발 모드에서는 디버그 활성화
  <% if (process.env.NODE_ENV !== 'production') { %>
  gtag('config', '<%= process.env.GA_MEASUREMENT_ID %>', {
    debug_mode: true
  });
  <% } %>
</script>
<% } %>
```

### 3. Express 앱에서 환경변수 전달

**app.js 수정**:
```javascript
// 환경변수를 뷰에서 사용할 수 있도록 설정
app.use((req, res, next) => {
    res.locals.GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;
    res.locals.NODE_ENV = process.env.NODE_ENV;
    next();
});
```

## 📊 이벤트 추적 구현

### 1. 강의 페이지 조회 추적

각 강의 페이지에서 사용할 공통 스크립트:

```html
<script>
// 강의 조회 이벤트 추적
function trackLectureView(lectureNumber, lectureTitle) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'lecture_view', {
      'event_category': 'engagement',
      'event_label': lectureTitle,
      'lecture_number': lectureNumber,
      'lecture_title': lectureTitle,
      'custom_parameter_1': lectureNumber
    });
    
    console.log('GA Event: lecture_view', {
      lecture: lectureNumber,
      title: lectureTitle
    });
  }
}

// 페이지 로드 시 자동 호출
document.addEventListener('DOMContentLoaded', function() {
  const lectureData = {
    number: '<%= lecture.number %>',
    title: '<%= lecture.title %>'
  };
  
  trackLectureView(lectureData.number, lectureData.title);
});
</script>
```

### 2. 퀴즈 완료 추적

**views/quiz.ejs에 추가**:

```html
<script>
function trackQuizCompletion(score, level, totalQuestions) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'quiz_complete', {
      'event_category': 'engagement',
      'event_label': `${level}_level`,
      'score': score,
      'level': level,
      'total_questions': totalQuestions,
      'pass_rate': Math.round((score / totalQuestions) * 100)
    });
    
    // 우수한 성과 달성 시 추가 이벤트
    if (score / totalQuestions >= 0.9) {
      gtag('event', 'quiz_excellence', {
        'event_category': 'achievement',
        'event_label': 'high_score',
        'score': score,
        'level': level
      });
    }
  }
}

// 퀴즈 시작 추적
function trackQuizStart(level) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'quiz_start', {
      'event_category': 'engagement',
      'event_label': `${level}_level`,
      'level': level
    });
  }
}
</script>
```

### 3. 문의 폼 제출 추적

**문의 폼이 있는 페이지에 추가**:

```html
<script>
function trackFormSubmission(formType, success = true) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'form_submit', {
      'event_category': 'conversion',
      'event_label': formType,
      'form_type': formType,
      'success': success
    });
    
    if (success) {
      gtag('event', 'conversion', {
        'event_category': 'goal',
        'event_label': 'contact_form_success'
      });
    }
  }
}

// 폼 제출 이벤트 리스너
document.querySelector('#contact-form')?.addEventListener('submit', function(e) {
  trackFormSubmission('contact', true);
});
</script>
```

### 4. 사용자 참여도 추적

```html
<script>
// 페이지 스크롤 추적
let scrollTracked = false;
window.addEventListener('scroll', function() {
  if (!scrollTracked && (window.scrollY / document.body.scrollHeight) > 0.5) {
    scrollTracked = true;
    if (typeof gtag !== 'undefined') {
      gtag('event', 'scroll_50_percent', {
        'event_category': 'engagement'
      });
    }
  }
});

// 사이트 체류 시간 추적
let startTime = Date.now();
window.addEventListener('beforeunload', function() {
  const timeSpent = Math.round((Date.now() - startTime) / 1000);
  if (typeof gtag !== 'undefined' && timeSpent > 10) {
    gtag('event', 'time_on_page', {
      'event_category': 'engagement',
      'value': timeSpent
    });
  }
});
</script>
```

## 🔗 Supabase 통계와의 통합

### 1. 통합 API 엔드포인트

**app.js에 추가**:

```javascript
// 통합 분석 데이터 API
app.get('/api/analytics/dashboard', async (req, res) => {
    try {
        // Supabase 실시간 데이터
        const supabaseStats = await getCurrentVisitorStats();
        
        // 통합 대시보드 데이터
        const dashboardData = {
            realtime: {
                source: "supabase",
                totalVisitors: supabaseStats.totalVisitors,
                dailyVisitors: supabaseStats.dailyVisitors,
                lastUpdate: new Date().toISOString()
            },
            analytics: {
                source: "google_analytics",
                note: "Google Analytics 대시보드에서 상세 분석 가능",
                dashboardUrl: `https://analytics.google.com/analytics/web/#/p${process.env.GA_PROPERTY_ID}/reports/dashboard`
            },
            integration: {
                supabase_active: isSupabaseAvailable,
                ga_active: !!process.env.GA_MEASUREMENT_ID,
                mode: isSupabaseAvailable ? "dual" : "fallback"
            }
        };
        
        res.json(dashboardData);
    } catch (error) {
        console.error('Analytics dashboard error:', error);
        res.status(500).json({ 
            error: 'Analytics data unavailable',
            timestamp: new Date().toISOString()
        });
    }
});
```

### 2. 방문자 통계 비교 대시보드

**새 파일: views/analytics.ejs**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Analytics Dashboard - GQ_AI</title>
    <!-- 기존 스타일 시트 포함 -->
</head>
<body>
    <div class="analytics-dashboard">
        <h1>📊 분석 대시보드</h1>
        
        <div class="stats-grid">
            <!-- 실시간 통계 (Supabase) -->
            <div class="stat-card realtime">
                <h3>🔄 실시간 통계</h3>
                <div id="realtime-stats">
                    <p>총 방문자: <span id="total-visitors">-</span></p>
                    <p>오늘 방문자: <span id="daily-visitors">-</span></p>
                    <p>데이터 소스: Supabase</p>
                </div>
            </div>
            
            <!-- Google Analytics 링크 -->
            <div class="stat-card analytics">
                <h3>📈 상세 분석</h3>
                <p>Google Analytics에서 제공하는 상세한 사용자 행동 분석</p>
                <a href="https://analytics.google.com" target="_blank" class="btn">
                    GA 대시보드 열기
                </a>
            </div>
        </div>
    </div>
    
    <script>
        // 실시간 데이터 업데이트
        async function updateRealtimeStats() {
            try {
                const response = await fetch('/api/analytics/dashboard');
                const data = await response.json();
                
                document.getElementById('total-visitors').textContent = 
                    data.realtime.totalVisitors;
                document.getElementById('daily-visitors').textContent = 
                    data.realtime.dailyVisitors;
                    
            } catch (error) {
                console.error('실시간 통계 업데이트 실패:', error);
            }
        }
        
        // 5초마다 업데이트
        setInterval(updateRealtimeStats, 5000);
        updateRealtimeStats(); // 초기 로드
    </script>
</body>
</html>
```

## 🛡️ 프라이버시 및 법적 준수

### 1. 쿠키 동의 시스템

**views/base.ejs에 추가**:

```html
<!-- 쿠키 동의 배너 -->
<div id="cookie-consent-banner" style="display: none;" class="cookie-banner">
    <div class="cookie-content">
        <p>
            🍪 이 웹사이트는 Google Analytics를 사용하여 사용자 경험을 개선하고 
            웹사이트 사용 통계를 수집합니다. 
            <a href="/privacy-policy" target="_blank">개인정보처리방침</a>에서 
            자세한 내용을 확인하실 수 있습니다.
        </p>
        <div class="cookie-buttons">
            <button onclick="acceptCookies()" class="btn-accept">동의</button>
            <button onclick="declineCookies()" class="btn-decline">거부</button>
        </div>
    </div>
</div>

<script>
// 쿠키 동의 관리
function showCookieConsent() {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
        document.getElementById('cookie-consent-banner').style.display = 'block';
    } else if (consent === 'accepted') {
        initializeAnalytics();
    }
}

function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    document.getElementById('cookie-consent-banner').style.display = 'none';
    initializeAnalytics();
    
    // GA4에 동의 상태 업데이트
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
            'analytics_storage': 'granted'
        });
    }
}

function declineCookies() {
    localStorage.setItem('cookieConsent', 'declined');
    document.getElementById('cookie-consent-banner').style.display = 'none';
    
    // GA4에 거부 상태 업데이트
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
            'analytics_storage': 'denied'
        });
    }
}

function initializeAnalytics() {
    // GA4 초기화 및 설정
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'default', {
            'analytics_storage': 'granted'
        });
    }
}

// 페이지 로드 시 쿠키 동의 확인
document.addEventListener('DOMContentLoaded', showCookieConsent);
</script>

<style>
.cookie-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #2c3e50;
    color: white;
    padding: 1rem;
    z-index: 1000;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
}

.cookie-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.cookie-buttons {
    display: flex;
    gap: 0.5rem;
}

.btn-accept, .btn-decline {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
}

.btn-accept {
    background: #27ae60;
    color: white;
}

.btn-decline {
    background: #e74c3c;
    color: white;
}

@media (max-width: 768px) {
    .cookie-content {
        flex-direction: column;
        text-align: center;
    }
}
</style>
```

### 2. 개인정보처리방침 페이지

**routes 추가** - app.js에:

```javascript
// 개인정보처리방침 페이지
app.get('/privacy-policy', (req, res) => {
    res.render('privacy-policy', {
        title: '개인정보처리방침 - GQ_AI'
    });
});
```

## 🚀 배포 환경별 설정

### 1. 개발/프로덕션 환경 분리

**환경변수 설정**:

```env
# 개발환경 (.env.development)
NODE_ENV=development
GA_MEASUREMENT_ID=G-DEV-XXXXXXXXXX
GA_DEBUG_MODE=true

# 프로덕션환경 (.env.production)
NODE_ENV=production
GA_MEASUREMENT_ID=G-PROD-XXXXXXXXXX
GA_DEBUG_MODE=false
```

### 2. Vercel 배포 환경변수

Vercel 대시보드에서 설정:

| 변수명 | 값 | 환경 |
|--------|-----|------|
| `GA_MEASUREMENT_ID` | `G-PROD-XXXXXXXXXX` | Production |
| `GA_MEASUREMENT_ID` | `G-DEV-XXXXXXXXXX` | Preview, Development |
| `NODE_ENV` | `production` | Production |
| `GA_DEBUG_MODE` | `false` | Production |
| `GA_DEBUG_MODE` | `true` | Preview, Development |

### 3. 조건부 로딩

**성능 최적화된 GA 로딩**:

```html
<script>
// 프로덕션 환경에서만 GA 로드
<% if (process.env.NODE_ENV === 'production' && process.env.GA_MEASUREMENT_ID) { %>
    // 즉시 로딩
    (function() {
        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=<%= process.env.GA_MEASUREMENT_ID %>';
        document.head.appendChild(script);
        
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '<%= process.env.GA_MEASUREMENT_ID %>');
    })();
<% } else { %>
    // 개발 환경에서는 GA 비활성화
    console.log('GA4 비활성화: 개발 환경');
    function gtag() {
        console.log('GA4 (dev):', arguments);
    }
<% } %>
</script>
```

## ⚡ 성능 최적화

### 1. 지연 로딩 구현

```html
<script>
// 페이지 로딩 완료 후 GA 스크립트 지연 로딩
window.addEventListener('load', function() {
    setTimeout(function() {
        // 사용자 인터랙션 감지 후 로딩
        let gaLoaded = false;
        
        function loadGA() {
            if (!gaLoaded && typeof gtag === 'undefined') {
                gaLoaded = true;
                
                const script = document.createElement('script');
                script.async = true;
                script.src = 'https://www.googletagmanager.com/gtag/js?id=<%= process.env.GA_MEASUREMENT_ID %>';
                document.head.appendChild(script);
                
                // GA 초기화
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '<%= process.env.GA_MEASUREMENT_ID %>');
            }
        }
        
        // 사용자 인터랙션 시 로딩
        ['mousedown', 'touchstart', 'scroll'].forEach(event => {
            document.addEventListener(event, loadGA, { once: true });
        });
        
        // 5초 후 자동 로딩 (fallback)
        setTimeout(loadGA, 5000);
    }, 1000);
});
</script>
```

### 2. 서비스 워커 캐싱

**public/sw.js (선택사항)**:

```javascript
// Google Analytics 스크립트 캐싱
const CACHE_NAME = 'gq-ai-analytics-v1';
const urlsToCache = [
    'https://www.googletagmanager.com/gtag/js'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});
```

## 📈 커스텀 차원 및 지표

### 1. 커스텀 차원 설정

GA4 관리자 > 사용자 지정 정의에서 추가:

| 차원명 | 범위 | 매개변수 이름 |
|--------|------|---------------|
| 강의 번호 | 이벤트 | lecture_number |
| 사용자 레벨 | 사용자 | user_level |
| 퀴즈 성과 | 이벤트 | quiz_performance |

### 2. 목표 및 전환 설정

**전환 이벤트 설정**:
- `quiz_complete` (퀴즈 완료)
- `form_submit` (문의 제출)
- `lecture_view` (강의 조회 - 조건부)

## 🔧 문제 해결

### 1. 일반적인 문제

**GA4가 데이터를 수집하지 않는 경우**:
1. 측정 ID가 올바른지 확인
2. 브라우저 광고 차단기 비활성화
3. 개발자 도구에서 네트워크 탭 확인
4. Real-time 보고서에서 즉시 확인

**이중 추적 방지**:
```javascript
// 한 번만 추적되도록 보장
let eventTracked = false;
function trackOnce(eventName, parameters) {
    if (!eventTracked && typeof gtag !== 'undefined') {
        eventTracked = true;
        gtag('event', eventName, parameters);
    }
}
```

### 2. 디버깅 도구

**개발 환경에서 디버깅**:

```html
<script>
<% if (process.env.NODE_ENV !== 'production') { %>
// GA 디버그 모드
gtag('config', '<%= process.env.GA_MEASUREMENT_ID %>', {
    debug_mode: true,
    send_page_view: false
});

// 커스텀 로깅
function debugGA(eventName, parameters) {
    console.group('🔍 GA4 Debug');
    console.log('Event:', eventName);
    console.log('Parameters:', parameters);
    console.log('Time:', new Date().toISOString());
    console.groupEnd();
    
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
}
<% } %>
</script>
```

## 📊 보고서 및 대시보드

### 1. 맞춤 보고서 생성

GA4에서 설정할 권장 보고서:
1. **강의별 인기도**: 강의 번호별 조회수
2. **사용자 학습 경로**: 강의 순서별 이동 패턴
3. **퀴즈 성과 분석**: 레벨별 완료율 및 점수
4. **전환 깔때기**: 방문 → 강의 조회 → 퀴즈 완료

### 2. Data Studio 연동 (선택사항)

구글 데이터 스튜디오를 통한 시각화:
1. GA4를 데이터 소스로 연결
2. Supabase 데이터와 결합 (API 연동)
3. 종합 대시보드 구성

## 🎯 다음 단계

1. **GA4 계정 생성 및 측정 ID 발급**
2. **환경변수 설정**
3. **기본 추적 코드 구현**
4. **이벤트 추적 단계별 적용**
5. **쿠키 동의 시스템 구현**
6. **성능 최적화 적용**
7. **보고서 설정 및 모니터링**

## 📞 지원 및 문의

- **Google Analytics 도움말**: [support.google.com/analytics](https://support.google.com/analytics)
- **GA4 설정 가이드**: [developers.google.com/analytics/devguides/collection/ga4](https://developers.google.com/analytics/devguides/collection/ga4)
- **프로젝트 관련 문의**: GitHub Issues

---

*마지막 업데이트: 2024년 12월*
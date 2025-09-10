# Supabase 방문자 통계 시스템 설정 가이드

## 📋 개요

이 가이드는 GQ_AI 프로젝트에 Supabase 기반 방문자 통계 시스템을 설정하는 방법을 설명합니다.

## 🚀 Supabase 프로젝트 설정

### 1. Supabase 계정 생성 및 프로젝트 생성
1. [Supabase](https://supabase.com/) 접속 후 계정 생성
2. "New Project" 클릭하여 새 프로젝트 생성
3. 프로젝트 이름: `gq-ai-visitor-stats` (또는 원하는 이름)
4. 데이터베이스 비밀번호 설정 (안전한 비밀번호 사용)
5. 지역 선택: `Northeast Asia (Seoul)` 권장

### 2. 데이터베이스 스키마 적용
1. Supabase 대시보드에서 "SQL Editor" 메뉴 선택
2. 프로젝트 루트의 `supabase-schema.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기 후 "RUN" 버튼 클릭
4. 실행 완료 후 "Tables" 메뉴에서 테이블 생성 확인:
   - `visitor_stats` 테이블
   - `visitor_ips` 테이블

### 3. API 키 및 URL 확인
1. Supabase 대시보드에서 "Settings" > "API" 메뉴 선택
2. 다음 정보 복사:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: `eyJ...` (긴 토큰)
   - **service_role key**: `eyJ...` (긴 토큰, 보안 주의)

## 🔧 환경변수 설정

### 로컬 개발 환경
`.env` 파일에 다음 환경변수 추가:

```env
# Supabase 설정
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Vercel 배포 환경
Vercel 대시보드에서 환경변수 설정:

1. Vercel 프로젝트 대시보드 접속
2. "Settings" > "Environment Variables" 메뉴 선택
3. 다음 환경변수 추가:

| 이름 | 값 | 환경 |
|------|-----|------|
| `SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `your_anon_key_here` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `your_service_role_key_here` | Production, Preview, Development |

## 🛡️ 보안 설정

### Row Level Security (RLS) 정책
스키마에 이미 기본 보안 정책이 포함되어 있습니다:

- **읽기 권한**: 모든 사용자가 방문자 통계 조회 가능
- **쓰기 권한**: 애플리케이션에서만 데이터 수정 가능
- **IP 정보**: 개인정보 보호를 위한 해시 처리

### 추가 보안 권장사항
1. **Service Role Key 보호**: 서버 환경변수로만 사용, 클라이언트 노출 금지
2. **API Rate Limiting**: Supabase 대시보드에서 API 요청 제한 설정
3. **정기적 키 재생성**: 보안을 위해 정기적으로 API 키 재생성

## 📊 데이터베이스 모니터링

### Supabase 대시보드 활용
1. **Database** > **Tables**: 실시간 데이터 확인
2. **Database** > **Functions**: RPC 함수 실행 로그 확인
3. **Settings** > **Database**: 연결 상태 및 성능 모니터링

### 유용한 SQL 쿼리

```sql
-- 일별 방문자 통계 조회
SELECT date, daily_count, total_count 
FROM visitor_stats 
ORDER BY date DESC 
LIMIT 30;

-- 오늘 방문자 현황
SELECT * FROM visitor_stats 
WHERE date = CURRENT_DATE;

-- 전체 통계 요약
SELECT 
    COUNT(*) as total_days,
    SUM(daily_count) as total_unique_visitors,
    AVG(daily_count) as avg_daily_visitors,
    MAX(daily_count) as max_daily_visitors
FROM visitor_stats;
```

## 🔄 마이그레이션 및 백업

### 기존 데이터 마이그레이션
앱 시작 시 자동으로 로컬 메모리 데이터를 Supabase로 마이그레이션합니다:

```javascript
// 수동 마이그레이션 (필요시)
SELECT migrate_local_data(1000, 50, CURRENT_DATE);
```

### 데이터 백업
```sql
-- 데이터 백업 (CSV 내보내기)
COPY visitor_stats TO '/tmp/visitor_stats_backup.csv' WITH CSV HEADER;
COPY visitor_ips TO '/tmp/visitor_ips_backup.csv' WITH CSV HEADER;
```

## ⚡ 성능 최적화

### 인덱스 확인
```sql
-- 인덱스 목록 확인
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename IN ('visitor_stats', 'visitor_ips');
```

### 데이터 정리 (30일 이전 IP 기록)
```sql
-- 수동 실행 또는 cron job 설정
SELECT cleanup_old_visitor_ips(30);
```

## 🚨 문제 해결

### 연결 오류
1. **환경변수 확인**: URL과 API 키가 정확한지 확인
2. **네트워크 상태**: Supabase 서비스 상태 확인
3. **로그 확인**: 애플리케이션 로그에서 상세 오류 메시지 확인

### 권한 오류
1. **RLS 정책**: 테이블의 Row Level Security 정책 확인
2. **API 키**: anon key vs service_role key 적절한 사용
3. **함수 권한**: RPC 함수 실행 권한 확인

### 성능 문제
1. **연결 풀**: Supabase 연결 풀 설정 확인
2. **쿼리 최적화**: 느린 쿼리 분석 및 인덱스 추가
3. **Fallback 활용**: KV나 로컬 메모리 fallback 활용

## 📈 모니터링 및 알림

### Supabase 대시보드 알림
1. "Settings" > "Alerts" 메뉴에서 알림 설정
2. 데이터베이스 사용량, API 요청 수 모니터링
3. 이상 트래픽 감지 시 알림

### 애플리케이션 로그 모니터링
```javascript
// 로그 레벨별 모니터링
console.log('✅ Supabase 연결 성공');
console.warn('⚠️ Supabase 연결 실패, fallback 사용');
console.error('❌ 모든 저장소 연결 실패');
```

## 🎯 다음 단계

1. **대시보드 구축**: 방문자 통계 시각화 대시보드 개발
2. **분석 확장**: 페이지별, 지역별 방문 분석 추가
3. **API 확장**: 방문자 통계 공개 API 개발
4. **알림 시스템**: 급격한 트래픽 변화 감지 및 알림

---

## 📞 지원

문제가 발생하거나 추가 지원이 필요한 경우:

1. **Supabase 문서**: [https://supabase.com/docs](https://supabase.com/docs)
2. **Supabase Discord**: 커뮤니티 지원
3. **프로젝트 이슈**: GitHub Issues 통해 문의

---

*마지막 업데이트: 2024년 12월*
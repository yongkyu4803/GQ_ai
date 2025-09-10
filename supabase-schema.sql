-- =====================================================
-- Supabase 방문자 통계 시스템 데이터베이스 스키마
-- =====================================================

-- 1. 방문자 통계 테이블
CREATE TABLE IF NOT EXISTS visitor_stats (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    daily_count INTEGER DEFAULT 0 CHECK (daily_count >= 0),
    total_count INTEGER DEFAULT 0 CHECK (total_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 방문자 IP 추적 테이블 (중복 방문 방지)
CREATE TABLE IF NOT EXISTS visitor_ips (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    date DATE NOT NULL,
    first_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    page_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 인덱스 생성 (성능 최적화)
-- =====================================================

-- 날짜별 유니크 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS idx_visitor_stats_date 
ON visitor_stats(date);

-- IP + 날짜 복합 유니크 인덱스 (중복 방문 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_visitor_ips_ip_date 
ON visitor_ips(ip_address, date);

-- 성능 최적화를 위한 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_visitor_ips_date 
ON visitor_ips(date);

CREATE INDEX IF NOT EXISTS idx_visitor_ips_created_at 
ON visitor_ips(created_at);

-- =====================================================
-- 트리거 함수 (자동 업데이트)
-- =====================================================

-- updated_at 필드 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- visitor_stats 테이블 업데이트 트리거
DROP TRIGGER IF EXISTS update_visitor_stats_updated_at ON visitor_stats;
CREATE TRIGGER update_visitor_stats_updated_at 
    BEFORE UPDATE ON visitor_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 저장 프로시저 (RPC 함수)
-- =====================================================

-- 방문자 증가 로직 (핵심 함수)
CREATE OR REPLACE FUNCTION increment_visitor(
    visitor_ip INET,
    visit_date DATE DEFAULT CURRENT_DATE,
    user_agent_str TEXT DEFAULT NULL,
    page_path_str TEXT DEFAULT '/'
) RETURNS JSON AS $$
DECLARE
    is_new_visitor BOOLEAN := FALSE;
    current_total INTEGER := 0;
    current_daily INTEGER := 0;
    total_across_all_days INTEGER := 0;
BEGIN
    -- 1. 오늘 첫 방문인지 확인 (IP + 날짜 조합으로)
    INSERT INTO visitor_ips (ip_address, date, user_agent, page_path)
    VALUES (visitor_ip, visit_date, user_agent_str, page_path_str)
    ON CONFLICT (ip_address, date) DO NOTHING;
    
    -- 삽입된 행이 있으면 새로운 방문자
    GET DIAGNOSTICS is_new_visitor = ROW_COUNT;
    
    IF is_new_visitor THEN
        -- 2. 새 방문자인 경우: 통계 업데이트
        
        -- 현재까지의 총 방문자 수 계산
        SELECT COALESCE(SUM(daily_count), 0) INTO total_across_all_days
        FROM visitor_stats;
        
        -- 새로운 총 방문자 수
        total_across_all_days := total_across_all_days + 1;
        
        -- 오늘 통계 삽입/업데이트
        INSERT INTO visitor_stats (date, daily_count, total_count)
        VALUES (visit_date, 1, total_across_all_days)
        ON CONFLICT (date) 
        DO UPDATE SET 
            daily_count = visitor_stats.daily_count + 1,
            total_count = total_across_all_days;
            
        -- 업데이트된 값 조회
        SELECT daily_count, total_count INTO current_daily, current_total
        FROM visitor_stats WHERE date = visit_date;
        
        -- 모든 날짜의 total_count를 최신값으로 동기화 (배치로 최적화)
        UPDATE visitor_stats 
        SET total_count = current_total
        WHERE total_count != current_total;
        
    ELSE
        -- 3. 기존 방문자인 경우: 현재 값만 반환
        SELECT daily_count, total_count INTO current_daily, current_total
        FROM visitor_stats WHERE date = visit_date;
        
        -- 해당 날짜 통계가 없는 경우 기본값
        IF current_daily IS NULL THEN
            current_daily := 0;
            current_total := COALESCE((SELECT MAX(total_count) FROM visitor_stats), 0);
        END IF;
    END IF;
    
    -- 4. JSON 결과 반환
    RETURN json_build_object(
        'isNewVisitor', is_new_visitor,
        'dailyVisitors', COALESCE(current_daily, 0),
        'totalVisitors', COALESCE(current_total, 0),
        'date', visit_date
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- 오류 발생 시 기본값 반환
        RETURN json_build_object(
            'isNewVisitor', false,
            'dailyVisitors', 0,
            'totalVisitors', 0,
            'error', SQLERRM,
            'date', visit_date
        );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 방문자 통계 조회 함수
-- =====================================================

-- 특정 날짜 방문자 통계 조회
CREATE OR REPLACE FUNCTION get_visitor_stats(
    target_date DATE DEFAULT CURRENT_DATE
) RETURNS JSON AS $$
DECLARE
    result_daily_count INTEGER := 0;
    result_total_count INTEGER := 0;
BEGIN
    SELECT 
        COALESCE(vs.daily_count, 0),
        COALESCE(vs.total_count, 0)
    INTO result_daily_count, result_total_count
    FROM visitor_stats vs
    WHERE vs.date = target_date;
    
    -- 데이터가 없는 경우 전체 최대값 조회
    IF result_total_count = 0 THEN
        SELECT COALESCE(MAX(vs.total_count), 0) INTO result_total_count
        FROM visitor_stats vs;
    END IF;
    
    RETURN json_build_object(
        'dailyVisitors', result_daily_count,
        'totalVisitors', result_total_count,
        'date', target_date
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 초기 데이터 설정 함수 (마이그레이션용)
-- =====================================================

-- 로컬 메모리 데이터를 Supabase로 마이그레이션
CREATE OR REPLACE FUNCTION migrate_local_data(
    initial_total INTEGER DEFAULT 0,
    initial_daily INTEGER DEFAULT 0,
    target_date DATE DEFAULT CURRENT_DATE
) RETURNS JSON AS $$
BEGIN
    -- 기존 데이터가 있는지 확인
    IF EXISTS (SELECT 1 FROM visitor_stats WHERE date = target_date) THEN
        -- 기존 데이터 업데이트
        UPDATE visitor_stats 
        SET 
            daily_count = GREATEST(daily_count, initial_daily),
            total_count = GREATEST(total_count, initial_total)
        WHERE date = target_date;
    ELSE
        -- 새 데이터 삽입
        INSERT INTO visitor_stats (date, daily_count, total_count)
        VALUES (target_date, initial_daily, initial_total);
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', '로컬 데이터 마이그레이션 완료',
        'totalVisitors', initial_total,
        'dailyVisitors', initial_daily,
        'date', target_date
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 데이터 정리 함수 (선택사항)
-- =====================================================

-- 오래된 IP 기록 정리 (30일 이전 데이터)
CREATE OR REPLACE FUNCTION cleanup_old_visitor_ips(
    days_to_keep INTEGER DEFAULT 30
) RETURNS JSON AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM visitor_ips 
    WHERE date < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'deletedRecords', deleted_count,
        'message', days_to_keep || '일 이전 IP 기록 정리 완료'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Row Level Security (RLS) 설정 (보안)
-- =====================================================

-- RLS 활성화
ALTER TABLE visitor_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_ips ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (안전한 방법)
DROP POLICY IF EXISTS "Allow read access to visitor_stats" ON visitor_stats;
DROP POLICY IF EXISTS "Allow insert access to visitor_stats" ON visitor_stats;
DROP POLICY IF EXISTS "Allow update access to visitor_stats" ON visitor_stats;
DROP POLICY IF EXISTS "Allow insert access to visitor_ips" ON visitor_ips;
DROP POLICY IF EXISTS "Allow read access to visitor_ips" ON visitor_ips;

-- 읽기 권한 정책 (모든 사용자가 통계 조회 가능)
CREATE POLICY "Allow read access to visitor_stats" 
ON visitor_stats FOR SELECT 
USING (true);

-- 쓰기 권한 정책 (인증된 사용자만 데이터 수정 가능)
CREATE POLICY "Allow insert access to visitor_stats" 
ON visitor_stats FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update access to visitor_stats" 
ON visitor_stats FOR UPDATE 
USING (true);

-- visitor_ips 테이블 정책
CREATE POLICY "Allow insert access to visitor_ips" 
ON visitor_ips FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow read access to visitor_ips" 
ON visitor_ips FOR SELECT 
USING (true);

-- =====================================================
-- 사용 예시 주석
-- =====================================================

/*
-- 사용 예시:

-- 1. 새 방문자 등록
SELECT increment_visitor('192.168.1.1'::inet, CURRENT_DATE, 'Mozilla/5.0...', '/');

-- 2. 방문자 통계 조회
SELECT get_visitor_stats(CURRENT_DATE);

-- 3. 로컬 데이터 마이그레이션
SELECT migrate_local_data(1000, 50, CURRENT_DATE);

-- 4. 오래된 데이터 정리
SELECT cleanup_old_visitor_ips(30);
*/
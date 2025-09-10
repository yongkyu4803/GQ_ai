-- 수정된 get_visitor_stats 함수 (컬럼명 충돌 해결)
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
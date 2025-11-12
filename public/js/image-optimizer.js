/**
 * 이미지 로딩 최적화 스크립트
 * - Lazy Loading
 * - Progressive Image Loading
 * - WebP 지원 감지
 */

(function() {
    'use strict';

    // Intersection Observer를 사용한 Lazy Loading
    function initLazyLoading() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;

                    // data-src 속성이 있으면 실제 이미지 로드
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                    }

                    // data-srcset 속성이 있으면 반응형 이미지 로드
                    if (img.dataset.srcset) {
                        img.srcset = img.dataset.srcset;
                    }

                    // 로딩 완료 후 클래스 추가
                    img.addEventListener('load', () => {
                        img.classList.add('loaded');
                        img.classList.remove('lazy');
                    });

                    // 관찰 중지
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px', // 뷰포트 50px 전에 로딩 시작
            threshold: 0.01
        });

        // lazy 클래스를 가진 모든 이미지 관찰
        document.querySelectorAll('img.lazy').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // WebP 지원 감지
    function checkWebPSupport() {
        const elem = document.createElement('canvas');

        if (elem.getContext && elem.getContext('2d')) {
            // WebP 지원 여부 확인
            const isSupported = elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;

            if (isSupported) {
                document.documentElement.classList.add('webp');
            } else {
                document.documentElement.classList.add('no-webp');
            }

            return isSupported;
        }

        return false;
    }

    // 저품질 이미지 플레이스홀더 (LQIP) 처리
    function initLQIP() {
        document.querySelectorAll('img[data-lqip]').forEach(img => {
            const lqip = img.dataset.lqip;
            const src = img.dataset.src || img.src;

            // 먼저 저품질 이미지 표시
            img.src = lqip;
            img.classList.add('lqip-loading');

            // 고품질 이미지 미리 로드
            const highQualityImg = new Image();
            highQualityImg.onload = function() {
                img.src = src;
                img.classList.remove('lqip-loading');
                img.classList.add('lqip-loaded');
            };
            highQualityImg.src = src;
        });
    }

    // 이미지 로딩 에러 처리
    function handleImageErrors() {
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('error', function() {
                // 플레이스홀더 이미지로 대체
                if (!this.dataset.errorHandled) {
                    this.dataset.errorHandled = 'true';
                    this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23eee" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E이미지를 불러올 수 없습니다%3C/text%3E%3C/svg%3E';
                    this.classList.add('image-error');
                }
            });
        });
    }

    // 네트워크 상태 감지 및 이미지 품질 조정
    function adjustImageQuality() {
        if ('connection' in navigator) {
            const connection = navigator.connection;

            // 느린 연결에서는 저품질 이미지 사용
            if (connection.effectiveType === 'slow-2g' ||
                connection.effectiveType === '2g' ||
                connection.saveData === true) {
                document.documentElement.classList.add('low-bandwidth');
            }
        }
    }

    // 초기화
    function init() {
        // DOM이 준비되면 실행
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                checkWebPSupport();
                adjustImageQuality();
                initLazyLoading();
                initLQIP();
                handleImageErrors();
            });
        } else {
            checkWebPSupport();
            adjustImageQuality();
            initLazyLoading();
            initLQIP();
            handleImageErrors();
        }
    }

    // 스크립트 실행
    init();

    // 동적으로 추가된 이미지에 대한 재초기화 함수 노출
    window.refreshImageOptimizer = function() {
        initLazyLoading();
        initLQIP();
        handleImageErrors();
    };

})();

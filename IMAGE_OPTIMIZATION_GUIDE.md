# 이미지 최적화 가이드

## 📊 현재 상태 분석

**이미지 폴더 크기**: 47MB
**큰 이미지 파일들**:
- `landing/genpro.png` - 1.8MB
- `landing/prompt-library-card.jpg` - 1.8MB
- `notebooklm.png` - 1.5MB
- `landing/prompt-library-card2.jpg` - 1.3MB
- `landing/newslens_logo_001.png` - 1.1MB
- `landing/ai-learning-card.jpg` - 1.0MB

---

## 🚀 구현된 최적화 기능

### 1. **Lazy Loading (지연 로딩)**
스크롤 시 필요한 이미지만 로드하여 초기 페이지 로드 시간을 단축합니다.

**사용 방법**:
```html
<!-- 기본 lazy loading -->
<img class="lazy" data-src="/images/example.jpg" alt="설명">

<!-- 반응형 이미지 + lazy loading -->
<img class="lazy"
     data-src="/images/example.jpg"
     data-srcset="/images/example-480.jpg 480w,
                  /images/example-768.jpg 768w,
                  /images/example-1200.jpg 1200w"
     sizes="(max-width: 768px) 100vw, 50vw"
     alt="설명">
```

### 2. **Progressive Loading (LQIP)**
저화질 이미지를 먼저 표시한 후 고화질 이미지로 전환합니다.

**사용 방법**:
```html
<img data-lqip="/images/example-small.jpg"
     data-src="/images/example.jpg"
     alt="설명">
```

### 3. **WebP 지원 감지**
WebP를 지원하는 브라우저에서는 WebP 이미지를 사용합니다.

```html
<picture>
  <source srcset="/images/example.webp" type="image/webp" class="webp-only">
  <img src="/images/example.jpg" alt="설명" class="no-webp-only">
</picture>
```

### 4. **반응형 이미지**
디바이스 크기에 맞는 이미지를 제공합니다.

```html
<img src="/images/example-small.jpg"
     srcset="/images/example-small.jpg 480w,
             /images/example-medium.jpg 768w,
             /images/example-large.jpg 1200w"
     sizes="(max-width: 768px) 100vw, 50vw"
     alt="설명">
```

---

## 🛠️ 이미지 압축 방법

### 방법 1: 온라인 도구 (가장 쉬움)

#### TinyPNG / TinyJPG
- **웹사이트**: https://tinypng.com
- **장점**: 무료, 품질 저하 거의 없음
- **압축률**: 50-80%
- **사용법**:
  1. 사이트 접속
  2. 이미지 드래그 앤 드롭
  3. 압축된 이미지 다운로드

#### Squoosh (Google)
- **웹사이트**: https://squoosh.app
- **장점**: WebP 변환 가능, 압축 비교 가능
- **사용법**:
  1. 사이트 접속
  2. 이미지 업로드
  3. 압축 설정 조정
  4. 다운로드

#### ImageOptim (Mac 전용)
- **웹사이트**: https://imageoptim.com
- **장점**: 일괄 처리 가능, 무손실 압축
- **사용법**:
  1. 앱 다운로드 및 설치
  2. 이미지 폴더를 앱에 드래그
  3. 자동 압축

### 방법 2: 커맨드 라인 도구

#### Sharp (Node.js)
프로젝트에 이미 있는 경우 다음 스크립트를 사용할 수 있습니다:

```bash
npm install sharp --save-dev
```

**압축 스크립트** (`scripts/compress-images.js`):
```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './public/images';
const outputDir = './public/images/optimized';

// 디렉토리 생성
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 이미지 처리
async function optimizeImage(inputPath, filename) {
  const ext = path.extname(filename).toLowerCase();
  const name = path.basename(filename, ext);

  try {
    if (ext === '.jpg' || ext === '.jpeg') {
      // JPEG 최적화
      await sharp(inputPath)
        .jpeg({ quality: 80, progressive: true })
        .toFile(path.join(outputDir, filename));

      // WebP 변환
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(path.join(outputDir, `${name}.webp`));

    } else if (ext === '.png') {
      // PNG 최적화
      await sharp(inputPath)
        .png({ quality: 80, compressionLevel: 9 })
        .toFile(path.join(outputDir, filename));

      // WebP 변환
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(path.join(outputDir, `${name}.webp`));
    }

    console.log(`✅ ${filename} 최적화 완료`);
  } catch (error) {
    console.error(`❌ ${filename} 처리 실패:`, error.message);
  }
}

// 모든 이미지 처리
async function processAllImages() {
  const files = fs.readdirSync(inputDir);

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && /\.(jpg|jpeg|png)$/i.test(file)) {
      await optimizeImage(filePath, file);
    }
  }

  console.log('🎉 모든 이미지 최적화 완료!');
}

processAllImages();
```

**실행 방법**:
```bash
node scripts/compress-images.js
```

---

## 📏 권장 이미지 크기

### 파일 크기 목표
- **Hero 이미지**: < 200KB
- **카드 썸네일**: < 100KB
- **아이콘**: < 50KB
- **배경 이미지**: < 300KB

### 해상도 가이드
| 용도 | 해상도 | 비율 |
|------|--------|------|
| Hero 이미지 | 1920x1080 | 16:9 |
| 카드 썸네일 | 800x600 | 4:3 |
| 로고 | 400x400 | 1:1 |
| 배경 | 1920x1080 | 16:9 |

### 품질 설정
- **JPEG**: 품질 80-85% (일반적으로 최적)
- **PNG**: 압축 레벨 9 (최대 압축)
- **WebP**: 품질 80-85%

---

## 🎯 최적화 우선순위

### 즉시 압축 권장 (1MB 이상)
```bash
1. public/images/landing/genpro.png (1.8MB)
2. public/images/landing/prompt-library-card.jpg (1.8MB)
3. public/images/notebooklm.png (1.5MB)
4. public/images/landing/prompt-library-card2.jpg (1.3MB)
5. public/images/landing/newslens_logo_001.png (1.1MB)
6. public/images/landing/ai-learning-card.jpg (1.0MB)
```

**예상 효과**:
- 압축 전: ~9.5MB
- 압축 후: ~1.9MB (80% 감소)
- 로딩 시간: 3-4초 → 0.5-1초 (3G 기준)

---

## ✅ 체크리스트

### 이미지 추가 시
- [ ] 이미지 크기가 적절한가? (위 가이드 참조)
- [ ] 필요한 경우 WebP 버전도 생성했는가?
- [ ] Lazy loading 클래스를 추가했는가?
- [ ] Alt 텍스트를 작성했는가?
- [ ] 반응형 이미지가 필요한 경우 srcset을 추가했는가?

### 정기 점검
- [ ] 1MB 이상의 이미지가 있는가?
- [ ] 사용하지 않는 이미지가 있는가?
- [ ] 중복된 이미지가 있는가?
- [ ] WebP 변환이 가능한 이미지가 있는가?

---

## 📊 성능 측정

### 측정 도구
1. **Google PageSpeed Insights**: https://pagespeed.web.dev
2. **GTmetrix**: https://gtmetrix.com
3. **WebPageTest**: https://www.webpagetest.org

### 목표 지표
- **LCP (Largest Contentful Paint)**: < 2.5초
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **이미지 로딩 시간**: < 3초 (3G 기준)

---

## 🔧 추가 최적화 팁

### 1. CDN 사용
이미지를 CDN에 호스팅하여 전송 속도를 높입니다.
- Cloudflare Images
- AWS CloudFront
- Vercel Image Optimization

### 2. 이미지 포맷 선택
- **사진**: JPEG, WebP
- **투명 배경**: PNG, WebP
- **벡터 그래픽**: SVG
- **애니메이션**: GIF → WebP/MP4

### 3. 반응형 이미지 자동화
```javascript
// Next.js 예시 (참고용)
import Image from 'next/image'

<Image
  src="/images/example.jpg"
  width={800}
  height={600}
  loading="lazy"
  alt="설명"
/>
```

---

## 📞 문제 해결

### 이미지가 표시되지 않을 때
1. 브라우저 콘솔에서 에러 확인
2. 파일 경로가 올바른지 확인
3. `image-optimizer.js`가 로드되었는지 확인

### Lazy loading이 작동하지 않을 때
1. `lazy` 클래스가 추가되었는지 확인
2. `data-src` 속성이 올바른지 확인
3. JavaScript가 활성화되어 있는지 확인

---

## 🎓 학습 자료

- [Web.dev 이미지 최적화 가이드](https://web.dev/fast/#optimize-your-images)
- [MDN: Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Google Lighthouse 성능 최적화](https://developers.google.com/web/tools/lighthouse)

---

**최종 업데이트**: 2025년 1월

#!/usr/bin/env node

/**
 * 이미지 압축 및 최적화 스크립트
 * - JPEG/PNG 압축
 * - WebP 변환
 * - 반응형 이미지 생성 (480w, 768w, 1200w)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 설정
const config = {
  inputDir: './public/images',
  outputDir: './public/images/optimized',
  backupDir: './public/images/backup',

  // 압축 설정
  jpeg: {
    quality: 82,
    progressive: true,
    mozjpeg: true
  },
  png: {
    quality: 85,
    compressionLevel: 9,
    progressive: true
  },
  webp: {
    quality: 82,
    effort: 6
  },

  // 반응형 이미지 크기
  sizes: [
    { width: 480, suffix: '-480w' },
    { width: 768, suffix: '-768w' },
    { width: 1200, suffix: '-1200w' }
  ],

  // 최소 압축 대상 크기 (bytes)
  minFileSize: 50 * 1024 // 50KB 이상만 압축
};

// 통계 변수
const stats = {
  processed: 0,
  errors: 0,
  originalSize: 0,
  compressedSize: 0,
  files: []
};

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 디렉토리 생성
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 원본 파일 백업
 */
function backupFile(inputPath, filename) {
  const backupPath = path.join(config.backupDir, filename);
  const backupDirPath = path.dirname(backupPath);

  ensureDir(backupDirPath);

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(inputPath, backupPath);
    console.log(`💾 백업: ${filename}`);
  }
}

/**
 * 이미지 최적화 및 변환
 */
async function optimizeImage(inputPath, filename, relativePath = '') {
  const ext = path.extname(filename).toLowerCase();
  const name = path.basename(filename, ext);
  const fileSize = fs.statSync(inputPath).size;

  // 최소 크기 체크
  if (fileSize < config.minFileSize) {
    console.log(`⏭️  건너뜀 (${formatBytes(fileSize)}): ${filename}`);
    return;
  }

  // 백업 생성
  backupFile(inputPath, path.join(relativePath, filename));

  // 출력 디렉토리 생성
  const outputSubDir = path.join(config.outputDir, relativePath);
  ensureDir(outputSubDir);

  try {
    const originalSize = fileSize;
    let compressedSize = 0;

    console.log(`\n🔄 처리 중: ${filename} (${formatBytes(originalSize)})`);

    // 이미지 메타데이터 가져오기
    const metadata = await sharp(inputPath).metadata();
    const originalWidth = metadata.width;

    if (ext === '.jpg' || ext === '.jpeg') {
      // JPEG 최적화
      const outputPath = path.join(outputSubDir, filename);
      await sharp(inputPath)
        .jpeg(config.jpeg)
        .toFile(outputPath);

      compressedSize = fs.statSync(outputPath).size;

      // WebP 변환
      const webpPath = path.join(outputSubDir, `${name}.webp`);
      await sharp(inputPath)
        .webp(config.webp)
        .toFile(webpPath);

      const webpSize = fs.statSync(webpPath).size;

      console.log(`  ✅ JPEG: ${formatBytes(compressedSize)} (${Math.round((1 - compressedSize / originalSize) * 100)}% 감소)`);
      console.log(`  ✅ WebP: ${formatBytes(webpSize)} (${Math.round((1 - webpSize / originalSize) * 100)}% 감소)`);

    } else if (ext === '.png') {
      // PNG 최적화
      const outputPath = path.join(outputSubDir, filename);
      await sharp(inputPath)
        .png(config.png)
        .toFile(outputPath);

      compressedSize = fs.statSync(outputPath).size;

      // WebP 변환
      const webpPath = path.join(outputSubDir, `${name}.webp`);
      await sharp(inputPath)
        .webp(config.webp)
        .toFile(webpPath);

      const webpSize = fs.statSync(webpPath).size;

      console.log(`  ✅ PNG: ${formatBytes(compressedSize)} (${Math.round((1 - compressedSize / originalSize) * 100)}% 감소)`);
      console.log(`  ✅ WebP: ${formatBytes(webpSize)} (${Math.round((1 - webpSize / originalSize) * 100)}% 감소)`);

    } else {
      console.log(`  ⏭️  지원하지 않는 형식: ${ext}`);
      return;
    }

    // 반응형 이미지 생성 (원본보다 작은 크기만)
    for (const size of config.sizes) {
      if (originalWidth > size.width) {
        const responsiveName = `${name}${size.suffix}${ext}`;
        const responsivePath = path.join(outputSubDir, responsiveName);

        await sharp(inputPath)
          .resize(size.width, null, { withoutEnlargement: true })
          [ext === '.png' ? 'png' : 'jpeg'](ext === '.png' ? config.png : config.jpeg)
          .toFile(responsivePath);

        const responsiveSize = fs.statSync(responsivePath).size;
        console.log(`  📱 ${size.width}w: ${formatBytes(responsiveSize)}`);
      }
    }

    // 통계 업데이트
    stats.processed++;
    stats.originalSize += originalSize;
    stats.compressedSize += compressedSize;
    stats.files.push({
      name: filename,
      original: originalSize,
      compressed: compressedSize,
      reduction: Math.round((1 - compressedSize / originalSize) * 100)
    });

  } catch (error) {
    console.error(`  ❌ 처리 실패: ${error.message}`);
    stats.errors++;
  }
}

/**
 * 디렉토리 재귀 탐색
 */
async function processDirectory(dir, relativePath = '') {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 백업/최적화 폴더는 제외
      if (file !== 'backup' && file !== 'optimized') {
        await processDirectory(filePath, path.join(relativePath, file));
      }
    } else if (stat.isFile() && /\.(jpg|jpeg|png)$/i.test(file)) {
      await optimizeImage(filePath, file, relativePath);
    }
  }
}

/**
 * 통계 출력
 */
function printStats() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 압축 완료 통계');
  console.log('='.repeat(60));
  console.log(`처리된 파일: ${stats.processed}개`);
  console.log(`에러: ${stats.errors}개`);
  console.log(`원본 크기: ${formatBytes(stats.originalSize)}`);
  console.log(`압축 후 크기: ${formatBytes(stats.compressedSize)}`);
  console.log(`절감된 용량: ${formatBytes(stats.originalSize - stats.compressedSize)}`);
  console.log(`압축률: ${Math.round((1 - stats.compressedSize / stats.originalSize) * 100)}%`);
  console.log('='.repeat(60));

  // 가장 많이 압축된 파일 Top 5
  const topReductions = stats.files
    .sort((a, b) => (b.original - b.compressed) - (a.original - a.compressed))
    .slice(0, 5);

  if (topReductions.length > 0) {
    console.log('\n🏆 가장 많이 압축된 파일 Top 5:');
    topReductions.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name}`);
      console.log(`     ${formatBytes(file.original)} → ${formatBytes(file.compressed)} (${file.reduction}% 감소)`);
    });
  }

  console.log('\n✅ 모든 이미지 최적화 완료!');
  console.log(`📁 최적화된 이미지: ${config.outputDir}`);
  console.log(`💾 백업 파일: ${config.backupDir}`);
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 이미지 압축 시작...\n');

  // 디렉토리 생성
  ensureDir(config.outputDir);
  ensureDir(config.backupDir);

  // 이미지 처리
  await processDirectory(config.inputDir);

  // 통계 출력
  printStats();
}

// 스크립트 실행
main().catch(error => {
  console.error('❌ 치명적 오류:', error);
  process.exit(1);
});

# 바이브코딩 사이드프로젝트: 개발환경 설정 가이드

> 대상: 완전 초보 ~ 초중급 / OS: **Windows 10/11** 또는 **macOS**
> 목표: VS Code, Node.js, GitHub, Vercel **계정·도구 세팅**을 1시간 내 끝내기

---

## 0) 준비 체크리스트 (5분)

* ✅ 개인 이메일(구글 권장) 준비
* ✅ 관리자 권한(회사 PC라면 보안 정책 확인)
* ✅ 브라우저: Chrome/Edge/Safari 최신 버전

---

## 1) VS Code 설치 (10분)

### A. Windows

1. 다운로드: [https://code.visualstudio.com/](https://code.visualstudio.com/) → **Download for Windows**
2. 설치 실행 → 모든 기본값으로 Next
3. 옵션 권장 체크
4. 실행: 시작 메뉴 → **Visual Studio Code**

### B. macOS

1. 다운로드: [https://code.visualstudio.com/](https://code.visualstudio.com/) → **Download for macOS (Apple Silicon/Intel 확인)**
2. 압축 해제 후 **Visual Studio Code.app**를 **Applications** 폴더로 드래그
3. 실행: Launchpad → **Visual Studio Code**

### C. 한국어 UI 설정 (선택)

* VS Code 좌측 Activity Bar → **Extensions(확장)** → `Korean Language Pack` 설치

### D. 필수 확장(Extension)

* **ESLint** (코드 품질)
* **Prettier** (코드 포맷)
* **GitHub Pull Requests and Issues**
* **GitLens** (Git 히스토리 가시화)

### E. 터미널 열기 & 버전 확인

* VS Code → **Terminal > New Terminal**

```bash
node -v   # 아직 미설치면 에러가 정상
npm -v
code -v
```

---

### F. 터미널/파워셸 실행법 (Windows & macOS)

> 초보자용 빠른 실행 가이드 — **어디서 열고, 무엇을 치고, 문제가 생기면 어떻게 확인하는지**

#### 1) 어디서 실행하나요?

* **VS Code 내부(권장)**: `Ctrl` + `` ` `` (백틱) → 현재 폴더 기준으로 터미널이 열립니다.

  * VS Code 상단 **Terminal > New Terminal** → **Default Profile**에서 기본 셸 선택(Windows는 *PowerShell* 권장, macOS는 *zsh* 기본).
* **독립 실행**

  * **Windows**: `Win + X` → *Windows Terminal* 또는 검색창에 *PowerShell* 입력 → (필요 시) **관리자 권한으로 실행**.
  * **macOS**: `Cmd + Space` → *Terminal* 검색(또는 *iTerm2*) → 실행.

#### 2) 기본 프롬프트 모양

* **PowerShell**: `PS C:\Users\...>`  / **zsh/bash**: `$`  / **명령 프롬프트(cmd)**: `C:\>`
  (예시 문서에서는 `$` 또는 `PS>` 표기로 명령행을 안내합니다.)

#### 3) 자주 쓰는 기본 명령

* 현재 위치 보기: `pwd` (Win PowerShell/macOS 공통)
* 목록 보기: `ls` (PowerShell/macOS), `dir` (cmd)
* 이동: `cd <폴더>`

  * 예) **Windows**: `cd %USERPROFILE%\Projects\vibe-sideproject`
  * 예) **macOS**: `cd ~/Projects/vibe-sideproject`
* 폴더/파일: `mkdir <폴더>`, `touch <파일>`, `rm -rf <폴더>`(주의), `del`(Win)
* 현재 폴더를 VS Code로 열기: `code .`
* 화면 지우기: `clear`(macOS/PowerShell), `cls`(cmd)

#### 4) Node/패키지 실행 예시

```bash
node app.js                 # Node 스크립트 실행
npx create-next-app@latest  # Next.js 앱 생성
npm run dev                 # package.json의 dev 스크립트 실행 (또는 yarn dev / pnpm dev)
```

#### 5) 환경변수/경로 확인

* **Windows(PowerShell)**: `$Env:Path`
* **macOS(zsh)**: `echo $PATH`
* 특정 실행 파일 위치: **Windows** `where node`, **macOS** `which node`

#### 6) 포트가 이미 사용 중일 때 (예: 3000)

* **macOS**

```bash
lsof -i :3000
kill -9 <PID>
```

* **Windows (PowerShell/cmd)**

```powershell
netstat -ano | findstr :3000
# 출력 마지막 열(PID)을 확인한 뒤
TaskKill /PID <PID> /F
```

#### 7) PowerShell 전용 팁(Windows)

* 스크립트 실행 정책(필요 시):

```powershell
Get-ExecutionPolicy -List
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

* 사용자 프로필 스크립트 편집(별칭, 프롬프트 설정 등):

```powershell
notepad $PROFILE  # 파일이 없으면 아래로 생성
New-Item -Type File -Path $PROFILE -Force
```

#### 8) zsh 기본 팁(macOS)

* 쉘 설정 파일: `~/.zshrc`  (열기: `open -e ~/.zshrc`)
* 실행 권한 오류 시: `chmod +x script.sh`
* Homebrew 경로 초기화(필요 시):

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
source ~/.zprofile
```

> ⚠️ **주의**: `rm -rf` 같은 명령은 되돌릴 수 없습니다. 항상 경로를 다시 확인해 주세요.

## 2) Node.js 설치 (권장: nvm 사용) (15~20분)

> 이유: 프로젝트별로 Node 버전이 달라 충돌이 잦음. **nvm**으로 버전 간편 전환.

**공식 홈페이지:** [https://nodejs.org](https://nodejs.org) — LTS(장기지원) 버전 다운로드 권장

### A. Windows (nvm-windows)

1. GitHub 릴리스: [https://github.com/coreybutler/nvm-windows/releases](https://github.com/coreybutler/nvm-windows/releases) → `nvm-setup.exe` 설치
2. 설치 중 Node 경로는 기본값 유지 권장(C:\Program Files\nodejs 등 자동 설정)
3. 터미널 재실행 후:

```powershell
nvm version
nvm list available   # 설치 가능한 버전 목록
nvm install 20.16.0  # LTS 권장(예시)
nvm use 20.16.0
node -v              # v20.16.0
npm -v
```

### B. macOS (nvm)

1. Homebrew 설치(미설치 시): [https://brew.sh](https://brew.sh)
2. nvm 설치

```bash
brew install nvm
mkdir -p ~/.nvm
# 쉘 초기화 파일에 nvm 설정 추가 (zsh 기준)
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
source ~/.zshrc
nvm --version
```

3. Node 설치

```bash
nvm ls-remote | tail -n 20        # 최신 LTS 확인
nvm install 20.16.0
nvm use 20.16.0
node -v
npm -v
```

### C. (대안) 직접 설치

* **공식 홈페이지:** [https://nodejs.org](https://nodejs.org) → **LTS** 인스톨러 다운로드 → 설치 → `node -v` 확인

### D. 자주 겪는 문제

* **PATH 충돌**: 과거에 설치한 Node가 남아 `where node`(Win) / `which node`(mac)로 위치 확인, 오래된 경로 제거
* **권한 에러**: macOS에서 `zsh: permission denied` → 실행 권한/보안 설정 확인

---

## 3) GitHub 계정 만들기 & 기본 설정 (10~15분)

### A. 계정 생성

1. [https://github.com](https://github.com) → **Sign up**
2. 이메일 인증 → 사용자명 설정 → **Free 플랜**으로 시작해도 충분
3. **2단계 인증(2FA)** 활성화 권장: Settings → Password and authentication → Two-factor authentication

### B. 로컬 Git 설치 확인

* Windows: Git for Windows 설치([https://git-scm.com/download/win](https://git-scm.com/download/win))
* macOS: `xcode-select --install` 또는 Homebrew `brew install git`

```bash
git --version
```

### C. SSH 키 생성 & GitHub 연결 (권장)

```bash
# 이메일은 GitHub에 등록한 이메일
ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/id_ed25519 -N ""
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub  # 출력값 복사
```

* GitHub → Settings → **SSH and GPG keys** → New SSH key → 붙여넣기 저장
* 연결 테스트

```bash
ssh -T git@github.com   # "Hi <username>! You've successfully authenticated..." 나오면 성공
```

### D. 사용자 정보 설정

```bash
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"
```

### E. 첫 저장소 만들기 & 푸시

1. GitHub → **New repository** → 이름 `vibe-sideproject` → Public/Private 선택 → **Create**
2. 로컬에서 초기화

```bash
mkdir vibe-sideproject && cd $_
echo "# Vibe Coding Side Project" > README.md
git init
git add .
git commit -m "chore: init"
git branch -M main
git remote add origin git@github.com:<username>/vibe-sideproject.git
git push -u origin main
```

---

## 4) Vercel 계정 만들기 & GitHub 연결 (10~15분)

### A. 계정 생성

1. [https://vercel.com](https://vercel.com) → **Sign Up** → **Continue with GitHub** (연동 허용)
2. 대시보드 진입 후 **Hobby(Free)** 플랜으로 시작 가능

### B. 첫 배포(Deploy) – 템플릿로 시작

1. Vercel 대시보드 → **New Project** → **Import Git Repository**
2. `vibe-sideproject` 선택 → Framework **Other**(또는 Next.js 등 자동 인식)
3. 빌드 설정(기본값 OK) → **Deploy**
4. 수 초~수 분 내 **프로덕션 URL** 발급 → 클릭해 접속 확인

### C. 로컬 개발 → 배포 흐름

```bash
# 예: Next.js 템플릿으로 시작
yarn create next-app my-app --typescript  # 또는 npx create-next-app@latest
cd my-app
git init && git add . && git commit -m "feat: bootstrap"
git remote add origin git@github.com:<username>/my-app.git
git push -u origin main
# Vercel에서 Import Git Repository → my-app 선택 → Deploy
```

* 이후 **main 브랜치에 푸시할 때마다 자동 배포**

### D. 환경변수(ENV) 설정

* Vercel 프로젝트 → **Settings > Environment Variables** → `NEXT_PUBLIC_...`/`SECRET_...` 추가
* 로컬은 `.env.local` 파일로 관리 (Git에 올리지 않기)

---

## 5) 빠른 점검(5분) — 모두 잘 되었는가?

* [ ] VS Code 설치 및 실행, 한국어 팩/필수 확장(ESLint·Prettier·GitLens) 설치 완료
* [ ] 터미널/파워셸을 **VS Code에서 `Ctrl`+```로 열 수 있음**
* [ ] `node -v` / `npm -v`가 정상 출력됨 (LTS 버전)
* [ ] Git 설치 및 `git --version` 확인, `git config --global`로 사용자 정보 설정 완료
* [ ] SSH 키 생성 후 GitHub에 등록, `ssh -T git@github.com` 성공 메시지 확인
* [ ] GitHub 저장소 `vibe-sideproject` 생성 및 README 첫 푸시 완료
* [ ] Vercel에서 GitHub 연동 후 첫 Deploy 완료, 발급된 URL 접속 가능

---

## 6) 트러블슈팅 FAQ

**Q1. nvm으로 설치했는데 ****`node`****가 인식되지 않아요.**

* Windows: 새 터미널/PC 재부팅, `nvm use <버전>` 재실행, `where node`로 경로 충돌 확인
* macOS: `source ~/.zshrc`, `which node`로 경로 확인, iTerm2/터미널 재시작

**Q2. GitHub SSH 인증이 실패해요.**

* 공개키(`.pub`)를 붙여넣었는지 확인, `ssh-agent` 실행 여부 확인, 방화벽/회사망 정책 확인

**Q3. Vercel 빌드 실패**

* Node 버전 불일치 → `engines` 필드 설정 또는 Vercel Project Settings에서 버전 지정
* 환경변수 누락 → Vercel **Environment Variables** 확인

---

## 7) 다음 단계(추천)

* Prettier/ESLint 팀 규칙 정리 → 저장 시 자동 포맷(On Save)
* Git Branch 전략(main/dev/feature-*)과 커밋 컨벤션(Conventional Commits) 도입
* 이슈/프로젝트 보드(GitHub Projects)로 할 일 관리
* Vercel Preview Deploy로 PR마다 미리보기 URL 확인

---

### 부록: 최소 한 번에 끝내는 명령 요약

```bash
# (공통) 버전 확인
node -v && npm -v && git --version

# (처음 저장소 생성/푸시)
mkdir vibe-sideproject && cd $_ && echo "# Vibe" > README.md \
&& git init && git add . && git commit -m "chore: init" \
&& git branch -M main \
&& git remote add origin git@github.com:<username>/vibe-sideproject.git \
&& git push -u origin main
```

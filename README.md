## 기술 스택

### 런타임 환경

- Node.js: >= 18.0.0
- npm: >= 9.0.0

### 프론트엔드

- JavaScript (ES6+): 메인 개발 언어
- TypeScript: ^5.9.3 - 타입 정의 및 타입 안전성
- HTML5 & CSS3: UI 마크업 및 스타일링

### 브라우저 확장 프로그램

- Chrome Extension Manifest V3: 확장 프로그램 프레임워크
- Chrome APIs:
  - Side Panel API
  - Storage API
  - Tabs API
  - Scripting API
  - Content Scripts
  - Service Worker (Background)

## 시스템 요구사항

### 필수 요구사항

- Node.js 18.0.0 이상
- npm 9.0.0 이상
- Chrome 또는 Chromium 기반 브라우저 (최신 버전 권장)

## 프로젝트 설정 및 실행

### 1. 저장소 클론

git clone https://github.com/iuryeong/Widget.git
cd Widget

### 2. 의존성 설치

npm install

### 3. Chrome에 확장 프로그램 로드

1. Chrome 브라우저 열기
2. 주소창에 `chrome://extensions/` 입력
3. 우측 상단 "개발자 모드" 토글 활성화
4. "압축해제된 확장 프로그램을 로드합니다" 클릭
5. `Widget/output/dist` 폴더 선택

### 4. 확장 프로그램 사용

1. Chrome 툴바에서 확장 프로그램 아이콘 클릭
2. 사이드 패널이 열리면서 위젯 인터페이스 표시
3. 필요한 기능 설정 및 사용

## 구조

output/
├── public/
│ ├── manifest.json
│ ├── sidebar.js
│ ├── style.css
│ ├── icon-16.png
│ ├── icon-48.png
│ ├── icon-128.png
│ └── icons/
│
├── src/
│ ├── pages/
│ │ ├── sidebar.html
│ │ ├── sidebar.js
│ │ └── sidebarbackup.js
│ │
│ ├── api/
│ │ └── notifications.js
│ │
│ ├── storage/
│ │ └── storage.js
│ │
│ ├── styles/
│ │ └── sidebar.css
│ │
│ ├── types/
│ │ └── index.ts
│ │
│ ├── utils/
│ │ └── helpers.ts
│ │
│ ├── content-script.js
│ └── service-worker.js
│
├── dist/
│ ├── manifest.json
│ ├── sidebar.js
│ ├── background.js
│ ├── main.js
│ ├── index.html
│ ├── style.css
│ ├── notifications.js
│ └── rules.json
│
├── node_modules/
├── package.json
├── package-lock.json
├── .gitignore
├── README.md
└── STRUCTURE.md

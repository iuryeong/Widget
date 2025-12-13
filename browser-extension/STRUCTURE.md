# Widget - Browser Side Panel Extension

브라우저 좌·우·상·하 측면에 위젯, 웹앱, 미니 플레이어, 북마크 등을 고정하여 탭 이동 없이 필요한 정보와 도구에 즉시 접근할 수 있도록 하는 크롬 확장 프로그램입니다.

## 📁 프로젝트 구조

```
browser-extension/
├── public/
│   ├── manifest.json           # Chrome Extension 설정 파일 (Manifest V3)
│   ├── icons/                  # 확장 프로그램 아이콘 (16px, 48px, 128px)
│   └── index.html              # (선택) 옵션 페이지
│
├── src/
│   ├── pages/                  # 확장 프로그램 UI 페이지
│   │   ├── sidebar.html        # 사이드바 메인 페이지
│   │   └── sidebar.js          # 사이드바 로직 및 초기화
│   │
│   ├── components/             # React/UI 컴포넌트 (향후 확장용)
│   │   ├── Widget.tsx          # 위젯 컴포넌트
│   │   ├── MiniPlayer.tsx      # 미니 플레이어 컴포넌트
│   │   ├── NotificationCenter.tsx  # 알림 센터 컴포넌트
│   │   ├── BookmarkManager.tsx     # 북마크 관리 컴포넌트
│   │   ├── WebAppEmbed.tsx         # 웹앱 임베딩 컴포넌트
│   │   ├── FunWidget.tsx           # Fun 위젯 컴포넌트
│   │   └── GlobalMediaWidget.tsx   # 글로벌 미디어 제어 컴포넌트
│   │
│   ├── hooks/                  # React 커스텀 훅 (향후 확장용)
│   │   ├── useSettings.ts      # 설정 상태 관리
│   │   ├── useNotifications.ts # 알림 상태 관리
│   │   ├── useMediaControl.ts  # 미디어 제어 훅
│   │   └── useBookmarks.ts     # 북마크 상태 관리
│   │
│   ├── utils/                  # 유틸리티 함수
│   │   ├── helpers.ts          # 일반 헬퍼 함수 (포맷팅, ID 생성 등)
│   │   ├── storage.ts          # 로컬 스토리지 관리
│   │   └── logger.ts           # 로깅 유틸리티
│   │
│   ├── api/                    # 외부 API 통합
│   │   ├── notifications.ts    # Gmail, GitHub API 래퍼
│   │   └── widgets.ts          # 위젯 API (날씨, 주식, GIF 등)
│   │
│   ├── types/                  # TypeScript 타입 정의
│   │   └── index.ts            # 모든 타입 정의 (Widget, Notification, Bookmark 등)
│   │
│   ├── storage/                # 로컬 데이터 저장소 관리
│   │   └── storage.ts          # Chrome Storage API 래퍼
│   │
│   ├── styles/                 # CSS 스타일
│   │   ├── sidebar.css         # 사이드바 메인 스타일
│   │   ├── widgets.css         # 위젯 스타일
│   │   ├── variables.css       # CSS 변수 (색상, 크기 등)
│   │   └── responsive.css      # 반응형 디자인
│   │
│   ├── content-script.js       # Content Script (페이지에 주입되는 스크립트)
│   │                           # - 비디오 요소 감지
│   │                           # - 미디어 세션 API 감지
│   │                           # - 페이지 메타데이터 추출
│   │
│   └── service-worker.js       # Service Worker (백그라운드 작업)
│                               # - 알림 동기화
│                               # - 미디어 제어
│                               # - 타이머/알람 관리
│
├── package.json                # 프로젝트 의존성 및 스크립트
├── tsconfig.json              # TypeScript 설정 (선택)
├── webpack.config.js          # Webpack 번들 설정 (선택)
└── README.md                  # 프로젝트 문서
```

## 🎯 핵심 기능별 파일 구조

### 1️⃣ 사이드바 패널
- **`src/pages/sidebar.html`** - 사이드바 HTML
- **`src/pages/sidebar.js`** - 사이드바 로직 및 탭 관리
- **`src/styles/sidebar.css`** - 사이드바 스타일

### 2️⃣ 위젯 시스템
- **`src/types/index.ts`** - `Widget` 타입 정의
- **`src/pages/sidebar.js`** - 위젯 렌더링 로직 (`renderWidget()`)
- **`src/components/Widget.tsx`** - 위젯 컴포넌트 (향후)
- **`src/api/widgets.ts`** - 위젯 API 통합

### 3️⃣ 미니 플레이어 (PiP 개선)
- **`src/content-script.js`** - 비디오 감지 로직
- **`src/service-worker.js`** - 미디어 제어
- **`src/components/MiniPlayer.tsx`** - UI 컴포넌트 (향후)
- **`src/types/index.ts`** - `MiniPlayerState` 타입

### 4️⃣ 알림 센터
- **`src/api/notifications.ts`** - Gmail, GitHub API 통합
- **`src/components/NotificationCenter.tsx`** - 알림 UI (향후)
- **`src/types/index.ts`** - `Notification` 타입

### 5️⃣ 북마크 & 빠른 실행
- **`src/storage/storage.ts`** - 북마크 저장/로드
- **`src/components/BookmarkManager.tsx`** - 북마크 UI (향후)
- **`src/types/index.ts`** - `Bookmark` 타입

### 6️⃣ 웹앱 임베딩
- **`src/components/WebAppEmbed.tsx`** - iframe 기반 임베딩 UI (향후)
- **`src/pages/sidebar.js`** - 웹앱 로드 로직

### 7️⃣ Fun Widget (랜덤 이미지/밈)
- **`src/components/FunWidget.tsx`** - Fun 위젯 UI (향후)
- **`src/api/widgets.ts`** - 랜덤 이미지 API (GIPHY, Unsplash 등)

### 8️⃣ 글로벌 미디어 제어
- **`src/content-script.js`** - 미디어 감지
- **`src/service-worker.js`** - 미디어 상태 관리
- **`src/components/GlobalMediaWidget.tsx`** - 미디어 제어 UI (향후)
- **`src/types/index.ts`** - `MediaInfo` 타입

## 🔧 설정 및 타입

### `ExtensionSettings` (저장되는 사용자 설정)
```typescript
{
  sidebarPosition: 'left' | 'right' | 'top' | 'bottom',
  sidebarWidth: number,
  theme: 'light' | 'dark' | 'auto',
  widgets: Widget[],
  bookmarks: Bookmark[],
  notifications: {
    enableGmail: boolean,
    enableGithub: boolean,
    gmailRefreshInterval: number,
    githubRefreshInterval: number
  },
  shortcuts: Record<string, string>
}
```

## 🚀 개발 진행 단계

### Phase 1: 기본 프레임워크 (현재)
- [x] 프로젝트 구조 생성
- [x] Manifest V3 설정
- [x] 기본 사이드바 UI
- [x] 타입 정의

### Phase 2: 핵심 위젯
- [ ] 시계 위젯 (완성)
- [ ] 날씨 위젯 (API 연동)
- [ ] 주식/암호화폐 위젯
- [ ] 할 일 위젯

### Phase 3: 미디어 및 알림
- [ ] 미니 플레이어 (YouTube, Spotify 감지)
- [ ] 글로벌 미디어 제어
- [ ] Gmail 알림 통합
- [ ] GitHub 알림 통합

### Phase 4: 고급 기능
- [ ] 웹앱 임베딩 (ChatGPT, Notion)
- [ ] 북마크 관리
- [ ] Fun Widget 시스템
- [ ] 설정 페이지

### Phase 5: 최적화 및 배포
- [ ] 성능 최적화
- [ ] 다크/라이트 테마
- [ ] Chrome Web Store 준비

## 📝 주요 파일 설명

### `manifest.json`
Chrome Extension 설정 파일. Manifest V3 기반으로 다음을 포함:
- 사이드패널 설정
- 콘텐츠 스크립트 등록
- 권한 선언
- 서비스 워커 설정

### `content-script.js`
모든 웹페이지에 주입되는 스크립트:
- `<video>`, `<audio>` 요소 감지
- Media Session API 모니터링
- 페이지 메타데이터 추출
- 서비스 워커와의 통신

### `service-worker.js`
백그라운드 작업 처리:
- 미디어 상태 중앙 관리
- 알림 동기화 (Gmail, GitHub)
- 탭 모니터링
- 사이드바와의 실시간 통신

### `sidebar.html` / `sidebar.js`
메인 UI 및 로직:
- 탭 구조 (위젯, 플레이어, 알림, 북마크, 웹앱)
- 위젯 렌더링
- 사용자 인터랙션 처리

## 🔐 API 키 관리

다음 API는 환경 변수로 관리되어야 합니다:
- **GIPHY_API_KEY** - GIPHY 랜덤 GIF
- **UNSPLASH_API_KEY** - Unsplash 랜덤 이미지
- **GITHUB_TOKEN** - GitHub API
- **GMAIL_CLIENT_ID/SECRET** - Gmail API (OAuth)

### 보안 주의사항
- API 키는 `service-worker.js`에서 관리
- Content Script에서는 민감한 작업 금지
- OAuth 인증은 별도 백엔드를 통해 처리 (선택)

## 📦 설치 및 테스트

### 개발 모드에서 실행
1. `chrome://extensions/` 접속
2. "개발자 모드" 활성화
3. "압축해제된 확장 프로그램 로드" 클릭
4. `browser-extension/public/` 폴더 선택

### 빌드 (선택)
```bash
npm install
npm run build
```

## 🎨 디자인 시스템

### 색상 스키마 (다크 테마)
- **Primary**: `#6366f1` (Indigo)
- **Secondary**: `#8b5cf6` (Violet)
- **Background**: `#1a1a2e`
- **Surface**: `#16213e`
- **Text**: `#e4e4e7`

### 아이콘 사용
- 이모지 기반 간단한 아이콘 (📊, ▶️, 🔔, 🔖, 🌐, ⚙️ 등)
- 확장 시 SVG 또는 상용 아이콘 라이브러리 추가 가능

## 🤝 기여 가이드

각 기능 개발 시:
1. 해당 타입을 `src/types/index.ts`에 정의
2. 로직을 모듈화된 파일에 구현
3. UI 컴포넌트는 향후 React 마이그레이션을 고려

## 📄 라이센스

[프로젝트 라이센스를 선택하세요]

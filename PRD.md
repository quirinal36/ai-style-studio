# PRD: Neural Style Transfer 웹 애플리케이션

## 1. 프로젝트 개요

### 1.1 프로젝트명
**AI Style Studio** — Neural Style Transfer 학습 및 체험 플랫폼

### 1.2 목적
렛츠코딩앤플레이 AI 프로젝트 3번째 과정의 실습 도구로, 학생들이 Neural Style Transfer의 원리를 학습하고 직접 체험할 수 있는 웹 애플리케이션을 구축한다.

### 1.3 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| **Backend** | FastAPI | 0.115+ |
| **Frontend** | React + Vite | React 18+ / Vite 5+ |
| **ML Framework** | PyTorch | 2.0+ (CPU) |
| **영상 처리** | OpenCV | 4.8+ |
| **상태 관리** | Zustand | 4.5+ |
| **스타일링** | Tailwind CSS | 3.4+ |
| **통신** | Axios, WebSocket | - |
| **빌드/배포** | Docker Compose | - |

### 1.4 실행 환경 제약
- GPU 없는 개인 노트북 (CPU only)
- 웹캠 사용 가능
- 이미지 최대 크기: 400px (CPU 성능 최적화)
- Python 3.10+, Node.js 18+

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────┐
│                   Frontend (React + Vite)        │
│                                                   │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐ │
│  │ 스타일    │ │ 실시간   │ │ 학습 대시보드     │ │
│  │ 변환 UI  │ │ 웹캠 UI  │ │ (이론/시각화)     │ │
│  └────┬─────┘ └────┬─────┘ └────────┬──────────┘ │
│       │            │                │             │
│       ▼            ▼                ▼             │
│  ┌─────────────────────────────────────────────┐  │
│  │         API Client (Axios / WebSocket)       │  │
│  └──────────────────┬──────────────────────────┘  │
└─────────────────────┼─────────────────────────────┘
                      │
          HTTP REST / WebSocket
                      │
┌─────────────────────┼─────────────────────────────┐
│                     ▼         Backend (FastAPI)    │
│  ┌─────────────────────────────────────────────┐  │
│  │              API Router Layer                │  │
│  │  /style-transfer  /webcam  /gallery  /learn  │  │
│  └──────────────────┬──────────────────────────┘  │
│                     │                              │
│  ┌──────────┐ ┌─────┴─────┐ ┌──────────────────┐  │
│  │ Gatys    │ │ Fast      │ │ Gallery /         │  │
│  │ Style    │ │ Style     │ │ History           │  │
│  │ Transfer │ │ Transfer  │ │ Manager           │  │
│  │ (VGG19)  │ │ (OpenCV)  │ │                   │  │
│  └──────────┘ └───────────┘ └──────────────────┘  │
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │         PyTorch (CPU) / OpenCV DNN           │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │     File Storage (uploads/ outputs/ models/) │  │
│  └─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

---

## 3. 기능 요구사항

### 3.1 기본 스타일 변환 (Gatys 방식)

| 항목 | 상세 |
|------|------|
| **설명** | 사용자가 콘텐츠/스타일 이미지를 업로드하면, VGG19 기반 최적화로 스타일 변환 결과를 생성 |
| **우선순위** | P0 (필수) |

#### 기능 상세

**FR-1.1: 이미지 업로드**
- 콘텐츠 이미지와 스타일 이미지를 각각 업로드
- 지원 포맷: JPG, PNG, WEBP
- 업로드 시 자동 리사이즈 (max 400px, 설정 변경 가능)
- 드래그앤드롭 및 파일 선택 모두 지원
- 이미지 프리뷰 표시

**FR-1.2: 하이퍼파라미터 조절**
- Content Weight (α): 슬라이더, 범위 0.1 ~ 100, 기본값 1
- Style Weight (β): 슬라이더, 범위 1e4 ~ 1e8, 로그 스케일, 기본값 1e6
- 반복 횟수 (Steps): 슬라이더, 범위 50 ~ 500, 기본값 300
- 이미지 크기 (Max Size): 드롭다운, 200 / 300 / 400px
- 학습률 (Learning Rate): 슬라이더, 범위 0.001 ~ 0.1, 기본값 0.01

**FR-1.3: 변환 실행 및 진행 상태**
- "변환 시작" 버튼 클릭 시 백엔드로 요청 전송
- SSE(Server-Sent Events)를 통한 실시간 진행률 표시
  - 현재 Step / 전체 Step
  - 현재 Loss 값 (Content Loss, Style Loss, Total Loss)
  - 프로그레스 바
- 50 Step마다 중간 결과 이미지 프리뷰 전송
- 변환 중 취소 기능

**FR-1.4: 결과 표시 및 다운로드**
- 원본 / 스타일 / 결과 이미지 3분할 비교 뷰
- 슬라이더로 원본↔결과 오버레이 비교
- 결과 이미지 다운로드 (PNG/JPG 선택)
- 갤러리에 자동 저장

---

### 3.2 Fast Style Transfer (실시간 변환)

| 항목 | 상세 |
|------|------|
| **설명** | 사전학습된 .t7/.onnx 모델을 사용하여 이미지 또는 웹캠 영상에 실시간 스타일 적용 |
| **우선순위** | P0 (필수) |

#### 기능 상세

**FR-2.1: 이미지 Fast Style Transfer**
- 업로드된 이미지에 사전학습 스타일 즉시 적용
- 스타일 프리셋 목록에서 원클릭 선택
  - Starry Night (별이 빛나는 밤)
  - The Scream (절규)
  - Mosaic (모자이크)
  - Candy (캔디)
  - Udnie
  - Rain Princess
- 적용 시간: 1초 이내 (CPU 기준)

**FR-2.2: 웹캠 실시간 스타일 변환**
- 브라우저에서 웹캠 스트림 캡처 (getUserMedia API)
- WebSocket을 통한 프레임 전송 → 변환 → 반환 파이프라인
- 프레임 크기: 320×240 (CPU 최적화)
- 목표 FPS: 5~10 (CPU 환경)
- 원본/변환 화면 좌우 분할 표시
- 키보드 단축키로 스타일 전환 (1~6 키)
- 스냅샷 촬영 및 저장 기능

**FR-2.3: 스타일 모델 관리**
- 사전학습 모델 목록 조회 API
- 모델 파일 위치: `backend/models/` 디렉토리
- 각 모델의 메타 정보: 이름, 설명, 예시 이미지, 파일 크기

---

### 3.3 학습 대시보드

| 항목 | 상세 |
|------|------|
| **설명** | CNN/VGG19 구조, 특징 맵, Gram Matrix 등 이론을 시각적으로 학습하는 인터랙티브 페이지 |
| **우선순위** | P1 (권장) |

#### 기능 상세

**FR-3.1: VGG19 구조 시각화**
- VGG19 레이어 구조를 인터랙티브 다이어그램으로 표시
- 각 레이어 클릭 시 해당 레이어의 역할 설명 팝업
- Content Layer(conv4_2)와 Style Layer(conv1_1~conv5_1) 하이라이트

**FR-3.2: 특징 맵 시각화**
- 이미지를 업로드하면 VGG19 각 레이어의 특징 맵을 히트맵으로 표시
- API: `POST /api/learn/feature-maps`
  - 입력: 이미지 파일
  - 출력: 레이어별 특징 맵 이미지 (conv1_1, conv2_1, conv3_1, conv4_1, conv4_2, conv5_1)
- 레이어 드롭다운으로 전환하며 비교

**FR-3.3: Gram Matrix 시각화**
- 선택한 레이어의 Gram Matrix를 히트맵으로 표시
- 콘텐츠 이미지와 스타일 이미지의 Gram Matrix 비교 뷰
- API: `POST /api/learn/gram-matrix`

**FR-3.4: Loss 변화 그래프**
- 스타일 변환 과정에서의 Content/Style/Total Loss 변화를 실시간 차트로 표시
- Recharts 활용 라인 차트
- Step별 로그 데이터 다운로드(CSV)

---

### 3.4 갤러리

| 항목 | 상세 |
|------|------|
| **설명** | 생성된 결과물을 저장/조회/공유하는 갤러리 시스템 |
| **우선순위** | P1 (권장) |

#### 기능 상세

**FR-4.1: 결과물 저장**
- 모든 스타일 변환 결과를 자동 저장
- 저장 정보: 콘텐츠 이미지, 스타일 이미지, 결과 이미지, 하이퍼파라미터, 생성일시, 학생명(선택)

**FR-4.2: 갤러리 조회**
- 그리드 레이아웃 (반응형 2~4열)
- 정렬: 최신순 / 인기순
- 필터: 스타일 유형별 / 날짜별
- 이미지 클릭 시 상세 모달 (원본, 스타일, 결과, 파라미터 표시)

**FR-4.3: 다운로드/삭제**
- 개별 결과물 다운로드 (원본 해상도)
- 본인 결과물 삭제 기능

---

### 3.5 프리셋 스타일 이미지

| 항목 | 상세 |
|------|------|
| **설명** | 대표적인 명화 스타일 이미지를 미리 제공하여 즉시 실습 가능하도록 구성 |
| **우선순위** | P0 (필수) |

#### 기능 상세

**FR-5.1: 기본 제공 스타일**
- 고흐 — 별이 빛나는 밤 (The Starry Night)
- 뭉크 — 절규 (The Scream)
- 칸딘스키 — 구성 VII (Composition VII)
- 호쿠사이 — 가나가와 해변의 큰 파도 (The Great Wave)
- 피카소 — 우는 여인 (Weeping Woman)
- 모네 — 수련 (Water Lilies)

**FR-5.2: 커스텀 스타일 업로드**
- 학생이 자신만의 스타일 이미지를 업로드하여 사용

---

## 4. API 명세

### 4.1 REST API

```
Base URL: http://localhost:8000/api
```

#### 스타일 변환

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/style-transfer/gatys` | Gatys 방식 스타일 변환 실행 |
| `GET` | `/style-transfer/gatys/{task_id}/status` | 변환 진행 상태 조회 (SSE) |
| `POST` | `/style-transfer/gatys/{task_id}/cancel` | 변환 취소 |
| `POST` | `/style-transfer/fast` | Fast Style Transfer 실행 |
| `GET` | `/style-transfer/models` | 사전학습 모델 목록 조회 |

#### 갤러리

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/gallery` | 갤러리 목록 조회 (pagination) |
| `GET` | `/gallery/{id}` | 갤러리 상세 조회 |
| `DELETE` | `/gallery/{id}` | 갤러리 항목 삭제 |

#### 학습

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/learn/feature-maps` | VGG19 특징 맵 추출 |
| `POST` | `/learn/gram-matrix` | Gram Matrix 계산 및 시각화 |
| `GET` | `/learn/vgg19-info` | VGG19 모델 구조 정보 |

#### 프리셋

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/presets/styles` | 프리셋 스타일 이미지 목록 |
| `GET` | `/presets/styles/{id}/image` | 프리셋 스타일 이미지 파일 |

### 4.2 WebSocket API

```
Endpoint: ws://localhost:8000/ws/webcam
```

#### 웹캠 실시간 스타일 변환 프로토콜

**Client → Server:**
```json
{
  "type": "frame",
  "data": "<base64 encoded JPEG frame>",
  "model": "starry_night"
}
```
```json
{
  "type": "change_model",
  "model": "the_scream"
}
```

**Server → Client:**
```json
{
  "type": "styled_frame",
  "data": "<base64 encoded JPEG result>",
  "fps": 8.2,
  "processing_time_ms": 122
}
```

### 4.3 주요 Request/Response 스키마

#### POST /api/style-transfer/gatys

**Request (multipart/form-data):**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `content_image` | File | O | 콘텐츠 이미지 |
| `style_image` | File | O | 스타일 이미지 |
| `content_weight` | float | X | 콘텐츠 가중치 (기본: 1) |
| `style_weight` | float | X | 스타일 가중치 (기본: 1e6) |
| `num_steps` | int | X | 반복 횟수 (기본: 300) |
| `max_size` | int | X | 최대 이미지 크기 (기본: 400) |
| `learning_rate` | float | X | 학습률 (기본: 0.01) |
| `student_name` | string | X | 학생 이름 |

**Response:**
```json
{
  "task_id": "uuid-string",
  "status": "processing",
  "message": "스타일 변환이 시작되었습니다."
}
```

#### GET /api/style-transfer/gatys/{task_id}/status (SSE)

**Event Stream:**
```
event: progress
data: {"step": 50, "total_steps": 300, "content_loss": 12345.6, "style_loss": 0.89, "total_loss": 12346.5, "preview_url": "/api/previews/task_id_step50.jpg"}

event: progress
data: {"step": 100, "total_steps": 300, ...}

event: complete
data: {"result_url": "/api/results/task_id.png", "gallery_id": 42, "elapsed_seconds": 320.5}

event: error
data: {"message": "메모리 부족으로 변환에 실패했습니다."}
```

#### POST /api/style-transfer/fast

**Request (multipart/form-data):**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `image` | File | O | 입력 이미지 |
| `model_name` | string | O | 모델명 (예: starry_night) |

**Response:**
```json
{
  "result_url": "/api/results/fast_uuid.jpg",
  "processing_time_ms": 245,
  "model_used": "starry_night"
}
```

---

## 5. 디렉토리 구조

```
neural-style-transfer/
├── docker-compose.yml
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                     # FastAPI 앱 엔트리포인트
│   ├── config.py                   # 설정 (경로, 기본값 등)
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py               # 라우터 통합
│   │   ├── style_transfer.py       # 스타일 변환 엔드포인트
│   │   ├── webcam.py               # WebSocket 웹캠 엔드포인트
│   │   ├── gallery.py              # 갤러리 엔드포인트
│   │   ├── learn.py                # 학습 시각화 엔드포인트
│   │   └── presets.py              # 프리셋 스타일 엔드포인트
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── gatys_transfer.py       # Gatys 방식 스타일 변환 로직
│   │   ├── fast_transfer.py        # Fast Style Transfer 로직
│   │   ├── feature_extractor.py    # VGG19 특징 추출
│   │   ├── image_processor.py      # 이미지 전/후처리 유틸
│   │   └── task_manager.py         # 비동기 태스크 관리
│   │
│   ├── models/                     # 사전학습 모델 파일
│   │   ├── starry_night.t7
│   │   ├── the_scream.t7
│   │   ├── mosaic.t7
│   │   ├── candy.t7
│   │   ├── udnie.t7
│   │   └── rain_princess.t7
│   │
│   ├── presets/                    # 프리셋 스타일 이미지
│   │   ├── starry_night.jpg
│   │   ├── the_scream.jpg
│   │   ├── composition_vii.jpg
│   │   ├── great_wave.jpg
│   │   ├── weeping_woman.jpg
│   │   └── water_lilies.jpg
│   │
│   └── storage/                    # 런타임 파일 저장
│       ├── uploads/
│       ├── results/
│       ├── previews/
│       └── gallery.json
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   │
│   ├── public/
│   │   └── favicon.svg
│   │
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       │
│       ├── api/
│       │   ├── client.js           # Axios 인스턴스
│       │   ├── styleTransfer.js    # 스타일 변환 API 호출
│       │   ├── gallery.js          # 갤러리 API 호출
│       │   └── learn.js            # 학습 API 호출
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   └── Layout.jsx
│       │   │
│       │   ├── style-transfer/
│       │   │   ├── ImageUploader.jsx       # 이미지 업로드 컴포넌트
│       │   │   ├── ParameterPanel.jsx      # 하이퍼파라미터 슬라이더
│       │   │   ├── ProgressBar.jsx         # 변환 진행률 표시
│       │   │   ├── ResultViewer.jsx        # 결과 비교 뷰어
│       │   │   ├── StylePresets.jsx        # 프리셋 스타일 선택
│       │   │   └── ImageComparison.jsx     # 슬라이더 비교 뷰
│       │   │
│       │   ├── webcam/
│       │   │   ├── WebcamCapture.jsx       # 웹캠 캡처 컴포넌트
│       │   │   ├── StyleSelector.jsx       # 실시간 스타일 선택
│       │   │   └── WebcamDisplay.jsx       # 원본/변환 분할 화면
│       │   │
│       │   ├── learn/
│       │   │   ├── VGG19Diagram.jsx        # VGG19 구조 시각화
│       │   │   ├── FeatureMapViewer.jsx    # 특징 맵 표시
│       │   │   ├── GramMatrixView.jsx      # Gram Matrix 히트맵
│       │   │   └── LossChart.jsx           # Loss 변화 차트
│       │   │
│       │   ├── gallery/
│       │   │   ├── GalleryGrid.jsx         # 갤러리 그리드
│       │   │   ├── GalleryCard.jsx         # 개별 카드
│       │   │   └── GalleryModal.jsx        # 상세 모달
│       │   │
│       │   └── common/
│       │       ├── Button.jsx
│       │       ├── Slider.jsx
│       │       ├── Modal.jsx
│       │       └── Loading.jsx
│       │
│       ├── pages/
│       │   ├── StyleTransferPage.jsx       # 기본 스타일 변환
│       │   ├── FastStylePage.jsx           # Fast Style Transfer
│       │   ├── WebcamPage.jsx              # 웹캠 실시간 변환
│       │   ├── LearnPage.jsx               # 학습 대시보드
│       │   └── GalleryPage.jsx             # 갤러리
│       │
│       ├── stores/
│       │   ├── useStyleStore.js            # 스타일 변환 상태
│       │   ├── useWebcamStore.js           # 웹캠 상태
│       │   └── useGalleryStore.js          # 갤러리 상태
│       │
│       ├── hooks/
│       │   ├── useWebcam.js                # 웹캠 커스텀 훅
│       │   ├── useSSE.js                   # SSE 연결 훅
│       │   └── useWebSocket.js             # WebSocket 연결 훅
│       │
│       └── utils/
│           ├── imageUtils.js               # 이미지 리사이즈/변환
│           └── formatUtils.js              # 숫자/시간 포맷
│
└── docs/
    ├── PRD.md                              # 이 문서
    ├── setup-guide.md                      # 설치 가이드
    └── student-guide.md                    # 학생용 실습 가이드
```

---

## 6. 페이지별 UI 와이어프레임

### 6.1 스타일 변환 페이지 (`/style-transfer`)

```
┌──────────────────────────────────────────────────────────────┐
│  🎨 AI Style Studio          [스타일변환] [실시간] [학습] [갤러리] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                  │
│  │                 │    │                 │                  │
│  │   콘텐츠 이미지  │    │   스타일 이미지  │                  │
│  │   (드래그앤드롭)  │    │   (드래그앤드롭)  │                  │
│  │                 │    │                 │                  │
│  └─────────────────┘    └─────────────────┘                  │
│                                                              │
│  프리셋 스타일:                                                │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│  │별밤  │ │절규  │ │구성7 │ │파도  │ │우는  │ │수련  │           │
│  │     │ │     │ │     │ │     │ │여인  │ │     │           │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘           │
│                                                              │
│  ── 파라미터 설정 ──────────────────────────────────            │
│  Content Weight (α)   ──●──────────────  1.0                 │
│  Style Weight (β)     ────────●────────  1e6                 │
│  반복 횟수 (Steps)     ─────────●───────  300                  │
│  이미지 크기            [200] [300] [●400]                     │
│                                                              │
│                    [ 🎨 변환 시작 ]                             │
│                                                              │
│  ── 진행 상태 ──────────────────────────────────               │
│  Step: 150 / 300  ████████████░░░░░░░░░░ 50%                 │
│  Content Loss: 12,345  Style Loss: 0.89  Total: 12,346       │
│                                                              │
│  ── 결과 ──────────────────────────────────                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │   원본       │ │   스타일     │ │   결과       │          │
│  │              │ │              │ │              │          │
│  └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                              │
│  [📥 다운로드 PNG]  [📥 다운로드 JPG]  [🖼️ 갤러리에 저장]        │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 웹캠 실시간 변환 페이지 (`/webcam`)

```
┌──────────────────────────────────────────────────────────────┐
│  🎨 AI Style Studio          [스타일변환] [●실시간] [학습] [갤러리]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐          │
│  │                      │  │                      │          │
│  │                      │  │                      │          │
│  │    📷 원본 웹캠       │  │    🎨 스타일 적용     │          │
│  │                      │  │                      │          │
│  │                      │  │                      │          │
│  └──────────────────────┘  └──────────────────────┘          │
│                                                              │
│  FPS: 8.2  |  Processing: 122ms  |  Resolution: 320×240     │
│                                                              │
│  스타일 선택 (키보드 1~6):                                      │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│  │●별밤 │ │ 절규│ │모자  │ │캔디  │ │Udnie│ │Rain │           │
│  │ (1) │ │ (2) │ │ (3) │ │ (4) │ │ (5) │ │ (6) │           │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘           │
│                                                              │
│  [📸 스냅샷 촬영]  [⏸️ 일시정지]  [⏹️ 정지]                     │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 학습 대시보드 (`/learn`)

```
┌──────────────────────────────────────────────────────────────┐
│  🎨 AI Style Studio          [스타일변환] [실시간] [●학습] [갤러리]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [VGG19 구조]  [특징 맵]  [Gram Matrix]  [Loss 그래프]         │
│                                                              │
│  ── VGG19 구조 시각화 ──                                       │
│  ┌────┐   ┌────┐   ┌────┐   ┌────┐   ┌────┐                 │
│  │conv│──▸│conv│──▸│conv│──▸│conv│──▸│conv│                 │
│  │1_1 │   │2_1 │   │3_1 │   │4_1 │   │5_1 │                 │
│  │    │   │    │   │    │   │    │   │    │                 │
│  │Style│  │Style│  │Style│  │Style│  │Style│                 │
│  │Layer│  │Layer│  │Layer│  │  +  │  │Layer│                 │
│  │    │   │    │   │    │   │Conv │   │    │                 │
│  │    │   │    │   │    │   │4_2  │   │    │                 │
│  │    │   │    │   │    │   │Cont.│   │    │                 │
│  └────┘   └────┘   └────┘   └────┘   └────┘                 │
│                                                              │
│  ── 특징 맵 시각화 ──                                          │
│  이미지 업로드: [파일 선택]                                      │
│  레이어 선택: [conv1_1 ▼]                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Channel 1│ │ Channel 2│ │ Channel 3│ │ Channel 4│        │
│  │ (edge)   │ │(texture) │ │ (color)  │ │ (shape)  │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                              │
│  ── Loss 변화 그래프 ──                                        │
│  Loss │  ╲                                                   │
│       │    ╲                                                 │
│       │      ╲____                                           │
│       │           ╲___________                               │
│       └──────────────────────── Step                         │
│       ── Content Loss ── Style Loss ── Total Loss            │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. 백엔드 핵심 구현 명세

### 7.1 Gatys Style Transfer 서비스

```python
# backend/services/gatys_transfer.py 핵심 구조

class GatysStyleTransfer:
    """Gatys et al. (2015) 방식의 Neural Style Transfer"""

    def __init__(self, device="cpu"):
        self.device = torch.device(device)
        self.vgg = models.vgg19(pretrained=True).features.eval().to(self.device)
        for param in self.vgg.parameters():
            param.requires_grad_(False)

        self.content_layers = ["conv4_2"]
        self.style_layers = ["conv1_1", "conv2_1", "conv3_1", "conv4_1", "conv5_1"]
        self.style_weights = {
            "conv1_1": 1.0, "conv2_1": 0.8,
            "conv3_1": 0.5, "conv4_1": 0.3, "conv5_1": 0.1
        }

    async def run(self, params: TransferParams, callback: ProgressCallback):
        """비동기 스타일 변환 실행 (SSE 콜백 포함)"""
        ...

    def get_features(self, image: Tensor) -> dict:
        """VGG19 중간 레이어 특징 추출"""
        ...

    def gram_matrix(self, tensor: Tensor) -> Tensor:
        """Gram Matrix 계산"""
        ...

    def compute_loss(self, gen_features, con_features, sty_features, params):
        """Content + Style 통합 손실 계산"""
        ...
```

### 7.2 Fast Style Transfer 서비스

```python
# backend/services/fast_transfer.py 핵심 구조

class FastStyleTransfer:
    """Johnson et al. (2016) 기반 Fast Style Transfer (OpenCV DNN)"""

    def __init__(self, models_dir: str):
        self.models_dir = models_dir
        self.loaded_models: dict[str, cv2.dnn.Net] = {}

    def load_model(self, model_name: str) -> cv2.dnn.Net:
        """모델 로드 (캐시 사용)"""
        ...

    def transform_image(self, image: np.ndarray, model_name: str) -> np.ndarray:
        """단일 이미지 스타일 변환"""
        ...

    def transform_frame(self, frame: np.ndarray, model_name: str) -> np.ndarray:
        """웹캠 프레임 실시간 변환 (320x240 최적화)"""
        ...
```

### 7.3 비동기 태스크 관리

```python
# backend/services/task_manager.py

class TaskManager:
    """Gatys 방식의 장시간 변환 작업을 비동기로 관리"""

    tasks: dict[str, TaskInfo] = {}

    async def create_task(self, params) -> str:
        """새 변환 태스크 생성, task_id 반환"""
        ...

    async def cancel_task(self, task_id: str):
        """진행 중인 태스크 취소"""
        ...

    def get_status(self, task_id: str) -> TaskStatus:
        """태스크 상태 조회"""
        ...
```

### 7.4 WebSocket 웹캠 핸들러

```python
# backend/api/webcam.py

@router.websocket("/ws/webcam")
async def webcam_endpoint(websocket: WebSocket):
    await websocket.accept()
    fast_transfer = FastStyleTransfer(settings.MODELS_DIR)
    current_model = "starry_night"

    try:
        while True:
            data = await websocket.receive_json()

            if data["type"] == "change_model":
                current_model = data["model"]
                continue

            if data["type"] == "frame":
                # base64 디코딩 → 변환 → base64 인코딩
                frame = decode_base64_frame(data["data"])
                start = time.time()
                result = fast_transfer.transform_frame(frame, current_model)
                elapsed = (time.time() - start) * 1000

                await websocket.send_json({
                    "type": "styled_frame",
                    "data": encode_frame_base64(result),
                    "processing_time_ms": round(elapsed, 1)
                })
    except WebSocketDisconnect:
        pass
```

---

## 8. 프론트엔드 핵심 구현 명세

### 8.1 주요 커스텀 훅

```javascript
// src/hooks/useSSE.js
// Gatys 방식 변환의 실시간 진행 상태를 SSE로 수신
function useSSE(taskId) {
  const [progress, setProgress] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  // EventSource 연결 및 이벤트 핸들링
  // progress / complete / error 이벤트 처리
  return { progress, preview, result, error };
}
```

```javascript
// src/hooks/useWebSocket.js
// 웹캠 실시간 스타일 변환을 위한 WebSocket 통신
function useWebSocket(url) {
  const [isConnected, setConnected] = useState(false);
  const [fps, setFps] = useState(0);
  // WebSocket 연결/해제, 프레임 송수신
  // 모델 변경 메시지 전송
  return { isConnected, fps, sendFrame, changeModel };
}
```

```javascript
// src/hooks/useWebcam.js
// 브라우저 웹캠 스트림 관리
function useWebcam(options = { width: 320, height: 240 }) {
  const videoRef = useRef(null);
  const [isActive, setActive] = useState(false);
  // getUserMedia로 웹캠 스트림 획득
  // Canvas를 통한 프레임 캡처 (JPEG base64)
  return { videoRef, isActive, start, stop, captureFrame };
}
```

### 8.2 상태 관리 (Zustand Store)

```javascript
// src/stores/useStyleStore.js
const useStyleStore = create((set) => ({
  // 이미지
  contentImage: null,
  styleImage: null,
  resultImage: null,

  // 파라미터
  params: {
    contentWeight: 1,
    styleWeight: 1e6,
    numSteps: 300,
    maxSize: 400,
    learningRate: 0.01,
  },

  // 변환 상태
  taskId: null,
  isProcessing: false,
  progress: { step: 0, totalSteps: 0, losses: {} },
  previews: [],

  // 액션
  setContentImage: (img) => set({ contentImage: img }),
  setStyleImage: (img) => set({ styleImage: img }),
  setParams: (params) => set((s) => ({ params: { ...s.params, ...params } })),
  startTransfer: async () => { ... },
  cancelTransfer: async () => { ... },
}));
```

### 8.3 라우팅 구조

```javascript
// src/App.jsx
<BrowserRouter>
  <Layout>
    <Routes>
      <Route path="/" element={<Navigate to="/style-transfer" />} />
      <Route path="/style-transfer" element={<StyleTransferPage />} />
      <Route path="/fast-style" element={<FastStylePage />} />
      <Route path="/webcam" element={<WebcamPage />} />
      <Route path="/learn" element={<LearnPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
    </Routes>
  </Layout>
</BrowserRouter>
```

---

## 9. 성능 요구사항

| 항목 | 목표 | 비고 |
|------|------|------|
| Gatys 변환 (400px, 300step) | 5~10분 | CPU only |
| Gatys 변환 (200px, 200step) | 1~3분 | 빠른 테스트용 |
| Fast Style Transfer (단일 이미지) | < 1초 | OpenCV DNN |
| 웹캠 실시간 변환 FPS | 5~10 FPS | 320×240 해상도 |
| WebSocket 지연시간 | < 200ms | 프레임 왕복 |
| 프론트엔드 초기 로딩 | < 3초 | Vite 번들 최적화 |
| 이미지 업로드 최대 크기 | 10MB | 서버 리사이즈 |
| 동시 Gatys 변환 태스크 | 1개 | CPU 리소스 제한 |

---

## 10. 개발 일정 (권장)

| 주차 | 작업 내용 | 산출물 |
|------|-----------|--------|
| **1주차** | 프로젝트 세팅, 기본 API 구조, VGG19 서비스 구현 | FastAPI 보일러플레이트, Gatys 서비스 코어 |
| **2주차** | Gatys 변환 API 완성, SSE 진행 상태, 프론트 기본 레이아웃 | 스타일 변환 엔드투엔드 동작 |
| **3주차** | Fast Style Transfer, WebSocket 웹캠 변환 | 실시간 변환 동작 |
| **4주차** | 학습 대시보드, 특징 맵/Gram Matrix 시각화 | 학습 페이지 완성 |
| **5주차** | 갤러리, 프리셋, UI 폴리싱, 반응형 | 전체 기능 완성 |
| **6주차** | Docker 패키징, 문서화, 테스트, 버그 수정 | 배포 가능 버전 |

---

## 11. 환경 설정

### 11.1 Backend (requirements.txt)

```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
python-multipart>=0.0.9
torch>=2.0.0
torchvision>=0.15.0
opencv-python-headless>=4.8.0
Pillow>=10.0.0
numpy>=1.24.0
matplotlib>=3.7.0
websockets>=12.0
aiofiles>=23.0
pydantic>=2.0.0
```

### 11.2 Frontend (package.json dependencies)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "axios": "^1.7.0",
    "zustand": "^4.5.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.400.0",
    "react-dropzone": "^14.2.0",
    "react-compare-slider": "^3.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### 11.3 Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/models:/app/models
      - ./backend/presets:/app/presets
      - storage:/app/storage
    environment:
      - DEVICE=cpu
      - MAX_IMAGE_SIZE=400
      - MODELS_DIR=/app/models

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  storage:
```

---

## 12. 사전학습 모델 준비

Fast Style Transfer에 사용할 .t7 모델은 Johnson et al.의 공개 모델을 사용한다.

**다운로드 스크립트 (backend/download_models.sh):**

```bash
#!/bin/bash
MODELS_DIR="models"
mkdir -p $MODELS_DIR

BASE_URL="https://cs.stanford.edu/people/jcjohns/fast-neural-style/models"

declare -A MODELS=(
  ["starry_night"]="instance_norm/starry_night.t7"
  ["la_muse"]="instance_norm/la_muse.t7"
  ["mosaic"]="instance_norm/mosaic.t7"
  ["candy"]="instance_norm/candy.t7"
  ["udnie"]="instance_norm/udnie.t7"
  ["rain_princess"]="instance_norm/rain_princess.t7"
  ["the_scream"]="instance_norm/the_scream.t7"
  ["feathers"]="instance_norm/feathers.t7"
)

for name in "${!MODELS[@]}"; do
  echo "Downloading ${name}..."
  wget -O "${MODELS_DIR}/${name}.t7" "${BASE_URL}/${MODELS[$name]}"
done

echo "All models downloaded."
```

---

## 13. 에러 처리 전략

| 상황 | 처리 방식 |
|------|-----------|
| 이미지 포맷 미지원 | 400 에러 + 지원 포맷 안내 메시지 |
| 이미지 크기 초과 (10MB) | 400 에러 + 자동 리사이즈 제안 |
| 변환 중 메모리 부족 | SSE error 이벤트 + 이미지 크기 축소 가이드 |
| WebSocket 연결 끊김 | 자동 재연결 (최대 3회, 지수 백오프) |
| 모델 파일 누락 | 500 에러 + download_models.sh 실행 안내 |
| 동시 변환 요청 | 429 에러 + "이전 변환 완료 후 재시도" 안내 |
| 웹캠 권한 거부 | 프론트에서 권한 요청 가이드 표시 |

---

## 14. 보안 고려사항

- 업로드 파일 MIME 타입 검증 (image/jpeg, image/png, image/webp만 허용)
- 파일명 UUID 재생성으로 path traversal 방지
- 업로드 크기 제한 (10MB)
- CORS 설정 (개발: localhost:5173, 배포: 지정 도메인)
- Rate limiting: Gatys 변환 동시 1건, Fast 변환 초당 10건
- WebSocket 연결 수 제한 (IP당 2개)

---

## 15. 향후 확장 계획 (Out of Scope)

아래 항목은 현재 버전에서는 제외하되, 추후 확장 가능하도록 구조를 설계한다.

- 사용자 인증/로그인 시스템
- DB 연동 (SQLite → PostgreSQL)
- GPU 가속 지원 (CUDA 자동 감지)
- HuggingFace Hub 모델 동적 다운로드 및 적용
- 스타일 믹싱 (다중 스타일 가중 합성)
- 영상 파일 스타일 변환
- 모바일 반응형 최적화
- 학생 포트폴리오 PDF 자동 생성
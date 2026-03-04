# AI Style Studio

Neural Style Transfer 학습 및 체험 플랫폼 — 렛츠코딩앤플레이 AI 프로젝트

## 주요 기능

- **Gatys Style Transfer** — VGG19 기반 최적화 방식, 실시간 진행률 표시 (SSE)
- **Fast Style Transfer** — 사전학습 모델로 즉시 스타일 적용 (1초 이내)
- **웹캠 실시간 변환** — WebSocket 기반 실시간 스타일 적용
- **학습 대시보드** — VGG19 구조, Feature Map, Gram Matrix 시각화
- **갤러리** — 변환 결과 자동 저장, 검색/필터링

## 기술 스택

| 구분 | 기술 |
|------|------|
| Backend | FastAPI, PyTorch (CPU), OpenCV |
| Frontend | React + Vite, Zustand, Tailwind CSS v4 |
| 통신 | REST API, SSE, WebSocket |
| 배포 | Docker Compose |

## 빠른 시작

### 사전 요구사항

- Python 3.10+
- Node.js 18+
- (선택) Docker & Docker Compose

### 로컬 개발 환경

```bash
# 1. 저장소 클론
git clone https://github.com/quirinal36/ai-style-studio.git
cd ai-style-studio

# 2. 백엔드 설정
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r backend/requirements.txt

# 3. Fast Style Transfer 모델 다운로드
cd backend
bash download_models.sh
cd ..

# 4. 프론트엔드 설정
cd frontend
npm install
cd ..

# 5. 백엔드 실행 (터미널 1)
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 6. 프론트엔드 실행 (터미널 2)
cd frontend
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### Docker 실행

```bash
# 모델 다운로드 (최초 1회)
cd backend && bash download_models.sh && cd ..

# Docker Compose로 실행
docker-compose up --build
```

브라우저에서 `http://localhost` 접속

## 프로젝트 구조

```
ai-style-studio/
├── backend/
│   ├── api/               # API 엔드포인트
│   │   ├── style_transfer.py  # Gatys, Fast 스타일 변환
│   │   ├── webcam.py          # WebSocket 웹캠
│   │   ├── learn.py           # 학습 시각화
│   │   ├── gallery.py         # 갤러리 CRUD
│   │   └── presets.py         # 프리셋 스타일
│   ├── services/          # 핵심 서비스
│   │   ├── gatys_transfer.py  # Gatys 알고리즘
│   │   ├── fast_transfer.py   # Fast Style Transfer
│   │   ├── feature_extractor.py # VGG19 추출
│   │   ├── image_processor.py # 이미지 처리
│   │   └── task_manager.py    # 비동기 태스크 관리
│   ├── main.py
│   ├── config.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── components/    # UI 컴포넌트
│   │   ├── stores/        # Zustand 상태 관리
│   │   ├── hooks/         # 커스텀 훅 (SSE, WebSocket, Webcam)
│   │   └── api/           # API 클라이언트
│   └── vite.config.js
├── docker-compose.yml
└── PRD.md
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/style-transfer/gatys` | Gatys 스타일 변환 시작 |
| GET | `/api/style-transfer/gatys/{id}/status` | SSE 진행 상태 |
| POST | `/api/style-transfer/gatys/{id}/cancel` | 변환 취소 |
| POST | `/api/style-transfer/fast` | Fast 스타일 변환 |
| GET | `/api/style-transfer/models` | 사용 가능 모델 목록 |
| WS | `/ws/webcam` | 웹캠 실시간 변환 |
| POST | `/api/learn/feature-maps` | Feature Map 추출 |
| POST | `/api/learn/gram-matrix` | Gram Matrix 시각화 |
| GET | `/api/learn/vgg19-info` | VGG19 구조 정보 |
| GET | `/api/gallery` | 갤러리 목록 |
| DELETE | `/api/gallery/{id}` | 갤러리 항목 삭제 |
| GET | `/api/presets/styles` | 프리셋 스타일 목록 |

## 제약 사항

- CPU 전용 (GPU 미지원) — 이미지 최대 400px로 제한
- 웹캠 프레임: 320x240 해상도
- 동시 Gatys 변환 1건만 가능 (CPU 부하 관리)

## 라이선스

MIT

# AI Style Studio — 실행 가이드

이 문서는 AI Style Studio 프로젝트를 로컬 환경에서 설정하고 실행하는 방법을 단계별로 설명합니다.

---

## 목차

1. [사전 요구사항](#1-사전-요구사항)
2. [프로젝트 클론](#2-프로젝트-클론)
3. [방법 A: 로컬 개발 환경 실행](#3-방법-a-로컬-개발-환경-실행)
4. [방법 B: Docker Compose 실행](#4-방법-b-docker-compose-실행)
5. [Fast Style Transfer 모델 다운로드](#5-fast-style-transfer-모델-다운로드)
6. [프리셋 스타일 이미지 준비](#6-프리셋-스타일-이미지-준비)
7. [테스트 실행](#7-테스트-실행)
8. [기능별 사용법](#8-기능별-사용법)
9. [문제 해결](#9-문제-해결)
10. [환경 변수 설정](#10-환경-변수-설정)

---

## 1. 사전 요구사항

### 필수

| 도구 | 최소 버전 | 확인 명령어 |
|------|-----------|------------|
| Python | 3.10+ | `python --version` |
| pip | 최신 | `pip --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | 2.x | `git --version` |

### 선택 (Docker 실행 시)

| 도구 | 최소 버전 | 확인 명령어 |
|------|-----------|------------|
| Docker | 20+ | `docker --version` |
| Docker Compose | 2.x | `docker compose version` |

### 선택 (모델 다운로드 시)

| 도구 | 용도 | 대체 |
|------|------|------|
| wget | 모델 파일 다운로드 | curl 또는 브라우저에서 수동 다운로드 |
| bash | 다운로드 스크립트 실행 | Git Bash (Windows) |

> **Windows 사용자**: Git 설치 시 포함되는 Git Bash를 사용하면 `bash`, `wget` 명령을 실행할 수 있습니다. 또는 PowerShell에서 수동으로 모델을 다운로드할 수 있습니다 (5번 섹션 참조).

### 디스크 공간

- Python 패키지 (PyTorch 포함): ~2.5GB
- Node.js 패키지: ~200MB
- VGG19 모델 (자동 다운로드): ~550MB
- Fast Style Transfer 모델 (8개): ~50MB
- **총 권장 여유 공간: ~4GB**

---

## 2. 프로젝트 클론

```bash
git clone https://github.com/quirinal36/ai-style-studio.git
cd ai-style-studio
```

---

## 3. 방법 A: 로컬 개발 환경 실행

로컬에서 백엔드와 프론트엔드를 직접 실행하는 방법입니다. 개발 시 추천합니다.

### 3-1. 백엔드 설정

```bash
# 가상환경 생성 및 활성화
python -m venv venv

# Linux / macOS
source venv/bin/activate

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Windows (CMD)
venv\Scripts\activate.bat

# Windows (Git Bash)
source venv/Scripts/activate
```

```bash
# 패키지 설치
pip install -r backend/requirements.txt
```

> **참고**: PyTorch CPU 버전이 설치됩니다 (~2GB). 네트워크 상태에 따라 5~15분 소요될 수 있습니다.

### 3-2. 스토리지 디렉토리 생성

백엔드가 처음 실행될 때 자동으로 생성되지만, 수동으로 미리 만들 수도 있습니다:

```bash
mkdir -p backend/storage/uploads
mkdir -p backend/storage/results
mkdir -p backend/storage/previews
```

Windows (PowerShell):
```powershell
New-Item -ItemType Directory -Force -Path backend\storage\uploads
New-Item -ItemType Directory -Force -Path backend\storage\results
New-Item -ItemType Directory -Force -Path backend\storage\previews
```

### 3-3. 백엔드 실행

**터미널 1** 에서:

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

정상 실행 시 출력:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using StatReload
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

> `--reload` 옵션은 코드 변경 시 자동으로 서버를 재시작합니다. 프로덕션에서는 제거하세요.

헬스 체크 확인:
```bash
curl http://localhost:8000/health
# 응답: {"status":"ok"}
```

### 3-4. 프론트엔드 설정 및 실행

**터미널 2** 에서:

```bash
cd frontend
npm install
npm run dev
```

정상 실행 시 출력:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://xxx.xxx.xxx.xxx:5173/
```

### 3-5. 접속

브라우저에서 **http://localhost:5173** 으로 접속합니다.

> 프론트엔드 개발 서버(Vite)가 `/api`와 `/ws` 요청을 자동으로 백엔드(port 8000)로 프록시합니다.

---

## 4. 방법 B: Docker Compose 실행

Docker를 사용하여 한 번에 실행하는 방법입니다.

### 4-1. 모델 사전 다운로드

Docker 빌드 전에 모델 파일을 먼저 다운로드해야 합니다 (5번 섹션 참조).

### 4-2. 실행

```bash
docker-compose up --build
```

첫 빌드 시 PyTorch 설치로 인해 10~20분 소요될 수 있습니다.

### 4-3. 접속

브라우저에서 **http://localhost** 으로 접속합니다.

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Frontend (nginx) | 80 | 프론트엔드 + API 프록시 |
| Backend (uvicorn) | 8000 | API 서버 (직접 접속도 가능) |

### 4-4. 종료

```bash
# 포그라운드 실행 중이면 Ctrl+C
# 또는:
docker-compose down
```

데이터(갤러리, 결과 이미지) 초기화:
```bash
docker-compose down -v   # -v 옵션으로 볼륨도 삭제
```

---

## 5. Fast Style Transfer 모델 다운로드

Fast Style Transfer 및 웹캠 실시간 변환 기능을 사용하려면 사전학습된 모델 파일이 필요합니다.

### 방법 A: 스크립트 사용 (Linux / macOS / Git Bash)

```bash
cd backend
bash download_models.sh
```

8개의 `.t7` 모델 파일이 `backend/models/` 디렉토리에 다운로드됩니다.

### 방법 B: 수동 다운로드 (Windows / wget 없는 환경)

아래 URL에서 파일을 다운로드하여 `backend/models/` 폴더에 저장합니다:

| 파일명 | 다운로드 URL |
|--------|-------------|
| starry_night.t7 | https://cs.stanford.edu/people/jcjohns/fast-neural-style/models/instance_norm/starry_night.t7 |
| the_scream.t7 | https://cs.stanford.edu/people/jcjohns/fast-neural-style/models/instance_norm/the_scream.t7 |
| la_muse.t7 | https://cs.stanford.edu/people/jcjohns/fast-neural-style/models/instance_norm/la_muse.t7 |
| mosaic.t7 | https://cs.stanford.edu/people/jcjohns/fast-neural-style/models/instance_norm/mosaic.t7 |
| candy.t7 | https://cs.stanford.edu/people/jcjohns/fast-neural-style/models/instance_norm/candy.t7 |
| udnie.t7 | https://cs.stanford.edu/people/jcjohns/fast-neural-style/models/instance_norm/udnie.t7 |
| rain_princess.t7 | https://cs.stanford.edu/people/jcjohns/fast-neural-style/models/instance_norm/rain_princess.t7 |
| feathers.t7 | https://cs.stanford.edu/people/jcjohns/fast-neural-style/models/instance_norm/feathers.t7 |

PowerShell로 다운로드하는 예시:
```powershell
$models = @{
    "starry_night" = "instance_norm/starry_night.t7"
    "the_scream"   = "instance_norm/the_scream.t7"
    "la_muse"      = "instance_norm/la_muse.t7"
    "mosaic"       = "instance_norm/mosaic.t7"
    "candy"        = "instance_norm/candy.t7"
    "udnie"        = "instance_norm/udnie.t7"
    "rain_princess"= "instance_norm/rain_princess.t7"
    "feathers"     = "instance_norm/feathers.t7"
}

New-Item -ItemType Directory -Force -Path backend\models

foreach ($name in $models.Keys) {
    $url = "https://cs.stanford.edu/people/jcjohns/fast-neural-style/models/$($models[$name])"
    Write-Host "Downloading $name..."
    Invoke-WebRequest -Uri $url -OutFile "backend\models\$name.t7"
}
```

### 확인

```bash
ls backend/models/
# 출력: candy.t7  feathers.t7  la_muse.t7  mosaic.t7  rain_princess.t7  starry_night.t7  the_scream.t7  udnie.t7
```

> **모델 미다운로드 시**: Gatys Style Transfer와 학습 대시보드는 정상 동작합니다. Fast Style Transfer와 웹캠 실시간 변환만 사용 불가합니다.

---

## 6. 프리셋 스타일 이미지 준비

Gatys Style Transfer 페이지에서 프리셋 스타일을 사용하려면 `backend/presets/` 폴더에 스타일 이미지를 준비합니다.

필요한 파일명:
- `starry_night.jpg` — 별이 빛나는 밤 (고흐)
- `the_scream.jpg` — 절규 (뭉크)
- `composition_vii.jpg` — 구성 VII (칸딘스키)
- `great_wave.jpg` — 가나가와 해변의 큰 파도 (호쿠사이)
- `weeping_woman.jpg` — 우는 여인 (피카소)
- `water_lilies.jpg` — 수련 (모네)

> 인터넷에서 해당 작품의 이미지를 검색하여 JPG 형식으로 저장하세요. 400~800px 크기면 충분합니다.

```bash
mkdir -p backend/presets
# 이미지 파일을 backend/presets/ 에 복사
```

> **프리셋 미설정 시**: 프리셋 선택 UI에 이미지가 표시되지 않을 뿐, 직접 스타일 이미지를 업로드하여 사용하면 됩니다.

---

## 7. 테스트 실행

### 백엔드 테스트

```bash
# 가상환경 활성화 상태에서
cd backend
python -m pytest tests/ -v
```

정상 실행 시:
```
tests/test_api.py::test_health_check PASSED
tests/test_api.py::test_gallery_list_empty PASSED
tests/test_api.py::test_gallery_item_not_found PASSED
tests/test_api.py::test_presets_list PASSED
tests/test_api.py::test_preset_image_not_found PASSED
tests/test_api.py::test_vgg19_info PASSED
tests/test_api.py::test_models_list PASSED
tests/test_feature_extractor.py::TestGramMatrix::test_output_shape PASSED
tests/test_feature_extractor.py::TestGramMatrix::test_symmetric PASSED
tests/test_feature_extractor.py::TestVGG19FeatureExtractor::test_extract_style_features PASSED
tests/test_feature_extractor.py::TestVGG19FeatureExtractor::test_extract_content_feature PASSED
tests/test_image_processor.py::TestValidateImageFile::test_valid_jpeg PASSED
...
20 passed
```

### 프론트엔드 빌드 검증

```bash
cd frontend
npm run build
```

`dist/` 폴더에 프로덕션 빌드가 생성되면 성공입니다.

---

## 8. 기능별 사용법

### Gatys Style Transfer (스타일 변환)

1. 좌측 메뉴에서 **스타일 변환** 클릭
2. **콘텐츠 이미지** 업로드 (변환할 사진)
3. **스타일 이미지** 업로드 또는 프리셋에서 선택
4. 파라미터 조정 (기본값 사용 가능):
   - Content Weight (α): 콘텐츠 보존 강도
   - Style Weight (β): 스타일 적용 강도
   - Steps: 최적화 반복 횟수 (많을수록 품질↑, 시간↑)
   - Max Size: 출력 이미지 최대 크기 (px)
5. **변환 시작** 클릭
6. 실시간 진행률 및 프리뷰 확인
7. 완료 시 결과 이미지 다운로드 가능
8. 결과는 자동으로 갤러리에 저장됨

> **참고**: CPU 환경에서 300 steps 기준 약 2~5분 소요됩니다.

### Fast Style Transfer (Fast 변환)

1. 좌측 메뉴에서 **Fast 변환** 클릭
2. 이미지 업로드
3. 하단 스타일 모델 중 하나 선택
4. **스타일 적용** 클릭
5. 1초 이내에 결과 확인 및 다운로드

> 사전학습 모델 파일(.t7)이 필요합니다 (5번 섹션 참조).

### 웹캠 실시간 변환

1. 좌측 메뉴에서 **실시간** 클릭
2. **시작** 클릭 → 웹캠 권한 허용
3. 스타일 선택 (키보드 숫자 1~6 단축키 사용 가능)
4. 좌측: 원본 웹캠, 우측: 스타일 적용 결과
5. **스냅샷** 버튼으로 현재 프레임 저장
6. **정지** 버튼으로 종료

> 웹캠 해상도는 320x240으로 고정되며, 브라우저에서 카메라 접근 권한이 필요합니다.

### 학습 대시보드

1. 좌측 메뉴에서 **학습** 클릭
2. **네트워크 구조** 탭: VGG19 레이어 구조 시각화
3. **Feature Maps** 탭: 이미지를 업로드하고 특정 레이어의 Feature Map 확인
4. **Gram Matrix** 탭: 스타일 표현에 사용되는 Gram Matrix 시각화
5. **Loss Chart** 탭: 최근 Gatys 변환의 Loss 변화 그래프

### 갤러리

1. 좌측 메뉴에서 **갤러리** 클릭
2. 변환 결과가 자동으로 표시됨
3. 필터: 전체 / Gatys / Fast
4. 카드 클릭: 상세 모달 (원본, 스타일, 결과 비교)
5. 삭제 버튼: 갤러리에서 제거

---

## 9. 문제 해결

### 포트 충돌

```
ERROR: [Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000)
```

다른 프로세스가 포트를 사용 중입니다. 해결 방법:

```bash
# 사용 중인 프로세스 확인 (Windows)
netstat -ano | findstr :8000

# 해당 PID 종료
taskkill /PID <PID> /F
```

또는 다른 포트로 실행:
```bash
uvicorn main:app --reload --port 8001
```

### VGG19 모델 다운로드 실패

첫 실행 시 VGG19 모델(~550MB)이 자동 다운로드됩니다. 네트워크 문제로 실패하면:

```bash
# 수동 다운로드
python -c "from torchvision import models; models.vgg19(weights=models.VGG19_Weights.DEFAULT)"
```

### pip install 오류 (torch)

PyTorch 설치가 오래 걸리거나 실패하면, CPU 전용 버전을 직접 설치:

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r backend/requirements.txt
```

### npm install 오류

Node.js 버전이 18 미만이면 실패할 수 있습니다:
```bash
node --version  # v18+ 확인
```

npm 캐시 문제 시:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 웹캠 접근 불가

- HTTPS 또는 localhost에서만 카메라 접근이 가능합니다
- 브라우저 설정에서 카메라 권한이 차단되어 있는지 확인하세요
- 다른 프로그램이 카메라를 점유 중인지 확인하세요

### CORS 에러

프론트엔드와 백엔드의 포트가 다르면 CORS 에러가 발생할 수 있습니다. `backend/config.py`에서 허용 Origin을 추가하세요:

```python
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",  # 필요 시 추가
]
```

---

## 10. 환경 변수 설정

| 변수명 | 기본값 | 설명 |
|--------|--------|------|
| `DEVICE` | `cpu` | PyTorch 디바이스 (cpu / cuda) |
| `MAX_IMAGE_SIZE` | `400` | 처리할 이미지의 최대 크기 (px) |

설정 방법:

```bash
# Linux / macOS
export DEVICE=cpu
export MAX_IMAGE_SIZE=400

# Windows (PowerShell)
$env:DEVICE = "cpu"
$env:MAX_IMAGE_SIZE = "400"

# Windows (CMD)
set DEVICE=cpu
set MAX_IMAGE_SIZE=400
```

또는 `.env` 파일 사용 (직접 생성):
```
DEVICE=cpu
MAX_IMAGE_SIZE=400
```

---

## 빠른 참조: 한 줄 요약

```bash
# 전체 설정 + 실행 (Linux/macOS)
git clone https://github.com/quirinal36/ai-style-studio.git && cd ai-style-studio && \
python -m venv venv && source venv/bin/activate && \
pip install -r backend/requirements.txt && \
cd backend && bash download_models.sh && cd .. && \
cd frontend && npm install && cd .. && \
(cd backend && uvicorn main:app --reload --port 8000 &) && \
(cd frontend && npm run dev)
```

브라우저에서 **http://localhost:5173** 접속!

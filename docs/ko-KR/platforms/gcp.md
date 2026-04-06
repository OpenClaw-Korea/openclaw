---
summary: "GCP Compute Engine VM에서 OpenClaw 게이트웨이를 24/7 실행 (Docker) 영구 상태 포함"
read_when:
  - GCP에서 OpenClaw를 24/7 실행하고 싶을 때
  - 자체 VM에서 프로덕션급, 항상 켜진 게이트웨이를 원할 때
  - 지속성, 바이너리 및 재시작 동작에 대한 완전한 제어를 원할 때
title: "GCP"
---

# OpenClaw on GCP Compute Engine (Docker, 프로덕션 VPS 가이드)

## 목표

Docker를 사용하여 GCP Compute Engine VM에서 영구 상태, 내장 바이너리, 안전한 재시작 동작을 갖춘 영구적인 OpenClaw 게이트웨이를 실행합니다.

"월 약 $5-12로 OpenClaw 24/7"을 원한다면 Google Cloud에서 안정적인 설정입니다.
가격은 머신 타입과 리전에 따라 다릅니다. 워크로드에 맞는 가장 작은 VM을 선택하고 OOM이 발생하면 확장하세요.

## 우리가 하는 일 (간단한 용어로)?

- GCP 프로젝트 생성 및 결제 활성화
- Compute Engine VM 생성
- Docker 설치 (격리된 앱 런타임)
- Docker에서 OpenClaw 게이트웨이 시작
- 호스트에 `~/.openclaw` + `~/.openclaw/workspace` 유지 (재시작/재빌드에도 유지)
- SSH 터널을 통해 노트북에서 Control UI 액세스

게이트웨이는 다음을 통해 액세스할 수 있습니다:

- 노트북에서 SSH 포트 포워딩
- 방화벽과 토큰을 직접 관리하는 경우 직접 포트 노출

이 가이드는 GCP Compute Engine에서 Debian을 사용합니다.
Ubuntu도 작동합니다. 패키지를 적절히 매핑하세요.
일반 Docker 흐름은 [Docker](/install/docker)를 참조하세요.

---

## 빠른 경로 (숙련된 운영자)

1. GCP 프로젝트 생성 + Compute Engine API 활성화
2. Compute Engine VM 생성 (e2-small, Debian 12, 20GB)
3. VM에 SSH 접속
4. Docker 설치
5. OpenClaw 저장소 복제
6. 영구 호스트 디렉토리 생성
7. `.env` 및 `docker-compose.yml` 설정
8. 필요한 바이너리 내장, 빌드 및 실행

---

## 필요 사항

- GCP 계정 (e2-micro에 대한 무료 티어 자격)
- gcloud CLI 설치 (또는 Cloud Console 사용)
- 노트북에서 SSH 액세스
- SSH + 복사/붙여넣기에 대한 기본 편안함
- 약 20-30분
- Docker 및 Docker Compose
- 모델 인증 자격 증명
- 선택사항 프로바이더 자격 증명
  - WhatsApp QR
  - Telegram 봇 토큰
  - Gmail OAuth

---

## 1) gcloud CLI 설치 (또는 Console 사용)

**옵션 A: gcloud CLI** (자동화에 권장)

https://cloud.google.com/sdk/docs/install에서 설치

초기화 및 인증:

```bash
gcloud init
gcloud auth login
```

**옵션 B: Cloud Console**

모든 단계는 https://console.cloud.google.com의 웹 UI를 통해 수행할 수 있습니다.

---

## 2) GCP 프로젝트 생성

**CLI:**

```bash
gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
gcloud config set project my-openclaw-project
```

https://console.cloud.google.com/billing에서 결제 활성화 (Compute Engine에 필요).

Compute Engine API 활성화:

```bash
gcloud services enable compute.googleapis.com
```

**Console:**

1. IAM & Admin > Create Project로 이동
2. 이름 지정 및 생성
3. 프로젝트에 대한 결제 활성화
4. APIs & Services > Enable APIs로 이동 > "Compute Engine API" 검색 > 활성화

---

## 3) VM 생성

**머신 타입:**

| 타입     | 사양                   | 비용           | 참고사항         |
| -------- | ---------------------- | -------------- | ---------------- |
| e2-small | 2 vCPU, 2GB RAM        | ~$12/월        | 권장             |
| e2-micro | 2 vCPU (공유), 1GB RAM | 무료 티어 자격 | 부하 시 OOM 가능 |

**CLI:**

```bash
gcloud compute instances create openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --boot-disk-size=20GB \
  --image-family=debian-12 \
  --image-project=debian-cloud
```

**Console:**

1. Compute Engine > VM instances > Create instance로 이동
2. Name: `openclaw-gateway`
3. Region: `us-central1`, Zone: `us-central1-a`
4. Machine type: `e2-small`
5. Boot disk: Debian 12, 20GB
6. 생성

---

## 4) VM에 SSH 접속

**CLI:**

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a
```

**Console:**

Compute Engine 대시보드에서 VM 옆의 "SSH" 버튼을 클릭합니다.

참고: VM 생성 후 SSH 키 전파에 1-2분이 걸릴 수 있습니다. 연결이 거부되면 대기 후 재시도하세요.

---

## 5) Docker 설치 (VM에서)

```bash
sudo apt-get update
sudo apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

그룹 변경을 적용하려면 로그아웃 후 다시 로그인:

```bash
exit
```

그런 다음 다시 SSH 접속:

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a
```

확인:

```bash
docker --version
docker compose version
```

---

## 6) OpenClaw 저장소 복제

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

이 가이드는 바이너리 지속성을 보장하기 위해 커스텀 이미지를 빌드한다고 가정합니다.

---

## 7) 영구 호스트 디렉토리 생성

Docker 컨테이너는 임시적입니다.
모든 장기 상태는 호스트에 저장되어야 합니다.

```bash
mkdir -p ~/.openclaw
mkdir -p ~/.openclaw/workspace
```

---

## 8) 환경 변수 설정

저장소 루트에 `.env` 생성.

```bash
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=change-me-now
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789

OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

GOG_KEYRING_PASSWORD=change-me-now
XDG_CONFIG_HOME=/home/node/.openclaw
```

강력한 시크릿 생성:

```bash
openssl rand -hex 32
```

**이 파일을 커밋하지 마세요.**

---

## 9) Docker Compose 설정

`docker-compose.yml` 생성 또는 업데이트.

```yaml
services:
  openclaw-gateway:
    image: ${OPENCLAW_IMAGE}
    build: .
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - HOME=/home/node
      - NODE_ENV=production
      - TERM=xterm-256color
      - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
      - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
      - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
      - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
      - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
      - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
    volumes:
      - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
      - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
    ports:
      # 권장: VM에서 게이트웨이를 루프백 전용으로 유지; SSH 터널을 통해 액세스.
      # 공개적으로 노출하려면 `127.0.0.1:` 접두사를 제거하고 적절히 방화벽 설정.
      - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"

      # 선택사항: 이 VM에 대해 iOS/Android 노드를 실행하고 Canvas 호스트가 필요한 경우에만.
      # 공개적으로 노출하는 경우 /gateway/security를 읽고 적절히 방화벽 설정.
      # - "18793:18793"
    command:
      [
        "node",
        "dist/index.js",
        "gateway",
        "--bind",
        "${OPENCLAW_GATEWAY_BIND}",
        "--port",
        "${OPENCLAW_GATEWAY_PORT}",
      ]
```

---

## 10) 이미지에 필요한 바이너리 내장 (중요)

실행 중인 컨테이너 내부에 바이너리를 설치하는 것은 함정입니다.
런타임에 설치된 모든 것은 재시작 시 손실됩니다.

스킬에 필요한 모든 외부 바이너리는 이미지 빌드 시간에 설치되어야 합니다.

아래 예제는 세 가지 일반적인 바이너리만 보여줍니다:

- Gmail 액세스를 위한 `gog`
- Google Places를 위한 `goplaces`
- WhatsApp를 위한 `wacli`

이는 예제이며 완전한 목록이 아닙니다.
동일한 패턴을 사용하여 필요한 만큼 많은 바이너리를 설치할 수 있습니다.

나중에 추가 바이너리에 의존하는 새 스킬을 추가하는 경우:

1. Dockerfile 업데이트
2. 이미지 재빌드
3. 컨테이너 재시작

**Dockerfile 예제**

```dockerfile
FROM node:22-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# 예제 바이너리 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# 예제 바이너리 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# 예제 바이너리 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# 동일한 패턴을 사용하여 아래에 더 많은 바이너리 추가

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

---

## 11) 빌드 및 실행

```bash
docker compose build
docker compose up -d openclaw-gateway
```

바이너리 확인:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

예상 출력:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

---

## 12) 게이트웨이 확인

```bash
docker compose logs -f openclaw-gateway
```

성공:

```
[gateway] listening on ws://0.0.0.0:18789
```

---

## 13) 노트북에서 액세스

게이트웨이 포트를 전달하는 SSH 터널 생성:

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
```

브라우저에서 열기:

`http://127.0.0.1:18789/`

게이트웨이 토큰을 붙여넣습니다.

---

## 무엇이 어디에 유지되는지 (진실의 근원)

OpenClaw는 Docker에서 실행되지만 Docker는 진실의 근원이 아닙니다.
모든 장기 상태는 재시작, 재빌드 및 재부팅에도 유지되어야 합니다.

| 구성 요소             | 위치                              | 지속성 메커니즘        | 참고사항                    |
| --------------------- | --------------------------------- | ---------------------- | --------------------------- |
| 게이트웨이 설정       | `/home/node/.openclaw/`           | 호스트 볼륨 마운트     | `openclaw.json`, 토큰 포함  |
| 모델 인증 프로필      | `/home/node/.openclaw/`           | 호스트 볼륨 마운트     | OAuth 토큰, API 키          |
| 스킬 설정             | `/home/node/.openclaw/skills/`    | 호스트 볼륨 마운트     | 스킬 레벨 상태              |
| 에이전트 워크스페이스 | `/home/node/.openclaw/workspace/` | 호스트 볼륨 마운트     | 코드 및 에이전트 아티팩트   |
| WhatsApp 세션         | `/home/node/.openclaw/`           | 호스트 볼륨 마운트     | QR 로그인 보존              |
| Gmail 키링            | `/home/node/.openclaw/`           | 호스트 볼륨 + 비밀번호 | `GOG_KEYRING_PASSWORD` 필요 |
| 외부 바이너리         | `/usr/local/bin/`                 | Docker 이미지          | 빌드 시간에 내장되어야 함   |
| Node 런타임           | 컨테이너 파일시스템               | Docker 이미지          | 모든 이미지 빌드 시 재빌드  |
| OS 패키지             | 컨테이너 파일시스템               | Docker 이미지          | 런타임에 설치하지 마세요    |
| Docker 컨테이너       | 임시                              | 재시작 가능            | 안전하게 삭제 가능          |

---

## 업데이트

VM에서 OpenClaw를 업데이트하려면:

```bash
cd ~/openclaw
git pull
docker compose build
docker compose up -d
```

---

## 문제 해결

**SSH 연결 거부**

VM 생성 후 SSH 키 전파에 1-2분이 걸릴 수 있습니다. 대기 후 재시도하세요.

**OS Login 문제**

OS Login 프로필 확인:

```bash
gcloud compute os-login describe-profile
```

계정에 필요한 IAM 권한(Compute OS Login 또는 Compute OS Admin Login)이 있는지 확인하세요.

**메모리 부족 (OOM)**

e2-micro를 사용 중이고 OOM이 발생하는 경우 e2-small 또는 e2-medium으로 업그레이드:

```bash
# 먼저 VM 중지
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# 머신 타입 변경
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# VM 시작
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## 서비스 계정 (보안 모범 사례)

개인 사용의 경우 기본 사용자 계정이 잘 작동합니다.

자동화 또는 CI/CD 파이프라인의 경우 최소 권한으로 전용 서비스 계정을 생성합니다:

1. 서비스 계정 생성:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Compute Instance Admin 역할 부여 (또는 더 좁은 커스텀 역할):
   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

자동화에 Owner 역할을 사용하지 마세요. 최소 권한 원칙을 사용하세요.

IAM 역할 세부 정보는 https://cloud.google.com/iam/docs/understanding-roles를 참조하세요.

---

## 다음 단계

- 메시징 채널 설정: [채널](/channels)
- 로컬 장치를 노드로 페어링: [노드](/nodes)
- 게이트웨이 설정: [게이트웨이 설정](/gateway/configuration)

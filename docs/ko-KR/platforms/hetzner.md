---
summary: "저렴한 Hetzner VPS에서 Docker를 사용하여 OpenClaw 게이트웨이를 24/7 실행 (영구 상태 및 내장 바이너리 포함)"
read_when:
  - 클라우드 VPS에서 OpenClaw를 24/7 실행하고 싶을 때 (노트북이 아닌)
  - 자체 VPS에서 프로덕션급, 항상 켜져 있는 게이트웨이를 원할 때
  - 영속성, 바이너리 및 재시작 동작을 완전히 제어하고 싶을 때
  - Hetzner 또는 유사한 프로바이더에서 Docker로 OpenClaw를 실행할 때
title: "Hetzner"
---

# Hetzner에서 OpenClaw 실행 (Docker, 프로덕션 VPS 가이드)

## 목표

Docker를 사용하여 Hetzner VPS에서 영구적인 OpenClaw 게이트웨이를 실행하고, 영속적인 상태, 내장 바이너리 및 안전한 재시작 동작을 제공합니다.

"월 ~$5로 OpenClaw 24/7 운영"을 원한다면, 이것이 가장 간단하고 신뢰할 수 있는 설정입니다.
Hetzner 가격은 변경될 수 있으므로 가장 작은 Debian/Ubuntu VPS를 선택하고 OOM이 발생하면 확장하세요.

## 무엇을 하는 건가요 (간단한 설명)?

- 작은 Linux 서버(Hetzner VPS) 임대
- Docker 설치 (격리된 앱 런타임)
- Docker에서 OpenClaw 게이트웨이 시작
- `~/.openclaw` + `~/.openclaw/workspace`를 호스트에 영속화 (재시작/재빌드 시에도 유지)
- 노트북에서 SSH 터널을 통해 Control UI 액세스

게이트웨이는 다음을 통해 액세스할 수 있습니다:

- 노트북에서 SSH 포트 포워딩
- 직접 포트 노출 (방화벽과 토큰을 직접 관리하는 경우)

이 가이드는 Hetzner에서 Ubuntu 또는 Debian을 가정합니다.
다른 Linux VPS를 사용하는 경우 패키지를 적절히 매핑하세요.
일반적인 Docker 흐름은 [Docker](/install/docker)를 참조하세요.

---

## 빠른 경로 (숙련된 운영자)

1. Hetzner VPS 프로비저닝
2. Docker 설치
3. OpenClaw 저장소 복제
4. 영구 호스트 디렉터리 생성
5. `.env` 및 `docker-compose.yml` 설정
6. 필수 바이너리를 이미지에 포함
7. `docker compose up -d`
8. 영속성 및 게이트웨이 액세스 확인

---

## 필요한 것

- 루트 액세스 권한이 있는 Hetzner VPS
- 노트북에서 SSH 액세스
- SSH + 복사/붙여넣기에 대한 기본적인 편안함
- 약 20분
- Docker 및 Docker Compose
- 모델 인증 자격 증명
- 선택적 프로바이더 자격 증명
  - WhatsApp QR
  - Telegram 봇 토큰
  - Gmail OAuth

---

## 1) VPS 프로비저닝

Hetzner에서 Ubuntu 또는 Debian VPS를 생성합니다.

루트로 연결:

```bash
ssh root@YOUR_VPS_IP
```

이 가이드는 VPS가 상태를 유지한다고 가정합니다.
일회용 인프라로 취급하지 마세요.

---

## 2) Docker 설치 (VPS에서)

```bash
apt-get update
apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sh
```

확인:

```bash
docker --version
docker compose version
```

---

## 3) OpenClaw 저장소 복제

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

이 가이드는 바이너리 영속성을 보장하기 위해 커스텀 이미지를 빌드한다고 가정합니다.

---

## 4) 영구 호스트 디렉터리 생성

Docker 컨테이너는 임시적입니다.
모든 장기 상태는 호스트에 있어야 합니다.

```bash
mkdir -p /root/.openclaw
mkdir -p /root/.openclaw/workspace

# 컨테이너 사용자(uid 1000)에게 소유권 설정:
chown -R 1000:1000 /root/.openclaw
chown -R 1000:1000 /root/.openclaw/workspace
```

---

## 5) 환경 변수 설정

저장소 루트에 `.env`를 생성합니다.

```bash
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=change-me-now
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789

OPENCLAW_CONFIG_DIR=/root/.openclaw
OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

GOG_KEYRING_PASSWORD=change-me-now
XDG_CONFIG_HOME=/home/node/.openclaw
```

강력한 시크릿 생성:

```bash
openssl rand -hex 32
```

**이 파일을 커밋하지 마세요.**

---

## 6) Docker Compose 설정

`docker-compose.yml`을 생성하거나 업데이트합니다.

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
      # 권장: VPS에서 게이트웨이를 루프백 전용으로 유지하고 SSH 터널을 통해 액세스합니다.
      # 공개적으로 노출하려면 `127.0.0.1:` 접두사를 제거하고 방화벽을 적절히 설정하세요.
      - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"

      # 선택 사항: 이 VPS에 대해 iOS/Android 노드를 실행하고 Canvas 호스트가 필요한 경우에만.
      # 공개적으로 노출하는 경우 /gateway/security를 읽고 방화벽을 적절히 설정하세요.
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

## 7) 필수 바이너리를 이미지에 포함 (중요)

실행 중인 컨테이너 내부에 바이너리를 설치하는 것은 함정입니다.
런타임에 설치된 모든 것은 재시작 시 손실됩니다.

스킬에서 필요한 모든 외부 바이너리는 이미지 빌드 시점에 설치되어야 합니다.

아래 예제는 세 가지 일반적인 바이너리만 보여줍니다:

- Gmail 액세스를 위한 `gog`
- Google Places를 위한 `goplaces`
- WhatsApp을 위한 `wacli`

이것들은 예제일 뿐이며 완전한 목록이 아닙니다.
동일한 패턴을 사용하여 필요한 만큼 바이너리를 설치할 수 있습니다.

나중에 추가 바이너리가 필요한 새 스킬을 추가하는 경우 다음을 수행해야 합니다:

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

## 8) 빌드 및 실행

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

## 9) 게이트웨이 확인

```bash
docker compose logs -f openclaw-gateway
```

성공:

```
[gateway] listening on ws://0.0.0.0:18789
```

노트북에서:

```bash
ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
```

열기:

`http://127.0.0.1:18789/`

게이트웨이 토큰을 붙여넣습니다.

---

## 무엇이 어디에 영속화되는가 (진실의 원천)

OpenClaw는 Docker에서 실행되지만, Docker는 진실의 원천이 아닙니다.
모든 장기 상태는 재시작, 재빌드 및 재부팅을 견뎌야 합니다.

| 구성 요소          | 위치                              | 영속성 메커니즘        | 참고사항                    |
| ------------------ | --------------------------------- | ---------------------- | --------------------------- |
| 게이트웨이 설정    | `/home/node/.openclaw/`           | 호스트 볼륨 마운트     | `openclaw.json`, 토큰 포함  |
| 모델 인증 프로필   | `/home/node/.openclaw/`           | 호스트 볼륨 마운트     | OAuth 토큰, API 키          |
| 스킬 설정          | `/home/node/.openclaw/skills/`    | 호스트 볼륨 마운트     | 스킬 레벨 상태              |
| 에이전트 작업 공간 | `/home/node/.openclaw/workspace/` | 호스트 볼륨 마운트     | 코드 및 에이전트 아티팩트   |
| WhatsApp 세션      | `/home/node/.openclaw/`           | 호스트 볼륨 마운트     | QR 로그인 보존              |
| Gmail 키링         | `/home/node/.openclaw/`           | 호스트 볼륨 + 비밀번호 | `GOG_KEYRING_PASSWORD` 필요 |
| 외부 바이너리      | `/usr/local/bin/`                 | Docker 이미지          | 빌드 시점에 포함되어야 함   |
| Node 런타임        | 컨테이너 파일시스템               | Docker 이미지          | 이미지 빌드마다 재빌드      |
| OS 패키지          | 컨테이너 파일시스템               | Docker 이미지          | 런타임에 설치하지 마세요    |
| Docker 컨테이너    | 임시                              | 재시작 가능            | 안전하게 파괴 가능          |

---
summary: "OpenClaw를 위한 선택적 Docker 기반 설정 및 온보딩"
read_when:
  - 로컬 설치 대신 컨테이너화된 게이트웨이를 원할 때
  - Docker 플로우를 검증하려는 경우
title: "Docker"
---

# Docker (선택사항)

Docker는 **선택사항**입니다. 컨테이너화된 게이트웨이를 원하거나 Docker 플로우를 검증하려는 경우에만 사용하세요.

## Docker가 나에게 적합한가요?

- **예**: 격리된 일회용 게이트웨이 환경을 원하거나 로컬 설치 없이 호스트에서 OpenClaw를 실행하고 싶을 때.
- **아니오**: 자체 머신에서 실행하고 가장 빠른 개발 루프를 원할 때. 대신 일반 설치 플로우를 사용하세요.
- **샌드박싱 참고사항**: 에이전트 샌드박싱도 Docker를 사용하지만, 전체 게이트웨이를 Docker에서 실행할 필요는 **없습니다**. [샌드박싱](/ko-KR/gateway/sandboxing) 참조.

이 가이드는 다음을 다룹니다:

- 컨테이너화된 게이트웨이 (Docker의 전체 OpenClaw)
- 세션별 에이전트 샌드박스 (호스트 게이트웨이 + Docker 격리된 에이전트 도구)

샌드박싱 세부 정보: [샌드박싱](/ko-KR/gateway/sandboxing)

## 요구사항

- Docker Desktop (또는 Docker Engine) + Docker Compose v2
- 이미지 + 로그를 위한 충분한 디스크

## 컨테이너화된 게이트웨이 (Docker Compose)

### 빠른 시작 (권장)

레포지토리 루트에서:

```bash
./docker-setup.sh
```

이 스크립트는:

- 게이트웨이 이미지 빌드
- 온보딩 마법사 실행
- 선택적 프로바이더 설정 힌트 출력
- Docker Compose를 통해 게이트웨이 시작
- 게이트웨이 토큰을 생성하고 `.env`에 작성

선택적 환경 변수:

- `OPENCLAW_DOCKER_APT_PACKAGES` — 빌드 중 추가 apt 패키지 설치
- `OPENCLAW_EXTRA_MOUNTS` — 추가 호스트 바인드 마운트 추가
- `OPENCLAW_HOME_VOLUME` — 명명된 볼륨에 `/home/node` 유지

완료 후:

- 브라우저에서 `http://127.0.0.1:18789/`를 엽니다.
- 토큰을 Control UI에 붙여넣습니다 (설정 → 토큰).
- 토큰화된 URL이 다시 필요하신가요? `docker compose run --rm openclaw-cli dashboard --no-open`을 실행하세요.

호스트에 설정/작업 공간을 작성합니다:

- `~/.openclaw/`
- `~/.openclaw/workspace`

VPS에서 실행 중이신가요? [Hetzner (Docker VPS)](/ko-KR/platforms/hetzner) 참조.

### 수동 플로우 (compose)

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard
docker compose up -d openclaw-gateway
```

참고: 레포지토리 루트에서 `docker compose ...`를 실행하세요. `OPENCLAW_EXTRA_MOUNTS` 또는 `OPENCLAW_HOME_VOLUME`을 활성화한 경우, 설정 스크립트가 `docker-compose.extra.yml`을 작성합니다; 다른 곳에서 Compose를 실행할 때 포함하세요:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml <command>
```

### Control UI 토큰 + 페어링 (Docker)

"unauthorized" 또는 "disconnected (1008): pairing required"가 표시되면, 새로운 대시보드 링크를 가져오고 브라우저 장치를 승인하세요:

```bash
docker compose run --rm openclaw-cli dashboard --no-open
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```

자세한 내용: [대시보드](/ko-KR/web/dashboard), [장치](/ko-KR/cli/devices).

### 추가 마운트 (선택사항)

추가 호스트 디렉토리를 컨테이너에 마운트하려면, `docker-setup.sh`를 실행하기 전에 `OPENCLAW_EXTRA_MOUNTS`를 설정하세요. 이는 쉼표로 구분된 Docker 바인드 마운트 목록을 허용하고 `docker-compose.extra.yml`을 생성하여 `openclaw-gateway`와 `openclaw-cli` 모두에 적용합니다.

예제:

```bash
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

참고:

- macOS/Windows에서는 경로를 Docker Desktop과 공유해야 합니다.
- `OPENCLAW_EXTRA_MOUNTS`를 편집하는 경우, 추가 compose 파일을 재생성하려면 `docker-setup.sh`를 다시 실행하세요.
- `docker-compose.extra.yml`은 생성됩니다. 수동으로 편집하지 마세요.

### 전체 컨테이너 홈 유지 (선택사항)

컨테이너 재생성 시 `/home/node`를 유지하려면, `OPENCLAW_HOME_VOLUME`을 통해 명명된 볼륨을 설정하세요. 이는 Docker 볼륨을 생성하고 `/home/node`에 마운트하며, 표준 설정/작업 공간 바인드 마운트를 유지합니다. 여기서는 명명된 볼륨을 사용하세요 (바인드 경로가 아님); 바인드 마운트의 경우 `OPENCLAW_EXTRA_MOUNTS`를 사용하세요.

예제:

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

추가 마운트와 결합할 수 있습니다:

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

참고:

- `OPENCLAW_HOME_VOLUME`을 변경하는 경우, 추가 compose 파일을 재생성하려면 `docker-setup.sh`를 다시 실행하세요.
- 명명된 볼륨은 `docker volume rm <name>`으로 제거될 때까지 유지됩니다.

### 추가 apt 패키지 설치 (선택사항)

이미지 내부에 시스템 패키지가 필요한 경우 (예: 빌드 도구 또는 미디어 라이브러리), `docker-setup.sh`를 실행하기 전에 `OPENCLAW_DOCKER_APT_PACKAGES`를 설정하세요. 이는 이미지 빌드 중에 패키지를 설치하므로 컨테이너가 삭제되어도 유지됩니다.

예제:

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="ffmpeg build-essential"
./docker-setup.sh
```

참고:

- 이는 공백으로 구분된 apt 패키지 이름 목록을 허용합니다.
- `OPENCLAW_DOCKER_APT_PACKAGES`를 변경하는 경우, 이미지를 다시 빌드하려면 `docker-setup.sh`를 다시 실행하세요.

### 파워 유저 / 완전한 기능 컨테이너 (opt-in)

기본 Docker 이미지는 **보안 우선**이며 비루트 `node` 사용자로 실행됩니다. 이는 공격 표면을 작게 유지하지만, 다음을 의미합니다:

- 런타임에 시스템 패키지 설치 불가
- 기본적으로 Homebrew 없음
- 번들된 Chromium/Playwright 브라우저 없음

더 완전한 기능의 컨테이너를 원하는 경우, 다음 opt-in 노브를 사용하세요:

1. **`/home/node` 유지**하여 브라우저 다운로드 및 도구 캐시가 유지되도록 합니다:

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

2. **시스템 의존성을 이미지에 베이크** (반복 가능 + 영구적):

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"
./docker-setup.sh
```

3. **`npx` 없이 Playwright 브라우저 설치** (npm 오버라이드 충돌 방지):

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Playwright가 시스템 의존성을 설치해야 하는 경우, 런타임에 `--with-deps`를 사용하는 대신 `OPENCLAW_DOCKER_APT_PACKAGES`로 이미지를 다시 빌드하세요.

4. **Playwright 브라우저 다운로드 유지**:

- `docker-compose.yml`에서 `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`를 설정하세요.
- `OPENCLAW_HOME_VOLUME`을 통해 `/home/node`가 유지되도록 하거나, `OPENCLAW_EXTRA_MOUNTS`를 통해 `/home/node/.cache/ms-playwright`를 마운트하세요.

### 권한 + EACCES

이미지는 `node` (uid 1000)로 실행됩니다. `/home/node/.openclaw`에서 권한 오류가 표시되면, 호스트 바인드 마운트가 uid 1000으로 소유되어 있는지 확인하세요.

예제 (Linux 호스트):

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

편의를 위해 root로 실행하기로 선택하면, 보안 트레이드오프를 수용하는 것입니다.

### 더 빠른 재빌드 (권장)

재빌드 속도를 높이려면, 의존성 레이어가 캐시되도록 Dockerfile을 정렬하세요. 이는 lockfile이 변경되지 않는 한 `pnpm install`을 다시 실행하는 것을 방지합니다:

```dockerfile
FROM node:22-bookworm

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

# Cache dependencies unless package metadata changes
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

### 채널 설정 (선택사항)

CLI 컨테이너를 사용하여 채널을 설정한 다음 필요한 경우 게이트웨이를 다시 시작하세요.

WhatsApp (QR):

```bash
docker compose run --rm openclaw-cli channels login
```

Telegram (봇 토큰):

```bash
docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"
```

Discord (봇 토큰):

```bash
docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
```

문서: [WhatsApp](/ko-KR/channels/whatsapp), [Telegram](/ko-KR/channels/telegram), [Discord](/ko-KR/channels/discord)

### OpenAI Codex OAuth (헤드리스 Docker)

마법사에서 OpenAI Codex OAuth를 선택하면, 브라우저 URL을 열고 `http://127.0.0.1:1455/auth/callback`에서 콜백을 캡처하려고 시도합니다. Docker 또는 헤드리스 설정에서 해당 콜백은 브라우저 오류를 표시할 수 있습니다. 착륙한 전체 리디렉션 URL을 복사하여 마법사에 다시 붙여넣어 인증을 완료하세요.

### 상태 확인

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### E2E 스모크 테스트 (Docker)

```bash
scripts/e2e/onboard-docker.sh
```

### QR 가져오기 스모크 테스트 (Docker)

```bash
pnpm test:docker:qr
```

### 참고사항

- 게이트웨이 바인드는 컨테이너 사용을 위해 기본적으로 `lan`입니다.
- Dockerfile CMD는 `--allow-unconfigured`를 사용합니다; `gateway.mode`가 `local`이 아닌 마운트된 설정도 여전히 시작됩니다. 가드를 강제하려면 CMD를 재정의하세요.
- 게이트웨이 컨테이너는 세션의 진실의 원천입니다 (`~/.openclaw/agents/<agentId>/sessions/`).

## 에이전트 샌드박스 (호스트 게이트웨이 + Docker 도구)

심층 분석: [샌드박싱](/ko-KR/gateway/sandboxing)

### 수행하는 작업

`agents.defaults.sandbox`가 활성화되면, **메인이 아닌 세션**은 Docker 컨테이너 내부에서 도구를 실행합니다. 게이트웨이는 호스트에 유지되지만, 도구 실행은 격리됩니다:

- scope: 기본적으로 `"agent"` (에이전트당 하나의 컨테이너 + 작업 공간)
- scope: 세션별 격리를 위한 `"session"`
- 범위당 작업 공간 폴더가 `/workspace`에 마운트됨
- 선택적 에이전트 작업 공간 액세스 (`agents.defaults.sandbox.workspaceAccess`)
- 허용/거부 도구 정책 (거부가 우선)
- 인바운드 미디어는 활성 샌드박스 작업 공간 (`media/inbound/*`)에 복사되어 도구가 읽을 수 있습니다 (`workspaceAccess: "rw"`를 사용하면, 이는 에이전트 작업 공간에 착륙합니다)

경고: `scope: "shared"`는 세션 간 격리를 비활성화합니다. 모든 세션이 하나의 컨테이너와 하나의 작업 공간을 공유합니다.

### 에이전트별 샌드박스 프로필 (멀티 에이전트)

멀티 에이전트 라우팅을 사용하는 경우, 각 에이전트는 샌드박스 + 도구 설정을 재정의할 수 있습니다: `agents.list[].sandbox` 및 `agents.list[].tools` (그리고 `agents.list[].tools.sandbox.tools`). 이를 통해 하나의 게이트웨이에서 혼합 액세스 수준을 실행할 수 있습니다:

- 전체 액세스 (개인 에이전트)
- 읽기 전용 도구 + 읽기 전용 작업 공간 (가족/업무 에이전트)
- 파일 시스템/셸 도구 없음 (공개 에이전트)

예제, 우선순위 및 문제 해결은 [멀티 에이전트 샌드박스 및 도구](/ko-KR/multi-agent-sandbox-tools)를 참조하세요.

### 기본 동작

- 이미지: `openclaw-sandbox:bookworm-slim`
- 에이전트당 하나의 컨테이너
- 에이전트 작업 공간 액세스: `workspaceAccess: "none"` (기본값)은 `~/.openclaw/sandboxes`를 사용합니다
  - `"ro"`는 샌드박스 작업 공간을 `/workspace`에 유지하고 에이전트 작업 공간을 읽기 전용으로 `/agent`에 마운트합니다 (`write`/`edit`/`apply_patch` 비활성화)
  - `"rw"`는 에이전트 작업 공간을 읽기/쓰기로 `/workspace`에 마운트합니다
- 자동 정리: 유휴 > 24h 또는 연령 > 7d
- 네트워크: 기본적으로 `none` (송신이 필요한 경우 명시적으로 opt-in)
- 기본 허용: `exec`, `process`, `read`, `write`, `edit`, `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- 기본 거부: `browser`, `canvas`, `nodes`, `cron`, `discord`, `gateway`

### 샌드박싱 활성화

`setupCommand`에 패키지를 설치할 계획인 경우 참고:

- 기본 `docker.network`는 `"none"` (송신 없음)입니다.
- `readOnlyRoot: true`는 패키지 설치를 차단합니다.
- `user`는 `apt-get`을 위해 root여야 합니다 (`user`를 생략하거나 `user: "0:0"`으로 설정).
  OpenClaw는 `setupCommand` (또는 docker 설정)가 변경될 때 컨테이너를 자동으로 재생성하지만, 컨테이너가 **최근에 사용된** 경우 (약 5분 이내)에는 재생성하지 않습니다. 핫 컨테이너는 정확한 `openclaw sandbox recreate ...` 명령과 함께 경고를 기록합니다.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared (agent is default)
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
        },
        prune: {
          idleHours: 24, // 0 disables idle pruning
          maxAgeDays: 7, // 0 disables max-age pruning
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

강화 노브는 `agents.defaults.sandbox.docker` 아래에 있습니다: `network`, `user`, `pidsLimit`, `memory`, `memorySwap`, `cpus`, `ulimits`, `seccompProfile`, `apparmorProfile`, `dns`, `extraHosts`.

멀티 에이전트: `agents.list[].sandbox.{docker,browser,prune}.*`를 통해 에이전트별로 `agents.defaults.sandbox.{docker,browser,prune}.*`를 재정의하세요 (`agents.defaults.sandbox.scope` / `agents.list[].sandbox.scope`가 `"shared"`인 경우 무시됨).

### 기본 샌드박스 이미지 빌드

```bash
scripts/sandbox-setup.sh
```

이는 `Dockerfile.sandbox`를 사용하여 `openclaw-sandbox:bookworm-slim`을 빌드합니다.

### 샌드박스 공통 이미지 (선택사항)

일반적인 빌드 도구 (Node, Go, Rust 등)가 포함된 샌드박스 이미지를 원하는 경우, 공통 이미지를 빌드하세요:

```bash
scripts/sandbox-common-setup.sh
```

이는 `openclaw-sandbox-common:bookworm-slim`을 빌드합니다. 사용하려면:

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "openclaw-sandbox-common:bookworm-slim" } },
    },
  },
}
```

### 샌드박스 브라우저 이미지

샌드박스 내부에서 브라우저 도구를 실행하려면, 브라우저 이미지를 빌드하세요:

```bash
scripts/sandbox-browser-setup.sh
```

이는 `Dockerfile.sandbox-browser`를 사용하여 `openclaw-sandbox-browser:bookworm-slim`을 빌드합니다. 컨테이너는 CDP가 활성화된 Chromium과 선택적 noVNC 관찰자 (Xvfb를 통한 headful)를 실행합니다.

참고:

- Headful (Xvfb)은 헤드리스에 비해 봇 차단을 줄입니다.
- `agents.defaults.sandbox.browser.headless=true`로 설정하여 헤드리스를 여전히 사용할 수 있습니다.
- 전체 데스크톱 환경 (GNOME)이 필요하지 않습니다; Xvfb가 디스플레이를 제공합니다.

설정 사용:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        browser: { enabled: true },
      },
    },
  },
}
```

커스텀 브라우저 이미지:

```json5
{
  agents: {
    defaults: {
      sandbox: { browser: { image: "my-openclaw-browser" } },
    },
  },
}
```

활성화되면, 에이전트는 다음을 받습니다:

- 샌드박스 브라우저 제어 URL (`browser` 도구용)
- noVNC URL (활성화되고 headless=false인 경우)

기억하세요: 도구에 대한 허용 목록을 사용하는 경우, `browser`를 추가하고 (그리고 거부에서 제거) 도구가 차단된 상태로 유지되지 않도록 하세요.
정리 규칙 (`agents.defaults.sandbox.prune`)은 브라우저 컨테이너에도 적용됩니다.

### 커스텀 샌드박스 이미지

자체 이미지를 빌드하고 설정이 가리키도록 하세요:

```bash
docker build -t my-openclaw-sbx -f Dockerfile.sandbox .
```

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "my-openclaw-sbx" } },
    },
  },
}
```

### 도구 정책 (허용/거부)

- `deny`가 `allow`보다 우선합니다.
- `allow`가 비어 있으면: 모든 도구 (거부 제외)를 사용할 수 있습니다.
- `allow`가 비어 있지 않으면: `allow`에 있는 도구만 사용할 수 있습니다 (거부 제외).

### 정리 전략

두 가지 노브:

- `prune.idleHours`: X시간 동안 사용되지 않은 컨테이너 제거 (0 = 비활성화)
- `prune.maxAgeDays`: X일보다 오래된 컨테이너 제거 (0 = 비활성화)

예제:

- 바쁜 세션을 유지하지만 수명을 제한: `idleHours: 24`, `maxAgeDays: 7`
- 절대 정리하지 않음: `idleHours: 0`, `maxAgeDays: 0`

### 보안 참고사항

- 하드 월은 **도구** (exec/read/write/edit/apply_patch)에만 적용됩니다.
- browser/camera/canvas와 같은 호스트 전용 도구는 기본적으로 차단됩니다.
- 샌드박스에서 `browser`를 허용하면 **격리가 깨집니다** (브라우저가 호스트에서 실행됨).

## 문제 해결

- 이미지 누락: [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)로 빌드하거나 `agents.defaults.sandbox.docker.image`를 설정하세요.
- 컨테이너가 실행되지 않음: 요청 시 세션별로 자동 생성됩니다.
- 샌드박스의 권한 오류: 마운트된 작업 공간 소유권과 일치하는 UID:GID로 `docker.user`를 설정하세요 (또는 작업 공간 폴더를 chown하세요).
- 커스텀 도구를 찾을 수 없음: OpenClaw는 `sh -lc` (로그인 셸)로 명령을 실행하며, 이는 `/etc/profile`을 소스로 하고 PATH를 재설정할 수 있습니다. 커스텀 도구 경로를 앞에 추가하려면 `docker.env.PATH`를 설정하세요 (예: `/custom/bin:/usr/local/share/npm-global/bin`), 또는 Dockerfile에서 `/etc/profile.d/` 아래에 스크립트를 추가하세요.

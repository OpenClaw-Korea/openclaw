---
title: Fly.io
description: Fly.io에 OpenClaw 배포
---

# Fly.io 배포

**목표:** 영구 스토리지, 자동 HTTPS, Discord/채널 액세스가 포함된 [Fly.io](https://fly.io) 머신에서 OpenClaw 게이트웨이를 실행합니다.

## 필요 사항

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) 설치
- Fly.io 계정 (무료 티어 작동)
- 모델 인증: Anthropic API 키 (또는 다른 프로바이더 키)
- 채널 자격 증명: Discord 봇 토큰, Telegram 토큰 등

## 초보자 빠른 경로

1. 저장소 복제 → `fly.toml` 커스터마이즈
2. 앱 + 볼륨 생성 → 시크릿 설정
3. `fly deploy`로 배포
4. SSH 접속하여 설정 생성 또는 Control UI 사용

## 1) Fly 앱 생성

```bash
# 저장소 복제
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 새 Fly 앱 생성 (자신의 이름 선택)
fly apps create my-openclaw

# 영구 볼륨 생성 (1GB면 충분)
fly volumes create openclaw_data --size 1 --region iad
```

**팁:** 가까운 리전을 선택하세요. 일반적인 옵션: `lhr` (런던), `iad` (버지니아), `sjc` (산호세).

## 2) fly.toml 설정

앱 이름과 요구 사항에 맞게 `fly.toml`을 편집합니다.

**보안 참고사항:** 기본 설정은 공개 URL을 노출합니다. 공개 IP가 없는 강화된 배포는 [비공개 배포](#private-deployment-hardened)를 참조하거나 `fly.private.toml`을 사용하세요.

```toml
app = "my-openclaw"  # 앱 이름
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  OPENCLAW_PREFER_PNPM = "1"
  OPENCLAW_STATE_DIR = "/data"
  NODE_OPTIONS = "--max-old-space-size=1536"

[processes]
  app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[vm]]
  size = "shared-cpu-2x"
  memory = "2048mb"

[mounts]
  source = "openclaw_data"
  destination = "/data"
```

**주요 설정:**

| 설정                           | 이유                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `--bind lan`                   | `0.0.0.0`에 바인딩하여 Fly 프록시가 게이트웨이에 도달 가능                      |
| `--allow-unconfigured`         | 설정 파일 없이 시작 (나중에 생성)                                               |
| `internal_port = 3000`         | Fly 헬스 체크를 위해 `--port 3000` (또는 `OPENCLAW_GATEWAY_PORT`)과 일치해야 함 |
| `memory = "2048mb"`            | 512MB는 너무 작음; 2GB 권장                                                     |
| `OPENCLAW_STATE_DIR = "/data"` | 볼륨에 상태 유지                                                                |

## 3) 시크릿 설정

```bash
# 필수: 게이트웨이 토큰 (비루프백 바인딩용)
fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

# 모델 프로바이더 API 키
fly secrets set ANTHROPIC_API_KEY=sk-ant-...

# 선택사항: 다른 프로바이더
fly secrets set OPENAI_API_KEY=sk-...
fly secrets set GOOGLE_API_KEY=...

# 채널 토큰
fly secrets set DISCORD_BOT_TOKEN=MTQ...
```

**참고사항:**

- 비루프백 바인드(`--bind lan`)는 보안을 위해 `OPENCLAW_GATEWAY_TOKEN`이 필요합니다.
- 이 토큰들을 비밀번호처럼 취급하세요.
- **모든 API 키와 토큰은 설정 파일보다 환경 변수를 선호합니다.** 이렇게 하면 실수로 노출되거나 로깅될 수 있는 `openclaw.json`에서 시크릿을 제외합니다.

## 4) 배포

```bash
fly deploy
```

첫 배포는 Docker 이미지를 빌드합니다(약 2-3분). 이후 배포는 더 빠릅니다.

배포 후 확인:

```bash
fly status
fly logs
```

다음과 같이 표시되어야 합니다:

```
[gateway] listening on ws://0.0.0.0:3000 (PID xxx)
[discord] logged in to discord as xxx
```

## 5) 설정 파일 생성

적절한 설정을 생성하려면 머신에 SSH로 접속합니다:

```bash
fly ssh console
```

설정 디렉토리와 파일 생성:

```bash
mkdir -p /data
cat > /data/openclaw.json << 'EOF'
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-5",
        "fallbacks": ["anthropic/claude-sonnet-4-5", "openai/gpt-4o"]
      },
      "maxConcurrent": 4
    },
    "list": [
      {
        "id": "main",
        "default": true
      }
    ]
  },
  "auth": {
    "profiles": {
      "anthropic:default": { "mode": "token", "provider": "anthropic" },
      "openai:default": { "mode": "token", "provider": "openai" }
    }
  },
  "bindings": [
    {
      "agentId": "main",
      "match": { "channel": "discord" }
    }
  ],
  "channels": {
    "discord": {
      "enabled": true,
      "groupPolicy": "allowlist",
      "guilds": {
        "YOUR_GUILD_ID": {
          "channels": { "general": { "allow": true } },
          "requireMention": false
        }
      }
    }
  },
  "gateway": {
    "mode": "local",
    "bind": "auto"
  },
  "meta": {
    "lastTouchedVersion": "2026.1.29"
  }
}
EOF
```

**참고:** `OPENCLAW_STATE_DIR=/data`를 사용하면 설정 경로는 `/data/openclaw.json`입니다.

**참고:** Discord 토큰은 다음 중 하나에서 가져올 수 있습니다:

- 환경 변수: `DISCORD_BOT_TOKEN` (시크릿에 권장)
- 설정 파일: `channels.discord.token`

환경 변수를 사용하는 경우 설정에 토큰을 추가할 필요가 없습니다. 게이트웨이는 `DISCORD_BOT_TOKEN`을 자동으로 읽습니다.

적용하려면 재시작:

```bash
exit
fly machine restart <machine-id>
```

## 6) 게이트웨이 액세스

### Control UI

브라우저에서 열기:

```bash
fly open
```

또는 `https://my-openclaw.fly.dev/` 방문

게이트웨이 토큰(`OPENCLAW_GATEWAY_TOKEN`의 것)을 붙여넣어 인증합니다.

### 로그

```bash
fly logs              # 실시간 로그
fly logs --no-tail    # 최근 로그
```

### SSH 콘솔

```bash
fly ssh console
```

## 문제 해결

### "App is not listening on expected address"

게이트웨이가 `0.0.0.0` 대신 `127.0.0.1`에 바인딩되고 있습니다.

**해결:** `fly.toml`의 프로세스 명령에 `--bind lan`을 추가하세요.

### 헬스 체크 실패 / 연결 거부

Fly가 설정된 포트에서 게이트웨이에 도달할 수 없습니다.

**해결:** `internal_port`가 게이트웨이 포트와 일치하는지 확인하세요(`--port 3000` 또는 `OPENCLAW_GATEWAY_PORT=3000` 설정).

### OOM / 메모리 문제

컨테이너가 계속 재시작되거나 종료됩니다. 징후: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, 또는 무음 재시작.

**해결:** `fly.toml`에서 메모리 증가:

```toml
[[vm]]
  memory = "2048mb"
```

또는 기존 머신 업데이트:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**참고:** 512MB는 너무 작습니다. 1GB는 작동할 수 있지만 부하나 상세 로깅 시 OOM이 발생할 수 있습니다. **2GB가 권장됩니다.**

### 게이트웨이 락 문제

게이트웨이가 "already running" 오류로 시작을 거부합니다.

이는 컨테이너가 재시작되지만 PID 락 파일이 볼륨에 유지될 때 발생합니다.

**해결:** 락 파일 삭제:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

락 파일은 `/data/gateway.*.lock`에 있습니다(하위 디렉토리가 아님).

### 설정이 읽히지 않음

`--allow-unconfigured`를 사용하면 게이트웨이가 최소 설정을 생성합니다. `/data/openclaw.json`의 커스텀 설정은 재시작 시 읽어야 합니다.

설정 존재 확인:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH를 통한 설정 작성

`fly ssh console -C` 명령은 셸 리디렉션을 지원하지 않습니다. 설정 파일을 작성하려면:

```bash
# echo + tee 사용 (로컬에서 원격으로 파이프)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# 또는 sftp 사용
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**참고:** 파일이 이미 존재하면 `fly sftp`가 실패할 수 있습니다. 먼저 삭제:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 상태가 유지되지 않음

재시작 후 자격 증명이나 세션을 잃는 경우 상태 디렉토리가 컨테이너 파일시스템에 쓰고 있습니다.

**해결:** `OPENCLAW_STATE_DIR=/data`가 `fly.toml`에 설정되어 있는지 확인하고 재배포하세요.

## 업데이트

```bash
# 최신 변경 사항 가져오기
git pull

# 재배포
fly deploy

# 헬스 확인
fly status
fly logs
```

### 머신 명령 업데이트

전체 재배포 없이 시작 명령을 변경해야 하는 경우:

```bash
# 머신 ID 가져오기
fly machines list

# 명령 업데이트
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# 또는 메모리 증가와 함께
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**참고:** `fly deploy` 후 머신 명령이 `fly.toml`의 내용으로 재설정될 수 있습니다. 수동 변경을 한 경우 배포 후 다시 적용하세요.

## 비공개 배포 (강화)

기본적으로 Fly는 공개 IP를 할당하여 게이트웨이를 `https://your-app.fly.dev`에서 액세스할 수 있게 합니다. 이는 편리하지만 배포가 인터넷 스캐너(Shodan, Censys 등)에 의해 발견될 수 있음을 의미합니다.

**공개 노출 없이** 강화된 배포를 위해 비공개 템플릿을 사용하세요.

### 비공개 배포를 사용할 때

- **아웃바운드** 호출/메시지만 수행 (인바운드 웹훅 없음)
- 웹훅 콜백에 **ngrok 또는 Tailscale** 터널 사용
- 브라우저 대신 **SSH, 프록시 또는 WireGuard**를 통해 게이트웨이 액세스
- 배포를 **인터넷 스캐너로부터 숨기고** 싶음

### 설정

표준 설정 대신 `fly.private.toml` 사용:

```bash
# 비공개 설정으로 배포
fly deploy -c fly.private.toml
```

또는 기존 배포 변환:

```bash
# 현재 IP 목록
fly ips list -a my-openclaw

# 공개 IP 해제
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# 향후 배포에서 공개 IP가 재할당되지 않도록 비공개 설정으로 전환
# ([http_service] 제거 또는 비공개 템플릿으로 배포)
fly deploy -c fly.private.toml

# 비공개 전용 IPv6 할당
fly ips allocate-v6 --private -a my-openclaw
```

이후 `fly ips list`는 `private` 타입 IP만 표시해야 합니다:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 비공개 배포 액세스

공개 URL이 없으므로 다음 방법 중 하나를 사용합니다:

**옵션 1: 로컬 프록시 (가장 간단)**

```bash
# 로컬 포트 3000을 앱으로 전달
fly proxy 3000:3000 -a my-openclaw

# 그런 다음 브라우저에서 http://localhost:3000 열기
```

**옵션 2: WireGuard VPN**

```bash
# WireGuard 설정 생성 (한 번만)
fly wireguard create

# WireGuard 클라이언트로 가져온 다음 내부 IPv6를 통해 액세스
# 예: http://[fdaa:x:x:x:x::x]:3000
```

**옵션 3: SSH만**

```bash
fly ssh console -a my-openclaw
```

### 비공개 배포를 통한 웹훅

공개 노출 없이 웹훅 콜백(Twilio, Telnyx 등)이 필요한 경우:

1. **ngrok 터널** - 컨테이너 내부 또는 사이드카로 ngrok 실행
2. **Tailscale Funnel** - Tailscale을 통해 특정 경로 노출
3. **아웃바운드 전용** - 일부 프로바이더(Twilio)는 웹훅 없이 아웃바운드 호출에 대해 잘 작동

ngrok를 사용한 음성 통화 설정 예제:

```json
{
  "plugins": {
    "entries": {
      "voice-call": {
        "enabled": true,
        "config": {
          "provider": "twilio",
          "tunnel": { "provider": "ngrok" }
        }
      }
    }
  }
}
```

ngrok 터널은 컨테이너 내부에서 실행되며 Fly 앱 자체를 노출하지 않고 공개 웹훅 URL을 제공합니다.

### 보안 이점

| 측면              | 공개      | 비공개      |
| ----------------- | --------- | ----------- |
| 인터넷 스캐너     | 발견 가능 | 숨김        |
| 직접 공격         | 가능      | 차단        |
| Control UI 액세스 | 브라우저  | 프록시/VPN  |
| 웹훅 전달         | 직접      | 터널을 통해 |

## 참고사항

- Fly.io는 **x86 아키텍처** 사용 (ARM 아님)
- Dockerfile은 두 아키텍처 모두와 호환됨
- WhatsApp/Telegram 온보딩은 `fly ssh console` 사용
- 영구 데이터는 `/data`의 볼륨에 저장
- Signal은 Java + signal-cli가 필요; 커스텀 이미지를 사용하고 메모리를 2GB+ 유지.

## 비용

권장 설정(`shared-cpu-2x`, 2GB RAM)으로:

- 사용량에 따라 월 약 $10-15
- 무료 티어에 일부 허용량 포함

자세한 내용은 [Fly.io 가격](https://fly.io/docs/about/pricing/)을 참조하세요.

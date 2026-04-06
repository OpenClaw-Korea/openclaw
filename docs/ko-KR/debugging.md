---
summary: "디버깅 도구: 와치 모드, 원시 모델 스트림, 추론 누출 추적"
read_when:
  - 추론 누출을 위해 원시 모델 출력을 검사해야 하는 경우
  - 반복하는 동안 게이트웨이를 와치 모드로 실행하고자 하는 경우
  - 반복 가능한 디버깅 워크플로가 필요한 경우
title: "디버깅"
---

# 디버깅

이 페이지는 스트리밍 출력을 위한 디버깅 도우미를 다룹니다. 특히 프로바이더가 추론을 일반 텍스트에 혼합하는 경우에 유용합니다.

## 런타임 디버그 재정의

채팅에서 `/debug`를 사용하여 **런타임 전용** 설정 재정의(메모리, 디스크가 아님)를 설정하세요.
`/debug`는 기본적으로 비활성화되어 있습니다. `commands.debug: true`로 활성화하세요.
이는 `openclaw.json`을 편집하지 않고 모호한 설정을 토글해야 할 때 유용합니다.

예시:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset`은 모든 재정의를 지우고 디스크의 설정으로 돌아갑니다.

## 게이트웨이 와치 모드

빠른 반복을 위해 파일 와처에서 게이트웨이를 실행하세요:

```bash
pnpm gateway:watch --force
```

이는 다음으로 매핑됩니다:

```bash
tsx watch src/entry.ts gateway --force
```

`gateway:watch` 뒤에 게이트웨이 CLI 플래그를 추가하면 각 재시작 시 전달됩니다.

## 개발 프로필 + 개발 게이트웨이 (--dev)

개발 프로필을 사용하여 상태를 격리하고 디버깅을 위한 안전하고 일회용 설정을 시작하세요. **두 개**의 `--dev` 플래그가 있습니다:

- **전역 `--dev` (프로필):** `~/.openclaw-dev` 아래에 상태를 격리하고 게이트웨이 포트를 `19001`로 기본 설정합니다(파생 포트는 이에 따라 이동).
- **`gateway --dev`: 게이트웨이에 누락된 경우 기본 설정 + 워크스페이스를 자동 생성하도록 지시합니다**(그리고 BOOTSTRAP.md를 건너뜁니다).

권장 흐름(개발 프로필 + 개발 부트스트랩):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

아직 전역 설치가 없는 경우 `pnpm openclaw ...`를 통해 CLI를 실행하세요.

수행 작업:

1. **프로필 격리** (전역 `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (브라우저/캔버스가 그에 따라 이동)

2. **개발 부트스트랩** (`gateway --dev`)
   - 누락된 경우 최소 설정 작성(`gateway.mode=local`, 로컬 루프백 바인딩).
   - `agent.workspace`를 개발 워크스페이스로 설정.
   - `agent.skipBootstrap=true` 설정(BOOTSTRAP.md 없음).
   - 누락된 경우 워크스페이스 파일 시드:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - 기본 아이덴티티: **C3-PO** (프로토콜 드로이드).
   - 개발 모드에서 채널 프로바이더 건너뛰기(`OPENCLAW_SKIP_CHANNELS=1`).

리셋 흐름(새로 시작):

```bash
pnpm gateway:dev:reset
```

참고: `--dev`는 **전역** 프로필 플래그이며 일부 러너에 의해 먹혀집니다.
명시적으로 지정해야 하는 경우 환경 변수 형식을 사용하세요:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset`은 설정, 자격 증명, 세션 및 개발 워크스페이스를 지웁니다(`rm`이 아닌 `trash` 사용), 그런 다음 기본 개발 설정을 재생성합니다.

팁: 개발이 아닌 게이트웨이가 이미 실행 중인 경우(launchd/systemd), 먼저 중지하세요:

```bash
openclaw gateway stop
```

## 원시 스트림 로깅 (OpenClaw)

OpenClaw는 필터링/포맷팅 전에 **원시 어시스턴트 스트림**을 로깅할 수 있습니다.
이는 추론이 일반 텍스트 델타로 도착하는지(또는 별도의 씽킹 블록으로 도착하는지) 확인하는 가장 좋은 방법입니다.

CLI를 통해 활성화:

```bash
pnpm gateway:watch --force --raw-stream
```

선택적 경로 재정의:

```bash
pnpm gateway:watch --force --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

동등한 환경 변수:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

기본 파일:

`~/.openclaw/logs/raw-stream.jsonl`

## 원시 청크 로깅 (pi-mono)

블록으로 파싱되기 전에 **원시 OpenAI 호환 청크**를 캡처하려면 pi-mono가 별도의 로거를 노출합니다:

```bash
PI_RAW_STREAM=1
```

선택적 경로:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

기본 파일:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 참고: 이는 pi-mono의 `openai-completions` 프로바이더를 사용하는 프로세스에서만 방출됩니다.

## 안전 참고사항

- 원시 스트림 로그에는 전체 프롬프트, 도구 출력 및 사용자 데이터가 포함될 수 있습니다.
- 로그를 로컬에 보관하고 디버깅 후 삭제하세요.
- 로그를 공유하는 경우 먼저 비밀 및 개인 정보를 삭제하세요.

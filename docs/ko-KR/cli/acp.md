---
summary: "IDE 통합을 위한 ACP 브릿지 실행"
read_when:
  - ACP 기반 IDE 통합 설정
  - ACP 세션 라우팅을 게이트웨이로 디버깅
title: "acp"
---

# acp

OpenClaw 게이트웨이와 통신하는 ACP (Agent Client Protocol) 브릿지를 실행합니다.

이 명령어는 IDE를 위해 ACP를 표준 입출력으로 처리하고 WebSocket을 통해 게이트웨이로 프롬프트를 전달합니다. ACP 세션을 게이트웨이 세션 키로 매핑하여 관리합니다.

## 사용 방법

```bash
openclaw acp

# 원격 게이트웨이
openclaw acp --url wss://gateway-host:18789 --token <token>

# 기존 세션 키에 연결
openclaw acp --session agent:main:main

# 레이블로 연결 (이미 존재해야 함)
openclaw acp --session-label "support inbox"

# 첫 프롬프트 전에 세션 키 초기화
openclaw acp --session agent:main:main --reset-session
```

## ACP 클라이언트 (디버그)

IDE 없이 브릿지를 검증하기 위해 내장 ACP 클라이언트를 사용합니다.
ACP 브릿지를 생성하고 대화형으로 프롬프트를 입력할 수 있습니다.

```bash
openclaw acp client

# 생성된 브릿지가 원격 게이트웨이를 가리키도록 설정
openclaw acp client --server-args --url wss://gateway-host:18789 --token <token>

# 서버 명령어 재정의 (기본값: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

## 사용 방법

IDE(또는 다른 클라이언트)가 Agent Client Protocol을 사용하고 OpenClaw 게이트웨이 세션을 제어하려는 경우 ACP를 사용합니다.

1. 게이트웨이가 실행 중인지 확인합니다 (로컬 또는 원격).
2. 게이트웨이 대상을 설정합니다 (설정 또는 플래그).
3. IDE에서 표준 입출력을 통해 `openclaw acp`를 실행하도록 지정합니다.

설정 예시 (지속 저장):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

직접 실행 예시 (설정 저장 없음):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
```

## 에이전트 선택

ACP는 에이전트를 직접 선택하지 않습니다. 게이트웨이 세션 키로 라우팅합니다.

에이전트 범위 세션 키를 사용하여 특정 에이전트를 대상으로 합니다:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

각 ACP 세션은 단일 게이트웨이 세션 키로 매핑됩니다. 하나의 에이전트는 여러 세션을 가질 수 있으며, ACP는 키 또는 레이블을 재정의하지 않으면 기본적으로 격리된 `acp:<uuid>` 세션을 사용합니다.

## Zed 에디터 설정

`~/.config/zed/settings.json`에서 사용자 정의 ACP 에이전트를 추가합니다 (또는 Zed의 설정 UI 사용):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

특정 게이트웨이 또는 에이전트를 대상으로 설정하려면:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Zed에서 에이전트 패널을 열고 "OpenClaw ACP"를 선택하여 스레드를 시작합니다.

## 세션 매핑

기본적으로 ACP 세션은 `acp:` 접두사가 있는 격리된 게이트웨이 세션 키를 받습니다.
기존 세션을 재사용하려면 세션 키 또는 레이블을 전달합니다:

- `--session <key>`: 특정 게이트웨이 세션 키를 사용합니다.
- `--session-label <label>`: 레이블로 기존 세션을 확인합니다.
- `--reset-session`: 해당 키에 대해 새로운 세션 ID를 생성합니다 (같은 키, 새로운 대화 기록).

ACP 클라이언트가 메타데이터를 지원하는 경우 세션별로 재정의할 수 있습니다:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

세션 키에 대해 더 알아보려면 [/concepts/session](/concepts/session)을 참조합니다.

## 옵션

- `--url <url>`: 게이트웨이 WebSocket URL (설정되면 gateway.remote.url 기본값).
- `--token <token>`: 게이트웨이 인증 토큰.
- `--password <password>`: 게이트웨이 인증 비밀번호.
- `--session <key>`: 기본 세션 키.
- `--session-label <label>`: 확인할 기본 세션 레이블.
- `--require-existing`: 세션 키/레이블이 존재하지 않으면 실패합니다.
- `--reset-session`: 첫 사용 전에 세션 키를 초기화합니다.
- `--no-prefix-cwd`: 프롬프트 앞에 작업 디렉터리를 붙이지 않습니다.
- `--verbose, -v`: stderr로 상세 로깅합니다.

### `acp client` 옵션

- `--cwd <dir>`: ACP 세션의 작업 디렉터리.
- `--server <command>`: ACP 서버 명령어 (기본값: `openclaw`).
- `--server-args <args...>`: ACP 서버로 전달할 추가 인수.
- `--server-verbose`: ACP 서버에서 상세 로깅을 활성화합니다.
- `--verbose, -v`: 상세 클라이언트 로깅합니다.

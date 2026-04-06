---
summary: "터미널 UI (TUI): 모든 머신에서 게이트웨이에 연결"
read_when:
  - TUI의 초보자 친화적인 워크스루가 필요할 때
  - TUI 기능, 명령어, 단축키의 전체 목록이 필요할 때
title: "TUI"
---

# TUI (터미널 UI)

## 빠른 시작

1. 게이트웨이를 시작합니다.

```bash
openclaw gateway
```

2. TUI를 엽니다.

```bash
openclaw tui
```

3. 메시지를 입력하고 Enter를 누릅니다.

원격 게이트웨이:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

게이트웨이가 비밀번호 인증을 사용하는 경우 `--password`를 사용하세요.

## 화면 구성

- 헤더: 연결 URL, 현재 에이전트, 현재 세션.
- 채팅 로그: 사용자 메시지, 어시스턴트 응답, 시스템 알림, 도구 카드.
- 상태 라인: 연결/실행 상태 (연결 중, 실행 중, 스트리밍 중, 대기 중, 오류).
- 푸터: 연결 상태 + 에이전트 + 세션 + 모델 + think/verbose/reasoning + 토큰 수 + deliver.
- 입력: 자동 완성 기능이 있는 텍스트 편집기.

## 멘탈 모델: 에이전트 + 세션

- 에이전트는 고유한 슬러그입니다 (예: `main`, `research`). 게이트웨이가 목록을 노출합니다.
- 세션은 현재 에이전트에 속합니다.
- 세션 키는 `agent:<agentId>:<sessionKey>`로 저장됩니다.
  - `/session main`을 입력하면 TUI가 이를 `agent:<currentAgent>:main`으로 확장합니다.
  - `/session agent:other:main`을 입력하면 해당 에이전트 세션으로 명시적으로 전환합니다.
- 세션 범위:
  - `per-sender` (기본값): 각 에이전트는 여러 세션을 가집니다.
  - `global`: TUI는 항상 `global` 세션을 사용합니다 (선택기가 비어 있을 수 있음).
- 현재 에이전트 + 세션은 항상 푸터에 표시됩니다.

## 전송 + 전달

- 메시지는 게이트웨이로 전송됩니다. 프로바이더로의 전달은 기본적으로 꺼져 있습니다.
- 전달 켜기:
  - `/deliver on`
  - 또는 설정 패널
  - 또는 `openclaw tui --deliver`로 시작

## 선택기 + 오버레이

- 모델 선택기: 사용 가능한 모델을 나열하고 세션 재정의를 설정합니다.
- 에이전트 선택기: 다른 에이전트를 선택합니다.
- 세션 선택기: 현재 에이전트의 세션만 표시합니다.
- 설정: deliver, 도구 출력 확장, thinking 가시성을 토글합니다.

## 키보드 단축키

- Enter: 메시지 전송
- Esc: 활성 실행 중단
- Ctrl+C: 입력 지우기 (종료하려면 두 번 누름)
- Ctrl+D: 종료
- Ctrl+L: 모델 선택기
- Ctrl+G: 에이전트 선택기
- Ctrl+P: 세션 선택기
- Ctrl+O: 도구 출력 확장 토글
- Ctrl+T: thinking 가시성 토글 (기록 다시 로드)

## 슬래시 명령어

핵심:

- `/help`
- `/status`
- `/agent <id>` (또는 `/agents`)
- `/session <key>` (또는 `/sessions`)
- `/model <provider/model>` (또는 `/models`)

세션 제어:

- `/think <off|minimal|low|medium|high>`
- `/verbose <on|full|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (별칭: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

세션 수명주기:

- `/new` 또는 `/reset` (세션 초기화)
- `/abort` (활성 실행 중단)
- `/settings`
- `/exit`

기타 게이트웨이 슬래시 명령어 (예: `/context`)는 게이트웨이로 전달되고 시스템 출력으로 표시됩니다. [슬래시 명령어](/tools/slash-commands)를 참조하세요.

## 로컬 셸 명령어

- 줄 앞에 `!`를 붙여 TUI 호스트에서 로컬 셸 명령어를 실행합니다.
- TUI는 세션당 한 번 로컬 실행을 허용하도록 프롬프트를 표시합니다. 거부하면 세션 동안 `!`가 비활성화됩니다.
- 명령어는 TUI 작업 디렉토리의 신선하고 비대화형 셸에서 실행됩니다 (지속적인 `cd`/env 없음).
- 단독 `!`는 일반 메시지로 전송됩니다. 선행 공백은 로컬 실행을 트리거하지 않습니다.

## 도구 출력

- 도구 호출은 인수 + 결과가 포함된 카드로 표시됩니다.
- Ctrl+O는 축소/확장 보기 간에 토글합니다.
- 도구가 실행되는 동안 부분 업데이트가 동일한 카드로 스트리밍됩니다.

## 기록 + 스트리밍

- 연결 시 TUI는 최신 기록을 로드합니다 (기본값 200개 메시지).
- 스트리밍 응답은 완료될 때까지 제자리에서 업데이트됩니다.
- TUI는 더 풍부한 도구 카드를 위해 에이전트 도구 이벤트도 수신합니다.

## 연결 세부 정보

- TUI는 `mode: "tui"`로 게이트웨이에 등록합니다.
- 재연결은 시스템 메시지를 표시합니다. 이벤트 간격은 로그에 표시됩니다.

## 옵션

- `--url <url>`: 게이트웨이 WebSocket URL (설정 또는 `ws://127.0.0.1:<port>`가 기본값)
- `--token <token>`: 게이트웨이 토큰 (필요한 경우)
- `--password <password>`: 게이트웨이 비밀번호 (필요한 경우)
- `--session <key>`: 세션 키 (기본값: `main`, 범위가 global인 경우 `global`)
- `--deliver`: 어시스턴트 응답을 프로바이더로 전달 (기본값 off)
- `--thinking <level>`: 전송 시 thinking 레벨 재정의
- `--timeout-ms <ms>`: 에이전트 타임아웃 (ms) (기본값: `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: 로드할 기록 항목 수 (기본값 200)

## 문제 해결

메시지를 보낸 후 출력이 없는 경우:

- TUI에서 `/status`를 실행하여 게이트웨이가 연결되어 있고 대기/사용 중인지 확인하세요.
- 게이트웨이 로그를 확인하세요: `openclaw logs --follow`.
- 에이전트가 실행될 수 있는지 확인하세요: `openclaw status` 및 `openclaw models status`.
- 채팅 채널에서 메시지를 기대하는 경우 전달을 활성화하세요 (`/deliver on` 또는 `--deliver`).

- `disconnected`: 게이트웨이가 실행 중이고 `--url/--token/--password`가 올바른지 확인하세요.
- 선택기에 에이전트가 없음: `openclaw agents list` 및 라우팅 설정을 확인하세요.
- 빈 세션 선택기: global 범위에 있거나 아직 세션이 없을 수 있습니다.

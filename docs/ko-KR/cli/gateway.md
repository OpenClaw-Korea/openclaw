---
summary: "OpenClaw 게이트웨이 CLI (`openclaw gateway`) — 게이트웨이 실행, 쿼리 및 검색"
read_when:
  - CLI에서 게이트웨이 실행 시 (개발 또는 서버)
  - 게이트웨이 인증, 바인드 모드 및 연결성 디버깅 시
  - Bonjour를 통한 게이트웨이 검색 시 (LAN + tailnet)
title: "gateway"
---

# 게이트웨이 CLI

게이트웨이는 OpenClaw의 WebSocket 서버입니다 (채널, 노드, 세션, 훅).

이 페이지의 하위 명령어는 `openclaw gateway …` 아래에 있습니다.

관련 문서:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## 게이트웨이 실행

로컬 게이트웨이 프로세스 실행:

```bash
openclaw gateway
```

포그라운드 별칭:

```bash
openclaw gateway run
```

참고:

- 기본적으로 게이트웨이는 `~/.openclaw/openclaw.json`에 `gateway.mode=local`이 설정되어 있지 않으면 시작을 거부합니다. 임시/개발 실행의 경우 `--allow-unconfigured`를 사용하세요.
- 인증 없이 루프백을 넘어서는 바인딩은 차단됩니다 (안전 가드레일).
- `SIGUSR1`은 권한이 부여된 경우 프로세스 내 재시작을 트리거합니다 (게이트웨이 도구/설정 적용/업데이트 또는 `commands.restart` 활성화).
- `SIGINT`/`SIGTERM` 핸들러는 게이트웨이 프로세스를 중지하지만 사용자 지정 터미널 상태를 복원하지 않습니다. TUI 또는 raw 모드 입력으로 CLI를 래핑하는 경우 종료 전에 터미널을 복원하세요.

### 옵션

- `--port <port>`: WebSocket 포트 (기본값은 설정/환경에서 가져옴; 일반적으로 `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: 리스너 바인드 모드.
- `--auth <token|password>`: 인증 모드 재정의.
- `--token <token>`: 토큰 재정의 (프로세스에 대해 `OPENCLAW_GATEWAY_TOKEN`도 설정).
- `--password <password>`: 비밀번호 재정의 (프로세스에 대해 `OPENCLAW_GATEWAY_PASSWORD`도 설정).
- `--tailscale <off|serve|funnel>`: Tailscale을 통해 게이트웨이 노출.
- `--tailscale-reset-on-exit`: 종료 시 Tailscale serve/funnel 설정 재설정.
- `--allow-unconfigured`: 설정에 `gateway.mode=local` 없이 게이트웨이 시작 허용.
- `--dev`: 누락된 경우 개발 설정 + 작업 공간 생성 (BOOTSTRAP.md 건너뜀).
- `--reset`: 개발 설정 + 자격 증명 + 세션 + 작업 공간 재설정 (`--dev` 필요).
- `--force`: 시작하기 전에 선택한 포트의 기존 리스너 종료.
- `--verbose`: 상세 로그.
- `--claude-cli-logs`: 콘솔에 claude-cli 로그만 표시 (및 stdout/stderr 활성화).
- `--ws-log <auto|full|compact>`: websocket 로그 스타일 (기본값 `auto`).
- `--compact`: `--ws-log compact`의 별칭.
- `--raw-stream`: 원시 모델 스트림 이벤트를 jsonl에 로그.
- `--raw-stream-path <path>`: 원시 스트림 jsonl 경로.

## 실행 중인 게이트웨이 쿼리

모든 쿼리 명령어는 WebSocket RPC를 사용합니다.

출력 모드:

- 기본값: 사람이 읽을 수 있는 형식 (TTY에서 색상 표시).
- `--json`: 기계가 읽을 수 있는 JSON (스타일링/스피너 없음).
- `--no-color` (또는 `NO_COLOR=1`): 사람 레이아웃을 유지하면서 ANSI 비활성화.

공유 옵션 (지원되는 경우):

- `--url <url>`: 게이트웨이 WebSocket URL.
- `--token <token>`: 게이트웨이 토큰.
- `--password <password>`: 게이트웨이 비밀번호.
- `--timeout <ms>`: 타임아웃/예산 (명령어마다 다름).
- `--expect-final`: "final" 응답 대기 (에이전트 호출).

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway status`

`gateway status`는 게이트웨이 서비스 (launchd/systemd/schtasks)와 선택적 RPC 프로브를 표시합니다.

```bash
openclaw gateway status
openclaw gateway status --json
```

옵션:

- `--url <url>`: 프로브 URL 재정의.
- `--token <token>`: 프로브에 대한 토큰 인증.
- `--password <password>`: 프로브에 대한 비밀번호 인증.
- `--timeout <ms>`: 프로브 타임아웃 (기본값 `10000`).
- `--no-probe`: RPC 프로브 건너뛰기 (서비스 전용 뷰).
- `--deep`: 시스템 수준 서비스도 스캔.

### `gateway probe`

`gateway probe`는 "모든 것을 디버깅" 명령어입니다. 항상 다음을 프로브합니다:

- 설정된 원격 게이트웨이 (설정된 경우), 그리고
- localhost (루프백) **원격이 설정된 경우에도**.

여러 게이트웨이에 연결할 수 있는 경우 모두 출력합니다. 격리된 프로필/포트를 사용할 때 여러 게이트웨이가 지원됩니다 (예: 구조 봇), 하지만 대부분의 설치는 여전히 단일 게이트웨이를 실행합니다.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

#### SSH를 통한 원격 (Mac 앱 동등)

macOS 앱 "SSH를 통한 원격" 모드는 로컬 포트 포워드를 사용하여 원격 게이트웨이 (루프백에만 바인딩될 수 있음)가 `ws://127.0.0.1:<port>`에서 연결 가능하게 합니다.

CLI 동등:

```bash
openclaw gateway probe --ssh user@gateway-host
```

옵션:

- `--ssh <target>`: `user@host` 또는 `user@host:port` (포트 기본값 `22`).
- `--ssh-identity <path>`: identity 파일.
- `--ssh-auto`: 첫 번째로 발견된 게이트웨이 호스트를 SSH 대상으로 선택 (LAN/WAB만 해당).

설정 (선택 사항, 기본값으로 사용):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

저수준 RPC 도우미.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

## 게이트웨이 서비스 관리

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

참고:

- `gateway install`은 `--port`, `--runtime`, `--token`, `--force`, `--json`을 지원합니다.
- 라이프사이클 명령어는 스크립팅을 위한 `--json`을 허용합니다.

## 게이트웨이 검색 (Bonjour)

`gateway discover`는 게이트웨이 비콘 (`_openclaw-gw._tcp`)을 스캔합니다.

- 멀티캐스트 DNS-SD: `local.`
- 유니캐스트 DNS-SD (Wide-Area Bonjour): 도메인을 선택하고 (예: `openclaw.internal.`) split DNS + DNS 서버를 설정하세요; [/gateway/bonjour](/gateway/bonjour)를 참조하세요

Bonjour 디스커버리가 활성화된 (기본값) 게이트웨이만 비콘을 광고합니다.

Wide-Area 디스커버리 레코드는 다음을 포함합니다 (TXT):

- `role` (게이트웨이 역할 힌트)
- `transport` (전송 힌트, 예: `gateway`)
- `gatewayPort` (WebSocket 포트, 일반적으로 `18789`)
- `sshPort` (SSH 포트; 없으면 기본값 `22`)
- `tailnetDns` (MagicDNS 호스트명, 사용 가능한 경우)
- `gatewayTls` / `gatewayTlsSha256` (TLS 활성화 + 인증서 지문)
- `cliPath` (원격 설치에 대한 선택적 힌트)

### `gateway discover`

```bash
openclaw gateway discover
```

옵션:

- `--timeout <ms>`: 명령어별 타임아웃 (browse/resolve); 기본값 `2000`.
- `--json`: 기계가 읽을 수 있는 출력 (스타일링/스피너도 비활성화).

예제:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

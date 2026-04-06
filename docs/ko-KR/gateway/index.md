---
summary: "게이트웨이 서비스 런북, 라이프사이클 및 운영"
read_when:
  - 게이트웨이 프로세스 실행 또는 디버깅 시
title: "게이트웨이 런북"
---

# 게이트웨이 서비스 런북

마지막 업데이트: 2025-12-09

## 개요

- 단일 Baileys/Telegram 연결과 컨트롤/이벤트 플레인을 소유하는 상시 실행 프로세스입니다.
- 레거시 `gateway` 명령을 대체합니다. CLI 진입점: `openclaw gateway`.
- 중지될 때까지 실행됩니다; 치명적 오류 시 슈퍼바이저가 재시작하도록 0이 아닌 코드로 종료됩니다.

## 실행 방법 (로컬)

```bash
openclaw gateway --port 18789
# stdio에서 전체 디버그/트레이스 로그:
openclaw gateway --port 18789 --verbose
# 포트가 사용 중이면 리스너 종료 후 시작:
openclaw gateway --force
# 개발 루프 (TS 변경 시 자동 리로드):
pnpm gateway:watch
```

- 설정 핫 리로드는 `~/.openclaw/openclaw.json`(또는 `OPENCLAW_CONFIG_PATH`)을 감시합니다.
  - 기본 모드: `gateway.reload.mode="hybrid"` (안전한 변경은 핫 적용, 중요 변경은 재시작).
  - 핫 리로드는 필요 시 **SIGUSR1**을 통한 인프로세스 재시작을 사용합니다.
  - `gateway.reload.mode="off"`로 비활성화.
- WebSocket 컨트롤 플레인을 `127.0.0.1:<port>`(기본값 18789)에 바인딩합니다.
- 동일 포트가 HTTP도 제공합니다 (컨트롤 UI, 훅, A2UI). 단일 포트 멀티플렉스.
  - OpenAI Chat Completions (HTTP): [`/v1/chat/completions`](/gateway/openai-http-api).
  - OpenResponses (HTTP): [`/v1/responses`](/gateway/openresponses-http-api).
  - Tools Invoke (HTTP): [`/tools/invoke`](/gateway/tools-invoke-http-api).
- `canvasHost.port`(기본값 `18793`)에서 기본적으로 Canvas 파일 서버를 시작하여 `~/.openclaw/workspace/canvas`에서 `http://<gateway-host>:18793/__openclaw__/canvas/`를 제공합니다. `canvasHost.enabled=false` 또는 `OPENCLAW_SKIP_CANVAS_HOST=1`로 비활성화.
- stdout으로 로그 출력; launchd/systemd를 사용하여 활성 상태 유지 및 로그 로테이션.
- 문제 해결 시 `--verbose`를 전달하여 핸드셰이크, 요청/응답, 이벤트의 디버그 로깅을 로그 파일에서 stdio로 미러링합니다.
- `--force`는 `lsof`를 사용하여 선택한 포트의 리스너를 찾고, SIGTERM을 보내고, 종료한 것을 로깅한 다음 게이트웨이를 시작합니다(`lsof`가 없으면 빠르게 실패).
- 슈퍼바이저(launchd/systemd/mac app 자식 프로세스 모드) 하에서 실행하면 중지/재시작은 일반적으로 **SIGTERM**을 보냅니다; 이전 빌드에서는 이것이 `pnpm` `ELIFECYCLE` 종료 코드 **143**(SIGTERM)으로 표시될 수 있으며, 이는 정상 종료이지 충돌이 아닙니다.
- **SIGUSR1**은 승인 시 인프로세스 재시작을 트리거합니다(게이트웨이 도구/설정 적용/업데이트, 또는 수동 재시작을 위해 `commands.restart` 활성화).
- 게이트웨이 인증은 기본적으로 필요합니다: `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`) 또는 `gateway.auth.password`를 설정합니다. Tailscale Serve ID를 사용하지 않는 한 클라이언트는 `connect.params.auth.token/password`를 보내야 합니다.
- 마법사는 이제 루프백에서도 기본적으로 토큰을 생성합니다.
- 포트 우선순위: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > 기본값 `18789`.

## 원격 접속

- Tailscale/VPN 권장; 그렇지 않으면 SSH 터널:
  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@host
  ```
- 그러면 클라이언트가 터널을 통해 `ws://127.0.0.1:18789`에 연결합니다.
- 토큰이 설정된 경우, 터널을 통해서도 클라이언트는 `connect.params.auth.token`에 포함해야 합니다.

## 다중 게이트웨이 (동일 호스트)

일반적으로 불필요: 하나의 게이트웨이가 여러 메시징 채널과 에이전트를 서비스할 수 있습니다. 중복성 또는 엄격한 격리(예: 구조용 봇)를 위해서만 다중 게이트웨이를 사용합니다.

상태 + 설정을 격리하고 고유한 포트를 사용하면 지원됩니다. 전체 가이드: [다중 게이트웨이](/gateway/multiple-gateways).

서비스 이름은 프로필 인식:

- macOS: `bot.molt.<profile>` (레거시 `com.openclaw.*`가 여전히 존재할 수 있음)
- Linux: `openclaw-gateway-<profile>.service`
- Windows: `OpenClaw Gateway (<profile>)`

설치 메타데이터는 서비스 설정에 내장됨:

- `OPENCLAW_SERVICE_MARKER=openclaw`
- `OPENCLAW_SERVICE_KIND=gateway`
- `OPENCLAW_SERVICE_VERSION=<version>`

구조용 봇 패턴: 자체 프로필, 상태 디렉토리, 워크스페이스 및 기본 포트 간격으로 격리된 두 번째 게이트웨이를 유지합니다. 전체 가이드: [구조용 봇 가이드](/gateway/multiple-gateways#rescue-bot-guide).

### 개발 프로필 (`--dev`)

빠른 경로: 기본 설정을 건드리지 않고 완전히 격리된 개발 인스턴스(설정/상태/워크스페이스)를 실행합니다.

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
# 그런 다음 개발 인스턴스를 타겟:
openclaw --dev status
openclaw --dev health
```

기본값 (env/플래그/설정으로 재정의 가능):

- `OPENCLAW_STATE_DIR=~/.openclaw-dev`
- `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
- `OPENCLAW_GATEWAY_PORT=19001` (게이트웨이 WS + HTTP)
- 브라우저 컨트롤 서비스 포트 = `19003` (파생: `gateway.port+2`, 루프백 전용)
- `canvasHost.port=19005` (파생: `gateway.port+4`)
- `--dev`에서 `setup`/`onboard`를 실행하면 `agents.defaults.workspace` 기본값이 `~/.openclaw/workspace-dev`가 됩니다.

## 프로토콜 (운영자 뷰)

- 전체 문서: [게이트웨이 프로토콜](/gateway/protocol) 및 [브릿지 프로토콜 (레거시)](/gateway/bridge-protocol).
- 클라이언트의 필수 첫 번째 프레임: `req {type:"req", id, method:"connect", params:{minProtocol,maxProtocol,client:{id,displayName?,version,platform,deviceFamily?,modelIdentifier?,mode,instanceId?}, caps, auth?, locale?, userAgent? } }`.
- 게이트웨이가 `res {type:"res", id, ok:true, payload:hello-ok }` 응답 (또는 `ok:false`와 오류 후 종료).
- 핸드셰이크 후:
  - 요청: `{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - 이벤트: `{type:"event", event, payload, seq?, stateVersion?}`

## 메서드 (초기 세트)

- `health` — 전체 상태 스냅샷 (`openclaw health --json`과 동일한 형태).
- `status` — 짧은 요약.
- `system-presence` — 현재 프레즌스 목록.
- `system-event` — 프레즌스/시스템 노트 게시 (구조화됨).
- `send` — 활성 채널을 통해 메시지 전송.
- `agent` — 에이전트 턴 실행 (동일 연결에서 이벤트 스트리밍).
- `node.list` — 페어링된 + 현재 연결된 노드 목록.
- `node.describe` — 노드 설명 (기능 + 지원되는 `node.invoke` 명령).
- `node.invoke` — 노드에서 명령 실행 (예: `canvas.*`, `camera.*`).
- `node.pair.*` — 페어링 라이프사이클 (`request`, `list`, `approve`, `reject`, `verify`).

## 이벤트

- `agent` — 에이전트 실행의 스트리밍된 도구/출력 이벤트 (seq 태그됨).
- `presence` — 연결된 모든 클라이언트에 푸시되는 프레즌스 업데이트 (stateVersion과 함께 델타).
- `tick` — 주기적 keepalive/no-op으로 활성 상태 확인.
- `shutdown` — 게이트웨이 종료 중; 페이로드에 `reason`과 선택적 `restartExpectedMs` 포함. 클라이언트는 재연결해야 함.

## 슈퍼비전 (macOS 예제)

- launchd를 사용하여 서비스 활성 상태 유지:
  - Program: `openclaw` 경로
  - Arguments: `gateway`
  - KeepAlive: true
  - StandardOut/Err: 파일 경로 또는 `syslog`
- 실패 시 launchd가 재시작; 치명적 잘못된 설정은 운영자가 알아차리도록 계속 종료되어야 함.
- `openclaw gateway install`은 `~/Library/LaunchAgents/bot.molt.gateway.plist`를 작성함.
- `openclaw doctor`는 LaunchAgent 설정을 감사하고 현재 기본값으로 업데이트할 수 있음.

## 게이트웨이 서비스 관리 (CLI)

설치/시작/중지/재시작/상태에 게이트웨이 CLI 사용:

```bash
openclaw gateway status
openclaw gateway install
openclaw gateway stop
openclaw gateway restart
openclaw logs --follow
```

참고:

- `gateway status`는 서비스의 해결된 포트/설정을 사용하여 기본적으로 게이트웨이 RPC를 프로브합니다(`--url`로 재정의).
- `gateway status --deep`는 시스템 수준 스캔을 추가합니다(LaunchDaemons/시스템 유닛).
- `gateway status --no-probe`는 RPC 프로브를 건너뜁니다(네트워킹이 다운된 경우 유용).
- `gateway status --json`은 스크립트에 안정적입니다.
- `logs`는 RPC를 통해 게이트웨이 파일 로그를 tail합니다(수동 `tail`/`grep` 불필요).

## 슈퍼비전 (systemd 사용자 유닛)

OpenClaw는 Linux/WSL2에서 기본적으로 **systemd 사용자 서비스**를 설치합니다. 단일 사용자 머신에는 사용자 서비스를 권장합니다(더 간단한 env, 사용자별 설정). 다중 사용자 또는 항상 켜진 서버에는 **시스템 서비스**를 사용합니다(lingering 불필요, 공유 슈퍼비전).

`~/.config/systemd/user/openclaw-gateway[-<profile>].service` 생성:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
Environment=OPENCLAW_GATEWAY_TOKEN=
WorkingDirectory=/home/youruser

[Install]
WantedBy=default.target
```

lingering 활성화 (사용자 서비스가 로그아웃/유휴 후에도 유지되도록 필요):

```
sudo loginctl enable-linger youruser
```

서비스 활성화:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 운영 점검

- Liveness: WS를 열고 `req:connect` 전송 → `payload.type="hello-ok"`(스냅샷 포함)인 `res` 예상.
- Readiness: `health` 호출 → `ok: true`와 `linkChannel`에서 연결된 채널 예상 (해당되는 경우).
- Debug: `tick` 및 `presence` 이벤트 구독; `status`가 연결됨/인증 수명 표시; 프레즌스 항목에 게이트웨이 호스트와 연결된 클라이언트 표시.

## 안전 보장

- 기본적으로 호스트당 하나의 게이트웨이 가정; 여러 프로필을 실행하는 경우 포트/상태를 격리하고 올바른 인스턴스를 타겟.
- 직접 Baileys 연결로 폴백 없음; 게이트웨이가 다운되면 전송이 빠르게 실패.
- connect가 아닌 첫 번째 프레임이나 잘못된 형식의 JSON은 거부되고 소켓이 닫힘.
- 우아한 종료: 닫기 전에 `shutdown` 이벤트 발행; 클라이언트는 닫기 + 재연결을 처리해야 함.

## CLI 헬퍼

- `openclaw gateway health|status` — 게이트웨이 WS를 통해 상태/health 요청.
- `openclaw message send --target <num> --message "hi" [--media ...]` — 게이트웨이를 통해 전송 (WhatsApp의 경우 멱등).
- `openclaw agent --message "hi" --to <num>` — 에이전트 턴 실행 (기본적으로 최종 대기).
- `openclaw gateway call <method> --params '{"k":"v"}'` — 디버깅용 원시 메서드 호출자.
- `openclaw gateway stop|restart` — 슈퍼바이즈된 게이트웨이 서비스 중지/재시작 (launchd/systemd).

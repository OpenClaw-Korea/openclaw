---
summary: "게이트웨이용 브라우저 기반 Control UI (채팅, 노드, 설정)"
read_when:
  - 브라우저에서 게이트웨이를 운영하려는 경우
  - SSH 터널 없이 Tailnet 액세스를 원하는 경우
title: "Control UI"
---

# Control UI (브라우저)

Control UI는 게이트웨이가 제공하는 작은 **Vite + Lit** 단일 페이지 앱입니다.

- 기본값: `http://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정 (예: `/openclaw`)

동일한 포트의 **게이트웨이 WebSocket**과 직접 통신합니다.

## 빠른 열기 (로컬)

게이트웨이가 동일한 컴퓨터에서 실행 중인 경우 열기:

- http://127.0.0.1:18789/ (또는 http://localhost:18789/)

페이지 로드가 실패하면 먼저 게이트웨이를 시작하세요: `openclaw gateway`

인증은 다음을 통해 WebSocket 핸드셰이크 중에 제공됩니다.

- `connect.params.auth.token`
- `connect.params.auth.password`
  대시보드 설정 패널에서 토큰을 저장할 수 있습니다. 비밀번호는 유지되지 않습니다.
  온보딩 마법사는 기본적으로 게이트웨이 토큰을 생성하므로 첫 연결 시 여기에 붙여넣으세요.

## 장치 페어링 (첫 연결)

새 브라우저 또는 장치에서 Control UI에 연결할 때 게이트웨이는
**일회성 페어링 승인**이 필요합니다 — `gateway.auth.allowTailscale: true`로 동일한 Tailnet에 있더라도. 이는 무단 액세스를 방지하기 위한 보안 조치입니다.

**표시 내용:** "disconnected (1008): pairing required"

**장치를 승인하려면:**

```bash
# 대기 중인 요청 나열
openclaw devices list

# 요청 ID로 승인
openclaw devices approve <requestId>
```

승인되면 장치가 기억되며 `openclaw devices revoke --device <id> --role <role>`로 취소하지 않는 한 재승인이 필요하지 않습니다. 토큰 회전 및 취소는 [Devices CLI](/cli/devices)를 참조하세요.

**참고사항:**

- 로컬 연결 (`127.0.0.1`)은 자동으로 승인됩니다.
- 원격 연결 (LAN, Tailnet 등)은 명시적 승인이 필요합니다.
- 각 브라우저 프로필은 고유한 장치 ID를 생성하므로 브라우저를 전환하거나 브라우저 데이터를 지우면 재페어링이 필요합니다.

## 가능한 작업 (현재)

- 게이트웨이 WS를 통해 모델과 채팅 (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- 채팅에서 도구 호출 + 라이브 도구 출력 카드 스트리밍 (에이전트 이벤트)
- 채널: WhatsApp/Telegram/Discord/Slack + 플러그인 채널 (Mattermost 등) 상태 + QR 로그인 + 채널별 설정 (`channels.status`, `web.login.*`, `config.patch`)
- 인스턴스: 존재 목록 + 새로고침 (`system-presence`)
- 세션: 목록 + 세션별 thinking/verbose 재정의 (`sessions.list`, `sessions.patch`)
- 크론 작업: 목록/추가/실행/활성화/비활성화 + 실행 기록 (`cron.*`)
- 스킬: 상태, 활성화/비활성화, 설치, API 키 업데이트 (`skills.*`)
- 노드: 목록 + 기능 (`node.list`)
- 실행 승인: 게이트웨이 또는 노드 허용 목록 편집 + `exec host=gateway/node`에 대한 요청 정책 (`exec.approvals.*`)
- 설정: `~/.openclaw/openclaw.json` 보기/편집 (`config.get`, `config.set`)
- 설정: 유효성 검사와 함께 적용 + 재시작 (`config.apply`) 및 마지막 활성 세션 깨우기
- 설정 쓰기에는 동시 편집 덮어쓰기를 방지하기 위한 base-hash 가드가 포함됩니다
- 설정 스키마 + 폼 렌더링 (`config.schema`, 플러그인 + 채널 스키마 포함). 원시 JSON 편집기는 계속 사용 가능합니다
- 디버그: 상태/상태점검/모델 스냅샷 + 이벤트 로그 + 수동 RPC 호출 (`status`, `health`, `models.list`)
- 로그: 필터/내보내기가 있는 게이트웨이 파일 로그의 라이브 테일 (`logs.tail`)
- 업데이트: 재시작 보고서와 함께 패키지/git 업데이트 + 재시작 실행 (`update.run`)

## 채팅 동작

- `chat.send`는 **논블로킹**입니다: `{ runId, status: "started" }`로 즉시 응답하고 응답은 `chat` 이벤트를 통해 스트리밍됩니다.
- 동일한 `idempotencyKey`로 재전송하면 실행 중일 때 `{ status: "in_flight" }`를 반환하고 완료 후 `{ status: "ok" }`를 반환합니다.
- `chat.inject`는 세션 기록에 어시스턴트 노트를 추가하고 UI 전용 업데이트를 위한 `chat` 이벤트를 브로드캐스트합니다 (에이전트 실행 없음, 채널 전달 없음).
- 중지:
  - **Stop** 클릭 (`chat.abort` 호출)
  - `/stop` (또는 `stop|esc|abort|wait|exit|interrupt`) 입력하여 아웃오브밴드로 중단
  - `chat.abort`는 해당 세션의 모든 활성 실행을 중단하기 위해 `{ sessionKey }` (`runId` 없음)를 지원합니다

## Tailnet 액세스 (권장)

### 통합 Tailscale Serve (선호)

게이트웨이를 루프백에 유지하고 Tailscale Serve가 HTTPS로 프록시하도록 합니다.

```bash
openclaw gateway --tailscale serve
```

열기:

- `https://<magicdns>/` (또는 설정한 `gateway.controlUi.basePath`)

기본적으로 `gateway.auth.allowTailscale`이 `true`일 때 Serve 요청은 Tailscale 아이덴티티 헤더 (`tailscale-user-login`)를 통해 인증할 수 있습니다. OpenClaw는 `x-forwarded-for` 주소를 `tailscale whois`로 확인하고 헤더와 일치시켜 아이덴티티를 확인하며, Tailscale의 `x-forwarded-*` 헤더가 있는 루프백 요청만 허용합니다. Serve 트래픽에 대해서도 토큰/비밀번호를 요구하려면 `gateway.auth.allowTailscale: false`로 설정하세요 (또는 `gateway.auth.mode: "password"` 강제).

### tailnet에 바인드 + 토큰

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

그런 다음 열기:

- `http://<tailscale-ip>:18789/` (또는 설정한 `gateway.controlUi.basePath`)

토큰을 UI 설정에 붙여넣으세요 (`connect.params.auth.token`으로 전송됨).

## 안전하지 않은 HTTP

일반 HTTP (`http://<lan-ip>` 또는 `http://<tailscale-ip>`)로 대시보드를 열면 브라우저가 **비보안 컨텍스트**에서 실행되어 WebCrypto를 차단합니다. 기본적으로 OpenClaw는 장치 아이덴티티 없이 Control UI 연결을 **차단**합니다.

**권장 해결책:** HTTPS (Tailscale Serve)를 사용하거나 로컬로 UI를 여세요.

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (게이트웨이 호스트에서)

**다운그레이드 예제 (HTTP를 통한 토큰 전용):**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

이렇게 하면 Control UI에 대한 장치 아이덴티티 + 페어링이 비활성화됩니다 (HTTPS에서도). 네트워크를 신뢰하는 경우에만 사용하세요.

HTTPS 설정 안내는 [Tailscale](/gateway/tailscale)을 참조하세요.

## UI 빌드

게이트웨이는 `dist/control-ui`에서 정적 파일을 제공합니다. 다음 명령으로 빌드합니다.

```bash
pnpm ui:build # 첫 실행 시 UI 종속성 자동 설치
```

선택적 절대 베이스 (고정 자산 URL을 원하는 경우):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

로컬 개발용 (별도 개발 서버):

```bash
pnpm ui:dev # 첫 실행 시 UI 종속성 자동 설치
```

그런 다음 UI를 게이트웨이 WS URL (예: `ws://127.0.0.1:18789`)로 지정하세요.

## 디버깅/테스트: 개발 서버 + 원격 게이트웨이

Control UI는 정적 파일입니다. WebSocket 대상은 구성 가능하며 HTTP 출처와 다를 수 있습니다. 이는 Vite 개발 서버는 로컬에서 원하지만 게이트웨이는 다른 곳에서 실행되는 경우에 유용합니다.

1. UI 개발 서버 시작: `pnpm ui:dev`
2. 다음과 같은 URL 열기:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

선택적 일회성 인증 (필요한 경우):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789&token=<gateway-token>
```

참고사항:

- `gatewayUrl`은 로드 후 localStorage에 저장되고 URL에서 제거됩니다.
- `token`은 localStorage에 저장됩니다. `password`는 메모리에만 유지됩니다.
- 게이트웨이가 TLS 뒤에 있을 때 (Tailscale Serve, HTTPS 프록시 등) `wss://`를 사용하세요.
- `gatewayUrl`은 클릭재킹을 방지하기 위해 최상위 창에서만 허용됩니다 (임베드 안 됨).
- 크로스 오리진 개발 설정의 경우 (예: `pnpm ui:dev`에서 원격 게이트웨이로) UI 출처를 `gateway.controlUi.allowedOrigins`에 추가하세요.

예제:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

원격 액세스 설정 세부정보: [원격 액세스](/gateway/remote)

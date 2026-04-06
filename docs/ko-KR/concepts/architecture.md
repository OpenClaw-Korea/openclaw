---
summary: "WebSocket 게이트웨이 아키텍처, 구성요소 및 클라이언트 흐름"
read_when:
  - 게이트웨이 프로토콜, 클라이언트 또는 전송 작업 시
title: "게이트웨이 아키텍처"
---

# 게이트웨이 아키텍처

마지막 업데이트: 2026-01-22

## 개요

- 단일 장기 실행 **게이트웨이**가 모든 메시징 플랫폼(Baileys를 통한 WhatsApp, grammY를 통한 Telegram, Slack, Discord, Signal, iMessage, WebChat)을 관리합니다.
- 컨트롤 플레인 클라이언트(macOS 앱, CLI, 웹 UI, 자동화)는 설정된 바인드 호스트(기본값 `127.0.0.1:18789`)에서 **WebSocket**을 통해 게이트웨이에 연결됩니다.
- **노드**(macOS/iOS/Android/헤드리스)도 **WebSocket**을 통해 연결하지만 명시적인 caps/commands와 함께 `role: node`를 선언합니다.
- 호스트당 하나의 게이트웨이; WhatsApp 세션을 여는 유일한 장소입니다.
- **캔버스 호스트**(기본값 `18793`)는 에이전트 편집 가능한 HTML과 A2UI를 제공합니다.

## 구성요소 및 흐름

### 게이트웨이 (데몬)

- 프로바이더 연결을 유지합니다.
- 타입이 지정된 WS API(요청, 응답, 서버 푸시 이벤트)를 노출합니다.
- JSON Schema에 대해 인바운드 프레임을 검증합니다.
- `agent`, `chat`, `presence`, `health`, `heartbeat`, `cron`과 같은 이벤트를 발행합니다.

### 클라이언트 (mac app / CLI / web admin)

- 클라이언트당 하나의 WS 연결.
- 요청 전송 (`health`, `status`, `send`, `agent`, `system-presence`).
- 이벤트 구독 (`tick`, `agent`, `presence`, `shutdown`).

### 노드 (macOS / iOS / Android / 헤드리스)

- `role: node`와 함께 **동일한 WS 서버**에 연결합니다.
- `connect`에서 디바이스 ID를 제공; 페어링은 **디바이스 기반**(역할 `node`)이며 승인은 디바이스 페어링 저장소에 저장됩니다.
- `canvas.*`, `camera.*`, `screen.record`, `location.get`과 같은 명령을 노출합니다.

프로토콜 상세:

- [게이트웨이 프로토콜](/gateway/protocol)

### WebChat

- 채팅 기록 및 전송을 위해 게이트웨이 WS API를 사용하는 정적 UI.
- 원격 설정에서는 다른 클라이언트와 동일한 SSH/Tailscale 터널을 통해 연결합니다.

## 연결 라이프사이클 (단일 클라이언트)

```
Client                    Gateway
  |                          |
  |---- req:connect -------->|
  |<------ res (ok) ---------|   (또는 res error + close)
  |   (payload=hello-ok에 스냅샷 포함: presence + health)
  |                          |
  |<------ event:presence ---|
  |<------ event:tick -------|
  |                          |
  |------- req:agent ------->|
  |<------ res:agent --------|   (ack: {runId,status:"accepted"})
  |<------ event:agent ------|   (스트리밍)
  |<------ res:agent --------|   (최종: {runId,status,summary})
  |                          |
```

## 와이어 프로토콜 (요약)

- 전송: WebSocket, JSON 페이로드가 있는 텍스트 프레임.
- 첫 번째 프레임은 **반드시** `connect`여야 합니다.
- 핸드셰이크 후:
  - 요청: `{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - 이벤트: `{type:"event", event, payload, seq?, stateVersion?}`
- `OPENCLAW_GATEWAY_TOKEN`(또는 `--token`)이 설정된 경우 `connect.params.auth.token`이 일치해야 하며, 그렇지 않으면 소켓이 닫힙니다.
- 멱등성 키는 부작용이 있는 메서드(`send`, `agent`)에서 안전하게 재시도하기 위해 필요합니다; 서버는 짧은 수명의 중복 제거 캐시를 유지합니다.
- 노드는 `connect`에 `role: "node"`와 caps/commands/permissions를 포함해야 합니다.

## 페어링 + 로컬 신뢰

- 모든 WS 클라이언트(운영자 + 노드)는 `connect`에 **디바이스 ID**를 포함합니다.
- 새 디바이스 ID는 페어링 승인이 필요합니다; 게이트웨이는 이후 연결을 위해 **디바이스 토큰**을 발급합니다.
- **로컬** 연결(루프백 또는 게이트웨이 호스트 자체의 tailnet 주소)은 동일 호스트 UX를 원활하게 유지하기 위해 자동 승인될 수 있습니다.
- **비로컬** 연결은 `connect.challenge` nonce에 서명해야 하며 명시적 승인이 필요합니다.
- 게이트웨이 인증(`gateway.auth.*`)은 로컬이든 원격이든 **모든** 연결에 적용됩니다.

상세: [게이트웨이 프로토콜](/gateway/protocol), [페어링](/start/pairing), [보안](/gateway/security).

## 프로토콜 타이핑 및 코드젠

- TypeBox 스키마가 프로토콜을 정의합니다.
- JSON Schema는 해당 스키마에서 생성됩니다.
- Swift 모델은 JSON Schema에서 생성됩니다.

## 원격 접속

- 권장: Tailscale 또는 VPN.
- 대안: SSH 터널
  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@host
  ```
- 터널을 통해서도 동일한 핸드셰이크 + 인증 토큰이 적용됩니다.
- 원격 설정에서 WS에 대해 TLS + 선택적 피닝을 활성화할 수 있습니다.

## 운영 스냅샷

- 시작: `openclaw gateway` (포그라운드, stdout으로 로그 출력).
- 상태: WS를 통한 `health` (`hello-ok`에도 포함).
- 슈퍼비전: 자동 재시작을 위한 launchd/systemd.

## 불변 조건

- 호스트당 정확히 하나의 게이트웨이가 단일 Baileys 세션을 제어합니다.
- 핸드셰이크는 필수입니다; JSON이 아니거나 connect가 아닌 첫 번째 프레임은 즉시 연결을 종료합니다.
- 이벤트는 다시 재생되지 않습니다; 클라이언트는 갭 발생 시 새로고침해야 합니다.

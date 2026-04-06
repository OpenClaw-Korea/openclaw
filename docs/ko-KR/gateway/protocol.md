---
summary: "게이트웨이 WebSocket 프로토콜: 핸드셰이크, 프레임, 버전 관리"
read_when:
  - 게이트웨이 WS 클라이언트 구현 또는 업데이트
  - 프로토콜 불일치 또는 연결 실패 디버깅
  - 프로토콜 스키마/모델 재생성
title: "게이트웨이 프로토콜"
---

# 게이트웨이 프로토콜 (WebSocket)

게이트웨이 WS 프로토콜은 OpenClaw를 위한 **단일 제어 평면 + 노드 전송**입니다. 모든 클라이언트 (CLI, 웹 UI, macOS 앱, iOS/Android 노드, 헤드리스 노드)는 WebSocket을 통해 연결하고 핸드셰이크 시 **역할** + **범위**를 선언합니다.

## 전송

- WebSocket, JSON 페이로드가 있는 텍스트 프레임.
- 첫 번째 프레임은 `connect` 요청이어야 **합니다**.

## 핸드셰이크 (connect)

게이트웨이 → 클라이언트 (연결 전 챌린지):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

클라이언트 → 게이트웨이:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

게이트웨이 → 클라이언트:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

기기 토큰이 발급되면 `hello-ok`에도 다음이 포함됩니다:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

### 노드 예제

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## 프레이밍

- **요청**: `{type:"req", id, method, params}`
- **응답**: `{type:"res", id, ok, payload|error}`
- **이벤트**: `{type:"event", event, payload, seq?, stateVersion?}`

부작용이 있는 메서드는 **멱등성 키**가 필요합니다 (스키마 참조).

## 역할 + 범위

### 역할

- `operator` = 제어 평면 클라이언트 (CLI/UI/자동화).
- `node` = 기능 호스트 (카메라/스크린/캔버스/system.run).

### 범위 (operator)

일반적인 범위:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`

### 기능/명령/권한 (node)

노드는 연결 시 기능 주장을 선언합니다:

- `caps`: 상위 수준 기능 카테고리.
- `commands`: 호출을 위한 명령 허용 목록.
- `permissions`: 세분화된 토글 (예: `screen.record`, `camera.capture`).

게이트웨이는 이를 **주장**으로 취급하고 서버 측 허용 목록을 적용합니다.

## 프레즌스

- `system-presence`는 기기 신원으로 키가 지정된 항목을 반환합니다.
- 프레즌스 항목에는 `deviceId`, `roles` 및 `scopes`가 포함되므로 UI가 **operator**와 **node** 모두로 연결되는 경우에도 기기당 단일 행을 표시할 수 있습니다.

### 노드 헬퍼 메서드

- 노드는 `skills.bins`를 호출하여 자동 허용 확인을 위한 현재 스킬 실행 파일 목록을 가져올 수 있습니다.

## Exec 승인

- exec 요청에 승인이 필요한 경우, 게이트웨이는 `exec.approval.requested`를 브로드캐스트합니다.
- operator 클라이언트는 `exec.approval.resolve`를 호출하여 해결합니다 (`operator.approvals` 범위 필요).

## 버전 관리

- `PROTOCOL_VERSION`은 `src/gateway/protocol/schema.ts`에 있습니다.
- 클라이언트는 `minProtocol` + `maxProtocol`을 전송합니다. 서버는 불일치를 거부합니다.
- 스키마 + 모델은 TypeBox 정의에서 생성됩니다:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## 인증

- `OPENCLAW_GATEWAY_TOKEN` (또는 `--token`)이 설정된 경우, `connect.params.auth.token`이 일치해야 하며 그렇지 않으면 소켓이 닫힙니다.
- 페어링 후, 게이트웨이는 연결 역할 + 범위로 범위가 지정된 **기기 토큰**을 발급합니다. `hello-ok.auth.deviceToken`에 반환되며 향후 연결을 위해 클라이언트가 유지해야 합니다.
- 기기 토큰은 `device.token.rotate` 및 `device.token.revoke`를 통해 순환/취소할 수 있습니다 (`operator.pairing` 범위 필요).

## 기기 신원 + 페어링

- 노드는 키쌍 지문에서 파생된 안정적인 기기 신원 (`device.id`)을 포함해야 합니다.
- 게이트웨이는 기기 + 역할당 토큰을 발급합니다.
- 로컬 자동 승인이 활성화되지 않은 한 새 기기 ID에 대해 페어링 승인이 필요합니다.
- **로컬** 연결에는 루프백 및 게이트웨이 호스트 자체의 tailnet 주소가 포함됩니다 (따라서 동일 호스트 tailnet 바인딩도 여전히 자동 승인 가능).
- 모든 WS 클라이언트는 `connect` 중에 `device` 신원을 포함해야 합니다 (operator + node).
  Control UI는 `gateway.controlUi.allowInsecureAuth`가 활성화된 경우 **만** 이를 생략할 수 있습니다 (또는 비상 사용을 위한 `gateway.controlUi.dangerouslyDisableDeviceAuth`).
- 로컬이 아닌 연결은 서버에서 제공한 `connect.challenge` nonce에 서명해야 합니다.

## TLS + 고정

- TLS는 WS 연결에 대해 지원됩니다.
- 클라이언트는 선택적으로 게이트웨이 인증서 지문을 고정할 수 있습니다 (`gateway.tls` 설정 + `gateway.remote.tlsFingerprint` 또는 CLI `--tls-fingerprint` 참조).

## 범위

이 프로토콜은 **전체 게이트웨이 API** (상태, 채널, 모델, 채팅, 에이전트, 세션, 노드, 승인 등)를 노출합니다. 정확한 표면은 `src/gateway/protocol/schema.ts`의 TypeBox 스키마에 의해 정의됩니다.

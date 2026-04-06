---
summary: "SSH 터널 (게이트웨이 WS) 및 tailnet을 사용한 원격 액세스"
read_when:
  - 원격 게이트웨이 설정 실행 또는 문제 해결
title: "원격 액세스"
---

# 원격 액세스 (SSH, 터널, tailnet)

이 저장소는 전용 호스트 (데스크톱/서버)에서 실행되는 단일 게이트웨이 (마스터)를 유지하고 클라이언트를 연결하여 "SSH를 통한 원격"을 지원합니다.

- **운영자 (사용자 / macOS 앱)**: SSH 터널링은 범용 대체 수단입니다.
- **노드 (iOS/Android 및 향후 기기)**: 게이트웨이 **WebSocket** (LAN/tailnet 또는 필요에 따라 SSH 터널)에 연결합니다.

## 핵심 아이디어

- 게이트웨이 WebSocket은 구성된 포트 (기본값 18789)에서 **루프백**에 바인딩됩니다.
- 원격 사용을 위해 SSH를 통해 루프백 포트를 전달합니다 (또는 tailnet/VPN을 사용하여 터널을 줄입니다).

## 일반적인 VPN/tailnet 설정 (에이전트가 있는 위치)

**게이트웨이 호스트**를 "에이전트가 있는 위치"로 생각하세요. 세션, 인증 프로파일, 채널 및 상태를 소유합니다.
노트북/데스크톱 (및 노드)이 해당 호스트에 연결합니다.

### 1) tailnet의 항상 켜져 있는 게이트웨이 (VPS 또는 홈 서버)

영구 호스트에서 게이트웨이를 실행하고 **Tailscale** 또는 SSH를 통해 연결합니다.

- **최고의 UX:** `gateway.bind: "loopback"`을 유지하고 Control UI에 **Tailscale Serve**를 사용합니다.
- **대체:** 루프백 + 액세스가 필요한 모든 머신에서 SSH 터널을 유지합니다.
- **예제:** [exe.dev](/platforms/exe-dev) (쉬운 VM) 또는 [Hetzner](/platforms/hetzner) (프로덕션 VPS).

노트북이 자주 절전 모드로 전환되지만 에이전트를 항상 켜두고 싶을 때 이상적입니다.

### 2) 홈 데스크톱에서 게이트웨이 실행, 노트북은 원격 제어

노트북은 에이전트를 실행하지 **않습니다**. 원격으로 연결합니다:

- macOS 앱의 **SSH를 통한 원격** 모드를 사용합니다 (설정 → 일반 → "OpenClaw 실행").
- 앱이 터널을 열고 관리하므로 WebChat + 상태 확인이 "그냥 작동"합니다.

실행 가이드: [macOS 원격 액세스](/platforms/mac/remote).

### 3) 노트북에서 게이트웨이 실행, 다른 머신에서 원격 액세스

게이트웨이를 로컬로 유지하되 안전하게 노출합니다:

- 다른 머신에서 노트북으로 SSH 터널, 또는
- Control UI를 Tailscale Serve하고 게이트웨이를 루프백 전용으로 유지합니다.

가이드: [Tailscale](/gateway/tailscale) 및 [웹 개요](/web).

## 명령 플로우 (무엇이 어디에서 실행되는지)

하나의 게이트웨이 서비스가 상태 + 채널을 소유합니다. 노드는 주변 기기입니다.

플로우 예제 (Telegram → 노드):

- Telegram 메시지가 **게이트웨이**에 도착합니다.
- 게이트웨이가 **에이전트**를 실행하고 노드 도구를 호출할지 결정합니다.
- 게이트웨이가 게이트웨이 WebSocket (`node.*` RPC)을 통해 **노드**를 호출합니다.
- 노드가 결과를 반환하면 게이트웨이가 Telegram으로 다시 응답합니다.

참고 사항:

- **노드는 게이트웨이 서비스를 실행하지 않습니다.** 의도적으로 격리된 프로파일을 실행하지 않는 한 호스트당 하나의 게이트웨이만 실행해야 합니다 ([다중 게이트웨이](/gateway/multiple-gateways) 참조).
- macOS 앱 "노드 모드"는 게이트웨이 WebSocket을 통한 노드 클라이언트일 뿐입니다.

## SSH 터널 (CLI + 도구)

원격 게이트웨이 WS에 대한 로컬 터널을 생성합니다:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

터널이 열리면:

- `openclaw health` 및 `openclaw status --deep`는 이제 `ws://127.0.0.1:18789`를 통해 원격 게이트웨이에 도달합니다.
- `openclaw gateway {status,health,send,agent,call}`도 필요 시 `--url`을 통해 전달된 URL을 대상으로 할 수 있습니다.

참고: `18789`를 구성된 `gateway.port` (또는 `--port`/`OPENCLAW_GATEWAY_PORT`)로 바꾸세요.

## CLI 원격 기본값

CLI 명령이 기본적으로 사용하도록 원격 대상을 유지할 수 있습니다:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

게이트웨이가 루프백 전용인 경우, URL을 `ws://127.0.0.1:18789`로 유지하고 먼저 SSH 터널을 엽니다.

## SSH를 통한 채팅 UI

WebChat은 더 이상 별도의 HTTP 포트를 사용하지 않습니다. SwiftUI 채팅 UI는 게이트웨이 WebSocket에 직접 연결합니다.

- SSH를 통해 `18789`를 전달한 다음 (위 참조), 클라이언트를 `ws://127.0.0.1:18789`에 연결합니다.
- macOS에서는 앱의 "SSH를 통한 원격" 모드를 선호하세요. 터널을 자동으로 관리합니다.

## macOS 앱 "SSH를 통한 원격"

macOS 메뉴바 앱은 동일한 설정을 엔드투엔드로 구동할 수 있습니다 (원격 상태 확인, WebChat 및 음성 웨이크 전달).

실행 가이드: [macOS 원격 액세스](/platforms/mac/remote).

## 보안 규칙 (원격/VPN)

간단히 말해서: 바인딩이 확실히 필요한 경우가 아니면 **게이트웨이를 루프백 전용으로 유지**하세요.

- **루프백 + SSH/Tailscale Serve**가 가장 안전한 기본값입니다 (공개 노출 없음).
- **비루프백 바인딩** (`lan`/`tailnet`/`custom`, 또는 루프백을 사용할 수 없을 때 `auto`)은 인증 토큰/비밀번호를 사용해야 합니다.
- `gateway.remote.token`은 원격 CLI 호출 **전용**입니다 — 로컬 인증을 활성화하지 **않습니다**.
- `gateway.remote.tlsFingerprint`는 `wss://` 사용 시 원격 TLS 인증서를 고정합니다.
- **Tailscale Serve**는 `gateway.auth.allowTailscale: true`일 때 신원 헤더를 통해 인증할 수 있습니다.
  토큰/비밀번호를 원하는 경우 `false`로 설정하세요.
- 브라우저 제어를 운영자 액세스처럼 취급하세요: tailnet 전용 + 의도적인 노드 페어링.

심층 분석: [보안](/gateway/security).

---
summary: "게이트웨이 대시보드를 위한 통합 Tailscale Serve/Funnel"
read_when:
  - localhost 외부로 게이트웨이 Control UI 노출
  - tailnet 또는 공개 대시보드 액세스 자동화
title: "Tailscale"
---

# Tailscale (게이트웨이 대시보드)

OpenClaw는 게이트웨이 대시보드 및 WebSocket 포트에 대해 Tailscale **Serve** (tailnet) 또는 **Funnel** (공개)을 자동으로 구성할 수 있습니다. 이렇게 하면 게이트웨이가 루프백에 바인딩된 상태를 유지하면서 Tailscale이 HTTPS, 라우팅 및 (Serve의 경우) 신원 헤더를 제공합니다.

## 모드

- `serve`: `tailscale serve`를 통한 Tailnet 전용 Serve. 게이트웨이는 `127.0.0.1`에 유지됩니다.
- `funnel`: `tailscale funnel`을 통한 공개 HTTPS. OpenClaw는 공유 비밀번호를 요구합니다.
- `off`: 기본값 (Tailscale 자동화 없음).

## 인증

핸드셰이크를 제어하려면 `gateway.auth.mode`를 설정하세요:

- `token` (`OPENCLAW_GATEWAY_TOKEN`이 설정된 경우 기본값)
- `password` (`OPENCLAW_GATEWAY_PASSWORD` 또는 설정을 통한 공유 비밀)

`tailscale.mode = "serve"`이고 `gateway.auth.allowTailscale`이 `true`인 경우,
유효한 Serve 프록시 요청은 토큰/비밀번호를 제공하지 않고도 Tailscale 신원 헤더 (`tailscale-user-login`)를 통해 인증할 수 있습니다. OpenClaw는 로컬 Tailscale 데몬 (`tailscale whois`)을 통해 `x-forwarded-for` 주소를 해석하고 헤더와 일치시켜 신원을 확인한 후 수락합니다.
OpenClaw는 Tailscale의 `x-forwarded-for`, `x-forwarded-proto` 및 `x-forwarded-host` 헤더와 함께 루프백에서 도착한 요청만 Serve로 취급합니다.
명시적 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`로 설정하거나 `gateway.auth.mode: "password"`를 강제하세요.

## 설정 예제

### Tailnet 전용 (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

열기: `https://<magicdns>/` (또는 구성된 `gateway.controlUi.basePath`)

### Tailnet 전용 (Tailnet IP에 바인딩)

게이트웨이가 Tailnet IP에서 직접 수신하도록 하려면 이 방법을 사용하세요 (Serve/Funnel 없음).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

다른 Tailnet 기기에서 연결:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

참고: 이 모드에서는 루프백 (`http://127.0.0.1:18789`)이 작동하지 **않습니다**.

### 공개 인터넷 (Funnel + 공유 비밀번호)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

비밀번호를 디스크에 커밋하는 것보다 `OPENCLAW_GATEWAY_PASSWORD`를 선호하세요.

## CLI 예제

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 참고 사항

- Tailscale Serve/Funnel은 `tailscale` CLI가 설치되고 로그인되어 있어야 합니다.
- `tailscale.mode: "funnel"`은 공개 노출을 피하기 위해 인증 모드가 `password`가 아니면 시작을 거부합니다.
- 종료 시 OpenClaw가 `tailscale serve` 또는 `tailscale funnel` 구성을 취소하도록 하려면 `gateway.tailscale.resetOnExit`를 설정하세요.
- `gateway.bind: "tailnet"`은 직접 Tailnet 바인딩입니다 (HTTPS 없음, Serve/Funnel 없음).
- `gateway.bind: "auto"`는 루프백을 선호합니다. Tailnet 전용을 원하면 `tailnet`을 사용하세요.
- Serve/Funnel은 **게이트웨이 Control UI + WS**만 노출합니다. 노드는 동일한 게이트웨이 WS 엔드포인트를 통해 연결하므로 Serve가 노드 액세스에 작동할 수 있습니다.

## 브라우저 제어 (원격 게이트웨이 + 로컬 브라우저)

한 머신에서 게이트웨이를 실행하지만 다른 머신에서 브라우저를 구동하려면,
브라우저 머신에서 **노드 호스트**를 실행하고 둘 다 동일한 tailnet에 유지하세요.
게이트웨이는 브라우저 작업을 노드로 프록시합니다. 별도의 제어 서버나 Serve URL이 필요하지 않습니다.

브라우저 제어에 Funnel을 사용하지 마세요. 노드 페어링을 운영자 액세스처럼 취급하세요.

## Tailscale 전제 조건 + 제한 사항

- Serve는 tailnet에 대해 HTTPS가 활성화되어 있어야 합니다. 누락된 경우 CLI가 프롬프트를 표시합니다.
- Serve는 Tailscale 신원 헤더를 주입합니다. Funnel은 그렇지 않습니다.
- Funnel은 Tailscale v1.38.3+, MagicDNS, HTTPS 활성화 및 funnel 노드 속성이 필요합니다.
- Funnel은 TLS를 통해 포트 `443`, `8443` 및 `10000`만 지원합니다.
- macOS의 Funnel은 오픈 소스 Tailscale 앱 변형이 필요합니다.

## 더 알아보기

- Tailscale Serve 개요: https://tailscale.com/kb/1312/serve
- `tailscale serve` 명령: https://tailscale.com/kb/1242/tailscale-serve
- Tailscale Funnel 개요: https://tailscale.com/kb/1223/tailscale-funnel
- `tailscale funnel` 명령: https://tailscale.com/kb/1311/tailscale-funnel

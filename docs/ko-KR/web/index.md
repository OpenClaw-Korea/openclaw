---
summary: "게이트웨이 웹 인터페이스: Control UI, 바인드 모드 및 보안"
read_when:
  - Tailscale을 통해 게이트웨이에 액세스하려는 경우
  - 브라우저 Control UI 및 설정 편집을 원하는 경우
title: "웹"
---

# 웹 (게이트웨이)

게이트웨이는 게이트웨이 WebSocket과 동일한 포트에서 작은 **브라우저 Control UI** (Vite + Lit)를 제공합니다.

- 기본값: `http://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정 (예: `/openclaw`)

기능은 [Control UI](/web/control-ui)를 참조하세요.
이 페이지는 바인드 모드, 보안 및 웹 인터페이스에 중점을 둡니다.

## 웹훅

`hooks.enabled=true`일 때 게이트웨이는 동일한 HTTP 서버에서 작은 웹훅 엔드포인트도 노출합니다.
인증 및 페이로드에 대한 자세한 내용은 [게이트웨이 설정](/gateway/configuration) → `hooks`을 참조하세요.

## 설정 (기본값 활성화)

Control UI는 자산이 있을 때 (`dist/control-ui`) **기본적으로 활성화**됩니다.
설정을 통해 제어할 수 있습니다.

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath는 선택사항
  },
}
```

## Tailscale 액세스

### 통합 Serve (권장)

게이트웨이를 루프백에 유지하고 Tailscale Serve가 프록시하도록 합니다.

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

그런 다음 게이트웨이를 시작합니다.

```bash
openclaw gateway
```

열기:

- `https://<magicdns>/` (또는 설정한 `gateway.controlUi.basePath`)

### Tailnet 바인드 + 토큰

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

그런 다음 게이트웨이를 시작합니다 (루프백이 아닌 바인드에는 토큰 필요).

```bash
openclaw gateway
```

열기:

- `http://<tailscale-ip>:18789/` (또는 설정한 `gateway.controlUi.basePath`)

### 공개 인터넷 (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // 또는 OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## 보안 참고사항

- 게이트웨이 인증은 기본적으로 필요합니다 (토큰/비밀번호 또는 Tailscale 아이덴티티 헤더).
- 루프백이 아닌 바인드는 여전히 공유 토큰/비밀번호가 **필요**합니다 (`gateway.auth` 또는 환경 변수).
- 마법사는 기본적으로 게이트웨이 토큰을 생성합니다 (루프백에서도).
- UI는 `connect.params.auth.token` 또는 `connect.params.auth.password`를 전송합니다.
- Control UI는 클릭재킹 방지 헤더를 전송하고 `gateway.controlUi.allowedOrigins`가 설정되지 않은 경우 동일 출처 브라우저 웹소켓 연결만 허용합니다.
- Serve를 사용하면 `gateway.auth.allowTailscale`이 `true`일 때 Tailscale 아이덴티티 헤더가 인증을 만족할 수 있습니다 (토큰/비밀번호 불필요). 명시적 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`로 설정하세요. [Tailscale](/gateway/tailscale) 및 [보안](/gateway/security)을 참조하세요.
- `gateway.tailscale.mode: "funnel"`은 `gateway.auth.mode: "password"` (공유 비밀번호)가 필요합니다.

## UI 빌드

게이트웨이는 `dist/control-ui`에서 정적 파일을 제공합니다. 다음 명령으로 빌드합니다.

```bash
pnpm ui:build # 첫 실행 시 UI 종속성 자동 설치
```

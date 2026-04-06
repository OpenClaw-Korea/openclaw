---
summary: "게이트웨이 대시보드 (Control UI) 액세스 및 인증"
read_when:
  - 대시보드 인증 또는 노출 모드를 변경하는 경우
title: "대시보드"
---

# 대시보드 (Control UI)

게이트웨이 대시보드는 기본적으로 `/`에서 제공되는 브라우저 Control UI입니다
(`gateway.controlUi.basePath`로 재정의 가능).

빠른 열기 (로컬 게이트웨이):

- http://127.0.0.1:18789/ (또는 http://localhost:18789/)

주요 참조:

- 사용법 및 UI 기능은 [Control UI](/web/control-ui)를 참조하세요.
- Serve/Funnel 자동화는 [Tailscale](/gateway/tailscale)을 참조하세요.
- 바인드 모드 및 보안 참고사항은 [웹 인터페이스](/web)를 참조하세요.

인증은 `connect.params.auth`를 통해 WebSocket 핸드셰이크에서 적용됩니다
(토큰 또는 비밀번호). [게이트웨이 설정](/gateway/configuration)의 `gateway.auth`를 참조하세요.

보안 참고사항: Control UI는 **관리자 인터페이스**입니다 (채팅, 설정, 실행 승인).
공개적으로 노출하지 마세요. UI는 첫 로드 후 토큰을 `localStorage`에 저장합니다.
localhost, Tailscale Serve 또는 SSH 터널을 사용하는 것이 좋습니다.

## 빠른 경로 (권장)

- 온보딩 후 CLI는 이제 토큰과 함께 대시보드를 자동으로 열고 동일한 토큰 링크를 출력합니다.
- 언제든지 다시 열기: `openclaw dashboard` (링크 복사, 가능한 경우 브라우저 열기, 헤드리스인 경우 SSH 힌트 표시).
- 토큰은 로컬에 유지됩니다 (쿼리 매개변수만 사용). UI는 첫 로드 후 토큰을 제거하고 localStorage에 저장합니다.

## 토큰 기본사항 (로컬 vs 원격)

- **Localhost**: `http://127.0.0.1:18789/` 열기. "unauthorized"가 표시되면 `openclaw dashboard`를 실행하고 토큰 링크(`?token=...`)를 사용하세요.
- **토큰 소스**: `gateway.auth.token` (또는 `OPENCLAW_GATEWAY_TOKEN`). UI는 첫 로드 후 저장합니다.
- **localhost가 아닌 경우**: Tailscale Serve (`gateway.auth.allowTailscale: true`인 경우 토큰 불필요), 토큰이 있는 tailnet 바인드 또는 SSH 터널을 사용하세요. [웹 인터페이스](/web)를 참조하세요.

## "unauthorized" / 1008이 표시되는 경우

- `openclaw dashboard`를 실행하여 새 토큰 링크를 받으세요.
- 게이트웨이에 연결 가능한지 확인하세요 (로컬: `openclaw status`, 원격: SSH 터널 `ssh -N -L 18789:127.0.0.1:18789 user@host`를 실행한 후 `http://127.0.0.1:18789/?token=...` 열기).
- 대시보드 설정에서 `gateway.auth.token` (또는 `OPENCLAW_GATEWAY_TOKEN`)에 설정한 것과 동일한 토큰을 붙여넣으세요.

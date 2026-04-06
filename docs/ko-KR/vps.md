---
summary: "OpenClaw를 위한 VPS 호스팅 허브 (Oracle/Fly/Hetzner/GCP/exe.dev)"
read_when:
  - 클라우드에서 게이트웨이를 실행하려는 경우
  - VPS/호스팅 가이드의 빠른 맵이 필요한 경우
title: "VPS 호스팅"
---

# VPS 호스팅

이 허브는 지원되는 VPS/호스팅 가이드에 링크하고 클라우드 배포가 높은 수준에서 어떻게 작동하는지 설명합니다.

## 프로바이더 선택

- **Railway** (원클릭 + 브라우저 설정): [Railway](/railway)
- **Northflank** (원클릭 + 브라우저 설정): [Northflank](/northflank)
- **Oracle Cloud (Always Free)**: [Oracle](/platforms/oracle) — $0/월 (Always Free, ARM; 용량/가입이 까다로울 수 있음)
- **Fly.io**: [Fly.io](/platforms/fly)
- **Hetzner (Docker)**: [Hetzner](/platforms/hetzner)
- **GCP (Compute Engine)**: [GCP](/platforms/gcp)
- **exe.dev** (VM + HTTPS 프록시): [exe.dev](/platforms/exe-dev)
- **AWS (EC2/Lightsail/무료 등급)**: 잘 작동합니다. 비디오 가이드:
  https://x.com/techfrenAJ/status/2014934471095812547

## 클라우드 설정 작동 방식

- **게이트웨이가 VPS에서 실행**되며 상태 + 워크스페이스를 소유합니다.
- **Control UI** 또는 **Tailscale/SSH**를 통해 노트북/휴대전화에서 연결합니다.
- VPS를 신뢰할 수 있는 소스로 취급하고 상태 + 워크스페이스를 **백업**하세요.
- 보안 기본값: 게이트웨이를 루프백에 유지하고 SSH 터널 또는 Tailscale Serve를 통해 액세스합니다.
  `lan`/`tailnet`에 바인딩하는 경우 `gateway.auth.token` 또는 `gateway.auth.password`가 필요합니다.

원격 액세스: [게이트웨이 원격](/gateway/remote)
플랫폼 허브: [플랫폼](/platforms)

## VPS와 함께 노드 사용

게이트웨이를 클라우드에 유지하고 로컬 장치 (Mac/iOS/Android/헤드리스)에서 **노드**를 페어링할 수 있습니다. 노드는 게이트웨이가 클라우드에 남아 있는 동안 로컬 화면/카메라/캔버스 및 `system.run` 기능을 제공합니다.

문서: [노드](/nodes), [노드 CLI](/cli/nodes)

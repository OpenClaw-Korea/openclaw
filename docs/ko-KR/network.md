---
summary: "네트워크 허브: 게이트웨이 서페이스, 페어링, 디스커버리 및 보안"
read_when:
  - 네트워크 아키텍처 + 보안 개요가 필요한 경우
  - 로컬 vs tailnet 접근 또는 페어링을 디버깅하는 경우
  - 네트워킹 문서의 정규 목록이 필요한 경우
title: "네트워크"
---

# 네트워크 허브

이 허브는 OpenClaw가 localhost, LAN 및 tailnet에서 장치를 연결하고, 페어링하고, 보안을 유지하는 방법에 대한 핵심 문서를 연결합니다.

## 핵심 모델

- [게이트웨이 아키텍처](/concepts/architecture)
- [게이트웨이 프로토콜](/gateway/protocol)
- [게이트웨이 런북](/gateway)
- [웹 서페이스 + 바인드 모드](/web)

## 페어링 + 아이덴티티

- [페어링 개요 (DM + 노드)](/start/pairing)
- [게이트웨이 소유 노드 페어링](/gateway/pairing)
- [디바이스 CLI (페어링 + 토큰 회전)](/cli/devices)
- [페어링 CLI (DM 승인)](/cli/pairing)

로컬 신뢰:

- 로컬 연결(로컬 루프백 또는 게이트웨이 호스트 자체의 tailnet 주소)은 페어링을 위해 자동 승인되어 동일 호스트 UX를 원활하게 유지할 수 있습니다.
- 로컬이 아닌 tailnet/LAN 클라이언트는 여전히 명시적인 페어링 승인이 필요합니다.

## 디스커버리 + 전송

- [디스커버리 & 전송](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [원격 접근 (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## 노드 + 전송

- [노드 개요](/nodes)
- [브리지 프로토콜 (레거시 노드)](/gateway/bridge-protocol)
- [노드 런북: iOS](/platforms/ios)
- [노드 런북: Android](/platforms/android)

## 보안

- [보안 개요](/gateway/security)
- [게이트웨이 설정 참조](/gateway/configuration)
- [문제 해결](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)

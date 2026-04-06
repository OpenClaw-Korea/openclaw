---
summary: "macOS 앱이 게이트웨이 WebChat을 임베드하는 방법 및 디버깅 방법"
read_when:
  - macOS WebChat 뷰 또는 루프백 포트 디버깅 시
title: "WebChat"
---

# WebChat (macOS 앱)

macOS 메뉴 바 앱은 WebChat UI를 네이티브 SwiftUI 뷰로 임베드합니다. 게이트웨이에 연결하며 선택한 에이전트의 **main 세션**을 기본값으로 사용합니다(다른 세션을 위한 세션 전환기 포함).

- **로컬 모드**: 로컬 게이트웨이 WebSocket에 직접 연결합니다.
- **원격 모드**: SSH를 통해 게이트웨이 컨트롤 포트를 전달하고 해당 터널을 데이터 플레인으로 사용합니다.

## 실행 및 디버깅

- 수동: Lobster 메뉴 → "Open Chat".
- 테스트를 위한 자동 열기:
  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```
- 로그: `./scripts/clawlog.sh` (서브시스템 `bot.molt`, 카테고리 `WebChatSwiftUI`).

## 연결 방법

- 데이터 플레인: 게이트웨이 WS 메서드 `chat.history`, `chat.send`, `chat.abort`, `chat.inject` 및 이벤트 `chat`, `agent`, `presence`, `tick`, `health`.
- 세션: 기본 세션(`main`, 또는 범위가 전역일 때 `global`)을 기본값으로 사용합니다. UI는 세션 간 전환이 가능합니다.
- 온보딩은 첫 실행 설정을 별도로 유지하기 위해 전용 세션을 사용합니다.

## 보안 표면

- 원격 모드는 SSH를 통해 게이트웨이 WebSocket 컨트롤 포트만 전달합니다.

## 알려진 제한사항

- UI는 채팅 세션에 최적화되어 있습니다(전체 브라우저 샌드박스가 아님).

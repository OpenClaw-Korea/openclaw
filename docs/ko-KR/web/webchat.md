---
summary: "채팅 UI를 위한 루프백 WebChat 정적 호스트 및 게이트웨이 WS 사용"
read_when:
  - WebChat 액세스를 디버깅하거나 설정하는 경우
title: "WebChat"
---

# WebChat (게이트웨이 WebSocket UI)

상태: macOS/iOS SwiftUI 채팅 UI는 게이트웨이 WebSocket과 직접 통신합니다.

## 정의

- 게이트웨이용 네이티브 채팅 UI (임베디드 브라우저 및 로컬 정적 서버 없음).
- 다른 채널과 동일한 세션 및 라우팅 규칙 사용.
- 결정론적 라우팅: 응답은 항상 WebChat으로 돌아갑니다.

## 빠른 시작

1. 게이트웨이를 시작합니다.
2. WebChat UI (macOS/iOS 앱) 또는 Control UI 채팅 탭을 엽니다.
3. 게이트웨이 인증이 설정되어 있는지 확인하세요 (루프백에서도 기본적으로 필요).

## 작동 방식 (동작)

- UI는 게이트웨이 WebSocket에 연결하고 `chat.history`, `chat.send`, `chat.inject`를 사용합니다.
- `chat.inject`는 기록에 직접 어시스턴트 노트를 추가하고 UI에 브로드캐스트합니다 (에이전트 실행 없음).
- 기록은 항상 게이트웨이에서 가져옵니다 (로컬 파일 감시 없음).
- 게이트웨이에 연결할 수 없으면 WebChat은 읽기 전용입니다.

## 원격 사용

- 원격 모드는 SSH/Tailscale을 통해 게이트웨이 WebSocket을 터널링합니다.
- 별도의 WebChat 서버를 실행할 필요가 없습니다.

## 설정 참조 (WebChat)

전체 설정: [설정](/gateway/configuration)

채널 옵션:

- 전용 `webchat.*` 블록이 없습니다. WebChat은 아래 게이트웨이 엔드포인트 + 인증 설정을 사용합니다.

관련 전역 옵션:

- `gateway.port`, `gateway.bind`: WebSocket 호스트/포트.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`: WebSocket 인증.
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: 원격 게이트웨이 대상.
- `session.*`: 세션 저장소 및 메인 키 기본값.

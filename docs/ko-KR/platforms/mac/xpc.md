---
summary: "OpenClaw 앱, 게이트웨이 노드 전송, PeekabooBridge를 위한 macOS IPC 아키텍처"
read_when:
  - IPC 계약 또는 메뉴 바 앱 IPC 편집 시
title: "macOS IPC"
---

# OpenClaw macOS IPC 아키텍처

**현재 모델:** 로컬 Unix 소켓이 **노드 호스트 서비스**를 **macOS 앱**에 연결하여 실행 승인 및 `system.run`을 처리합니다. `openclaw-mac` 디버그 CLI는 디스커버리/연결 확인을 위해 존재하며, 에이전트 작업은 여전히 게이트웨이 WebSocket과 `node.invoke`를 통해 흐릅니다. UI 자동화는 PeekabooBridge를 사용합니다.

## 목표

- 모든 TCC 관련 작업(알림, 화면 녹화, 마이크, 음성, AppleScript)을 소유하는 단일 GUI 앱 인스턴스
- 자동화를 위한 작은 표면: 게이트웨이 + 노드 명령, PeekabooBridge를 통한 UI 자동화
- 예측 가능한 권한: 항상 동일한 서명된 번들 ID, launchd로 실행되어 TCC 권한이 유지됩니다.

## 작동 방식

### 게이트웨이 + 노드 전송

- 앱은 게이트웨이(로컬 모드)를 실행하고 노드로 연결합니다.
- 에이전트 작업은 `node.invoke`를 통해 수행됩니다(예: `system.run`, `system.notify`, `canvas.*`).

### 노드 서비스 + 앱 IPC

- 헤드리스 노드 호스트 서비스가 게이트웨이 WebSocket에 연결됩니다.
- `system.run` 요청이 로컬 Unix 소켓을 통해 macOS 앱으로 전달됩니다.
- 앱은 UI 컨텍스트에서 실행을 수행하고, 필요하면 메시지를 표시한 후 출력을 반환합니다.

다이어그램(SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge(UI 자동화)

- UI 자동화는 `bridge.sock`이라는 별도의 UNIX 소켓과 PeekabooBridge JSON 프로토콜을 사용합니다.
- 호스트 기본 설정 순서(클라이언트 쪽): Peekaboo.app → Claude.app → OpenClaw.app → 로컬 실행
- 보안: 브리지 호스트는 허용된 TeamID가 필요합니다. DEBUG 전용 같은 UID 이스케이프 해치는 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`로 보호됩니다(Peekaboo 규약).
- 참조: [PeekabooBridge 사용](/ko-KR/platforms/mac/peekaboo) 자세한 내용.

## 운영 흐름

- 다시 시작/다시 빌드: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 기존 인스턴스를 종료합니다
  - Swift 빌드 + 패키징
  - LaunchAgent를 작성/부트스트랩/킥스타트합니다
- 단일 인스턴스: 동일한 번들 ID를 가진 다른 인스턴스가 실행 중이면 앱이 조기 종료됩니다.

## 강화 참고사항

- 모든 권한 있는 표면에 대해 TeamID 일치를 요구하는 것이 좋습니다.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`(DEBUG 전용)은 로컬 개발을 위해 같은 UID 호출자를 허용할 수 있습니다.
- 모든 통신은 로컬 전용으로 유지됩니다. 네트워크 소켓이 노출되지 않습니다.
- TCC 메시지는 GUI 앱 번들에서만 생성됩니다. 다시 빌드할 때 서명된 번들 ID를 안정적으로 유지합니다.
- IPC 강화: 소켓 모드 `0600`, 토큰, 피어 UID 확인, HMAC 챌린지/응답, 짧은 TTL.

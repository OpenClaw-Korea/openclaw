---
summary: "macOS 앱이 게이트웨이/Baileys 헬스 상태를 보고하는 방법"
read_when:
  - mac 앱 헬스 인디케이터 디버깅 시
title: "헬스 체크"
---

# macOS의 헬스 체크

메뉴 바 앱에서 연결된 채널이 정상인지 확인하는 방법입니다.

## 메뉴 바

- 상태 점은 이제 Baileys 헬스를 반영합니다:
  - 녹색: 연결됨 + 소켓이 최근에 열림.
  - 주황색: 연결 중/재시도 중.
  - 빨간색: 로그아웃됨 또는 프로브 실패.
- 두 번째 줄에는 "linked · auth 12m"이 표시되거나 실패 이유가 표시됩니다.
- "Run Health Check" 메뉴 항목은 온디맨드 프로브를 트리거합니다.

## 설정

- General 탭에 헬스 카드가 추가되어 다음을 표시합니다: 연결된 인증 경과 시간, 세션 저장소 경로/개수, 마지막 체크 시간, 마지막 오류/상태 코드, Run Health Check / Reveal Logs 버튼.
- 캐시된 스냅샷을 사용하므로 UI가 즉시 로드되고 오프라인 시 우아하게 폴백됩니다.
- **Channels 탭**은 WhatsApp/Telegram의 채널 상태 + 제어(로그인 QR, 로그아웃, 프로브, 마지막 연결 해제/오류)를 표시합니다.

## 프로브 작동 방식

- 앱은 `ShellExecutor`를 통해 약 60초마다 그리고 온디맨드로 `openclaw health --json`을 실행합니다. 프로브는 자격 증명을 로드하고 메시지를 전송하지 않고 상태를 보고합니다.
- 마지막 정상 스냅샷과 마지막 오류를 별도로 캐시하여 깜박임을 방지합니다; 각각의 타임스탬프를 표시합니다.

## 확실하지 않을 때

- [게이트웨이 헬스](/gateway/health)의 CLI 흐름(`openclaw status`, `openclaw status --deep`, `openclaw health --json`)을 계속 사용하고 `web-heartbeat` / `web-reconnect`를 위해 `/tmp/openclaw/openclaw-*.log`를 확인할 수 있습니다.

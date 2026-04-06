---
summary: "페어링 개요: DM 허용 대상 + 참여 가능한 노드 승인"
read_when:
  - DM 접근 제어 설정 시
  - 새 iOS/Android 노드 페어링 시
  - OpenClaw 보안 상태 검토 시
title: "페어링"
---

# 페어링

"페어링"은 OpenClaw의 명시적 **소유자 승인** 단계입니다.
두 곳에서 사용됩니다:

1. **DM 페어링** (봇과 대화할 수 있는 사람)
2. **노드 페어링** (게이트웨이 네트워크에 참여할 수 있는 기기/노드)

보안 컨텍스트: [보안](/ko-KR/gateway/security)

## 1) DM 페어링 (인바운드 채팅 접근)

채널이 DM 정책 `pairing`으로 설정되면, 알 수 없는 발신자는 짧은 코드를 받고 승인할 때까지 메시지가 **처리되지 않습니다**.

기본 DM 정책은 다음에 문서화되어 있습니다: [보안](/ko-KR/gateway/security)

페어링 코드:

- 8자, 대문자, 모호한 문자 없음 (`0O1I`).
- **1시간 후 만료**. 봇은 새 요청이 생성될 때만 페어링 메시지를 보냅니다 (발신자당 대략 시간당 한 번).
- 대기 중인 DM 페어링 요청은 기본적으로 **채널당 3개**로 제한됩니다; 하나가 만료되거나 승인될 때까지 추가 요청은 무시됩니다.

### 발신자 승인

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

지원 채널: `telegram`, `whatsapp`, `signal`, `imessage`, `discord`, `slack`.

### 상태 저장 위치

`~/.openclaw/credentials/`에 저장됩니다:

- 대기 중인 요청: `<channel>-pairing.json`
- 승인된 허용목록 저장소: `<channel>-allowFrom.json`

어시스턴트에 대한 접근을 제어하므로 민감하게 취급하세요.

## 2) 노드 기기 페어링 (iOS/Android/macOS/헤드리스 노드)

노드는 `role: node`로 **기기**로서 게이트웨이에 연결합니다. 게이트웨이는 승인이 필요한 기기 페어링 요청을 생성합니다.

### 노드 기기 승인

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

### 상태 저장 위치

`~/.openclaw/devices/`에 저장됩니다:

- `pending.json` (단기; 대기 중인 요청은 만료됨)
- `paired.json` (페어링된 기기 + 토큰)

### 참고

- 레거시 `node.pair.*` API (CLI: `openclaw nodes pending/approve`)는 별도의 게이트웨이 소유 페어링 저장소입니다. WS 노드는 여전히 기기 페어링이 필요합니다.

## 관련 문서

- 보안 모델 + 프롬프트 인젝션: [보안](/ko-KR/gateway/security)
- 안전하게 업데이트 (doctor 실행): [업데이트](/ko-KR/install/updating)
- 채널 설정:
  - Telegram: [Telegram](/ko-KR/channels/telegram)
  - WhatsApp: [WhatsApp](/ko-KR/channels/whatsapp)
  - Signal: [Signal](/ko-KR/channels/signal)
  - iMessage: [iMessage](/ko-KR/channels/imessage)
  - Discord: [Discord](/ko-KR/channels/discord)
  - Slack: [Slack](/ko-KR/channels/slack)

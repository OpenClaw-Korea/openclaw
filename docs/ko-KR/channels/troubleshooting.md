---
summary: "채널별 문제 해결 바로가기 (Discord/Telegram/WhatsApp)"
read_when:
  - 채널은 연결되지만 메시지가 흐르지 않을 때
  - 채널 구성 오류 조사 시 (인텐트, 권한, 프라이버시 모드)
title: "채널 문제 해결"
---

# 채널 문제 해결

다음으로 시작하세요:

```bash
openclaw doctor
openclaw channels status --probe
```

`channels status --probe`는 일반적인 채널 구성 오류를 감지할 수 있을 때 경고를 출력하고, 작은 라이브 확인 (자격 증명, 일부 권한/멤버십)을 포함합니다.

## 채널

- Discord: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)
- Telegram: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)
- WhatsApp: [/channels/whatsapp#troubleshooting-quick](/channels/whatsapp#troubleshooting-quick)

## Telegram 빠른 수정

- 로그에 `HttpError: Network request for 'sendMessage' failed` 또는 `sendChatAction` 표시 → IPv6 DNS를 확인하세요. `api.telegram.org`가 IPv6로 먼저 확인되고 호스트에 IPv6 송신이 없는 경우 IPv4를 강제하거나 IPv6를 활성화하세요. [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting) 참조.
- 로그에 `setMyCommands failed` 표시 → `api.telegram.org`에 대한 아웃바운드 HTTPS 및 DNS 접근성을 확인하세요 (잠긴 VPS 또는 프록시에서 일반적).

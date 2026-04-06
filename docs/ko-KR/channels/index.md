---
summary: "OpenClaw이 연결할 수 있는 메시징 플랫폼"
read_when:
  - OpenClaw을 위한 채팅 채널을 선택하고 싶을 때
  - 지원되는 메시징 플랫폼의 빠른 개요가 필요할 때
title: "채팅 채널"
---

# 채팅 채널

OpenClaw은 이미 사용하고 있는 모든 채팅 앱에서 대화할 수 있습니다. 각 채널은 게이트웨이를 통해 연결됩니다.
텍스트는 모든 곳에서 지원되며, 미디어와 반응은 채널에 따라 다릅니다.

## 지원되는 채널

- [WhatsApp](/ko-KR/channels/whatsapp) — 가장 인기 있음; Baileys를 사용하며 QR 페어링이 필요합니다.
- [Telegram](/ko-KR/channels/telegram) — grammY를 통한 Bot API; 그룹을 지원합니다.
- [Discord](/ko-KR/channels/discord) — Discord Bot API + Gateway; 서버, 채널, DM을 지원합니다.
- [Slack](/ko-KR/channels/slack) — Bolt SDK; 워크스페이스 앱.
- [Feishu](/ko-KR/channels/feishu) — WebSocket을 통한 Feishu/Lark 봇 (플러그인, 별도 설치).
- [Google Chat](/ko-KR/channels/googlechat) — HTTP 웹훅을 통한 Google Chat API 앱.
- [Mattermost](/ko-KR/channels/mattermost) — Bot API + WebSocket; 채널, 그룹, DM (플러그인, 별도 설치).
- [Signal](/ko-KR/channels/signal) — signal-cli; 프라이버시 중심.
- [BlueBubbles](/ko-KR/channels/bluebubbles) — **iMessage에 권장**; BlueBubbles macOS 서버 REST API를 사용하며 전체 기능 지원 (수정, 전송 취소, 효과, 반응, 그룹 관리 — macOS 26 Tahoe에서 수정 기능 현재 깨짐).
- [iMessage](/ko-KR/channels/imessage) — macOS 전용; imsg를 통한 네이티브 통합 (레거시, 새 설정에는 BlueBubbles 고려).
- [Microsoft Teams](/ko-KR/channels/msteams) — Bot Framework; 엔터프라이즈 지원 (플러그인, 별도 설치).
- [LINE](/ko-KR/channels/line) — LINE Messaging API 봇 (플러그인, 별도 설치).
- [Nextcloud Talk](/ko-KR/channels/nextcloud-talk) — Nextcloud Talk을 통한 셀프 호스팅 채팅 (플러그인, 별도 설치).
- [Matrix](/ko-KR/channels/matrix) — Matrix 프로토콜 (플러그인, 별도 설치).
- [Nostr](/ko-KR/channels/nostr) — NIP-04를 통한 탈중앙화 DM (플러그인, 별도 설치).
- [Tlon](/ko-KR/channels/tlon) — Urbit 기반 메신저 (플러그인, 별도 설치).
- [Twitch](/ko-KR/channels/twitch) — IRC 연결을 통한 Twitch 채팅 (플러그인, 별도 설치).
- [Zalo](/ko-KR/channels/zalo) — Zalo Bot API; 베트남의 인기 메신저 (플러그인, 별도 설치).
- [Zalo Personal](/ko-KR/channels/zalouser) — QR 로그인을 통한 Zalo 개인 계정 (플러그인, 별도 설치).
- [WebChat](/ko-KR/web/webchat) — WebSocket을 통한 게이트웨이 WebChat UI.

## 참고사항

- 채널은 동시에 실행할 수 있습니다; 여러 개를 구성하면 OpenClaw이 채팅별로 라우팅합니다.
- 가장 빠른 설정은 일반적으로 **Telegram**입니다 (간단한 봇 토큰). WhatsApp은 QR 페어링이 필요하고
  디스크에 더 많은 상태를 저장합니다.
- 그룹 동작은 채널에 따라 다릅니다; [그룹](/ko-KR/concepts/groups)을 참조하세요.
- 안전을 위해 DM 페어링과 허용목록이 적용됩니다; [보안](/ko-KR/gateway/security)을 참조하세요.
- Telegram 내부 동작: [grammY 노트](/ko-KR/channels/grammy).
- 문제 해결: [채널 문제 해결](/ko-KR/channels/troubleshooting).
- 모델 프로바이더는 별도로 문서화되어 있습니다; [모델 프로바이더](/ko-KR/providers/models)를 참조하세요.

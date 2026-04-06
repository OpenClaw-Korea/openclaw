---
summary: "grammY를 통한 Telegram Bot API 통합 및 설정 참고사항"
read_when:
  - Telegram 또는 grammY 경로 작업 시
title: grammY
---

# grammY 통합 (Telegram Bot API)

# grammY를 선택한 이유

- 내장 롱 폴링 + 웹훅 헬퍼, 미들웨어, 에러 핸들링, 속도 제한 기능을 갖춘 TS-first Bot API 클라이언트입니다.
- 직접 fetch + FormData를 구성하는 것보다 깔끔한 미디어 헬퍼를 제공하며 모든 Bot API 메서드를 지원합니다.
- 확장 가능: 커스텀 fetch를 통한 프록시 지원, 세션 미들웨어 (선택사항), 타입 안전 컨텍스트를 제공합니다.

# 출시 내용

- **단일 클라이언트 경로:** fetch 기반 구현 제거됨. grammY가 이제 유일한 Telegram 클라이언트입니다 (전송 + 게이트웨이). grammY throttler가 기본적으로 활성화되어 있습니다.
- **게이트웨이:** `monitorTelegramProvider`는 grammY `Bot`을 구성하고, 멘션/허용목록 게이팅을 연결하며, `getFile`/`download`를 통한 미디어 다운로드를 처리하고, `sendMessage/sendPhoto/sendVideo/sendAudio/sendDocument`로 답장을 전달합니다. `webhookCallback`을 통한 롱 폴링 또는 웹훅을 지원합니다.
- **프록시:** 선택사항 `channels.telegram.proxy`는 grammY의 `client.baseFetch`를 통해 `undici.ProxyAgent`를 사용합니다.
- **웹훅 지원:** `webhook-set.ts`는 `setWebhook/deleteWebhook`을 래핑합니다. `webhook.ts`는 헬스 체크 + 안정적인 종료 기능과 함께 콜백을 호스팅합니다. `channels.telegram.webhookUrl` + `channels.telegram.webhookSecret`이 설정되면 게이트웨이는 웹훅 모드를 활성화합니다 (그렇지 않으면 롱 폴링).
- **세션:** 직접 채팅은 에이전트 메인 세션으로 통합됩니다 (`agent:<agentId>:<mainKey>`). 그룹은 `agent:<agentId>:telegram:group:<chatId>`를 사용합니다. 답장은 같은 채널로 라우팅됩니다.
- **설정 옵션:** `channels.telegram.botToken`, `channels.telegram.dmPolicy`, `channels.telegram.groups` (허용목록 + 멘션 기본값), `channels.telegram.allowFrom`, `channels.telegram.groupAllowFrom`, `channels.telegram.groupPolicy`, `channels.telegram.mediaMaxMb`, `channels.telegram.linkPreview`, `channels.telegram.proxy`, `channels.telegram.webhookSecret`, `channels.telegram.webhookUrl`.
- **초안 스트리밍:** 선택사항 `channels.telegram.streamMode`는 개인 주제 채팅에서 `sendMessageDraft`를 사용합니다 (Bot API 9.3+). 이는 채널 블록 스트리밍과는 별개입니다.
- **테스트:** grammY 목 객체는 DM + 그룹 멘션 게이팅 및 아웃바운드 전송을 커버합니다. 추가 미디어/웹훅 픽스처도 환영합니다.

미해결 질문

- Bot API 429 에러가 발생하면 선택사항 grammY 플러그인 (throttler) 사용.
- 더 구조화된 미디어 테스트 추가 (스티커, 음성 노트).
- 웹훅 리스닝 포트를 설정 가능하게 만들기 (게이트웨이를 통하지 않는 한 현재 8787로 고정).

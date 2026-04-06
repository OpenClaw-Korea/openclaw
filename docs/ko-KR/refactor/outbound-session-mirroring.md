---
title: 아웃바운드 세션 미러링 리팩토링 (이슈 #1520)
description: 아웃바운드 세션 미러링 리팩토링 관련 노트, 의사결정, 테스트 및 미해결 항목을 추적합니다.
---

# 아웃바운드 세션 미러링 리팩토링 (이슈 #1520)

## 상태

- 진행 중입니다.
- 코어 + 플러그인 채널 라우팅이 아웃바운드 미러링을 위해 업데이트되었습니다.
- 게이트웨이 전송이 이제 sessionKey가 생략되었을 때 대상 세션을 파생시킵니다.

## 컨텍스트

아웃바운드 전송이 대상 채널 세션이 아닌 현재 에이전트 세션(도구 세션 키)으로 미러링되었습니다. 인바운드 라우팅은 채널/피어 세션 키를 사용하므로 아웃바운드 응답이 잘못된 세션에 도달했고 초기 연락처 대상에는 종종 세션 항목이 없었습니다.

## 목표

- 아웃바운드 메시지를 대상 채널 세션 키로 미러링합니다.
- 누락된 경우 아웃바운드에 세션 항목을 생성합니다.
- 스레드/토픽 범위를 인바운드 세션 키와 정렬합니다.
- 코어 채널과 번들 확장을 포함합니다.

## 구현 요약

- 새로운 아웃바운드 세션 라우팅 헬퍼:
  - `src/infra/outbound/outbound-session.ts`
  - `resolveOutboundSessionRoute`는 `buildAgentSessionKey`(dmScope + identityLinks)를 사용하여 대상 sessionKey를 구축합니다.
  - `ensureOutboundSessionEntry`는 `recordSessionMetaFromInbound`를 통해 최소한의 `MsgContext`를 작성합니다.
- `runMessageAction`(전송)이 대상 sessionKey를 파생시키고 이를 미러링을 위해 `executeSendAction`에 전달합니다.
- `message-tool`은 더 이상 직접 미러링하지 않으며, 현재 세션 키에서만 agentId를 해석합니다.
- 플러그인 전송 경로는 파생된 sessionKey를 사용하여 `appendAssistantMessageToSessionTranscript`를 통해 미러링합니다.
- 게이트웨이 전송은 제공되지 않은 경우 대상 세션 키(기본 에이전트)를 파생시키고 세션 항목을 보장합니다.

## 스레드/토픽 처리

- Slack: replyTo/threadId -> `resolveThreadSessionKeys`(접미사).
- Discord: threadId/replyTo -> `resolveThreadSessionKeys`(인바운드와 일치하도록 `useSuffix=false`, 스레드 채널 ID가 이미 세션을 범위 지정함).
- Telegram: 토픽 ID는 `buildTelegramGroupPeerId`를 통해 `chatId:topic:<id>`로 매핑됩니다.

## 포함된 확장

- Matrix, MS Teams, Mattermost, BlueBubbles, Nextcloud Talk, Zalo, Zalo Personal, Nostr, Tlon입니다.
- 참고사항:
  - Mattermost 대상이 이제 DM 세션 키 라우팅을 위해 `@`를 제거합니다.
  - Zalo Personal은 1:1 대상에 DM 피어 종류를 사용합니다(그룹이 있을 때만 `group:` 사용).
  - BlueBubbles 그룹 대상이 인바운드 세션 키와 일치하도록 `chat_*` 접두사를 제거합니다.
  - Slack 자동 스레드 미러링이 채널 ID를 대소문자를 구분하지 않고 일치시킵니다.
  - 게이트웨이 전송이 제공된 세션 키를 미러링하기 전에 소문자로 변환합니다.

## 의사결정

- **게이트웨이 전송 세션 파생**: sessionKey가 제공되면 사용합니다. 생략된 경우 대상 + 기본 에이전트에서 sessionKey를 파생시키고 미러링합니다.
- **세션 항목 생성**: 항상 `recordSessionMetaFromInbound`를 사용하여 Provider/From/To/ChatType/AccountId/Originating\*을 인바운드 형식과 정렬합니다.
- **대상 정규화**: 아웃바운드 라우팅은 사용 가능한 경우 해석된 대상(`resolveChannelTarget` 이후)을 사용합니다.
- **세션 키 대소문자 구분**: 쓰기 및 마이그레이션 중에 세션 키를 소문자로 정규화합니다.

## 추가/업데이트된 테스트

- `src/infra/outbound/outbound-session.test.ts`
  - Slack 스레드 세션 키.
  - Telegram 토픽 세션 키.
  - Discord를 사용한 dmScope identityLinks.
- `src/agents/tools/message-tool.test.ts`
  - 세션 키에서 agentId를 파생시킵니다(sessionKey가 전달되지 않음).
- `src/gateway/server-methods/send.test.ts`
  - 생략되었을 때 세션 키를 파생시키고 세션 항목을 생성합니다.

## 미해결 항목 / 후속 조치

- Voice-call 플러그인은 사용자 정의 `voice:<phone>` 세션 키를 사용합니다. 아웃바운드 매핑이 여기서 표준화되지 않습니다. message-tool이 voice-call 전송을 지원해야 하는 경우 명시적 매핑을 추가합니다.
- 번들 세트 이상으로 비표준 `From/To` 형식을 사용하는 외부 플러그인이 있는지 확인합니다.

## 수정된 파일

- `src/infra/outbound/outbound-session.ts`
- `src/infra/outbound/outbound-send-service.ts`
- `src/infra/outbound/message-action-runner.ts`
- `src/agents/tools/message-tool.ts`
- `src/gateway/server-methods/send.ts`
- 테스트 위치:
  - `src/infra/outbound/outbound-session.test.ts`
  - `src/agents/tools/message-tool.test.ts`
  - `src/gateway/server-methods/send.test.ts`

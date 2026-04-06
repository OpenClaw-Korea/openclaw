---
summary: "채널별(WhatsApp, Telegram, Discord, Slack) 라우팅 규칙 및 공유 컨텍스트"
read_when:
  - 채널 라우팅 또는 인박스 동작 변경 시
title: "채널 라우팅"
---

# 채널 및 라우팅

OpenClaw는 답장을 **메시지가 온 채널로 다시** 라우팅합니다. 모델이 채널을 선택하지 않으며, 라우팅은 결정론적이고 호스트 설정에 의해 제어됩니다.

## 주요 용어

- **채널**: `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`, `webchat`.
- **AccountId**: 채널별 계정 인스턴스(지원되는 경우).
- **AgentId**: 격리된 워크스페이스 + 세션 저장소("브레인").
- **SessionKey**: 컨텍스트를 저장하고 동시성을 제어하는 데 사용되는 버킷 키.

## 세션 키 형태 (예시)

다이렉트 메시지는 에이전트의 **메인** 세션으로 축소됩니다:

- `agent:<agentId>:<mainKey>` (기본값: `agent:main:main`)

그룹 및 채널은 채널별로 격리됩니다:

- 그룹: `agent:<agentId>:<channel>:group:<id>`
- 채널/룸: `agent:<agentId>:<channel>:channel:<id>`

스레드:

- Slack/Discord 스레드는 기본 키에 `:thread:<threadId>`를 추가합니다.
- Telegram 포럼 토픽은 그룹 키에 `:topic:<topicId>`를 포함합니다.

예시:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## 라우팅 규칙 (에이전트 선택 방법)

라우팅은 각 인바운드 메시지에 대해 **하나의 에이전트**를 선택합니다:

1. **정확한 피어 매치** (`bindings`에 `peer.kind` + `peer.id` 포함).
2. **길드 매치** (Discord) `guildId`를 통해.
3. **팀 매치** (Slack) `teamId`를 통해.
4. **계정 매치** (채널의 `accountId`).
5. **채널 매치** (해당 채널의 모든 계정).
6. **기본 에이전트** (`agents.list[].default`, 그렇지 않으면 첫 번째 목록 항목, 폴백은 `main`).

매치된 에이전트가 어떤 워크스페이스와 세션 저장소를 사용할지 결정합니다.

## 브로드캐스트 그룹 (여러 에이전트 실행)

브로드캐스트 그룹을 사용하면 **OpenClaw가 일반적으로 응답할 때** 동일한 피어에 대해 **여러 에이전트**를 실행할 수 있습니다(예: WhatsApp 그룹에서 멘션/활성화 게이팅 후).

설정:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

참조: [브로드캐스트 그룹](/broadcast-groups).

## 설정 개요

- `agents.list`: 명명된 에이전트 정의(워크스페이스, 모델 등).
- `bindings`: 인바운드 채널/계정/피어를 에이전트에 매핑합니다.

예시:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## 세션 저장소

세션 저장소는 상태 디렉토리(기본값 `~/.openclaw`) 아래에 있습니다:

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL 트랜스크립트는 저장소와 함께 있습니다

`session.store` 및 `{agentId}` 템플릿을 통해 저장소 경로를 재정의할 수 있습니다.

## WebChat 동작

WebChat은 **선택된 에이전트**에 연결되며 에이전트의 메인 세션을 기본값으로 사용합니다. 이 때문에 WebChat을 사용하면 해당 에이전트의 크로스 채널 컨텍스트를 한 곳에서 볼 수 있습니다.

## 답장 컨텍스트

인바운드 답장에는 다음이 포함됩니다:

- 가능한 경우 `ReplyToId`, `ReplyToBody` 및 `ReplyToSender`.
- 인용된 컨텍스트는 `[Replying to ...]` 블록으로 `Body`에 추가됩니다.

이는 모든 채널에서 일관됩니다.

---
summary: "소켓 또는 HTTP 웹훅 모드를 위한 Slack 설정"
read_when: "Slack 설정 또는 Slack 소켓/HTTP 모드 디버깅 시"
title: "Slack"
---

# Slack

## 소켓 모드 (기본값)

### 빠른 설정 (초보자용)

1. Slack 앱을 생성하고 **Socket Mode**를 활성화하세요.
2. **App Token** (`xapp-...`)과 **Bot Token** (`xoxb-...`)을 생성하세요.
3. OpenClaw에 토큰을 설정하고 게이트웨이를 시작하세요.

최소 설정:

```json5
{
  channels: {
    slack: {
      enabled: true,
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

### 설정

1. https://api.slack.com/apps에서 Slack 앱을 생성하세요 (From scratch).
2. **Socket Mode** → 켜기. 그런 다음 **Basic Information** → **App-Level Tokens** → **Generate Token and Scopes**로 `connections:write` 스코프와 함께 이동하세요. **App Token** (`xapp-...`)을 복사하세요.
3. **OAuth & Permissions** → 봇 토큰 스코프를 추가하세요 (아래 매니페스트 사용). **Install to Workspace**를 클릭하세요. **Bot User OAuth Token** (`xoxb-...`)을 복사하세요.
4. 선택사항: **OAuth & Permissions** → **User Token Scopes**를 추가하세요 (아래 읽기 전용 목록 참조). 앱을 재설치하고 **User OAuth Token** (`xoxp-...`)을 복사하세요.
5. **Event Subscriptions** → 이벤트를 활성화하고 다음을 구독하세요:
   - `message.*` (편집/삭제/스레드 브로드캐스트 포함)
   - `app_mention`
   - `reaction_added`, `reaction_removed`
   - `member_joined_channel`, `member_left_channel`
   - `channel_rename`
   - `pin_added`, `pin_removed`
6. 읽고 싶은 채널에 봇을 초대하세요.
7. Slash Commands → `channels.slack.slashCommand`를 사용하는 경우 `/openclaw`를 생성하세요. 네이티브 명령을 활성화하는 경우 빌트인 명령당 하나의 슬래시 명령을 추가하세요 (`/help` 목록과 동일한 이름). 네이티브는 `channels.slack.commands.native: true`로 설정하지 않는 한 Slack에서는 기본적으로 꺼져 있습니다 (전역 `commands.native`는 `"auto"`이며 Slack은 꺼짐).
8. App Home → **Messages Tab**을 활성화하여 사용자가 봇에게 DM을 보낼 수 있도록 하세요.

스코프와 이벤트가 동기화되도록 아래 매니페스트를 사용하세요.

다중 계정 지원: `channels.slack.accounts`를 계정별 토큰 및 선택사항 `name`과 함께 사용하세요. 공유 패턴은 [`gateway/configuration`](/ko-KR/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts)을 참조하세요.

### OpenClaw 설정 (최소)

환경 변수를 통해 토큰을 설정하세요 (권장):

- `SLACK_APP_TOKEN=xapp-...`
- `SLACK_BOT_TOKEN=xoxb-...`

또는 설정을 통해:

```json5
{
  channels: {
    slack: {
      enabled: true,
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

### 사용자 토큰 (선택사항)

OpenClaw은 읽기 작업 (히스토리,
핀, 반응, 이모지, 멤버 정보)에 Slack 사용자 토큰 (`xoxp-...`)을 사용할 수 있습니다. 기본적으로 이것은 읽기 전용으로 유지됩니다: 읽기는
사용자 토큰이 있을 때 선호하며, 쓰기는 명시적으로 옵트인하지 않는 한 여전히 봇 토큰을 사용합니다. `userTokenReadOnly: false`인 경우에도 봇 토큰이 사용 가능할 때 쓰기에 선호됩니다.

사용자 토큰은 설정 파일에서 구성됩니다 (환경 변수 지원 없음). 다중 계정의 경우 `channels.slack.accounts.<id>.userToken`을 설정하세요.

봇 + 앱 + 사용자 토큰 예시:

```json5
{
  channels: {
    slack: {
      enabled: true,
      appToken: "xapp-...",
      botToken: "xoxb-...",
      userToken: "xoxp-...",
    },
  },
}
```

명시적으로 설정된 userTokenReadOnly 예시 (사용자 토큰 쓰기 허용):

```json5
{
  channels: {
    slack: {
      enabled: true,
      appToken: "xapp-...",
      botToken: "xoxb-...",
      userToken: "xoxp-...",
      userTokenReadOnly: false,
    },
  },
}
```

#### 토큰 사용

- 읽기 작업 (히스토리, 반응 목록, 핀 목록, 이모지 목록, 멤버 정보,
  검색)은 구성된 경우 사용자 토큰을 선호하며, 그렇지 않으면 봇 토큰을 사용합니다.
- 쓰기 작업 (메시지 보내기/편집/삭제, 반응 추가/제거, 핀/고정 해제,
  파일 업로드)은 기본적으로 봇 토큰을 사용합니다. `userTokenReadOnly: false`이고
  봇 토큰이 없는 경우 OpenClaw은 사용자 토큰으로 대체합니다.

### 히스토리 컨텍스트

- `channels.slack.historyLimit` (또는 `channels.slack.accounts.*.historyLimit`)는 프롬프트에 포함할 최근 채널/그룹 메시지 수를 제어합니다.
- `messages.groupChat.historyLimit`로 대체됩니다. 비활성화하려면 `0`으로 설정하세요 (기본값 50).

## HTTP 모드 (Events API)

게이트웨이가 HTTPS를 통해 Slack에서 도달할 수 있는 경우 (서버 배포에 일반적) HTTP 웹훅 모드를 사용하세요.
HTTP 모드는 공유 요청 URL로 Events API + Interactivity + Slash Commands를 사용합니다.

### 설정

1. Slack 앱을 생성하고 **Socket Mode를 비활성화**하세요 (HTTP만 사용하는 경우 선택사항).
2. **Basic Information** → **Signing Secret**을 복사하세요.
3. **OAuth & Permissions** → 앱을 설치하고 **Bot User OAuth Token** (`xoxb-...`)을 복사하세요.
4. **Event Subscriptions** → 이벤트를 활성화하고 **Request URL**을 게이트웨이 웹훅 경로 (기본값 `/slack/events`)로 설정하세요.
5. **Interactivity & Shortcuts** → 활성화하고 같은 **Request URL**을 설정하세요.
6. **Slash Commands** → 명령에 같은 **Request URL**을 설정하세요.

예시 요청 URL:
`https://gateway-host/slack/events`

### OpenClaw 설정 (최소)

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

다중 계정 HTTP 모드: `channels.slack.accounts.<id>.mode = "http"`을 설정하고 각 Slack 앱이 자체 URL을 가리킬 수 있도록 계정당 고유한
`webhookPath`를 제공하세요.

### 매니페스트 (선택사항)

이 Slack 앱 매니페스트를 사용하여 앱을 빠르게 생성하세요 (원하는 경우 이름/명령 조정). 사용자 토큰을 구성할 계획이면 사용자 스코프를 포함하세요.

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": false
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write",
        "channels:history",
        "channels:read",
        "groups:history",
        "groups:read",
        "groups:write",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "users:read",
        "app_mentions:read",
        "reactions:read",
        "reactions:write",
        "pins:read",
        "pins:write",
        "emoji:read",
        "commands",
        "files:read",
        "files:write"
      ],
      "user": [
        "channels:history",
        "channels:read",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "users:read",
        "reactions:read",
        "pins:read",
        "emoji:read",
        "search:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "reaction_added",
        "reaction_removed",
        "member_joined_channel",
        "member_left_channel",
        "channel_rename",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

네이티브 명령을 활성화하는 경우 노출하려는 명령당 하나의 `slash_commands` 항목을 추가하세요 (`/help` 목록과 일치). `channels.slack.commands.native`로 재정의하세요.

## 스코프 (현재 vs 선택사항)

Slack의 Conversations API는 타입별로 스코프가 지정됩니다: 실제로 접근하는 대화 유형에 대한 스코프만 필요합니다 (채널, 그룹, im, mpim). 개요는
https://docs.slack.dev/apis/web-api/using-the-conversations-api/를 참조하세요.

### 봇 토큰 스코프 (필수)

- `chat:write` (`chat.postMessage`를 통한 메시지 보내기/업데이트/삭제)
  https://docs.slack.dev/reference/methods/chat.postMessage
- `im:write` (사용자 DM용 `conversations.open`을 통해 DM 열기)
  https://docs.slack.dev/reference/methods/conversations.open
- `channels:history`, `groups:history`, `im:history`, `mpim:history`
  https://docs.slack.dev/reference/methods/conversations.history
- `channels:read`, `groups:read`, `im:read`, `mpim:read`
  https://docs.slack.dev/reference/methods/conversations.info
- `users:read` (사용자 조회)
  https://docs.slack.dev/reference/methods/users.info
- `reactions:read`, `reactions:write` (`reactions.get` / `reactions.add`)
  https://docs.slack.dev/reference/methods/reactions.get
  https://docs.slack.dev/reference/methods/reactions.add
- `pins:read`, `pins:write` (`pins.list` / `pins.add` / `pins.remove`)
  https://docs.slack.dev/reference/scopes/pins.read
  https://docs.slack.dev/reference/scopes/pins.write
- `emoji:read` (`emoji.list`)
  https://docs.slack.dev/reference/scopes/emoji.read
- `files:write` (`files.uploadV2`를 통한 업로드)
  https://docs.slack.dev/messaging/working-with-files/#upload

### 사용자 토큰 스코프 (선택사항, 기본적으로 읽기 전용)

`channels.slack.userToken`을 구성하는 경우 **User Token Scopes** 아래에 이를 추가하세요.

- `channels:history`, `groups:history`, `im:history`, `mpim:history`
- `channels:read`, `groups:read`, `im:read`, `mpim:read`
- `users:read`
- `reactions:read`
- `pins:read`
- `emoji:read`
- `search:read`

### 오늘은 필요 없음 (하지만 향후 가능성)

- `mpim:write` (`conversations.open`을 통한 그룹 DM 열기/DM 시작을 추가하는 경우에만)
- `groups:write` (비공개 채널 관리를 추가하는 경우에만: 생성/이름 변경/초대/보관)
- `chat:write.public` (봇이 없는 채널에 게시하려는 경우에만)
  https://docs.slack.dev/reference/scopes/chat.write.public
- `users:read.email` (`users.info`의 이메일 필드가 필요한 경우에만)
  https://docs.slack.dev/changelog/2017-04-narrowing-email-access
- `files:read` (파일 메타데이터 나열/읽기를 시작하는 경우에만)

## 설정

Slack은 소켓 모드만 사용합니다 (HTTP 웹훅 서버 없음). 두 토큰을 모두 제공하세요:

```json
{
  "slack": {
    "enabled": true,
    "botToken": "xoxb-...",
    "appToken": "xapp-...",
    "groupPolicy": "allowlist",
    "dm": {
      "enabled": true,
      "policy": "pairing",
      "allowFrom": ["U123", "U456", "*"],
      "groupEnabled": false,
      "groupChannels": ["G123"],
      "replyToMode": "all"
    },
    "channels": {
      "C123": { "allow": true, "requireMention": true },
      "#general": {
        "allow": true,
        "requireMention": true,
        "users": ["U123"],
        "skills": ["search", "docs"],
        "systemPrompt": "Keep answers short."
      }
    },
    "reactionNotifications": "own",
    "reactionAllowlist": ["U123"],
    "replyToMode": "off",
    "actions": {
      "reactions": true,
      "messages": true,
      "pins": true,
      "memberInfo": true,
      "emojiList": true
    },
    "slashCommand": {
      "enabled": true,
      "name": "openclaw",
      "sessionPrefix": "slack:slash",
      "ephemeral": true
    },
    "textChunkLimit": 4000,
    "mediaMaxMb": 20
  }
}
```

토큰은 환경 변수를 통해서도 제공할 수 있습니다:

- `SLACK_BOT_TOKEN`
- `SLACK_APP_TOKEN`

확인 반응은 `messages.ackReaction` +
`messages.ackReactionScope`를 통해 전역적으로 제어됩니다. `messages.removeAckAfterReply`를 사용하여
봇이 답장한 후 확인 반응을 지우세요.

## 제한

- 아웃바운드 텍스트는 `channels.slack.textChunkLimit`로 청크됩니다 (기본값 4000).
- 선택적 줄바꿈 청킹: `channels.slack.chunkMode="newline"`을 설정하여 길이 청킹 전에 빈 줄 (단락 경계)에서 분할합니다.
- 미디어 업로드는 `channels.slack.mediaMaxMb`로 제한됩니다 (기본값 20).

## 답장 스레딩

기본적으로 OpenClaw은 메인 채널에서 답장합니다. `channels.slack.replyToMode`를 사용하여 자동 스레딩을 제어하세요:

| 모드    | 동작                                                                                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `off`   | **기본값.** 메인 채널에서 답장. 트리거하는 메시지가 이미 스레드에 있는 경우에만 스레드.                                                                             |
| `first` | 첫 번째 답장은 스레드 (트리거하는 메시지 아래)로 이동하며, 후속 답장은 메인 채널로 이동합니다. 스레드 혼잡을 피하면서 컨텍스트를 볼 수 있게 유지하는 데 유용합니다. |
| `all`   | 모든 답장이 스레드로 이동합니다. 대화를 포함하지만 가시성이 감소할 수 있습니다.                                                                                     |

모드는 자동 답장과 에이전트 도구 호출 (`slack sendMessage`) 모두에 적용됩니다.

### 채팅 유형별 스레딩

`channels.slack.replyToModeByChatType`를 설정하여 채팅 유형별로 다른 스레딩 동작을 구성할 수 있습니다:

```json5
{
  channels: {
    slack: {
      replyToMode: "off", // 채널 기본값
      replyToModeByChatType: {
        direct: "all", // DM은 항상 스레드
        group: "first", // 그룹 DM/MPIM은 첫 번째 답장 스레드
      },
    },
  },
}
```

지원되는 채팅 유형:

- `direct`: 1:1 DM (Slack `im`)
- `group`: 그룹 DM / MPIM (Slack `mpim`)
- `channel`: 표준 채널 (공개/비공개)

우선순위:

1. `replyToModeByChatType.<chatType>`
2. `replyToMode`
3. 프로바이더 기본값 (`off`)

레거시 `channels.slack.dm.replyToMode`는 채팅 유형 재정의가 설정되지 않은 경우 `direct`에 대한 대체로 여전히 허용됩니다.

예시:

DM만 스레드:

```json5
{
  channels: {
    slack: {
      replyToMode: "off",
      replyToModeByChatType: { direct: "all" },
    },
  },
}
```

그룹 DM은 스레드하지만 채널은 루트에 유지:

```json5
{
  channels: {
    slack: {
      replyToMode: "off",
      replyToModeByChatType: { group: "first" },
    },
  },
}
```

채널은 스레드하고 DM은 루트에 유지:

```json5
{
  channels: {
    slack: {
      replyToMode: "first",
      replyToModeByChatType: { direct: "off", group: "off" },
    },
  },
}
```

### 수동 스레딩 태그

세밀한 제어를 위해 에이전트 응답에서 이러한 태그를 사용하세요:

- `[[reply_to_current]]` — 트리거하는 메시지에 답장 (스레드 시작/계속).
- `[[reply_to:<id>]]` — 특정 메시지 id에 답장.

## 세션 + 라우팅

- DM은 `main` 세션을 공유합니다 (WhatsApp/Telegram과 같음).
- 채널은 `agent:<agentId>:slack:channel:<channelId>` 세션에 매핑됩니다.
- 슬래시 명령은 `agent:<agentId>:slack:slash:<userId>` 세션을 사용합니다 (`channels.slack.slashCommand.sessionPrefix`를 통해 접두사 구성 가능).
- Slack이 `channel_type`을 제공하지 않으면 OpenClaw은 채널 ID 접두사 (`D`, `C`, `G`)에서 추론하고 세션 키를 안정적으로 유지하기 위해 `channel`로 기본 설정됩니다.
- 네이티브 명령 등록은 `commands.native` (전역 기본값 `"auto"` → Slack 꺼짐)를 사용하며 `channels.slack.commands.native`로 워크스페이스별로 재정의할 수 있습니다. 텍스트 명령은 독립 `/...` 메시지가 필요하며 `commands.text: false`로 비활성화할 수 있습니다. Slack 슬래시 명령은 Slack 앱에서 관리되며 자동으로 제거되지 않습니다. `commands.useAccessGroups: false`를 사용하여 명령의 접근 그룹 검사를 우회하세요.
- 전체 명령 목록 + 설정: [슬래시 명령](/ko-KR/tools/slash-commands)

## DM 보안 (페어링)

- 기본값: `channels.slack.dm.policy="pairing"` — 알 수 없는 DM 발신자는 페어링 코드를 받습니다 (1시간 후 만료).
- 승인 방법: `openclaw pairing approve slack <code>`.
- 모든 사람을 허용하려면: `channels.slack.dm.policy="open"` 및 `channels.slack.dm.allowFrom=["*"]`를 설정하세요.
- `channels.slack.dm.allowFrom`은 사용자 ID, @핸들 또는 이메일을 허용합니다 (토큰이 허용할 때 시작 시 확인됨). 마법사는 사용자 이름을 허용하고 토큰이 허용할 때 설정 중에 id로 확인합니다.

## 그룹 정책

- `channels.slack.groupPolicy`는 채널 처리를 제어합니다 (`open|disabled|allowlist`).
- `allowlist`는 채널이 `channels.slack.channels`에 나열되어야 합니다.
- `SLACK_BOT_TOKEN`/`SLACK_APP_TOKEN`만 설정하고 `channels.slack` 섹션을 만들지 않은 경우
  런타임은 `groupPolicy`를 `open`으로 기본 설정합니다. `channels.slack.groupPolicy`,
  `channels.defaults.groupPolicy` 또는 채널 허용목록을 추가하여 잠그세요.
- 구성 마법사는 `#channel` 이름을 허용하고 가능한 경우 ID로 확인합니다
  (공개 + 비공개). 여러 일치 항목이 있는 경우 활성 채널을 선호합니다.
- 시작 시 OpenClaw은 허용목록의 채널/사용자 이름을 ID로 확인하고 (토큰이 허용할 때)
  매핑을 기록합니다. 확인되지 않은 항목은 입력된 대로 유지됩니다.
- **채널 없음**을 허용하려면 `channels.slack.groupPolicy: "disabled"`를 설정하세요 (또는 빈 허용목록 유지).

채널 옵션 (`channels.slack.channels.<id>` 또는 `channels.slack.channels.<name>`):

- `allow`: `groupPolicy="allowlist"`일 때 채널 허용/거부.
- `requireMention`: 채널의 멘션 게이팅.
- `tools`: 선택적 채널별 도구 정책 재정의 (`allow`/`deny`/`alsoAllow`).
- `toolsBySender`: 선택적 채널 내 발신자별 도구 정책 재정의 (키는 발신자 id/@핸들/이메일; `"*"` 와일드카드 지원됨).
- `allowBots`: 이 채널에서 봇이 작성한 메시지 허용 (기본값: false).
- `users`: 선택적 채널별 사용자 허용목록.
- `skills`: 스킬 필터 (생략 = 모든 스킬, 비어 있음 = 없음).
- `systemPrompt`: 채널에 대한 추가 시스템 프롬프트 (주제/목적과 결합됨).
- `enabled`: 채널을 비활성화하려면 `false`로 설정.

## 전달 대상

cron/CLI 전송과 함께 사용하세요:

- DM용 `user:<id>`
- 채널용 `channel:<id>`

## 도구 액션

Slack 도구 액션은 `channels.slack.actions.*`로 게이팅할 수 있습니다:

| 액션 그룹  | 기본값 | 참고                  |
| ---------- | ------ | --------------------- |
| reactions  | 활성화 | 반응 + 반응 목록      |
| messages   | 활성화 | 읽기/보내기/편집/삭제 |
| pins       | 활성화 | 고정/고정 해제/목록   |
| memberInfo | 활성화 | 멤버 정보             |
| emojiList  | 활성화 | 커스텀 이모지 목록    |

## 보안 참고사항

- 쓰기는 기본적으로 봇 토큰을 사용하므로 상태 변경 액션이 앱의 봇 권한과 ID 범위에 유지됩니다.
- `userTokenReadOnly: false`를 설정하면 봇 토큰이 없을 때 쓰기
  작업에 사용자 토큰을 사용할 수 있으며, 이는 설치하는 사용자의 접근 권한으로 액션이 실행됨을 의미합니다. 사용자 토큰을 높은 권한으로 취급하고 액션 게이트와 허용목록을 엄격하게 유지하세요.
- 사용자 토큰 쓰기를 활성화하는 경우 사용자 토큰에 예상하는 쓰기
  스코프 (`chat:write`, `reactions:write`, `pins:write`,
  `files:write`)가 포함되어 있는지 확인하세요. 그렇지 않으면 해당 작업이 실패합니다.

## 참고

- 멘션 게이팅은 `channels.slack.channels`를 통해 제어됩니다 (`requireMention`을 `true`로 설정). `agents.list[].groupChat.mentionPatterns` (또는 `messages.groupChat.mentionPatterns`)도 멘션으로 계산됩니다.
- 멀티 에이전트 재정의: `agents.list[].groupChat.mentionPatterns`에 에이전트별 패턴을 설정하세요.
- 반응 알림은 `channels.slack.reactionNotifications`를 따릅니다 (`allowlist` 모드와 함께 `reactionAllowlist` 사용).
- 봇이 작성한 메시지는 기본적으로 무시됩니다. `channels.slack.allowBots` 또는 `channels.slack.channels.<id>.allowBots`를 통해 활성화하세요.
- 경고: 다른 봇에 대한 답장을 허용하는 경우 (`channels.slack.allowBots=true` 또는 `channels.slack.channels.<id>.allowBots=true`), `requireMention`, `channels.slack.channels.<id>.users` 허용목록 및/또는 `AGENTS.md` 및 `SOUL.md`의 명확한 가드레일로 봇 간 답장 루프를 방지하세요.
- Slack 도구의 경우 반응 제거 의미는 [/tools/reactions](/ko-KR/tools/reactions)에 있습니다.
- 첨부 파일은 허용되고 크기 제한 내에 있을 때 미디어 저장소에 다운로드됩니다.

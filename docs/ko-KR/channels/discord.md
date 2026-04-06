---
summary: "Discord 봇 지원 상태, 기능 및 구성"
read_when:
  - Discord 채널 기능 작업 시
title: "Discord"
---

# Discord (Bot API)

상태: 공식 Discord 봇 게이트웨이를 통한 DM 및 길드 텍스트 채널에 대해 준비 완료.

## 빠른 설정 (초보자용)

1. Discord 봇을 생성하고 봇 토큰을 복사하세요.
2. Discord 앱 설정에서 **Message Content Intent**를 활성화하세요 (허용목록 또는 이름 조회를 사용할 계획이면 **Server Members Intent**도 활성화).
3. OpenClaw에 토큰을 설정하세요:
   - 환경 변수: `DISCORD_BOT_TOKEN=...`
   - 또는 설정: `channels.discord.token: "..."`.
   - 둘 다 설정된 경우 설정이 우선합니다 (환경 변수 대체는 기본 계정 전용).
4. 메시지 권한으로 봇을 서버에 초대하세요 (DM만 원하는 경우 비공개 서버 생성).
5. 게이트웨이를 시작하세요.
6. DM 접근은 기본적으로 페어링입니다. 첫 연락 시 페어링 코드를 승인하세요.

최소 설정:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "YOUR_BOT_TOKEN",
    },
  },
}
```

## 목표

- Discord DM 또는 길드 채널을 통해 OpenClaw과 대화하세요.
- 직접 채팅은 에이전트의 메인 세션으로 축소됩니다 (기본값 `agent:main:main`). 길드 채널은 `agent:<agentId>:discord:channel:<channelId>`로 격리됩니다 (표시 이름은 `discord:<guildSlug>#<channelSlug>` 사용).
- 그룹 DM은 기본적으로 무시됩니다. `channels.discord.dm.groupEnabled`를 통해 활성화하고 선택적으로 `channels.discord.dm.groupChannels`로 제한하세요.
- 라우팅을 결정론적으로 유지하세요: 답장은 항상 도착한 채널로 돌아갑니다.

## 작동 방식

1. Discord 애플리케이션 → 봇을 생성하고, 필요한 인텐트 (DM + 길드 메시지 + 메시지 콘텐츠)를 활성화하고, 봇 토큰을 가져오세요.
2. 사용하려는 곳에서 메시지를 읽고 보낼 수 있는 권한으로 봇을 서버에 초대하세요.
3. `channels.discord.token` (또는 대체로 `DISCORD_BOT_TOKEN`)으로 OpenClaw을 구성하세요.
4. 게이트웨이를 실행하세요. 토큰이 있고 `channels.discord.enabled`가 `false`가 아니면 Discord 채널을 자동 시작합니다 (설정 우선, 환경 변수 대체).
   - 환경 변수를 선호하는 경우 `DISCORD_BOT_TOKEN`을 설정하세요 (설정 블록은 선택사항).
5. 직접 채팅: 전달 시 `user:<id>` (또는 `<@id>` 멘션)를 사용하세요. 모든 턴은 공유 `main` 세션에 들어갑니다. 순수 숫자 ID는 모호하며 거부됩니다.
6. 길드 채널: 전달을 위해 `channel:<channelId>`를 사용하세요. 멘션은 기본적으로 필요하며 길드별 또는 채널별로 설정할 수 있습니다.
7. 직접 채팅: `channels.discord.dm.policy` (기본값: `"pairing"`)를 통해 기본적으로 안전합니다. 알 수 없는 발신자는 페어링 코드를 받습니다 (1시간 후 만료). `openclaw pairing approve discord <code>`로 승인하세요.
   - 이전 "누구에게나 열림" 동작을 유지하려면: `channels.discord.dm.policy="open"` 및 `channels.discord.dm.allowFrom=["*"]`를 설정하세요.
   - 하드 허용목록: `channels.discord.dm.policy="allowlist"`를 설정하고 `channels.discord.dm.allowFrom`에 발신자를 나열하세요.
   - 모든 DM 무시: `channels.discord.dm.enabled=false` 또는 `channels.discord.dm.policy="disabled"`를 설정하세요.
8. 그룹 DM은 기본적으로 무시됩니다. `channels.discord.dm.groupEnabled`를 통해 활성화하고 선택적으로 `channels.discord.dm.groupChannels`로 제한하세요.
9. 선택적 길드 규칙: 길드 id (선호) 또는 슬러그로 키가 지정된 `channels.discord.guilds`를 설정하고, 채널별 규칙을 포함하세요.
10. 선택적 네이티브 명령: `commands.native`는 기본값 `"auto"` (Discord/Telegram에서 켜짐, Slack에서 꺼짐)입니다. `channels.discord.commands.native: true|false|"auto"`로 재정의하세요. `false`는 이전에 등록된 명령을 지웁니다. 텍스트 명령은 `commands.text`로 제어되며 독립 `/...` 메시지로 전송해야 합니다. `commands.useAccessGroups: false`를 사용하여 명령의 접근 그룹 검사를 우회하세요.
    - 전체 명령 목록 + 설정: [슬래시 명령](/ko-KR/tools/slash-commands)
11. 선택적 길드 컨텍스트 히스토리: 멘션에 답장할 때 마지막 N개의 길드 메시지를 컨텍스트로 포함하려면 `channels.discord.historyLimit` (기본값 20, `messages.groupChat.historyLimit`로 대체)를 설정하세요. 비활성화하려면 `0`으로 설정하세요.
12. 반응: 에이전트는 `discord` 도구를 통해 반응을 트리거할 수 있습니다 (`channels.discord.actions.*`로 게이팅됨).
    - 반응 제거 의미: [/tools/reactions](/ko-KR/tools/reactions) 참조.
    - `discord` 도구는 현재 채널이 Discord일 때만 노출됩니다.
13. 네이티브 명령은 공유 `main` 세션이 아닌 격리된 세션 키 (`agent:<agentId>:discord:slash:<userId>`)를 사용합니다.

참고: 이름 → id 해결은 길드 멤버 검색을 사용하며 Server Members Intent가 필요합니다. 봇이 멤버를 검색할 수 없는 경우 id 또는 `<@id>` 멘션을 사용하세요.
참고: 슬러그는 소문자이며 공백은 `-`로 대체됩니다. 채널 이름은 선행 `#` 없이 슬러그됩니다.
참고: 길드 컨텍스트 `[from:]` 줄에는 `author.tag` + `id`가 포함되어 핑 준비 답장을 쉽게 만듭니다.

## 설정 쓰기

기본적으로 Discord는 `/config set|unset`으로 트리거된 설정 업데이트 쓰기가 허용됩니다 (`commands.config: true` 필요).

비활성화하려면:

```json5
{
  channels: { discord: { configWrites: false } },
}
```

## 자신만의 봇 생성 방법

이것은 `#help`와 같은 서버 (길드) 채널에서 OpenClaw을 실행하기 위한 "Discord 개발자 포털" 설정입니다.

### 1) Discord 앱 + 봇 사용자 생성

1. Discord 개발자 포털 → **Applications** → **New Application**
2. 앱에서:
   - **Bot** → **Add Bot**
   - **Bot Token**을 복사하세요 (이것이 `DISCORD_BOT_TOKEN`에 넣는 것)

### 2) OpenClaw에 필요한 게이트웨이 인텐트 활성화

Discord는 명시적으로 활성화하지 않으면 "특권 인텐트"를 차단합니다.

**Bot** → **Privileged Gateway Intents**에서 활성화하세요:

- **Message Content Intent** (대부분의 길드에서 메시지 텍스트를 읽는 데 필요; 없으면 "Used disallowed intents"가 표시되거나 봇이 연결되지만 메시지에 반응하지 않음)
- **Server Members Intent** (권장; 일부 멤버/사용자 조회 및 길드의 허용목록 매칭에 필요)

일반적으로 **Presence Intent**는 필요하지 **않습니다**.

### 3) 초대 URL 생성 (OAuth2 URL Generator)

앱에서: **OAuth2** → **URL Generator**

**Scopes**

- ✅ `bot`
- ✅ `applications.commands` (네이티브 명령에 필요)

**Bot Permissions** (최소 기준)

- ✅ View Channels
- ✅ Send Messages
- ✅ Read Message History
- ✅ Embed Links
- ✅ Attach Files
- ✅ Add Reactions (선택사항이지만 권장)
- ✅ Use External Emojis / Stickers (선택사항; 원하는 경우에만)

디버깅 중이고 봇을 완전히 신뢰하지 않는 한 **Administrator**를 피하세요.

생성된 URL을 복사하고, 열고, 서버를 선택하고, 봇을 설치하세요.

### 4) id 가져오기 (길드/사용자/채널)

Discord는 모든 곳에서 숫자 id를 사용합니다. OpenClaw 설정은 id를 선호합니다.

1. Discord (데스크톱/웹) → **User Settings** → **Advanced** → **Developer Mode** 활성화
2. 마우스 오른쪽 버튼 클릭:
   - 서버 이름 → **Copy Server ID** (길드 id)
   - 채널 (예: `#help`) → **Copy Channel ID**
   - 사용자 → **Copy User ID**

### 5) OpenClaw 구성

#### 토큰

환경 변수를 통해 봇 토큰을 설정하세요 (서버에서 권장):

- `DISCORD_BOT_TOKEN=...`

또는 설정을 통해:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "YOUR_BOT_TOKEN",
    },
  },
}
```

다중 계정 지원: `channels.discord.accounts`를 계정별 토큰 및 선택사항 `name`과 함께 사용하세요. 공유 패턴은 [`gateway/configuration`](/ko-KR/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts)을 참조하세요.

#### 허용목록 + 채널 라우팅

예시 "단일 서버, 나만 허용, #help만 허용":

```json5
{
  channels: {
    discord: {
      enabled: true,
      dm: { enabled: false },
      guilds: {
        YOUR_GUILD_ID: {
          users: ["YOUR_USER_ID"],
          requireMention: true,
          channels: {
            help: { allow: true, requireMention: true },
          },
        },
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

참고:

- `requireMention: true`는 봇이 멘션될 때만 답장함을 의미합니다 (공유 채널에 권장).
- `agents.list[].groupChat.mentionPatterns` (또는 `messages.groupChat.mentionPatterns`)도 길드 메시지의 멘션으로 계산됩니다.
- 멀티 에이전트 재정의: `agents.list[].groupChat.mentionPatterns`에 에이전트별 패턴을 설정하세요.
- `channels`가 있는 경우 나열되지 않은 채널은 기본적으로 거부됩니다.
- `"*"` 채널 항목을 사용하여 모든 채널에 기본값을 적용하세요. 명시적 채널 항목은 와일드카드를 재정의합니다.
- 스레드는 스레드 채널 id를 명시적으로 추가하지 않는 한 상위 채널 설정 (허용목록, `requireMention`, 스킬, 프롬프트 등)을 상속합니다.
- 봇이 작성한 메시지는 기본적으로 무시됩니다. `channels.discord.allowBots=true`를 설정하여 허용하세요 (자신의 메시지는 필터링됨).
- 경고: 다른 봇에 대한 답장을 허용하는 경우 (`channels.discord.allowBots=true`), `requireMention`, `channels.discord.guilds.*.channels.<id>.users` 허용목록 및/또는 `AGENTS.md` 및 `SOUL.md`의 명확한 가드레일로 봇 간 답장 루프를 방지하세요.

### 6) 작동 확인

1. 게이트웨이를 시작하세요.
2. 서버 채널에서 `@Krill hello` (또는 봇 이름이 무엇이든)를 보내세요.
3. 아무 일도 일어나지 않으면: 아래 **문제 해결**을 확인하세요.

### 문제 해결

- 먼저: `openclaw doctor` 및 `openclaw channels status --probe`를 실행하세요 (실행 가능한 경고 + 빠른 감사).
- **"Used disallowed intents"**: 개발자 포털에서 **Message Content Intent** (및 **Server Members Intent**)를 활성화한 다음 게이트웨이를 재시작하세요.
- **봇이 연결되지만 길드 채널에서 답장하지 않음**:
  - **Message Content Intent** 누락, 또는
  - 봇에 채널 권한 (보기/보내기/히스토리 읽기) 부족, 또는
  - 설정에서 멘션이 필요하고 멘션하지 않음, 또는
  - 길드/채널 허용목록이 채널/사용자를 거부함.
- **`requireMention: false`인데도 답장 없음**:
- `channels.discord.groupPolicy`는 기본적으로 **allowlist**입니다. `"open"`으로 설정하거나 `channels.discord.guilds` 아래에 길드 항목을 추가하세요 (선택적으로 `channels.discord.guilds.<id>.channels` 아래에 채널을 나열하여 제한).
  - `DISCORD_BOT_TOKEN`만 설정하고 `channels.discord` 섹션을 만들지 않은 경우 런타임은
    `groupPolicy`를 `open`으로 기본 설정합니다. `channels.discord.groupPolicy`,
    `channels.defaults.groupPolicy` 또는 길드/채널 허용목록을 추가하여 잠그세요.
- `requireMention`은 `channels.discord.guilds` (또는 특정 채널) 아래에 있어야 합니다. 최상위 `channels.discord.requireMention`은 무시됩니다.
- **권한 감사** (`channels status --probe`)는 숫자 채널 ID만 확인합니다. `channels.discord.guilds.*.channels` 키로 슬러그/이름을 사용하는 경우 감사가 권한을 확인할 수 없습니다.
- **DM이 작동하지 않음**: `channels.discord.dm.enabled=false`, `channels.discord.dm.policy="disabled"` 또는 아직 승인되지 않음 (`channels.discord.dm.policy="pairing"`).
- **Discord의 Exec 승인**: Discord는 DM에서 exec 승인을 위한 **버튼 UI**를 지원합니다 (한 번 허용 / 항상 허용 / 거부). `/approve <id> ...`는 전달된 승인 전용이며 Discord의 버튼 프롬프트를 해결하지 않습니다. `❌ Failed to submit approval: Error: unknown approval id`가 표시되거나 UI가 표시되지 않으면 확인하세요:
  - 설정에서 `channels.discord.execApprovals.enabled: true`.
  - Discord 사용자 ID가 `channels.discord.execApprovals.approvers`에 나열됨 (UI는 승인자에게만 전송됨).
  - DM 프롬프트의 버튼 (**한 번 허용**, **항상 허용**, **거부**)을 사용하세요.
  - 더 넓은 승인 및 명령 흐름은 [Exec 승인](/ko-KR/tools/exec-approvals) 및 [슬래시 명령](/ko-KR/tools/slash-commands)을 참조하세요.

## 기능 및 제한

- DM 및 길드 텍스트 채널 (스레드는 별도 채널로 처리됨; 음성은 지원되지 않음).
- 타이핑 표시기는 최선 노력으로 전송됩니다. 메시지 청킹은 `channels.discord.textChunkLimit` (기본값 2000)를 사용하며 줄 수 (`channels.discord.maxLinesPerMessage`, 기본값 17)로 긴 답장을 분할합니다.
- 선택적 줄바꿈 청킹: `channels.discord.chunkMode="newline"`을 설정하여 길이 청킹 전에 빈 줄 (단락 경계)에서 분할합니다.
- 파일 업로드는 구성된 `channels.discord.mediaMaxMb` (기본값 8 MB)까지 지원됩니다.
- 시끄러운 봇을 피하기 위해 기본적으로 멘션 게이팅된 길드 답장.
- 메시지가 다른 메시지를 참조할 때 답장 컨텍스트가 주입됩니다 (인용된 콘텐츠 + id).
- 네이티브 답장 스레딩은 **기본적으로 꺼져 있습니다**. `channels.discord.replyToMode` 및 답장 태그로 활성화하세요.

## 재시도 정책

아웃바운드 Discord API 호출은 사용 가능한 경우 Discord `retry_after`를 사용하여 속도 제한 (429)에서 재시도하며, 지수 백오프와 지터를 사용합니다. `channels.discord.retry`를 통해 구성하세요. [재시도 정책](/ko-KR/concepts/retry)을 참조하세요.

## 설정

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "abc.123",
      groupPolicy: "allowlist",
      guilds: {
        "*": {
          channels: {
            general: { allow: true },
          },
        },
      },
      mediaMaxMb: 8,
      actions: {
        reactions: true,
        stickers: true,
        emojiUploads: true,
        stickerUploads: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        channels: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off",
      dm: {
        enabled: true,
        policy: "pairing", // pairing | allowlist | open | disabled
        allowFrom: ["123456789012345678", "steipete"],
        groupEnabled: false,
        groupChannels: ["openclaw-dm"],
      },
      guilds: {
        "*": { requireMention: true },
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          reactionNotifications: "own",
          users: ["987654321098765432", "steipete"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["search", "docs"],
              systemPrompt: "Keep answers short.",
            },
          },
        },
      },
    },
  },
}
```

확인 반응은 `messages.ackReaction` +
`messages.ackReactionScope`를 통해 전역적으로 제어됩니다. `messages.removeAckAfterReply`를 사용하여
봇이 답장한 후 확인 반응을 지우세요.

- `dm.enabled`: 모든 DM을 무시하려면 `false`로 설정 (기본값 `true`).
- `dm.policy`: DM 접근 제어 (`pairing` 권장). `"open"`은 `dm.allowFrom=["*"]`가 필요합니다.
- `dm.allowFrom`: DM 허용목록 (사용자 id 또는 이름). `dm.policy="allowlist"`에서 사용되며 `dm.policy="open"` 검증용으로 사용됩니다. 마법사는 사용자 이름을 허용하고 봇이 멤버를 검색할 수 있을 때 id로 확인합니다.
- `dm.groupEnabled`: 그룹 DM 활성화 (기본값 `false`).
- `dm.groupChannels`: 그룹 DM 채널 id 또는 슬러그에 대한 선택적 허용목록.
- `groupPolicy`: 길드 채널 처리 제어 (`open|disabled|allowlist`). `allowlist`는 채널 허용목록이 필요합니다.
- `guilds`: 길드 id (선호) 또는 슬러그로 키가 지정된 길드별 규칙.
- `guilds."*"`: 명시적 항목이 없을 때 적용되는 기본 길드별 설정.
- `guilds.<id>.slug`: 표시 이름에 사용되는 선택적 친근한 슬러그.
- `guilds.<id>.users`: 선택적 길드별 사용자 허용목록 (id 또는 이름).
- `guilds.<id>.tools`: 선택적 길드별 도구 정책 재정의 (`allow`/`deny`/`alsoAllow`) 채널 재정의가 누락된 경우 사용됩니다.
- `guilds.<id>.toolsBySender`: 선택적 길드 수준의 발신자별 도구 정책 재정의 (채널 재정의가 누락된 경우 적용됩니다. `"*"` 와일드카드 지원됨).
- `guilds.<id>.channels.<channel>.allow`: `groupPolicy="allowlist"`일 때 채널 허용/거부.
- `guilds.<id>.channels.<channel>.requireMention`: 채널의 멘션 게이팅.
- `guilds.<id>.channels.<channel>.tools`: 선택적 채널별 도구 정책 재정의 (`allow`/`deny`/`alsoAllow`).
- `guilds.<id>.channels.<channel>.toolsBySender`: 선택적 채널 내 발신자별 도구 정책 재정의 (`"*"` 와일드카드 지원됨).
- `guilds.<id>.channels.<channel>.users`: 선택적 채널별 사용자 허용목록.
- `guilds.<id>.channels.<channel>.skills`: 스킬 필터 (생략 = 모든 스킬, 비어 있음 = 없음).
- `guilds.<id>.channels.<channel>.systemPrompt`: 채널에 대한 추가 시스템 프롬프트 (채널 주제와 결합됨).
- `guilds.<id>.channels.<channel>.enabled`: 채널을 비활성화하려면 `false`로 설정.
- `guilds.<id>.channels`: 채널 규칙 (키는 채널 슬러그 또는 id).
- `guilds.<id>.requireMention`: 길드별 멘션 요구사항 (채널별로 재정의 가능).
- `guilds.<id>.reactionNotifications`: 반응 시스템 이벤트 모드 (`off`, `own`, `all`, `allowlist`).
- `textChunkLimit`: 아웃바운드 텍스트 청크 크기 (문자). 기본값: 2000.
- `chunkMode`: `length` (기본값)는 `textChunkLimit`를 초과할 때만 분할합니다. `newline`은 길이 청킹 전에 빈 줄 (단락 경계)에서 분할합니다.
- `maxLinesPerMessage`: 메시지당 소프트 최대 줄 수. 기본값: 17.
- `mediaMaxMb`: 디스크에 저장된 인바운드 미디어를 클램프합니다.
- `historyLimit`: 멘션에 답장할 때 컨텍스트로 포함할 최근 길드 메시지 수 (기본값 20; `messages.groupChat.historyLimit`로 대체; `0`은 비활성화).
- `dmHistoryLimit`: 사용자 턴의 DM 히스토리 제한. 사용자별 재정의: `dms["<user_id>"].historyLimit`.
- `retry`: 아웃바운드 Discord API 호출에 대한 재시도 정책 (시도, minDelayMs, maxDelayMs, 지터).
- `pluralkit`: PluralKit 프록시 메시지를 해결하여 시스템 멤버가 고유한 발신자로 나타나도록 합니다.
- `actions`: 액션별 도구 게이트. 모두 허용하려면 생략 (비활성화하려면 `false`로 설정).
  - `reactions` (반응 + 반응 읽기 포함)
  - `stickers`, `emojiUploads`, `stickerUploads`, `polls`, `permissions`, `messages`, `threads`, `pins`, `search`
  - `memberInfo`, `roleInfo`, `channelInfo`, `voiceStatus`, `events`
  - `channels` (채널 + 카테고리 + 권한 생성/편집/삭제)
  - `roles` (역할 추가/제거, 기본값 `false`)
  - `moderation` (타임아웃/킥/벤, 기본값 `false`)
- `execApprovals`: Discord 전용 exec 승인 DM (버튼 UI). `enabled`, `approvers`, `agentFilter`, `sessionFilter`를 지원합니다.

반응 알림은 `guilds.<id>.reactionNotifications`를 사용합니다:

- `off`: 반응 이벤트 없음.
- `own`: 봇 자체 메시지의 반응 (기본값).
- `all`: 모든 메시지의 모든 반응.
- `allowlist`: 모든 메시지에서 `guilds.<id>.users`의 반응 (빈 목록은 비활성화).

### PluralKit (PK) 지원

PK 조회를 활성화하여 프록시된 메시지가 기본 시스템 + 멤버로 해결되도록 합니다.
활성화되면 OpenClaw은 허용목록에 멤버 ID를 사용하고 발신자를
`Member (PK:System)`로 레이블하여 실수로 Discord 핑을 피합니다.

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 선택사항; 비공개 시스템에 필요
      },
    },
  },
}
```

허용목록 참고 (PK 활성화):

- `dm.allowFrom`, `guilds.<id>.users` 또는 채널별 `users`에서 `pk:<memberId>`를 사용하세요.
- 멤버 표시 이름도 이름/슬러그로 매칭됩니다.
- 조회는 **원본** Discord 메시지 ID (프리 프록시 메시지)를 사용하므로
  PK API는 30분 창 내에서만 해결합니다.
- PK 조회가 실패하면 (예: 토큰 없는 비공개 시스템), 프록시된 메시지는
  봇 메시지로 처리되며 `channels.discord.allowBots=true`가 아니면 삭제됩니다.

### 도구 액션 기본값

| 액션 그룹      | 기본값   | 참고                           |
| -------------- | -------- | ------------------------------ |
| reactions      | 활성화   | 반응 + 반응 목록 + 이모지 목록 |
| stickers       | 활성화   | 스티커 전송                    |
| emojiUploads   | 활성화   | 이모지 업로드                  |
| stickerUploads | 활성화   | 스티커 업로드                  |
| polls          | 활성화   | 폴 생성                        |
| permissions    | 활성화   | 채널 권한 스냅샷               |
| messages       | 활성화   | 읽기/보내기/편집/삭제          |
| threads        | 활성화   | 생성/목록/답장                 |
| pins           | 활성화   | 고정/고정 해제/목록            |
| search         | 활성화   | 메시지 검색 (미리보기 기능)    |
| memberInfo     | 활성화   | 멤버 정보                      |
| roleInfo       | 활성화   | 역할 목록                      |
| channelInfo    | 활성화   | 채널 정보 + 목록               |
| channels       | 활성화   | 채널/카테고리 관리             |
| voiceStatus    | 활성화   | 음성 상태 조회                 |
| events         | 활성화   | 예정된 이벤트 목록/생성        |
| roles          | 비활성화 | 역할 추가/제거                 |
| moderation     | 비활성화 | 타임아웃/킥/벤                 |

- `replyToMode`: `off` (기본값), `first` 또는 `all`. 모델에 답장 태그가 포함된 경우에만 적용됩니다.

## 답장 태그

스레드 답장을 요청하려면 모델이 출력에 하나의 태그를 포함할 수 있습니다:

- `[[reply_to_current]]` — 트리거하는 Discord 메시지에 답장.
- `[[reply_to:<id>]]` — 컨텍스트/히스토리의 특정 메시지 id에 답장.
  현재 메시지 id는 프롬프트에 `[message_id: …]`로 추가됩니다. 히스토리 항목에는 이미 id가 포함되어 있습니다.

동작은 `channels.discord.replyToMode`로 제어됩니다:

- `off`: 태그 무시.
- `first`: 첫 번째 아웃바운드 청크/첨부만 답장.
- `all`: 모든 아웃바운드 청크/첨부가 답장.

허용목록 매칭 참고:

- `allowFrom`/`users`/`groupChannels`는 id, 이름, 태그 또는 `<@id>`와 같은 멘션을 허용합니다.
- `discord:`/`user:` (사용자) 및 `channel:` (그룹 DM)와 같은 접두사가 지원됩니다.
- 모든 발신자/채널을 허용하려면 `*`를 사용하세요.
- `guilds.<id>.channels`가 있는 경우 나열되지 않은 채널은 기본적으로 거부됩니다.
- `guilds.<id>.channels`가 생략되면 허용목록에 있는 길드의 모든 채널이 허용됩니다.
- **채널 없음**을 허용하려면 `channels.discord.groupPolicy: "disabled"`를 설정하세요 (또는 빈 허용목록 유지).
- 구성 마법사는 `Guild/Channel` 이름 (공개 + 비공개)을 허용하고 가능한 경우 ID로 확인합니다.
- 시작 시 OpenClaw은 허용목록의 채널/사용자 이름을 ID로 확인하고 (봇이 멤버를 검색할 수 있을 때)
  매핑을 기록합니다. 확인되지 않은 항목은 입력된 대로 유지됩니다.

네이티브 명령 참고:

- 등록된 명령은 OpenClaw의 채팅 명령을 미러링합니다.
- 네이티브 명령은 DM/길드 메시지와 동일한 허용목록을 존중합니다 (`channels.discord.dm.allowFrom`, `channels.discord.guilds`, 채널별 규칙).
- 슬래시 명령은 허용목록에 없는 사용자에게 Discord UI에서 여전히 표시될 수 있습니다. OpenClaw은 실행 시 허용목록을 적용하고 "not authorized"로 답장합니다.

## 도구 액션

에이전트는 다음과 같은 액션으로 `discord`를 호출할 수 있습니다:

- `react` / `reactions` (반응 추가 또는 목록)
- `sticker`, `poll`, `permissions`
- `readMessages`, `sendMessage`, `editMessage`, `deleteMessage`
- 읽기/검색/고정 도구 페이로드에는 원시 Discord `timestamp` 외에 정규화된 `timestampMs` (UTC 에포크 ms) 및 `timestampUtc`가 포함됩니다.
- `threadCreate`, `threadList`, `threadReply`
- `pinMessage`, `unpinMessage`, `listPins`
- `searchMessages`, `memberInfo`, `roleInfo`, `roleAdd`, `roleRemove`, `emojiList`
- `channelInfo`, `channelList`, `voiceStatus`, `eventList`, `eventCreate`
- `timeout`, `kick`, `ban`

Discord 메시지 id는 주입된 컨텍스트 (`[discord message id: …]` 및 히스토리 줄)에 표시되므로 에이전트가 타겟팅할 수 있습니다.
이모지는 유니코드 (예: `✅`) 또는 `<:party_blob:1234567890>`와 같은 커스텀 이모지 구문일 수 있습니다.

## 안전 및 운영

- 봇 토큰을 비밀번호처럼 취급하세요. 감독되는 호스트에서는 `DISCORD_BOT_TOKEN` 환경 변수를 선호하거나 설정 파일 권한을 잠그세요.
- 봇에 필요한 권한만 부여하세요 (일반적으로 메시지 읽기/보내기).
- 봇이 멈추거나 속도 제한되면 다른 프로세스가 Discord 세션을 소유하지 않는지 확인한 후 게이트웨이를 재시작하세요 (`openclaw gateway --force`).

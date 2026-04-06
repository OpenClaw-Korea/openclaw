---
summary: "imsg (stdio를 통한 JSON-RPC), 설정 및 chat_id 라우팅을 통한 iMessage 지원"
read_when:
  - iMessage 지원 설정 시
  - iMessage 송수신 디버깅 시
title: iMessage
---

# iMessage (imsg)

상태: 외부 CLI 통합. 게이트웨이는 `imsg rpc` (stdio를 통한 JSON-RPC)를 생성합니다.

## 빠른 설정 (초보자용)

1. 이 Mac에서 Messages가 로그인되어 있는지 확인하세요.
2. `imsg`를 설치하세요:
   - `brew install steipete/tap/imsg`
3. `channels.imessage.cliPath` 및 `channels.imessage.dbPath`로 OpenClaw을 구성하세요.
4. 게이트웨이를 시작하고 macOS 프롬프트를 승인하세요 (Automation + Full Disk Access).

최소 설정:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/<you>/Library/Messages/chat.db",
    },
  },
}
```

## 정의

- macOS의 `imsg`에 의해 지원되는 iMessage 채널.
- 결정론적 라우팅: 답장은 항상 iMessage로 돌아갑니다.
- DM은 에이전트의 메인 세션을 공유하고, 그룹은 격리됩니다 (`agent:<agentId>:imessage:group:<chat_id>`).
- `is_group=false`로 다중 참가자 스레드가 도착하는 경우에도 `channels.imessage.groups`를 사용하여 `chat_id`로 격리할 수 있습니다 (아래 "그룹 유사 스레드" 참조).

## 설정 쓰기

기본적으로 iMessage는 `/config set|unset`으로 트리거된 설정 업데이트 쓰기가 허용됩니다 (`commands.config: true` 필요).

비활성화하려면:

```json5
{
  channels: { imessage: { configWrites: false } },
}
```

## 요구사항

- Messages가 로그인된 macOS.
- OpenClaw + `imsg`에 대한 Full Disk Access (Messages DB 접근).
- 전송 시 Automation 권한.
- `channels.imessage.cliPath`는 stdin/stdout을 프록시하는 모든 명령을 가리킬 수 있습니다 (예: 다른 Mac으로 SSH하고 `imsg rpc`를 실행하는 래퍼 스크립트).

## 설정 (빠른 경로)

1. 이 Mac에서 Messages가 로그인되어 있는지 확인하세요.
2. iMessage를 구성하고 게이트웨이를 시작하세요.

### 전용 봇 macOS 사용자 (격리된 ID용)

봇이 **별도의 iMessage ID**에서 전송하도록 하려면 (개인 Messages를 깔끔하게 유지), 전용 Apple ID + 전용 macOS 사용자를 사용하세요.

1. 전용 Apple ID를 생성하세요 (예: `my-cool-bot@icloud.com`).
   - Apple은 인증 / 2FA를 위해 전화번호를 요구할 수 있습니다.
2. macOS 사용자를 생성하고 (예: `openclawhome`) 로그인하세요.
3. 해당 macOS 사용자에서 Messages를 열고 봇 Apple ID로 iMessage에 로그인하세요.
4. Remote Login을 활성화하세요 (System Settings → General → Sharing → Remote Login).
5. `imsg`를 설치하세요:
   - `brew install steipete/tap/imsg`
6. `ssh <bot-macos-user>@localhost true`가 비밀번호 없이 작동하도록 SSH를 설정하세요.
7. `channels.imessage.accounts.bot.cliPath`를 봇 사용자로 `imsg`를 실행하는 SSH 래퍼로 지정하세요.

첫 실행 참고: 송수신에는 *봇 macOS 사용자*에서 GUI 승인 (Automation + Full Disk Access)이 필요할 수 있습니다. `imsg rpc`가 멈추거나 종료되는 것처럼 보이면 해당 사용자에 로그인하고 (Screen Sharing 도움), 일회성 `imsg chats --limit 1` / `imsg send ...`를 실행하고, 프롬프트를 승인한 다음 재시도하세요.

예시 래퍼 (`chmod +x`). `<bot-macos-user>`를 실제 macOS 사용자 이름으로 바꾸세요:

```bash
#!/usr/bin/env bash
set -euo pipefail

# 호스트 키를 수락하려면 먼저 대화형 SSH를 한 번 실행하세요:
#   ssh <bot-macos-user>@localhost true
exec /usr/bin/ssh -o BatchMode=yes -o ConnectTimeout=5 -T <bot-macos-user>@localhost \
  "/usr/local/bin/imsg" "$@"
```

예시 설정:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      accounts: {
        bot: {
          name: "Bot",
          enabled: true,
          cliPath: "/path/to/imsg-bot",
          dbPath: "/Users/<bot-macos-user>/Library/Messages/chat.db",
        },
      },
    },
  },
}
```

단일 계정 설정의 경우 `accounts` 맵 대신 플랫 옵션 (`channels.imessage.cliPath`, `channels.imessage.dbPath`)을 사용하세요.

### 원격/SSH 변형 (선택사항)

다른 Mac에서 iMessage를 원하는 경우 `channels.imessage.cliPath`를 SSH를 통해 원격 macOS 호스트에서 `imsg`를 실행하는 래퍼로 설정하세요. OpenClaw은 stdio만 필요합니다.

예시 래퍼:

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

**원격 첨부 파일:** `cliPath`가 SSH를 통해 원격 호스트를 가리킬 때 Messages 데이터베이스의 첨부 파일 경로는 원격 머신의 파일을 참조합니다. OpenClaw은 `channels.imessage.remoteHost`를 설정하여 SCP를 통해 자동으로 가져올 수 있습니다:

```json5
{
  channels: {
    imessage: {
      cliPath: "~/imsg-ssh", // 원격 Mac으로의 SSH 래퍼
      remoteHost: "user@gateway-host", // SCP 파일 전송용
      includeAttachments: true,
    },
  },
}
```

`remoteHost`가 설정되지 않은 경우 OpenClaw은 래퍼 스크립트의 SSH 명령을 파싱하여 자동 감지를 시도합니다. 안정성을 위해 명시적 구성이 권장됩니다.

#### Tailscale을 통한 원격 Mac (예시)

게이트웨이가 Linux 호스트/VM에서 실행되지만 iMessage가 Mac에서 실행되어야 하는 경우 Tailscale이 가장 간단한 브리지입니다: 게이트웨이는 tailnet을 통해 Mac과 통신하고, SSH를 통해 `imsg`를 실행하고, 첨부 파일을 SCP로 다시 가져옵니다.

아키텍처:

```
┌──────────────────────────────┐          SSH (imsg rpc)          ┌──────────────────────────┐
│ Gateway host (Linux/VM)      │──────────────────────────────────▶│ Mac with Messages + imsg │
│ - openclaw gateway           │          SCP (attachments)        │ - Messages signed in     │
│ - channels.imessage.cliPath  │◀──────────────────────────────────│ - Remote Login enabled   │
└──────────────────────────────┘                                   └──────────────────────────┘
              ▲
              │ Tailscale tailnet (hostname or 100.x.y.z)
              ▼
        user@gateway-host
```

구체적인 설정 예시 (Tailscale 호스트명):

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

예시 래퍼 (`~/.openclaw/scripts/imsg-ssh`):

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

참고:

- Mac이 Messages에 로그인되어 있고 Remote Login이 활성화되어 있는지 확인하세요.
- `ssh bot@mac-mini.tailnet-1234.ts.net`이 프롬프트 없이 작동하도록 SSH 키를 사용하세요.
- `remoteHost`는 SCP가 첨부 파일을 가져올 수 있도록 SSH 대상과 일치해야 합니다.

다중 계정 지원: `channels.imessage.accounts`를 계정별 설정 및 선택사항 `name`과 함께 사용하세요. 공유 패턴은 [`gateway/configuration`](/ko-KR/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts)을 참조하세요. `~/.openclaw/openclaw.json`을 커밋하지 마세요 (종종 토큰 포함).

## 접근 제어 (DM + 그룹)

DM:

- 기본값: `channels.imessage.dmPolicy = "pairing"`.
- 알 수 없는 발신자는 페어링 코드를 받으며, 승인될 때까지 메시지는 무시됩니다 (코드는 1시간 후 만료).
- 승인 방법:
  - `openclaw pairing list imessage`
  - `openclaw pairing approve imessage <CODE>`
- 페어링은 iMessage DM의 기본 토큰 교환입니다. 세부 정보: [페어링](/ko-KR/start/pairing)

그룹:

- `channels.imessage.groupPolicy = open | allowlist | disabled`.
- `channels.imessage.groupAllowFrom`은 `allowlist`가 설정된 경우 그룹에서 트리거할 수 있는 사람을 제어합니다.
- 멘션 게이팅은 `agents.list[].groupChat.mentionPatterns` (또는 `messages.groupChat.mentionPatterns`)를 사용합니다. iMessage에는 네이티브 멘션 메타데이터가 없기 때문입니다.
- 멀티 에이전트 재정의: `agents.list[].groupChat.mentionPatterns`에 에이전트별 패턴을 설정하세요.

## 작동 방식 (동작)

- `imsg`는 메시지 이벤트를 스트리밍하고, 게이트웨이는 이를 공유 채널 봉투로 정규화합니다.
- 답장은 항상 같은 채팅 id 또는 핸들로 라우팅됩니다.

## 그룹 유사 스레드 (`is_group=false`)

일부 iMessage 스레드는 여러 참가자가 있을 수 있지만 Messages가 채팅 식별자를 저장하는 방법에 따라 여전히 `is_group=false`로 도착할 수 있습니다.

`channels.imessage.groups` 아래에서 `chat_id`를 명시적으로 구성하는 경우 OpenClaw은 해당 스레드를 다음에 대해 "그룹"으로 취급합니다:

- 세션 격리 (별도의 `agent:<agentId>:imessage:group:<chat_id>` 세션 키)
- 그룹 허용목록 / 멘션 게이팅 동작

예시:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "42": { requireMention: false },
      },
    },
  },
}
```

이는 특정 스레드에 대한 격리된 성격/모델을 원할 때 유용합니다 ([멀티 에이전트 라우팅](/ko-KR/concepts/multi-agent) 참조). 파일 시스템 격리는 [샌드박싱](/ko-KR/gateway/sandboxing)을 참조하세요.

## 미디어 + 제한

- `channels.imessage.includeAttachments`를 통한 선택적 첨부 파일 수집.
- `channels.imessage.mediaMaxMb`를 통한 미디어 한도.

## 제한

- 아웃바운드 텍스트는 `channels.imessage.textChunkLimit`로 청크됩니다 (기본값 4000).
- 선택적 줄바꿈 청킹: `channels.imessage.chunkMode="newline"`을 설정하여 길이 청킹 전에 빈 줄 (단락 경계)에서 분할합니다.
- 미디어 업로드는 `channels.imessage.mediaMaxMb`로 제한됩니다 (기본값 16).

## 주소 지정 / 전달 대상

안정적인 라우팅을 위해 `chat_id`를 선호하세요:

- `chat_id:123` (선호)
- `chat_guid:...`
- `chat_identifier:...`
- 직접 핸들: `imessage:+1555` / `sms:+1555` / `user@example.com`

채팅 목록:

```
imsg chats --limit 20
```

## 설정 참조 (iMessage)

전체 설정: [설정](/ko-KR/gateway/configuration)

프로바이더 옵션:

- `channels.imessage.enabled`: 채널 시작 활성화/비활성화.
- `channels.imessage.cliPath`: `imsg` 경로.
- `channels.imessage.dbPath`: Messages DB 경로.
- `channels.imessage.remoteHost`: `cliPath`가 원격 Mac을 가리킬 때 SCP 첨부 파일 전송을 위한 SSH 호스트 (예: `user@gateway-host`). 설정되지 않은 경우 SSH 래퍼에서 자동 감지됨.
- `channels.imessage.service`: `imessage | sms | auto`.
- `channels.imessage.region`: SMS 지역.
- `channels.imessage.dmPolicy`: `pairing | allowlist | open | disabled` (기본값: pairing).
- `channels.imessage.allowFrom`: DM 허용목록 (핸들, 이메일, E.164 번호 또는 `chat_id:*`). `open`은 `"*"`가 필요합니다. iMessage에는 사용자 이름이 없습니다. 핸들 또는 채팅 대상을 사용하세요.
- `channels.imessage.groupPolicy`: `open | allowlist | disabled` (기본값: allowlist).
- `channels.imessage.groupAllowFrom`: 그룹 발신자 허용목록.
- `channels.imessage.historyLimit` / `channels.imessage.accounts.*.historyLimit`: 컨텍스트로 포함할 최대 그룹 메시지 (0은 비활성화).
- `channels.imessage.dmHistoryLimit`: 사용자 턴의 DM 히스토리 제한. 사용자별 재정의: `channels.imessage.dms["<handle>"].historyLimit`.
- `channels.imessage.groups`: 그룹별 기본값 + 허용목록 (전역 기본값은 `"*"` 사용).
- `channels.imessage.includeAttachments`: 첨부 파일을 컨텍스트에 수집.
- `channels.imessage.mediaMaxMb`: 인바운드/아웃바운드 미디어 한도 (MB).
- `channels.imessage.textChunkLimit`: 아웃바운드 청크 크기 (문자).
- `channels.imessage.chunkMode`: `length` (기본값) 또는 `newline`로 길이 청킹 전에 빈 줄 (단락 경계)에서 분할.

관련 전역 옵션:

- `agents.list[].groupChat.mentionPatterns` (또는 `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

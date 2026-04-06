---
summary: "여러 표면(WhatsApp/Telegram/Discord/Slack/Signal/iMessage/Microsoft Teams)에서의 그룹 채팅 동작"
read_when:
  - 그룹 채팅 동작 또는 멘션 게이팅 변경 시
title: "그룹"
---

# 그룹

OpenClaw는 WhatsApp, Telegram, Discord, Slack, Signal, iMessage, Microsoft Teams를 포함한 여러 표면에서 그룹 채팅을 일관되게 처리합니다.

## 초보자 소개 (2분)

OpenClaw는 자신의 메시징 계정에서 "살아갑니다". 별도의 WhatsApp 봇 사용자가 없습니다.
**당신**이 그룹에 있으면 OpenClaw는 해당 그룹을 보고 응답할 수 있습니다.

기본 동작:

- 그룹은 제한됩니다(`groupPolicy: "allowlist"`).
- 답장에는 멘션이 필요합니다(명시적으로 멘션 게이팅을 비활성화하지 않는 한).

번역: 허용 목록에 있는 발신자는 멘션하여 OpenClaw를 트리거할 수 있습니다.

> 요약
>
> - **DM 액세스**는 `*.allowFrom`으로 제어됩니다.
> - **그룹 액세스**는 `*.groupPolicy` + 허용 목록(`*.groups`, `*.groupAllowFrom`)으로 제어됩니다.
> - **답장 트리거**는 멘션 게이팅(`requireMention`, `/activation`)으로 제어됩니다.

빠른 흐름(그룹 메시지에 무슨 일이 일어나는가):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

![그룹 메시지 흐름](/images/groups-flow.svg)

원하는 것...
| 목표 | 설정할 사항 |
|------|-------------|
| 모든 그룹 허용하지만 @멘션에만 응답 | `groups: { "*": { requireMention: true } }` |
| 모든 그룹 응답 비활성화 | `groupPolicy: "disabled"` |
| 특정 그룹만 | `groups: { "<group-id>": { ... } }` (`"*"` 키 없음) |
| 그룹에서 나만 트리거 가능 | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## 세션 키

- 그룹 세션은 `agent:<agentId>:<channel>:group:<id>` 세션 키를 사용합니다(룸/채널은 `agent:<agentId>:<channel>:channel:<id>` 사용).
- Telegram 포럼 토픽은 그룹 ID에 `:topic:<threadId>`를 추가하여 각 토픽이 자체 세션을 갖도록 합니다.
- 다이렉트 채팅은 메인 세션을 사용합니다(또는 설정된 경우 발신자별).
- 하트비트는 그룹 세션에서 건너뜁니다.

## 패턴: 개인 DM + 공개 그룹 (단일 에이전트)

예 — "개인" 트래픽이 **DM**이고 "공개" 트래픽이 **그룹**인 경우 잘 작동합니다.

이유: 단일 에이전트 모드에서 DM은 일반적으로 **메인** 세션 키(`agent:main:main`)에 도달하는 반면, 그룹은 항상 **비메인** 세션 키(`agent:main:<channel>:group:<id>`)를 사용합니다. `mode: "non-main"`으로 샌드박싱을 활성화하면 해당 그룹 세션은 Docker에서 실행되고 메인 DM 세션은 호스트에 유지됩니다.

이렇게 하면 하나의 에이전트 "브레인"(공유 워크스페이스 + 메모리)을 갖지만 두 가지 실행 자세를 갖습니다:

- **DM**: 전체 도구(호스트)
- **그룹**: 샌드박스 + 제한된 도구(Docker)

> 진정으로 별도의 워크스페이스/페르소나가 필요한 경우("개인"과 "공개"가 절대 혼합되어서는 안 됨), 두 번째 에이전트 + 바인딩을 사용하세요. [다중 에이전트 라우팅](/concepts/multi-agent)을 참조하세요.

예시(호스트의 DM, 샌드박스 그룹 + 메시징 전용 도구):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // 그룹/채널은 비메인 -> 샌드박스
        scope: "session", // 가장 강력한 격리(그룹/채널당 하나의 컨테이너)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // allow가 비어 있지 않으면 다른 모든 것이 차단됩니다(deny가 여전히 우선).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

"호스트 액세스 없음" 대신 "그룹이 폴더 X만 볼 수 있음"을 원하십니까? `workspaceAccess: "none"`을 유지하고 허용 목록 경로만 샌드박스에 마운트하세요:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "~/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

관련:

- 설정 키 및 기본값: [게이트웨이 설정](/gateway/configuration#agentsdefaultssandbox)
- 도구가 차단된 이유 디버깅: [샌드박스 vs 도구 정책 vs 상승](/gateway/sandbox-vs-tool-policy-vs-elevated)
- 바인드 마운트 세부 정보: [샌드박싱](/gateway/sandboxing#custom-bind-mounts)

## 표시 레이블

- UI 레이블은 가능한 경우 `displayName`을 사용하며, `<channel>:<token>`으로 형식화됩니다.
- `#room`은 룸/채널용으로 예약되어 있습니다; 그룹 채팅은 `g-<slug>`를 사용합니다(소문자, 공백 -> `-`, `#@+._-` 유지).

## 그룹 정책

채널별로 그룹/룸 메시지 처리 방법을 제어합니다:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789", "@username"],
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| 정책          | 동작                                                            |
| ------------- | --------------------------------------------------------------- |
| `"open"`      | 그룹은 허용 목록을 우회합니다; 멘션 게이팅은 여전히 적용됩니다. |
| `"disabled"`  | 모든 그룹 메시지를 완전히 차단합니다.                           |
| `"allowlist"` | 설정된 허용 목록과 일치하는 그룹/룸만 허용합니다.               |

참고:

- `groupPolicy`는 멘션 게이팅과 별개입니다(@멘션 필요).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams: `groupAllowFrom` 사용(폴백: 명시적 `allowFrom`).
- Discord: 허용 목록은 `channels.discord.guilds.<id>.channels`를 사용합니다.
- Slack: 허용 목록은 `channels.slack.channels`를 사용합니다.
- Matrix: 허용 목록은 `channels.matrix.groups`를 사용합니다(룸 ID, 별칭 또는 이름). `channels.matrix.groupAllowFrom`을 사용하여 발신자를 제한하세요; 룸별 `users` 허용 목록도 지원됩니다.
- 그룹 DM은 별도로 제어됩니다(`channels.discord.dm.*`, `channels.slack.dm.*`).
- Telegram 허용 목록은 사용자 ID(`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) 또는 사용자 이름(`"@alice"` 또는 `"alice"`)과 일치할 수 있습니다; 접두사는 대소문자를 구분하지 않습니다.
- 기본값은 `groupPolicy: "allowlist"`입니다; 그룹 허용 목록이 비어 있으면 그룹 메시지가 차단됩니다.

그룹 메시지에 대한 빠른 정신 모델(평가 순서):

1. `groupPolicy` (open/disabled/allowlist)
2. 그룹 허용 목록(`*.groups`, `*.groupAllowFrom`, 채널별 허용 목록)
3. 멘션 게이팅(`requireMention`, `/activation`)

## 멘션 게이팅 (기본값)

그룹 메시지는 그룹별로 재정의되지 않는 한 멘션이 필요합니다. 기본값은 `*.groups."*"` 아래의 하위 시스템별로 있습니다.

봇 메시지에 대한 답장은 암시적 멘션으로 간주됩니다(채널이 답장 메타데이터를 지원하는 경우). 이는 Telegram, WhatsApp, Slack, Discord 및 Microsoft Teams에 적용됩니다.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

참고:

- `mentionPatterns`는 대소문자를 구분하지 않는 정규식입니다.
- 명시적 멘션을 제공하는 표면은 여전히 통과합니다; 패턴은 폴백입니다.
- 에이전트별 재정의: `agents.list[].groupChat.mentionPatterns` (여러 에이전트가 그룹을 공유할 때 유용).
- 멘션 게이팅은 멘션 감지가 가능한 경우에만 적용됩니다(네이티브 멘션 또는 `mentionPatterns` 설정됨).
- Discord 기본값은 `channels.discord.guilds."*"`에 있습니다(길드/채널별로 재정의 가능).
- 그룹 히스토리 컨텍스트는 채널 전체에서 균일하게 래핑되며 **보류 중인** 것만 포함됩니다(멘션 게이팅으로 인해 건너뛴 메시지); 전역 기본값으로 `messages.groupChat.historyLimit`를 사용하고 재정의로 `channels.<channel>.historyLimit`(또는 `channels.<channel>.accounts.*.historyLimit`)를 사용하세요. 비활성화하려면 `0`으로 설정하세요.

## 그룹/채널 도구 제한 (선택 사항)

일부 채널 설정은 **특정 그룹/룸/채널 내에서** 사용 가능한 도구를 제한하는 것을 지원합니다.

- `tools`: 전체 그룹에 대한 도구 허용/거부.
- `toolsBySender`: 그룹 내 발신자별 재정의(키는 채널에 따라 발신자 ID/사용자 이름/이메일/전화번호). 와일드카드로 `"*"` 사용.

해결 순서(가장 구체적인 것이 우선):

1. 그룹/채널 `toolsBySender` 매치
2. 그룹/채널 `tools`
3. 기본값(`"*"`) `toolsBySender` 매치
4. 기본값(`"*"`) `tools`

예시(Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

참고:

- 그룹/채널 도구 제한은 전역/에이전트 도구 정책에 추가로 적용됩니다(거부가 여전히 우선).
- 일부 채널은 룸/채널에 대해 다른 중첩을 사용합니다(예: Discord `guilds.*.channels.*`, Slack `channels.*`, MS Teams `teams.*.channels.*`).

## 그룹 허용 목록

`channels.whatsapp.groups`, `channels.telegram.groups` 또는 `channels.imessage.groups`가 설정되면 키가 그룹 허용 목록으로 작동합니다. 모든 그룹을 허용하면서 기본 멘션 동작을 설정하려면 `"*"`를 사용하세요.

일반적인 의도(복사/붙여넣기):

1. 모든 그룹 응답 비활성화

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. 특정 그룹만 허용(WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. 모든 그룹 허용하지만 멘션 필요(명시적)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. 그룹에서 소유자만 트리거 가능(WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## 활성화 (소유자 전용)

그룹 소유자는 그룹별 활성화를 전환할 수 있습니다:

- `/activation mention`
- `/activation always`

소유자는 `channels.whatsapp.allowFrom`으로 결정됩니다(또는 설정되지 않은 경우 봇의 자체 E.164). 독립 실행형 메시지로 명령을 보내세요. 다른 표면은 현재 `/activation`을 무시합니다.

## 컨텍스트 필드

그룹 인바운드 페이로드는 다음을 설정합니다:

- `ChatType=group`
- `GroupSubject` (알려진 경우)
- `GroupMembers` (알려진 경우)
- `WasMentioned` (멘션 게이팅 결과)
- Telegram 포럼 토픽에는 `MessageThreadId` 및 `IsForum`도 포함됩니다.

에이전트 시스템 프롬프트는 새 그룹 세션의 첫 번째 턴에 그룹 소개를 포함합니다. 모델에게 사람처럼 응답하고 Markdown 테이블을 피하고 리터럴 `\n` 시퀀스를 입력하지 말라고 상기시킵니다.

## iMessage 세부 사항

- 라우팅 또는 허용 목록 작성 시 `chat_id:<id>`를 선호하세요.
- 채팅 목록: `imsg chats --limit 20`.
- 그룹 답장은 항상 동일한 `chat_id`로 돌아갑니다.

## WhatsApp 세부 사항

WhatsApp 전용 동작(히스토리 주입, 멘션 처리 세부 정보)은 [그룹 메시지](/concepts/group-messages)를 참조하세요.

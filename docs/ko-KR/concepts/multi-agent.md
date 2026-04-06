---
summary: "멀티 에이전트 라우팅: 격리된 에이전트, 채널 계정 및 바인딩"
title: 멀티 에이전트 라우팅
read_when: "하나의 게이트웨이 프로세스에서 여러 격리된 에이전트 (워크스페이스 + 인증)를 원하는 경우"
status: active
---

# 멀티 에이전트 라우팅

목표: 하나의 실행 중인 게이트웨이에서 여러 _격리된_ 에이전트 (별도 워크스페이스 + `agentDir` + 세션) 및 여러 채널 계정 (예: 두 개의 WhatsApp)을 운영합니다. 인바운드는 바인딩을 통해 에이전트로 라우팅됩니다.

## "하나의 에이전트"란 무엇인가요?

**에이전트**는 자체적으로 완전히 범위가 지정된 브레인입니다:

- **워크스페이스** (파일, AGENTS.md/SOUL.md/USER.md, 로컬 노트, 페르소나 규칙)
- **상태 디렉토리** (`agentDir`): 인증 프로필, 모델 레지스트리 및 에이전트별 설정
- **세션 저장소** (채팅 히스토리 + 라우팅 상태): `~/.openclaw/agents/<agentId>/sessions` 아래

인증 프로필은 **에이전트별**입니다. 각 에이전트는 자체에서 읽습니다:

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

메인 에이전트 자격 증명은 **자동으로 공유되지 않습니다**. 에이전트 간에 `agentDir`을 재사용하지 마세요 (인증/세션 충돌이 발생합니다). 자격 증명을 공유하려면 `auth-profiles.json`을 다른 에이전트의 `agentDir`에 복사합니다.

스킬은 각 워크스페이스의 `skills/` 폴더를 통해 에이전트별로 제공되며, 공유 스킬은 `~/.openclaw/skills`에서 사용할 수 있습니다. [스킬: 에이전트별 vs 공유 스킬](/tools/skills#per-agent-vs-shared-skills)을 참조하세요.

게이트웨이는 **하나의 에이전트** (기본값) 또는 **여러 에이전트**를 나란히 호스팅할 수 있습니다.

**워크스페이스 참고사항:** 각 에이전트의 워크스페이스는 **기본 cwd**이며 하드 샌드박스가 아닙니다. 상대 경로는 워크스페이스 내에서 해결되지만, 샌드박싱이 활성화되지 않은 한 절대 경로는 다른 호스트 위치에 도달할 수 있습니다. [샌드박싱](/gateway/sandboxing)을 참조하세요.

## 경로 (빠른 맵)

- 설정: `~/.openclaw/openclaw.json` (또는 `OPENCLAW_CONFIG_PATH`)
- 상태 디렉토리: `~/.openclaw` (또는 `OPENCLAW_STATE_DIR`)
- 워크스페이스: `~/.openclaw/workspace` (또는 `~/.openclaw/workspace-<agentId>`)
- 에이전트 디렉토리: `~/.openclaw/agents/<agentId>/agent` (또는 `agents.list[].agentDir`)
- 세션: `~/.openclaw/agents/<agentId>/sessions`

### 단일 에이전트 모드 (기본값)

아무것도 하지 않으면 OpenClaw는 단일 에이전트를 실행합니다:

- `agentId`는 기본적으로 **`main`**입니다.
- 세션은 `agent:main:<mainKey>`로 키가 지정됩니다.
- 워크스페이스는 기본적으로 `~/.openclaw/workspace`입니다 (`OPENCLAW_PROFILE`이 설정된 경우 `~/.openclaw/workspace-<profile>`).
- 상태는 기본적으로 `~/.openclaw/agents/main/agent`입니다.

## 에이전트 도우미

에이전트 마법사를 사용하여 새로운 격리된 에이전트를 추가합니다:

```bash
openclaw agents add work
```

그런 다음 `bindings`를 추가하거나 (마법사가 수행하도록 함) 인바운드 메시지를 라우팅합니다.

다음으로 확인합니다:

```bash
openclaw agents list --bindings
```

## 여러 에이전트 = 여러 사람, 여러 개성

**여러 에이전트**를 사용하면 각 `agentId`가 **완전히 격리된 페르소나**가 됩니다:

- **다른 전화번호/계정** (채널 `accountId`당)
- **다른 개성** (에이전트별 워크스페이스 파일: `AGENTS.md` 및 `SOUL.md`)
- **별도 인증 + 세션** (명시적으로 활성화하지 않는 한 교차 대화 없음)

이를 통해 **여러 사람**이 하나의 게이트웨이 서버를 공유하면서 AI "브레인"과 데이터를 격리할 수 있습니다.

## 하나의 WhatsApp 번호, 여러 사람 (DM 분할)

**하나의 WhatsApp 계정**에 머무르면서 **다른 WhatsApp DM**을 다른 에이전트로 라우팅할 수 있습니다. `peer.kind: "dm"`으로 발신자 E.164 (예: `+15551234567`)와 일치시킵니다. 응답은 여전히 동일한 WhatsApp 번호에서 나옵니다 (에이전트별 발신자 ID 없음).

중요한 세부 사항: 다이렉트 채팅은 에이전트의 **메인 세션 키**로 축소되므로 진정한 격리를 위해서는 **사람당 하나의 에이전트**가 필요합니다.

예제:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    { agentId: "alex", match: { channel: "whatsapp", peer: { kind: "dm", id: "+15551230001" } } },
    { agentId: "mia", match: { channel: "whatsapp", peer: { kind: "dm", id: "+15551230002" } } },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

참고사항:

- DM 액세스 제어는 **WhatsApp 계정당 전역**입니다 (페어링/허용 목록), 에이전트당이 아닙니다.
- 공유 그룹의 경우, 그룹을 하나의 에이전트에 바인딩하거나 [브로드캐스트 그룹](/broadcast-groups)을 사용합니다.

## 라우팅 규칙 (메시지가 에이전트를 선택하는 방법)

바인딩은 **결정론적**이며 **가장 구체적인 것이 우선**입니다:

1. `peer` 일치 (정확한 DM/그룹/채널 ID)
2. `guildId` (Discord)
3. `teamId` (Slack)
4. 채널에 대한 `accountId` 일치
5. 채널 수준 일치 (`accountId: "*"`)
6. 기본 에이전트로 폴백 (`agents.list[].default`, 그렇지 않으면 첫 번째 목록 항목, 기본값: `main`)

## 여러 계정 / 전화번호

**여러 계정**을 지원하는 채널 (예: WhatsApp)은 `accountId`를 사용하여 각 로그인을 식별합니다. 각 `accountId`를 다른 에이전트로 라우팅할 수 있으므로 하나의 서버가 세션을 혼합하지 않고 여러 전화번호를 호스팅할 수 있습니다.

## 개념

- `agentId`: 하나의 "브레인" (워크스페이스, 에이전트별 인증, 에이전트별 세션 저장소)
- `accountId`: 하나의 채널 계정 인스턴스 (예: WhatsApp 계정 `"personal"` vs `"biz"`)
- `binding`: `(channel, accountId, peer)` 및 선택적으로 길드/팀 ID로 인바운드 메시지를 `agentId`로 라우팅합니다.
- 다이렉트 채팅은 `agent:<agentId>:<mainKey>`로 축소됩니다 (에이전트별 "메인"; `session.mainKey`)

## 예제: 두 개의 WhatsApp → 두 개의 에이전트

`~/.openclaw/openclaw.json` (JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // 결정론적 라우팅: 첫 번째 일치가 우선 (가장 구체적인 것이 먼저)
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // 선택적 피어별 오버라이드 (예: 특정 그룹을 work 에이전트로 전송)
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // 기본적으로 꺼짐: 에이전트 간 메시징은 명시적으로 활성화 + 허용 목록에 추가되어야 합니다.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // 선택적 오버라이드. 기본값: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // 선택적 오버라이드. 기본값: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## 예제: WhatsApp 일상 채팅 + Telegram 심화 작업

채널별로 분할: WhatsApp을 빠른 일상 에이전트로, Telegram을 Opus 에이전트로 라우팅합니다.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-5",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-5",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

참고사항:

- 채널에 여러 계정이 있는 경우, 바인딩에 `accountId`를 추가합니다 (예: `{ channel: "whatsapp", accountId: "personal" }`).
- 나머지를 chat에 유지하면서 단일 DM/그룹을 Opus로 라우팅하려면 해당 피어에 대한 `match.peer` 바인딩을 추가합니다. 피어 일치는 항상 채널 전체 규칙보다 우선합니다.

## 예제: 동일한 채널, 하나의 피어를 Opus로

WhatsApp을 빠른 에이전트에 유지하되, 하나의 DM을 Opus로 라우팅합니다:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-5",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-5",
      },
    ],
  },
  bindings: [
    { agentId: "opus", match: { channel: "whatsapp", peer: { kind: "dm", id: "+15551234567" } } },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

피어 바인딩은 항상 우선하므로 채널 전체 규칙 위에 유지합니다.

## WhatsApp 그룹에 바인딩된 가족 에이전트

멘션 게이팅 및 더 엄격한 도구 정책이 있는 단일 WhatsApp 그룹에 전용 가족 에이전트를 바인딩합니다:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

참고사항:

- 도구 허용/거부 목록은 **도구**이며 스킬이 아닙니다. 스킬이 바이너리를 실행해야 하는 경우, `exec`가 허용되고 바이너리가 샌드박스에 있는지 확인합니다.
- 더 엄격한 게이팅을 위해 `agents.list[].groupChat.mentionPatterns`를 설정하고 채널에 대한 그룹 허용 목록을 활성화된 상태로 유지합니다.

## 에이전트별 샌드박스 및 도구 설정

v2026.1.6부터 각 에이전트는 자체 샌드박스 및 도구 제한을 가질 수 있습니다:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // 개인 에이전트에 대한 샌드박스 없음
        },
        // 도구 제한 없음 - 모든 도구 사용 가능
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 항상 샌드박스 격리
          scope: "agent",  // 에이전트당 하나의 컨테이너
          docker: {
            // 컨테이너 생성 후 선택적 일회성 설정
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // read 도구만
          deny: ["exec", "write", "edit", "apply_patch"],    // 기타 거부
        },
      },
    ],
  },
}
```

참고: `setupCommand`는 `sandbox.docker` 아래에 있으며 컨테이너 생성 시 한 번 실행됩니다. 해결된 범위가 `"shared"`인 경우 에이전트별 `sandbox.docker.*` 오버라이드는 무시됩니다.

**이점:**

- **보안 격리**: 신뢰할 수 없는 에이전트에 대한 도구 제한
- **리소스 제어**: 다른 에이전트는 호스트에 유지하면서 특정 에이전트 샌드박스 격리
- **유연한 정책**: 에이전트별 다른 권한

참고: `tools.elevated`는 **전역**이며 발신자 기반입니다. 에이전트별로 설정할 수 없습니다. 에이전트별 경계가 필요한 경우, `agents.list[].tools`를 사용하여 `exec`를 거부합니다. 그룹 타겟팅의 경우, `agents.list[].groupChat.mentionPatterns`를 사용하여 @멘션이 의도한 에이전트에 명확하게 매핑되도록 합니다.

자세한 예제는 [멀티 에이전트 샌드박스 및 도구](/multi-agent-sandbox-tools)를 참조하세요.

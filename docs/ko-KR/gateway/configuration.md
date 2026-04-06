---
summary: "~/.openclaw/openclaw.json의 모든 설정 옵션과 예제"
read_when:
  - 설정 필드를 추가하거나 수정할 때
title: "설정"
---

# 설정

OpenClaw는 `~/.openclaw/openclaw.json`에서 선택적 **JSON5** 설정을 읽습니다 (주석 + 후행 쉼표 허용).

파일이 없으면 OpenClaw는 안전한 기본값을 사용합니다 (내장 Pi 에이전트 + 발신자별 세션 + 워크스페이스 `~/.openclaw/workspace`). 일반적으로 다음의 경우에만 설정이 필요합니다:

- 봇을 트리거할 수 있는 사람 제한 (`channels.whatsapp.allowFrom`, `channels.telegram.allowFrom` 등)
- 그룹 허용 목록 + 멘션 동작 제어 (`channels.whatsapp.groups`, `channels.telegram.groups`, `channels.discord.guilds`, `agents.list[].groupChat`)
- 메시지 접두사 사용자 지정 (`messages`)
- 에이전트의 워크스페이스 설정 (`agents.defaults.workspace` 또는 `agents.list[].workspace`)
- 내장 에이전트 기본값 (`agents.defaults`) 및 세션 동작 (`session`) 조정
- 에이전트별 정체성 설정 (`agents.list[].identity`)

> **설정이 처음이신가요?** 자세한 설명과 함께 완전한 예제를 보려면 [설정 예제](/gateway/configuration-examples) 가이드를 확인하세요!

## 엄격한 설정 검증

OpenClaw는 스키마와 완전히 일치하는 설정만 허용합니다.
알 수 없는 키, 잘못된 형식의 타입 또는 유효하지 않은 값이 있으면 게이트웨이가 안전을 위해 **시작을 거부**합니다.

검증 실패 시:

- 게이트웨이가 부팅되지 않습니다.
- 진단 명령만 허용됩니다 (예: `openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`, `openclaw service`, `openclaw help`).
- `openclaw doctor`를 실행하여 정확한 문제를 확인하세요.
- `openclaw doctor --fix` (또는 `--yes`)를 실행하여 마이그레이션/복구를 적용하세요.

Doctor는 `--fix`/`--yes`를 명시적으로 선택하지 않는 한 변경 사항을 작성하지 않습니다.

## 스키마 + UI 힌트

게이트웨이는 UI 편집기를 위해 `config.schema`를 통해 설정의 JSON 스키마 표현을 노출합니다.
컨트롤 UI는 이 스키마에서 폼을 렌더링하며, **Raw JSON** 편집기를 탈출구로 제공합니다.

채널 플러그인과 확장은 자체 설정에 대한 스키마 + UI 힌트를 등록할 수 있으므로
채널 설정이 하드코딩된 폼 없이 앱 전체에서 스키마 기반으로 유지됩니다.

힌트 (레이블, 그룹화, 민감한 필드)는 스키마와 함께 제공되므로 클라이언트가
설정 지식을 하드코딩하지 않고도 더 나은 폼을 렌더링할 수 있습니다.

## 적용 + 재시작 (RPC)

`config.apply`를 사용하여 전체 설정을 검증 + 작성하고 게이트웨이를 한 번에 재시작합니다.
재시작 센티널을 작성하고 게이트웨이가 돌아온 후 마지막 활성 세션에 ping을 보냅니다.

경고: `config.apply`는 **전체 설정**을 교체합니다. 몇 개의 키만 변경하려면
`config.patch` 또는 `openclaw config set`을 사용하세요. `~/.openclaw/openclaw.json`의 백업을 유지하세요.

매개변수:

- `raw` (string) — 전체 설정을 위한 JSON5 페이로드
- `baseHash` (선택적) — `config.get`의 설정 해시 (설정이 이미 존재하는 경우 필수)
- `sessionKey` (선택적) — wake-up ping을 위한 마지막 활성 세션 키
- `note` (선택적) — 재시작 센티널에 포함할 메모
- `restartDelayMs` (선택적) — 재시작 전 지연 (기본값 2000)

예제 (`gateway call`을 통해):

```bash
openclaw gateway call config.get --params '{}' # payload.hash 캡처
openclaw gateway call config.apply --params '{
  "raw": "{\\n  agents: { defaults: { workspace: \\"~/.openclaw/workspace\\" } }\\n}\\n",
  "baseHash": "<hash-from-config.get>",
  "sessionKey": "agent:main:whatsapp:dm:+15555550123",
  "restartDelayMs": 1000
}'
```

## 부분 업데이트 (RPC)

`config.patch`를 사용하여 관련 없는 키를 덮어쓰지 않고 기존 설정에 부분 업데이트를 병합합니다.
JSON 병합 패치 시맨틱을 적용합니다:

- 객체는 재귀적으로 병합
- `null`은 키 삭제
- 배열은 교체
  `config.apply`와 마찬가지로, 검증하고, 설정을 작성하고, 재시작 센티널을 저장하고,
  게이트웨이 재시작을 예약합니다 (`sessionKey`가 제공된 경우 선택적 wake 포함).

매개변수:

- `raw` (string) — 변경할 키만 포함하는 JSON5 페이로드
- `baseHash` (필수) — `config.get`의 설정 해시
- `sessionKey` (선택적) — wake-up ping을 위한 마지막 활성 세션 키
- `note` (선택적) — 재시작 센티널에 포함할 메모
- `restartDelayMs` (선택적) — 재시작 전 지연 (기본값 2000)

예제:

```bash
openclaw gateway call config.get --params '{}' # payload.hash 캡처
openclaw gateway call config.patch --params '{
  "raw": "{\\n  channels: { telegram: { groups: { \\"*\\": { requireMention: false } } } }\\n}\\n",
  "baseHash": "<hash-from-config.get>",
  "sessionKey": "agent:main:whatsapp:dm:+15555550123",
  "restartDelayMs": 1000
}'
```

## 최소 설정 (권장 시작점)

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

기본 이미지를 한 번 빌드:

```bash
scripts/sandbox-setup.sh
```

## 셀프 채팅 모드 (그룹 제어에 권장)

WhatsApp @-멘션에 대한 봇 응답을 방지하려면 (특정 텍스트 트리거에만 응답):

```json5
{
  agents: {
    defaults: { workspace: "~/.openclaw/workspace" },
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["@openclaw", "reisponde"] },
      },
    ],
  },
  channels: {
    whatsapp: {
      // 허용 목록은 DM만; 자신의 번호를 포함하면 셀프 채팅 모드가 활성화됩니다.
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## 설정 포함 (`$include`)

`$include` 지시문을 사용하여 설정을 여러 파일로 분할합니다. 다음에 유용합니다:

- 대규모 설정 구성 (예: 클라이언트별 에이전트 정의)
- 환경 간 공통 설정 공유
- 민감한 설정을 별도로 유지

### 기본 사용법

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },

  // 단일 파일 포함 (키의 값을 교체)
  agents: { $include: "./agents.json5" },

  // 여러 파일 포함 (순서대로 깊게 병합)
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

```json5
// ~/.openclaw/agents.json5
{
  defaults: { sandbox: { mode: "all", scope: "session" } },
  list: [{ id: "main", workspace: "~/.openclaw/workspace" }],
}
```

### 병합 동작

- **단일 파일**: `$include`를 포함하는 객체를 교체
- **파일 배열**: 순서대로 파일을 깊게 병합 (나중 파일이 이전 파일을 재정의)
- **형제 키 포함**: 포함 후 형제 키가 병합됩니다 (포함된 값 재정의)
- **형제 키 + 배열/원시값**: 지원되지 않음 (포함된 콘텐츠는 객체여야 함)

```json5
// 형제 키가 포함된 값을 재정의
{
  $include: "./base.json5", // { a: 1, b: 2 }
  b: 99, // 결과: { a: 1, b: 99 }
}
```

### 중첩 포함

포함된 파일 자체에 `$include` 지시문이 포함될 수 있습니다 (최대 10단계 깊이):

```json5
// clients/mueller.json5
{
  agents: { $include: "./mueller/agents.json5" },
  broadcast: { $include: "./mueller/broadcast.json5" },
}
```

### 경로 해석

- **상대 경로**: 포함하는 파일에 상대적으로 해석
- **절대 경로**: 그대로 사용
- **상위 디렉토리**: `../` 참조가 예상대로 작동

```json5
{ "$include": "./sub/config.json5" }      // 상대
{ "$include": "/etc/openclaw/base.json5" } // 절대
{ "$include": "../shared/common.json5" }   // 상위 디렉토리
```

### 오류 처리

- **누락된 파일**: 해석된 경로와 함께 명확한 오류
- **파싱 오류**: 실패한 포함 파일 표시
- **순환 포함**: 포함 체인과 함께 감지 및 보고

### 예제: 다중 클라이언트 법률 설정

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789, auth: { token: "secret" } },

  // 공통 에이전트 기본값
  agents: {
    defaults: {
      sandbox: { mode: "all", scope: "session" },
    },
    // 모든 클라이언트의 에이전트 목록 병합
    list: { $include: ["./clients/mueller/agents.json5", "./clients/schmidt/agents.json5"] },
  },

  // 브로드캐스트 설정 병합
  broadcast: {
    $include: ["./clients/mueller/broadcast.json5", "./clients/schmidt/broadcast.json5"],
  },

  channels: { whatsapp: { groupPolicy: "allowlist" } },
}
```

```json5
// ~/.openclaw/clients/mueller/agents.json5
[
  { id: "mueller-transcribe", workspace: "~/clients/mueller/transcribe" },
  { id: "mueller-docs", workspace: "~/clients/mueller/docs" },
]
```

```json5
// ~/.openclaw/clients/mueller/broadcast.json5
{
  "120363403215116621@g.us": ["mueller-transcribe", "mueller-docs"],
}
```

## 공통 옵션

### 환경 변수 + `.env`

OpenClaw는 부모 프로세스 (셸, launchd/systemd, CI 등)에서 환경 변수를 읽습니다.

또한 다음을 로드합니다:

- 현재 작업 디렉토리의 `.env` (있는 경우)
- `~/.openclaw/.env` (즉 `$OPENCLAW_STATE_DIR/.env`)의 글로벌 폴백 `.env`

두 `.env` 파일 모두 기존 환경 변수를 재정의하지 않습니다.

설정에서 인라인 환경 변수를 제공할 수도 있습니다. 이들은 프로세스 환경에
키가 없는 경우에만 적용됩니다 (동일한 비재정의 규칙):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

전체 우선순위 및 소스는 [/environment](/environment)를 참조하세요.

### `env.shellEnv` (선택적)

옵트인 편의 기능: 활성화되고 예상 키가 아직 설정되지 않은 경우, OpenClaw는 로그인 셸을 실행하고
누락된 예상 키만 가져옵니다 (재정의하지 않음).
이는 효과적으로 셸 프로필을 소싱합니다.

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

환경 변수 동등물:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

### 설정에서 환경 변수 치환

`${VAR_NAME}` 구문을 사용하여 모든 설정 문자열 값에서 환경 변수를 직접 참조할 수 있습니다.
변수는 검증 전 설정 로드 시 치환됩니다.

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
  gateway: {
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

**규칙:**

- 대문자 환경 변수 이름만 일치: `[A-Z_][A-Z0-9_]*`
- 누락되거나 빈 환경 변수는 설정 로드 시 오류 발생
- `$${VAR}`로 이스케이프하여 리터럴 `${VAR}` 출력
- `$include`와 함께 작동 (포함된 파일도 치환 가능)

**인라인 치환:**

```json5
{
  models: {
    providers: {
      custom: {
        baseUrl: "${CUSTOM_API_BASE}/v1", // → "https://api.example.com/v1"
      },
    },
  },
}
```

### 인증 저장소 (OAuth + API 키)

OpenClaw는 **에이전트별** 인증 프로필 (OAuth + API 키)을 다음에 저장합니다:

- `<agentDir>/auth-profiles.json` (기본값: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`)

참고: [/concepts/oauth](/concepts/oauth)

레거시 OAuth 가져오기:

- `~/.openclaw/credentials/oauth.json` (또는 `$OPENCLAW_STATE_DIR/credentials/oauth.json`)

내장 Pi 에이전트는 다음에서 런타임 캐시를 유지합니다:

- `<agentDir>/auth.json` (자동 관리; 수동으로 편집하지 마세요)

레거시 에이전트 디렉토리 (다중 에이전트 이전):

- `~/.openclaw/agent/*` (`openclaw doctor`에 의해 `~/.openclaw/agents/<defaultAgentId>/agent/*`로 마이그레이션)

재정의:

- OAuth 디렉토리 (레거시 가져오기만): `OPENCLAW_OAUTH_DIR`
- 에이전트 디렉토리 (기본 에이전트 루트 재정의): `OPENCLAW_AGENT_DIR` (선호), `PI_CODING_AGENT_DIR` (레거시)

처음 사용 시 OpenClaw는 `oauth.json` 항목을 `auth-profiles.json`으로 가져옵니다.

### `auth`

인증 프로필에 대한 선택적 메타데이터입니다. 이것은 비밀을 저장하지 **않습니다**;
프로필 ID를 프로바이더 + 모드 (및 선택적 이메일)에 매핑하고 장애 조치에 사용되는
프로바이더 회전 순서를 정의합니다.

```json5
{
  auth: {
    profiles: {
      "anthropic:me@example.com": { provider: "anthropic", mode: "oauth", email: "me@example.com" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
    },
    order: {
      anthropic: ["anthropic:me@example.com", "anthropic:work"],
    },
  },
}
```

### `agents.list[].identity`

기본값 및 UX에 사용되는 선택적 에이전트별 정체성입니다. 이것은 macOS 온보딩 도우미에 의해 작성됩니다.

설정된 경우, OpenClaw는 기본값을 파생합니다 (명시적으로 설정하지 않은 경우에만):

- **활성 에이전트**의 `identity.emoji`에서 `messages.ackReaction` (👀로 폴백)
- 에이전트의 `identity.name`/`identity.emoji`에서 `agents.list[].groupChat.mentionPatterns` (Telegram/Slack/Discord/Google Chat/iMessage/WhatsApp의 그룹에서 "@Samantha"가 작동하도록)
- `identity.avatar`는 워크스페이스 상대 이미지 경로 또는 원격 URL/data URL을 허용합니다. 로컬 파일은 에이전트 워크스페이스 내에 있어야 합니다.

`identity.avatar` 허용:

- 워크스페이스 상대 경로 (에이전트 워크스페이스 내에 유지되어야 함)
- `http(s)` URL
- `data:` URI

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
      },
    ],
  },
}
```

### `wizard`

CLI 마법사 (`onboard`, `configure`, `doctor`)에 의해 작성된 메타데이터입니다.

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

### `logging`

- 기본 로그 파일: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- 안정적인 경로를 원하면 `logging.file`을 `/tmp/openclaw/openclaw.log`로 설정하세요.
- 콘솔 출력은 다음을 통해 별도로 조정할 수 있습니다:
  - `logging.consoleLevel` (기본값 `info`, `--verbose` 시 `debug`로 증가)
  - `logging.consoleStyle` (`pretty` | `compact` | `json`)
- 도구 요약은 비밀 유출을 방지하기 위해 편집할 수 있습니다:
  - `logging.redactSensitive` (`off` | `tools`, 기본값: `tools`)
  - `logging.redactPatterns` (정규식 문자열 배열; 기본값 재정의)

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
    redactPatterns: [
      // 예제: 기본값을 자체 규칙으로 재정의
      "\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1",
      "/\\bsk-[A-Za-z0-9_-]{8,}\\b/gi",
    ],
  },
}
```

### `channels.whatsapp.dmPolicy`

WhatsApp 다이렉트 채팅 (DM) 처리 방법을 제어합니다:

- `"pairing"` (기본값): 알 수 없는 발신자는 페어링 코드를 받습니다; 소유자가 승인해야 합니다
- `"allowlist"`: `channels.whatsapp.allowFrom` (또는 페어링된 허용 저장소)의 발신자만 허용
- `"open"`: 모든 인바운드 DM 허용 (**`channels.whatsapp.allowFrom`에 `"*"` 포함 필요**)
- `"disabled"`: 모든 인바운드 DM 무시

페어링 코드는 1시간 후 만료됩니다; 봇은 새 요청이 생성될 때만 페어링 코드를 보냅니다.
보류 중인 DM 페어링 요청은 기본적으로 **채널당 3개**로 제한됩니다.

페어링 승인:

- `openclaw pairing list whatsapp`
- `openclaw pairing approve whatsapp <code>`

### `channels.whatsapp.allowFrom`

WhatsApp 자동 응답을 트리거할 수 있는 E.164 전화번호의 허용 목록입니다 (**DM만**).
비어 있고 `channels.whatsapp.dmPolicy="pairing"`인 경우, 알 수 없는 발신자는 페어링 코드를 받습니다.
그룹의 경우 `channels.whatsapp.groupPolicy` + `channels.whatsapp.groupAllowFrom`을 사용하세요.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000, // 선택적 아웃바운드 청크 크기 (문자)
      chunkMode: "length", // 선택적 청킹 모드 (length | newline)
      mediaMaxMb: 50, // 선택적 인바운드 미디어 제한 (MB)
    },
  },
}
```

### `channels.whatsapp.sendReadReceipts`

인바운드 WhatsApp 메시지를 읽음으로 표시 (파란색 체크 표시)할지 제어합니다. 기본값: `true`.

셀프 채팅 모드는 활성화되어 있어도 항상 읽음 수신을 건너뜁니다.

계정별 재정의: `channels.whatsapp.accounts.<id>.sendReadReceipts`.

```json5
{
  channels: {
    whatsapp: { sendReadReceipts: false },
  },
}
```

### `channels.whatsapp.accounts` (다중 계정)

하나의 게이트웨이에서 여러 WhatsApp 계정 실행:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {}, // 선택적; 기본 ID를 안정적으로 유지
        personal: {},
        biz: {
          // 선택적 재정의. 기본값: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

참고:

- 아웃바운드 명령은 있는 경우 계정 `default`를 기본값으로 사용합니다; 그렇지 않으면 첫 번째 구성된 계정 ID (정렬됨).
- 레거시 단일 계정 Baileys 인증 디렉토리는 `openclaw doctor`에 의해 `whatsapp/default`로 마이그레이션됩니다.

### `channels.telegram.accounts` / `channels.discord.accounts` / `channels.googlechat.accounts` / `channels.slack.accounts` / `channels.mattermost.accounts` / `channels.signal.accounts` / `channels.imessage.accounts`

채널당 여러 계정 실행 (각 계정에는 자체 `accountId`와 선택적 `name`이 있음):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

참고:

- `accountId`가 생략된 경우 `default`가 사용됩니다 (CLI + 라우팅).
- 환경 토큰은 **기본** 계정에만 적용됩니다.
- 기본 채널 설정 (그룹 정책, 멘션 게이팅 등)은 계정별로 재정의되지 않는 한 모든 계정에 적용됩니다.
- `bindings[].match.accountId`를 사용하여 각 계정을 다른 에이전트로 라우팅합니다.

### 그룹 채팅 멘션 게이팅 (`agents.list[].groupChat` + `messages.groupChat`)

그룹 메시지는 기본적으로 **멘션 필요** (메타데이터 멘션 또는 정규식 패턴)입니다.
WhatsApp, Telegram, Discord, Google Chat 및 iMessage 그룹 채팅에 적용됩니다.

**멘션 유형:**

- **메타데이터 멘션**: 네이티브 플랫폼 @-멘션 (예: WhatsApp 탭하여 멘션). WhatsApp 셀프 채팅 모드에서 무시됩니다 (`channels.whatsapp.allowFrom` 참조).
- **텍스트 패턴**: `agents.list[].groupChat.mentionPatterns`에 정의된 정규식 패턴. 셀프 채팅 모드와 관계없이 항상 확인됩니다.
- 멘션 게이팅은 멘션 감지가 가능한 경우에만 시행됩니다 (네이티브 멘션 또는 최소 하나의 `mentionPattern`).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit`은 그룹 히스토리 컨텍스트의 글로벌 기본값을 설정합니다.
채널은 `channels.<channel>.historyLimit` (또는 다중 계정의 경우 `channels.<channel>.accounts.*.historyLimit`)으로 재정의할 수 있습니다.
히스토리 래핑을 비활성화하려면 `0`으로 설정하세요.

#### DM 히스토리 제한

DM 대화는 에이전트가 관리하는 세션 기반 히스토리를 사용합니다. DM 세션당 유지되는 사용자 턴 수를 제한할 수 있습니다:

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30, // DM 세션을 30 사용자 턴으로 제한
      dms: {
        "123456789": { historyLimit: 50 }, // 사용자별 재정의 (사용자 ID)
      },
    },
  },
}
```

해석 순서:

1. DM별 재정의: `channels.<provider>.dms[userId].historyLimit`
2. 프로바이더 기본값: `channels.<provider>.dmHistoryLimit`
3. 제한 없음 (모든 히스토리 유지)

지원되는 프로바이더: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

에이전트별 재정의 (설정된 경우 우선 순위, `[]`도 포함):

```json5
{
  agents: {
    list: [
      { id: "work", groupChat: { mentionPatterns: ["@workbot", "\\+15555550123"] } },
      { id: "personal", groupChat: { mentionPatterns: ["@homebot", "\\+15555550999"] } },
    ],
  },
}
```

멘션 게이팅 기본값은 채널별로 존재합니다 (`channels.whatsapp.groups`, `channels.telegram.groups`,
`channels.imessage.groups`, `channels.discord.guilds`). `*.groups`가 설정되면 그룹 허용 목록 역할도 합니다;
모든 그룹을 허용하려면 `"*"`를 포함하세요.

**특정 텍스트 트리거에만** 응답하려면 (네이티브 @-멘션 무시):

```json5
{
  channels: {
    whatsapp: {
      // 셀프 채팅 모드를 활성화하려면 자신의 번호 포함 (네이티브 @-멘션 무시).
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          // 이 텍스트 패턴만 응답 트리거
          mentionPatterns: ["reisponde", "@openclaw"],
        },
      },
    ],
  },
}
```

### 그룹 정책 (채널별)

`channels.*.groupPolicy`를 사용하여 그룹/룸 메시지가 전혀 수락되는지 제어합니다:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["tg:123456789", "@alice"],
    },
    signal: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: {
          channels: { help: { allow: true } },
        },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
  },
}
```

참고:

- `"open"`: 그룹은 허용 목록을 우회합니다; 멘션 게이팅은 여전히 적용됩니다.
- `"disabled"`: 모든 그룹/룸 메시지 차단.
- `"allowlist"`: 구성된 허용 목록과 일치하는 그룹/룸만 허용.
- `channels.defaults.groupPolicy`는 프로바이더의 `groupPolicy`가 설정되지 않은 경우 기본값을 설정합니다.
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams는 `groupAllowFrom`을 사용합니다 (폴백: 명시적 `allowFrom`).
- Discord/Slack은 채널 허용 목록을 사용합니다 (`channels.discord.guilds.*.channels`, `channels.slack.channels`).
- 그룹 DM (Discord/Slack)은 여전히 `dm.groupEnabled` + `dm.groupChannels`에 의해 제어됩니다.
- 기본값은 `groupPolicy: "allowlist"`입니다 (`channels.defaults.groupPolicy`로 재정의되지 않는 한); 허용 목록이 구성되지 않은 경우 그룹 메시지가 차단됩니다.

### 다중 에이전트 라우팅 (`agents.list` + `bindings`)

하나의 게이트웨이 내에서 여러 격리된 에이전트 (별도 워크스페이스, `agentDir`, 세션)를 실행합니다.
인바운드 메시지는 바인딩을 통해 에이전트로 라우팅됩니다.

- `agents.list[]`: 에이전트별 재정의.
  - `id`: 안정적인 에이전트 ID (필수).
  - `default`: 선택적; 여러 개가 설정된 경우 첫 번째가 우선하며 경고가 로깅됩니다.
    아무것도 설정되지 않은 경우, 목록의 **첫 번째 항목**이 기본 에이전트입니다.
  - `name`: 에이전트의 표시 이름.
  - `workspace`: 기본값 `~/.openclaw/workspace-<agentId>` (`main`의 경우 `agents.defaults.workspace`로 폴백).
  - `agentDir`: 기본값 `~/.openclaw/agents/<agentId>/agent`.
  - `model`: 에이전트별 기본 모델, 해당 에이전트에 대해 `agents.defaults.model` 재정의.
    - 문자열 형식: `"provider/model"`, `agents.defaults.model.primary`만 재정의
    - 객체 형식: `{ primary, fallbacks }` (fallbacks는 `agents.defaults.model.fallbacks` 재정의; `[]`는 해당 에이전트의 글로벌 폴백 비활성화)
  - `identity`: 에이전트별 이름/테마/이모지 (멘션 패턴 + ack 반응에 사용됨).
  - `groupChat`: 에이전트별 멘션 게이팅 (`mentionPatterns`).
  - `sandbox`: 에이전트별 샌드박스 설정 (`agents.defaults.sandbox` 재정의).
    - `mode`: `"off"` | `"non-main"` | `"all"`
    - `workspaceAccess`: `"none"` | `"ro"` | `"rw"`
    - `scope`: `"session"` | `"agent"` | `"shared"`
    - `workspaceRoot`: 사용자 정의 샌드박스 워크스페이스 루트
    - `docker`: 에이전트별 도커 재정의 (예: `image`, `network`, `env`, `setupCommand`, 제한; `scope: "shared"` 시 무시됨)
    - `browser`: 에이전트별 샌드박스 브라우저 재정의 (`scope: "shared"` 시 무시됨)
    - `prune`: 에이전트별 샌드박스 정리 재정의 (`scope: "shared"` 시 무시됨)
  - `subagents`: 에이전트별 서브 에이전트 기본값.
    - `allowAgents`: 이 에이전트에서 `sessions_spawn`을 위한 에이전트 ID 허용 목록 (`["*"]` = 모든 항목 허용; 기본값: 동일한 에이전트만)
  - `tools`: 에이전트별 도구 제한 (샌드박스 도구 정책 전에 적용됨).
    - `profile`: 기본 도구 프로필 (allow/deny 전에 적용됨)
    - `allow`: 허용된 도구 이름 배열
    - `deny`: 거부된 도구 이름 배열 (deny가 우선)
- `agents.defaults`: 공유 에이전트 기본값 (모델, 워크스페이스, 샌드박스 등).
- `bindings[]`: 인바운드 메시지를 `agentId`로 라우팅.
  - `match.channel` (필수)
  - `match.accountId` (선택적; `*` = 모든 계정; 생략 = 기본 계정)
  - `match.peer` (선택적; `{ kind: dm|group|channel, id }`)
  - `match.guildId` / `match.teamId` (선택적; 채널별)

결정적 일치 순서:

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (정확히, peer/guild/team 없음)
5. `match.accountId: "*"` (채널 전체, peer/guild/team 없음)
6. 기본 에이전트 (`agents.list[].default`, 그렇지 않으면 첫 번째 목록 항목, 그렇지 않으면 `"main"`)

각 일치 계층 내에서 `bindings`의 첫 번째 일치 항목이 우선합니다.

#### 에이전트별 액세스 프로필 (다중 에이전트)

각 에이전트는 자체 샌드박스 + 도구 정책을 가질 수 있습니다. 이를 사용하여 하나의 게이트웨이에서
액세스 수준을 혼합할 수 있습니다:

- **전체 액세스** (개인 에이전트)
- **읽기 전용** 도구 + 워크스페이스
- **파일 시스템 액세스 없음** (메시징/세션 도구만)

우선 순위 및 추가 예제는 [다중 에이전트 샌드박스 및 도구](/multi-agent-sandbox-tools)를 참조하세요.

전체 액세스 (샌드박스 없음):

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

읽기 전용 도구 + 읽기 전용 워크스페이스:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

파일 시스템 액세스 없음 (메시징/세션 도구 활성화):

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

예제: 두 개의 WhatsApp 계정 → 두 개의 에이전트:

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
  channels: {
    whatsapp: {
      accounts: {
        personal: {},
        biz: {},
      },
    },
  },
}
```

### `tools.agentToAgent` (선택적)

에이전트 간 메시징은 옵트인입니다:

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `messages.queue`

에이전트 실행이 이미 활성화된 경우 인바운드 메시지의 동작을 제어합니다.

```json5
{
  messages: {
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog (steer+backlog ok) | interrupt (queue=steer legacy)
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
        discord: "collect",
        imessage: "collect",
        webchat: "collect",
      },
    },
  },
}
```

### `messages.inbound`

**동일한 발신자**의 빠른 인바운드 메시지를 디바운스하여 여러 연속 메시지가
단일 에이전트 턴이 되도록 합니다. 디바운싱은 채널 + 대화별로 범위가 지정되며
응답 스레딩/ID에 가장 최근 메시지를 사용합니다.

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000, // 0은 비활성화
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

참고:

- 디바운스는 **텍스트 전용** 메시지를 배치합니다; 미디어/첨부 파일은 즉시 플러시됩니다.
- 제어 명령 (예: `/queue`, `/new`)은 디바운싱을 우회하여 독립적으로 유지됩니다.

### `commands` (채팅 명령 처리)

커넥터 전체에서 채팅 명령이 활성화되는 방식을 제어합니다.

```json5
{
  commands: {
    native: "auto", // 지원되는 경우 네이티브 명령 등록 (auto)
    text: true, // 채팅 메시지에서 슬래시 명령 파싱
    bash: false, // ! 허용 (별칭: /bash) (호스트 전용; tools.elevated 허용 목록 필요)
    bashForegroundMs: 2000, // bash 포어그라운드 창 (0은 즉시 백그라운드)
    config: false, // /config 허용 (디스크에 작성)
    debug: false, // /debug 허용 (런타임 전용 재정의)
    restart: false, // /restart + 게이트웨이 재시작 도구 허용
    useAccessGroups: true, // 명령에 대한 액세스 그룹 허용 목록/정책 시행
  },
}
```

참고:

- 텍스트 명령은 **독립** 메시지로 전송되어야 하며 선행 `/`를 사용합니다 (일반 텍스트 별칭 없음).
- `commands.text: false`는 명령에 대한 채팅 메시지 파싱을 비활성화합니다.
- `commands.native: "auto"` (기본값)는 Discord/Telegram에 대한 네이티브 명령을 켜고 Slack은 끕니다; 지원되지 않는 채널은 텍스트 전용으로 유지됩니다.
- `commands.native: true|false`를 설정하여 모두 강제하거나 `channels.discord.commands.native`, `channels.telegram.commands.native`, `channels.slack.commands.native` (bool 또는 `"auto"`)로 채널별로 재정의합니다. `false`는 Discord/Telegram에서 시작 시 이전에 등록된 명령을 지웁니다; Slack 명령은 Slack 앱에서 관리됩니다.
- `channels.telegram.customCommands`는 추가 Telegram 봇 메뉴 항목을 추가합니다. 이름은 정규화됩니다; 네이티브 명령과의 충돌은 무시됩니다.
- `commands.bash: true`는 `! <cmd>`를 활성화하여 호스트 셸 명령을 실행합니다 (`/bash <cmd>`도 별칭으로 작동). `tools.elevated.enabled` 및 `tools.elevated.allowFrom.<channel>`에서 발신자 허용 목록 지정이 필요합니다.
- `commands.bashForegroundMs`는 bash가 백그라운드로 전환되기 전에 대기하는 시간을 제어합니다. bash 작업이 실행 중인 동안 새 `! <cmd>` 요청은 거부됩니다 (한 번에 하나씩).
- `commands.config: true`는 `/config`를 활성화합니다 (`openclaw.json` 읽기/쓰기).
- `channels.<provider>.configWrites`는 해당 채널에서 시작된 설정 변경을 게이팅합니다 (기본값: true). 이는 `/config set|unset` 및 프로바이더별 자동 마이그레이션 (Telegram 슈퍼그룹 ID 변경, Slack 채널 ID 변경)에 적용됩니다.
- `commands.debug: true`는 `/debug`를 활성화합니다 (런타임 전용 재정의).
- `commands.restart: true`는 `/restart` 및 게이트웨이 도구 재시작 작업을 활성화합니다.
- `commands.useAccessGroups: false`는 명령이 액세스 그룹 허용 목록/정책을 우회할 수 있도록 합니다.
- 슬래시 명령 및 지시문은 **권한이 있는 발신자**에 대해서만 인정됩니다. 권한 부여는
  채널 허용 목록/페어링 및 `commands.useAccessGroups`에서 파생됩니다.

### `web` (WhatsApp 웹 채널 런타임)

WhatsApp은 게이트웨이의 웹 채널 (Baileys Web)을 통해 실행됩니다. 연결된 세션이 존재하면 자동으로 시작됩니다.
기본적으로 끄려면 `web.enabled: false`를 설정하세요.

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

### `channels.telegram` (봇 전송)

OpenClaw는 `channels.telegram` 설정 섹션이 존재하는 경우에만 Telegram을 시작합니다. 봇 토큰은 `channels.telegram.botToken` (또는 `channels.telegram.tokenFile`)에서 해석되며, 기본 계정에 대한 폴백으로 `TELEGRAM_BOT_TOKEN`이 사용됩니다.
자동 시작을 비활성화하려면 `channels.telegram.enabled: false`를 설정하세요.
다중 계정 지원은 `channels.telegram.accounts` 아래에 있습니다 (위의 다중 계정 섹션 참조). 환경 토큰은 기본 계정에만 적용됩니다.
Telegram에서 시작된 설정 쓰기 (슈퍼그룹 ID 마이그레이션 및 `/config set|unset` 포함)를 차단하려면 `channels.telegram.configWrites: false`를 설정하세요.

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["tg:123456789"], // 선택적; "open"은 ["*"] 필요
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50, // 컨텍스트로 마지막 N개의 그룹 메시지 포함 (0은 비활성화)
      replyToMode: "first", // off | first | all
      linkPreview: true, // 아웃바운드 링크 미리보기 토글
      streamMode: "partial", // off | partial | block (초안 스트리밍; 블록 스트리밍과 별개)
      draftChunk: {
        // 선택적; streamMode=block에만 해당
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph", // paragraph | newline | sentence
      },
      actions: { reactions: true, sendMessage: true }, // 도구 작업 게이트 (false는 비활성화)
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 5,
      retry: {
        // 아웃바운드 재시도 정책
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        // 전송 재정의
        autoSelectFamily: false,
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook", // webhookSecret 필요
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

초안 스트리밍 참고사항:

- Telegram `sendMessageDraft` 사용 (초안 버블, 실제 메시지 아님).
- **비공개 채팅 토픽** 필요 (DM의 message_thread_id; 봇에 토픽 활성화됨).
- `/reasoning stream`은 추론을 초안으로 스트리밍한 다음 최종 답변을 전송합니다.
  재시도 정책 기본값 및 동작은 [재시도 정책](/concepts/retry)에 문서화되어 있습니다.

### `channels.discord` (봇 전송)

봇 토큰 및 선택적 게이팅을 설정하여 Discord 봇을 구성합니다:
다중 계정 지원은 `channels.discord.accounts` 아래에 있습니다 (위의 다중 계정 섹션 참조). 환경 토큰은 기본 계정에만 적용됩니다.

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8, // 인바운드 미디어 크기 제한
      allowBots: false, // 봇이 작성한 메시지 허용
      actions: {
        // 도구 작업 게이트 (false는 비활성화)
        reactions: true,
        stickers: true,
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
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dm: {
        enabled: true, // false일 때 모든 DM 비활성화
        policy: "pairing", // pairing | allowlist | open | disabled
        allowFrom: ["1234567890", "steipete"], // 선택적 DM 허용 목록 ("open"은 ["*"] 필요)
        groupEnabled: false, // 그룹 DM 활성화
        groupChannels: ["openclaw-dm"], // 선택적 그룹 DM 허용 목록
      },
      guilds: {
        "123456789012345678": {
          // 길드 ID (선호됨) 또는 슬러그
          slug: "friends-of-openclaw",
          requireMention: false, // 길드별 기본값
          reactionNotifications: "own", // off | own | all | allowlist
          users: ["987654321098765432"], // 선택적 길드별 사용자 허용 목록
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20, // 컨텍스트로 마지막 N개의 길드 메시지 포함
      textChunkLimit: 2000, // 선택적 아웃바운드 텍스트 청크 크기 (문자)
      chunkMode: "length", // 선택적 청킹 모드 (length | newline)
      maxLinesPerMessage: 17, // 메시지당 소프트 최대 줄 수 (Discord UI 클리핑)
      retry: {
        // 아웃바운드 재시도 정책
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

OpenClaw는 `channels.discord` 설정 섹션이 존재하는 경우에만 Discord를 시작합니다. 토큰은 `channels.discord.token`에서 해석되며, 기본 계정에 대한 폴백으로 `DISCORD_BOT_TOKEN`이 사용됩니다 (`channels.discord.enabled`가 `false`가 아닌 경우). cron/CLI 명령에 대한 전달 대상을 지정할 때 `user:<id>` (DM) 또는 `channel:<id>` (길드 채널)를 사용하세요; 단순 숫자 ID는 모호하여 거부됩니다.
길드 슬러그는 소문자이며 공백은 `-`로 대체됩니다; 채널 키는 슬러그화된 채널 이름을 사용합니다 (선행 `#` 없음). 이름 변경 모호성을 피하기 위해 길드 ID를 키로 사용하는 것을 선호합니다.
봇이 작성한 메시지는 기본적으로 무시됩니다. `channels.discord.allowBots`로 활성화합니다 (자체 메시지는 자체 응답 루프를 방지하기 위해 여전히 필터링됨).
반응 알림 모드:

- `off`: 반응 이벤트 없음.
- `own`: 봇 자신의 메시지에 대한 반응 (기본값).
- `all`: 모든 메시지에 대한 모든 반응.
- `allowlist`: `guilds.<id>.users`의 모든 메시지에 대한 반응 (빈 목록은 비활성화).
  아웃바운드 텍스트는 `channels.discord.textChunkLimit` (기본값 2000)로 청크됩니다. 길이 청킹 전에 빈 줄 (단락 경계)에서 분할하려면 `channels.discord.chunkMode="newline"`을 설정하세요. Discord 클라이언트는 매우 긴 메시지를 클리핑할 수 있으므로 `channels.discord.maxLinesPerMessage` (기본값 17)은 2000자 미만인 경우에도 긴 여러 줄 응답을 분할합니다.
  재시도 정책 기본값 및 동작은 [재시도 정책](/concepts/retry)에 문서화되어 있습니다.

### `channels.googlechat` (Chat API 웹훅)

Google Chat은 앱 수준 인증 (서비스 계정)을 사용하여 HTTP 웹훅을 통해 실행됩니다.
다중 계정 지원은 `channels.googlechat.accounts` 아래에 있습니다 (위의 다중 계정 섹션 참조). 환경 변수는 기본 계정에만 적용됩니다.

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // 선택적; 멘션 감지 개선
      dm: {
        enabled: true,
        policy: "pairing", // pairing | allowlist | open | disabled
        allowFrom: ["users/1234567890"], // 선택적; "open"은 ["*"] 필요
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

참고:

- 서비스 계정 JSON은 인라인 (`serviceAccount`) 또는 파일 기반 (`serviceAccountFile`)일 수 있습니다.
- 기본 계정에 대한 환경 폴백: `GOOGLE_CHAT_SERVICE_ACCOUNT` 또는 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- `audienceType` + `audience`는 Chat 앱의 웹훅 인증 설정과 일치해야 합니다.
- 전달 대상을 설정할 때 `spaces/<spaceId>` 또는 `users/<userId|email>`을 사용하세요.

### `channels.slack` (소켓 모드)

Slack은 소켓 모드로 실행되며 봇 토큰과 앱 토큰이 모두 필요합니다:

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dm: {
        enabled: true,
        policy: "pairing", // pairing | allowlist | open | disabled
        allowFrom: ["U123", "U456", "*"], // 선택적; "open"은 ["*"] 필요
        groupEnabled: false,
        groupChannels: ["G123"],
      },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50, // 컨텍스트로 마지막 N개의 채널/그룹 메시지 포함 (0은 비활성화)
      allowBots: false,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      textChunkLimit: 4000,
      chunkMode: "length",
      mediaMaxMb: 20,
    },
  },
}
```

다중 계정 지원은 `channels.slack.accounts` 아래에 있습니다 (위의 다중 계정 섹션 참조). 환경 토큰은 기본 계정에만 적용됩니다.

OpenClaw는 프로바이더가 활성화되고 두 토큰이 모두 설정된 경우 (설정 또는 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`을 통해) Slack을 시작합니다. cron/CLI 명령에 대한 전달 대상을 지정할 때 `user:<id>` (DM) 또는 `channel:<id>`를 사용하세요.
Slack에서 시작된 설정 쓰기 (채널 ID 마이그레이션 및 `/config set|unset` 포함)를 차단하려면 `channels.slack.configWrites: false`를 설정하세요.

봇이 작성한 메시지는 기본적으로 무시됩니다. `channels.slack.allowBots` 또는 `channels.slack.channels.<id>.allowBots`로 활성화합니다.

반응 알림 모드:

- `off`: 반응 이벤트 없음.
- `own`: 봇 자신의 메시지에 대한 반응 (기본값).
- `all`: 모든 메시지에 대한 모든 반응.
- `allowlist`: `channels.slack.reactionAllowlist`의 모든 메시지에 대한 반응 (빈 목록은 비활성화).

스레드 세션 격리:

- `channels.slack.thread.historyScope`는 스레드 히스토리가 스레드별 (`thread`, 기본값) 또는 채널 전체에서 공유 (`channel`)되는지 제어합니다.
- `channels.slack.thread.inheritParent`는 새 스레드 세션이 상위 채널 대화 기록을 상속하는지 제어합니다 (기본값: false).

Slack 작업 그룹 (`slack` 도구 작업 게이트):
| 작업 그룹 | 기본값 | 참고사항 |
| --- | --- | --- |
| reactions | 활성화됨 | 반응 + 반응 목록 |
| messages | 활성화됨 | 읽기/전송/편집/삭제 |
| pins | 활성화됨 | 고정/고정 해제/목록 |
| memberInfo | 활성화됨 | 멤버 정보 |
| emojiList | 활성화됨 | 사용자 정의 이모지 목록 |

### `channels.mattermost` (봇 토큰)

Mattermost는 플러그인으로 제공되며 코어 설치에 번들로 제공되지 않습니다.
먼저 설치하세요: `openclaw plugins install @openclaw/mattermost` (또는 git 체크아웃에서 `./extensions/mattermost`).

Mattermost는 서버의 기본 URL과 함께 봇 토큰이 필요합니다:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

OpenClaw는 계정이 구성되고 (봇 토큰 + 기본 URL) 활성화된 경우 Mattermost를 시작합니다. 토큰 + 기본 URL은 기본 계정에 대해 `channels.mattermost.botToken` + `channels.mattermost.baseUrl` 또는 `MATTERMOST_BOT_TOKEN` + `MATTERMOST_URL`에서 해석됩니다 (`channels.mattermost.enabled`가 `false`가 아닌 경우).

채팅 모드:

- `oncall` (기본값): @멘션된 경우에만 채널 메시지에 응답합니다.
- `onmessage`: 모든 채널 메시지에 응답합니다.
- `onchar`: 메시지가 트리거 접두사 (`channels.mattermost.oncharPrefixes`, 기본값 `[">", "!"]`)로 시작할 때 응답합니다.

액세스 제어:

- 기본 DM: `channels.mattermost.dmPolicy="pairing"` (알 수 없는 발신자는 페어링 코드를 받음).
- 공개 DM: `channels.mattermost.dmPolicy="open"` 및 `channels.mattermost.allowFrom=["*"]`.
- 그룹: 기본적으로 `channels.mattermost.groupPolicy="allowlist"` (멘션 게이트됨). 발신자를 제한하려면 `channels.mattermost.groupAllowFrom`을 사용하세요.

다중 계정 지원은 `channels.mattermost.accounts` 아래에 있습니다 (위의 다중 계정 섹션 참조). 환경 변수는 기본 계정에만 적용됩니다.
전달 대상을 지정할 때 `channel:<id>` 또는 `user:<id>` (또는 `@username`)를 사용하세요; 단순 ID는 채널 ID로 처리됩니다.

### `channels.signal` (signal-cli)

Signal 반응은 시스템 이벤트를 발생시킬 수 있습니다 (공유 반응 도구):

```json5
{
  channels: {
    signal: {
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50, // 컨텍스트로 마지막 N개의 그룹 메시지 포함 (0은 비활성화)
    },
  },
}
```

반응 알림 모드:

- `off`: 반응 이벤트 없음.
- `own`: 봇 자신의 메시지에 대한 반응 (기본값).
- `all`: 모든 메시지에 대한 모든 반응.
- `allowlist`: `channels.signal.reactionAllowlist`의 모든 메시지에 대한 반응 (빈 목록은 비활성화).

### `channels.imessage` (imsg CLI)

OpenClaw는 `imsg rpc` (stdio를 통한 JSON-RPC)를 생성합니다. 데몬이나 포트가 필요하지 않습니다.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host", // SSH 래퍼 사용 시 원격 첨부 파일용 SCP
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50, // 컨텍스트로 마지막 N개의 그룹 메시지 포함 (0은 비활성화)
      includeAttachments: false,
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

다중 계정 지원은 `channels.imessage.accounts` 아래에 있습니다 (위의 다중 계정 섹션 참조).

참고:

- Messages DB에 대한 전체 디스크 액세스가 필요합니다.
- 첫 번째 전송 시 Messages 자동화 권한을 요청합니다.
- `chat_id:<id>` 대상을 선호하세요. `imsg chats --limit 20`을 사용하여 채팅을 나열합니다.
- `channels.imessage.cliPath`는 래퍼 스크립트를 가리킬 수 있습니다 (예: `imsg rpc`를 실행하는 다른 Mac에 대한 `ssh`); 비밀번호 프롬프트를 피하려면 SSH 키를 사용하세요.
- 원격 SSH 래퍼의 경우 `includeAttachments`가 활성화된 경우 SCP를 통해 첨부 파일을 가져오려면 `channels.imessage.remoteHost`를 설정하세요.

예제 래퍼:

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

### `agents.defaults.workspace`

에이전트가 파일 작업에 사용하는 **단일 글로벌 워크스페이스 디렉토리**를 설정합니다.

기본값: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

`agents.defaults.sandbox`가 활성화된 경우, 비메인 세션은 `agents.defaults.sandbox.workspaceRoot` 아래의 자체 범위별 워크스페이스로 이를 재정의할 수 있습니다.

### `agents.defaults.repoRoot`

시스템 프롬프트의 런타임 줄에 표시할 선택적 리포지토리 루트입니다. 설정되지 않은 경우 OpenClaw는
워크스페이스 (및 현재 작업 디렉토리)에서 위로 올라가면서 `.git` 디렉토리를 감지하려고 시도합니다. 경로가 사용되려면 존재해야 합니다.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skipBootstrap`

워크스페이스 부트스트랩 파일 (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `BOOTSTRAP.md`)의 자동 생성을 비활성화합니다.

워크스페이스 파일이 리포지토리에서 제공되는 사전 시드 배포에 사용하세요.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

잘림 전에 시스템 프롬프트에 주입되는 각 워크스페이스 부트스트랩 파일의 최대 문자 수입니다. 기본값: `20000`.

파일이 이 제한을 초과하면 OpenClaw는 경고를 로깅하고 마커가 있는 잘린 head/tail을 주입합니다.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.userTimezone`

**시스템 프롬프트 컨텍스트**에 대한 사용자의 시간대를 설정합니다 (메시지 봉투의 타임스탬프가 아님). 설정되지 않은 경우 OpenClaw는 런타임에 호스트 시간대를 사용합니다.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

시스템 프롬프트의 현재 날짜 및 시간 섹션에 표시되는 **시간 형식**을 제어합니다.
기본값: `auto` (OS 기본 설정).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `messages`

인바운드/아웃바운드 접두사 및 선택적 ack 반응을 제어합니다.
큐잉, 세션 및 스트리밍 컨텍스트는 [메시지](/concepts/messages)를 참조하세요.

```json5
{
  messages: {
    responsePrefix: "🦞", // 또는 "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
    removeAckAfterReply: false,
  },
}
```

`responsePrefix`는 이미 존재하지 않는 한 채널 전체의 **모든 아웃바운드 응답** (도구 요약, 블록 스트리밍, 최종 응답)에 적용됩니다.

`messages.responsePrefix`가 설정되지 않은 경우 기본적으로 접두사가 적용되지 않습니다. WhatsApp 셀프 채팅
응답은 예외입니다: 설정된 경우 `[{identity.name}]`로 기본값이 설정되고, 그렇지 않으면
`[openclaw]`로 설정되어 동일한 전화 대화를 읽을 수 있게 합니다.
라우팅된 에이전트에 대해 `[{identity.name}]`을 파생하려면 `"auto"`로 설정하세요 (설정된 경우).

#### 템플릿 변수

`responsePrefix` 문자열에는 동적으로 해석되는 템플릿 변수가 포함될 수 있습니다:

| 변수              | 설명                 | 예제                        |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | 짧은 모델 이름       | `claude-opus-4-5`, `gpt-4o` |
| `{modelFull}`     | 전체 모델 식별자     | `anthropic/claude-opus-4-5` |
| `{provider}`      | 프로바이더 이름      | `anthropic`, `openai`       |
| `{thinkingLevel}` | 현재 사고 수준       | `high`, `low`, `off`        |
| `{identity.name}` | 에이전트 정체성 이름 | (`"auto"` 모드와 동일)      |

변수는 대소문자를 구분하지 않습니다 (`{MODEL}` = `{model}`). `{think}`는 `{thinkingLevel}`의 별칭입니다.
해석되지 않은 변수는 리터럴 텍스트로 유지됩니다.

```json5
{
  messages: {
    responsePrefix: "[{model} | think:{thinkingLevel}]",
  },
}
```

예제 출력: `[claude-opus-4-5 | think:high] Here's my response...`

WhatsApp 인바운드 접두사는 `channels.whatsapp.messagePrefix`를 통해 구성됩니다 (더 이상 사용되지 않음:
`messages.messagePrefix`). 기본값은 **변경되지 않음**: `channels.whatsapp.allowFrom`이 비어 있으면 `"[openclaw]"`, 그렇지 않으면 `""` (접두사 없음). `"[openclaw]"`를 사용할 때
라우팅된 에이전트에 `identity.name`이 설정된 경우 OpenClaw는 대신 `[{identity.name}]`을 사용합니다.

`ackReaction`은 반응을 지원하는 채널 (Slack/Discord/Telegram/Google Chat)에서 인바운드 메시지를 확인하기 위해 최선의 노력으로 이모지 반응을 보냅니다. 설정된 경우 활성 에이전트의 `identity.emoji`로 기본값이 설정되고, 그렇지 않으면 `"👀"`로 설정됩니다. 비활성화하려면 `""`로 설정하세요.

`ackReactionScope`는 반응이 발생하는 시기를 제어합니다:

- `group-mentions` (기본값): 그룹/룸에서 멘션이 필요 **하고** 봇이 멘션된 경우에만
- `group-all`: 모든 그룹/룸 메시지
- `direct`: 다이렉트 메시지만
- `all`: 모든 메시지

`removeAckAfterReply`는 응답이 전송된 후 봇의 ack 반응을 제거합니다
(Slack/Discord/Telegram/Google Chat만). 기본값: `false`.

#### `messages.tts`

아웃바운드 응답에 대한 텍스트 음성 변환을 활성화합니다. 활성화되면 OpenClaw는
ElevenLabs 또는 OpenAI를 사용하여 오디오를 생성하고 응답에 첨부합니다. Telegram은 Opus
음성 메모를 사용합니다; 다른 채널은 MP3 오디오를 전송합니다.

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all (도구/블록 응답 포함)
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

참고:

- `messages.tts.auto`는 자동 TTS (`off`, `always`, `inbound`, `tagged`)를 제어합니다.
- `/tts off|always|inbound|tagged`는 세션별 자동 모드를 설정합니다 (설정 재정의).
- `messages.tts.enabled`는 레거시입니다; doctor가 이를 `messages.tts.auto`로 마이그레이션합니다.
- `prefsPath`는 로컬 재정의 (프로바이더/제한/요약)를 저장합니다.
- `maxTextLength`는 TTS 입력의 하드 캡입니다; 요약은 맞추기 위해 잘립니다.
- `summaryModel`은 자동 요약에 대해 `agents.defaults.model.primary`를 재정의합니다.
  - `provider/model` 또는 `agents.defaults.models`의 별칭을 허용합니다.
- `modelOverrides`는 `[[tts:...]]` 태그와 같은 모델 기반 재정의를 활성화합니다 (기본적으로 켜짐).
- `/tts limit` 및 `/tts summary`는 사용자별 요약 설정을 제어합니다.
- `apiKey` 값은 `ELEVENLABS_API_KEY`/`XI_API_KEY` 및 `OPENAI_API_KEY`로 폴백됩니다.
- `elevenlabs.baseUrl`은 ElevenLabs API 기본 URL을 재정의합니다.
- `elevenlabs.voiceSettings`는 `stability`/`similarityBoost`/`style` (0..1),
  `useSpeakerBoost`, `speed` (0.5..2.0)를 지원합니다.

### `talk`

Talk 모드 (macOS/iOS/Android)의 기본값입니다. 음성 ID는 설정되지 않은 경우 `ELEVENLABS_VOICE_ID` 또는 `SAG_VOICE_ID`로 폴백됩니다.
`apiKey`는 설정되지 않은 경우 `ELEVENLABS_API_KEY` (또는 게이트웨이의 셸 프로필)로 폴백됩니다.
`voiceAliases`는 Talk 지시문이 친숙한 이름을 사용할 수 있도록 합니다 (예: `"voice":"Clawd"`).

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    voiceAliases: {
      Clawd: "EXAVITQu4vr4xnSDxMaL",
      Roger: "CwhRBWXzGAHq8TQ4Fs17",
    },
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    interruptOnSpeech: true,
  },
}
```

### `agents.defaults`

임베디드 에이전트 런타임 (모델/사고/상세/타임아웃)을 제어합니다.
`agents.defaults.models`는 구성된 모델 카탈로그를 정의합니다 (그리고 `/model`의 허용 목록 역할을 함).
`agents.defaults.model.primary`는 기본 모델을 설정합니다; `agents.defaults.model.fallbacks`는 글로벌 장애 조치입니다.
`agents.defaults.imageModel`은 선택적이며 **기본 모델에 이미지 입력이 없는 경우에만 사용됩니다**.
각 `agents.defaults.models` 항목은 다음을 포함할 수 있습니다:

- `alias` (선택적 모델 단축키, 예: `/opus`).
- `params` (선택적 프로바이더별 API 매개변수, 모델 요청에 전달됨).

`params`는 스트리밍 실행 (임베디드 에이전트 + 압축)에도 적용됩니다. 오늘 지원되는 키: `temperature`, `maxTokens`. 이들은 호출 시간 옵션과 병합됩니다; 호출자가 제공한 값이 우선합니다. `temperature`는 고급 노브입니다—모델의 기본값을 알고 변경이 필요한 경우가 아니면 설정하지 마세요.

예제:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-5-20250929": {
          params: { temperature: 0.6 },
        },
        "openai/gpt-5.2": {
          params: { maxTokens: 8192 },
        },
      },
    },
  },
}
```

Z.AI GLM-4.x 모델은 다음 경우가 아니면 사고 모드를 자동으로 활성화합니다:

- `--thinking off`를 설정하거나
- `agents.defaults.models["zai/<model>"].params.thinking`을 직접 정의합니다.

OpenClaw는 또한 몇 가지 내장 별칭 단축키를 제공합니다. 기본값은 모델이
이미 `agents.defaults.models`에 있는 경우에만 적용됩니다:

- `opus` -> `anthropic/claude-opus-4-5`
- `sonnet` -> `anthropic/claude-sonnet-4-5`
- `gpt` -> `openai/gpt-5.2`
- `gpt-mini` -> `openai/gpt-5-mini`
- `gemini` -> `google/gemini-3-pro-preview`
- `gemini-flash` -> `google/gemini-3-flash-preview`

동일한 별칭 이름 (대소문자 구분 안 함)을 직접 구성하면 사용자 값이 우선합니다 (기본값은 재정의되지 않음).

예제: MiniMax M2.1 폴백이 있는 Opus 4.5 기본 (호스팅된 MiniMax):

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-5": { alias: "opus" },
        "minimax/MiniMax-M2.1": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-5",
        fallbacks: ["minimax/MiniMax-M2.1"],
      },
    },
  },
}
```

MiniMax 인증: `MINIMAX_API_KEY` (환경)를 설정하거나 `models.providers.minimax`를 구성하세요.

#### `agents.defaults.cliBackends` (CLI 폴백)

텍스트 전용 폴백 실행 (도구 호출 없음)을 위한 선택적 CLI 백엔드입니다. 이는
API 프로바이더가 실패할 때 백업 경로로 유용합니다. 파일 경로를 허용하는
`imageArg`를 구성하면 이미지 전달이 지원됩니다.

참고:

- CLI 백엔드는 **텍스트 우선**입니다; 도구는 항상 비활성화됩니다.
- 세션은 `sessionArg`가 설정된 경우 지원됩니다; 세션 ID는 백엔드별로 유지됩니다.
- `claude-cli`의 경우 기본값이 내장되어 있습니다. PATH가 최소인 경우
  (launchd/systemd) 명령 경로를 재정의하세요.

예제:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-5": { alias: "Opus" },
        "anthropic/claude-sonnet-4-1": { alias: "Sonnet" },
        "openrouter/deepseek/deepseek-r1:free": {},
        "zai/glm-4.7": {
          alias: "GLM",
          params: {
            thinking: {
              type: "enabled",
              clear_thinking: false,
            },
          },
        },
      },
      model: {
        primary: "anthropic/claude-opus-4-5",
        fallbacks: [
          "openrouter/deepseek/deepseek-r1:free",
          "openrouter/meta-llama/llama-3.3-70b-instruct:free",
        ],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      heartbeat: {
        every: "30m",
        target: "last",
      },
      maxConcurrent: 3,
      subagents: {
        model: "minimax/MiniMax-M2.1",
        maxConcurrent: 1,
        archiveAfterMinutes: 60,
      },
      exec: {
        backgroundMs: 10000,
        timeoutSec: 1800,
        cleanupMs: 1800000,
      },
      contextTokens: 200000,
    },
  },
}
```

#### `agents.defaults.contextPruning` (도구 결과 정리)

`agents.defaults.contextPruning`은 요청이 LLM으로 전송되기 직전에 메모리 내 컨텍스트에서 **이전 도구 결과**를 정리합니다.
디스크의 세션 히스토리는 수정하지 **않습니다** (`*.jsonl`은 완전하게 유지됨).

이는 시간이 지남에 따라 큰 도구 출력을 누적하는 수다스러운 에이전트의 토큰 사용량을 줄이기 위한 것입니다.

상위 수준:

- 사용자/어시스턴트 메시지는 절대 건드리지 않습니다.
- 마지막 `keepLastAssistants` 어시스턴트 메시지를 보호합니다 (해당 지점 이후의 도구 결과는 정리되지 않음).
- 부트스트랩 접두사를 보호합니다 (첫 번째 사용자 메시지 이전의 내용은 정리되지 않음).
- 모드:
  - `adaptive`: 예상 컨텍스트 비율이 `softTrimRatio`를 넘을 때 큰 도구 결과를 소프트 트림합니다 (head/tail 유지).
    그런 다음 예상 컨텍스트 비율이 `hardClearRatio`를 넘고 **그리고**
    정리 가능한 도구 결과 양이 충분한 경우 (`minPrunableToolChars`) 가장 오래된 적격 도구 결과를 하드 클리어합니다.
  - `aggressive`: 항상 컷오프 이전의 적격 도구 결과를 `hardClear.placeholder`로 교체합니다 (비율 확인 없음).

소프트 vs 하드 정리 (LLM으로 전송되는 컨텍스트에서 변경되는 내용):

- **소프트 트림**: _큰_ 도구 결과에만 해당. 시작 + 끝을 유지하고 중간에 `...`를 삽입합니다.
  - 이전: `toolResult("…매우 긴 출력…")`
  - 이후: `toolResult("HEAD…\n...\n…TAIL\n\n[도구 결과 트림됨: …]")`
- **하드 클리어**: 전체 도구 결과를 플레이스홀더로 교체합니다.
  - 이전: `toolResult("…매우 긴 출력…")`
  - 이후: `toolResult("[이전 도구 결과 내용 삭제됨]")`

참고 / 현재 제한 사항:

- **이미지 블록을 포함하는 도구 결과는 건너뜁니다** (현재 트림/클리어되지 않음).
- 예상 "컨텍스트 비율"은 **문자** (근사값)를 기반으로 하며, 정확한 토큰이 아닙니다.
- 세션에 아직 최소 `keepLastAssistants` 어시스턴트 메시지가 없는 경우 정리가 건너뜁니다.
- `aggressive` 모드에서는 `hardClear.enabled`가 무시됩니다 (적격 도구 결과는 항상 `hardClear.placeholder`로 교체됨).

기본값 (adaptive):

```json5
{
  agents: { defaults: { contextPruning: { mode: "adaptive" } } },
}
```

비활성화:

```json5
{
  agents: { defaults: { contextPruning: { mode: "off" } } },
}
```

기본값 (`mode`가 `"adaptive"` 또는 `"aggressive"`인 경우):

- `keepLastAssistants`: `3`
- `softTrimRatio`: `0.3` (adaptive만)
- `hardClearRatio`: `0.5` (adaptive만)
- `minPrunableToolChars`: `50000` (adaptive만)
- `softTrim`: `{ maxChars: 4000, headChars: 1500, tailChars: 1500 }` (adaptive만)
- `hardClear`: `{ enabled: true, placeholder: "[이전 도구 결과 내용 삭제됨]" }`

예제 (aggressive, 최소):

```json5
{
  agents: { defaults: { contextPruning: { mode: "aggressive" } } },
}
```

예제 (adaptive 조정):

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "adaptive",
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[이전 도구 결과 내용 삭제됨]" },
        // 선택적: 특정 도구로 정리 제한 (deny가 우선; "*" 와일드카드 지원)
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

동작 세부사항은 [/concepts/session-pruning](/concepts/session-pruning)을 참조하세요.

#### `agents.defaults.compaction` (여유 확보 + 메모리 플러시)

`agents.defaults.compaction.mode`는 압축 요약 전략을 선택합니다. 기본값은 `default`입니다; 매우 긴 히스토리에 대한 청크 요약을 활성화하려면 `safeguard`를 설정하세요. [/concepts/compaction](/concepts/compaction)을 참조하세요.

`agents.defaults.compaction.reserveTokensFloor`는 Pi 압축에 대한 최소 `reserveTokens`
값을 시행합니다 (기본값: `20000`). 플로어를 비활성화하려면 `0`으로 설정하세요.

`agents.defaults.compaction.memoryFlush`는 자동 압축 전에 **무음** 에이전트 턴을 실행하여
모델에 디스크에 지속 가능한 메모리를 저장하도록 지시합니다 (예:
`memory/YYYY-MM-DD.md`). 세션 토큰 추정치가 압축 제한보다 낮은 소프트 임계값을 넘을 때 트리거됩니다.

레거시 기본값:

- `memoryFlush.enabled`: `true`
- `memoryFlush.softThresholdTokens`: `4000`
- `memoryFlush.prompt` / `memoryFlush.systemPrompt`: `NO_REPLY`가 포함된 내장 기본값
- 참고: 세션 워크스페이스가 읽기 전용인 경우 메모리 플러시가 건너뜁니다
  (`agents.defaults.sandbox.workspaceAccess: "ro"` 또는 `"none"`).

예제 (조정):

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard",
        reserveTokensFloor: 24000,
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "세션이 압축에 가까워지고 있습니다. 지금 지속 가능한 메모리를 저장하세요.",
          prompt: "지속되는 메모는 memory/YYYY-MM-DD.md에 작성하세요; 저장할 내용이 없으면 NO_REPLY로 응답하세요.",
        },
      },
    },
  },
}
```

블록 스트리밍:

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (기본값 off).
- 채널 재정의: `*.blockStreaming` (및 계정별 변형)을 사용하여 블록 스트리밍을 강제로 켜거나 끕니다.
  비Telegram 채널은 블록 응답을 활성화하려면 명시적인 `*.blockStreaming: true`가 필요합니다.
- `agents.defaults.blockStreamingBreak`: `"text_end"` 또는 `"message_end"` (기본값: text_end).
- `agents.defaults.blockStreamingChunk`: 스트리밍된 블록에 대한 소프트 청킹. 기본값은
  800–1200자이며, 단락 구분 (`\n\n`)을 선호한 다음 줄바꿈, 그 다음 문장을 선호합니다.
  예제:
  ```json5
  {
    agents: { defaults: { blockStreamingChunk: { minChars: 800, maxChars: 1200 } } },
  }
  ```
- `agents.defaults.blockStreamingCoalesce`: 전송 전에 스트리밍된 블록을 병합합니다.
  기본값은 `{ idleMs: 1000 }`이며 `blockStreamingChunk`에서 `minChars`를 상속하고
  `maxChars`는 채널 텍스트 제한으로 제한됩니다. Signal/Slack/Discord/Google Chat은 재정의되지 않는 한
  `minChars: 1500`으로 기본값이 설정됩니다.
  채널 재정의: `channels.whatsapp.blockStreamingCoalesce`, `channels.telegram.blockStreamingCoalesce`,
  `channels.discord.blockStreamingCoalesce`, `channels.slack.blockStreamingCoalesce`, `channels.mattermost.blockStreamingCoalesce`,
  `channels.signal.blockStreamingCoalesce`, `channels.imessage.blockStreamingCoalesce`, `channels.msteams.blockStreamingCoalesce`,
  `channels.googlechat.blockStreamingCoalesce`
  (및 계정별 변형).
- `agents.defaults.humanDelay`: 첫 번째 이후 **블록 응답** 사이의 무작위 일시 중지.
  모드: `off` (기본값), `natural` (800–2500ms), `custom` (`minMs`/`maxMs` 사용).
  에이전트별 재정의: `agents.list[].humanDelay`.
  예제:
  ```json5
  {
    agents: { defaults: { humanDelay: { mode: "natural" } } },
  }
  ```
  동작 + 청킹 세부사항은 [/concepts/streaming](/concepts/streaming)을 참조하세요.

타이핑 표시기:

- `agents.defaults.typingMode`: `"never" | "instant" | "thinking" | "message"`. 기본값은
  다이렉트 채팅 / 멘션의 경우 `instant`이고 멘션되지 않은 그룹 채팅의 경우 `message`입니다.
- `session.typingMode`: 모드에 대한 세션별 재정의.
- `agents.defaults.typingIntervalSeconds`: 타이핑 신호가 새로 고침되는 빈도 (기본값: 6s).
- `session.typingIntervalSeconds`: 새로 고침 간격에 대한 세션별 재정의.
  동작 세부사항은 [/concepts/typing-indicators](/concepts/typing-indicators)를 참조하세요.

`agents.defaults.model.primary`는 `provider/model` (예: `anthropic/claude-opus-4-5`)로 설정해야 합니다.
별칭은 `agents.defaults.models.*.alias` (예: `Opus`)에서 제공됩니다.
프로바이더를 생략하면 OpenClaw는 현재 임시 지원 중단 폴백으로 `anthropic`을 가정합니다.
Z.AI 모델은 `zai/<model>` (예: `zai/glm-4.7`)로 사용 가능하며
환경에 `ZAI_API_KEY` (또는 레거시 `Z_AI_API_KEY`)가 필요합니다.

`agents.defaults.heartbeat`는 주기적인 하트비트 실행을 구성합니다:

- `every`: 기간 문자열 (`ms`, `s`, `m`, `h`); 기본 단위 분. 기본값:
  `30m`. 비활성화하려면 `0m`으로 설정하세요.
- `model`: 하트비트 실행에 대한 선택적 재정의 모델 (`provider/model`).
- `includeReasoning`: `true`인 경우 하트비트는 사용 가능한 경우 별도의 `추론:` 메시지도 전달합니다 (`/reasoning on`과 동일한 형태). 기본값: `false`.
- `session`: 하트비트가 실행되는 세션을 제어하는 선택적 세션 키. 기본값: `main`.
- `to`: 선택적 수신자 재정의 (채널별 ID, 예: WhatsApp의 E.164, Telegram의 채팅 ID).
- `target`: 선택적 전달 채널 (`last`, `whatsapp`, `telegram`, `discord`, `slack`, `msteams`, `signal`, `imessage`, `none`). 기본값: `last`.
- `prompt`: 하트비트 본문에 대한 선택적 재정의 (기본값: `HEARTBEAT.md가 있는 경우 읽으세요 (워크스페이스 컨텍스트). 엄격히 따르세요. 이전 채팅에서 이전 작업을 유추하거나 반복하지 마세요. 주의가 필요한 내용이 없으면 HEARTBEAT_OK로 응답하세요.`). 재정의는 그대로 전송됩니다; 파일을 여전히 읽고 싶다면 `Read HEARTBEAT.md` 줄을 포함하세요.
- `ackMaxChars`: 전달 전 `HEARTBEAT_OK` 이후 허용되는 최대 문자 수 (기본값: 300).

에이전트별 하트비트:

- `agents.list[].heartbeat`를 설정하여 특정 에이전트에 대한 하트비트 설정을 활성화하거나 재정의합니다.
- 에이전트 항목이 `heartbeat`를 정의하는 경우 **해당 에이전트만** 하트비트를 실행합니다; 기본값은
  해당 에이전트의 공유 베이스라인이 됩니다.

하트비트는 전체 에이전트 턴을 실행합니다. 더 짧은 간격은 더 많은 토큰을 소비합니다; `every`에 주의하고, `HEARTBEAT.md`를 작게 유지하고/또는 더 저렴한 `model`을 선택하세요.

`tools.exec`는 백그라운드 exec 기본값을 구성합니다:

- `backgroundMs`: 자동 백그라운드 전 시간 (ms, 기본값 10000)
- `timeoutSec`: 이 런타임 이후 자동 종료 (초, 기본값 1800)
- `cleanupMs`: 완료된 세션을 메모리에 유지하는 시간 (ms, 기본값 1800000)
- `notifyOnExit`: 백그라운드 exec가 종료될 때 시스템 이벤트 대기열에 추가 + 하트비트 요청 (기본값 true)
- `applyPatch.enabled`: 실험적 `apply_patch` 활성화 (OpenAI/OpenAI Codex만; 기본값 false)
- `applyPatch.allowModels`: 모델 ID의 선택적 허용 목록 (예: `gpt-5.2` 또는 `openai/gpt-5.2`)
  참고: `applyPatch`는 `tools.exec` 아래에만 있습니다.

`tools.web`은 웹 검색 + 가져오기 도구를 구성합니다:

- `tools.web.search.enabled` (기본값: 키가 있는 경우 true)
- `tools.web.search.apiKey` (권장: `openclaw configure --section web`을 통해 설정하거나 `BRAVE_API_KEY` 환경 변수 사용)
- `tools.web.search.maxResults` (1–10, 기본값 5)
- `tools.web.search.timeoutSeconds` (기본값 30)
- `tools.web.search.cacheTtlMinutes` (기본값 15)
- `tools.web.fetch.enabled` (기본값 true)
- `tools.web.fetch.maxChars` (기본값 50000)
- `tools.web.fetch.timeoutSeconds` (기본값 30)
- `tools.web.fetch.cacheTtlMinutes` (기본값 15)
- `tools.web.fetch.userAgent` (선택적 재정의)
- `tools.web.fetch.readability` (기본값 true; 비활성화하면 기본 HTML 정리만 사용)
- `tools.web.fetch.firecrawl.enabled` (API 키가 설정된 경우 기본값 true)
- `tools.web.fetch.firecrawl.apiKey` (선택적; 기본값 `FIRECRAWL_API_KEY`)
- `tools.web.fetch.firecrawl.baseUrl` (기본값 https://api.firecrawl.dev)
- `tools.web.fetch.firecrawl.onlyMainContent` (기본값 true)
- `tools.web.fetch.firecrawl.maxAgeMs` (선택적)
- `tools.web.fetch.firecrawl.timeoutSeconds` (선택적)

`tools.media`는 인바운드 미디어 이해 (이미지/오디오/비디오)를 구성합니다:

- `tools.media.models`: 공유 모델 목록 (기능 태그 지정; 기능별 목록 이후 사용됨).
- `tools.media.concurrency`: 최대 동시 기능 실행 (기본값 2).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - `enabled`: 옵트아웃 스위치 (모델이 구성된 경우 기본값 true).
  - `prompt`: 선택적 프롬프트 재정의 (이미지/비디오는 `maxChars` 힌트를 자동으로 추가).
  - `maxChars`: 최대 출력 문자 (이미지/비디오의 경우 기본값 500; 오디오의 경우 설정 안 됨).
  - `maxBytes`: 전송할 최대 미디어 크기 (기본값: 이미지 10MB, 오디오 20MB, 비디오 50MB).
  - `timeoutSeconds`: 요청 타임아웃 (기본값: 이미지 60s, 오디오 60s, 비디오 120s).
  - `language`: 선택적 오디오 힌트.
  - `attachments`: 첨부 파일 정책 (`mode`, `maxAttachments`, `prefer`).
  - `scope`: `match.channel`, `match.chatType` 또는 `match.keyPrefix`를 사용한 선택적 게이팅 (첫 번째 일치가 우선).
  - `models`: 모델 항목의 순서 목록; 실패 또는 너무 큰 미디어는 다음 항목으로 폴백됩니다.
- 각 `models[]` 항목:
  - 프로바이더 항목 (`type: "provider"` 또는 생략):
    - `provider`: API 프로바이더 ID (`openai`, `anthropic`, `google`/`gemini`, `groq` 등).
    - `model`: 모델 ID 재정의 (이미지의 경우 필수; 오디오 프로바이더의 경우 `gpt-4o-mini-transcribe`/`whisper-large-v3-turbo`로, 비디오의 경우 `gemini-3-flash-preview`로 기본값).
    - `profile` / `preferredProfile`: 인증 프로필 선택.
  - CLI 항목 (`type: "cli"`):
    - `command`: 실행할 실행 파일.
    - `args`: 템플릿 인수 (`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` 등 지원).
  - `capabilities`: 공유 항목을 게이트하는 선택적 목록 (`image`, `audio`, `video`). 생략 시 기본값: `openai`/`anthropic`/`minimax` → 이미지, `google` → 이미지+오디오+비디오, `groq` → 오디오.
  - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`는 항목별로 재정의할 수 있습니다.

모델이 구성되지 않은 경우 (또는 `enabled: false`), 이해가 건너뜁니다; 모델은 여전히 원래 첨부 파일을 받습니다.

프로바이더 인증은 표준 모델 인증 순서 (인증 프로필, `OPENAI_API_KEY`/`GROQ_API_KEY`/`GEMINI_API_KEY`와 같은 환경 변수 또는 `models.providers.*.apiKey`)를 따릅니다.

예제:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

`agents.defaults.subagents`는 서브 에이전트 기본값을 구성합니다:

- `model`: 생성된 서브 에이전트의 기본 모델 (문자열 또는 `{ primary, fallbacks }`). 생략된 경우 서브 에이전트는 에이전트별 또는 호출별로 재정의되지 않는 한 호출자의 모델을 상속합니다.
- `maxConcurrent`: 최대 동시 서브 에이전트 실행 (기본값 1)
- `archiveAfterMinutes`: N분 후 서브 에이전트 세션 자동 아카이브 (기본값 60; 비활성화하려면 `0` 설정)
- 서브 에이전트별 도구 정책: `tools.subagents.tools.allow` / `tools.subagents.tools.deny` (deny가 우선)

`tools.profile`은 `tools.allow`/`tools.deny` 전에 **기본 도구 허용 목록**을 설정합니다:

- `minimal`: `session_status`만
- `coding`: `group:fs`, `group:runtime`, `group:sessions`, `group:memory`, `image`
- `messaging`: `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`
- `full`: 제한 없음 (설정 안 함과 동일)

에이전트별 재정의: `agents.list[].tools.profile`.

예제 (기본적으로 메시징 전용, Slack + Discord 도구도 허용):

```json5
{
  tools: {
    profile: "messaging",
    allow: ["slack", "discord"],
  },
}
```

예제 (코딩 프로필, 하지만 모든 곳에서 exec/process 거부):

```json5
{
  tools: {
    profile: "coding",
    deny: ["group:runtime"],
  },
}
```

`tools.byProvider`를 사용하면 특정 프로바이더 (또는 단일 `provider/model`)에 대한 도구를 **추가 제한**할 수 있습니다.
에이전트별 재정의: `agents.list[].tools.byProvider`.

순서: 기본 프로필 → 프로바이더 프로필 → allow/deny 정책.
프로바이더 키는 `provider` (예: `google-antigravity`) 또는 `provider/model`
(예: `openai/gpt-5.2`)을 허용합니다.

예제 (글로벌 코딩 프로필 유지, 하지만 Google Antigravity의 경우 최소 도구):

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```

예제 (프로바이더/모델별 허용 목록):

```json5
{
  tools: {
    allow: ["group:fs", "group:runtime", "sessions_list"],
    byProvider: {
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

`tools.allow` / `tools.deny`는 글로벌 도구 허용/거부 정책을 구성합니다 (deny가 우선).
일치는 대소문자를 구분하지 않으며 `*` 와일드카드를 지원합니다 (`"*"`는 모든 도구를 의미).
이는 Docker 샌드박스가 **꺼진** 경우에도 적용됩니다.

예제 (모든 곳에서 브라우저/캔버스 비활성화):

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

도구 그룹 (단축키)은 **글로벌** 및 **에이전트별** 도구 정책에서 작동합니다:

- `group:runtime`: `exec`, `bash`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: 모든 내장 OpenClaw 도구 (프로바이더 플러그인 제외)

`tools.elevated`는 승격된 (호스트) exec 액세스를 제어합니다:

- `enabled`: 승격된 모드 허용 (기본값 true)
- `allowFrom`: 채널별 허용 목록 (비어 있음 = 비활성화됨)
  - `whatsapp`: E.164 번호
  - `telegram`: 채팅 ID 또는 사용자 이름
  - `discord`: 사용자 ID 또는 사용자 이름 (생략된 경우 `channels.discord.dm.allowFrom`으로 폴백)
  - `signal`: E.164 번호
  - `imessage`: 핸들/채팅 ID
  - `webchat`: 세션 ID 또는 사용자 이름

예제:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["steipete", "1234567890123"],
      },
    },
  },
}
```

에이전트별 재정의 (추가 제한):

```json5
{
  agents: {
    list: [
      {
        id: "family",
        tools: {
          elevated: { enabled: false },
        },
      },
    ],
  },
}
```

참고:

- `tools.elevated`는 글로벌 베이스라인입니다. `agents.list[].tools.elevated`는 추가로만 제한할 수 있습니다 (둘 다 허용해야 함).
- `/elevated on|off|ask|full`은 세션 키별로 상태를 저장합니다; 인라인 지시문은 단일 메시지에 적용됩니다.
- 승격된 `exec`는 호스트에서 실행되며 샌드박싱을 우회합니다.
- 도구 정책은 여전히 적용됩니다; `exec`가 거부된 경우 승격을 사용할 수 없습니다.

`agents.defaults.maxConcurrent`는 세션 전체에서 병렬로 실행할 수 있는 임베디드 에이전트 실행의 최대 수를 설정합니다. 각 세션은 여전히 직렬화됩니다 (한 번에 세션 키당 하나의 실행). 기본값: 1.

### `agents.defaults.sandbox`

임베디드 에이전트에 대한 선택적 **Docker 샌드박싱**입니다. 비메인
세션이 호스트 시스템에 액세스할 수 없도록 하기 위한 것입니다.

세부사항: [샌드박싱](/gateway/sandboxing)

기본값 (활성화된 경우):

- scope: `"agent"` (에이전트당 하나의 컨테이너 + 워크스페이스)
- Debian bookworm-slim 기반 이미지
- 에이전트 워크스페이스 액세스: `workspaceAccess: "none"` (기본값)
  - `"none"`: `~/.openclaw/sandboxes` 아래의 범위별 샌드박스 워크스페이스 사용
- `"ro"`: 샌드박스 워크스페이스를 `/workspace`에 유지하고, 에이전트 워크스페이스를 `/agent`에 읽기 전용으로 마운트 (`write`/`edit`/`apply_patch` 비활성화)
  - `"rw"`: 에이전트 워크스페이스를 `/workspace`에 읽기/쓰기로 마운트
- 자동 정리: 유휴 > 24h 또는 연령 > 7d
- 도구 정책: `exec`, `process`, `read`, `write`, `edit`, `apply_patch`, `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`만 허용 (deny가 우선)
  - `tools.sandbox.tools`를 통해 구성, 에이전트별로 `agents.list[].tools.sandbox.tools`를 통해 재정의
  - 샌드박스 정책에서 지원되는 도구 그룹 단축키: `group:runtime`, `group:fs`, `group:sessions`, `group:memory` ([샌드박스 vs 도구 정책 vs 승격](/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) 참조)
- 선택적 샌드박스 브라우저 (Chromium + CDP, noVNC 관찰자)
- 강화 노브: `network`, `user`, `pidsLimit`, `memory`, `cpus`, `ulimits`, `seccompProfile`, `apparmorProfile`

경고: `scope: "shared"`는 공유 컨테이너와 공유 워크스페이스를 의미합니다. 세션 간
격리 없음. 세션별 격리를 위해서는 `scope: "session"`을 사용하세요.

레거시: `perSession`은 여전히 지원됩니다 (`true` → `scope: "session"`,
`false` → `scope: "shared"`).

`setupCommand`는 컨테이너가 생성된 후 **한 번** 실행됩니다 (컨테이너 내부에서 `sh -lc`를 통해).
패키지 설치의 경우 네트워크 egress, 쓰기 가능한 루트 FS 및 루트 사용자를 확인하세요.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared (기본값 agent)
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          // 에이전트별 재정의 (다중 에이전트): agents.list[].sandbox.docker.*
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/var/run/docker.sock:/var/run/docker.sock", "/home/user/source:/source:rw"],
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          containerPrefix: "openclaw-sbx-browser-",
          cdpPort: 9222,
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          allowedControlUrls: ["http://10.0.0.42:18791"],
          allowedControlHosts: ["browser.lab.local", "10.0.0.42"],
          allowedControlPorts: [18791],
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24, // 0은 유휴 정리 비활성화
          maxAgeDays: 7, // 0은 최대 연령 정리 비활성화
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

다음으로 기본 샌드박스 이미지를 한 번 빌드하세요:

```bash
scripts/sandbox-setup.sh
```

참고: 샌드박스 컨테이너는 기본적으로 `network: "none"`입니다; 에이전트가 아웃바운드 액세스가 필요한 경우 `agents.defaults.sandbox.docker.network`를
`"bridge"` (또는 사용자 정의 네트워크)로 설정하세요.

참고: 인바운드 첨부 파일은 `media/inbound/*`의 활성 워크스페이스에 스테이징됩니다. `workspaceAccess: "rw"`를 사용하면 파일이 에이전트 워크스페이스에 작성됩니다.

참고: `docker.binds`는 추가 호스트 디렉토리를 마운트합니다; 글로벌 및 에이전트별 바인드가 병합됩니다.

다음으로 선택적 브라우저 이미지를 빌드하세요:

```bash
scripts/sandbox-browser-setup.sh
```

`agents.defaults.sandbox.browser.enabled=true`인 경우 브라우저 도구는 샌드박스
Chromium 인스턴스 (CDP)를 사용합니다. noVNC가 활성화된 경우 (headless=false인 경우 기본값),
noVNC URL이 시스템 프롬프트에 주입되어 에이전트가 참조할 수 있습니다.
이는 메인 설정에 `browser.enabled`가 필요하지 않습니다; 샌드박스 제어
URL은 세션별로 주입됩니다.

`agents.defaults.sandbox.browser.allowHostControl` (기본값: false)은
샌드박스 세션이 브라우저 도구 (`target: "host"`)를 통해 **호스트** 브라우저 제어 서버를
명시적으로 대상으로 지정할 수 있도록 합니다. 엄격한 샌드박스 격리를 원하는 경우 이를 끄세요.

원격 제어 허용 목록:

- `allowedControlUrls`: `target: "custom"`에 허용되는 정확한 제어 URL.
- `allowedControlHosts`: 허용되는 호스트 이름 (호스트 이름만, 포트 없음).
- `allowedControlPorts`: 허용되는 포트 (기본값: http=80, https=443).
  기본값: 모든 허용 목록이 설정되지 않음 (제한 없음). `allowHostControl`은 기본적으로 false입니다.

### `models` (사용자 정의 프로바이더 + 기본 URL)

OpenClaw는 **pi-coding-agent** 모델 카탈로그를 사용합니다. 사용자 정의 프로바이더
(LiteLLM, 로컬 OpenAI 호환 서버, Anthropic 프록시 등)를 작성하여 추가할 수 있습니다
`~/.openclaw/agents/<agentId>/agent/models.json` 또는 `models.providers` 아래의 OpenClaw 설정 내부에 동일한 스키마를 정의하여.
프로바이더별 개요 + 예제: [/concepts/model-providers](/concepts/model-providers).

`models.providers`가 있는 경우 OpenClaw는 시작 시 `~/.openclaw/agents/<agentId>/agent/`에 `models.json`을 작성/병합합니다:

- 기본 동작: **병합** (기존 프로바이더 유지, 이름으로 재정의)
- `models.mode: "replace"`로 설정하여 파일 내용을 덮어씁니다

`agents.defaults.model.primary` (프로바이더/모델)를 통해 모델을 선택하세요.

```json5
{
  agents: {
    defaults: {
      model: { primary: "custom-proxy/llama-3.1-8b" },
      models: {
        "custom-proxy/llama-3.1-8b": {},
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions",
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

### OpenCode Zen (다중 모델 프록시)

OpenCode Zen은 모델별 엔드포인트가 있는 다중 모델 게이트웨이입니다. OpenClaw는
pi-ai의 내장 `opencode` 프로바이더를 사용합니다; https://opencode.ai/auth에서 `OPENCODE_API_KEY` (또는
`OPENCODE_ZEN_API_KEY`)를 설정하세요.

참고:

- 모델 참조는 `opencode/<modelId>` (예: `opencode/claude-opus-4-5`)를 사용합니다.
- `agents.defaults.models`를 통해 허용 목록을 활성화하는 경우 사용할 계획인 각 모델을 추가하세요.
- 단축키: `openclaw onboard --auth-choice opencode-zen`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-5" },
      models: { "opencode/claude-opus-4-5": { alias: "Opus" } },
    },
  },
}
```

### Z.AI (GLM-4.7) — 프로바이더 별칭 지원

Z.AI 모델은 내장 `zai` 프로바이더를 통해 사용할 수 있습니다. 환경에 `ZAI_API_KEY`를
설정하고 프로바이더/모델로 모델을 참조하세요.

단축키: `openclaw onboard --auth-choice zai-api-key`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

참고:

- `z.ai/*` 및 `z-ai/*`는 허용되는 별칭이며 `zai/*`로 정규화됩니다.
- `ZAI_API_KEY`가 누락된 경우 `zai/*`에 대한 요청은 런타임에 인증 오류로 실패합니다.
- 예제 오류: `프로바이더 "zai"에 대한 API 키를 찾을 수 없습니다.`
- Z.AI의 일반 API 엔드포인트는 `https://api.z.ai/api/paas/v4`입니다. GLM 코딩
  요청은 전용 Coding 엔드포인트 `https://api.z.ai/api/coding/paas/v4`를 사용합니다.
  내장 `zai` 프로바이더는 Coding 엔드포인트를 사용합니다. 일반 엔드포인트가 필요한 경우
  기본 URL 재정의를 사용하여 `models.providers`에 사용자 정의 프로바이더를 정의하세요
  (위의 사용자 정의 프로바이더 섹션 참조).
- 문서/설정에서 가짜 플레이스홀더를 사용하세요; 실제 API 키를 커밋하지 마세요.

### Moonshot AI (Kimi)

Moonshot의 OpenAI 호환 엔드포인트를 사용하세요:

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

참고:

- 환경에 `MOONSHOT_API_KEY`를 설정하거나 `openclaw onboard --auth-choice moonshot-api-key`를 사용하세요.
- 모델 참조: `moonshot/kimi-k2.5`.
- 중국 엔드포인트가 필요한 경우 `https://api.moonshot.cn/v1`을 사용하세요.

### Kimi Coding

Moonshot AI의 Kimi Coding 엔드포인트 (Anthropic 호환, 내장 프로바이더)를 사용하세요:

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: { "kimi-coding/k2p5": { alias: "Kimi K2.5" } },
    },
  },
}
```

참고:

- 환경에 `KIMI_API_KEY`를 설정하거나 `openclaw onboard --auth-choice kimi-code-api-key`를 사용하세요.
- 모델 참조: `kimi-coding/k2p5`.

### Synthetic (Anthropic 호환)

Synthetic의 Anthropic 호환 엔드포인트를 사용하세요:

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.1" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.1": { alias: "MiniMax M2.1" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.1",
            name: "MiniMax M2.1",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

참고:

- `SYNTHETIC_API_KEY`를 설정하거나 `openclaw onboard --auth-choice synthetic-api-key`를 사용하세요.
- 모델 참조: `synthetic/hf:MiniMaxAI/MiniMax-M2.1`.
- Anthropic 클라이언트가 추가하므로 기본 URL은 `/v1`을 생략해야 합니다.

### 로컬 모델 (LM Studio) — 권장 설정

현재 로컬 지침은 [/gateway/local-models](/gateway/local-models)를 참조하세요. 요약: 심각한 하드웨어에서 LM Studio Responses API를 통해 MiniMax M2.1을 실행하세요; 폴백을 위해 호스팅된 모델을 병합하여 유지하세요.

### MiniMax M2.1

LM Studio 없이 MiniMax M2.1을 직접 사용하세요:

```json5
{
  agent: {
    model: { primary: "minimax/MiniMax-M2.1" },
    models: {
      "anthropic/claude-opus-4-5": { alias: "Opus" },
      "minimax/MiniMax-M2.1": { alias: "Minimax" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.1",
            name: "MiniMax M2.1",
            reasoning: false,
            input: ["text"],
            // 가격: 정확한 비용 추적이 필요한 경우 models.json에서 업데이트하세요.
            cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

참고:

- `MINIMAX_API_KEY` 환경 변수를 설정하거나 `openclaw onboard --auth-choice minimax-api`를 사용하세요.
- 사용 가능한 모델: `MiniMax-M2.1` (기본값).
- 정확한 비용 추적이 필요한 경우 `models.json`에서 가격을 업데이트하세요.

### Cerebras (GLM 4.6 / 4.7)

OpenAI 호환 엔드포인트를 통해 Cerebras를 사용하세요:

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

참고:

- Cerebras의 경우 `cerebras/zai-glm-4.7`을 사용하세요; Z.AI 직접의 경우 `zai/glm-4.7`을 사용하세요.
- 환경 또는 설정에 `CEREBRAS_API_KEY`를 설정하세요.

참고:

- 지원되는 API: `openai-completions`, `openai-responses`, `anthropic-messages`,
  `google-generative-ai`
- 사용자 정의 인증 요구에 대해 `authHeader: true` + `headers`를 사용하세요.
- `models.json`를 다른 곳에 저장하려면 (기본값: `~/.openclaw/agents/main/agent`) `OPENCLAW_AGENT_DIR` (또는 `PI_CODING_AGENT_DIR`)로 에이전트 설정 루트를 재정의하세요.

### `session`

세션 범위 지정, 재설정 정책, 재설정 트리거 및 세션 저장소가 작성되는 위치를 제어합니다.

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main",
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      dm: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    // 기본값은 이미 ~/.openclaw/agents/<agentId>/sessions/sessions.json 아래의 에이전트별입니다
    // {agentId} 템플릿으로 재정의할 수 있습니다:
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    // 다이렉트 채팅은 agent:<agentId>:<mainKey> (기본값: "main")로 축소됩니다.
    mainKey: "main",
    agentToAgent: {
      // 요청자/대상 간 최대 핑퐁 응답 턴 (0–5).
      maxPingPongTurns: 5,
    },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

필드:

- `mainKey`: 다이렉트 채팅 버킷 키 (기본값: `"main"`). `agentId`를 변경하지 않고 기본 DM 스레드를 "이름 변경"하려는 경우 유용합니다.
  - 샌드박스 참고사항: `agents.defaults.sandbox.mode: "non-main"`은 이 키를 사용하여 메인 세션을 감지합니다. `mainKey`와 일치하지 않는 세션 키 (그룹/채널)는 샌드박스됩니다.
- `dmScope`: DM 세션이 그룹화되는 방법 (기본값: `"main"`).
  - `main`: 모든 DM이 연속성을 위해 메인 세션을 공유합니다.
  - `per-peer`: 채널 전체에서 발신자 ID별로 DM을 격리합니다.
  - `per-channel-peer`: 채널 + 발신자별로 DM을 격리합니다 (다중 사용자 받은편지함에 권장됨).
  - `per-account-channel-peer`: 계정 + 채널 + 발신자별로 DM을 격리합니다 (다중 계정 받은편지함에 권장됨).
- `identityLinks`: `per-peer`, `per-channel-peer` 또는 `per-account-channel-peer`를 사용할 때 동일한 사람이 채널 전체에서 DM 세션을 공유하도록 표준 ID를 프로바이더 접두사 피어에 매핑합니다.
  - 예제: `alice: ["telegram:123456789", "discord:987654321012345678"]`.
- `reset`: 기본 재설정 정책. 기본값은 게이트웨이 호스트의 로컬 시간 오전 4:00에 매일 재설정됩니다.
  - `mode`: `daily` 또는 `idle` (기본값: `reset`이 있는 경우 `daily`).
  - `atHour`: 매일 재설정 경계를 위한 로컬 시간 (0-23).
  - `idleMinutes`: 분 단위의 슬라이딩 유휴 창. 매일 + 유휴가 모두 구성된 경우 먼저 만료되는 것이 우선합니다.
- `resetByType`: `dm`, `group` 및 `thread`에 대한 세션별 재정의.
  - `reset`/`resetByType` 없이 레거시 `session.idleMinutes`만 설정하는 경우 OpenClaw는 이전 버전과의 호환성을 위해 유휴 전용 모드로 유지됩니다.
- `heartbeatIdleMinutes`: 하트비트 확인을 위한 선택적 유휴 재정의 (매일 재설정은 활성화된 경우 여전히 적용됨).
- `agentToAgent.maxPingPongTurns`: 요청자/대상 간 최대 응답 턴 (0–5, 기본값 5).
- `sendPolicy.default`: 규칙이 일치하지 않을 때 `allow` 또는 `deny` 폴백.
- `sendPolicy.rules[]`: `channel`, `chatType` (`direct|group|room`) 또는 `keyPrefix` (예: `cron:`)로 일치. 첫 번째 deny가 우선; 그렇지 않으면 allow.

### `skills` (스킬 설정)

번들 허용 목록, 설치 기본 설정, 추가 스킬 폴더 및 스킬별
재정의를 제어합니다. **번들** 스킬 및 `~/.openclaw/skills`에 적용됩니다 (워크스페이스 스킬은
이름 충돌 시 여전히 우선).

필드:

- `allowBundled`: **번들** 스킬에만 해당하는 선택적 허용 목록. 설정된 경우 해당
  번들 스킬만 적격입니다 (관리/워크스페이스 스킬은 영향 없음).
- `load.extraDirs`: 스캔할 추가 스킬 디렉토리 (우선 순위가 가장 낮음).
- `install.preferBrew`: 사용 가능한 경우 brew 설치 프로그램을 선호합니다 (기본값: true).
- `install.nodeManager`: 노드 설치 프로그램 기본 설정 (`npm` | `pnpm` | `yarn`, 기본값: npm).
- `entries.<skillKey>`: 스킬별 설정 재정의.

스킬별 필드:

- `enabled`: 번들/설치된 경우에도 스킬을 비활성화하려면 `false`로 설정합니다.
- `env`: 에이전트 실행을 위해 주입된 환경 변수 (아직 설정되지 않은 경우에만).
- `apiKey`: 기본 환경 변수를 선언하는 스킬에 대한 선택적 편의 (예: `nano-banana-pro` → `GEMINI_API_KEY`).

예제:

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
    },
    entries: {
      "nano-banana-pro": {
        apiKey: "GEMINI_KEY_HERE",
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

### `plugins` (확장)

플러그인 디스커버리, 허용/거부 및 플러그인별 설정을 제어합니다. 플러그인은
`~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` 및 모든
`plugins.load.paths` 항목에서 로드됩니다. **설정 변경은 게이트웨이 재시작이 필요합니다.**
전체 사용법은 [/plugin](/plugin)을 참조하세요.

필드:

- `enabled`: 플러그인 로딩을 위한 마스터 토글 (기본값: true).
- `allow`: 플러그인 ID의 선택적 허용 목록; 설정된 경우 나열된 플러그인만 로드됩니다.
- `deny`: 플러그인 ID의 선택적 거부 목록 (deny가 우선).
- `load.paths`: 로드할 추가 플러그인 파일 또는 디렉토리 (절대 경로 또는 `~`).
- `entries.<pluginId>`: 플러그인별 재정의.
  - `enabled`: 비활성화하려면 `false`로 설정합니다.
  - `config`: 플러그인별 설정 객체 (제공된 경우 플러그인에 의해 검증됨).

예제:

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

### `browser` (openclaw 관리 브라우저)

OpenClaw는 openclaw를 위한 **전용 격리** Chrome/Brave/Edge/Chromium 인스턴스를 시작하고 작은 루프백 제어 서비스를 노출할 수 있습니다.
프로필은 `profiles.<name>.cdpUrl`을 통해 **원격** Chromium 기반 브라우저를 가리킬 수 있습니다. 원격
프로필은 연결 전용입니다 (시작/중지/재설정 비활성화).

`browser.cdpUrl`은 레거시 단일 프로필 설정과 `cdpPort`만 설정하는 프로필의 기본
스키마/호스트로 유지됩니다.

기본값:

- enabled: `true`
- evaluateEnabled: `true` (`act:evaluate` 및 `wait --fn` 비활성화하려면 `false`로 설정)
- 제어 서비스: 루프백만 (`gateway.port`에서 파생된 포트, 기본값 `18791`)
- CDP URL: `http://127.0.0.1:18792` (제어 서비스 + 1, 레거시 단일 프로필)
- 프로필 색상: `#FF4500` (lobster-orange)
- 참고: 제어 서버는 실행 중인 게이트웨이 (OpenClaw.app 메뉴 바 또는 `openclaw gateway`)에 의해 시작됩니다.
- 자동 감지 순서: Chromium 기반인 경우 기본 브라우저; 그렇지 않으면 Chrome → Brave → Edge → Chromium → Chrome Canary.

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    // cdpUrl: "http://127.0.0.1:18792", // 레거시 단일 프로필 재정의
    defaultProfile: "chrome",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // 고급:
    // headless: false,
    // noSandbox: false,
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false, // 원격 CDP를 localhost로 터널링할 때 true로 설정
  },
}
```

### `ui` (외관)

네이티브 앱의 UI chrome (예: Talk 모드 버블 틴트)에 사용되는 선택적 강조 색상입니다.

설정되지 않은 경우 클라이언트는 흐릿한 연한 파란색으로 폴백됩니다.

```json5
{
  ui: {
    seamColor: "#FF4500", // hex (RRGGBB 또는 #RRGGBB)
    // 선택적: 제어 UI 어시스턴트 정체성 재정의.
    // 설정되지 않은 경우 제어 UI는 활성 에이전트 정체성 (설정 또는 IDENTITY.md)을 사용합니다.
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // 이모지, 짧은 텍스트 또는 이미지 URL/data URI
    },
  },
}
```

### `gateway` (게이트웨이 서버 모드 + 바인드)

`gateway.mode`를 사용하여 이 머신이 게이트웨이를 실행해야 하는지 명시적으로 선언하세요.

기본값:

- mode: **설정 안 됨** ("자동 시작 안 함"으로 처리됨)
- bind: `loopback`
- port: `18789` (WS + HTTP용 단일 포트)

```json5
{
  gateway: {
    mode: "local", // 또는 "remote"
    port: 18789, // WS + HTTP 멀티플렉스
    bind: "loopback",
    // controlUi: { enabled: true, basePath: "/openclaw" }
    // auth: { mode: "token", token: "your-token" } // 토큰이 WS + 제어 UI 액세스를 게이트
    // tailscale: { mode: "off" | "serve" | "funnel" }
  },
}
```

제어 UI 기본 경로:

- `gateway.controlUi.basePath`는 제어 UI가 제공되는 URL 접두사를 설정합니다.
- 예제: `"/ui"`, `"/openclaw"`, `"/apps/openclaw"`.
- 기본값: 루트 (`/`) (변경되지 않음).
- `gateway.controlUi.root`는 제어 UI 자산의 파일 시스템 루트를 설정합니다 (기본값: `dist/control-ui`).
- `gateway.controlUi.allowInsecureAuth`는 장치 정체성이 생략된 경우
  제어 UI에 대한 토큰 전용 인증을 허용합니다 (일반적으로 HTTP를 통해). 기본값: `false`. HTTPS
  (Tailscale Serve) 또는 `127.0.0.1`을 선호하세요.
- `gateway.controlUi.dangerouslyDisableDeviceAuth`는 제어 UI에 대한 장치 정체성 확인을 비활성화합니다
  (토큰/비밀번호만). 기본값: `false`. 긴급 상황에만.

관련 문서:

- [제어 UI](/web/control-ui)
- [웹 개요](/web)
- [Tailscale](/gateway/tailscale)
- [원격 액세스](/gateway/remote)

신뢰할 수 있는 프록시:

- `gateway.trustedProxies`: 게이트웨이 앞에서 TLS를 종료하는 역방향 프록시 IP 목록.
- 이러한 IP 중 하나에서 연결이 오면 OpenClaw는 `x-forwarded-for` (또는 `x-real-ip`)를 사용하여 로컬 페어링 확인 및 HTTP 인증/로컬 확인을 위한 클라이언트 IP를 결정합니다.
- 완전히 제어하는 프록시만 나열하고, 들어오는 `x-forwarded-for`를 **덮어쓰는지** 확인하세요.

참고:

- `openclaw gateway`는 `gateway.mode`가 `local`로 설정되지 않는 한 (또는 재정의 플래그를 전달하지 않는 한) 시작을 거부합니다.
- `gateway.port`는 WebSocket + HTTP (제어 UI, 훅, A2UI)에 사용되는 단일 멀티플렉스 포트를 제어합니다.
- OpenAI Chat Completions 엔드포인트: **기본적으로 비활성화됨**; `gateway.http.endpoints.chatCompletions.enabled: true`로 활성화하세요.
- 우선 순위: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > 기본값 `18789`.
- 게이트웨이 인증은 기본적으로 필요합니다 (토큰/비밀번호 또는 Tailscale Serve 정체성). 비루프백 바인드는 공유 토큰/비밀번호가 필요합니다.
- 온보딩 마법사는 기본적으로 게이트웨이 토큰을 생성합니다 (루프백에서도).
- `gateway.remote.token`은 **원격 CLI 호출에만** 사용됩니다; 로컬 게이트웨이 인증을 활성화하지 않습니다. `gateway.token`은 무시됩니다.

인증 및 Tailscale:

- `gateway.auth.mode`는 핸드셰이크 요구 사항 (`token` 또는 `password`)을 설정합니다. 설정되지 않은 경우 토큰 인증이 가정됩니다.
- `gateway.auth.token`은 토큰 인증을 위한 공유 토큰을 저장합니다 (동일한 머신의 CLI에서 사용됨).
- `gateway.auth.mode`가 설정된 경우 해당 방법만 허용됩니다 (선택적 Tailscale 헤더 포함).
- `gateway.auth.password`는 여기에 설정하거나 `OPENCLAW_GATEWAY_PASSWORD` (권장)를 통해 설정할 수 있습니다.
- `gateway.auth.allowTailscale`은 Tailscale Serve 정체성 헤더
  (`tailscale-user-login`)가 `x-forwarded-for`, `x-forwarded-proto` 및 `x-forwarded-host`를 사용하여 루프백에 도착할 때 인증을 충족할 수 있도록 합니다. OpenClaw는
  수락하기 전에 `tailscale whois`를 통해 `x-forwarded-for` 주소를 해석하여 정체성을 확인합니다. `true`인 경우 Serve 요청은
  토큰/비밀번호가 필요하지 않습니다; 명시적 자격 증명을 요구하려면 `false`로 설정하세요. 기본값은
  `tailscale.mode = "serve"`이고 인증 모드가 `password`가 아닌 경우 `true`입니다.
- `gateway.tailscale.mode: "serve"`는 Tailscale Serve를 사용합니다 (tailnet만, 루프백 바인드).
- `gateway.tailscale.mode: "funnel"`은 대시보드를 공개적으로 노출합니다; 인증이 필요합니다.
- `gateway.tailscale.resetOnExit`는 종료 시 Serve/Funnel 설정을 재설정합니다.

원격 클라이언트 기본값 (CLI):

- `gateway.remote.url`은 `gateway.mode = "remote"`일 때 CLI 호출의 기본 게이트웨이 WebSocket URL을 설정합니다.
- `gateway.remote.transport`는 macOS 원격 전송 (`ssh` 기본값, ws/wss의 경우 `direct`)을 선택합니다. `direct`인 경우 `gateway.remote.url`은 `ws://` 또는 `wss://`여야 합니다. `ws://host`는 기본적으로 포트 `18789`입니다.
- `gateway.remote.token`은 원격 호출을 위한 토큰을 제공합니다 (인증 없음의 경우 설정 안 함).
- `gateway.remote.password`는 원격 호출을 위한 비밀번호를 제공합니다 (인증 없음의 경우 설정 안 함).

macOS 앱 동작:

- OpenClaw.app은 `~/.openclaw/openclaw.json`을 감시하고 `gateway.mode` 또는 `gateway.remote.url`이 변경되면 라이브로 모드를 전환합니다.
- `gateway.mode`가 설정되지 않았지만 `gateway.remote.url`이 설정된 경우 macOS 앱은 원격 모드로 처리합니다.
- macOS 앱에서 연결 모드를 변경하면 `gateway.mode` (및 원격 모드에서 `gateway.remote.url` + `gateway.remote.transport`)를 설정 파일에 다시 작성합니다.

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://gateway.tailnet:18789",
      token: "your-token",
      password: "your-password",
    },
  },
}
```

직접 전송 예제 (macOS 앱):

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "wss://gateway.example.ts.net",
      token: "your-token",
    },
  },
}
```

### `gateway.reload` (설정 핫 리로드)

게이트웨이는 `~/.openclaw/openclaw.json` (또는 `OPENCLAW_CONFIG_PATH`)을 감시하고 변경 사항을 자동으로 적용합니다.

모드:

- `hybrid` (기본값): 안전한 변경 사항을 핫 적용; 중요한 변경 사항에 대해 게이트웨이 재시작.
- `hot`: 핫 안전 변경 사항만 적용; 재시작이 필요한 경우 로그.
- `restart`: 모든 설정 변경 시 게이트웨이 재시작.
- `off`: 핫 리로드 비활성화.

```json5
{
  gateway: {
    reload: {
      mode: "hybrid",
      debounceMs: 300,
    },
  },
}
```

#### 핫 리로드 매트릭스 (파일 + 영향)

감시되는 파일:

- `~/.openclaw/openclaw.json` (또는 `OPENCLAW_CONFIG_PATH`)

핫 적용됨 (전체 게이트웨이 재시작 없음):

- `hooks` (웹훅 인증/경로/매핑) + `hooks.gmail` (Gmail 감시자 재시작)
- `browser` (브라우저 제어 서버 재시작)
- `cron` (cron 서비스 재시작 + 동시성 업데이트)
- `agents.defaults.heartbeat` (하트비트 러너 재시작)
- `web` (WhatsApp 웹 채널 재시작)
- `telegram`, `discord`, `signal`, `imessage` (채널 재시작)
- `agent`, `models`, `routing`, `messages`, `session`, `whatsapp`, `logging`, `skills`, `ui`, `talk`, `identity`, `wizard` (동적 읽기)

전체 게이트웨이 재시작 필요:

- `gateway` (포트/바인드/인증/제어 UI/tailscale)
- `bridge` (레거시)
- `discovery`
- `canvasHost`
- `plugins`
- 알 수 없거나 지원되지 않는 설정 경로 (안전을 위해 기본적으로 재시작)

### 다중 인스턴스 격리

하나의 호스트에서 여러 게이트웨이를 실행하려면 (중복성 또는 구조 봇을 위해) 인스턴스별 상태 + 설정을 격리하고 고유한 포트를 사용하세요:

- `OPENCLAW_CONFIG_PATH` (인스턴스별 설정)
- `OPENCLAW_STATE_DIR` (세션/자격 증명)
- `agents.defaults.workspace` (메모리)
- `gateway.port` (인스턴스별 고유)

편의 플래그 (CLI):

- `openclaw --dev …` → `~/.openclaw-dev` 사용 + 기본 `19001`에서 포트 이동
- `openclaw --profile <name> …` → `~/.openclaw-<name>` 사용 (설정/환경/플래그를 통한 포트)

파생된 포트 매핑 (게이트웨이/브라우저/캔버스)은 [게이트웨이 런북](/gateway)을 참조하세요.
브라우저/CDP 포트 격리 세부사항은 [여러 게이트웨이](/gateway/multiple-gateways)를 참조하세요.

예제:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

### `hooks` (게이트웨이 웹훅)

게이트웨이 HTTP 서버에서 간단한 HTTP 웹훅 엔드포인트를 활성화합니다.

기본값:

- enabled: `false`
- path: `/hooks`
- maxBodyBytes: `262144` (256 KB)

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.2-mini",
      },
    ],
  },
}
```

요청에는 훅 토큰이 포함되어야 합니다:

- `Authorization: Bearer <token>` **또는**
- `x-openclaw-token: <token>` **또는**
- `?token=<token>`

엔드포인트:

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
- `POST /hooks/<name>` → `hooks.mappings`를 통해 해석됨

`/hooks/agent`는 항상 메인 세션에 요약을 게시합니다 (그리고 선택적으로 `wakeMode: "now"`를 통해 즉시 하트비트를 트리거할 수 있음).

매핑 참고사항:

- `match.path`는 `/hooks` 이후의 하위 경로와 일치합니다 (예: `/hooks/gmail` → `gmail`).
- `match.source`는 페이로드 필드와 일치합니다 (예: `{ source: "gmail" }`) 따라서 일반 `/hooks/ingest` 경로를 사용할 수 있습니다.
- `{{messages[0].subject}}`와 같은 템플릿은 페이로드에서 읽습니다.
- `transform`은 훅 작업을 반환하는 JS/TS 모듈을 가리킬 수 있습니다.
- `deliver: true`는 최종 응답을 채널로 전송합니다; `channel`은 기본적으로 `last`입니다 (WhatsApp으로 폴백).
- 이전 전달 경로가 없는 경우 `channel` + `to`를 명시적으로 설정하세요 (Telegram/Discord/Google Chat/Slack/Signal/iMessage/MS Teams에 필요).
- `model`은 이 훅 실행에 대한 LLM을 재정의합니다 (`provider/model` 또는 별칭; `agents.defaults.models`가 설정된 경우 허용되어야 함).

Gmail 도우미 설정 (`openclaw webhooks gmail setup` / `run`에서 사용):

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },

      // 선택적: Gmail 훅 처리에 더 저렴한 모델 사용
      // 인증/속도 제한/타임아웃 시 agents.defaults.model.fallbacks, 그 다음 primary로 폴백
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      // 선택적: Gmail 훅의 기본 사고 수준
      thinking: "off",
    },
  },
}
```

Gmail 훅을 위한 모델 재정의:

- `hooks.gmail.model`은 Gmail 훅 처리에 사용할 모델을 지정합니다 (기본값: 세션 기본).
- `agents.defaults.models`의 `provider/model` 참조 또는 별칭을 허용합니다.
- 인증/속도 제한/타임아웃 시 `agents.defaults.model.fallbacks`, 그 다음 `agents.defaults.model.primary`로 폴백합니다.
- `agents.defaults.models`가 설정된 경우 허용 목록에 훅 모델을 포함하세요.
- 시작 시 구성된 모델이 모델 카탈로그 또는 허용 목록에 없는 경우 경고합니다.
- `hooks.gmail.thinking`은 Gmail 훅의 기본 사고 수준을 설정하며 훅별 `thinking`에 의해 재정의됩니다.

게이트웨이 자동 시작:

- `hooks.enabled=true`이고 `hooks.gmail.account`가 설정된 경우 게이트웨이는
  부팅 시 `gog gmail watch serve`를 시작하고 감시를 자동 갱신합니다.
- 자동 시작을 비활성화하려면 (수동 실행의 경우) `OPENCLAW_SKIP_GMAIL_WATCHER=1`을 설정하세요.
- 게이트웨이와 함께 별도의 `gog gmail watch serve`를 실행하지 마세요; `listen tcp 127.0.0.1:8788: bind: address already in use`로 실패합니다.

참고: `tailscale.mode`가 켜져 있는 경우 OpenClaw는 `serve.path`를 `/`로 기본값을 설정하여
Tailscale이 `/gmail-pubsub`를 올바르게 프록시할 수 있도록 합니다 (설정 경로 접두사를 제거함).
백엔드가 접두사가 있는 경로를 받아야 하는 경우
`hooks.gmail.tailscale.target`을 전체 URL로 설정하세요 (그리고 `serve.path`를 정렬하세요).

### `canvasHost` (LAN/tailnet Canvas 파일 서버 + 라이브 리로드)

게이트웨이는 iOS/Android 노드가 단순히 `canvas.navigate`할 수 있도록 HTTP를 통해 HTML/CSS/JS 디렉토리를 제공합니다.

기본 루트: `~/.openclaw/workspace/canvas`  
기본 포트: `18793` (openclaw 브라우저 CDP 포트 `18792`를 피하기 위해 선택됨)  
서버는 **게이트웨이 바인드 호스트** (LAN 또는 Tailnet)에서 수신하여 노드가 도달할 수 있도록 합니다.

서버:

- `canvasHost.root` 아래의 파일 제공
- 제공되는 HTML에 작은 라이브 리로드 클라이언트 주입
- 디렉토리를 감시하고 `/__openclaw__/ws`의 WebSocket 엔드포인트를 통해 리로드 브로드캐스트
- 디렉토리가 비어 있을 때 시작 `index.html` 자동 생성 (즉시 무언가를 볼 수 있도록)
- 또한 `/__openclaw__/a2ui/`에서 A2UI를 제공하고 노드에 `canvasHostUrl`로 광고됩니다
  (항상 노드에서 Canvas/A2UI에 사용됨)

디렉토리가 크거나 `EMFILE`에 도달하는 경우 라이브 리로드 (및 파일 감시) 비활성화:

- 설정: `canvasHost: { liveReload: false }`

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    port: 18793,
    liveReload: true,
  },
}
```

`canvasHost.*`에 대한 변경 사항은 게이트웨이 재시작이 필요합니다 (설정 리로드는 재시작됨).

비활성화:

- 설정: `canvasHost: { enabled: false }`
- 환경: `OPENCLAW_SKIP_CANVAS_HOST=1`

### `bridge` (레거시 TCP 브리지, 제거됨)

현재 빌드에는 더 이상 TCP 브리지 리스너가 포함되지 않습니다; `bridge.*` 설정 키는 무시됩니다.
노드는 게이트웨이 WebSocket을 통해 연결합니다. 이 섹션은 역사적 참조를 위해 유지됩니다.

레거시 동작:

- 게이트웨이는 노드 (iOS/Android)를 위한 간단한 TCP 브리지를 노출할 수 있었으며, 일반적으로 포트 `18790`에 있었습니다.

기본값:

- enabled: `true`
- port: `18790`
- bind: `lan` (`0.0.0.0`에 바인드)

바인드 모드:

- `lan`: `0.0.0.0` (LAN/Wi‑Fi 및 Tailscale을 포함한 모든 인터페이스에서 도달 가능)
- `tailnet`: 머신의 Tailscale IP에만 바인드 (Vienna ⇄ London에 권장됨)
- `loopback`: `127.0.0.1` (로컬만)
- `auto`: tailnet IP가 있으면 선호, 그렇지 않으면 `lan`

TLS:

- `bridge.tls.enabled`: 브리지 연결에 대한 TLS 활성화 (활성화 시 TLS 전용).
- `bridge.tls.autoGenerate`: cert/key가 없을 때 자체 서명 cert 생성 (기본값: true).
- `bridge.tls.certPath` / `bridge.tls.keyPath`: 브리지 인증서 + 개인 키에 대한 PEM 경로.
- `bridge.tls.caPath`: 선택적 PEM CA 번들 (사용자 정의 루트 또는 미래 mTLS).

TLS가 활성화되면 게이트웨이는 디스커버리 TXT 레코드에 `bridgeTls=1` 및 `bridgeTlsSha256`을 광고하여
노드가 인증서를 고정할 수 있습니다. 수동 연결은 지문이 아직 저장되지 않은 경우 최초 사용 시 신뢰를 사용합니다.
자동 생성된 cert는 PATH에 `openssl`이 필요합니다; 생성이 실패하면 브리지가 시작되지 않습니다.

```json5
{
  bridge: {
    enabled: true,
    port: 18790,
    bind: "tailnet",
    tls: {
      enabled: true,
      // 생략 시 ~/.openclaw/bridge/tls/bridge-{cert,key}.pem 사용.
      // certPath: "~/.openclaw/bridge/tls/bridge-cert.pem",
      // keyPath: "~/.openclaw/bridge/tls/bridge-key.pem"
    },
  },
}
```

### `discovery.mdns` (Bonjour / mDNS 브로드캐스트 모드)

LAN mDNS 디스커버리 브로드캐스트 (`_openclaw-gw._tcp`)를 제어합니다.

- `minimal` (기본값): TXT 레코드에서 `cliPath` + `sshPort` 생략
- `full`: TXT 레코드에 `cliPath` + `sshPort` 포함
- `off`: mDNS 브로드캐스트 완전히 비활성화
- 호스트 이름: 기본값은 `openclaw`입니다 (`openclaw.local` 광고). `OPENCLAW_MDNS_HOSTNAME`으로 재정의하세요.

```json5
{
  discovery: { mdns: { mode: "minimal" } },
}
```

### `discovery.wideArea` (Wide-Area Bonjour / 유니캐스트 DNS‑SD)

활성화되면 게이트웨이는 구성된 디스커버리 도메인 (예: `openclaw.internal.`)을 사용하여 `~/.openclaw/dns/` 아래에 `_openclaw-gw._tcp`에 대한 유니캐스트 DNS-SD 영역을 작성합니다.

iOS/Android가 네트워크 전체에서 디스커버리하도록 하려면 (Vienna ⇄ London) 다음과 함께 짝을 이루세요:

- 선택한 도메인을 제공하는 게이트웨이 호스트의 DNS 서버 (CoreDNS 권장)
- Tailscale **분할 DNS**를 통해 클라이언트가 게이트웨이 DNS 서버를 통해 해당 도메인을 해석하도록

일회성 설정 도우미 (게이트웨이 호스트):

```bash
openclaw dns setup --apply
```

```json5
{
  discovery: { wideArea: { enabled: true } },
}
```

## 템플릿 변수

템플릿 플레이스홀더는 `tools.media.*.models[].args` 및 `tools.media.models[].args` (및 향후 템플릿 인수 필드)에서 확장됩니다.

| 변수               | 설명                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `{{Body}}`         | 전체 인바운드 메시지 본문                                                                                                 |
| `{{RawBody}}`      | 원시 인바운드 메시지 본문 (히스토리/발신자 래퍼 없음; 명령 파싱에 가장 적합)                                              |
| `{{BodyStripped}}` | 그룹 멘션이 제거된 본문 (에이전트에 가장 적합한 기본값)                                                                   |
| `{{From}}`         | 발신자 식별자 (WhatsApp의 경우 E.164; 채널별로 다를 수 있음)                                                              |
| `{{To}}`           | 대상 식별자                                                                                                               |
| `{{MessageSid}}`   | 채널 메시지 ID (사용 가능한 경우)                                                                                         |
| `{{SessionId}}`    | 현재 세션 UUID                                                                                                            |
| `{{IsNewSession}}` | 새 세션이 생성된 경우 `"true"`                                                                                            |
| `{{MediaUrl}}`     | 인바운드 미디어 의사 URL (있는 경우)                                                                                      |
| `{{MediaPath}}`    | 로컬 미디어 경로 (다운로드된 경우)                                                                                        |
| `{{MediaType}}`    | 미디어 유형 (이미지/오디오/문서/…)                                                                                        |
| `{{Transcript}}`   | 오디오 대본 (활성화된 경우)                                                                                               |
| `{{Prompt}}`       | CLI 항목에 대한 해석된 미디어 프롬프트                                                                                    |
| `{{MaxChars}}`     | CLI 항목에 대한 해석된 최대 출력 문자                                                                                     |
| `{{ChatType}}`     | `"direct"` 또는 `"group"`                                                                                                 |
| `{{GroupSubject}}` | 그룹 제목 (최선의 노력)                                                                                                   |
| `{{GroupMembers}}` | 그룹 멤버 미리보기 (최선의 노력)                                                                                          |
| `{{SenderName}}`   | 발신자 표시 이름 (최선의 노력)                                                                                            |
| `{{SenderE164}}`   | 발신자 전화번호 (최선의 노력)                                                                                             |
| `{{Provider}}`     | 프로바이더 힌트 (whatsapp \| telegram \| discord \| googlechat \| slack \| signal \| imessage \| msteams \| webchat \| …) |

## Cron (게이트웨이 스케줄러)

Cron은 웨이크업 및 예약된 작업을 위한 게이트웨이 소유 스케줄러입니다. 기능 개요 및 CLI 예제는 [Cron 작업](/automation/cron-jobs)을 참조하세요.

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
  },
}
```

---

_다음: [에이전트 런타임](/concepts/agent)_ 🦞

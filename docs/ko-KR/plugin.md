---
summary: "OpenClaw 플러그인/확장: 디스커버리, 설정, 안전성"
read_when:
  - 플러그인/확장을 추가하거나 수정할 때
  - 플러그인 설치 또는 로드 규칙을 문서화할 때
title: "플러그인"
---

# 플러그인 (확장)

## 빠른 시작 (플러그인이 처음이신가요?)

플러그인은 추가 기능(명령어, 도구, 게이트웨이 RPC)으로 OpenClaw를 확장하는 **작은 코드 모듈**입니다.

대부분의 경우, 아직 OpenClaw 코어에 내장되지 않은 기능이 필요하거나 선택적 기능을 메인 설치에서 분리하려는 경우 플러그인을 사용합니다.

빠른 경로:

1. 현재 로드된 플러그인 확인:

```bash
openclaw plugins list
```

2. 공식 플러그인 설치 (예: Voice Call):

```bash
openclaw plugins install @openclaw/voice-call
```

3. 게이트웨이를 재시작한 후 `plugins.entries.<id>.config`에서 설정합니다.

구체적인 플러그인 예제는 [Voice Call](/plugins/voice-call)을 참조하세요.

## 사용 가능한 플러그인 (공식)

- Microsoft Teams는 2026.1.15부터 플러그인 전용입니다. Teams를 사용하는 경우 `@openclaw/msteams`를 설치하세요.
- Memory (Core) — 번들 메모리 검색 플러그인 (기본적으로 `plugins.slots.memory`를 통해 활성화됨)
- Memory (LanceDB) — 번들 장기 메모리 플러그인 (자동 회상/캡처; `plugins.slots.memory = "memory-lancedb"` 설정)
- [Voice Call](/plugins/voice-call) — `@openclaw/voice-call`
- [Zalo Personal](/plugins/zalouser) — `@openclaw/zalouser`
- [Matrix](/channels/matrix) — `@openclaw/matrix`
- [Nostr](/channels/nostr) — `@openclaw/nostr`
- [Zalo](/channels/zalo) — `@openclaw/zalo`
- [Microsoft Teams](/channels/msteams) — `@openclaw/msteams`
- Google Antigravity OAuth (프로바이더 인증) — `google-antigravity-auth`로 번들됨 (기본적으로 비활성화)
- Gemini CLI OAuth (프로바이더 인증) — `google-gemini-cli-auth`로 번들됨 (기본적으로 비활성화)
- Qwen OAuth (프로바이더 인증) — `qwen-portal-auth`로 번들됨 (기본적으로 비활성화)
- Copilot Proxy (프로바이더 인증) — 로컬 VS Code Copilot Proxy 브리지; 내장 `github-copilot` 기기 로그인과는 별개 (번들됨, 기본적으로 비활성화)

OpenClaw 플러그인은 jiti를 통해 런타임에 로드되는 **TypeScript 모듈**입니다. **설정 검증은 플러그인 코드를 실행하지 않습니다**. 대신 플러그인 매니페스트와 JSON Schema를 사용합니다. [플러그인 매니페스트](/plugins/manifest)를 참조하세요.

플러그인은 다음을 등록할 수 있습니다:

- 게이트웨이 RPC 메서드
- 게이트웨이 HTTP 핸들러
- 에이전트 도구
- CLI 명령어
- 백그라운드 서비스
- 선택적 설정 검증
- **스킬** (플러그인 매니페스트에 `skills` 디렉토리를 나열)
- **자동 응답 명령어** (AI 에이전트를 호출하지 않고 실행)

플러그인은 게이트웨이와 **인-프로세스**로 실행되므로 신뢰할 수 있는 코드로 취급해야 합니다.
도구 작성 가이드: [플러그인 에이전트 도구](/plugins/agent-tools).

## 런타임 헬퍼

플러그인은 `api.runtime`을 통해 선택된 코어 헬퍼에 액세스할 수 있습니다. 텔레포니 TTS의 경우:

```ts
const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});
```

참고사항:

- 코어 `messages.tts` 설정 사용 (OpenAI 또는 ElevenLabs).
- PCM 오디오 버퍼 + 샘플 레이트를 반환합니다. 플러그인은 프로바이더에 맞게 리샘플링/인코딩해야 합니다.
- Edge TTS는 텔레포니에서 지원되지 않습니다.

## 디스커버리 & 우선순위

OpenClaw는 다음 순서로 스캔합니다:

1. 설정 경로

- `plugins.load.paths` (파일 또는 디렉토리)

2. 워크스페이스 확장

- `<workspace>/.openclaw/extensions/*.ts`
- `<workspace>/.openclaw/extensions/*/index.ts`

3. 글로벌 확장

- `~/.openclaw/extensions/*.ts`
- `~/.openclaw/extensions/*/index.ts`

4. 번들 확장 (OpenClaw와 함께 제공됨, **기본적으로 비활성화**)

- `<openclaw>/extensions/*`

번들 플러그인은 `plugins.entries.<id>.enabled` 또는 `openclaw plugins enable <id>`를 통해 명시적으로 활성화해야 합니다. 설치된 플러그인은 기본적으로 활성화되지만 동일한 방법으로 비활성화할 수 있습니다.

각 플러그인은 루트에 `openclaw.plugin.json` 파일을 포함해야 합니다. 경로가 파일을 가리키는 경우, 플러그인 루트는 파일의 디렉토리이며 매니페스트를 포함해야 합니다.

여러 플러그인이 동일한 id로 해석되는 경우, 위 순서에서 첫 번째 일치 항목이 우선하며 낮은 우선순위의 복사본은 무시됩니다.

### 패키지 팩

플러그인 디렉토리는 `openclaw.extensions`가 포함된 `package.json`을 포함할 수 있습니다:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"]
  }
}
```

각 항목은 플러그인이 됩니다. 팩이 여러 확장을 나열하는 경우, 플러그인 id는 `name/<fileBase>`가 됩니다.

플러그인이 npm 의존성을 가져오는 경우, 해당 디렉토리에 설치하여 `node_modules`를 사용할 수 있도록 하세요 (`npm install` / `pnpm install`).

### 채널 카탈로그 메타데이터

채널 플러그인은 `openclaw.channel`을 통해 온보딩 메타데이터를 광고하고 `openclaw.install`을 통해 설치 힌트를 제공할 수 있습니다. 이를 통해 코어 카탈로그를 데이터 없이 유지할 수 있습니다.

예제:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "extensions/nextcloud-talk",
      "defaultChoice": "npm"
    }
  }
}
```

OpenClaw는 **외부 채널 카탈로그**도 병합할 수 있습니다 (예: MPM 레지스트리 내보내기). 다음 위치 중 하나에 JSON 파일을 배치하세요:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 `OPENCLAW_PLUGIN_CATALOG_PATHS` (또는 `OPENCLAW_MPM_CATALOG_PATHS`)를 하나 이상의 JSON 파일로 지정하세요 (쉼표/세미콜론/`PATH`-구분). 각 파일은 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`를 포함해야 합니다.

## 플러그인 ID

기본 플러그인 id:

- 패키지 팩: `package.json` `name`
- 독립 파일: 파일 기본 이름 (`~/.../voice-call.ts` → `voice-call`)

플러그인이 `id`를 내보내는 경우, OpenClaw는 이를 사용하지만 설정된 id와 일치하지 않으면 경고합니다.

## 설정

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

필드:

- `enabled`: 마스터 토글 (기본값: true)
- `allow`: 허용 목록 (선택 사항)
- `deny`: 거부 목록 (선택 사항; deny가 우선)
- `load.paths`: 추가 플러그인 파일/디렉토리
- `entries.<id>`: 플러그인별 토글 + 설정

설정 변경은 **게이트웨이 재시작이 필요**합니다.

검증 규칙 (엄격):

- `entries`, `allow`, `deny` 또는 `slots`의 알 수 없는 플러그인 id는 **오류**입니다.
- 플러그인 매니페스트가 채널 id를 선언하지 않는 한, 알 수 없는 `channels.<id>` 키는 **오류**입니다.
- 플러그인 설정은 `openclaw.plugin.json`에 포함된 JSON Schema (`configSchema`)를 사용하여 검증됩니다.
- 플러그인이 비활성화된 경우, 설정은 보존되고 **경고**가 발생합니다.

## 플러그인 슬롯 (배타적 카테고리)

일부 플러그인 카테고리는 **배타적**입니다 (한 번에 하나만 활성화). `plugins.slots`를 사용하여 슬롯을 소유하는 플러그인을 선택하세요:

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 또는 "none"으로 메모리 플러그인 비활성화
    },
  },
}
```

여러 플러그인이 `kind: "memory"`를 선언하는 경우, 선택된 플러그인만 로드됩니다. 다른 플러그인은 진단과 함께 비활성화됩니다.

## Control UI (스키마 + 레이블)

Control UI는 `config.schema` (JSON Schema + `uiHints`)를 사용하여 더 나은 폼을 렌더링합니다.

OpenClaw는 발견된 플러그인을 기반으로 런타임에 `uiHints`를 보강합니다:

- `plugins.entries.<id>` / `.enabled` / `.config`에 대한 플러그인별 레이블 추가
- 다음 위치에서 선택적 플러그인 제공 설정 필드 힌트 병합:
  `plugins.entries.<id>.config.<field>`

플러그인 설정 필드가 좋은 레이블/플레이스홀더를 표시하고 비밀을 민감한 것으로 표시하려면, 플러그인 매니페스트의 JSON Schema와 함께 `uiHints`를 제공하세요.

예제:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": { "type": "string" },
      "region": { "type": "string" }
    }
  },
  "uiHints": {
    "apiKey": { "label": "API Key", "sensitive": true },
    "region": { "label": "Region", "placeholder": "us-east-1" }
  }
}
```

## CLI

```bash
openclaw plugins list
openclaw plugins info <id>
openclaw plugins install <path>                 # 로컬 파일/디렉토리를 ~/.openclaw/extensions/<id>에 복사
openclaw plugins install ./extensions/voice-call # 상대 경로 가능
openclaw plugins install ./plugin.tgz           # 로컬 tarball에서 설치
openclaw plugins install ./plugin.zip           # 로컬 zip에서 설치
openclaw plugins install -l ./extensions/voice-call # 개발용 링크 (복사 없음)
openclaw plugins install @openclaw/voice-call # npm에서 설치
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins doctor
```

`plugins update`는 `plugins.installs` 아래에 추적된 npm 설치에만 작동합니다.

플러그인은 자체 최상위 명령어를 등록할 수도 있습니다 (예: `openclaw voicecall`).

## 플러그인 API (개요)

플러그인은 다음 중 하나를 내보냅니다:

- 함수: `(api) => { ... }`
- 객체: `{ id, name, configSchema, register(api) { ... } }`

## 플러그인 훅

플러그인은 훅을 제공하고 런타임에 등록할 수 있습니다. 이를 통해 플러그인은 별도의 훅 팩 설치 없이 이벤트 기반 자동화를 번들로 제공할 수 있습니다.

### 예제

```
import { registerPluginHooksFromDir } from "openclaw/plugin-sdk";

export default function register(api) {
  registerPluginHooksFromDir(api, "./hooks");
}
```

참고사항:

- 훅 디렉토리는 일반적인 훅 구조를 따릅니다 (`HOOK.md` + `handler.ts`).
- 훅 적격성 규칙은 여전히 적용됩니다 (OS/bins/env/config 요구사항).
- 플러그인 관리 훅은 `plugin:<id>`와 함께 `openclaw hooks list`에 표시됩니다.
- `openclaw hooks`를 통해 플러그인 관리 훅을 활성화/비활성화할 수 없습니다. 대신 플러그인을 활성화/비활성화하세요.

## 프로바이더 플러그인 (모델 인증)

플러그인은 **모델 프로바이더 인증** 플로우를 등록할 수 있어 사용자가 OpenClaw 내에서 OAuth 또는 API 키 설정을 실행할 수 있습니다 (외부 스크립트 불필요).

`api.registerProvider(...)`를 통해 프로바이더를 등록하세요. 각 프로바이더는 하나 이상의 인증 메서드 (OAuth, API 키, 기기 코드 등)를 노출합니다. 이러한 메서드는 다음을 구동합니다:

- `openclaw models auth login --provider <id> [--method <id>]`

예제:

```ts
api.registerProvider({
  id: "acme",
  label: "AcmeAI",
  auth: [
    {
      id: "oauth",
      label: "OAuth",
      kind: "oauth",
      run: async (ctx) => {
        // OAuth 플로우 실행 및 인증 프로필 반환.
        return {
          profiles: [
            {
              profileId: "acme:default",
              credential: {
                type: "oauth",
                provider: "acme",
                access: "...",
                refresh: "...",
                expires: Date.now() + 3600 * 1000,
              },
            },
          ],
          defaultModel: "acme/opus-1",
        };
      },
    },
  ],
});
```

참고사항:

- `run`은 `prompter`, `runtime`, `openUrl`, `oauth.createVpsAwareHandlers` 헬퍼가 포함된 `ProviderAuthContext`를 받습니다.
- 기본 모델이나 프로바이더 설정을 추가해야 하는 경우 `configPatch`를 반환하세요.
- `--set-default`가 에이전트 기본값을 업데이트할 수 있도록 `defaultModel`을 반환하세요.

### 메시징 채널 등록

플러그인은 내장 채널 (WhatsApp, Telegram 등)처럼 동작하는 **채널 플러그인**을 등록할 수 있습니다. 채널 설정은 `channels.<id>` 아래에 있으며 채널 플러그인 코드에 의해 검증됩니다.

```ts
const myChannel = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "demo channel plugin.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? {
        accountId,
      },
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async () => ({ ok: true }),
  },
};

export default function (api) {
  api.registerChannel({ plugin: myChannel });
}
```

참고사항:

- 설정을 `channels.<id>` 아래에 배치하세요 (`plugins.entries`가 아님).
- `meta.label`은 CLI/UI 목록의 레이블에 사용됩니다.
- `meta.aliases`는 정규화 및 CLI 입력을 위한 대체 id를 추가합니다.
- `meta.preferOver`는 둘 다 설정된 경우 자동 활성화를 건너뛸 채널 id를 나열합니다.
- `meta.detailLabel` 및 `meta.systemImage`는 UI가 더 풍부한 채널 레이블/아이콘을 표시하도록 합니다.

### 새 메시징 채널 작성 (단계별)

**새 채팅 인터페이스** ("메시징 채널")가 필요한 경우 사용하세요. 모델 프로바이더가 아닙니다.
모델 프로바이더 문서는 `/providers/*` 아래에 있습니다.

1. id + 설정 형태 선택

- 모든 채널 설정은 `channels.<id>` 아래에 있습니다.
- 다중 계정 설정의 경우 `channels.<id>.accounts.<accountId>`를 선호합니다.

2. 채널 메타데이터 정의

- `meta.label`, `meta.selectionLabel`, `meta.docsPath`, `meta.blurb`는 CLI/UI 목록을 제어합니다.
- `meta.docsPath`는 `/channels/<id>`와 같은 문서 페이지를 가리켜야 합니다.
- `meta.preferOver`는 플러그인이 다른 채널을 대체할 수 있도록 합니다 (자동 활성화가 이를 선호).
- `meta.detailLabel` 및 `meta.systemImage`는 UI가 세부 텍스트/아이콘에 사용됩니다.

3. 필수 어댑터 구현

- `config.listAccountIds` + `config.resolveAccount`
- `capabilities` (채팅 유형, 미디어, 스레드 등)
- `outbound.deliveryMode` + `outbound.sendText` (기본 전송용)

4. 필요에 따라 선택적 어댑터 추가

- `setup` (마법사), `security` (DM 정책), `status` (상태/진단)
- `gateway` (시작/중지/로그인), `mentions`, `threading`, `streaming`
- `actions` (메시지 액션), `commands` (네이티브 명령어 동작)

5. 플러그인에 채널 등록

- `api.registerChannel({ plugin })`

최소 설정 예제:

```json5
{
  channels: {
    acmechat: {
      accounts: {
        default: { token: "ACME_TOKEN", enabled: true },
      },
    },
  },
}
```

최소 채널 플러그인 (아웃바운드 전용):

```ts
const plugin = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "AcmeChat messaging channel.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? {
        accountId,
      },
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async ({ text }) => {
      // 여기에서 채널로 `text` 전달
      return { ok: true };
    },
  },
};

export default function (api) {
  api.registerChannel({ plugin });
}
```

플러그인을 로드하고 (확장 디렉토리 또는 `plugins.load.paths`), 게이트웨이를 재시작한 다음 설정에서 `channels.<id>`를 구성하세요.

### 에이전트 도구

전용 가이드를 참조하세요: [플러그인 에이전트 도구](/plugins/agent-tools).

### 게이트웨이 RPC 메서드 등록

```ts
export default function (api) {
  api.registerGatewayMethod("myplugin.status", ({ respond }) => {
    respond(true, { ok: true });
  });
}
```

### CLI 명령어 등록

```ts
export default function (api) {
  api.registerCli(
    ({ program }) => {
      program.command("mycmd").action(() => {
        console.log("Hello");
      });
    },
    { commands: ["mycmd"] },
  );
}
```

### 자동 응답 명령어 등록

플러그인은 **AI 에이전트를 호출하지 않고** 실행되는 커스텀 슬래시 명령어를 등록할 수 있습니다. 이는 토글 명령어, 상태 확인 또는 LLM 처리가 필요하지 않은 빠른 작업에 유용합니다.

```ts
export default function (api) {
  api.registerCommand({
    name: "mystatus",
    description: "Show plugin status",
    handler: (ctx) => ({
      text: `Plugin is running! Channel: ${ctx.channel}`,
    }),
  });
}
```

명령어 핸들러 컨텍스트:

- `senderId`: 발신자의 ID (사용 가능한 경우)
- `channel`: 명령어가 전송된 채널
- `isAuthorizedSender`: 발신자가 승인된 사용자인지 여부
- `args`: 명령어 뒤에 전달된 인수 (`acceptsArgs: true`인 경우)
- `commandBody`: 전체 명령어 텍스트
- `config`: 현재 OpenClaw 설정

명령어 옵션:

- `name`: 명령어 이름 (선행 `/` 없이)
- `description`: 명령어 목록에 표시되는 도움말 텍스트
- `acceptsArgs`: 명령어가 인수를 허용하는지 여부 (기본값: false). false이고 인수가 제공되면 명령어가 일치하지 않고 메시지가 다른 핸들러로 전달됩니다
- `requireAuth`: 승인된 발신자가 필요한지 여부 (기본값: true)
- `handler`: `{ text: string }`을 반환하는 함수 (비동기 가능)

인증 및 인수를 사용한 예제:

```ts
api.registerCommand({
  name: "setmode",
  description: "Set plugin mode",
  acceptsArgs: true,
  requireAuth: true,
  handler: async (ctx) => {
    const mode = ctx.args?.trim() || "default";
    await saveMode(mode);
    return { text: `Mode set to: ${mode}` };
  },
});
```

참고사항:

- 플러그인 명령어는 내장 명령어 및 AI 에이전트 **이전에** 처리됩니다
- 명령어는 전역으로 등록되며 모든 채널에서 작동합니다
- 명령어 이름은 대소문자를 구분하지 않습니다 (`/MyStatus`는 `/mystatus`와 일치)
- 명령어 이름은 문자로 시작해야 하며 문자, 숫자, 하이픈, 밑줄만 포함할 수 있습니다
- 예약된 명령어 이름 (`help`, `status`, `reset` 등)은 플러그인에서 재정의할 수 없습니다
- 플러그인 간 중복 명령어 등록은 진단 오류로 실패합니다

### 백그라운드 서비스 등록

```ts
export default function (api) {
  api.registerService({
    id: "my-service",
    start: () => api.logger.info("ready"),
    stop: () => api.logger.info("bye"),
  });
}
```

## 명명 규칙

- 게이트웨이 메서드: `pluginId.action` (예: `voicecall.status`)
- 도구: `snake_case` (예: `voice_call`)
- CLI 명령어: kebab 또는 camel, 단 코어 명령어와 충돌하지 않도록

## 스킬

플러그인은 리포지토리에 스킬을 제공할 수 있습니다 (`skills/<name>/SKILL.md`).
`plugins.entries.<id>.enabled` (또는 기타 설정 게이트)로 활성화하고 워크스페이스/관리 스킬 위치에 있는지 확인하세요.

## 배포 (npm)

권장 패키징:

- 메인 패키지: `openclaw` (이 리포지토리)
- 플러그인: `@openclaw/*` 아래의 별도 npm 패키지 (예: `@openclaw/voice-call`)

게시 계약:

- 플러그인 `package.json`은 하나 이상의 진입 파일이 포함된 `openclaw.extensions`를 포함해야 합니다.
- 진입 파일은 `.js` 또는 `.ts`일 수 있습니다 (jiti는 런타임에 TS를 로드합니다).
- `openclaw plugins install <npm-spec>`는 `npm pack`을 사용하고, `~/.openclaw/extensions/<id>/`에 추출하며, 설정에서 활성화합니다.
- 설정 키 안정성: 스코프가 지정된 패키지는 `plugins.entries.*`의 **스코프가 없는** id로 정규화됩니다.

## 예제 플러그인: Voice Call

이 리포지토리에는 음성 통화 플러그인이 포함되어 있습니다 (Twilio 또는 로그 폴백):

- 소스: `extensions/voice-call`
- 스킬: `skills/voice-call`
- CLI: `openclaw voicecall start|status`
- 도구: `voice_call`
- RPC: `voicecall.start`, `voicecall.status`
- 설정 (twilio): `provider: "twilio"` + `twilio.accountSid/authToken/from` (선택적 `statusCallbackUrl`, `twimlUrl`)
- 설정 (dev): `provider: "log"` (네트워크 없음)

설정 및 사용법은 [Voice Call](/plugins/voice-call) 및 `extensions/voice-call/README.md`를 참조하세요.

## 안전성 참고사항

플러그인은 게이트웨이와 인-프로세스로 실행됩니다. 신뢰할 수 있는 코드로 취급하세요:

- 신뢰하는 플러그인만 설치하세요.
- `plugins.allow` 허용 목록을 선호하세요.
- 변경 후 게이트웨이를 재시작하세요.

## 플러그인 테스트

플러그인은 테스트를 제공할 수 있습니다 (그리고 제공해야 합니다):

- 리포지토리 내 플러그인은 `src/**` 아래에 Vitest 테스트를 유지할 수 있습니다 (예: `src/plugins/voice-call.plugin.test.ts`).
- 별도로 게시된 플러그인은 자체 CI (lint/build/test)를 실행하고 `openclaw.extensions`가 빌드된 진입점 (`dist/index.js`)을 가리키는지 검증해야 합니다.

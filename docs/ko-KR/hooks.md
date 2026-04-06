---
summary: "훅: 명령어 및 라이프사이클 이벤트를 위한 이벤트 기반 자동화"
read_when:
  - /new, /reset, /stop 및 에이전트 라이프사이클 이벤트를 위한 이벤트 기반 자동화가 필요한 경우
  - 훅을 빌드, 설치 또는 디버깅하고자 하는 경우
title: "훅"
---

# 훅

훅은 에이전트 명령어 및 이벤트에 대한 응답으로 작업을 자동화하기 위한 확장 가능한 이벤트 기반 시스템을 제공합니다. 훅은 디렉토리에서 자동으로 발견되며 CLI 명령어를 통해 관리할 수 있으며, 이는 OpenClaw에서 스킬이 작동하는 방식과 유사합니다.

## 시작하기

훅은 무언가가 발생할 때 실행되는 작은 스크립트입니다. 두 가지 종류가 있습니다:

- **훅** (이 페이지): `/new`, `/reset`, `/stop` 또는 라이프사이클 이벤트와 같은 에이전트 이벤트가 발생할 때 게이트웨이 내부에서 실행됩니다.
- **웹훅**: 다른 시스템이 OpenClaw에서 작업을 트리거할 수 있도록 하는 외부 HTTP 웹훅입니다. [Webhook Hooks](/automation/webhook)를 참조하거나 Gmail 도우미 명령어는 `openclaw webhooks`를 사용하세요.

훅은 플러그인 내부에 번들로 포함될 수도 있습니다. [플러그인](/plugin#plugin-hooks)을 참조하세요.

일반적인 사용 사례:

- 세션을 리셋할 때 메모리 스냅샷 저장
- 문제 해결 또는 규정 준수를 위한 명령어 감사 추적 유지
- 세션이 시작되거나 종료될 때 후속 자동화 트리거
- 이벤트가 발생할 때 에이전트 워크스페이스에 파일 작성 또는 외부 API 호출

작은 TypeScript 함수를 작성할 수 있다면 훅을 작성할 수 있습니다. 훅은 자동으로 발견되며 CLI를 통해 활성화 또는 비활성화할 수 있습니다.

## 개요

훅 시스템을 사용하면 다음을 수행할 수 있습니다:

- `/new`가 발행될 때 세션 컨텍스트를 메모리에 저장
- 감사를 위한 모든 명령어 로깅
- 에이전트 라이프사이클 이벤트에서 커스텀 자동화 트리거
- 핵심 코드를 수정하지 않고 OpenClaw의 동작 확장

## 시작하기

### 번들 훅

OpenClaw는 자동으로 발견되는 4개의 번들 훅과 함께 제공됩니다:

- **💾 session-memory**: `/new`를 발행할 때 세션 컨텍스트를 에이전트 워크스페이스(기본값 `~/.openclaw/workspace/memory/`)에 저장합니다
- **📝 command-logger**: 모든 명령어 이벤트를 `~/.openclaw/logs/commands.log`에 로깅합니다
- **🚀 boot-md**: 게이트웨이가 시작될 때 `BOOT.md`를 실행합니다(내부 훅 활성화 필요)
- **😈 soul-evil**: 제거 기간 동안 또는 랜덤 확률로 주입된 `SOUL.md` 콘텐츠를 `SOUL_EVIL.md`로 교체합니다

사용 가능한 훅 목록 보기:

```bash
openclaw hooks list
```

훅 활성화:

```bash
openclaw hooks enable session-memory
```

훅 상태 확인:

```bash
openclaw hooks check
```

상세 정보 가져오기:

```bash
openclaw hooks info session-memory
```

### 온보딩

온보딩 중(`openclaw onboard`), 권장 훅을 활성화하라는 메시지가 표시됩니다. 마법사는 적격 훅을 자동으로 발견하고 선택할 수 있도록 제시합니다.

## 훅 디스커버리

훅은 세 개의 디렉토리에서 자동으로 발견됩니다(우선순위 순서):

1. **워크스페이스 훅**: `<workspace>/hooks/` (에이전트별, 최우선순위)
2. **관리 훅**: `~/.openclaw/hooks/` (사용자가 설치, 워크스페이스 간 공유)
3. **번들 훅**: `<openclaw>/dist/hooks/bundled/` (OpenClaw와 함께 제공)

관리 훅 디렉토리는 **단일 훅** 또는 **훅 팩**(패키지 디렉토리)일 수 있습니다.

각 훅은 다음을 포함하는 디렉토리입니다:

```
my-hook/
├── HOOK.md          # 메타데이터 + 문서
└── handler.ts       # 핸들러 구현
```

## 훅 팩 (npm/아카이브)

훅 팩은 `package.json`의 `openclaw.hooks`를 통해 하나 이상의 훅을 내보내는 표준 npm 패키지입니다. 다음으로 설치하세요:

```bash
openclaw hooks install <path-or-spec>
```

`package.json` 예시:

```json
{
  "name": "@acme/my-hooks",
  "version": "0.1.0",
  "openclaw": {
    "hooks": ["./hooks/my-hook", "./hooks/other-hook"]
  }
}
```

각 항목은 `HOOK.md` 및 `handler.ts`(또는 `index.ts`)를 포함하는 훅 디렉토리를 가리킵니다.
훅 팩은 의존성을 포함할 수 있으며 `~/.openclaw/hooks/<id>` 아래에 설치됩니다.

## 훅 구조

### HOOK.md 형식

`HOOK.md` 파일은 YAML 프론트매터의 메타데이터와 Markdown 문서를 포함합니다:

```markdown
---
name: my-hook
description: "이 훅이 수행하는 작업에 대한 짧은 설명"
homepage: https://docs.openclaw.ai/hooks#my-hook
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

상세한 문서는 여기에 작성됩니다...

## 수행 작업

- `/new` 명령어 수신
- 일부 작업 수행
- 결과 로깅

## 요구사항

- Node.js가 설치되어 있어야 합니다

## 설정

설정이 필요하지 않습니다.
```

### 메타데이터 필드

`metadata.openclaw` 객체는 다음을 지원합니다:

- **`emoji`**: CLI용 표시 이모지(예: `"💾"`)
- **`events`**: 수신할 이벤트 배열(예: `["command:new", "command:reset"]`)
- **`export`**: 사용할 이름이 지정된 내보내기(기본값: `"default"`)
- **`homepage`**: 문서 URL
- **`requires`**: 선택적 요구사항
  - **`bins`**: PATH에 필요한 바이너리(예: `["git", "node"]`)
  - **`anyBins`**: 이 바이너리 중 하나 이상이 있어야 합니다
  - **`env`**: 필요한 환경 변수
  - **`config`**: 필요한 설정 경로(예: `["workspace.dir"]`)
  - **`os`**: 필요한 플랫폼(예: `["darwin", "linux"]`)
- **`always`**: 적격성 검사 우회(부울)
- **`install`**: 설치 방법(번들 훅의 경우: `[{"id":"bundled","kind":"bundled"}]`)

### 핸들러 구현

`handler.ts` 파일은 `HookHandler` 함수를 내보냅니다:

```typescript
import type { HookHandler } from "../../src/hooks/hooks.js";

const myHandler: HookHandler = async (event) => {
  // 'new' 명령어에만 트리거
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  console.log(`  Session: ${event.sessionKey}`);
  console.log(`  Timestamp: ${event.timestamp.toISOString()}`);

  // 여기에 커스텀 로직 작성

  // 선택적으로 사용자에게 메시지 전송
  event.messages.push("✨ My hook executed!");
};

export default myHandler;
```

#### 이벤트 컨텍스트

각 이벤트에는 다음이 포함됩니다:

```typescript
{
  type: 'command' | 'session' | 'agent' | 'gateway',
  action: string,              // 예: 'new', 'reset', 'stop'
  sessionKey: string,          // 세션 식별자
  timestamp: Date,             // 이벤트가 발생한 시간
  messages: string[],          // 사용자에게 보낼 메시지를 여기에 푸시
  context: {
    sessionEntry?: SessionEntry,
    sessionId?: string,
    sessionFile?: string,
    commandSource?: string,    // 예: 'whatsapp', 'telegram'
    senderId?: string,
    workspaceDir?: string,
    bootstrapFiles?: WorkspaceBootstrapFile[],
    cfg?: OpenClawConfig
  }
}
```

## 이벤트 유형

### 명령어 이벤트

에이전트 명령어가 발행될 때 트리거됩니다:

- **`command`**: 모든 명령어 이벤트(일반 리스너)
- **`command:new`**: `/new` 명령어가 발행될 때
- **`command:reset`**: `/reset` 명령어가 발행될 때
- **`command:stop`**: `/stop` 명령어가 발행될 때

### 에이전트 이벤트

- **`agent:bootstrap`**: 워크스페이스 부트스트랩 파일이 주입되기 전(훅이 `context.bootstrapFiles`를 변경할 수 있음)

### 게이트웨이 이벤트

게이트웨이가 시작될 때 트리거됩니다:

- **`gateway:startup`**: 채널이 시작되고 훅이 로드된 후

### 도구 결과 훅 (플러그인 API)

이러한 훅은 이벤트 스트림 리스너가 아니며, OpenClaw가 영구화하기 전에 플러그인이 도구 결과를 동기적으로 조정할 수 있도록 합니다.

- **`tool_result_persist`**: 세션 대화 기록에 기록되기 전에 도구 결과를 변환합니다. 동기적이어야 하며, 업데이트된 도구 결과 페이로드를 반환하거나 `undefined`를 반환하여 그대로 유지합니다. [에이전트 루프](/concepts/agent-loop)를 참조하세요.

### 향후 이벤트

계획된 이벤트 유형:

- **`session:start`**: 새 세션이 시작될 때
- **`session:end`**: 세션이 종료될 때
- **`agent:error`**: 에이전트에 오류가 발생할 때
- **`message:sent`**: 메시지가 전송될 때
- **`message:received`**: 메시지가 수신될 때

## 커스텀 훅 생성

### 1. 위치 선택

- **워크스페이스 훅** (`<workspace>/hooks/`): 에이전트별, 최우선순위
- **관리 훅** (`~/.openclaw/hooks/`): 워크스페이스 간 공유

### 2. 디렉토리 구조 생성

```bash
mkdir -p ~/.openclaw/hooks/my-hook
cd ~/.openclaw/hooks/my-hook
```

### 3. HOOK.md 생성

```markdown
---
name: my-hook
description: "유용한 작업 수행"
metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
---

# My Custom Hook

이 훅은 `/new`를 발행할 때 유용한 작업을 수행합니다.
```

### 4. handler.ts 생성

```typescript
import type { HookHandler } from "../../src/hooks/hooks.js";

const handler: HookHandler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log("[my-hook] Running!");
  // 여기에 로직 작성
};

export default handler;
```

### 5. 활성화 및 테스트

```bash
# 훅이 발견되었는지 확인
openclaw hooks list

# 활성화
openclaw hooks enable my-hook

# 게이트웨이 프로세스 재시작(macOS에서 메뉴 바 앱 재시작 또는 개발 프로세스 재시작)

# 이벤트 트리거
# 메시징 채널을 통해 /new 전송
```

## 설정

### 새로운 설정 형식 (권장)

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

### 훅별 설정

훅은 커스텀 설정을 가질 수 있습니다:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": {
            "MY_CUSTOM_VAR": "value"
          }
        }
      }
    }
  }
}
```

### 추가 디렉토리

추가 디렉토리에서 훅 로드:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

### 레거시 설정 형식 (여전히 지원됨)

이전 설정 형식은 하위 호환성을 위해 여전히 작동합니다:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "handlers": [
        {
          "event": "command:new",
          "module": "./hooks/handlers/my-handler.ts",
          "export": "default"
        }
      ]
    }
  }
}
```

**마이그레이션**: 새 훅에는 새로운 디스커버리 기반 시스템을 사용하세요. 레거시 핸들러는 디렉토리 기반 훅 이후에 로드됩니다.

## CLI 명령어

### 훅 목록

```bash
# 모든 훅 나열
openclaw hooks list

# 적격 훅만 표시
openclaw hooks list --eligible

# 자세한 출력(누락된 요구사항 표시)
openclaw hooks list --verbose

# JSON 출력
openclaw hooks list --json
```

### 훅 정보

```bash
# 훅에 대한 상세 정보 표시
openclaw hooks info session-memory

# JSON 출력
openclaw hooks info session-memory --json
```

### 적격성 확인

```bash
# 적격성 요약 표시
openclaw hooks check

# JSON 출력
openclaw hooks check --json
```

### 활성화/비활성화

```bash
# 훅 활성화
openclaw hooks enable session-memory

# 훅 비활성화
openclaw hooks disable command-logger
```

## 번들 훅

### session-memory

`/new`를 발행할 때 세션 컨텍스트를 메모리에 저장합니다.

**이벤트**: `command:new`

**요구사항**: `workspace.dir`이 설정되어 있어야 합니다

**출력**: `<workspace>/memory/YYYY-MM-DD-slug.md` (기본값: `~/.openclaw/workspace`)

**수행 작업**:

1. 리셋 전 세션 항목을 사용하여 올바른 대화 기록을 찾습니다
2. 대화의 마지막 15줄을 추출합니다
3. LLM을 사용하여 설명적인 파일 이름 슬러그를 생성합니다
4. 세션 메타데이터를 날짜가 포함된 메모리 파일에 저장합니다

**출력 예시**:

```markdown
# Session: 2026-01-16 14:30:00 UTC

- **Session Key**: agent:main:main
- **Session ID**: abc123def456
- **Source**: telegram
```

**파일 이름 예시**:

- `2026-01-16-vendor-pitch.md`
- `2026-01-16-api-design.md`
- `2026-01-16-1430.md` (슬러그 생성 실패 시 대체 타임스탬프)

**활성화**:

```bash
openclaw hooks enable session-memory
```

### command-logger

모든 명령어 이벤트를 중앙 집중식 감사 파일에 로깅합니다.

**이벤트**: `command`

**요구사항**: 없음

**출력**: `~/.openclaw/logs/commands.log`

**수행 작업**:

1. 이벤트 세부 정보(명령어 동작, 타임스탬프, 세션 키, 발신자 ID, 소스) 캡처
2. JSONL 형식으로 로그 파일에 추가
3. 백그라운드에서 조용히 실행

**로그 항목 예시**:

```jsonl
{"timestamp":"2026-01-16T14:30:00.000Z","action":"new","sessionKey":"agent:main:main","senderId":"+1234567890","source":"telegram"}
{"timestamp":"2026-01-16T15:45:22.000Z","action":"stop","sessionKey":"agent:main:main","senderId":"user@example.com","source":"whatsapp"}
```

**로그 보기**:

```bash
# 최근 명령어 보기
tail -n 20 ~/.openclaw/logs/commands.log

# jq로 보기 좋게 출력
cat ~/.openclaw/logs/commands.log | jq .

# 동작별 필터링
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**활성화**:

```bash
openclaw hooks enable command-logger
```

### soul-evil

제거 기간 동안 또는 랜덤 확률로 주입된 `SOUL.md` 콘텐츠를 `SOUL_EVIL.md`로 교체합니다.

**이벤트**: `agent:bootstrap`

**문서**: [SOUL Evil Hook](/hooks/soul-evil)

**출력**: 파일이 기록되지 않음; 교체는 메모리 내에서만 발생합니다.

**활성화**:

```bash
openclaw hooks enable soul-evil
```

**설정**:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "soul-evil": {
          "enabled": true,
          "file": "SOUL_EVIL.md",
          "chance": 0.1,
          "purge": { "at": "21:00", "duration": "15m" }
        }
      }
    }
  }
}
```

### boot-md

게이트웨이가 시작될 때(채널 시작 후) `BOOT.md`를 실행합니다.
이를 실행하려면 내부 훅이 활성화되어 있어야 합니다.

**이벤트**: `gateway:startup`

**요구사항**: `workspace.dir`이 설정되어 있어야 합니다

**수행 작업**:

1. 워크스페이스에서 `BOOT.md`를 읽습니다
2. 에이전트 러너를 통해 지침을 실행합니다
3. 메시지 도구를 통해 요청된 아웃바운드 메시지를 전송합니다

**활성화**:

```bash
openclaw hooks enable boot-md
```

## 모범 사례

### 핸들러를 빠르게 유지

훅은 명령어 처리 중에 실행됩니다. 가볍게 유지하세요:

```typescript
// ✓ 좋음 - 비동기 작업, 즉시 반환
const handler: HookHandler = async (event) => {
  void processInBackground(event); // 발사 후 망각
};

// ✗ 나쁨 - 명령어 처리 차단
const handler: HookHandler = async (event) => {
  await slowDatabaseQuery(event);
  await evenSlowerAPICall(event);
};
```

### 오류를 우아하게 처리

위험한 작업은 항상 래핑하세요:

```typescript
const handler: HookHandler = async (event) => {
  try {
    await riskyOperation(event);
  } catch (err) {
    console.error("[my-handler] Failed:", err instanceof Error ? err.message : String(err));
    // 던지지 마세요 - 다른 핸들러가 실행되도록 하세요
  }
};
```

### 이벤트를 조기에 필터링

이벤트가 관련이 없으면 조기에 반환하세요:

```typescript
const handler: HookHandler = async (event) => {
  // 'new' 명령어만 처리
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  // 여기에 로직 작성
};
```

### 특정 이벤트 키 사용

가능한 경우 메타데이터에서 정확한 이벤트를 지정하세요:

```yaml
metadata: { "openclaw": { "events": ["command:new"] } } # 구체적
```

다음보다:

```yaml
metadata: { "openclaw": { "events": ["command"] } } # 일반적 - 더 많은 오버헤드
```

## 디버깅

### 훅 로깅 활성화

게이트웨이는 시작 시 훅 로딩을 로깅합니다:

```
Registered hook: session-memory -> command:new
Registered hook: command-logger -> command
Registered hook: boot-md -> gateway:startup
```

### 디스커버리 확인

발견된 모든 훅 나열:

```bash
openclaw hooks list --verbose
```

### 등록 확인

핸들러에서 호출될 때 로깅:

```typescript
const handler: HookHandler = async (event) => {
  console.log("[my-handler] Triggered:", event.type, event.action);
  // 로직 작성
};
```

### 적격성 확인

훅이 적격하지 않은 이유 확인:

```bash
openclaw hooks info my-hook
```

출력에서 누락된 요구사항을 찾으세요.

## 테스트

### 게이트웨이 로그

게이트웨이 로그를 모니터링하여 훅 실행을 확인하세요:

```bash
# macOS
./scripts/clawlog.sh -f

# 기타 플랫폼
tail -f ~/.openclaw/gateway.log
```

### 훅을 직접 테스트

핸들러를 격리하여 테스트하세요:

```typescript
import { test } from "vitest";
import { createHookEvent } from "./src/hooks/hooks.js";
import myHandler from "./hooks/my-hook/handler.js";

test("my handler works", async () => {
  const event = createHookEvent("command", "new", "test-session", {
    foo: "bar",
  });

  await myHandler(event);

  // 부작용 검증
});
```

## 아키텍처

### 핵심 컴포넌트

- **`src/hooks/types.ts`**: 타입 정의
- **`src/hooks/workspace.ts`**: 디렉토리 스캐닝 및 로딩
- **`src/hooks/frontmatter.ts`**: HOOK.md 메타데이터 파싱
- **`src/hooks/config.ts`**: 적격성 검사
- **`src/hooks/hooks-status.ts`**: 상태 보고
- **`src/hooks/loader.ts`**: 동적 모듈 로더
- **`src/cli/hooks-cli.ts`**: CLI 명령어
- **`src/gateway/server-startup.ts`**: 게이트웨이 시작 시 훅 로드
- **`src/auto-reply/reply/commands-core.ts`**: 명령어 이벤트 트리거

### 디스커버리 흐름

```
게이트웨이 시작
    ↓
디렉토리 스캔 (workspace → managed → bundled)
    ↓
HOOK.md 파일 파싱
    ↓
적격성 확인 (bins, env, config, os)
    ↓
적격 훅에서 핸들러 로드
    ↓
이벤트에 대한 핸들러 등록
```

### 이벤트 흐름

```
사용자가 /new 전송
    ↓
명령어 검증
    ↓
훅 이벤트 생성
    ↓
훅 트리거 (등록된 모든 핸들러)
    ↓
명령어 처리 계속
    ↓
세션 리셋
```

## 문제 해결

### 훅이 발견되지 않음

1. 디렉토리 구조 확인:

   ```bash
   ls -la ~/.openclaw/hooks/my-hook/
   # 표시되어야 함: HOOK.md, handler.ts
   ```

2. HOOK.md 형식 확인:

   ```bash
   cat ~/.openclaw/hooks/my-hook/HOOK.md
   # name 및 metadata가 포함된 YAML 프론트매터가 있어야 합니다
   ```

3. 발견된 모든 훅 나열:
   ```bash
   openclaw hooks list
   ```

### 훅이 적격하지 않음

요구사항 확인:

```bash
openclaw hooks info my-hook
```

누락된 항목 찾기:

- 바이너리(PATH 확인)
- 환경 변수
- 설정 값
- OS 호환성

### 훅이 실행되지 않음

1. 훅이 활성화되었는지 확인:

   ```bash
   openclaw hooks list
   # 활성화된 훅 옆에 ✓가 표시되어야 합니다
   ```

2. 게이트웨이 프로세스를 재시작하여 훅을 다시 로드합니다.

3. 게이트웨이 로그에서 오류 확인:
   ```bash
   ./scripts/clawlog.sh | grep hook
   ```

### 핸들러 오류

TypeScript/가져오기 오류 확인:

```bash
# 가져오기를 직접 테스트
node -e "import('./path/to/handler.ts').then(console.log)"
```

## 마이그레이션 가이드

### 레거시 설정에서 디스커버리로

**이전**:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "handlers": [
        {
          "event": "command:new",
          "module": "./hooks/handlers/my-handler.ts"
        }
      ]
    }
  }
}
```

**이후**:

1. 훅 디렉토리 생성:

   ```bash
   mkdir -p ~/.openclaw/hooks/my-hook
   mv ./hooks/handlers/my-handler.ts ~/.openclaw/hooks/my-hook/handler.ts
   ```

2. HOOK.md 생성:

   ```markdown
   ---
   name: my-hook
   description: "My custom hook"
   metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
   ---

   # My Hook

   유용한 작업을 수행합니다.
   ```

3. 설정 업데이트:

   ```json
   {
     "hooks": {
       "internal": {
         "enabled": true,
         "entries": {
           "my-hook": { "enabled": true }
         }
       }
     }
   }
   ```

4. 확인 및 게이트웨이 프로세스 재시작:
   ```bash
   openclaw hooks list
   # 표시되어야 함: 🎯 my-hook ✓
   ```

**마이그레이션의 이점**:

- 자동 디스커버리
- CLI 관리
- 적격성 검사
- 더 나은 문서
- 일관된 구조

## 참조

- [CLI 참조: hooks](/cli/hooks)
- [번들 훅 README](https://github.com/openclaw/openclaw/tree/main/src/hooks/bundled)
- [웹훅 훅](/automation/webhook)
- [설정](/gateway/configuration#hooks)

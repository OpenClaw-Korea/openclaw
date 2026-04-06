---
title: "Pi 통합 아키텍처"
---

# Pi 통합 아키텍처

이 문서는 OpenClaw가 [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) 및 해당 패키지들(`pi-ai`, `pi-agent-core`, `pi-tui`)과 통합되어 AI 에이전트 기능을 구현하는 방식을 설명합니다.

## 개요

OpenClaw는 pi SDK를 사용하여 AI 코딩 에이전트를 메시징 게이트웨이 아키텍처에 내장합니다. pi를 서브프로세스로 실행하거나 RPC 모드를 사용하는 대신, OpenClaw는 `createAgentSession()`을 통해 pi의 `AgentSession`을 직접 임포트하고 인스턴스화합니다. 이 내장형 접근 방식은 다음을 제공합니다:

- 세션 생명주기 및 이벤트 처리에 대한 완전한 제어
- 사용자 정의 도구 주입(메시징, 샌드박스, 채널별 작업)
- 채널/컨텍스트별 시스템 프롬프트 커스터마이징
- 분기/압축 지원이 있는 세션 지속성
- 페일오버 기능이 있는 다중 계정 인증 프로필 회전
- 프로바이더별 모델 전환

## 패키지 의존성

```json
{
  "@mariozechner/pi-agent-core": "0.49.3",
  "@mariozechner/pi-ai": "0.49.3",
  "@mariozechner/pi-coding-agent": "0.49.3",
  "@mariozechner/pi-tui": "0.49.3"
}
```

| 패키지            | 용도                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `pi-ai`           | 핵심 LLM 추상화: `Model`, `streamSimple`, 메시지 타입, 프로바이더 API                         |
| `pi-agent-core`   | 에이전트 루프, 도구 실행, `AgentMessage` 타입                                                 |
| `pi-coding-agent` | 고수준 SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, 내장 도구 |
| `pi-tui`          | 터미널 UI 컴포넌트(OpenClaw의 로컬 TUI 모드에서 사용)                                         |

## 파일 구조

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/에서 재내보내기
├── pi-embedded-runner/
│   ├── run.ts                     # 주요 진입점: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # 세션 설정이 있는 단일 시도 로직
│   │   ├── params.ts              # RunEmbeddedPiAgentParams 타입
│   │   ├── payloads.ts            # 실행 결과에서 응답 페이로드 구축
│   │   ├── images.ts              # 비전 모델 이미지 주입
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # 중단 오류 감지
│   ├── cache-ttl.ts               # 컨텍스트 정리를 위한 캐시 TTL 추적
│   ├── compact.ts                 # 수동/자동 압축 로직
│   ├── extensions.ts              # 내장 실행을 위한 pi 확장 로드
│   ├── extra-params.ts            # 프로바이더별 스트림 파라미터
│   ├── google.ts                  # Google/Gemini 턴 순서 수정
│   ├── history.ts                 # 히스토리 제한(DM vs 그룹)
│   ├── lanes.ts                   # 세션/전역 명령 레인
│   ├── logger.ts                  # 서브시스템 로거
│   ├── model.ts                   # ModelRegistry를 통한 모델 해석
│   ├── runs.ts                    # 활성 실행 추적, 중단, 큐
│   ├── sandbox-info.ts            # 시스템 프롬프트를 위한 샌드박스 정보
│   ├── session-manager-cache.ts   # SessionManager 인스턴스 캐싱
│   ├── session-manager-init.ts    # 세션 파일 초기화
│   ├── system-prompt.ts           # 시스템 프롬프트 빌더
│   ├── tool-split.ts              # 도구를 내장 vs 사용자 정의로 분할
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel 매핑, 오류 설명
├── pi-embedded-subscribe.ts       # 세션 이벤트 구독/발송
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # 이벤트 핸들러 팩토리
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # 스트리밍 블록 응답 청킹
├── pi-embedded-messaging.ts       # 메시징 도구 송신 추적
├── pi-embedded-helpers.ts         # 오류 분류, 턴 유효성 검사
├── pi-embedded-helpers/           # 헬퍼 모듈
├── pi-embedded-utils.ts           # 포매팅 유틸리티
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # 도구를 위한 AbortSignal 래핑
├── pi-tools.policy.ts             # 도구 허용/거부 정책
├── pi-tools.read.ts               # 읽기 도구 커스터마이징
├── pi-tools.schema.ts             # 도구 스키마 정규화
├── pi-tools.types.ts              # AnyAgentTool 타입 별칭
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition 어댑터
├── pi-settings.ts                 # 설정 오버라이드
├── pi-extensions/                 # 사용자 정의 pi 확장
│   ├── compaction-safeguard.ts    # 안전장치 확장
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # 캐시 TTL 컨텍스트 정리 확장
│   └── context-pruning/
├── model-auth.ts                  # 인증 프로필 해석
├── auth-profiles.ts               # 프로필 저장소, 쿨다운, 페일오버
├── model-selection.ts             # 기본 모델 해석
├── models-config.ts               # models.json 생성
├── model-catalog.ts               # 모델 카탈로그 캐시
├── context-window-guard.ts        # 컨텍스트 윈도우 유효성 검사
├── failover-error.ts              # FailoverError 클래스
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # 시스템 프롬프트 파라미터 해석
├── system-prompt-report.ts        # 디버그 보고서 생성
├── tool-summaries.ts              # 도구 설명 요약
├── tool-policy.ts                 # 도구 정책 해석
├── transcript-policy.ts           # 트랜스크립트 유효성 검사 정책
├── skills.ts                      # 스킬 스냅샷/프롬프트 구축
├── skills/                        # 스킬 서브시스템
├── sandbox.ts                     # 샌드박스 컨텍스트 해석
├── sandbox/                       # 샌드박스 서브시스템
├── channel-tools.ts               # 채널별 도구 주입
├── openclaw-tools.ts              # OpenClaw 전용 도구
├── bash-tools.ts                  # exec/process 도구
├── apply-patch.ts                 # apply_patch 도구(OpenAI)
├── tools/                         # 개별 도구 구현
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── discord-actions*.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── slack-actions.ts
│   ├── telegram-actions.ts
│   ├── web-*.ts
│   └── whatsapp-actions.ts
└── ...
```

## 핵심 통합 흐름

### 1. 내장 에이전트 실행

주요 진입점은 `pi-embedded-runner/run.ts`의 `runEmbeddedPiAgent()`입니다:

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-20250514",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. 세션 생성

`runEmbeddedAttempt()`(runEmbeddedPiAgent()에 의해 호출됨) 내에서 pi SDK가 사용됩니다:

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. 이벤트 구독

`subscribeEmbeddedPiSession()`은 pi의 `AgentSession` 이벤트를 구독합니다:

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

처리되는 이벤트:

- `message_start` / `message_end` / `message_update`(스트리밍 텍스트/사고)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `auto_compaction_start` / `auto_compaction_end`

### 4. 프롬프팅

설정 후, 세션에 프롬프트가 전달됩니다:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK는 전체 에이전트 루프를 처리합니다: LLM으로 전송, 도구 호출 실행, 응답 스트리밍.

## 도구 아키텍처

### 도구 파이프라인

1. **기본 도구**: pi의 `codingTools`(read, bash, edit, write)
2. **사용자 정의 대체**: OpenClaw는 bash를 `exec`/`process`로 대체하고, 샌드박스에 대해 read/edit/write를 커스터마이징합니다
3. **OpenClaw 도구**: 메시징, 브라우저, 캔버스, 세션, cron, 게이트웨이 등
4. **채널 도구**: Discord/Telegram/Slack/WhatsApp 전용 작업 도구
5. **정책 필터링**: 프로필, 프로바이더, 에이전트, 그룹, 샌드박스 정책에 따른 도구 필터링
6. **스키마 정규화**: Gemini/OpenAI 특이사항에 대해 스키마 정리
7. **AbortSignal 래핑**: 중단 신호를 존중하도록 도구 래핑

### 도구 정의 어댑터

pi-agent-core의 `AgentTool`은 pi-coding-agent의 `ToolDefinition`과 다른 `execute` 서명을 가집니다. `pi-tool-definition-adapter.ts`의 어댑터는 이를 연결합니다:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent 서명은 pi-agent-core와 다름
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### 도구 분할 전략

`splitSdkTools()`는 모든 도구를 `customTools`를 통해 전달합니다:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // 비어있음. 모든 것을 오버라이드합니다
    customTools: toToolDefinitions(options.tools),
  };
}
```

이는 OpenClaw의 정책 필터링, 샌드박스 통합, 확장 도구 세트가 프로바이더 간에 일관되도록 합니다.

## 시스템 프롬프트 구성

시스템 프롬프트는 `buildAgentSystemPrompt()`(`system-prompt.ts`)에서 구축됩니다. 도구 사용법, 도구 호출 스타일, 안전 가이드라인, OpenClaw CLI 참조, 스킬, 문서, 워크스페이스, 샌드박스, 메시징, 응답 태그, 음성, 자동 응답, 하트비트, 런타임 메타데이터를 포함한 섹션과 메모리 및 반응(활성화된 경우)을 포함하는 전체 프롬프트를 조합합니다. 섹션은 서브에이전트에서 사용되는 최소 프롬프트 모드에 대해 트리밍됩니다.

프롬프트는 `applySystemPromptOverrideToSession()`을 통해 세션 생성 후에 적용됩니다:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## 세션 관리

### 세션 파일

세션은 트리 구조(id/parentId 연결)가 있는 JSONL 파일입니다. Pi의 `SessionManager`가 지속성을 처리합니다:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw는 이를 도구 결과 안전성을 위해 `guardSessionManager()`로 래핑합니다.

### 세션 캐싱

`session-manager-cache.ts`는 반복적인 파일 파싱을 피하기 위해 SessionManager 인스턴스를 캐시합니다:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### 히스토리 제한

`limitHistoryTurns()`는 채널 유형(DM vs 그룹)에 따라 대화 히스토리를 트리밍합니다.

### 압축

자동 압축은 컨텍스트 오버플로우 시 트리거됩니다. `compactEmbeddedPiSessionDirect()`는 수동 압축을 처리합니다:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## 인증 및 모델 해석

### 인증 프로필

OpenClaw는 프로바이더당 여러 API 키가 있는 인증 프로필 저장소를 유지합니다:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

프로필은 쿨다운 추적과 함께 실패 시 회전합니다:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### 모델 해석

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// pi의 ModelRegistry 및 AuthStorage를 사용합니다
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### 페일오버

`FailoverError`는 설정된 경우 모델 대체를 트리거합니다:

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Pi 확장

OpenClaw는 특수 동작을 위해 사용자 정의 pi 확장을 로드합니다:

### 압축 안전장치

`pi-extensions/compaction-safeguard.ts`는 적응형 토큰 예산 책정, 도구 실패 및 파일 작업 요약을 포함하는 압축에 가이드레일을 추가합니다:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### 컨텍스트 정리

`pi-extensions/context-pruning.ts`는 캐시 TTL 기반 컨텍스트 정리를 구현합니다:

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## 스트리밍 및 블록 응답

### 블록 청킹

`EmbeddedBlockChunker`는 스트리밍 텍스트를 별도 응답 블록으로 관리합니다:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### 사고/최종 태그 제거

스트리밍 출력은 `<think>`/`<thinking>` 블록을 제거하고 `<final>` 컨텐츠를 추출하도록 처리됩니다:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // <think>...</think> 컨텐츠 제거
  // enforceFinalTag인 경우, <final>...</final> 컨텐츠만 반환
};
```

### 응답 지시문

`[[media:url]]`, `[[voice]]`, `[[reply:id]]`와 같은 응답 지시문이 파싱되고 추출됩니다:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## 오류 처리

### 오류 분류

`pi-embedded-helpers.ts`는 적절한 처리를 위해 오류를 분류합니다:

```typescript
isContextOverflowError(errorText)     // 컨텍스트가 너무 큼
isCompactionFailureError(errorText)   // 압축 실패
isAuthAssistantError(lastAssistant)   // 인증 실패
isRateLimitAssistantError(...)        // 속도 제한
isFailoverAssistantError(...)         // 페일오버해야 함
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### 사고 수준 대체

사고 수준이 지원되지 않으면 대체됩니다:

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## 샌드박스 통합

샌드박스 모드가 활성화된 경우, 도구 및 경로가 제한됩니다:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // 샌드박스 격리된 read/edit/write 도구 사용
  // Exec는 컨테이너에서 실행
  // 브라우저는 브리지 URL 사용
}
```

## 프로바이더별 처리

### Anthropic

- 거부 매직 문자열 스크러빙
- 연속 역할에 대한 턴 유효성 검사
- Claude Code 파라미터 호환성

### Google/Gemini

- 턴 순서 수정(`applyGoogleTurnOrderingFix`)
- 도구 스키마 살균(`sanitizeToolsForGoogle`)
- 세션 히스토리 살균(`sanitizeSessionHistory`)

### OpenAI

- Codex 모델용 `apply_patch` 도구
- 사고 수준 다운그레이드 처리

## TUI 통합

OpenClaw는 또한 pi-tui 컴포넌트를 직접 사용하는 로컬 TUI 모드도 있습니다:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

이는 pi의 네이티브 모드와 유사한 대화형 터미널 경험을 제공합니다.

## Pi CLI와의 주요 차이점

| 항목            | Pi CLI                  | OpenClaw 내장                                                                                    |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| 호출 방식       | `pi` 명령 / RPC         | `createAgentSession()`을 통한 SDK                                                                |
| 도구            | 기본 코딩 도구          | 사용자 정의 OpenClaw 도구 세트                                                                   |
| 시스템 프롬프트 | AGENTS.md + 프롬프트    | 채널/컨텍스트별 동적                                                                             |
| 세션 저장소     | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (또는 `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| 인증            | 단일 자격 증명          | 회전이 있는 다중 프로필                                                                          |
| 확장            | 디스크에서 로드         | 프로그래매틱 + 디스크 경로                                                                       |
| 이벤트 처리     | TUI 렌더링              | 콜백 기반(onBlockReply 등)                                                                       |

## 향후 고려 사항

잠재적 재작업 영역:

1. **도구 서명 정렬**: 현재 pi-agent-core와 pi-coding-agent 서명 간의 어댑팅
2. **세션 관리자 래핑**: `guardSessionManager`는 안전성을 추가하지만 복잡성 증가
3. **확장 로드**: pi의 `ResourceLoader`를 더 직접적으로 사용할 수 있음
4. **스트리밍 핸들러 복잡성**: `subscribeEmbeddedPiSession`이 커짐
5. **프로바이더 특이사항**: pi가 잠재적으로 처리할 수 있는 많은 프로바이더별 코드 경로

## 테스트

pi 통합 및 확장을 다루는 모든 기존 테스트:

- `src/agents/pi-embedded-block-chunker.test.ts`
- `src/agents/pi-embedded-helpers.buildbootstrapcontextfiles.test.ts`
- `src/agents/pi-embedded-helpers.classifyfailoverreason.test.ts`
- `src/agents/pi-embedded-helpers.downgradeopenai-reasoning.test.ts`
- `src/agents/pi-embedded-helpers.formatassistanterrortext.test.ts`
- `src/agents/pi-embedded-helpers.formatrawassistanterrorforui.test.ts`
- `src/agents/pi-embedded-helpers.image-dimension-error.test.ts`
- `src/agents/pi-embedded-helpers.image-size-error.test.ts`
- `src/agents/pi-embedded-helpers.isautherrormessage.test.ts`
- `src/agents/pi-embedded-helpers.isbillingerrormessage.test.ts`
- `src/agents/pi-embedded-helpers.iscloudcodeassistformaterror.test.ts`
- `src/agents/pi-embedded-helpers.iscompactionfailureerror.test.ts`
- `src/agents/pi-embedded-helpers.iscontextoverflowerror.test.ts`
- `src/agents/pi-embedded-helpers.isfailovererrormessage.test.ts`
- `src/agents/pi-embedded-helpers.islikelycontextoverflowerror.test.ts`
- `src/agents/pi-embedded-helpers.ismessagingtoolduplicate.test.ts`
- `src/agents/pi-embedded-helpers.messaging-duplicate.test.ts`
- `src/agents/pi-embedded-helpers.normalizetextforcomparison.test.ts`
- `src/agents/pi-embedded-helpers.resolvebootstrapmaxchars.test.ts`
- `src/agents/pi-embedded-helpers.sanitize-session-messages-images.keeps-tool-call-tool-result-ids-unchanged.test.ts`
- `src/agents/pi-embedded-helpers.sanitize-session-messages-images.removes-empty-assistant-text-blocks-but-preserves.test.ts`
- `src/agents/pi-embedded-helpers.sanitizegoogleturnordering.test.ts`
- `src/agents/pi-embedded-helpers.sanitizesessionmessagesimages-thought-signature-stripping.test.ts`
- `src/agents/pi-embedded-helpers.sanitizetoolcallid.test.ts`
- `src/agents/pi-embedded-helpers.sanitizeuserfacingtext.test.ts`
- `src/agents/pi-embedded-helpers.stripthoughtsignatures.test.ts`
- `src/agents/pi-embedded-helpers.validate-turns.test.ts`
- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (라이브)
- `src/agents/pi-embedded-runner-extraparams.test.ts`
- `src/agents/pi-embedded-runner.applygoogleturnorderingfix.test.ts`
- `src/agents/pi-embedded-runner.buildembeddedsandboxinfo.test.ts`
- `src/agents/pi-embedded-runner.createsystempromptoverride.test.ts`
- `src/agents/pi-embedded-runner.get-dm-history-limit-from-session-key.falls-back-provider-default-per-dm-not.test.ts`
- `src/agents/pi-embedded-runner.get-dm-history-limit-from-session-key.returns-undefined-sessionkey-is-undefined.test.ts`
- `src/agents/pi-embedded-runner.google-sanitize-thinking.test.ts`
- `src/agents/pi-embedded-runner.guard.test.ts`
- `src/agents/pi-embedded-runner.limithistoryturns.test.ts`
- `src/agents/pi-embedded-runner.resolvesessionagentids.test.ts`
- `src/agents/pi-embedded-runner.run-embedded-pi-agent.auth-profile-rotation.test.ts`
- `src/agents/pi-embedded-runner.sanitize-session-history.test.ts`
- `src/agents/pi-embedded-runner.splitsdktools.test.ts`
- `src/agents/pi-embedded-runner.test.ts`
- `src/agents/pi-embedded-subscribe.code-span-awareness.test.ts`
- `src/agents/pi-embedded-subscribe.reply-tags.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.calls-onblockreplyflush-before-tool-execution-start-preserve.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-append-text-end-content-is.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-call-onblockreplyflush-callback-is-not.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-duplicate-text-end-repeats-full.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.does-not-emit-duplicate-block-replies-text.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.emits-block-replies-text-end-does-not.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.emits-reasoning-as-separate-message-enabled.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.filters-final-suppresses-output-without-start-tag.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.includes-canvas-action-metadata-tool-summaries.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.keeps-assistanttexts-final-answer-block-replies-are.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.keeps-indented-fenced-blocks-intact.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.reopens-fenced-blocks-splitting-inside-them.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.splits-long-single-line-fenced-blocks-reopen.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.streams-soft-chunks-paragraph-preference.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.subscribeembeddedpisession.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.suppresses-message-end-block-replies-message-tool.test.ts`
- `src/agents/pi-embedded-subscribe.subscribe-embedded-pi-session.waits-multiple-compaction-retries-before-resolving.test.ts`
- `src/agents/pi-embedded-subscribe.tools.test.ts`
- `src/agents/pi-embedded-utils.test.ts`
- `src/agents/pi-extensions/compaction-safeguard.test.ts`
- `src/agents/pi-extensions/context-pruning.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-tools-agent-config.test.ts`
- `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping-b.test.ts`
- `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping-d.test.ts`
- `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping-f.test.ts`
- `src/agents/pi-tools.create-openclaw-coding-tools.adds-claude-style-aliases-schemas-without-dropping.test.ts`
- `src/agents/pi-tools.policy.test.ts`
- `src/agents/pi-tools.safe-bins.test.ts`
- `src/agents/pi-tools.workspace-paths.test.ts`

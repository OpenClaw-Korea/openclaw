---
summary: "계획: 모든 메시징 커넥터를 위한 하나의 깔끔한 플러그인 SDK + 런타임"
read_when:
  - 플러그인 아키텍처를 정의하거나 리팩터링할 때
  - 채널 커넥터를 플러그인 SDK/런타임으로 마이그레이션할 때
title: "플러그인 SDK 리팩터"
---

# 플러그인 SDK + 런타임 리팩터 계획

목표: 모든 메시징 커넥터를 하나의 안정적인 API를 사용하는 플러그인(번들 또는 외부)으로 만듭니다.
플러그인은 `src/**`에서 직접 가져오기를 수행하지 않습니다. 모든 의존성은 SDK 또는 런타임을 통해 제공됩니다.

## 지금 해야 하는 이유

- 현재 커넥터는 패턴이 혼합되어 있습니다: 직접 코어 가져오기, 배포 전용 브릿지, 커스텀 헬퍼.
- 이로 인해 업그레이드가 불안정하고 깔끔한 외부 플러그인 표면을 차단합니다.

## 대상 아키텍처 (두 계층)

### 1) 플러그인 SDK (컴파일 타임, 안정적, 출판 가능)

범위: 타입, 헬퍼, 설정 유틸리티입니다. 런타임 상태 없음, 부작용 없음.

내용 (예):

- 타입: `ChannelPlugin`, 어댑터, `ChannelMeta`, `ChannelCapabilities`, `ChannelDirectoryEntry`.
- 설정 헬퍼: `buildChannelConfigSchema`, `setAccountEnabledInConfigSection`, `deleteAccountFromConfigSection`,
  `applyAccountNameToChannelSection`.
- 페어링 헬퍼: `PAIRING_APPROVED_MESSAGE`, `formatPairingApproveHint`.
- 온보딩 헬퍼: `promptChannelAccessConfig`, `addWildcardAllowFrom`, 온보딩 타입.
- 도구 파라미터 헬퍼: `createActionGate`, `readStringParam`, `readNumberParam`, `readReactionParams`, `jsonResult`.
- 문서 링크 헬퍼: `formatDocsLink`.

배포:

- `openclaw/plugin-sdk`로 출판합니다 (또는 `openclaw/plugin-sdk` 아래에서 코어에서 내보냅니다).
- 명시적 안정성 보장이 있는 Semver.

### 2) 플러그인 런타임 (실행 표면, 주입됨)

범위: 코어 런타임 동작에 영향을 미치는 모든 것입니다.
`OpenClawPluginApi.runtime`을 통해 액세스하므로 플러그인은 `src/**`를 가져오지 않습니다.

제안된 표면 (최소한이지만 완전함):

```ts
export type PluginRuntime = {
  channel: {
    text: {
      chunkMarkdownText(text: string, limit: number): string[];
      resolveTextChunkLimit(cfg: OpenClawConfig, channel: string, accountId?: string): number;
      hasControlCommand(text: string, cfg: OpenClawConfig): boolean;
    };
    reply: {
      dispatchReplyWithBufferedBlockDispatcher(params: {
        ctx: unknown;
        cfg: unknown;
        dispatcherOptions: {
          deliver: (payload: {
            text?: string;
            mediaUrls?: string[];
            mediaUrl?: string;
          }) => void | Promise<void>;
          onError?: (err: unknown, info: { kind: string }) => void;
        };
      }): Promise<void>;
      createReplyDispatcherWithTyping?: unknown; // Teams 스타일 흐름을 위한 어댑터
    };
    routing: {
      resolveAgentRoute(params: {
        cfg: unknown;
        channel: string;
        accountId: string;
        peer: { kind: "dm" | "group" | "channel"; id: string };
      }): { sessionKey: string; accountId: string };
    };
    pairing: {
      buildPairingReply(params: { channel: string; idLine: string; code: string }): string;
      readAllowFromStore(channel: string): Promise<string[]>;
      upsertPairingRequest(params: {
        channel: string;
        id: string;
        meta?: { name?: string };
      }): Promise<{ code: string; created: boolean }>;
    };
    media: {
      fetchRemoteMedia(params: { url: string }): Promise<{ buffer: Buffer; contentType?: string }>;
      saveMediaBuffer(
        buffer: Uint8Array,
        contentType: string | undefined,
        direction: "inbound" | "outbound",
        maxBytes: number,
      ): Promise<{ path: string; contentType?: string }>;
    };
    mentions: {
      buildMentionRegexes(cfg: OpenClawConfig, agentId?: string): RegExp[];
      matchesMentionPatterns(text: string, regexes: RegExp[]): boolean;
    };
    groups: {
      resolveGroupPolicy(
        cfg: OpenClawConfig,
        channel: string,
        accountId: string,
        groupId: string,
      ): {
        allowlistEnabled: boolean;
        allowed: boolean;
        groupConfig?: unknown;
        defaultConfig?: unknown;
      };
      resolveRequireMention(
        cfg: OpenClawConfig,
        channel: string,
        accountId: string,
        groupId: string,
        override?: boolean,
      ): boolean;
    };
    debounce: {
      createInboundDebouncer<T>(opts: {
        debounceMs: number;
        buildKey: (v: T) => string | null;
        shouldDebounce: (v: T) => boolean;
        onFlush: (entries: T[]) => Promise<void>;
        onError?: (err: unknown) => void;
      }): { push: (v: T) => void; flush: () => Promise<void> };
      resolveInboundDebounceMs(cfg: OpenClawConfig, channel: string): number;
    };
    commands: {
      resolveCommandAuthorizedFromAuthorizers(params: {
        useAccessGroups: boolean;
        authorizers: Array<{ configured: boolean; allowed: boolean }>;
      }): boolean;
    };
  };
  logging: {
    shouldLogVerbose(): boolean;
    getChildLogger(name: string): PluginLogger;
  };
  state: {
    resolveStateDir(cfg: OpenClawConfig): string;
  };
};
```

참고:

- 런타임은 코어 동작에 액세스하는 유일한 방법입니다.
- SDK는 의도적으로 작고 안정적입니다.
- 각 런타임 메서드는 기존 코어 구현에 매핑됩니다 (중복 없음).

## 마이그레이션 계획 (단계별, 안전함)

### 단계 0: 스캐폴딩

- `openclaw/plugin-sdk`를 도입합니다.
- `OpenClawPluginApi`에 위의 표면과 함께 `api.runtime`을 추가합니다.
- 전환 기간 동안 기존 가져오기를 유지합니다 (사용 중단 경고).

### 단계 1: 브릿지 정리 (저위험)

- 확장 당 `core-bridge.ts`를 `api.runtime`으로 교체합니다.
- BlueBubbles, Zalo, Zalo Personal을 먼저 마이그레이션합니다 (이미 근접함).
- 중복된 브릿지 코드를 제거합니다.

### 단계 2: 가벼운 직접 가져오기 플러그인

- Matrix를 SDK + 런타임으로 마이그레이션합니다.
- 온보딩, 디렉터리, 그룹 멘션 로직을 검증합니다.

### 단계 3: 무거운 직접 가져오기 플러그인

- MS Teams를 마이그레이션합니다 (가장 큰 런타임 헬퍼 세트).
- 회신/입력 의미론이 현재 동작과 일치하는지 확인합니다.

### 단계 4: iMessage 플러그인화

- iMessage를 `extensions/imessage`로 이동합니다.
- 직접 코어 호출을 `api.runtime`으로 교체합니다.
- 설정 키, CLI 동작, 문서는 그대로 유지합니다.

### 단계 5: 강제화

- 린트 규칙/CI 체크 추가: `extensions/**`는 `src/**`에서 가져오기 없음.
- 플러그인 SDK/버전 호환성 체크 추가 (런타임 + SDK semver).

## 호환성 및 버저닝

- SDK: semver, 출판됨, 문서화된 변경 사항.
- 런타임: 코어 릴리스별 버전 관리입니다. `api.runtime.version`을 추가합니다.
- 플러그인은 필요한 런타임 범위를 선언합니다 (예: `openclawRuntime: ">=2026.2.0"`).

## 테스트 전략

- 어댑터 수준 단위 테스트 (실제 코어 구현으로 실행되는 런타임 함수).
- 플러그인당 황금 테스트: 동작 변동 없음을 보장합니다 (라우팅, 페어링, 허용 목록, 멘션 게이팅).
- CI에서 사용되는 단일 엔드 투 엔드 플러그인 샘플 (설치 + 실행 + 스모크 테스트).

## 미결정 사항

- SDK 타입을 호스팅할 위치: 별도 패키지 또는 코어 내보내기?
- 런타임 타입 배포: SDK 내 (타입만) 또는 코어 내?
- 번들된 플러그인 vs 외부 플러그인에 대한 문서 링크를 어떻게 노출할 것인가?
- 전환 중에 저장소 내 플러그인에 대해 제한된 직접 코어 가져오기를 허용할 것인가?

## 성공 기준

- 모든 채널 커넥터는 SDK + 런타임을 사용하는 플러그인입니다.
- `extensions/**`는 `src/**`에서 가져오기 없음.
- 새로운 커넥터 템플릿은 SDK + 런타임에만 의존합니다.
- 외부 플러그인은 코어 소스 액세스 없이 개발 및 업데이트할 수 있습니다.

관련 문서: [플러그인](/plugin), [채널](/channels/index), [설정](/gateway/configuration).

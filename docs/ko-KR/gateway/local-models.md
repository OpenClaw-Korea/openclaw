---
summary: "로컬 LLM에서 OpenClaw 실행 (LM Studio, vLLM, LiteLLM, 커스텀 OpenAI 엔드포인트)"
read_when:
  - 자체 GPU 박스에서 모델을 서빙하고 싶을 때
  - LM Studio 또는 OpenAI 호환 프록시를 연결할 때
  - 가장 안전한 로컬 모델 가이드가 필요할 때
title: "로컬 모델"
---

# 로컬 모델

로컬은 가능하지만, OpenClaw는 대용량 컨텍스트 + 프롬프트 인젝션에 대한 강력한 방어를 기대합니다. 작은 카드는 컨텍스트를 잘라내고 안전을 누출합니다. 높게 목표하세요: **≥2개의 최대 사양 Mac Studio 또는 동급 GPU 장비 (~$30k+)**. 단일 **24 GB** GPU는 더 높은 지연 시간으로 가벼운 프롬프트에만 작동합니다. **실행할 수 있는 가장 큰 / 전체 크기 모델 변형**을 사용하세요; 공격적으로 양자화되거나 "작은" 체크포인트는 프롬프트 인젝션 위험을 높입니다([보안](/gateway/security) 참조).

## 권장: LM Studio + MiniMax M2.1 (Responses API, 전체 크기)

현재 최고의 로컬 스택입니다. LM Studio에서 MiniMax M2.1을 로드하고, 로컬 서버를 활성화하고(기본값 `http://127.0.0.1:1234`), Responses API를 사용하여 추론을 최종 텍스트와 분리합니다.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.1-gs32" },
      models: {
        "anthropic/claude-opus-4-5": { alias: "Opus" },
        "lmstudio/minimax-m2.1-gs32": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.1-gs32",
            name: "MiniMax M2.1 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**설정 체크리스트**

- LM Studio 설치: https://lmstudio.ai
- LM Studio에서 **사용 가능한 가장 큰 MiniMax M2.1 빌드**를 다운로드하고 ("small"/과도하게 양자화된 변형 피하기), 서버를 시작하고, `http://127.0.0.1:1234/v1/models`에서 나열되는지 확인합니다.
- 모델을 로드 상태로 유지; 콜드 로드는 시작 지연을 추가합니다.
- LM Studio 빌드가 다르면 `contextWindow`/`maxTokens`를 조정합니다.
- WhatsApp의 경우 최종 텍스트만 전송되도록 Responses API를 고수합니다.

로컬 실행 시에도 호스팅된 모델을 설정된 상태로 유지; 폴백이 사용 가능하도록 `models.mode: "merge"`를 사용합니다.

### 하이브리드 설정: 호스팅 기본, 로컬 폴백

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-5",
        fallbacks: ["lmstudio/minimax-m2.1-gs32", "anthropic/claude-opus-4-5"],
      },
      models: {
        "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
        "lmstudio/minimax-m2.1-gs32": { alias: "MiniMax Local" },
        "anthropic/claude-opus-4-5": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.1-gs32",
            name: "MiniMax M2.1 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### 로컬 우선 + 호스팅 안전망

기본과 폴백 순서를 바꿉니다; 동일한 providers 블록과 `models.mode: "merge"`를 유지하여 로컬 박스가 다운되었을 때 Sonnet 또는 Opus로 폴백할 수 있습니다.

### 지역 호스팅 / 데이터 라우팅

- 호스팅된 MiniMax/Kimi/GLM 변형도 지역 고정 엔드포인트(예: US 호스팅)가 있는 OpenRouter에 존재합니다. Anthropic/OpenAI 폴백을 위해 `models.mode: "merge"`를 여전히 사용하면서 선택한 관할권에서 트래픽을 유지하려면 거기서 지역 변형을 선택합니다.
- 로컬 전용이 가장 강력한 프라이버시 경로로 남아 있습니다; 호스팅된 지역 라우팅은 프로바이더 기능이 필요하지만 데이터 흐름에 대한 제어를 원할 때 중간 지점입니다.

## 기타 OpenAI 호환 로컬 프록시

vLLM, LiteLLM, OAI-proxy 또는 커스텀 게이트웨이는 OpenAI 스타일 `/v1` 엔드포인트를 노출하면 작동합니다. 위의 provider 블록을 엔드포인트와 모델 ID로 교체합니다:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

호스팅된 모델이 폴백으로 사용 가능하도록 `models.mode: "merge"`를 유지합니다.

## 문제 해결

- 게이트웨이가 프록시에 도달할 수 있나요? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio 모델이 언로드되었나요? 다시 로드; 콜드 스타트가 일반적인 "멈춤" 원인입니다.
- 컨텍스트 오류? `contextWindow`를 낮추거나 서버 제한을 높입니다.
- 안전: 로컬 모델은 프로바이더 측 필터를 건너뜁니다; 에이전트를 좁게 유지하고 압축을 켜서 프롬프트 인젝션 폭발 반경을 제한합니다.

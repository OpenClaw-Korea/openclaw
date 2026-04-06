---
summary: "OpenClaw가 지원하는 모델 프로바이더(LLM)"
read_when:
  - 모델 프로바이더를 선택하려는 경우
  - LLM 인증 + 모델 선택에 대한 빠른 설정 예제를 원하는 경우
title: "모델 프로바이더 빠른 시작"
---

# 모델 프로바이더

OpenClaw는 다양한 LLM 프로바이더를 사용할 수 있습니다. 하나를 선택하고 인증한 다음 기본 모델을 `provider/model` 형식으로 설정하세요.

## 추천: Venice (Venice AI)

Venice는 프라이버시 우선 추론을 위한 추천 Venice AI 설정이며, 가장 어려운 작업에는 Opus를 사용할 수 있는 옵션이 있습니다.

- 기본: `venice/llama-3.3-70b`
- 전체 최고: `venice/claude-opus-45` (Opus는 여전히 가장 강력함)

[Venice AI](/providers/venice)를 참조하세요.

## 빠른 시작 (두 단계)

1. 프로바이더로 인증합니다(일반적으로 `openclaw onboard` 사용).
2. 기본 모델을 설정합니다:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-5" } } },
}
```

## 지원하는 프로바이더 (시작 세트)

- [OpenAI (API + Codex)](/providers/openai)
- [Anthropic (API + Claude Code CLI)](/providers/anthropic)
- [OpenRouter](/providers/openrouter)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [Synthetic](/providers/synthetic)
- [OpenCode Zen](/providers/opencode)
- [Z.AI](/providers/zai)
- [GLM models](/providers/glm)
- [MiniMax](/providers/minimax)
- [Venice (Venice AI)](/providers/venice)
- [Amazon Bedrock](/bedrock)

전체 프로바이더 카탈로그(xAI, Groq, Mistral 등) 및 고급 설정은
[모델 프로바이더](/concepts/model-providers)를 참조하세요.

---
summary: "예제 설정 + CLI 흐름이 포함된 모델 프로바이더 개요"
read_when:
  - 프로바이더별 모델 설정 참조가 필요한 경우
  - 모델 프로바이더에 대한 예제 설정 또는 CLI 온보딩 명령이 필요한 경우
title: "모델 프로바이더"
---

# 모델 프로바이더

이 페이지는 **LLM/모델 프로바이더**를 다룹니다 (WhatsApp/Telegram과 같은 채팅 채널이 아님). 모델 선택 규칙은 [/concepts/models](/concepts/models)를 참조하세요.

## 빠른 규칙

- 모델 참조는 `provider/model`을 사용합니다 (예: `opencode/claude-opus-4-5`).
- `agents.defaults.models`를 설정하면 허용 목록이 됩니다.
- CLI 도우미: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`

## 내장 프로바이더 (pi-ai 카탈로그)

OpenClaw는 pi‑ai 카탈로그와 함께 제공됩니다. 이러한 프로바이더는 `models.providers` 설정이 **필요하지 않습니다**. 인증을 설정하고 모델을 선택하기만 하면 됩니다.

### OpenAI

- 프로바이더: `openai`
- 인증: `OPENAI_API_KEY`
- 예제 모델: `openai/gpt-5.2`
- CLI: `openclaw onboard --auth-choice openai-api-key`

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.2" } } },
}
```

### Anthropic

- 프로바이더: `anthropic`
- 인증: `ANTHROPIC_API_KEY` 또는 `claude setup-token`
- 예제 모델: `anthropic/claude-opus-4-5`
- CLI: `openclaw onboard --auth-choice token` (setup-token 붙여넣기) 또는 `openclaw models auth paste-token --provider anthropic`

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-5" } } },
}
```

### OpenAI Code (Codex)

- 프로바이더: `openai-codex`
- 인증: OAuth (ChatGPT)
- 예제 모델: `openai-codex/gpt-5.2`
- CLI: `openclaw onboard --auth-choice openai-codex` 또는 `openclaw models auth login --provider openai-codex`

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.2" } } },
}
```

### OpenCode Zen

- 프로바이더: `opencode`
- 인증: `OPENCODE_API_KEY` (또는 `OPENCODE_ZEN_API_KEY`)
- 예제 모델: `opencode/claude-opus-4-5`
- CLI: `openclaw onboard --auth-choice opencode-zen`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-5" } } },
}
```

### Google Gemini (API 키)

- 프로바이더: `google`
- 인증: `GEMINI_API_KEY`
- 예제 모델: `google/gemini-3-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`

### Google Vertex, Antigravity 및 Gemini CLI

- 프로바이더: `google-vertex`, `google-antigravity`, `google-gemini-cli`
- 인증: Vertex는 gcloud ADC를 사용하고, Antigravity/Gemini CLI는 각각의 인증 흐름을 사용합니다.
- Antigravity OAuth는 번들 플러그인 (`google-antigravity-auth`, 기본적으로 비활성화됨)으로 제공됩니다.
  - 활성화: `openclaw plugins enable google-antigravity-auth`
  - 로그인: `openclaw models auth login --provider google-antigravity --set-default`
- Gemini CLI OAuth는 번들 플러그인 (`google-gemini-cli-auth`, 기본적으로 비활성화됨)으로 제공됩니다.
  - 활성화: `openclaw plugins enable google-gemini-cli-auth`
  - 로그인: `openclaw models auth login --provider google-gemini-cli --set-default`
  - 참고: 클라이언트 ID나 시크릿을 `openclaw.json`에 붙여넣을 필요가 **없습니다**. CLI 로그인 흐름은 게이트웨이 호스트의 인증 프로필에 토큰을 저장합니다.

### Z.AI (GLM)

- 프로바이더: `zai`
- 인증: `ZAI_API_KEY`
- 예제 모델: `zai/glm-4.7`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - 별칭: `z.ai/*` 및 `z-ai/*`는 `zai/*`로 정규화됩니다.

### Vercel AI Gateway

- 프로바이더: `vercel-ai-gateway`
- 인증: `AI_GATEWAY_API_KEY`
- 예제 모델: `vercel-ai-gateway/anthropic/claude-opus-4.5`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### 기타 내장 프로바이더

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- 예제 모델: `openrouter/anthropic/claude-sonnet-4-5`
- xAI: `xai` (`XAI_API_KEY`)
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Cerebras의 GLM 모델은 ID `zai-glm-4.7` 및 `zai-glm-4.6`을 사용합니다.
  - OpenAI 호환 기본 URL: `https://api.cerebras.ai/v1`
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)

## `models.providers`를 통한 프로바이더 (사용자 정의/기본 URL)

**사용자 정의** 프로바이더 또는 OpenAI/Anthropic 호환 프록시를 추가하려면 `models.providers` (또는 `models.json`)를 사용합니다.

### Moonshot AI (Kimi)

Moonshot은 OpenAI 호환 엔드포인트를 사용하므로 사용자 정의 프로바이더로 설정합니다:

- 프로바이더: `moonshot`
- 인증: `MOONSHOT_API_KEY`
- 예제 모델: `moonshot/kimi-k2.5`

Kimi K2 모델 ID:

{/_ moonshot-kimi-k2-model-refs:start _/ && null}

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-0905-preview`
- `moonshot/kimi-k2-turbo-preview`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
  {/_ moonshot-kimi-k2-model-refs:end _/ && null}

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding은 Moonshot AI의 Anthropic 호환 엔드포인트를 사용합니다:

- 프로바이더: `kimi-coding`
- 인증: `KIMI_API_KEY`
- 예제 모델: `kimi-coding/k2p5`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi-coding/k2p5" } },
  },
}
```

### Qwen OAuth (무료 티어)

Qwen은 장치 코드 흐름을 통해 Qwen Coder + Vision에 대한 OAuth 액세스를 제공합니다. 번들 플러그인을 활성화한 다음 로그인합니다:

```bash
openclaw plugins enable qwen-portal-auth
openclaw models auth login --provider qwen-portal --set-default
```

모델 참조:

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

설정 세부 정보 및 참고 사항은 [/providers/qwen](/providers/qwen)을 참조하세요.

### Synthetic

Synthetic는 `synthetic` 프로바이더 뒤에 Anthropic 호환 모델을 제공합니다:

- 프로바이더: `synthetic`
- 인증: `SYNTHETIC_API_KEY`
- 예제 모델: `synthetic/hf:MiniMaxAI/MiniMax-M2.1`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.1" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.1", name: "MiniMax M2.1" }],
      },
    },
  },
}
```

### MiniMax

MiniMax는 사용자 정의 엔드포인트를 사용하므로 `models.providers`를 통해 설정됩니다:

- MiniMax (Anthropic‑호환): `--auth-choice minimax-api`
- 인증: `MINIMAX_API_KEY`

설정 세부 정보, 모델 옵션 및 설정 스니펫은 [/providers/minimax](/providers/minimax)를 참조하세요.

### Ollama

Ollama는 OpenAI 호환 API를 제공하는 로컬 LLM 런타임입니다:

- 프로바이더: `ollama`
- 인증: 필요 없음 (로컬 서버)
- 예제 모델: `ollama/llama3.3`
- 설치: https://ollama.ai

```bash
# Ollama를 설치한 다음 모델을 가져옵니다:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama는 `http://127.0.0.1:11434/v1`에서 로컬로 실행될 때 자동으로 감지됩니다. 모델 권장 사항 및 사용자 정의 설정은 [/providers/ollama](/providers/ollama)를 참조하세요.

### 로컬 프록시 (LM Studio, vLLM, LiteLLM 등)

예제 (OpenAI‑호환):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.1-gs32" },
      models: { "lmstudio/minimax-m2.1-gs32": { alias: "Minimax" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "LMSTUDIO_KEY",
        api: "openai-completions",
        models: [
          {
            id: "minimax-m2.1-gs32",
            name: "MiniMax M2.1",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

참고사항:

- 사용자 정의 프로바이더의 경우, `reasoning`, `input`, `cost`, `contextWindow` 및 `maxTokens`는 선택 사항입니다. 생략되면 OpenClaw는 기본값을 사용합니다:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 권장: 프록시/모델 제한과 일치하는 명시적 값을 설정합니다.

## CLI 예제

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-5
openclaw models list
```

전체 설정 예제는 [/gateway/configuration](/gateway/configuration)도 참조하세요.

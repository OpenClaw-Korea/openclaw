---
summary: "OpenClaw에서 Xiaomi MiMo (mimo-v2-flash) 사용"
read_when:
  - OpenClaw에서 Xiaomi MiMo 모델을 사용하고 싶을 때
  - XIAOMI_API_KEY 설정이 필요할 때
title: "Xiaomi MiMo"
---

# Xiaomi MiMo

Xiaomi MiMo는 **MiMo** 모델용 API 플랫폼입니다. OpenAI 및 Anthropic 형식과 호환되는 REST API를 제공하며 API 키를 사용한 인증을 지원합니다. [Xiaomi MiMo 콘솔](https://platform.xiaomimimo.com/#/console/api-keys)에서 API 키를 생성할 수 있습니다. OpenClaw는 Xiaomi MiMo API 키와 함께 `xiaomi` 프로바이더를 사용합니다.

## 모델 개요

- **mimo-v2-flash**: 262144 토큰 컨텍스트 윈도우, Anthropic Messages API 호환.
- 기본 URL: `https://api.xiaomimimo.com/anthropic`
- 인증: `Bearer $XIAOMI_API_KEY`

## CLI 설정

```bash
openclaw onboard --auth-choice xiaomi-api-key
# 또는 비대화형 모드
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## 설정 스니펫

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/anthropic",
        api: "anthropic-messages",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 참고사항

- 모델 참조: `xiaomi/mimo-v2-flash`.
- `XIAOMI_API_KEY`가 설정되거나 인증 프로필이 존재하면 프로바이더가 자동으로 주입됩니다.
- 프로바이더 규칙은 [/concepts/model-providers](/concepts/model-providers)를 참조하세요.

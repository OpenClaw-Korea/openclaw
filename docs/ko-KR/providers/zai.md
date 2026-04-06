---
summary: "OpenClaw에서 Z.AI (GLM 모델) 사용하기"
read_when:
  - OpenClaw에서 Z.AI / GLM 모델을 사용하고 싶을 때
  - 간단한 ZAI_API_KEY 설정이 필요할 때
title: "Z.AI"
---

# Z.AI

Z.AI는 **GLM** 모델을 위한 API 플랫폼입니다. GLM을 위한 REST API를 제공하며 인증을 위해 API 키를 사용합니다. Z.AI 콘솔에서 API 키를 생성할 수 있습니다. OpenClaw는 Z.AI API 키와 함께 `zai` 프로바이더를 사용합니다.

## CLI 설정

```bash
openclaw onboard --auth-choice zai-api-key
# 또는 비대화형
openclaw onboard --zai-api-key "$ZAI_API_KEY"
```

## 설정 예시

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-4.7" } } },
}
```

## 참고사항

- GLM 모델은 `zai/<model>`로 사용 가능합니다 (예: `zai/glm-4.7`).
- 모델 제품군 개요는 [/providers/glm](/providers/glm)을 참조하세요.
- Z.AI는 API 키를 사용한 Bearer 인증을 사용합니다.

---
summary: "GLM 모델 패밀리 개요 + OpenClaw에서 사용하는 방법"
read_when:
  - OpenClaw에서 GLM 모델을 사용하고 싶을 때
  - 모델 명명 규칙과 설정이 필요할 때
title: "GLM 모델"
---

# GLM 모델

GLM은 Z.AI 플랫폼을 통해 제공되는 **모델 패밀리**입니다 (회사가 아닙니다). OpenClaw에서 GLM 모델은 `zai` 프로바이더와 `zai/glm-4.7`과 같은 모델 ID를 통해 액세스합니다.

## CLI 설정

```bash
openclaw onboard --auth-choice zai-api-key
```

## 설정 스니펫

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-4.7" } } },
}
```

## 참고사항

- GLM 버전과 가용성은 변경될 수 있습니다. 최신 정보는 Z.AI 문서를 확인하세요.
- 예시 모델 ID에는 `glm-4.7` 및 `glm-4.6`이 포함됩니다.
- 프로바이더 세부 정보는 [/providers/zai](/providers/zai)를 참조하세요.

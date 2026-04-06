---
summary: "워크플로우용 JSON 전용 LLM 작업 (선택적 플러그인 도구)"
read_when:
  - 워크플로우 내에서 JSON 전용 LLM 단계를 원할 때
  - 자동화를 위해 스키마로 검증된 LLM 출력이 필요할 때
title: "LLM 작업"
---

# LLM 작업

`llm-task`는 JSON 전용 LLM 작업을 실행하고 구조화된 출력(선택적으로 JSON 스키마에 대해 검증됨)을 반환하는 **선택적 플러그인 도구**입니다.

이는 Lobster와 같은 워크플로우 엔진에 이상적입니다. 각 워크플로우에 대해 사용자 정의 OpenClaw 코드를 작성하지 않고도 단일 LLM 단계를 추가할 수 있습니다.

## 플러그인 활성화

1. 플러그인을 활성화합니다:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. 도구를 허용 목록에 추가합니다 (`optional: true`로 등록됨):

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## 설정 (선택사항)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.2",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.2"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels`은 `provider/model` 문자열의 허용 목록입니다. 설정된 경우, 목록 외의 모든 요청은 거부됩니다.

## 도구 파라미터

- `prompt` (문자열, 필수)
- `input` (임의의 값, 선택사항)
- `schema` (객체, 선택사항 JSON 스키마)
- `provider` (문자열, 선택사항)
- `model` (문자열, 선택사항)
- `authProfileId` (문자열, 선택사항)
- `temperature` (숫자, 선택사항)
- `maxTokens` (숫자, 선택사항)
- `timeoutMs` (숫자, 선택사항)

## 출력

파싱된 JSON을 포함하는 `details.json`을 반환합니다(제공된 `schema`에 대해 검증됨).

## 예제: Lobster 워크플로우 단계

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## 안전 참고사항

- 이 도구는 **JSON 전용**이며 모델에 JSON 전용 출력(코드 펜스 없음, 설명 없음)을 지시합니다.
- 이 실행을 위해 모델에 노출되는 도구가 없습니다.
- `schema`로 검증하지 않는 한 출력을 신뢰할 수 없는 것으로 취급합니다.
- 부작용이 있는 단계(전송, 게시, 실행) 전에 승인을 해야 합니다.

---
summary: "계획: OpenResponses /v1/responses 엔드포인트 추가 및 Chat Completions 정리된 방식으로 단계 폐기"
owner: "openclaw"
status: "draft"
last_updated: "2026-01-19"
title: "OpenResponses 게이트웨이 계획"
---

# OpenResponses 게이트웨이 통합 계획

## 컨텍스트

OpenClaw 게이트웨이는 현재 `POST /v1/chat/completions` 위치에서 최소한의 OpenAI 호환 Chat Completions 엔드포인트를 제공합니다 ([OpenAI Chat Completions](/gateway/openai-http-api) 참조).

Open Responses는 OpenAI Responses API를 기반으로 한 개방형 추론 표준입니다. 에이전트 워크플로우를 위해 설계되었으며 아이템 기반 입력과 의미론적 스트리밍 이벤트를 사용합니다. OpenResponses 사양은 `/v1/chat/completions`가 아닌 `/v1/responses`를 정의합니다.

## 목표

- OpenResponses 의미론에 따르는 `/v1/responses` 엔드포인트를 추가합니다.
- Chat Completions를 비활성화하기 쉽고 결국 제거할 수 있는 호환성 계층으로 유지합니다.
- 격리되고 재사용 가능한 스키마로 검증 및 파싱을 표준화합니다.

## 제외 항목

- 첫 단계에서 전체 OpenResponses 기능 패리티 (이미지, 파일, 호스팅된 도구).
- 내부 에이전트 실행 로직 또는 도구 오케스트레이션 변경.
- 첫 번째 단계에서 기존 `/v1/chat/completions` 동작 변경.

## 연구 요약

출처: OpenResponses OpenAPI, OpenResponses 사양 사이트 및 Hugging Face 블로그 게시물.

추출된 핵심 사항:

- `POST /v1/responses`는 `CreateResponseBody` 필드 (예: `model`, `input` (문자열 또는 `ItemParam[]`), `instructions`, `tools`, `tool_choice`, `stream`, `max_output_tokens`, `max_tool_calls`)를 허용합니다.
- `ItemParam`은 다음의 판별된 합집합입니다:
  - `system`, `developer`, `user`, `assistant` 역할을 가진 `message` 아이템
  - `function_call` 및 `function_call_output`
  - `reasoning`
  - `item_reference`
- 성공적인 응답은 `object: "response"`, `status`, `output` 아이템을 포함한 `ResponseResource`를 반환합니다.
- 스트리밍은 다음과 같은 의미론적 이벤트를 사용합니다:
  - `response.created`, `response.in_progress`, `response.completed`, `response.failed`
  - `response.output_item.added`, `response.output_item.done`
  - `response.content_part.added`, `response.content_part.done`
  - `response.output_text.delta`, `response.output_text.done`
- 사양에서는 다음을 요구합니다:
  - `Content-Type: text/event-stream`
  - `event:`는 JSON `type` 필드와 일치해야 합니다
  - 종료 이벤트는 리터럴 `[DONE]`이어야 합니다
- Reasoning 아이템은 `content`, `encrypted_content`, `summary`를 노출할 수 있습니다.
- HF 예제는 요청에 `OpenResponses-Version: latest`를 포함합니다 (선택적 헤더).

## 제안된 아키텍처

- `src/gateway/open-responses.schema.ts`를 추가합니다 (Zod 스키마만 포함, 게이트웨이 임포트 없음).
- `/v1/responses`를 위해 `src/gateway/openresponses-http.ts` (또는 `open-responses-http.ts`)를 추가합니다.
- `src/gateway/openai-http.ts`를 레거시 호환성 어댑터로 유지합니다.
- 설정 `gateway.http.endpoints.responses.enabled` 추가 (기본값 `false`).
- `gateway.http.endpoints.chatCompletions.enabled`는 독립적으로 유지; 두 엔드포인트를 별도로 토글할 수 있습니다.
- Chat Completions가 활성화되면 시작 시 경고를 발생시켜 레거시 상태를 신호합니다.

## Chat Completions 단계 폐기 경로

- 엄격한 모듈 경계 유지: responses와 chat completions 사이에 공유 스키마 타입이 없습니다.
- Chat Completions를 설정으로 옵트인하여 코드 변경 없이 비활성화할 수 있습니다.
- 문서를 업데이트하여 `/v1/responses`가 안정적이 되면 Chat Completions를 레거시로 표시합니다.
- 선택적 미래 단계: Chat Completions 요청을 Responses 핸들러로 매핑하여 더 간단한 제거 경로를 제공합니다.

## Phase 1 지원 부분집합

- `input`을 문자열 또는 메시지 역할 및 `function_call_output`을 가진 `ItemParam[]`로 허용합니다.
- 시스템 및 개발자 메시지를 `extraSystemPrompt`로 추출합니다.
- 가장 최근의 `user` 또는 `function_call_output`을 에이전트 실행을 위한 현재 메시지로 사용합니다.
- 지원하지 않는 콘텐츠 부분 (이미지/파일)을 `invalid_request_error`로 거부합니다.
- 단일 어시스턴트 메시지를 `output_text` 콘텐츠로 반환합니다.
- 토큰 계산이 연결될 때까지 0으로 채운 값과 함께 `usage`를 반환합니다.

## 검증 전략 (SDK 없음)

- 지원되는 부분집합을 위해 Zod 스키마를 구현합니다:
  - `CreateResponseBody`
  - `ItemParam` + 메시지 콘텐츠 부분 합집합
  - `ResponseResource`
  - 게이트웨이에서 사용하는 스트리밍 이벤트 형태
- 드리프트를 방지하고 향후 코드 생성을 허용하기 위해 스키마를 단일 격리된 모듈에 유지합니다.

## 스트리밍 구현 (Phase 1)

- `event:`와 `data:`를 모두 포함한 SSE 라인.
- 필수 시퀀스 (최소 실행 가능):
  - `response.created`
  - `response.output_item.added`
  - `response.content_part.added`
  - `response.output_text.delta` (필요에 따라 반복)
  - `response.output_text.done`
  - `response.content_part.done`
  - `response.completed`
  - `[DONE]`

## 테스트 및 검증 계획

- `/v1/responses`에 대한 e2e 커버리지를 추가합니다:
  - 인증 필수
  - 비스트리밍 응답 형태
  - 스트리밍 이벤트 순서 및 `[DONE]`
  - 헤더 및 `user`를 포함한 세션 라우팅
- `src/gateway/openai-http.e2e.test.ts`를 변경 없이 유지합니다.
- 수동: `curl`로 `stream: true`를 사용하여 `/v1/responses`에 접근하고 이벤트 순서 및 종료 `[DONE]`을 확인합니다.

## 문서 업데이트 (후속 작업)

- `/v1/responses` 사용 및 예제를 위한 새 문서 페이지를 추가합니다.
- `/gateway/openai-http-api`를 레거시 참고사항 및 `/v1/responses`로의 포인터로 업데이트합니다.

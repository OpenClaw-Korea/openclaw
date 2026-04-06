---
summary: "게이트웨이에서 OpenResponses 호환 /v1/responses HTTP 엔드포인트 노출"
read_when:
  - OpenResponses API를 사용하는 클라이언트를 통합할 때
  - 아이템 기반 입력, 클라이언트 도구 호출 또는 SSE 이벤트가 필요할 때
title: "OpenResponses API"
---

# OpenResponses API (HTTP)

OpenClaw의 게이트웨이는 OpenResponses 호환 `POST /v1/responses` 엔드포인트를 제공할 수 있습니다.

이 엔드포인트는 **기본적으로 비활성화되어 있습니다**. 먼저 설정에서 활성화하세요.

- `POST /v1/responses`
- 게이트웨이와 동일한 포트 (WS + HTTP 멀티플렉싱): `http://<gateway-host>:<port>/v1/responses`

내부적으로, 요청은 일반적인 게이트웨이 에이전트 실행(동일한 `openclaw agent` 코드 경로)으로 실행되므로, 라우팅/권한/설정이 게이트웨이와 일치합니다.

## 인증

게이트웨이 인증 설정을 사용합니다. 베어러 토큰을 전송하세요:

- `Authorization: Bearer <token>`

참고:

- `gateway.auth.mode="token"`일 때는 `gateway.auth.token` (또는 `OPENCLAW_GATEWAY_TOKEN`)을 사용하세요.
- `gateway.auth.mode="password"`일 때는 `gateway.auth.password` (또는 `OPENCLAW_GATEWAY_PASSWORD`)를 사용하세요.

## 에이전트 선택

커스텀 헤더가 필요하지 않습니다. OpenResponses `model` 필드에 에이전트 ID를 인코딩하세요:

- `model: "openclaw:<agentId>"` (예: `"openclaw:main"`, `"openclaw:beta"`)
- `model: "agent:<agentId>"` (별칭)

또는 헤더를 사용하여 특정 OpenClaw 에이전트를 대상으로 지정하세요:

- `x-openclaw-agent-id: <agentId>` (기본값: `main`)

고급 옵션:

- `x-openclaw-session-key: <sessionKey>` 세션 라우팅을 완전히 제어할 수 있습니다.

## 엔드포인트 활성화

`gateway.http.endpoints.responses.enabled`를 `true`로 설정하세요:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: { enabled: true },
      },
    },
  },
}
```

## 엔드포인트 비활성화

`gateway.http.endpoints.responses.enabled`를 `false`로 설정하세요:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: { enabled: false },
      },
    },
  },
}
```

## 세션 동작

기본적으로 엔드포인트는 **요청당 상태 비저장** (매 호출마다 새로운 세션 키가 생성됨)입니다.

요청에 OpenResponses `user` 문자열이 포함되면, 게이트웨이는 이로부터 안정적인 세션 키를 유도하므로 반복되는 호출이 에이전트 세션을 공유할 수 있습니다.

## 요청 형식 (지원됨)

요청은 아이템 기반 입력이 포함된 OpenResponses API를 따릅니다. 현재 지원 사항:

- `input`: 문자열 또는 아이템 객체 배열
- `instructions`: 시스템 프롬프트에 병합됨
- `tools`: 클라이언트 도구 정의 (함수 도구)
- `tool_choice`: 클라이언트 도구를 필터링하거나 필수로 지정
- `stream`: SSE 스트리밍 활성화
- `max_output_tokens`: 최선의 노력으로 출력 제한 (프로바이더 의존)
- `user`: 안정적인 세션 라우팅

수락되지만 **현재 무시됨**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `previous_response_id`
- `truncation`

## 아이템 (입력)

### `message`

역할: `system`, `developer`, `user`, `assistant`

- `system`과 `developer`는 시스템 프롬프트에 추가됩니다.
- 가장 최근의 `user` 또는 `function_call_output` 아이템이 "현재 메시지"가 됩니다.
- 이전 user/assistant 메시지는 컨텍스트용 이력으로 포함됩니다.

### `function_call_output` (턴 기반 도구)

모델에 도구 결과를 다시 보내세요:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning`과 `item_reference`

스키마 호환성을 위해 수락되지만 프롬프트 구성 시 무시됩니다.

## 도구 (클라이언트 측 함수 도구)

`tools: [{ type: "function", function: { name, description?, parameters? } }]`로 도구를 제공하세요.

에이전트가 도구를 호출하기로 결정하면, 응답은 `function_call` 출력 아이템을 반환합니다.
그런 다음 `function_call_output`이 포함된 후속 요청을 전송하여 턴을 계속하세요.

## 이미지 (`input_image`)

base64 또는 URL 소스를 지원합니다:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

허용된 MIME 타입 (현재): `image/jpeg`, `image/png`, `image/gif`, `image/webp`
최대 크기 (현재): 10MB

## 파일 (`input_file`)

base64 또는 URL 소스를 지원합니다:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

허용된 MIME 타입 (현재): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`

최대 크기 (현재): 5MB

현재 동작:

- 파일 내용은 디코딩되어 **시스템 프롬프트**에 추가되며, 사용자 메시지가 아니므로 임시 상태이며(세션 이력에 지속되지 않음).
- PDF는 텍스트로 파싱됩니다. 텍스트가 거의 발견되지 않으면, 첫 페이지가 래스터화되어 이미지로 변환되고 모델에 전달됩니다.

PDF 파싱은 Node 친화적인 `pdfjs-dist` 레거시 빌드를 사용합니다 (워커 없음). 최신 PDF.js 빌드는 브라우저 워커/DOM 전역을 예상하므로 게이트웨이에서 사용되지 않습니다.

URL 페치 기본값:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- 요청은 보호됨 (DNS 해석, 프라이빗 IP 차단, 리다이렉트 제한, 타임아웃)

## 파일 + 이미지 제한 (설정)

기본값은 `gateway.http.endpoints.responses`에서 조정할 수 있습니다:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          files: {
            allowUrl: true,
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            allowedMimes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

생략할 때 기본값:

- `maxBodyBytes`: 20MB
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s

## 스트리밍 (SSE)

`stream: true`를 설정하면 Server-Sent Events (SSE)를 수신합니다:

- `Content-Type: text/event-stream`
- 각 이벤트 라인은 `event: <type>`과 `data: <json>`입니다
- 스트림은 `data: [DONE]`으로 종료됩니다

현재 발행되는 이벤트 타입:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (오류 시)

## 사용량

`usage`는 기본 프로바이더가 토큰 개수를 보고할 때 채워집니다.

## 오류

오류는 다음과 같은 JSON 객체를 사용합니다:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

일반적인 경우:

- `401` 누락되었거나 유효하지 않은 인증
- `400` 유효하지 않은 요청 본문
- `405` 잘못된 메서드

## 예제

스트리밍 없음:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

스트리밍:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

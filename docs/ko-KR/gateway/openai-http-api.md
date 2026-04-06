---
summary: "게이트웨이에서 OpenAI 호환 /v1/chat/completions HTTP 엔드포인트 제공"
read_when:
  - OpenAI Chat Completions를 기대하는 도구 통합
title: "OpenAI Chat Completions"
---

# OpenAI Chat Completions (HTTP)

OpenClaw의 게이트웨이는 작은 규모의 OpenAI 호환 Chat Completions 엔드포인트를 제공할 수 있습니다.

이 엔드포인트는 **기본적으로 비활성화되어 있습니다**. 먼저 설정에서 활성화해야 합니다.

- `POST /v1/chat/completions`
- 게이트웨이와 동일한 포트 (WS + HTTP 멀티플렉스): `http://<gateway-host>:<port>/v1/chat/completions`

내부적으로 요청은 일반적인 게이트웨이 에이전트 실행(openclaw agent와 동일한 코드 경로)으로 실행되므로, 라우팅/권한/설정이 게이트웨이와 일치합니다.

## 인증

게이트웨이 인증 설정을 사용합니다. 베어러 토큰을 전송합니다:

- `Authorization: Bearer <token>`

참고사항:

- `gateway.auth.mode="token"`인 경우, `gateway.auth.token` (또는 `OPENCLAW_GATEWAY_TOKEN`)을 사용합니다.
- `gateway.auth.mode="password"`인 경우, `gateway.auth.password` (또는 `OPENCLAW_GATEWAY_PASSWORD`)을 사용합니다.

## 에이전트 선택

커스텀 헤더가 필요하지 않습니다. OpenAI `model` 필드에 에이전트 ID를 인코딩합니다:

- `model: "openclaw:<agentId>"` (예: `"openclaw:main"`, `"openclaw:beta"`)
- `model: "agent:<agentId>"` (별칭)

또는 헤더로 특정 OpenClaw 에이전트를 대상으로 합니다:

- `x-openclaw-agent-id: <agentId>` (기본값: `main`)

고급:

- `x-openclaw-session-key: <sessionKey>`를 사용하여 세션 라우팅을 완전히 제어합니다.

## 엔드포인트 활성화

`gateway.http.endpoints.chatCompletions.enabled`를 `true`로 설정합니다:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## 엔드포인트 비활성화

`gateway.http.endpoints.chatCompletions.enabled`를 `false`로 설정합니다:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## 세션 동작

기본적으로 엔드포인트는 **요청당 상태 비저장**(매번 호출할 때마다 새로운 세션 키가 생성됨)입니다.

요청에 OpenAI `user` 문자열이 포함된 경우, 게이트웨이는 이를 기반으로 안정적인 세션 키를 생성하므로 반복되는 호출이 에이전트 세션을 공유할 수 있습니다.

## 스트리밍 (SSE)

서버 전송 이벤트(SSE)를 받으려면 `stream: true`를 설정합니다:

- `Content-Type: text/event-stream`
- 각 이벤트 줄은 `data: <json>`입니다
- 스트림은 `data: [DONE]`으로 종료됩니다

## 예제

비스트리밍:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

스트리밍:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

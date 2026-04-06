---
summary: "웨이크 및 격리 에이전트 실행을 위한 웹훅 인그레스"
read_when:
  - 웹훅 엔드포인트 추가 또는 변경
  - 외부 시스템을 OpenClaw에 연결
title: "웹훅"
---

# 웹훅

게이트웨이는 외부 트리거를 위한 작은 HTTP 웹훅 엔드포인트를 노출할 수 있습니다.

## 활성화

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

참고사항:

- `hooks.enabled=true`일 때 `hooks.token`이 필요합니다.
- `hooks.path`는 기본적으로 `/hooks`입니다.

## 인증

모든 요청에는 훅 토큰이 포함되어야 합니다. 헤더를 선호합니다:

- `Authorization: Bearer <token>` (권장)
- `x-openclaw-token: <token>`
- `?token=<token>` (더 이상 사용되지 않음; 경고를 기록하며 향후 주요 릴리스에서 제거될 예정)

## 엔드포인트

### `POST /hooks/wake`

페이로드:

```json
{ "text": "System line", "mode": "now" }
```

- `text` **필수** (문자열): 이벤트 설명 (예: "New email received").
- `mode` 선택 사항 (`now` | `next-heartbeat`): 즉시 하트비트를 트리거할지 (기본값 `now`) 또는 다음 주기적 확인을 기다릴지 여부.

효과:

- **메인** 세션에 대한 시스템 이벤트를 큐에 넣습니다
- `mode=now`이면 즉시 하트비트를 트리거합니다

### `POST /hooks/agent`

페이로드:

```json
{
  "message": "Run this",
  "name": "Email",
  "sessionKey": "hook:email:msg-123",
  "wakeMode": "now",
  "deliver": true,
  "channel": "last",
  "to": "+15551234567",
  "model": "openai/gpt-5.2-mini",
  "thinking": "low",
  "timeoutSeconds": 120
}
```

- `message` **필수** (문자열): 에이전트가 처리할 프롬프트 또는 메시지.
- `name` 선택 사항 (문자열): 훅의 사람이 읽을 수 있는 이름 (예: "GitHub"), 세션 요약의 접두사로 사용됩니다.
- `sessionKey` 선택 사항 (문자열): 에이전트의 세션을 식별하는 데 사용되는 키. 기본값은 무작위 `hook:<uuid>`입니다. 일관된 키를 사용하면 훅 컨텍스트 내에서 다중 턴 대화가 가능합니다.
- `wakeMode` 선택 사항 (`now` | `next-heartbeat`): 즉시 하트비트를 트리거할지 (기본값 `now`) 또는 다음 주기적 확인을 기다릴지 여부.
- `deliver` 선택 사항 (불리언): `true`이면 에이전트의 응답이 메시징 채널로 전송됩니다. 기본값은 `true`입니다. 하트비트 승인만 있는 응답은 자동으로 건너뜁니다.
- `channel` 선택 사항 (문자열): 전달을 위한 메시징 채널. 다음 중 하나: `last`, `whatsapp`, `telegram`, `discord`, `slack`, `mattermost` (플러그인), `signal`, `imessage`, `msteams`. 기본값은 `last`입니다.
- `to` 선택 사항 (문자열): 채널의 수신자 식별자 (예: WhatsApp/Signal의 전화번호, Telegram의 채팅 ID, Discord/Slack/Mattermost (플러그인)의 채널 ID, MS Teams의 대화 ID). 메인 세션의 마지막 수신자로 기본 설정됩니다.
- `model` 선택 사항 (문자열): 모델 재정의 (예: `anthropic/claude-3-5-sonnet` 또는 별칭). 제한된 경우 허용된 모델 목록에 있어야 합니다.
- `thinking` 선택 사항 (문자열): 씽킹 수준 재정의 (예: `low`, `medium`, `high`).
- `timeoutSeconds` 선택 사항 (숫자): 에이전트 실행의 최대 지속 시간 (초).

효과:

- **격리된** 에이전트 턴 실행 (자체 세션 키)
- 항상 **메인** 세션에 요약을 게시합니다
- `wakeMode=now`이면 즉시 하트비트를 트리거합니다

### `POST /hooks/<name>` (매핑됨)

사용자 지정 훅 이름은 `hooks.mappings`를 통해 해결됩니다 (설정 참조). 매핑은 임의의 페이로드를 `wake` 또는 `agent` 작업으로 변환할 수 있으며, 선택적 템플릿 또는 코드 변환을 사용합니다.

매핑 옵션 (요약):

- `hooks.presets: ["gmail"]`은 내장 Gmail 매핑을 활성화합니다.
- `hooks.mappings`를 사용하면 설정에서 `match`, `action` 및 템플릿을 정의할 수 있습니다.
- `hooks.transformsDir` + `transform.module`은 사용자 지정 로직을 위한 JS/TS 모듈을 로드합니다.
- `match.source`를 사용하여 일반 수집 엔드포인트 (페이로드 기반 라우팅)를 유지합니다.
- TS 변환에는 TS 로더 (예: `bun` 또는 `tsx`) 또는 런타임에 미리 컴파일된 `.js`가 필요합니다.
- 응답을 채팅 표면으로 라우팅하려면 매핑에서 `deliver: true` + `channel`/`to`를 설정하세요
  (`channel`은 기본적으로 `last`이며 WhatsApp으로 폴백됩니다).
- `allowUnsafeExternalContent: true`는 해당 훅에 대한 외부 콘텐츠 안전 래퍼를 비활성화합니다
  (위험; 신뢰할 수 있는 내부 소스에만 해당).
- `openclaw webhooks gmail setup`은 `openclaw webhooks gmail run`을 위한 `hooks.gmail` 설정을 작성합니다.
  전체 Gmail 감시 흐름은 [Gmail Pub/Sub](/automation/gmail-pubsub)를 참조하세요.

## 응답

- `/hooks/wake`의 경우 `200`
- `/hooks/agent`의 경우 `202` (비동기 실행 시작됨)
- 인증 실패 시 `401`
- 잘못된 페이로드 시 `400`
- 초과 크기 페이로드 시 `413`

## 예제

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","wakeMode":"next-heartbeat"}'
```

### 다른 모델 사용

해당 실행에 대한 모델을 재정의하려면 에이전트 페이로드 (또는 매핑)에 `model`을 추가하세요:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.2-mini"}'
```

`agents.defaults.models`를 적용하는 경우 재정의 모델이 거기에 포함되어 있는지 확인하세요.

```bash
curl -X POST http://127.0.0.1:18789/hooks/gmail \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"source":"gmail","messages":[{"from":"Ada","subject":"Hello","snippet":"Hi"}]}'
```

## 보안

- 훅 엔드포인트를 루프백, tailnet 또는 신뢰할 수 있는 역방향 프록시 뒤에 유지하세요.
- 전용 훅 토큰을 사용하세요; 게이트웨이 인증 토큰을 재사용하지 마세요.
- 웹훅 로그에 민감한 원시 페이로드를 포함하지 마세요.
- 훅 페이로드는 신뢰할 수 없는 것으로 처리되며 기본적으로 안전 경계로 래핑됩니다.
  특정 훅에 대해 이를 비활성화해야 하는 경우 해당 훅의 매핑에서 `allowUnsafeExternalContent: true`를 설정하세요 (위험).

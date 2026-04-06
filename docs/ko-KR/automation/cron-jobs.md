---
summary: "게이트웨이 스케줄러를 위한 크론 작업 + 웨이크업"
read_when:
  - 백그라운드 작업 또는 웨이크업 스케줄링
  - 하트비트와 함께 또는 하트비트와 함께 실행되어야 하는 자동화 연결
  - 예약된 작업에 대해 하트비트와 크론 중 선택
title: "크론 작업"
---

# 크론 작업 (게이트웨이 스케줄러)

> **크론 vs 하트비트?** 각각을 사용해야 하는 시기에 대한 지침은 [크론 vs 하트비트](/automation/cron-vs-heartbeat)를 참조하세요.

크론은 게이트웨이의 내장 스케줄러입니다. 작업을 영구 저장하고, 적절한 시간에 에이전트를 깨우며, 선택적으로 출력을 채팅으로 다시 전달할 수 있습니다.

_"매일 아침 이것을 실행"_ 또는 *"20분 후에 에이전트 호출"*을 원한다면, 크론이 그 메커니즘입니다.

## TL;DR

- 크론은 **게이트웨이 내부**에서 실행됩니다 (모델 내부가 아닙니다).
- 작업은 `~/.openclaw/cron/` 아래에 영구 저장되므로 재시작 시 스케줄이 손실되지 않습니다.
- 두 가지 실행 스타일:
  - **메인 세션**: 시스템 이벤트를 큐에 넣은 다음 다음 하트비트에서 실행합니다.
  - **격리**: `cron:<jobId>`에서 전용 에이전트 턴을 실행하고, 선택적으로 출력을 전달합니다.
- 웨이크업은 일급 기능입니다: 작업은 "지금 깨우기" 대 "다음 하트비트"를 요청할 수 있습니다.

## 빠른 시작 (실행 가능)

일회성 리마인더를 생성하고, 존재하는지 확인하고, 즉시 실행합니다:

```bash
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

openclaw cron list
openclaw cron run <job-id> --force
openclaw cron runs --id <job-id>
```

전달이 포함된 반복 격리 작업 스케줄링:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --deliver \
  --channel slack \
  --to "channel:C1234567890"
```

## 도구 호출 동등 항목 (게이트웨이 크론 도구)

정식 JSON 형태와 예제는 [도구 호출을 위한 JSON 스키마](/automation/cron-jobs#json-schema-for-tool-calls)를 참조하세요.

## 크론 작업이 저장되는 위치

크론 작업은 기본적으로 게이트웨이 호스트의 `~/.openclaw/cron/jobs.json`에 영구 저장됩니다.
게이트웨이는 파일을 메모리에 로드하고 변경 시 다시 기록하므로, 게이트웨이가 중지된 경우에만 수동 편집이 안전합니다. 변경 사항은 `openclaw cron add/edit` 또는 크론 도구 호출 API를 사용하는 것이 좋습니다.

## 초보자 친화적 개요

크론 작업을 다음과 같이 생각하세요: **언제** 실행할지 + **무엇을** 할지.

1. **스케줄 선택**
   - 일회성 리마인더 → `schedule.kind = "at"` (CLI: `--at`)
   - 반복 작업 → `schedule.kind = "every"` 또는 `schedule.kind = "cron"`
   - ISO 타임스탬프에 타임존이 생략된 경우 **UTC**로 처리됩니다.

2. **실행 위치 선택**
   - `sessionTarget: "main"` → 메인 컨텍스트로 다음 하트비트 동안 실행합니다.
   - `sessionTarget: "isolated"` → `cron:<jobId>`에서 전용 에이전트 턴을 실행합니다.

3. **페이로드 선택**
   - 메인 세션 → `payload.kind = "systemEvent"`
   - 격리 세션 → `payload.kind = "agentTurn"`

선택 사항: `deleteAfterRun: true`는 성공한 일회성 작업을 저장소에서 제거합니다.

## 개념

### 작업

크론 작업은 다음을 포함하는 저장된 레코드입니다:

- **스케줄** (언제 실행되어야 하는지),
- **페이로드** (무엇을 해야 하는지),
- 선택적 **전달** (출력을 어디로 보내야 하는지).
- 선택적 **에이전트 바인딩** (`agentId`): 특정 에이전트에서 작업을 실행합니다; 누락되었거나 알 수 없는 경우 게이트웨이는 기본 에이전트로 폴백합니다.

작업은 안정적인 `jobId`로 식별됩니다 (CLI/게이트웨이 API에서 사용).
에이전트 도구 호출에서 `jobId`는 정식이며; 레거시 `id`는 호환성을 위해 허용됩니다.
작업은 선택적으로 `deleteAfterRun: true`를 통해 성공적인 일회성 실행 후 자동 삭제할 수 있습니다.

### 스케줄

크론은 세 가지 스케줄 종류를 지원합니다:

- `at`: 일회성 타임스탬프 (에포크 이후 ms). 게이트웨이는 ISO 8601을 허용하고 UTC로 강제 변환합니다.
- `every`: 고정 간격 (ms).
- `cron`: 선택적 IANA 타임존이 있는 5필드 크론 표현식.

크론 표현식은 `croner`를 사용합니다. 타임존이 생략된 경우 게이트웨이 호스트의 로컬 타임존이 사용됩니다.

### 메인 vs 격리 실행

#### 메인 세션 작업 (시스템 이벤트)

메인 작업은 시스템 이벤트를 큐에 넣고 선택적으로 하트비트 러너를 깨웁니다.
`payload.kind = "systemEvent"`를 사용해야 합니다.

- `wakeMode: "next-heartbeat"` (기본값): 이벤트가 다음 예약된 하트비트를 기다립니다.
- `wakeMode: "now"`: 이벤트가 즉시 하트비트 실행을 트리거합니다.

이는 정상적인 하트비트 프롬프트 + 메인 세션 컨텍스트를 원할 때 가장 적합합니다.
[하트비트](/gateway/heartbeat)를 참조하세요.

#### 격리 작업 (전용 크론 세션)

격리 작업은 세션 `cron:<jobId>`에서 전용 에이전트 턴을 실행합니다.

주요 동작:

- 프롬프트는 추적성을 위해 `[cron:<jobId> <job name>]`으로 접두사가 붙습니다.
- 각 실행은 **새로운 세션 id**를 시작합니다 (이전 대화 이월 없음).
- 요약이 메인 세션에 게시됩니다 (접두사 `Cron`, 구성 가능).
- `wakeMode: "now"`는 요약을 게시한 후 즉시 하트비트를 트리거합니다.
- `payload.deliver: true`이면 출력이 채널로 전달됩니다; 그렇지 않으면 내부에 유지됩니다.

메인 채팅 기록을 스팸하지 않아야 하는 시끄럽고 빈번하거나 "백그라운드 작업"에는 격리 작업을 사용하세요.

### 페이로드 형태 (실행되는 것)

두 가지 페이로드 종류가 지원됩니다:

- `systemEvent`: 메인 세션 전용, 하트비트 프롬프트를 통해 라우팅됩니다.
- `agentTurn`: 격리 세션 전용, 전용 에이전트 턴을 실행합니다.

일반적인 `agentTurn` 필드:

- `message`: 필수 텍스트 프롬프트.
- `model` / `thinking`: 선택적 재정의 (아래 참조).
- `timeoutSeconds`: 선택적 타임아웃 재정의.
- `deliver`: `true`로 설정하면 출력을 채널 대상으로 보냅니다.
- `channel`: `last` 또는 특정 채널.
- `to`: 채널별 대상 (전화/채팅/채널 ID).
- `bestEffortDeliver`: 전달 실패 시 작업 실패를 방지합니다.

격리 옵션 (`session=isolated`에만 해당):

- `postToMainPrefix` (CLI: `--post-prefix`): 메인의 시스템 이벤트에 대한 접두사.
- `postToMainMode`: `summary` (기본값) 또는 `full`.
- `postToMainMaxChars`: `postToMainMode=full`일 때 최대 문자 (기본값 8000).

### 모델 및 씽킹 재정의

격리 작업 (`agentTurn`)은 모델 및 씽킹 수준을 재정의할 수 있습니다:

- `model`: 프로바이더/모델 문자열 (예: `anthropic/claude-sonnet-4-20250514`) 또는 별칭 (예: `opus`)
- `thinking`: 씽킹 수준 (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`; GPT-5.2 + Codex 모델만 해당)

참고: 메인 세션 작업에도 `model`을 설정할 수 있지만 공유 메인 세션 모델을 변경합니다. 예상치 못한 컨텍스트 이동을 방지하려면 격리 작업에만 모델 재정의를 사용하는 것이 좋습니다.

해결 우선순위:

1. 작업 페이로드 재정의 (최우선)
2. 훅별 기본값 (예: `hooks.gmail.model`)
3. 에이전트 설정 기본값

### 전달 (채널 + 대상)

격리 작업은 출력을 채널로 전달할 수 있습니다. 작업 페이로드는 다음을 지정할 수 있습니다:

- `channel`: `whatsapp` / `telegram` / `discord` / `slack` / `mattermost` (플러그인) / `signal` / `imessage` / `last`
- `to`: 채널별 수신자 대상

`channel` 또는 `to`가 생략된 경우, 크론은 메인 세션의 "마지막 경로"로 폴백할 수 있습니다 (에이전트가 마지막으로 응답한 위치).

전달 참고사항:

- `to`가 설정된 경우, `deliver`가 생략되어도 크론은 에이전트의 최종 출력을 자동으로 전달합니다.
- 명시적인 `to` 없이 마지막 경로 전달을 원할 때는 `deliver: true`를 사용하세요.
- `to`가 있어도 출력을 내부에 유지하려면 `deliver: false`를 사용하세요.

대상 형식 리마인더:

- Slack/Discord/Mattermost (플러그인) 대상은 모호성을 피하기 위해 명시적 접두사를 사용해야 합니다 (예: `channel:<id>`, `user:<id>`).
- Telegram 토픽은 `:topic:` 형식을 사용해야 합니다 (아래 참조).

#### Telegram 전달 대상 (토픽 / 포럼 스레드)

Telegram은 `message_thread_id`를 통해 포럼 토픽을 지원합니다. 크론 전달의 경우 토픽/스레드를 `to` 필드에 인코딩할 수 있습니다:

- `-1001234567890` (채팅 ID만)
- `-1001234567890:topic:123` (권장: 명시적 토픽 마커)
- `-1001234567890:123` (단축형: 숫자 접미사)

`telegram:...` / `telegram:group:...`과 같은 접두사가 붙은 대상도 허용됩니다:

- `telegram:group:-1001234567890:topic:123`

## 도구 호출을 위한 JSON 스키마

게이트웨이 `cron.*` 도구를 직접 호출할 때 (에이전트 도구 호출 또는 RPC) 이러한 형태를 사용하세요.
CLI 플래그는 `20m`과 같은 사람이 읽을 수 있는 기간을 허용하지만, 도구 호출은 `atMs` 및 `everyMs`에 대해 에포크 밀리초를 사용합니다 (`at` 시간에 대해서는 ISO 타임스탬프가 허용됩니다).

### cron.add params

일회성, 메인 세션 작업 (시스템 이벤트):

```json
{
  "name": "Reminder",
  "schedule": { "kind": "at", "atMs": 1738262400000 },
  "sessionTarget": "main",
  "wakeMode": "now",
  "payload": { "kind": "systemEvent", "text": "Reminder text" },
  "deleteAfterRun": true
}
```

전달이 포함된 반복, 격리 작업:

```json
{
  "name": "Morning brief",
  "schedule": { "kind": "cron", "expr": "0 7 * * *", "tz": "America/Los_Angeles" },
  "sessionTarget": "isolated",
  "wakeMode": "next-heartbeat",
  "payload": {
    "kind": "agentTurn",
    "message": "Summarize overnight updates.",
    "deliver": true,
    "channel": "slack",
    "to": "channel:C1234567890",
    "bestEffortDeliver": true
  },
  "isolation": { "postToMainPrefix": "Cron", "postToMainMode": "summary" }
}
```

참고사항:

- `schedule.kind`: `at` (`atMs`), `every` (`everyMs`), 또는 `cron` (`expr`, 선택적 `tz`).
- `atMs` 및 `everyMs`는 에포크 밀리초입니다.
- `sessionTarget`은 `"main"` 또는 `"isolated"`여야 하며 `payload.kind`와 일치해야 합니다.
- 선택적 필드: `agentId`, `description`, `enabled`, `deleteAfterRun`, `isolation`.
- `wakeMode`는 생략 시 `"next-heartbeat"`로 기본 설정됩니다.

### cron.update params

```json
{
  "jobId": "job-123",
  "patch": {
    "enabled": false,
    "schedule": { "kind": "every", "everyMs": 3600000 }
  }
}
```

참고사항:

- `jobId`는 정식이며; `id`는 호환성을 위해 허용됩니다.
- 에이전트 바인딩을 지우려면 패치에서 `agentId: null`을 사용하세요.

### cron.run 및 cron.remove params

```json
{ "jobId": "job-123", "mode": "force" }
```

```json
{ "jobId": "job-123" }
```

## 저장소 및 기록

- 작업 저장소: `~/.openclaw/cron/jobs.json` (게이트웨이 관리 JSON).
- 실행 기록: `~/.openclaw/cron/runs/<jobId>.jsonl` (JSONL, 자동 정리).
- 저장소 경로 재정의: 설정의 `cron.store`.

## 설정

```json5
{
  cron: {
    enabled: true, // 기본값 true
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1, // 기본값 1
  },
}
```

크론 완전히 비활성화:

- `cron.enabled: false` (설정)
- `OPENCLAW_SKIP_CRON=1` (환경 변수)

## CLI 빠른 시작

일회성 리마인더 (UTC ISO, 성공 후 자동 삭제):

```bash
openclaw cron add \
  --name "Send reminder" \
  --at "2026-01-12T18:00:00Z" \
  --session main \
  --system-event "Reminder: submit expense report." \
  --wake now \
  --delete-after-run
```

일회성 리마인더 (메인 세션, 즉시 깨우기):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

반복 격리 작업 (WhatsApp으로 전달):

```bash
openclaw cron add \
  --name "Morning status" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize inbox + calendar for today." \
  --deliver \
  --channel whatsapp \
  --to "+15551234567"
```

반복 격리 작업 (Telegram 토픽으로 전달):

```bash
openclaw cron add \
  --name "Nightly summary (topic)" \
  --cron "0 22 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize today; send to the nightly topic." \
  --deliver \
  --channel telegram \
  --to "-1001234567890:topic:123"
```

모델 및 씽킹 재정의가 포함된 격리 작업:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --deliver \
  --channel whatsapp \
  --to "+15551234567"
```

에이전트 선택 (다중 에이전트 설정):

```bash
# 작업을 에이전트 "ops"에 고정 (해당 에이전트가 누락된 경우 기본값으로 폴백)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops

# 기존 작업의 에이전트 전환 또는 지우기
openclaw cron edit <jobId> --agent ops
openclaw cron edit <jobId> --clear-agent
```

수동 실행 (디버그):

```bash
openclaw cron run <jobId> --force
```

기존 작업 편집 (패치 필드):

```bash
openclaw cron edit <jobId> \
  --message "Updated prompt" \
  --model "opus" \
  --thinking low
```

실행 기록:

```bash
openclaw cron runs --id <jobId> --limit 50
```

작업을 생성하지 않고 즉시 시스템 이벤트:

```bash
openclaw system event --mode now --text "Next heartbeat: check battery."
```

## 게이트웨이 API 표면

- `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`
- `cron.run` (강제 또는 만료), `cron.runs`
  작업 없이 즉시 시스템 이벤트를 원하는 경우 [`openclaw system event`](/cli/system)를 사용하세요.

## 문제 해결

### "아무것도 실행되지 않음"

- 크론이 활성화되어 있는지 확인: `cron.enabled` 및 `OPENCLAW_SKIP_CRON`.
- 게이트웨이가 지속적으로 실행 중인지 확인 (크론은 게이트웨이 프로세스 내에서 실행됩니다).
- `cron` 스케줄의 경우: 타임존 (`--tz`) 대 호스트 타임존을 확인하세요.

### Telegram이 잘못된 위치로 전달됨

- 포럼 토픽의 경우 `-100…:topic:<id>`를 사용하여 명시적이고 모호하지 않게 만드세요.
- 로그 또는 저장된 "마지막 경로" 대상에서 `telegram:...` 접두사가 표시되면 정상입니다;
  크론 전달은 이를 허용하고 여전히 토픽 ID를 올바르게 구문 분석합니다.

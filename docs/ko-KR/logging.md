---
summary: "로깅 개요: 파일 로그, 콘솔 출력, CLI 테일링 및 제어 UI"
read_when:
  - 로깅에 대한 초보자 친화적인 개요가 필요한 경우
  - 로그 레벨이나 형식을 설정하고자 하는 경우
  - 문제 해결 중이며 로그를 빠르게 찾아야 하는 경우
title: "로깅"
---

# 로깅

OpenClaw는 두 곳에 로그를 기록합니다:

- **파일 로그** (JSON 라인) 게이트웨이가 작성.
- **콘솔 출력** 터미널 및 제어 UI에 표시.

이 페이지는 로그가 어디에 있는지, 읽는 방법, 로그 레벨 및 형식을 설정하는 방법을 설명합니다.

## 로그 위치

기본적으로 게이트웨이는 다음 위치에 롤링 로그 파일을 작성합니다:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

날짜는 게이트웨이 호스트의 로컬 시간대를 사용합니다.

`~/.openclaw/openclaw.json`에서 이를 재정의할 수 있습니다:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 로그 읽는 방법

### CLI: 실시간 테일 (권장)

CLI를 사용하여 RPC를 통해 게이트웨이 로그 파일을 테일하세요:

```bash
openclaw logs --follow
```

출력 모드:

- **TTY 세션**: 보기 좋고, 색상이 있으며, 구조화된 로그 라인.
- **비TTY 세션**: 일반 텍스트.
- `--json`: 줄로 구분된 JSON (로그 이벤트당 한 줄).
- `--plain`: TTY 세션에서 일반 텍스트 강제.
- `--no-color`: ANSI 색상 비활성화.

JSON 모드에서 CLI는 `type` 태그가 지정된 객체를 방출합니다:

- `meta`: 스트림 메타데이터 (파일, 커서, 크기)
- `log`: 파싱된 로그 항목
- `notice`: 잘림 / 회전 힌트
- `raw`: 파싱되지 않은 로그 라인

게이트웨이에 연결할 수 없는 경우 CLI는 다음을 실행하라는 짧은 힌트를 출력합니다:

```bash
openclaw doctor
```

### 제어 UI (웹)

제어 UI의 **로그** 탭은 `logs.tail`을 사용하여 동일한 파일을 테일합니다.
여는 방법은 [/web/control-ui](/web/control-ui)를 참조하세요.

### 채널 전용 로그

채널 활동(WhatsApp/Telegram 등)을 필터링하려면 다음을 사용하세요:

```bash
openclaw channels logs --channel whatsapp
```

## 로그 형식

### 파일 로그 (JSONL)

로그 파일의 각 줄은 JSON 객체입니다. CLI 및 제어 UI는 이러한 항목을 파싱하여 구조화된 출력(시간, 레벨, 하위 시스템, 메시지)을 렌더링합니다.

### 콘솔 출력

콘솔 로그는 **TTY 인식**이며 가독성을 위해 포맷됩니다:

- 하위 시스템 접두사 (예: `gateway/channels/whatsapp`)
- 레벨 색상 (info/warn/error)
- 선택적 컴팩트 또는 JSON 모드

콘솔 포맷팅은 `logging.consoleStyle`에 의해 제어됩니다.

## 로깅 설정

모든 로깅 설정은 `~/.openclaw/openclaw.json`의 `logging` 아래에 있습니다.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### 로그 레벨

- `logging.level`: **파일 로그** (JSONL) 레벨.
- `logging.consoleLevel`: **콘솔** 상세도 레벨.

`--verbose`는 콘솔 출력에만 영향을 미칩니다. 파일 로그 레벨은 변경하지 않습니다.

### 콘솔 스타일

`logging.consoleStyle`:

- `pretty`: 인간 친화적, 색상 있음, 타임스탬프 포함.
- `compact`: 더 작은 출력 (긴 세션에 가장 적합).
- `json`: 줄당 JSON (로그 프로세서용).

### 삭제

도구 요약은 콘솔에 도달하기 전에 민감한 토큰을 삭제할 수 있습니다:

- `logging.redactSensitive`: `off` | `tools` (기본값: `tools`)
- `logging.redactPatterns`: 기본 세트를 재정의할 정규식 문자열 목록

삭제는 **콘솔 출력에만** 영향을 미치며 파일 로그를 변경하지 않습니다.

## 진단 + OpenTelemetry

진단은 모델 실행 **및** 메시지 흐름 텔레메트리(웹훅, 큐잉, 세션 상태)를 위한 구조화된 기계 판독 가능 이벤트입니다. 로그를 **대체하지 않습니다**. 메트릭, 추적 및 기타 익스포터에 피드하기 위해 존재합니다.

진단 이벤트는 프로세스 내에서 방출되지만 익스포터는 진단 + 익스포터 플러그인이 활성화된 경우에만 연결됩니다.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: 추적, 메트릭 및 로그를 위한 데이터 모델 + SDK.
- **OTLP**: OTel 데이터를 컬렉터/백엔드로 내보내는 데 사용되는 와이어 프로토콜.
- OpenClaw는 오늘날 **OTLP/HTTP (protobuf)**를 통해 내보냅니다.

### 내보낸 신호

- **메트릭**: 카운터 + 히스토그램 (토큰 사용량, 메시지 흐름, 큐잉).
- **추적**: 모델 사용량 + 웹훅/메시지 처리를 위한 스팬.
- **로그**: `diagnostics.otel.logs`가 활성화된 경우 OTLP를 통해 내보냄. 로그 볼륨이 높을 수 있으므로 `logging.level` 및 익스포터 필터를 염두에 두세요.

### 진단 이벤트 카탈로그

모델 사용량:

- `model.usage`: 토큰, 비용, 기간, 컨텍스트, 프로바이더/모델/채널, 세션 ID.

메시지 흐름:

- `webhook.received`: 채널당 웹훅 인그레스.
- `webhook.processed`: 웹훅 처리 + 기간.
- `webhook.error`: 웹훅 핸들러 오류.
- `message.queued`: 처리를 위해 메시지 큐에 추가.
- `message.processed`: 결과 + 기간 + 선택적 오류.

큐 + 세션:

- `queue.lane.enqueue`: 명령 큐 레인 큐 추가 + 깊이.
- `queue.lane.dequeue`: 명령 큐 레인 큐 제거 + 대기 시간.
- `session.state`: 세션 상태 전환 + 이유.
- `session.stuck`: 세션 정체 경고 + 나이.
- `run.attempt`: 실행 재시도/시도 메타데이터.
- `diagnostic.heartbeat`: 집계 카운터 (웹훅/큐/세션).

### 진단 활성화 (익스포터 없음)

플러그인 또는 커스텀 싱크에서 진단 이벤트를 사용하려면 다음을 사용하세요:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### 진단 플래그 (대상 로그)

`logging.level`을 올리지 않고 추가 대상 디버그 로그를 켜려면 플래그를 사용하세요.
플래그는 대소문자를 구분하지 않으며 와일드카드를 지원합니다(예: `telegram.*` 또는 `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

환경 변수 재정의 (일회성):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

참고:

- 플래그 로그는 표준 로그 파일로 이동합니다(`logging.file`과 동일).
- 출력은 여전히 `logging.redactSensitive`에 따라 삭제됩니다.
- 전체 가이드: [/diagnostics/flags](/diagnostics/flags).

### OpenTelemetry로 내보내기

진단은 `diagnostics-otel` 플러그인(OTLP/HTTP)을 통해 내보낼 수 있습니다. 이는 OTLP/HTTP를 허용하는 모든 OpenTelemetry 컬렉터/백엔드와 작동합니다.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

참고:

- `openclaw plugins enable diagnostics-otel`로 플러그인을 활성화할 수도 있습니다.
- `protocol`은 현재 `http/protobuf`만 지원합니다. `grpc`는 무시됩니다.
- 메트릭에는 토큰 사용량, 비용, 컨텍스트 크기, 실행 기간, 메시지 흐름 카운터/히스토그램(웹훅, 큐잉, 세션 상태, 큐 깊이/대기)이 포함됩니다.
- 추적/메트릭은 `traces` / `metrics`로 토글할 수 있습니다(기본값: 켜짐). 추적에는 활성화된 경우 모델 사용량 스팬과 웹훅/메시지 처리 스팬이 포함됩니다.
- 컬렉터에 인증이 필요한 경우 `headers`를 설정하세요.
- 환경 변수 지원: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### 내보낸 메트릭 (이름 + 유형)

모델 사용량:

- `openclaw.tokens` (카운터, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (카운터, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (히스토그램, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (히스토그램, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

메시지 흐름:

- `openclaw.webhook.received` (카운터, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (카운터, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (히스토그램, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (카운터, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (카운터, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (히스토그램, attrs: `openclaw.channel`, `openclaw.outcome`)

큐 + 세션:

- `openclaw.queue.lane.enqueue` (카운터, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (카운터, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (히스토그램, attrs: `openclaw.lane` 또는 `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (히스토그램, attrs: `openclaw.lane`)
- `openclaw.session.state` (카운터, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (카운터, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (히스토그램, attrs: `openclaw.state`)
- `openclaw.run.attempt` (카운터, attrs: `openclaw.attempt`)

### 내보낸 스팬 (이름 + 주요 속성)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`, `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`, `openclaw.sessionKey`, `openclaw.sessionId`

### 샘플링 + 플러싱

- 추적 샘플링: `diagnostics.otel.sampleRate` (0.0–1.0, 루트 스팬만).
- 메트릭 내보내기 간격: `diagnostics.otel.flushIntervalMs` (최소 1000ms).

### 프로토콜 참고사항

- OTLP/HTTP 엔드포인트는 `diagnostics.otel.endpoint` 또는 `OTEL_EXPORTER_OTLP_ENDPOINT`를 통해 설정할 수 있습니다.
- 엔드포인트에 이미 `/v1/traces` 또는 `/v1/metrics`가 포함되어 있으면 그대로 사용됩니다.
- 엔드포인트에 이미 `/v1/logs`가 포함되어 있으면 로그에 그대로 사용됩니다.
- `diagnostics.otel.logs`는 주 로거 출력에 대한 OTLP 로그 내보내기를 활성화합니다.

### 로그 내보내기 동작

- OTLP 로그는 `logging.file`에 기록된 것과 동일한 구조화된 레코드를 사용합니다.
- `logging.level` (파일 로그 레벨)을 존중합니다. 콘솔 삭제는 OTLP 로그에 **적용되지 않습니다**.
- 대용량 설치는 OTLP 컬렉터 샘플링/필터링을 선호해야 합니다.

## 문제 해결 팁

- **게이트웨이에 연결할 수 없나요?** 먼저 `openclaw doctor`를 실행하세요.
- **로그가 비어 있나요?** 게이트웨이가 실행 중이고 `logging.file`의 파일 경로에 작성하는지 확인하세요.
- **더 자세한 정보가 필요한가요?** `logging.level`을 `debug` 또는 `trace`로 설정하고 다시 시도하세요.

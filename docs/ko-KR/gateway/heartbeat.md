---
summary: "하트비트 폴링 메시지 및 알림 규칙"
read_when:
  - 하트비트 주기 또는 메시징 조정
  - 예약 작업에 하트비트와 cron 중 선택
title: "하트비트"
---

# 하트비트 (게이트웨이)

> **하트비트 vs Cron?** 각각을 언제 사용할지에 대한 가이드는 [Cron vs 하트비트](/automation/cron-vs-heartbeat)를 참조하세요.

하트비트는 메인 세션에서 **주기적인 에이전트 턴**을 실행하여 모델이 스팸 없이 주의가 필요한 것을 표면화할 수 있도록 합니다.

## 빠른 시작 (초보자)

1. 하트비트를 활성화 상태로 유지합니다 (기본값은 `30m`, Anthropic OAuth/setup-token의 경우 `1h`) 또는 자체 주기를 설정합니다.
2. 에이전트 워크스페이스에 작은 `HEARTBEAT.md` 체크리스트를 생성합니다 (선택 사항이지만 권장됨).
3. 하트비트 메시지가 전달될 위치를 결정합니다 (`target: "last"`가 기본값).
4. 선택 사항: 투명성을 위해 하트비트 추론 전달을 활성화합니다.
5. 선택 사항: 활동 시간 (로컬 시간)으로 하트비트를 제한합니다.

예제 설정:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 선택 사항: 별도의 `Reasoning:` 메시지도 전송
      },
    },
  },
}
```

## 기본값

- 간격: `30m` (Anthropic OAuth/setup-token이 감지된 인증 모드인 경우 `1h`). `agents.defaults.heartbeat.every` 또는 에이전트별 `agents.list[].heartbeat.every`를 설정합니다. 비활성화하려면 `0m`을 사용합니다.
- 프롬프트 본문 (`agents.defaults.heartbeat.prompt`를 통해 구성 가능):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- 하트비트 프롬프트는 사용자 메시지로 **그대로** 전송됩니다. 시스템 프롬프트에는 "하트비트" 섹션이 포함되며 실행은 내부적으로 플래그가 지정됩니다.
- 활동 시간 (`heartbeat.activeHours`)은 구성된 시간대에서 확인됩니다.
  창 밖에서는 창 내부의 다음 틱까지 하트비트가 건너뜁니다.

## 하트비트 프롬프트의 용도

기본 프롬프트는 의도적으로 광범위합니다:

- **백그라운드 작업**: "미해결 작업 고려"는 에이전트가 후속 조치 (받은 편지함, 캘린더, 알림, 대기 중인 작업)를 검토하고 긴급한 것을 표면화하도록 유도합니다.
- **사람 확인**: "낮 시간 동안 가끔 사람을 확인"은 가끔 가벼운 "뭐 필요한 거 있어?" 메시지를 유도하지만, 구성된 로컬 시간대를 사용하여 야간 스팸을 방지합니다 ([/concepts/timezone](/concepts/timezone) 참조).

하트비트가 매우 구체적인 작업을 수행하도록 하려면 (예: "Gmail PubSub 통계 확인" 또는 "게이트웨이 상태 확인"), `agents.defaults.heartbeat.prompt` (또는 `agents.list[].heartbeat.prompt`)를 사용자 정의 본문 (그대로 전송됨)으로 설정하세요.

## 응답 계약

- 주의가 필요한 것이 없으면 **`HEARTBEAT_OK`**로 응답합니다.
- 하트비트 실행 중, OpenClaw는 응답의 **시작 또는 끝**에 나타날 때 `HEARTBEAT_OK`를 확인으로 취급합니다. 토큰이 제거되고 나머지 내용이 **≤ `ackMaxChars`** (기본값: 300)이면 응답이 삭제됩니다.
- `HEARTBEAT_OK`가 응답의 **중간**에 나타나면 특별하게 취급되지 않습니다.
- 알림의 경우 `HEARTBEAT_OK`를 포함하지 **마세요**. 알림 텍스트만 반환하세요.

하트비트 외부에서는 메시지의 시작/끝에 있는 불필요한 `HEARTBEAT_OK`가 제거되고 기록됩니다. `HEARTBEAT_OK`만 있는 메시지는 삭제됩니다.

## 설정

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 기본값: 30m (0m은 비활성화)
        model: "anthropic/claude-opus-4-5",
        includeReasoning: false, // 기본값: false (사용 가능한 경우 별도의 Reasoning: 메시지 전달)
        target: "last", // last | none | <channel id> (core 또는 plugin, 예: "bluebubbles")
        to: "+15551234567", // 선택적 채널별 재정의
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK 후 허용되는 최대 문자
      },
    },
  },
}
```

### 범위 및 우선순위

- `agents.defaults.heartbeat`는 전역 하트비트 동작을 설정합니다.
- `agents.list[].heartbeat`는 그 위에 병합됩니다. 에이전트에 `heartbeat` 블록이 있으면 **해당 에이전트만** 하트비트를 실행합니다.
- `channels.defaults.heartbeat`는 모든 채널에 대한 가시성 기본값을 설정합니다.
- `channels.<channel>.heartbeat`는 채널 기본값을 재정의합니다.
- `channels.<channel>.accounts.<id>.heartbeat` (다중 계정 채널)는 채널별 설정을 재정의합니다.

### 에이전트별 하트비트

`agents.list[]` 항목에 `heartbeat` 블록이 포함된 경우, **해당 에이전트만**
하트비트를 실행합니다. 에이전트별 블록은 `agents.defaults.heartbeat` 위에 병합됩니다 (공유 기본값을 한 번 설정하고 에이전트별로 재정의 가능).

예제: 두 에이전트, 두 번째 에이전트만 하트비트 실행.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### 필드 참고 사항

- `every`: 하트비트 간격 (기간 문자열; 기본 단위 = 분).
- `model`: 하트비트 실행을 위한 선택적 모델 재정의 (`provider/model`).
- `includeReasoning`: 활성화된 경우, 사용 가능할 때 별도의 `Reasoning:` 메시지도 전달 (`/reasoning on`과 동일한 형태).
- `session`: 하트비트 실행을 위한 선택적 세션 키.
  - `main` (기본값): 에이전트 메인 세션.
  - 명시적 세션 키 (`openclaw sessions --json` 또는 [sessions CLI](/cli/sessions)에서 복사).
  - 세션 키 형식: [세션](/concepts/session) 및 [그룹](/concepts/groups) 참조.
- `target`:
  - `last` (기본값): 마지막으로 사용된 외부 채널로 전달.
  - 명시적 채널: `whatsapp` / `telegram` / `discord` / `googlechat` / `slack` / `msteams` / `signal` / `imessage`.
  - `none`: 하트비트를 실행하지만 외부로 전달하지 **않음**.
- `to`: 선택적 수신자 재정의 (채널별 id, 예: WhatsApp의 E.164 또는 Telegram 채팅 id).
- `prompt`: 기본 프롬프트 본문을 재정의 (병합되지 않음).
- `ackMaxChars`: `HEARTBEAT_OK` 후 전달 전 허용되는 최대 문자.

## 전달 동작

- 하트비트는 기본적으로 에이전트의 메인 세션 (`agent:<id>:<mainKey>`)에서 실행되거나, `session.scope = "global"`일 때 `global`에서 실행됩니다. 특정 채널 세션 (Discord/WhatsApp 등)으로 재정의하려면 `session`을 설정하세요.
- `session`은 실행 컨텍스트에만 영향을 줍니다. 전달은 `target` 및 `to`에 의해 제어됩니다.
- 특정 채널/수신자로 전달하려면 `target` + `to`를 설정하세요. `target: "last"`의 경우, 전달은 해당 세션의 마지막 외부 채널을 사용합니다.
- 메인 큐가 사용 중이면 하트비트가 건너뛰고 나중에 재시도됩니다.
- `target`이 외부 대상으로 해석되지 않으면 실행은 여전히 발생하지만 아웃바운드 메시지는 전송되지 않습니다.
- 하트비트 전용 응답은 세션을 활성 상태로 유지하지 **않습니다**. 마지막 `updatedAt`가 복원되어 유휴 만료가 정상적으로 작동합니다.

## 가시성 제어

기본적으로 `HEARTBEAT_OK` 확인은 억제되는 반면 알림 내용은 전달됩니다. 채널별 또는 계정별로 이를 조정할 수 있습니다:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK 숨기기 (기본값)
      showAlerts: true # 알림 메시지 표시 (기본값)
      useIndicator: true # 표시기 이벤트 방출 (기본값)
  telegram:
    heartbeat:
      showOk: true # Telegram에서 OK 확인 표시
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # 이 계정에 대한 알림 전달 억제
```

우선순위: 계정별 → 채널별 → 채널 기본값 → 내장 기본값.

### 각 플래그의 기능

- `showOk`: 모델이 OK 전용 응답을 반환할 때 `HEARTBEAT_OK` 확인을 전송합니다.
- `showAlerts`: 모델이 OK가 아닌 응답을 반환할 때 알림 내용을 전송합니다.
- `useIndicator`: UI 상태 표면에 대한 표시기 이벤트를 방출합니다.

**세 가지 모두**가 false이면 OpenClaw는 하트비트 실행을 완전히 건너뜁니다 (모델 호출 없음).

### 채널별 vs 계정별 예제

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # 모든 Slack 계정
    accounts:
      ops:
        heartbeat:
          showAlerts: false # ops 계정에 대해서만 알림 억제
  telegram:
    heartbeat:
      showOk: true
```

### 일반적인 패턴

| 목표                                   | 설정                                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| 기본 동작 (조용한 OK, 알림 켜짐)       | _(설정 불필요)_                                                                          |
| 완전히 조용 (메시지 없음, 표시기 없음) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 표시기 전용 (메시지 없음)              | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 한 채널에서만 OK                       | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (선택 사항)

워크스페이스에 `HEARTBEAT.md` 파일이 있으면 기본 프롬프트는 에이전트에게 이를 읽도록 지시합니다. "하트비트 체크리스트"로 생각하세요: 작고, 안정적이며, 30분마다 포함해도 안전합니다.

`HEARTBEAT.md`가 존재하지만 실질적으로 비어 있는 경우 (빈 줄과 `# Heading`과 같은 마크다운 헤더만), OpenClaw는 API 호출을 절약하기 위해 하트비트 실행을 건너뜁니다.
파일이 누락된 경우에도 하트비트는 여전히 실행되고 모델이 무엇을 할지 결정합니다.

프롬프트 비대를 피하기 위해 작게 유지하세요 (짧은 체크리스트 또는 알림).

`HEARTBEAT.md` 예제:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### 에이전트가 HEARTBEAT.md를 업데이트할 수 있나요?

예 — 요청하면요.

`HEARTBEAT.md`는 에이전트 워크스페이스의 일반 파일일 뿐이므로 (일반 채팅에서) 에이전트에게 다음과 같이 말할 수 있습니다:

- "`HEARTBEAT.md`를 업데이트하여 일일 캘린더 확인을 추가해줘."
- "`HEARTBEAT.md`를 더 짧고 받은 편지함 후속 조치에 집중하도록 다시 작성해줘."

이것이 자동으로 발생하도록 하려면 하트비트 프롬프트에 "체크리스트가 오래되면 HEARTBEAT.md를 더 나은 것으로 업데이트"와 같은 명시적인 줄을 포함할 수도 있습니다.

보안 참고 사항: `HEARTBEAT.md`에 비밀 (API 키, 전화번호, 개인 토큰)을 넣지 마세요 — 프롬프트 컨텍스트의 일부가 됩니다.

## 수동 깨우기 (온디맨드)

시스템 이벤트를 큐에 추가하고 즉시 하트비트를 트리거할 수 있습니다:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

여러 에이전트에 `heartbeat`가 구성된 경우, 수동 깨우기는 각 에이전트 하트비트를 즉시 실행합니다.

다음 예약된 틱을 기다리려면 `--mode next-heartbeat`를 사용하세요.

## 추론 전달 (선택 사항)

기본적으로 하트비트는 최종 "답변" 페이로드만 전달합니다.

투명성을 원하면 다음을 활성화하세요:

- `agents.defaults.heartbeat.includeReasoning: true`

활성화된 경우, 하트비트는 `Reasoning:` 접두사가 붙은 별도의 메시지도 전달합니다 (`/reasoning on`과 동일한 형태). 이는 에이전트가 여러 세션/코덱스를 관리하고 있고 왜 당신에게 핑을 하기로 결정했는지 보고 싶을 때 유용할 수 있지만, 원하는 것보다 더 많은 내부 세부 정보를 누출할 수도 있습니다. 그룹 채팅에서는 끄는 것을 선호하세요.

## 비용 인식

하트비트는 전체 에이전트 턴을 실행합니다. 간격이 짧을수록 더 많은 토큰을 소모합니다. `HEARTBEAT.md`를 작게 유지하고 내부 상태 업데이트만 원하는 경우 더 저렴한 `model` 또는 `target: "none"`을 고려하세요.

---
summary: "인바운드 자동 응답 실행을 직렬화하는 명령 큐 설계"
read_when:
  - 자동 응답 실행 또는 동시성 변경 시
title: "명령 큐"
---

# 명령 큐 (2026-01-16)

모든 채널의 인바운드 자동 응답 실행을 작은 인프로세스 큐를 통해 직렬화하여 여러 에이전트 실행이 충돌하는 것을 방지하면서도 세션 간 안전한 병렬 처리를 허용합니다.

## 이유

- 자동 응답 실행은 비용이 높을 수 있으며(LLM 호출) 여러 인바운드 메시지가 연속으로 도착할 때 충돌할 수 있습니다.
- 직렬화는 공유 리소스(세션 파일, 로그, CLI stdin)에 대한 경쟁을 방지하고 업스트림 속도 제한 가능성을 줄입니다.

## 작동 방식

- 레인 인식 FIFO 큐는 설정 가능한 동시성 상한(미설정 레인의 기본값 1; main 기본값 4, subagent 8)으로 각 레인을 드레인합니다.
- `runEmbeddedPiAgent`는 **세션 키**(레인 `session:<key>`)로 인큐하여 세션당 하나의 활성 실행만 보장합니다.
- 각 세션 실행은 **전역 레인**(`main` 기본값)으로 큐에 추가되어 전체 병렬 처리가 `agents.defaults.maxConcurrent`로 제한됩니다.
- 자세한 로깅이 활성화된 경우, 큐에 추가된 실행이 시작 전 약 2초 이상 대기하면 짧은 알림을 발생시킵니다.
- 타이핑 표시기는 인큐 시 즉시 발생하므로(채널에서 지원하는 경우) 대기 중에도 사용자 경험은 변하지 않습니다.

## 큐 모드 (채널별)

인바운드 메시지는 현재 실행을 조향하거나, 후속 턴을 기다리거나, 둘 다 할 수 있습니다:

- `steer`: 현재 실행에 즉시 주입 (다음 도구 경계 후 대기 중인 도구 호출 취소). 스트리밍 중이 아니면 followup으로 폴백.
- `followup`: 현재 실행 종료 후 다음 에이전트 턴을 위해 인큐.
- `collect`: 큐에 있는 모든 메시지를 **단일** 후속 턴으로 병합 (기본값). 메시지가 다른 채널/스레드를 대상으로 하는 경우 개별적으로 드레인하여 라우팅 유지.
- `steer-backlog` (일명 `steer+backlog`): 즉시 조향 **및** 후속 턴을 위해 메시지 보존.
- `interrupt` (레거시): 해당 세션의 활성 실행을 중단한 다음 최신 메시지 실행.
- `queue` (레거시 별칭): `steer`와 동일.

Steer-backlog는 조향된 실행 후 후속 응답을 받을 수 있으므로 스트리밍 표면이 중복처럼 보일 수 있습니다. 인바운드 메시지당 하나의 응답을 원하면 `collect`/`steer`를 선호하세요.
독립 실행형 명령으로 `/queue collect`를 전송하거나(세션별) `messages.queue.byChannel.discord: "collect"`를 설정하세요.

설정에서 미설정 시 기본값:

- 모든 표면 → `collect`

전역 또는 채널별로 `messages.queue`를 통해 설정:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## 큐 옵션

옵션은 `followup`, `collect`, `steer-backlog`에 적용됩니다 (`steer`가 followup으로 폴백할 때도 적용):

- `debounceMs`: 후속 턴 시작 전 조용한 시간 대기 ("continue, continue" 방지).
- `cap`: 세션당 최대 큐 메시지 수.
- `drop`: 오버플로 정책 (`old`, `new`, `summarize`).

Summarize는 삭제된 메시지의 짧은 글머리 기호 목록을 유지하고 합성 후속 프롬프트로 주입합니다.
기본값: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## 세션별 오버라이드

- 독립 실행형 명령으로 `/queue <mode>`를 전송하여 현재 세션의 모드를 저장합니다.
- 옵션을 결합할 수 있습니다: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` 또는 `/queue reset`은 세션 오버라이드를 지웁니다.

## 범위 및 보장

- 게이트웨이 응답 파이프라인을 사용하는 모든 인바운드 채널(WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat 등)의 자동 응답 에이전트 실행에 적용됩니다.
- 기본 레인(`main`)은 인바운드 + 메인 하트비트에 대한 프로세스 전체입니다. 병렬로 여러 세션을 허용하려면 `agents.defaults.maxConcurrent`를 설정하세요.
- 추가 레인이 존재할 수 있으므로(예: `cron`, `subagent`) 백그라운드 작업이 인바운드 응답을 차단하지 않고 병렬로 실행될 수 있습니다.
- 세션별 레인은 주어진 세션에 한 번에 하나의 에이전트 실행만 접근하도록 보장합니다.
- 외부 종속성이나 백그라운드 워커 스레드 없음. 순수 TypeScript + promises.

## 문제 해결

- 명령이 막힌 것처럼 보이면 자세한 로그를 활성화하고 "queued for …ms" 라인을 찾아 큐가 드레인되는지 확인하세요.
- 큐 깊이가 필요한 경우 자세한 로그를 활성화하고 큐 타이밍 라인을 확인하세요.

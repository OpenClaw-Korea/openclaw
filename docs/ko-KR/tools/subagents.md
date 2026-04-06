---
summary: "서브 에이전트: 요청자 채팅으로 결과를 다시 알리는 격리된 에이전트 실행 생성"
read_when:
  - 에이전트를 통한 백그라운드/병렬 작업을 원할 때
  - sessions_spawn 또는 서브 에이전트 도구 정책을 변경할 때
title: "서브 에이전트"
---

# 서브 에이전트

서브 에이전트는 기존 에이전트 실행에서 생성된 백그라운드 에이전트 실행입니다. 자체 세션(`agent:<agentId>:subagent:<uuid>`)에서 실행되며, 완료되면 결과를 요청자 채팅 채널로 **알립니다**.

## 슬래시 명령

`/subagents`를 사용하여 **현재 세션**의 서브 에이전트 실행을 검사하거나 제어하세요.

- `/subagents list`
- `/subagents stop <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`

`/subagents info`는 실행 메타데이터(상태, 타임스탬프, 세션 ID, 트랜스크립트 경로, 정리)를 표시합니다.

주요 목표:

- 메인 실행을 차단하지 않고 "연구 / 긴 작업 / 느린 도구" 작업을 병렬화합니다.
- 서브 에이전트를 기본적으로 격리합니다(세션 분리 + 선택적 샌드박싱).
- 도구 표면을 오용하기 어렵게 유지합니다. 서브 에이전트는 기본적으로 세션 도구를 받지 **않습니다**.
- 중첩된 팬아웃을 방지합니다. 서브 에이전트는 서브 에이전트를 생성할 수 없습니다.

비용 참고 사항: 각 서브 에이전트에는 **자체** 컨텍스트 및 토큰 사용량이 있습니다. 많거나 반복적인 작업의 경우, 서브 에이전트에 더 저렴한 모델을 설정하고 메인 에이전트는 더 높은 품질의 모델로 유지하세요.
`agents.defaults.subagents.model` 또는 에이전트별 재정의를 통해 구성할 수 있습니다.

## 도구

`sessions_spawn` 사용:

- 서브 에이전트 실행을 시작합니다(`deliver: false`, 전역 레인: `subagent`)
- 그런 다음 알림 단계를 실행하고 요청자 채팅 채널에 알림 응답을 게시합니다
- 기본 모델: `agents.defaults.subagents.model`(또는 에이전트별 `agents.list[].subagents.model`)을 설정하지 않는 한 호출자로부터 상속합니다. 명시적 `sessions_spawn.model`이 여전히 우선합니다.
- 기본 사고: `agents.defaults.subagents.thinking`(또는 에이전트별 `agents.list[].subagents.thinking`)을 설정하지 않는 한 호출자로부터 상속합니다. 명시적 `sessions_spawn.thinking`이 여전히 우선합니다.

도구 파라미터:

- `task`(필수)
- `label?`(선택사항)
- `agentId?`(선택사항; 허용되는 경우 다른 에이전트 ID로 생성)
- `model?`(선택사항; 서브 에이전트 모델 재정의; 유효하지 않은 값은 건너뛰고 서브 에이전트는 기본 모델에서 경고와 함께 실행됨)
- `thinking?`(선택사항; 서브 에이전트 실행의 사고 수준 재정의)
- `runTimeoutSeconds?`(기본값 `0`; 설정되면 N초 후 서브 에이전트 실행이 중단됨)
- `cleanup?`(`delete|keep`, 기본값 `keep`)

허용 목록:

- `agents.list[].subagents.allowAgents`: `agentId`를 통해 대상으로 지정할 수 있는 에이전트 ID 목록(모든 에이전트를 허용하려면 `["*"]`). 기본값: 요청자 에이전트만.

디스커버리:

- `agents_list`를 사용하여 `sessions_spawn`에 현재 허용되는 에이전트 ID를 확인하세요.

자동 아카이브:

- 서브 에이전트 세션은 `agents.defaults.subagents.archiveAfterMinutes`(기본값: 60) 후에 자동으로 아카이브됩니다.
- 아카이브는 `sessions.delete`를 사용하고 트랜스크립트 이름을 `*.deleted.<timestamp>`(동일한 폴더)로 변경합니다.
- `cleanup: "delete"`는 알림 후 즉시 아카이브합니다(이름 변경을 통해 트랜스크립트는 여전히 유지됨).
- 자동 아카이브는 최선의 노력입니다. 게이트웨이가 재시작되면 대기 중인 타이머가 손실됩니다.
- `runTimeoutSeconds`는 자동 아카이브하지 **않습니다**. 실행만 중지합니다. 세션은 자동 아카이브까지 유지됩니다.

## 인증

서브 에이전트 인증은 세션 유형이 아닌 **에이전트 ID**로 해석됩니다.

- 서브 에이전트 세션 키는 `agent:<agentId>:subagent:<uuid>`입니다.
- 인증 저장소는 해당 에이전트의 `agentDir`에서 로드됩니다.
- 메인 에이전트의 인증 프로필은 **fallback**으로 병합됩니다. 에이전트 프로필이 충돌 시 메인 프로필을 재정의합니다.

참고: 병합은 추가적이므로 메인 프로필은 항상 fallback으로 사용할 수 있습니다. 에이전트별로 완전히 격리된 인증은 아직 지원되지 않습니다.

## 알림

서브 에이전트는 알림 단계를 통해 보고합니다.

- 알림 단계는 서브 에이전트 세션 내에서 실행됩니다(요청자 세션이 아님).
- 서브 에이전트가 정확히 `ANNOUNCE_SKIP`으로 응답하면 아무것도 게시되지 않습니다.
- 그렇지 않으면 알림 응답이 후속 `agent` 호출(`deliver=true`)을 통해 요청자 채팅 채널에 게시됩니다.
- 알림 응답은 사용 가능한 경우 스레드/토픽 라우팅을 유지합니다(Slack 스레드, Telegram 토픽, Matrix 스레드).
- 알림 메시지는 안정적인 템플릿으로 정규화됩니다.
  - `Status:` 실행 결과에서 파생됨(`success`, `error`, `timeout` 또는 `unknown`).
  - `Result:` 알림 단계의 요약 콘텐츠(또는 누락된 경우 `(not available)`).
  - `Notes:` 오류 세부 정보 및 기타 유용한 컨텍스트.
- `Status`는 모델 출력에서 추론되지 않습니다. 런타임 결과 신호에서 가져옵니다.

알림 페이로드에는 끝에 통계 줄이 포함됩니다(래핑된 경우에도).

- 런타임(예: `runtime 5m12s`)
- 토큰 사용량(입력/출력/총계)
- 모델 가격이 구성된 경우 예상 비용(`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` 및 트랜스크립트 경로(메인 에이전트가 `sessions_history`를 통해 히스토리를 가져오거나 디스크의 파일을 검사할 수 있도록)

## 도구 정책(서브 에이전트 도구)

기본적으로 서브 에이전트는 세션 도구를 **제외한 모든 도구**를 받습니다.

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

설정을 통한 재정의:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## 동시성

서브 에이전트는 전용 인프로세스 큐 레인을 사용합니다.

- 레인 이름: `subagent`
- 동시성: `agents.defaults.subagents.maxConcurrent`(기본값 `8`)

## 중지

- 요청자 채팅에서 `/stop`을 보내면 요청자 세션이 중단되고 여기서 생성된 활성 서브 에이전트 실행이 중지됩니다.

## 제한 사항

- 서브 에이전트 알림은 **최선의 노력**입니다. 게이트웨이가 재시작되면 대기 중인 "다시 알림" 작업이 손실됩니다.
- 서브 에이전트는 여전히 동일한 게이트웨이 프로세스 리소스를 공유합니다. `maxConcurrent`를 안전 밸브로 취급하세요.
- `sessions_spawn`은 항상 논블로킹입니다. 즉시 `{ status: "accepted", runId, childSessionKey }`를 반환합니다.
- 서브 에이전트 컨텍스트는 `AGENTS.md` + `TOOLS.md`만 주입합니다(`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` 또는 `BOOTSTRAP.md` 없음).

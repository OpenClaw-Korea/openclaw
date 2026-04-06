---
summary: "세션을 나열하고, 히스토리를 가져오고, 세션 간 메시지를 전송하기 위한 에이전트 세션 도구"
read_when:
  - 세션 도구를 추가하거나 수정할 때
title: "세션 도구"
---

# 세션 도구

목표: 에이전트가 세션을 나열하고, 히스토리를 가져오고, 다른 세션으로 메시지를 전송할 수 있도록 하는 작고 오용하기 어려운 도구 집합입니다.

## 도구 이름

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

## 핵심 모델

- 메인 직접 채팅 버킷은 항상 리터럴 키 `"main"`입니다 (현재 에이전트의 메인 키로 해석됨).
- 그룹 채팅은 `agent:<agentId>:<channel>:group:<id>` 또는 `agent:<agentId>:<channel>:channel:<id>`를 사용합니다 (전체 키를 전달).
- 크론 작업은 `cron:<job.id>`를 사용합니다.
- 훅은 명시적으로 설정되지 않은 경우 `hook:<uuid>`를 사용합니다.
- 노드 세션은 명시적으로 설정되지 않은 경우 `node-<nodeId>`를 사용합니다.

`global`과 `unknown`은 예약된 값이며 나열되지 않습니다. `session.scope = "global"`인 경우, 호출자가 `global`을 보지 않도록 모든 도구에서 `main`으로 별칭 지정합니다.

## sessions_list

세션을 행의 배열로 나열합니다.

매개변수:

- `kinds?: string[]` 필터: `"main" | "group" | "cron" | "hook" | "node" | "other"` 중 하나
- `limit?: number` 최대 행 수 (기본값: 서버 기본값, 예: 200으로 제한)
- `activeMinutes?: number` N분 이내에 업데이트된 세션만
- `messageLimit?: number` 0 = 메시지 없음 (기본값 0); >0 = 마지막 N개 메시지 포함

동작:

- `messageLimit > 0`은 세션당 `chat.history`를 가져오고 마지막 N개의 메시지를 포함합니다.
- 도구 결과는 나열 출력에서 필터링됩니다. 도구 메시지는 `sessions_history`를 사용하세요.
- **샌드박스 격리** 에이전트 세션에서 실행 중인 경우, 세션 도구는 기본적으로 **생성된 세션만 표시**됩니다 (아래 참조).

행 모양 (JSON):

- `key`: 세션 키 (문자열)
- `kind`: `main | group | cron | hook | node | other`
- `channel`: `whatsapp | telegram | discord | signal | imessage | webchat | internal | unknown`
- `displayName` (그룹 표시 레이블 사용 가능한 경우)
- `updatedAt` (ms)
- `sessionId`
- `model`, `contextTokens`, `totalTokens`
- `thinkingLevel`, `verboseLevel`, `systemSent`, `abortedLastRun`
- `sendPolicy` (설정된 경우 세션 재정의)
- `lastChannel`, `lastTo`
- `deliveryContext` (사용 가능한 경우 정규화된 `{ channel, to, accountId }`)
- `transcriptPath` (저장소 디렉토리 + sessionId에서 파생된 최선의 노력 경로)
- `messages?` (`messageLimit > 0`인 경우만)

## sessions_history

하나의 세션에 대한 트랜스크립트를 가져옵니다.

매개변수:

- `sessionKey` (필수; 세션 키 또는 `sessions_list`의 `sessionId` 허용)
- `limit?: number` 최대 메시지 수 (서버 제한)
- `includeTools?: boolean` (기본값 false)

동작:

- `includeTools=false`는 `role: "toolResult"` 메시지를 필터링합니다.
- 원본 트랜스크립트 형식의 메시지 배열을 반환합니다.
- `sessionId`가 주어진 경우, OpenClaw는 해당 세션 키로 해석합니다 (누락된 ID는 오류 반환).

## sessions_send

다른 세션으로 메시지를 전송합니다.

매개변수:

- `sessionKey` (필수; 세션 키 또는 `sessions_list`의 `sessionId` 허용)
- `message` (필수)
- `timeoutSeconds?: number` (기본값 >0; 0 = 즉시 전송)

동작:

- `timeoutSeconds = 0`: 대기열에 추가하고 `{ runId, status: "accepted" }`를 반환합니다.
- `timeoutSeconds > 0`: 최대 N초 동안 완료를 기다린 후 `{ runId, status: "ok", reply }`를 반환합니다.
- 대기 시간 초과인 경우: `{ runId, status: "timeout", error }`. 실행은 계속되고, 나중에 `sessions_history`를 호출하세요.
- 실행이 실패한 경우: `{ runId, status: "error", error }`.
- 배달 실행은 기본 실행이 완료된 후 공지되며 최선의 노력입니다. `status: "ok"`는 공지가 배달되었음을 보장하지 않습니다.
- 게이트웨이 `agent.wait` (서버 측)를 통해 대기하므로 재연결이 대기를 중단하지 않습니다.
- 에이전트 간 메시지 컨텍스트가 기본 실행에 대해 주입됩니다.
- 기본 실행이 완료된 후, OpenClaw는 **회신 반복 루프**를 실행합니다:
  - 라운드 2 이상은 요청자와 대상 에이전트 사이를 교대로 진행합니다.
  - 핑퐁을 중단하려면 정확히 `REPLY_SKIP`으로 회신하세요.
  - 최대 턴은 `session.agentToAgent.maxPingPongTurns`입니다 (0–5, 기본값 5).
- 루프가 종료되면, OpenClaw는 **에이전트 간 공지 단계**를 실행합니다 (대상 에이전트만):
  - 침묵을 유지하려면 정확히 `ANNOUNCE_SKIP`으로 회신하세요.
  - 다른 모든 회신은 대상 채널로 전송됩니다.
  - 공지 단계는 원본 요청 + 라운드 1 회신 + 최신 핑퐁 회신을 포함합니다.

## 채널 필드

- 그룹의 경우, `channel`은 세션 항목에 기록된 채널입니다.
- 직접 채팅의 경우, `channel`은 `lastChannel`에서 매핑됩니다.
- 크론/훅/노드의 경우, `channel`은 `internal`입니다.
- 누락된 경우, `channel`은 `unknown`입니다.

## 보안 / 전송 정책

채널/채팅 유형별 정책 기반 차단입니다 (세션 ID별 아님).

```json
{
  "session": {
    "sendPolicy": {
      "rules": [
        {
          "match": { "channel": "discord", "chatType": "group" },
          "action": "deny"
        }
      ],
      "default": "allow"
    }
  }
}
```

런타임 재정의 (세션 항목당):

- `sendPolicy: "allow" | "deny"` (설정되지 않음 = 설정 상속)
- `sessions.patch` 또는 소유자 전용 `/send on|off|inherit` (독립 메시지)를 통해 설정 가능

적용 지점:

- `chat.send` / `agent` (게이트웨이)
- 자동 회신 배달 로직

## sessions_spawn

격리된 세션에서 하위 에이전트 실행을 생성하고 결과를 요청자 채팅 채널로 공지합니다.

매개변수:

- `task` (필수)
- `label?` (선택사항; 로그/UI에 사용됨)
- `agentId?` (선택사항; 허용되는 경우 다른 에이전트 ID 아래에서 생성)
- `model?` (선택사항; 하위 에이전트 모델 재정의; 잘못된 값은 오류)
- `runTimeoutSeconds?` (기본값 0; 설정된 경우, N초 후 하위 에이전트 실행 중단)
- `cleanup?` (`delete|keep`, 기본값 `keep`)

허용 목록:

- `agents.list[].subagents.allowAgents`: `agentId`를 통해 허용된 에이전트 ID 목록 (`["*"]`는 모든 항목 허용). 기본값: 요청자 에이전트만.

검색:

- `agents_list`를 사용하여 `sessions_spawn`에 허용된 에이전트 ID를 검색합니다.

동작:

- `deliver: false`로 새로운 `agent:<agentId>:subagent:<uuid>` 세션을 시작합니다.
- 하위 에이전트는 기본적으로 **세션 도구를 제외한** 전체 도구 집합입니다 (`tools.subagents.tools`를 통해 구성 가능).
- 하위 에이전트는 `sessions_spawn`을 호출할 수 없습니다 (하위 에이전트 → 하위 에이전트 생성 안 됨).
- 항상 비차단: 즉시 `{ status: "accepted", runId, childSessionKey }`를 반환합니다.
- 완료 후, OpenClaw는 하위 에이전트 **공지 단계**를 실행하고 결과를 요청자 채팅 채널에 게시합니다.
- 공지 단계에서 침묵을 유지하려면 정확히 `ANNOUNCE_SKIP`으로 회신하세요.
- 공지 회신은 `Status`/`Result`/`Notes`로 정규화됩니다. `Status`는 모델 텍스트가 아닌 런타임 결과에서 옵니다.
- 하위 에이전트 세션은 `agents.defaults.subagents.archiveAfterMinutes` 후에 자동 아카이브됩니다 (기본값: 60).
- 공지 회신에는 통계 라인이 포함됩니다 (런타임, 토큰, sessionKey/sessionId, 트랜스크립트 경로 및 선택적 비용).

## 샌드박스 격리 세션 표시

샌드박스 격리 세션은 세션 도구를 사용할 수 있지만, 기본적으로 `sessions_spawn`을 통해 생성한 세션만 볼 수 있습니다.

설정:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        // 기본값: "spawned"
        sessionToolsVisibility: "spawned", // 또는 "all"
      },
    },
  },
}
```

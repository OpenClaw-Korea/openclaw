---
summary: "채팅을 위한 세션 관리 규칙, 키 및 영속화"
read_when:
  - 세션 처리 또는 저장 수정 시
title: "세션 관리"
---

# 세션 관리

OpenClaw는 **에이전트당 하나의 직접 채팅 세션**을 기본으로 처리합니다. 직접 채팅은 `agent:<agentId>:<mainKey>`(기본값 `main`)로 축소되고, 그룹/채널 채팅은 자체 키를 갖습니다. `session.mainKey`가 적용됩니다.

**직접 메시지**가 그룹화되는 방식을 제어하려면 `session.dmScope`를 사용합니다:

- `main` (기본값): 모든 DM이 연속성을 위해 메인 세션을 공유합니다.
- `per-peer`: 채널 간 발신자 id로 격리합니다.
- `per-channel-peer`: 채널 + 발신자로 격리합니다 (다중 사용자 인박스에 권장).
- `per-account-channel-peer`: 계정 + 채널 + 발신자로 격리합니다 (다중 계정 인박스에 권장).
  `session.identityLinks`를 사용하여 프로바이더 접두사가 붙은 피어 id(예: `telegram:123`)를 정규 ID에 매핑하면 `per-peer`, `per-channel-peer` 또는 `per-account-channel-peer` 사용 시 동일한 사람이 채널 간에 DM 세션을 공유합니다.

## 게이트웨이가 진실의 원천

모든 세션 상태는 **게이트웨이**(OpenClaw "마스터")가 **소유**합니다. UI 클라이언트(macOS 앱, WebChat 등)는 로컬 파일을 읽는 대신 게이트웨이에 세션 목록과 토큰 수를 쿼리해야 합니다.

- **원격 모드**에서는 중요한 세션 저장소가 Mac이 아닌 원격 게이트웨이 호스트에 있습니다.
- UI에 표시되는 토큰 수는 게이트웨이의 저장소 필드(`inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`)에서 가져옵니다. 클라이언트는 JSONL 트랜스크립트를 파싱하여 합계를 "수정"하지 않습니다.

## 상태가 저장되는 위치

- **게이트웨이 호스트**에서:
  - 저장소 파일: `~/.openclaw/agents/<agentId>/sessions/sessions.json` (에이전트별).
- 트랜스크립트: `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl` (Telegram 토픽 세션은 `.../<SessionId>-topic-<threadId>.jsonl` 사용).
- 저장소는 `sessionKey -> { sessionId, updatedAt, ... }` 맵입니다. 항목 삭제는 안전합니다; 필요 시 다시 생성됩니다.
- 그룹 항목은 UI에서 세션에 레이블을 지정하기 위해 `displayName`, `channel`, `subject`, `room`, `space`를 포함할 수 있습니다.
- 세션 항목은 `origin` 메타데이터(레이블 + 라우팅 힌트)를 포함하여 UI가 세션의 출처를 설명할 수 있습니다.
- OpenClaw는 레거시 Pi/Tau 세션 폴더를 **읽지 않습니다**.

## 세션 프루닝

OpenClaw는 기본적으로 LLM 호출 직전에 인메모리 컨텍스트에서 **오래된 도구 결과**를 트리밍합니다.
이것은 JSONL 기록을 다시 쓰지 **않습니다**. [/concepts/session-pruning](/concepts/session-pruning)을 참조하세요.

## 사전 압축 메모리 플러시

세션이 자동 압축에 가까워지면 OpenClaw는 모델에게 디스크에 지속적인 메모를 작성하도록 상기시키는 **무음 메모리 플러시** 턴을 실행할 수 있습니다. 이는 워크스페이스가 쓰기 가능할 때만 실행됩니다. [메모리](/concepts/memory) 및 [압축](/concepts/compaction)을 참조하세요.

## 전송 → 세션 키 매핑

- 직접 채팅은 `session.dmScope`를 따릅니다(기본값 `main`).
  - `main`: `agent:<agentId>:<mainKey>` (디바이스/채널 간 연속성).
    - 여러 전화번호와 채널이 동일한 에이전트 메인 키에 매핑될 수 있습니다; 이들은 하나의 대화에 대한 전송 역할을 합니다.
  - `per-peer`: `agent:<agentId>:dm:<peerId>`.
  - `per-channel-peer`: `agent:<agentId>:<channel>:dm:<peerId>`.
  - `per-account-channel-peer`: `agent:<agentId>:<channel>:<accountId>:dm:<peerId>` (accountId 기본값은 `default`).
  - `session.identityLinks`가 프로바이더 접두사가 붙은 피어 id(예: `telegram:123`)와 일치하면 정규 키가 `<peerId>`를 대체하여 동일한 사람이 채널 간에 세션을 공유합니다.
- 그룹 채팅은 상태를 격리합니다: `agent:<agentId>:<channel>:group:<id>` (rooms/channels는 `agent:<agentId>:<channel>:channel:<id>` 사용).
  - Telegram 포럼 토픽은 격리를 위해 그룹 id에 `:topic:<threadId>`를 추가합니다.
  - 레거시 `group:<id>` 키는 마이그레이션을 위해 여전히 인식됩니다.
- 인바운드 컨텍스트는 여전히 `group:<id>`를 사용할 수 있습니다; 채널은 `Provider`에서 추론되고 정규 `agent:<agentId>:<channel>:group:<id>` 형식으로 정규화됩니다.
- 기타 소스:
  - Cron 작업: `cron:<job.id>`
  - 웹훅: `hook:<uuid>` (훅에서 명시적으로 설정하지 않은 경우)
  - 노드 실행: `node-<nodeId>`

## 라이프사이클

- 리셋 정책: 세션은 만료될 때까지 재사용되며, 만료는 다음 인바운드 메시지에서 평가됩니다.
- 일일 리셋: 기본값은 **게이트웨이 호스트 로컬 시간으로 오전 4시**입니다. 세션의 마지막 업데이트가 가장 최근 일일 리셋 시간보다 이전이면 세션은 오래된 것입니다.
- 유휴 리셋 (선택): `idleMinutes`는 슬라이딩 유휴 창을 추가합니다. 일일 및 유휴 리셋이 모두 설정된 경우 **먼저 만료되는 것**이 새 세션을 강제합니다.
- 레거시 유휴 전용: `session.reset`/`resetByType` 설정 없이 `session.idleMinutes`만 설정하면 OpenClaw는 이전 버전과의 호환성을 위해 유휴 전용 모드를 유지합니다.
- 유형별 재정의 (선택): `resetByType`을 사용하면 `dm`, `group`, `thread` 세션에 대한 정책을 재정의할 수 있습니다 (thread = Slack/Discord 스레드, Telegram 토픽, 커넥터가 제공하는 Matrix 스레드).
- 채널별 재정의 (선택): `resetByChannel`은 채널에 대한 리셋 정책을 재정의합니다 (해당 채널의 모든 세션 유형에 적용되며 `reset`/`resetByType`보다 우선).
- 리셋 트리거: 정확한 `/new` 또는 `/reset`(및 `resetTriggers`의 추가 항목)은 새 세션 id를 시작하고 메시지의 나머지 부분을 전달합니다. `/new <model>`은 새 세션 모델을 설정하기 위해 모델 별칭, `provider/model` 또는 프로바이더 이름(퍼지 매치)을 허용합니다. `/new` 또는 `/reset`만 단독으로 보내면 OpenClaw는 리셋을 확인하기 위해 짧은 "안녕" 인사 턴을 실행합니다.
- 수동 리셋: 저장소에서 특정 키를 삭제하거나 JSONL 트랜스크립트를 제거합니다; 다음 메시지에서 다시 생성됩니다.
- 격리된 cron 작업은 항상 실행마다 새로운 `sessionId`를 발급합니다 (유휴 재사용 없음).

## 전송 정책 (선택)

개별 id를 나열하지 않고 특정 세션 유형에 대한 전달을 차단합니다.

```json5
{
  session: {
    sendPolicy: {
      rules: [
        { action: "deny", match: { channel: "discord", chatType: "group" } },
        { action: "deny", match: { keyPrefix: "cron:" } },
      ],
      default: "allow",
    },
  },
}
```

런타임 재정의 (소유자 전용):

- `/send on` → 이 세션에 대해 허용
- `/send off` → 이 세션에 대해 거부
- `/send inherit` → 재정의를 지우고 설정 규칙 사용
  이것들은 등록되도록 독립 메시지로 보냅니다.

## 설정 (선택적 이름 변경 예제)

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    scope: "per-sender", // 그룹 키를 별도로 유지
    dmScope: "main", // DM 연속성 (공유 인박스의 경우 per-channel-peer/per-account-channel-peer 설정)
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      // 기본값: mode=daily, atHour=4 (게이트웨이 호스트 로컬 시간).
      // idleMinutes도 설정하면 먼저 만료되는 것이 적용됩니다.
      mode: "daily",
      atHour: 4,
      idleMinutes: 120,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      dm: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    mainKey: "main",
  },
}
```

## 검사

- `openclaw status` — 저장소 경로와 최근 세션을 표시합니다.
- `openclaw sessions --json` — 모든 항목을 덤프합니다 (`--active <minutes>`로 필터링).
- `openclaw gateway call sessions.list --params '{}'` — 실행 중인 게이트웨이에서 세션을 가져옵니다 (원격 게이트웨이 접속에는 `--url`/`--token` 사용).
- 채팅에서 `/status`를 독립 메시지로 보내면 에이전트에 접근할 수 있는지, 세션 컨텍스트가 얼마나 사용되었는지, 현재 thinking/verbose 토글, WhatsApp 웹 자격 증명이 마지막으로 새로고침된 시간을 볼 수 있습니다 (재연결 필요 여부 파악에 도움).
- `/context list` 또는 `/context detail`을 보내면 시스템 프롬프트에 무엇이 있고 주입된 워크스페이스 파일(및 가장 큰 컨텍스트 기여자)을 볼 수 있습니다.
- `/stop`을 독립 메시지로 보내면 현재 실행을 중단하고, 해당 세션의 큐에 있는 후속 작업을 지우고, 해당 세션에서 생성된 서브 에이전트 실행을 중지합니다 (응답에는 중지된 수가 포함).
- `/compact` (선택적 지침)를 독립 메시지로 보내면 오래된 컨텍스트를 요약하고 창 공간을 확보합니다. [/concepts/compaction](/concepts/compaction)을 참조하세요.
- JSONL 트랜스크립트를 직접 열어 전체 턴을 검토할 수 있습니다.

## 팁

- 기본 키를 1:1 트래픽 전용으로 유지합니다; 그룹은 자체 키를 갖게 합니다.
- 정리를 자동화할 때 다른 곳의 컨텍스트를 보존하기 위해 전체 저장소가 아닌 개별 키를 삭제합니다.

## 세션 출처 메타데이터

각 세션 항목은 `origin`에 출처를 기록합니다 (최선의 노력):

- `label`: 사람이 읽을 수 있는 레이블 (대화 레이블 + 그룹 제목/채널에서 해결)
- `provider`: 정규화된 채널 id (확장 포함)
- `from`/`to`: 인바운드 봉투의 원시 라우팅 id
- `accountId`: 프로바이더 계정 id (다중 계정 시)
- `threadId`: 채널이 지원하는 경우 스레드/토픽 id
  출처 필드는 직접 메시지, 채널 및 그룹에 대해 채워집니다. 커넥터가 전달 라우팅만 업데이트하는 경우(예: DM 메인 세션을 최신으로 유지하기 위해), 세션이 설명자 메타데이터를 유지하도록 여전히 인바운드 컨텍스트를 제공해야 합니다. 확장은 인바운드 컨텍스트에 `ConversationLabel`, `GroupSubject`, `GroupChannel`, `GroupSpace`, `SenderName`을 전송하고 `recordSessionMetaFromInbound`를 호출하거나(또는 동일한 컨텍스트를 `updateLastRoute`에 전달하여) 이를 수행할 수 있습니다.

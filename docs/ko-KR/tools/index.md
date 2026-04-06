---
summary: "에이전트 도구 (브라우저, 캔버스, 노드, 메시지, 크론) - 레거시 `openclaw-*` 스킬 대체"
read_when:
  - 에이전트 도구 추가 또는 수정 시
  - `openclaw-*` 스킬 제거 또는 변경 시
title: "도구"
---

# 도구 (OpenClaw)

OpenClaw는 브라우저, 캔버스, 노드, 크론을 위한 **일급 에이전트 도구**를 제공합니다.
이는 기존의 `openclaw-*` 스킬을 대체합니다: 도구는 타입이 지정되어 있고, 셸 실행이 없으며,
에이전트가 직접 사용할 수 있습니다.

## 도구 비활성화

`openclaw.json`의 `tools.allow` / `tools.deny`를 통해 전역적으로 도구를 허용/거부할 수 있습니다
(거부가 우선). 이렇게 하면 허용되지 않은 도구가 모델 프로바이더로 전송되지 않습니다.

```json5
{
  tools: { deny: ["browser"] },
}
```

참고사항:

- 매칭은 대소문자를 구분하지 않습니다.
- `*` 와일드카드가 지원됩니다 (`"*"`는 모든 도구를 의미).
- `tools.allow`가 알 수 없거나 로드되지 않은 플러그인 도구 이름만 참조하는 경우, OpenClaw는 경고를 기록하고 허용 목록을 무시하여 핵심 도구를 사용할 수 있도록 합니다.

## 도구 프로필 (기본 허용 목록)

`tools.profile`은 `tools.allow`/`tools.deny` 이전에 **기본 도구 허용 목록**을 설정합니다.
에이전트별 재정의: `agents.list[].tools.profile`.

프로필:

- `minimal`: `session_status`만
- `coding`: `group:fs`, `group:runtime`, `group:sessions`, `group:memory`, `image`
- `messaging`: `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`
- `full`: 제한 없음 (설정 안 함과 동일)

예시 (기본적으로 메시징 전용, Slack + Discord 도구도 허용):

```json5
{
  tools: {
    profile: "messaging",
    allow: ["slack", "discord"],
  },
}
```

예시 (코딩 프로필, 하지만 모든 곳에서 exec/process 거부):

```json5
{
  tools: {
    profile: "coding",
    deny: ["group:runtime"],
  },
}
```

예시 (전역 코딩 프로필, 메시징 전용 지원 에이전트):

```json5
{
  tools: { profile: "coding" },
  agents: {
    list: [
      {
        id: "support",
        tools: { profile: "messaging", allow: ["slack"] },
      },
    ],
  },
}
```

## 프로바이더별 도구 정책

`tools.byProvider`를 사용하여 전역 기본값을 변경하지 않고 특정 프로바이더
(또는 단일 `provider/model`)에 대해 도구를 **추가로 제한**할 수 있습니다.
에이전트별 재정의: `agents.list[].tools.byProvider`.

이는 기본 도구 프로필 **이후**, 허용/거부 목록 **이전**에 적용되므로
도구 세트만 좁힐 수 있습니다.
프로바이더 키는 `provider` (예: `google-antigravity`) 또는
`provider/model` (예: `openai/gpt-5.2`)을 허용합니다.

예시 (전역 코딩 프로필 유지, Google Antigravity는 최소 도구만):

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```

예시 (불안정한 엔드포인트에 대한 프로바이더/모델별 허용 목록):

```json5
{
  tools: {
    allow: ["group:fs", "group:runtime", "sessions_list"],
    byProvider: {
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

예시 (단일 프로바이더에 대한 에이전트별 재정의):

```json5
{
  agents: {
    list: [
      {
        id: "support",
        tools: {
          byProvider: {
            "google-antigravity": { allow: ["message", "sessions_list"] },
          },
        },
      },
    ],
  },
}
```

## 도구 그룹 (단축키)

도구 정책 (전역, 에이전트, 샌드박스)은 여러 도구로 확장되는 `group:*` 항목을 지원합니다.
`tools.allow` / `tools.deny`에서 사용하세요.

사용 가능한 그룹:

- `group:runtime`: `exec`, `bash`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: 모든 내장 OpenClaw 도구 (프로바이더 플러그인 제외)

예시 (파일 도구 + 브라우저만 허용):

```json5
{
  tools: {
    allow: ["group:fs", "browser"],
  },
}
```

## 플러그인 + 도구

플러그인은 핵심 세트를 넘어서 **추가 도구** (및 CLI 명령)를 등록할 수 있습니다.
설치 + 설정은 [플러그인](/plugin)을 참조하고, 도구 사용 안내가 프롬프트에 주입되는 방식은
[스킬](/tools/skills)을 참조하세요. 일부 플러그인은 도구와 함께 자체 스킬을 제공합니다
(예: voice-call 플러그인).

선택적 플러그인 도구:

- [Lobster](/tools/lobster): 재개 가능한 승인이 있는 타입이 지정된 워크플로 런타임 (게이트웨이 호스트에 Lobster CLI 필요).
- [LLM Task](/tools/llm-task): 구조화된 워크플로 출력을 위한 JSON 전용 LLM 단계 (선택적 스키마 검증).

## 도구 목록

### `apply_patch`

하나 이상의 파일에 구조화된 패치를 적용합니다. 다중 헝크 편집에 사용합니다.
실험 기능: `tools.exec.applyPatch.enabled`를 통해 활성화 (OpenAI 모델만).

### `exec`

워크스페이스에서 셸 명령을 실행합니다.

핵심 매개변수:

- `command` (필수)
- `yieldMs` (타임아웃 후 자동 백그라운드, 기본값 10000)
- `background` (즉시 백그라운드)
- `timeout` (초; 초과 시 프로세스 종료, 기본값 1800)
- `elevated` (bool; 상승된 모드가 활성화/허용된 경우 호스트에서 실행; 에이전트가 샌드박스 격리된 경우에만 동작 변경)
- `host` (`sandbox | gateway | node`)
- `security` (`deny | allowlist | full`)
- `ask` (`off | on-miss | always`)
- `node` (`host=node`인 경우 노드 id/name)
- 실제 TTY가 필요한가요? `pty: true`를 설정하세요.

참고사항:

- 백그라운드 실행 시 `sessionId`와 함께 `status: "running"`을 반환합니다.
- `process`를 사용하여 백그라운드 세션을 폴링/로그/쓰기/종료/정리합니다.
- `process`가 허용되지 않으면, `exec`는 동기적으로 실행되고 `yieldMs`/`background`를 무시합니다.
- `elevated`는 `tools.elevated`와 `agents.list[].tools.elevated` 재정의 (둘 다 허용해야 함)에 의해 제어되며, `host=gateway` + `security=full`의 별칭입니다.
- `elevated`는 에이전트가 샌드박스 격리된 경우에만 동작을 변경합니다 (그렇지 않으면 no-op).
- `host=node`는 macOS 컴패니언 앱 또는 헤드리스 노드 호스트 (`openclaw node run`)를 대상으로 할 수 있습니다.
- 게이트웨이/노드 승인 및 허용 목록: [Exec 승인](/tools/exec-approvals).

### `process`

백그라운드 exec 세션을 관리합니다.

핵심 작업:

- `list`, `poll`, `log`, `write`, `kill`, `clear`, `remove`

참고사항:

- `poll`은 새로운 출력과 완료 시 종료 상태를 반환합니다.
- `log`는 라인 기반 `offset`/`limit`를 지원합니다 (마지막 N 라인을 가져오려면 `offset` 생략).
- `process`는 에이전트별로 범위가 지정됩니다; 다른 에이전트의 세션은 표시되지 않습니다.

### `web_search`

Brave Search API를 사용하여 웹을 검색합니다.

핵심 매개변수:

- `query` (필수)
- `count` (1–10; `tools.web.search.maxResults`의 기본값)

참고사항:

- Brave API 키가 필요합니다 (권장: `openclaw configure --section web`, 또는 `BRAVE_API_KEY` 설정).
- `tools.web.search.enabled`를 통해 활성화합니다.
- 응답은 캐시됩니다 (기본값 15분).
- 설정은 [웹 도구](/tools/web)를 참조하세요.

### `web_fetch`

URL에서 읽기 가능한 콘텐츠를 가져옵니다 (HTML → 마크다운/텍스트).

핵심 매개변수:

- `url` (필수)
- `extractMode` (`markdown` | `text`)
- `maxChars` (긴 페이지 잘라내기)

참고사항:

- `tools.web.fetch.enabled`를 통해 활성화합니다.
- 응답은 캐시됩니다 (기본값 15분).
- JS가 많은 사이트의 경우 브라우저 도구를 선호하세요.
- 설정은 [웹 도구](/tools/web)를 참조하세요.
- 선택적 봇 방지 대체는 [Firecrawl](/tools/firecrawl)을 참조하세요.

### `browser`

전용 OpenClaw 관리 브라우저를 제어합니다.

핵심 작업:

- `status`, `start`, `stop`, `tabs`, `open`, `focus`, `close`
- `snapshot` (aria/ai)
- `screenshot` (이미지 블록 + `MEDIA:<path>` 반환)
- `act` (UI 작업: click/type/press/hover/drag/select/fill/resize/wait/evaluate)
- `navigate`, `console`, `pdf`, `upload`, `dialog`

프로필 관리:

- `profiles` — 모든 브라우저 프로필을 상태와 함께 나열
- `create-profile` — 자동 할당된 포트 (또는 `cdpUrl`)로 새 프로필 생성
- `delete-profile` — 브라우저 중지, 사용자 데이터 삭제, 설정에서 제거 (로컬만)
- `reset-profile` — 프로필의 포트에서 고아 프로세스 종료 (로컬만)

일반 매개변수:

- `profile` (선택사항; 기본값은 `browser.defaultProfile`)
- `target` (`sandbox` | `host` | `node`)
- `node` (선택사항; 특정 노드 id/name 선택)
  참고사항:
- `browser.enabled=true`가 필요합니다 (기본값은 `true`; 비활성화하려면 `false`로 설정).
- 모든 작업은 다중 인스턴스 지원을 위한 선택적 `profile` 매개변수를 허용합니다.
- `profile`이 생략되면, `browser.defaultProfile`을 사용합니다 (기본값은 "chrome").
- 프로필 이름: 소문자 영숫자 + 하이픈만 (최대 64자).
- 포트 범위: 18800-18899 (최대 ~100개 프로필).
- 원격 프로필은 연결 전용입니다 (시작/중지/재설정 불가).
- 브라우저 가능한 노드가 연결되어 있으면, 도구가 자동으로 해당 노드로 라우팅할 수 있습니다 (`target`을 고정하지 않는 한).
- `snapshot`은 Playwright가 설치된 경우 기본값이 `ai`입니다; 접근성 트리를 위해 `aria`를 사용하세요.
- `snapshot`은 `e12`와 같은 참조를 반환하는 역할 스냅샷 옵션 (`interactive`, `compact`, `depth`, `selector`)도 지원합니다.
- `act`는 `snapshot`의 `ref`가 필요합니다 (AI 스냅샷의 숫자 `12`, 또는 역할 스냅샷의 `e12`); 드문 CSS 선택자 요구 사항에는 `evaluate`를 사용하세요.
- 기본적으로 `act` → `wait`를 피하세요; 예외적인 경우에만 사용하세요 (대기할 신뢰할 수 있는 UI 상태가 없는 경우).
- `upload`는 선택적으로 `ref`를 전달하여 준비 후 자동 클릭할 수 있습니다.
- `upload`는 `<input type="file">`을 직접 설정하기 위한 `inputRef` (aria ref) 또는 `element` (CSS 선택자)도 지원합니다.

### `canvas`

노드 캔버스를 구동합니다 (present, eval, snapshot, A2UI).

핵심 작업:

- `present`, `hide`, `navigate`, `eval`
- `snapshot` (이미지 블록 + `MEDIA:<path>` 반환)
- `a2ui_push`, `a2ui_reset`

참고사항:

- 내부적으로 게이트웨이 `node.invoke`를 사용합니다.
- `node`가 제공되지 않으면, 도구가 기본값을 선택합니다 (단일 연결된 노드 또는 로컬 mac 노드).
- A2UI는 v0.8만 지원합니다 (`createSurface` 없음); CLI는 라인 오류가 있는 v0.9 JSONL을 거부합니다.
- 빠른 확인: `openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"`.

### `nodes`

페어링된 노드를 발견하고 대상으로 지정합니다; 알림을 보냅니다; 카메라/화면을 캡처합니다.

핵심 작업:

- `status`, `describe`
- `pending`, `approve`, `reject` (페어링)
- `notify` (macOS `system.notify`)
- `run` (macOS `system.run`)
- `camera_snap`, `camera_clip`, `screen_record`
- `location_get`

참고사항:

- 카메라/화면 명령은 노드 앱이 포그라운드에 있어야 합니다.
- 이미지는 이미지 블록 + `MEDIA:<path>`를 반환합니다.
- 비디오는 `FILE:<path>` (mp4)를 반환합니다.
- 위치는 JSON 페이로드 (위도/경도/정확도/타임스탬프)를 반환합니다.
- `run` 매개변수: `command` argv 배열; 선택적 `cwd`, `env` (`KEY=VAL`), `commandTimeoutMs`, `invokeTimeoutMs`, `needsScreenRecording`.

예시 (`run`):

```json
{
  "action": "run",
  "node": "office-mac",
  "command": ["echo", "Hello"],
  "env": ["FOO=bar"],
  "commandTimeoutMs": 12000,
  "invokeTimeoutMs": 45000,
  "needsScreenRecording": false
}
```

### `image`

설정된 이미지 모델로 이미지를 분석합니다.

핵심 매개변수:

- `image` (필수 경로 또는 URL)
- `prompt` (선택사항; 기본값 "Describe the image.")
- `model` (선택적 재정의)
- `maxBytesMb` (선택적 크기 제한)

참고사항:

- `agents.defaults.imageModel`이 설정된 경우 (기본 또는 대체)에만 사용 가능하며, 또는 기본 모델 + 설정된 인증에서 암시적 이미지 모델을 추론할 수 있는 경우 (최선의 노력 페어링).
- 이미지 모델을 직접 사용합니다 (기본 채팅 모델과 독립적).

### `message`

Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/iMessage/MS Teams에서 메시지 및 채널 작업을 보냅니다.

핵심 작업:

- `send` (텍스트 + 선택적 미디어; MS Teams는 Adaptive Cards를 위한 `card`도 지원)
- `poll` (WhatsApp/Discord/MS Teams 투표)
- `react` / `reactions` / `read` / `edit` / `delete`
- `pin` / `unpin` / `list-pins`
- `permissions`
- `thread-create` / `thread-list` / `thread-reply`
- `search`
- `sticker`
- `member-info` / `role-info`
- `emoji-list` / `emoji-upload` / `sticker-upload`
- `role-add` / `role-remove`
- `channel-info` / `channel-list`
- `voice-status`
- `event-list` / `event-create`
- `timeout` / `kick` / `ban`

참고사항:

- `send`는 WhatsApp을 게이트웨이를 통해 라우팅합니다; 다른 채널은 직접 이동합니다.
- `poll`은 WhatsApp 및 MS Teams에 게이트웨이를 사용합니다; Discord 투표는 직접 이동합니다.
- 메시지 도구 호출이 활성 채팅 세션에 바인딩된 경우, 전송은 컨텍스트 간 누출을 방지하기 위해 해당 세션의 대상으로 제한됩니다.

### `cron`

게이트웨이 크론 작업 및 웨이크업을 관리합니다.

핵심 작업:

- `status`, `list`
- `add`, `update`, `remove`, `run`, `runs`
- `wake` (시스템 이벤트 대기열 + 선택적 즉시 하트비트)

참고사항:

- `add`는 전체 크론 작업 객체를 예상합니다 (`cron.add` RPC와 동일한 스키마).
- `update`는 `{ id, patch }`를 사용합니다.

### `gateway`

실행 중인 게이트웨이 프로세스를 재시작하거나 업데이트를 적용합니다 (제자리).

핵심 작업:

- `restart` (권한 부여 + 제자리 재시작을 위한 `SIGUSR1` 전송; `openclaw gateway` 제자리 재시작)
- `config.get` / `config.schema`
- `config.apply` (검증 + 설정 쓰기 + 재시작 + 웨이크)
- `config.patch` (부분 업데이트 병합 + 재시작 + 웨이크)
- `update.run` (업데이트 실행 + 재시작 + 웨이크)

참고사항:

- `delayMs` (기본값 2000)를 사용하여 진행 중인 응답을 방해하지 않도록 합니다.
- `restart`는 기본적으로 비활성화되어 있습니다; `commands.restart: true`로 활성화하세요.

### `sessions_list` / `sessions_history` / `sessions_send` / `sessions_spawn` / `session_status`

세션을 나열하고, 대화 내역을 검사하거나, 다른 세션으로 보냅니다.

핵심 매개변수:

- `sessions_list`: `kinds?`, `limit?`, `activeMinutes?`, `messageLimit?` (0 = 없음)
- `sessions_history`: `sessionKey` (또는 `sessionId`), `limit?`, `includeTools?`
- `sessions_send`: `sessionKey` (또는 `sessionId`), `message`, `timeoutSeconds?` (0 = fire-and-forget)
- `sessions_spawn`: `task`, `label?`, `agentId?`, `model?`, `runTimeoutSeconds?`, `cleanup?`
- `session_status`: `sessionKey?` (기본값 현재; `sessionId` 허용), `model?` (`default`는 재정의 지움)

참고사항:

- `main`은 정식 직접 채팅 키입니다; global/unknown은 숨겨집니다.
- `messageLimit > 0`은 세션당 마지막 N개 메시지를 가져옵니다 (도구 메시지 필터링됨).
- `sessions_send`는 `timeoutSeconds > 0`일 때 최종 완료를 기다립니다.
- 전달/알림은 완료 후 발생하며 최선의 노력입니다; `status: "ok"`는 에이전트 실행이 완료되었음을 확인하며, 알림이 전달되었음을 확인하지 않습니다.
- `sessions_spawn`은 하위 에이전트 실행을 시작하고 요청자 채팅에 알림 응답을 게시합니다.
- `sessions_spawn`은 비차단이며 즉시 `status: "accepted"`를 반환합니다.
- `sessions_send`는 응답-백 핑-퐁을 실행합니다 (중지하려면 `REPLY_SKIP` 응답; 최대 턴은 `session.agentToAgent.maxPingPongTurns`, 0–5).
- 핑-퐁 후, 대상 에이전트는 **알림 단계**를 실행합니다; 알림을 억제하려면 `ANNOUNCE_SKIP` 응답하세요.

### `agents_list`

현재 세션이 `sessions_spawn`으로 대상으로 지정할 수 있는 에이전트 id를 나열합니다.

참고사항:

- 결과는 에이전트별 허용 목록 (`agents.list[].subagents.allowAgents`)으로 제한됩니다.
- `["*"]`이 설정되면, 도구는 설정된 모든 에이전트를 포함하고 `allowAny: true`를 표시합니다.

## 매개변수 (공통)

게이트웨이 지원 도구 (`canvas`, `nodes`, `cron`):

- `gatewayUrl` (기본값 `ws://127.0.0.1:18789`)
- `gatewayToken` (인증 활성화된 경우)
- `timeoutMs`

브라우저 도구:

- `profile` (선택사항; 기본값은 `browser.defaultProfile`)
- `target` (`sandbox` | `host` | `node`)
- `node` (선택사항; 특정 노드 id/name 고정)

## 권장 에이전트 흐름

브라우저 자동화:

1. `browser` → `status` / `start`
2. `snapshot` (ai 또는 aria)
3. `act` (click/type/press)
4. 시각적 확인이 필요한 경우 `screenshot`

캔버스 렌더:

1. `canvas` → `present`
2. `a2ui_push` (선택사항)
3. `snapshot`

노드 대상 지정:

1. `nodes` → `status`
2. 선택한 노드에서 `describe`
3. `notify` / `run` / `camera_snap` / `screen_record`

## 안전

- 직접 `system.run`을 피하세요; 명시적인 사용자 동의가 있는 경우에만 `nodes` → `run`을 사용하세요.
- 카메라/화면 캡처에 대한 사용자 동의를 존중하세요.
- 미디어 명령을 호출하기 전에 `status/describe`를 사용하여 권한을 확인하세요.

## 에이전트에게 도구가 제공되는 방식

도구는 두 개의 병렬 채널을 통해 노출됩니다:

1. **시스템 프롬프트 텍스트**: 사람이 읽을 수 있는 목록 + 안내.
2. **도구 스키마**: 모델 API로 전송되는 구조화된 함수 정의.

이는 에이전트가 "어떤 도구가 존재하는지"와 "이를 호출하는 방법"을 모두 볼 수 있음을 의미합니다. 도구가
시스템 프롬프트 또는 스키마에 나타나지 않으면, 모델은 이를 호출할 수 없습니다.

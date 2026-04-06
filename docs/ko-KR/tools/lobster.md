---
title: Lobster
summary: "승인 게이트가 있는 OpenClaw용 유형화된 워크플로우 런타임."
description: OpenClaw용 유형화된 워크플로우 런타임 — 승인 게이트가 있는 조합 가능한 파이프라인.
read_when:
  - 명시적 승인이 있는 결정론적 다단계 워크플로우가 필요한 경우
  - 이전 단계를 다시 실행하지 않고 워크플로우를 재개해야 하는 경우
---

# Lobster

Lobster는 OpenClaw가 여러 단계의 도구 시퀀스를 명시적 승인 체크포인트가 있는 단일의 결정론적 작업으로 실행할 수 있도록 하는 워크플로우 셸입니다.

## 핵심 아이디어

어시스턴트는 자신을 관리하는 도구를 만들 수 있습니다. 워크플로우를 요청하면 30분 후에 CLI와 한 번의 호출로 실행되는 파이프라인을 갖게 됩니다. Lobster는 부족한 부분입니다: 결정론적 파이프라인, 명시적 승인, 그리고 재개 가능한 상태입니다.

## 왜 사용하는가

현재 복잡한 워크플로우는 많은 왕복 도구 호출이 필요합니다. 각 호출은 토큰 비용이 들고, LLM이 매 단계를 오케스트레이션해야 합니다. Lobster는 그 오케스트레이션을 유형화된 런타임으로 이동합니다:

- **여러 호출 대신 하나의 호출**: OpenClaw는 하나의 Lobster 도구 호출을 실행하고 구조화된 결과를 얻습니다.
- **내장된 승인**: 부작용(이메일 발송, 댓글 게시)은 명시적으로 승인될 때까지 워크플로우를 중단합니다.
- **재개 가능**: 중단된 워크플로우는 토큰을 반환합니다. 승인하고 모든 것을 다시 실행하지 않고도 재개할 수 있습니다.

## DSL이 일반 프로그램 대신 사용되는 이유

Lobster는 의도적으로 작습니다. 목표는 "새로운 언어"가 아니라 예측 가능하고 AI 친화적인 파이프라인 스펙으로, 1등급 승인과 재개 토큰을 갖추고 있습니다.

- **승인/재개는 내장됨**: 일반 프로그램은 사용자에게 프롬프트를 표시할 수 있지만, 해당 런타임을 직접 구현하지 않으면 지속적인 토큰으로 *일시 중지하고 재개*할 수 없습니다.
- **결정론성 + 감사 가능성**: 파이프라인은 데이터이므로 쉽게 로깅, 차이 확인, 재생, 그리고 검토할 수 있습니다.
- **AI를 위한 제한된 표면**: 작은 문법 + JSON 파이핑으로 "창의적인" 코드 경로를 줄이고 검증을 현실적으로 만듭니다.
- **내장된 안전 정책**: 타임아웃, 출력 제한, 샌드박스 검사, 그리고 허용 목록은 각 스크립트가 아닌 런타임에 의해 적용됩니다.
- **여전히 프로그래밍 가능**: 각 단계는 모든 CLI 또는 스크립트를 호출할 수 있습니다. JS/TS를 원하면 코드에서 `.lobster` 파일을 생성합니다.

## 작동 방식

OpenClaw는 로컬 `lobster` CLI를 **도구 모드**에서 시작하고 stdout에서 JSON 봉투를 파싱합니다.
파이프라인이 승인을 위해 일시 중지하면, 도구는 `resumeToken`을 반환하여 나중에 계속 진행할 수 있습니다.

## 패턴: 작은 CLI + JSON 파이프 + 승인

JSON을 말하는 작은 명령을 만든 다음, 이들을 단일 Lobster 호출로 체인합니다. (아래 예제 명령 이름 — 자신의 것으로 교체합니다.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

파이프라인이 승인을 요청하면 토큰으로 재개합니다:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI가 워크플로우를 트리거합니다. Lobster가 단계를 실행합니다. 승인 게이트는 부작용을 명시적이고 감사 가능하게 유지합니다.

예: 입력 항목을 도구 호출로 매핑:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON 전용 LLM 단계 (llm-task)

구조화된 LLM 단계가 필요한 워크플로우의 경우, 선택적
`llm-task` 플러그인 도구를 활성화하고 Lobster에서 호출합니다. 이는 워크플로우를 결정론적으로 유지하면서도 모델로 분류/요약/초안을 작성할 수 있습니다.

도구 활성화:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

파이프라인에서 사용:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

자세한 내용과 설정 옵션은 [LLM Task](/ko-KR/tools/llm-task)를 참조합니다.

## 워크플로우 파일 (.lobster)

Lobster는 `name`, `args`, `steps`, `env`, `condition`, 그리고 `approval` 필드가 있는 YAML/JSON 워크플로우 파일을 실행할 수 있습니다. OpenClaw 도구 호출에서, `pipeline`을 파일 경로로 설정합니다.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

참고:

- `stdin: $step.stdout` 및 `stdin: $step.json`은 이전 단계의 출력을 전달합니다.
- `condition` (또는 `when`)은 `$step.approved`의 단계를 게이트할 수 있습니다.

## Lobster 설치

OpenClaw 게이트웨이를 실행하는 **같은 호스트**에 Lobster CLI를 설치합니다 ([Lobster 저장소](https://github.com/openclaw/lobster) 참조). `lobster`이 `PATH` 위에 있는지 확인합니다.
사용자 정의 바이너리 위치를 사용하려면, 도구 호출에서 절대 경로 `lobsterPath`를 전달합니다.

## 도구 활성화

Lobster는 **선택 사항** 플러그인 도구입니다(기본적으로 활성화되지 않음).

권장 사항 (추가, 안전):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

또는 에이전트별:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

제한적 허용 목록 모드에서 실행하려는 의도가 없으면 `tools.allow: ["lobster"]`를 사용하지 마세요.

참고: 허용 목록은 선택적 플러그인에서 옵트인입니다. 허용 목록이 플러그인 도구(예: `lobster`)만 명명하면, OpenClaw는 핵심 도구를 활성화된 상태로 유지합니다. 핵심 도구를 제한하려면, 허용 목록에 원하는 핵심 도구 또는 그룹을 포함합니다.

## 예: 이메일 분류

Lobster 없이:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Lobster 사용:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

JSON 봉투를 반환합니다 (축약됨):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

사용자가 승인 → 재개:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

하나의 워크플로우. 결정론적. 안전함.

## 도구 매개변수

### `run`

도구 모드에서 파이프라인을 실행합니다.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "/path/to/workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

인수를 사용하여 워크플로우 파일을 실행합니다:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

승인 후 중단된 워크플로우를 계속합니다.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 선택 사항 입력

- `lobsterPath`: Lobster 바이너리의 절대 경로 (생략하면 `PATH` 사용).
- `cwd`: 파이프라인의 작업 디렉토리 (기본값은 현재 프로세스 작업 디렉토리).
- `timeoutMs`: 이 기간을 초과하면 서브프로세스를 종료합니다 (기본값: 20000).
- `maxStdoutBytes`: stdout이 이 크기를 초과하면 서브프로세스를 종료합니다 (기본값: 512000).
- `argsJson`: `lobster run --args-json`로 전달되는 JSON 문자열 (워크플로우 파일만).

## 출력 봉투

Lobster는 다음 세 가지 상태 중 하나를 가진 JSON 봉투를 반환합니다:

- `ok` → 성공적으로 완료됨
- `needs_approval` → 일시 중지됨; `requiresApproval.resumeToken`은 재개에 필요함
- `cancelled` → 명시적으로 거부됨 또는 취소됨

도구는 봉투를 `content` (멋진 JSON)와 `details` (원본 개체) 모두에 표시합니다.

## 승인

`requiresApproval`이 있으면, 프롬프트를 검사하고 결정합니다:

- `approve: true` → 계속하고 부작용을 진행합니다
- `approve: false` → 취소하고 워크플로우를 완료합니다

사용자 정의 jq/heredoc 접착제 없이 승인 요청에 JSON 미리보기를 첨부하려면 `approve --preview-from-stdin --limit N`을 사용합니다. 재개 토큰은 이제 압축됩니다: Lobster는 워크플로우 재개 상태를 해당 상태 디렉토리 아래에 저장하고 작은 토큰 키를 반환합니다.

## OpenProse

OpenProse는 Lobster와 잘 맞습니다: `/prose`를 사용하여 다중 에이전트 준비를 오케스트레이션한 다음, 결정론적 승인을 위해 Lobster 파이프라인을 실행합니다. Prose 프로그램이 Lobster가 필요하면, `tools.subagents.tools`를 통해 하위 에이전트에 `lobster` 도구를 허용합니다. [OpenProse](/ko-KR/prose)를 참조합니다.

## 안전성

- **로컬 서브프로세스만** — 플러그인 자체에서 네트워크 호출이 없습니다.
- **비밀 없음** — Lobster는 OAuth를 관리하지 않습니다. 이를 수행하는 OpenClaw 도구를 호출합니다.
- **샌드박스 인식** — 도구 컨텍스트가 샌드박스 격리된 경우 비활성화됩니다.
- **강화됨** — `lobsterPath`를 지정한 경우 절대 경로여야 합니다. 타임아웃과 출력 제한이 적용됩니다.

## 문제 해결

- **`lobster subprocess timed out`** → `timeoutMs`을 증가하거나 긴 파이프라인을 분할합니다.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes`를 올리거나 출력 크기를 줄입니다.
- **`lobster returned invalid JSON`** → 파이프라인이 도구 모드에서 실행되고 JSON만 출력하는지 확인합니다.
- **`lobster failed (code …)`** → 터미널에서 같은 파이프라인을 실행하여 stderr을 검사합니다.

## 더 알아보기

- [플러그인](/ko-KR/plugin)
- [플러그인 도구 작성](/ko-KR/plugins/agent-tools)

## 사례 연구: 커뮤니티 워크플로우

공개 예: 세 개의 Markdown 저장소(개인, 파트너, 공유)를 관리하는 "두 번째 뇌" CLI + Lobster 파이프라인. CLI는 통계, 받은편지함 목록, 그리고 오래된 스캔을 위해 JSON을 내보냅니다. Lobster는 이러한 명령을 `weekly-review`, `inbox-triage`, `memory-consolidation`, 그리고 `shared-task-sync` 같은 워크플로우로 체인화합니다. 각각은 승인 게이트가 있습니다. AI는 가능할 때 판단(분류)을 처리하고 사용 가능하지 않을 때 결정론적 규칙으로 돌아갑니다.

- 스레드: https://x.com/plattenschieber/status/2014508656335770033
- 저장소: https://github.com/bloomedai/brain-cli

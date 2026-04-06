---
summary: "깊이 있는 설명: 세션 저장소 + 트랜스크립트, 라이프사이클, (자동)압축 내부 구조"
read_when:
  - 세션 ID, 트랜스크립트 JSONL, 또는 sessions.json 필드를 디버깅해야 할 때
  - 자동 압축 동작을 변경하거나 "압축 전" 정리 작업을 추가할 때
  - 메모리 플러시 또는 무음 시스템 턴을 구현하려고 할 때
title: "세션 관리 및 압축 깊이 있는 설명"
---

# 세션 관리 및 압축 (깊이 있는 설명)

이 문서에서는 OpenClaw가 세션을 end-to-end로 관리하는 방법을 설명합니다:

- **세션 라우팅** (인바운드 메시지가 `sessionKey`로 매핑되는 방식)
- **세션 저장소** (`sessions.json`) 및 추적 내용
- **트랜스크립트 지속성** (`*.jsonl`) 및 구조
- **트랜스크립트 위생** (실행 전 프로바이더별 수정)
- **컨텍스트 제한** (컨텍스트 윈도우 vs 추적된 토큰)
- **압축** (수동 + 자동 압축) 및 압축 전 작업을 연결할 위치
- **무음 정리 작업** (예: 사용자에게 보이지 않는 메모리 쓰기)

먼저 높은 수준의 개요를 원한다면 다음부터 시작하세요:

- [/concepts/session](/concepts/session)
- [/concepts/compaction](/concepts/compaction)
- [/concepts/session-pruning](/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## 신뢰할 수 있는 소스: 게이트웨이

OpenClaw는 세션 상태를 소유하는 단일 **게이트웨이 프로세스**를 중심으로 설계되었습니다.

- UI (macOS 앱, 웹 Control UI, TUI)는 세션 목록 및 토큰 개수에 대해 게이트웨이를 조회해야 합니다.
- 원격 모드에서는 세션 파일이 원격 호스트에 있으므로 "로컬 Mac 파일 확인"은 게이트웨이가 사용하는 것을 반영하지 않습니다.

---

## 두 가지 지속성 계층

OpenClaw는 두 계층에서 세션을 유지합니다:

1. **세션 저장소 (`sessions.json`)**
   - 키/값 맵: `sessionKey -> SessionEntry`
   - 작고 변경 가능하며 안전하게 편집 가능 (또는 항목 삭제 가능)
   - 세션 메타데이터 추적 (현재 세션 ID, 마지막 활동, 토글, 토큰 카운터 등)

2. **트랜스크립트 (`<sessionId>.jsonl`)**
   - 트리 구조가 있는 추가 전용 트랜스크립트 (항목은 `id` + `parentId`)
   - 실제 대화 + 도구 호출 + 압축 요약 저장
   - 향후 턴을 위해 모델 컨텍스트를 재구성하는 데 사용됨

---

## 온디스크 위치

게이트웨이 호스트의 에이전트당:

- 저장소: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 트랜스크립트: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 토픽 세션: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw는 `src/config/sessions.ts`를 통해 이들을 확인합니다.

---

## 세션 키 (`sessionKey`)

`sessionKey`는 *어떤 대화 버킷*에 있는지를 식별합니다 (라우팅 + 격리).

일반적인 패턴:

- 메인/직접 채팅 (에이전트당): `agent:<agentId>:<mainKey>` (기본값 `main`)
- 그룹: `agent:<agentId>:<channel>:group:<id>`
- 룸/채널 (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` 또는 `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (재정의하지 않은 경우)

정식 규칙은 [/concepts/session](/concepts/session)에 문서화되어 있습니다.

---

## 세션 ID (`sessionId`)

각 `sessionKey`는 현재 `sessionId` (대화를 계속하는 트랜스크립트 파일)를 가리킵니다.

경험상 규칙:

- **재설정** (`/new`, `/reset`)은 해당 `sessionKey`에 대해 새로운 `sessionId`를 생성합니다.
- **일일 재설정** (기본값: 게이트웨이 호스트의 현지 시간 오전 4:00)은 재설정 경계 이후 다음 메시지에서 새 `sessionId`를 생성합니다.
- **유휴 만료** (`session.reset.idleMinutes` 또는 레거시 `session.idleMinutes`)는 유휴 윈도우 이후 메시지가 도착할 때 새 `sessionId`를 생성합니다. 일일 재설정과 유휴 모두 설정된 경우 먼저 만료되는 것이 우선합니다.

구현 세부사항: 결정은 `src/auto-reply/reply/session.ts`의 `initSessionState()`에서 발생합니다.

---

## 세션 저장소 스키마 (`sessions.json`)

저장소의 값 유형은 `src/config/sessions.ts`의 `SessionEntry`입니다.

주요 필드 (전부는 아님):

- `sessionId`: 현재 트랜스크립트 ID (파일명은 `sessionFile`이 설정되지 않으면 이로부터 유도됨)
- `updatedAt`: 마지막 활동 타임스탬프
- `sessionFile`: 선택사항인 명시적 트랜스크립트 경로 재정의
- `chatType`: `direct | group | room` (UI와 전송 정책에 도움)
- `provider`, `subject`, `room`, `space`, `displayName`: 그룹/채널 레이블링을 위한 메타데이터
- 토글:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (세션별 재정의)
- 모델 선택:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- 토큰 카운터 (최선의 노력 / 프로바이더 종속):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: 이 세션 키에 대해 자동 압축이 완료된 횟수
- `memoryFlushAt`: 마지막 압축 전 메모리 플러시에 대한 타임스탬프
- `memoryFlushCompactionCount`: 마지막 플러시가 실행되었을 때의 압축 개수

저장소는 편집하기에 안전하지만 게이트웨이가 권한을 가집니다: 세션이 실행될 때 항목을 재작성하거나 재수화할 수 있습니다.

---

## 트랜스크립트 구조 (`*.jsonl`)

트랜스크립트는 `@mariozechner/pi-coding-agent`의 `SessionManager`에 의해 관리됩니다.

파일은 JSONL입니다:

- 첫 번째 줄: 세션 헤더 (`type: "session"`, `id`, `cwd`, `timestamp`, 선택사항인 `parentSession` 포함)
- 그 다음: `id` + `parentId` (트리)가 있는 세션 항목

주목할 항목 유형:

- `message`: 사용자/어시스턴트/toolResult 메시지
- `custom_message`: 확장 프로그램에서 주입된 메시지로 _모델 컨텍스트에 진입합니다_ (UI에서 숨길 수 있음)
- `custom`: 모델 컨텍스트에 진입하지 _않는_ 확장 프로그램 상태
- `compaction`: `firstKeptEntryId` 및 `tokensBefore`가 있는 지속된 압축 요약
- `branch_summary`: 트리 분기를 탐색할 때 지속된 요약

OpenClaw는 의도적으로 트랜스크립트를 "수정"하지 않습니다. 게이트웨이는 `SessionManager`를 사용하여 읽고 씁니다.

---

## 컨텍스트 윈도우 vs 추적된 토큰

두 가지 다른 개념이 중요합니다:

1. **모델 컨텍스트 윈도우**: 모델당 하드 캡 (모델이 보는 토큰)
2. **세션 저장소 카운터**: `/status`와 대시보드에 기록되는 롤링 통계

제한을 튜닝하는 경우:

- 컨텍스트 윈도우는 모델 카탈로그에서 나옵니다 (설정을 통해 재정의 가능).
- 저장소의 `contextTokens`는 런타임 추정/보고 값입니다. 엄격한 보장으로 취급하지 마세요.

자세한 내용은 [/token-use](/token-use)를 참조하세요.

---

## 압축: 그것이 무엇인지

압축은 오래된 대화를 트랜스크립트의 지속된 `compaction` 항목으로 요약하고 최근 메시지를 유지합니다.

압축 후, 향후 턴은 다음을 봅니다:

- 압축 요약
- `firstKeptEntryId` 이후의 메시지

압축은 **지속적입니다** (세션 프루닝과 달리). [/concepts/session-pruning](/concepts/session-pruning)을 참조하세요.

---

## 자동 압축이 발생할 때 (Pi 런타임)

내장된 Pi 에이전트에서 자동 압축은 두 가지 경우에 트리거됩니다:

1. **오버플로우 복구**: 모델이 컨텍스트 오버플로우 오류를 반환합니다 → 압축 → 재시도.
2. **임계값 유지**: 성공적인 턴 후, 다음 경우:

`contextTokens > contextWindow - reserveTokens`

여기서:

- `contextWindow`는 모델의 컨텍스트 윈도우
- `reserveTokens`는 프롬프트 + 다음 모델 출력을 위해 예약된 헤드룸

이들은 Pi 런타임 의미론입니다 (OpenClaw는 이벤트를 사용하지만 Pi가 압축 시기를 결정합니다).

---

## 압축 설정 (`reserveTokens`, `keepRecentTokens`)

Pi의 압축 설정은 Pi 설정에 있습니다:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw는 또한 내장된 실행을 위해 안전 기준을 적용합니다:

- `compaction.reserveTokens < reserveTokensFloor`이면 OpenClaw는 이를 상향 조정합니다.
- 기본 기준은 `20000` 토큰입니다.
- `agents.defaults.compaction.reserveTokensFloor: 0`을 설정하여 기준을 비활성화합니다.
- 이미 더 높으면 OpenClaw는 그대로 둡니다.

이유: 압축이 불가피해지기 전에 다중 턴 "정리 작업" (예: 메모리 쓰기)을 위한 충분한 헤드룸을 남기기 위해.

구현: `src/agents/pi-settings.ts`의 `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts`에서 호출됨).

---

## 사용자 표시 표면

다음을 통해 압축 및 세션 상태를 관찰할 수 있습니다:

- `/status` (모든 채팅 세션에서)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- 상세 모드: `🧹 Auto-compaction complete` + 압축 개수

---

## 무음 정리 작업 (`NO_REPLY`)

OpenClaw는 사용자가 중간 출력을 보면 안 되는 백그라운드 작업을 위한 "무음" 턴을 지원합니다.

관례:

- 어시스턴트는 출력을 `NO_REPLY`로 시작하여 "사용자에게 회신을 제공하지 않음"을 나타냅니다.
- OpenClaw는 전달 계층에서 이를 제거/억제합니다.

`2026.1.10` 기준으로 OpenClaw는 또한 **초안/입력 스트리밍**을 억제합니다. 부분 청크가 `NO_REPLY`로 시작하면 무음 작업이 턴 중간에 부분 출력을 유출하지 않습니다.

---

## 압축 전 "메모리 플러시" (구현됨)

목표: 자동 압축이 발생하기 전에, 무음 에이전트 턴을 실행하여 지속적인
상태를 디스크에 씁니다 (예: 에이전트 작업 공간에 `memory/YYYY-MM-DD.md`). 압축이 중요한 컨텍스트를 지울 수 없도록 합니다.

OpenClaw는 **압축 전 임계값 플러시** 접근 방식을 사용합니다:

1. 세션 컨텍스트 사용을 모니터링합니다.
2. Pi의 압축 임계값 아래인 "소프트 임계값"을 초과하면, 무음 "지금 메모리를 쓰기" 지시문을 에이전트로 실행합니다.
3. 사용자가 아무것도 보지 않도록 `NO_REPLY`를 사용합니다.

설정 (`agents.defaults.compaction.memoryFlush`):

- `enabled` (기본값: `true`)
- `softThresholdTokens` (기본값: `4000`)
- `prompt` (플러시 턴에 대한 사용자 메시지)
- `systemPrompt` (플러시 턴에 대해 추가된 추가 시스템 프롬프트)

참고:

- 기본 프롬프트/시스템 프롬프트는 전달을 억제하는 `NO_REPLY` 힌트를 포함합니다.
- 플러시는 압축 주기당 한 번 실행됩니다 (세션.json에서 추적됨).
- 플러시는 내장된 Pi 세션에서만 실행됩니다 (CLI 백엔드는 건너뜁니다).
- 세션 작업 공간이 읽기 전용일 때 플러시는 건너뜁니다 (`workspaceAccess: "ro"` 또는 `"none"`).
- 작업 공간 파일 레이아웃 및 쓰기 패턴은 [Memory](/concepts/memory)를 참조하세요.

Pi는 또한 확장 API에서 `session_before_compact` 훅을 노출하지만 OpenClaw의
플러시 로직은 현재 게이트웨이 측에 있습니다.

---

## 문제 해결 체크리스트

- 세션 키가 잘못되었나요? [/concepts/session](/concepts/session)부터 시작하고 `/status`에서 `sessionKey`를 확인하세요.
- 저장소 vs 트랜스크립트 불일치? 게이트웨이 호스트와 `openclaw status`의 저장소 경로를 확인하세요.
- 압축 스팸? 다음을 확인하세요:
  - 모델 컨텍스트 윈도우 (너무 작음)
  - 압축 설정 (`reserveTokens`가 모델 윈도우에 비해 너무 높으면 더 조기에 압축을 유발할 수 있음)
  - 도구 결과 팽창: 세션 프루닝을 활성화/튜닝
- 무음 턴이 누출되나요? 회신이 `NO_REPLY` (정확한 토큰)로 시작하는지, 스트리밍 억제 수정을 포함하는 빌드를 사용 중인지 확인하세요.

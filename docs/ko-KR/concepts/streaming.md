---
summary: "스트리밍 + 청킹 동작 (블록 응답, 드래프트 스트리밍, 제한)"
read_when:
  - 채널에서 스트리밍 또는 청킹의 작동 방식 설명 시
  - 블록 스트리밍 또는 채널 청킹 동작 변경 시
  - 중복/조기 블록 응답 또는 드래프트 스트리밍 디버깅 시
title: "스트리밍과 청킹"
---

# 스트리밍 + 청킹

OpenClaw에는 두 가지 별도의 "스트리밍" 레이어가 있습니다:

- **블록 스트리밍 (채널):** 어시스턴트가 작성하는 동안 완료된 **블록**을 발행합니다. 이는 일반 채널 메시지입니다(토큰 델타가 아님).
- **토큰식 스트리밍 (Telegram만):** 생성 중 부분 텍스트로 **드래프트 버블**을 업데이트합니다. 최종 메시지는 끝에 전송됩니다.

오늘날 외부 채널 메시지에 대한 **실제 토큰 스트리밍**은 없습니다. Telegram 드래프트 스트리밍이 유일한 부분 스트림 표면입니다.

## 블록 스트리밍 (채널 메시지)

블록 스트리밍은 어시스턴트 출력을 사용 가능해지는 대로 대략적인 청크로 전송합니다.

```
모델 출력
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker가 버퍼가 커지면서 블록 발행
       └─ (blockStreamingBreak=message_end)
            └─ chunker가 message_end에서 플러시
                   └─ 채널 전송 (블록 응답)
```

범례:

- `text_delta/events`: 모델 스트림 이벤트 (비스트리밍 모델의 경우 희소할 수 있음).
- `chunker`: 최소/최대 경계 + 중단 선호도를 적용하는 `EmbeddedBlockChunker`.
- `channel send`: 실제 아웃바운드 메시지 (블록 응답).

**제어:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (기본값 off).
- 채널 오버라이드: `*.blockStreaming` (및 계정별 변형)으로 채널별로 `"on"`/`"off"` 강제.
- `agents.defaults.blockStreamingBreak`: `"text_end"` 또는 `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (전송 전 스트리밍된 블록 병합).
- 채널 하드 상한: `*.textChunkLimit` (예: `channels.whatsapp.textChunkLimit`).
- 채널 청크 모드: `*.chunkMode` (기본값 `length`, `newline`은 길이 청킹 전에 빈 줄(단락 경계)에서 분할).
- Discord 소프트 상한: `channels.discord.maxLinesPerMessage` (기본값 17)은 UI 클리핑을 방지하기 위해 높은 응답을 분할.

**경계 의미:**

- `text_end`: chunker가 발행하는 즉시 블록 스트리밍; 각 `text_end`에서 플러시.
- `message_end`: 어시스턴트 메시지가 완료될 때까지 기다린 다음 버퍼링된 출력 플러시.

`message_end`는 버퍼링된 텍스트가 `maxChars`를 초과하면 chunker를 사용하므로 끝에 여러 청크를 발행할 수 있습니다.

## 청킹 알고리즘 (하한/상한)

블록 청킹은 `EmbeddedBlockChunker`에 의해 구현됩니다:

- **하한:** 강제되지 않는 한 버퍼 >= `minChars`가 될 때까지 발행하지 않음.
- **상한:** `maxChars` 이전 분할을 선호; 강제되면 `maxChars`에서 분할.
- **중단 선호도:** `paragraph` → `newline` → `sentence` → `whitespace` → hard break.
- **코드 펜스:** 펜스 내부에서 절대 분할하지 않음; `maxChars`에서 강제되면 Markdown을 유효하게 유지하기 위해 펜스를 닫고 다시 열음.

`maxChars`는 채널 `textChunkLimit`로 클램프되므로 채널별 상한을 초과할 수 없습니다.

## 병합 (스트리밍된 블록 병합)

블록 스트리밍이 활성화되면 OpenClaw는 전송 전에 **연속 블록 청크를 병합**할 수 있습니다. 이는 점진적 출력을 제공하면서 "한 줄 스팸"을 줄입니다.

- 병합은 플러시 전에 **유휴 간격** (`idleMs`)을 기다립니다.
- 버퍼는 `maxChars`로 제한되며 초과 시 플러시됩니다.
- `minChars`는 충분한 텍스트가 축적될 때까지 작은 조각이 전송되는 것을 방지합니다 (최종 플러시는 항상 남은 텍스트를 전송).
- Joiner는 `blockStreamingChunk.breakPreference`에서 파생됩니다 (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → 공백).
- 채널 오버라이드는 `*.blockStreamingCoalesce`를 통해 사용 가능합니다(계정별 설정 포함).
- 재정의되지 않는 한 Signal/Slack/Discord의 기본 병합 `minChars`는 1500으로 증가됩니다.

## 블록 간 사람 같은 페이싱

블록 스트리밍이 활성화되면 블록 응답 사이(첫 번째 블록 이후)에 **무작위 일시 중지**를 추가할 수 있습니다. 이는 다중 버블 응답을 더 자연스럽게 만듭니다.

- 설정: `agents.defaults.humanDelay` (에이전트별 오버라이드는 `agents.list[].humanDelay`를 통해).
- 모드: `off` (기본값), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- **블록 응답**에만 적용되며, 최종 응답이나 도구 요약에는 적용되지 않습니다.

## "청크 스트리밍 또는 모두"

이는 다음과 같이 매핑됩니다:

- **청크 스트리밍:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (진행하면서 발행). Telegram이 아닌 채널은 `*.blockStreaming: true`도 필요합니다.
- **끝에 모두 스트리밍:** `blockStreamingBreak: "message_end"` (한 번 플러시, 매우 긴 경우 여러 청크 가능).
- **블록 스트리밍 없음:** `blockStreamingDefault: "off"` (최종 응답만).

**채널 참고사항:** Telegram이 아닌 채널의 경우, `*.blockStreaming`이 명시적으로 `true`로 설정되지 **않는 한** 블록 스트리밍이 꺼집니다. Telegram은 블록 응답 없이도 드래프트를 스트리밍할 수 있습니다 (`channels.telegram.streamMode`).

설정 위치 알림: `blockStreaming*` 기본값은 루트 설정이 아닌 `agents.defaults` 아래에 있습니다.

## Telegram 드래프트 스트리밍 (토큰식)

Telegram은 드래프트 스트리밍을 제공하는 유일한 채널입니다:

- **토픽이 있는 개인 채팅**에서 Bot API `sendMessageDraft`를 사용합니다.
- `channels.telegram.streamMode: "partial" | "block" | "off"`.
  - `partial`: 최신 스트림 텍스트로 드래프트 업데이트.
  - `block`: 청크된 블록으로 드래프트 업데이트 (동일한 chunker 규칙).
  - `off`: 드래프트 스트리밍 없음.
- 드래프트 청크 설정 (`streamMode: "block"`에만 해당): `channels.telegram.draftChunk` (기본값: `minChars: 200`, `maxChars: 800`).
- 드래프트 스트리밍은 블록 스트리밍과 별개입니다. 블록 응답은 기본적으로 꺼져 있으며 Telegram이 아닌 채널에서 `*.blockStreaming: true`로만 활성화됩니다.
- 최종 응답은 여전히 일반 메시지입니다.
- `/reasoning stream`은 reasoning을 드래프트 버블에 작성합니다 (Telegram만).

드래프트 스트리밍이 활성화되면 OpenClaw는 이중 스트리밍을 방지하기 위해 해당 응답에 대한 블록 스트리밍을 비활성화합니다.

```
Telegram (개인 + 토픽)
  └─ sendMessageDraft (드래프트 버블)
       ├─ streamMode=partial → 최신 텍스트 업데이트
       └─ streamMode=block   → chunker가 드래프트 업데이트
  └─ 최종 응답 → 일반 메시지
```

범례:

- `sendMessageDraft`: Telegram 드래프트 버블 (실제 메시지 아님).
- `final reply`: 일반 Telegram 메시지 전송.

---
summary: "메시지 흐름, 세션, 큐잉 및 추론 가시성"
read_when:
  - 인바운드 메시지가 응답으로 변환되는 방식 설명
  - 세션, 큐잉 모드 또는 스트리밍 동작 명확화
  - 추론 가시성 및 사용 영향 문서화
title: "메시지"
---

# 메시지

이 페이지는 OpenClaw가 인바운드 메시지, 세션, 큐잉, 스트리밍 및 추론 가시성을 처리하는 방법을 종합적으로 설명합니다.

## 메시지 흐름 (상위 수준)

```
인바운드 메시지
  -> 라우팅/바인딩 -> 세션 키
  -> 큐 (실행 중인 런이 있는 경우)
  -> 에이전트 런 (스트리밍 + 도구)
  -> 아웃바운드 응답 (채널 제한 + 청킹)
```

주요 설정은 설정 파일에 있습니다:

- `messages.*`: 접두사, 큐잉 및 그룹 동작
- `agents.defaults.*`: 블록 스트리밍 및 청킹 기본값
- 채널 오버라이드 (`channels.whatsapp.*`, `channels.telegram.*` 등): 제한 및 스트리밍 토글

전체 스키마는 [설정](/gateway/configuration)을 참조하세요.

## 인바운드 중복 제거

채널은 재연결 후 동일한 메시지를 재전송할 수 있습니다. OpenClaw는 채널/계정/피어/세션/메시지 ID로 키가 지정된 단기 캐시를 유지하여 중복 전송이 다른 에이전트 런을 트리거하지 않도록 합니다.

## 인바운드 디바운싱

**동일한 발신자**로부터의 연속적인 빠른 메시지는 `messages.inbound`를 통해 단일 에이전트 턴으로 배치될 수 있습니다. 디바운싱은 채널 + 대화별로 범위가 지정되며 응답 스레딩/ID에 가장 최근 메시지를 사용합니다.

설정 (전역 기본값 + 채널별 오버라이드):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

참고사항:

- 디바운스는 **텍스트 전용** 메시지에 적용됩니다. 미디어/첨부 파일은 즉시 플러시됩니다.
- 제어 명령은 디바운싱을 우회하므로 독립적으로 유지됩니다.

## 세션 및 장치

세션은 클라이언트가 아닌 게이트웨이가 소유합니다.

- 다이렉트 채팅은 에이전트 메인 세션 키로 축소됩니다.
- 그룹/채널은 자체 세션 키를 가집니다.
- 세션 저장소 및 트랜스크립트는 게이트웨이 호스트에 있습니다.

여러 장치/채널이 동일한 세션에 매핑될 수 있지만, 히스토리는 모든 클라이언트에 완전히 동기화되지 않습니다. 권장사항: 긴 대화를 위해 하나의 기본 장치를 사용하여 컨텍스트가 분산되는 것을 방지하세요. Control UI 및 TUI는 항상 게이트웨이 기반 세션 트랜스크립트를 표시하므로 신뢰할 수 있는 소스입니다.

자세한 내용: [세션 관리](/concepts/session)

## 인바운드 본문 및 히스토리 컨텍스트

OpenClaw는 **프롬프트 본문**과 **명령 본문**을 분리합니다:

- `Body`: 에이전트에 전송되는 프롬프트 텍스트입니다. 채널 엔벨로프 및 선택적 히스토리 래퍼를 포함할 수 있습니다.
- `CommandBody`: 지시어/명령 파싱을 위한 원시 사용자 텍스트입니다.
- `RawBody`: `CommandBody`의 레거시 별칭입니다 (호환성을 위해 유지됨).

채널이 히스토리를 제공하는 경우, 공유 래퍼를 사용합니다:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**비다이렉트 채팅** (그룹/채널/룸)의 경우, **현재 메시지 본문**에 발신자 레이블이 접두사로 붙습니다 (히스토리 항목에 사용되는 것과 동일한 스타일). 이렇게 하면 실시간 및 큐에 대기된/히스토리 메시지가 에이전트 프롬프트에서 일관성을 유지합니다.

히스토리 버퍼는 **보류 전용**입니다: 런을 트리거하지 _않은_ 그룹 메시지 (예: 멘션 게이팅된 메시지)를 포함하고 세션 트랜스크립트에 이미 있는 메시지는 **제외**합니다.

지시어 제거는 **현재 메시지** 섹션에만 적용되므로 히스토리는 그대로 유지됩니다. 히스토리를 래핑하는 채널은 `CommandBody` (또는 `RawBody`)를 원본 메시지 텍스트로 설정하고 `Body`를 결합된 프롬프트로 유지해야 합니다. 히스토리 버퍼는 `messages.groupChat.historyLimit` (전역 기본값) 및 `channels.slack.historyLimit` 또는 `channels.telegram.accounts.<id>.historyLimit`와 같은 채널별 오버라이드를 통해 설정할 수 있습니다 (비활성화하려면 `0`으로 설정).

## 큐잉 및 후속 조치

런이 이미 활성 상태인 경우, 인바운드 메시지를 큐에 대기시키거나, 현재 런으로 조향하거나, 후속 턴을 위해 수집할 수 있습니다.

- `messages.queue` (및 `messages.queue.byChannel`)를 통해 설정합니다.
- 모드: `interrupt`, `steer`, `followup`, `collect`, 백로그 변형 포함

자세한 내용: [큐잉](/concepts/queue)

## 스트리밍, 청킹 및 배칭

블록 스트리밍은 모델이 텍스트 블록을 생성할 때 부분 응답을 전송합니다. 청킹은 채널 텍스트 제한을 준수하고 펜스 코드 분할을 방지합니다.

주요 설정:

- `agents.defaults.blockStreamingDefault` (`on|off`, 기본값 off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (유휴 기반 배칭)
- `agents.defaults.humanDelay` (블록 응답 간 사람과 유사한 일시 중지)
- 채널 오버라이드: `*.blockStreaming` 및 `*.blockStreamingCoalesce` (비Telegram 채널은 명시적 `*.blockStreaming: true` 필요)

자세한 내용: [스트리밍 + 청킹](/concepts/streaming)

## 추론 가시성 및 토큰

OpenClaw는 모델 추론을 노출하거나 숨길 수 있습니다:

- `/reasoning on|off|stream`은 가시성을 제어합니다.
- 추론 콘텐츠는 모델에서 생성될 때 여전히 토큰 사용량에 포함됩니다.
- Telegram은 드래프트 버블로의 추론 스트림을 지원합니다.

자세한 내용: [사고 + 추론 지시어](/tools/thinking) 및 [토큰 사용](/token-use)

## 접두사, 스레딩 및 응답

아웃바운드 메시지 형식은 `messages`에 중앙 집중화되어 있습니다:

- `messages.responsePrefix` (아웃바운드 접두사) 및 `channels.whatsapp.messagePrefix` (WhatsApp 인바운드 접두사)
- `replyToMode` 및 채널별 기본값을 통한 응답 스레딩

자세한 내용: [설정](/gateway/configuration#messages) 및 채널 문서

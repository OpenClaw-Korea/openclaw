---
summary: "엔벨로프, 프롬프트, 도구, 커넥터에서의 날짜 및 시간 처리"
read_when:
  - 타임스탬프가 모델이나 사용자에게 표시되는 방식을 변경하고 있을 때
  - 메시지나 시스템 프롬프트 출력의 시간 형식 지정 디버깅 중일 때
title: "날짜 및 시간"
---

# 날짜 및 시간

OpenClaw는 기본적으로 **전송 타임스탬프에는 호스트-로컬 시간을, 시스템 프롬프트에는 사용자 시간대만** 사용합니다.
프로바이더 타임스탬프는 유지되므로 도구는 고유한 의미론을 유지합니다(현재 시간은 `session_status`를 통해 사용 가능합니다).

## 메시지 엔벨로프 (기본값: 로컬)

인바운드 메시지는 타임스탐프(분 단위 정확도)와 함께 래핑됩니다:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

이 엔벨로프 타임스탐프는 프로바이더 시간대와 관계없이 **기본적으로 호스트-로컬**입니다.

다음과 같이 이 동작을 재정의할 수 있습니다:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` UTC를 사용합니다.
- `envelopeTimezone: "local"` 호스트 시간대를 사용합니다.
- `envelopeTimezone: "user"` `agents.defaults.userTimezone`을 사용합니다 (호스트 시간대로 폴백).
- 명시적 IANA 시간대(예: `"America/Chicago"`)를 사용하여 고정 영역을 설정합니다.
- `envelopeTimestamp: "off"` 엔벨로프 헤더에서 절대 타임스탐프를 제거합니다.
- `envelopeElapsed: "off"` 경과 시간 접미사(`+2m` 스타일)를 제거합니다.

### 예시

**로컬 (기본값):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**사용자 시간대:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**경과 시간 활성화:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## 시스템 프롬프트: 현재 날짜 및 시간

사용자 시간대가 알려진 경우, 시스템 프롬프트에는 프롬프트 캐싱을 안정적으로 유지하기 위해 **시간대만 포함된** 전용 **현재 날짜 및 시간** 섹션이 포함됩니다:

```
Time zone: America/Chicago
```

에이전트가 현재 시간이 필요할 때는 `session_status` 도구를 사용합니다. 상태 카드에는 타임스탐프 라인이 포함됩니다.

## 시스템 이벤트 라인 (기본값: 로컬)

에이전트 컨텍스트에 삽입된 대기 중인 시스템 이벤트에는 메시지 엔벨로프와 동일한 시간대 선택을 사용하는 타임스탐프가 접두사로 붙습니다 (기본값: 호스트-로컬).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### 사용자 시간대 및 형식 설정

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` 프롬프트 컨텍스트에 대한 **사용자-로컬 시간대**를 설정합니다.
- `timeFormat` 프롬프트의 **12시간/24시간 표시**를 제어합니다. `auto`는 OS 설정을 따릅니다.

## 시간 형식 감지 (자동)

`timeFormat: "auto"`인 경우, OpenClaw는 OS 설정(macOS/Windows)을 검사하고 로케일 형식 지정으로 폴백합니다. 감지된 값은 **프로세스당 캐시**되므로 반복된 시스템 호출을 피합니다.

## 도구 페이로드 + 커넥터 (원본 프로바이더 시간 + 정규화된 필드)

채널 도구는 **프로바이더 고유의 타임스탐프**를 반환하고 일관성을 위해 정규화된 필드를 추가합니다:

- `timestampMs`: epoch 밀리초 (UTC)
- `timestampUtc`: ISO 8601 UTC 문자열

원본 프로바이더 필드는 유지되므로 정보가 손실되지 않습니다.

- Slack: API의 epoch 유사 문자열
- Discord: UTC ISO 타임스탐프
- Telegram/WhatsApp: 프로바이더별 숫자/ISO 타임스탐프

로컬 시간이 필요한 경우, 알려진 시간대를 사용하여 다운스트림에서 변환합니다.

## 관련 문서

- [System Prompt](/concepts/system-prompt)
- [Timezones](/concepts/timezone)
- [Messages](/concepts/messages)

---
summary: "OpenClaw가 타이핑 표시기를 표시하는 시점과 조정 방법"
read_when:
  - 타이핑 표시기 동작 또는 기본값 변경 시
title: "타이핑 표시기"
---

# 타이핑 표시기

타이핑 표시기는 실행이 활성화되어 있는 동안 채팅 채널로 전송됩니다. `agents.defaults.typingMode`를 사용하여 타이핑이 **언제** 시작되는지 제어하고 `typingIntervalSeconds`를 사용하여 **얼마나 자주** 새로 고쳐지는지 제어합니다.

## 기본값

`agents.defaults.typingMode`가 **미설정**인 경우 OpenClaw는 레거시 동작을 유지합니다:

- **직접 채팅**: 모델 루프가 시작되면 즉시 타이핑 시작.
- **멘션이 있는 그룹 채팅**: 즉시 타이핑 시작.
- **멘션이 없는 그룹 채팅**: 메시지 텍스트가 스트리밍되기 시작할 때만 타이핑 시작.
- **하트비트 실행**: 타이핑 비활성화.

## 모드

`agents.defaults.typingMode`를 다음 중 하나로 설정:

- `never` — 타이핑 표시기 없음, 절대.
- `instant` — 실행이 나중에 무음 응답 토큰만 반환하더라도 **모델 루프가 시작되는 즉시** 타이핑 시작.
- `thinking` — **첫 번째 reasoning 델타**에서 타이핑 시작 (실행에 `reasoningLevel: "stream"` 필요).
- `message` — **첫 번째 무음이 아닌 텍스트 델타**에서 타이핑 시작 (`NO_REPLY` 무음 토큰 무시).

"얼마나 빨리 발생하는지"의 순서:
`never` → `message` → `thinking` → `instant`

## 설정

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

세션별로 모드 또는 주기를 재정의할 수 있습니다:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 참고사항

- `message` 모드는 무음 전용 응답(예: 출력 억제에 사용되는 `NO_REPLY` 토큰)에 대해 타이핑을 표시하지 않습니다.
- `thinking`은 실행이 reasoning을 스트리밍하는 경우에만 발생합니다 (`reasoningLevel: "stream"`). 모델이 reasoning 델타를 발행하지 않으면 타이핑이 시작되지 않습니다.
- 하트비트는 모드에 관계없이 절대 타이핑을 표시하지 않습니다.
- `typingIntervalSeconds`는 시작 시간이 아닌 **새로 고침 주기**를 제어합니다. 기본값은 6초입니다.

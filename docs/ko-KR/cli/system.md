---
summary: "`openclaw system` CLI 참조 (시스템 이벤트, 하트비트, 현재 상태)"
read_when:
  - 크론 작업을 만들지 않고 시스템 이벤트를 대기열에 추가하고 싶을 때
  - 하트비트를 활성화하거나 비활성화해야 할 때
  - 시스템 현재 상태 항목을 검사하고 싶을 때
title: "system"
---

# `openclaw system`

게이트웨이를 위한 시스템 수준 도우미: 시스템 이벤트를 대기열에 추가하고, 하트비트를 제어하며, 현재 상태를 확인합니다.

## 일반 명령어

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

**main** 세션에 시스템 이벤트를 대기열에 추가합니다. 다음 하트비트는 이를 프롬프트에 `System:` 라인으로 주입합니다. `--mode now`를 사용하여 하트비트를 즉시 트리거하거나, `next-heartbeat`는 다음 예약된 틱을 기다립니다.

옵션:

- `--text <text>`: 필수 시스템 이벤트 텍스트입니다.
- `--mode <mode>`: `now` 또는 `next-heartbeat` (기본값)입니다.
- `--json`: 머신 가독형 출력입니다.

## `system heartbeat last|enable|disable`

하트비트 제어:

- `last`: 마지막 하트비트 이벤트를 표시합니다.
- `enable`: 하트비트를 다시 켭니다 (비활성화되었던 경우 사용하세요).
- `disable`: 하트비트를 일시 중지합니다.

옵션:

- `--json`: 머신 가독형 출력입니다.

## `system presence`

게이트웨이가 알고 있는 현재 시스템 현재 상태 항목 (노드, 인스턴스, 유사한 상태 라인)을 나열합니다.

옵션:

- `--json`: 머신 가독형 출력입니다.

## 참고 사항

- 현재 설정 (로컬 또는 원격)에서 도달 가능한 실행 중인 게이트웨이가 필요합니다.
- 시스템 이벤트는 임시이며 재시작 시 유지되지 않습니다.

---
summary: "승격된 실행 모드 및 /elevated 지시문"
read_when:
  - 승격 모드 기본값, 허용 목록 또는 슬래시 명령 동작 조정
title: "승격 모드"
---

# 승격 모드(/elevated 지시문)

## 기능

- `/elevated on`은 게이트웨이 호스트에서 실행되며 실행 승인을 유지합니다(`/elevated ask`와 동일).
- `/elevated full`은 게이트웨이 호스트에서 실행되며 실행을 자동으로 승인합니다(실행 승인 건너뜀).
- `/elevated ask`는 게이트웨이 호스트에서 실행되지만 실행 승인을 유지합니다(`/elevated on`과 동일).
- `on`/`ask`는 `exec.security=full`을 강제하지 **않습니다**. 구성된 보안/ask 정책이 여전히 적용됩니다.
- 에이전트가 **샌드박스 격리**된 경우에만 동작을 변경합니다(그렇지 않으면 실행이 이미 호스트에서 실행됨).
- 지시문 형식: `/elevated on|off|ask|full`, `/elev on|off|ask|full`.
- `on|off|ask|full`만 허용됩니다. 다른 값은 힌트를 반환하고 상태를 변경하지 않습니다.

## 제어 대상(및 제어하지 않는 대상)

- **가용성 게이트**: `tools.elevated`는 전역 기준선입니다. `agents.list[].tools.elevated`는 에이전트별로 승격을 추가로 제한할 수 있습니다(둘 다 허용해야 함).
- **세션별 상태**: `/elevated on|off|ask|full`은 현재 세션 키의 승격 수준을 설정합니다.
- **인라인 지시문**: 메시지 내부의 `/elevated on|ask|full`은 해당 메시지에만 적용됩니다.
- **그룹**: 그룹 채팅에서 승격 지시문은 에이전트가 언급될 때만 적용됩니다. 언급 요구 사항을 우회하는 명령 전용 메시지는 언급된 것으로 처리됩니다.
- **호스트 실행**: 승격은 `exec`를 게이트웨이 호스트로 강제합니다. `full`은 `security=full`도 설정합니다.
- **승인**: `full`은 실행 승인을 건너뜁니다. `on`/`ask`는 허용 목록/ask 규칙이 요구할 때 승인을 존중합니다.
- **샌드박스 격리되지 않은 에이전트**: 위치에 대해 no-op입니다. 게이팅, 로깅 및 상태에만 영향을 줍니다.
- **도구 정책은 여전히 적용됩니다**: 도구 정책에 의해 `exec`가 거부되면 승격을 사용할 수 없습니다.
- **`/exec`와 별개**: `/exec`는 승인된 발신자를 위한 세션별 기본값을 조정하며 승격을 요구하지 않습니다.

## 해석 순서

1. 메시지의 인라인 지시문(해당 메시지에만 적용).
2. 세션 재정의(지시문 전용 메시지를 보내 설정).
3. 전역 기본값(설정의 `agents.defaults.elevatedDefault`).

## 세션 기본값 설정

- **지시문만** 포함된 메시지를 보냅니다(공백 허용), 예: `/elevated full`.
- 확인 응답이 전송됩니다(`Elevated mode set to full...` / `Elevated mode disabled.`).
- 승격 액세스가 비활성화되었거나 발신자가 승인된 허용 목록에 없는 경우, 지시문은 실행 가능한 오류와 함께 응답하고 세션 상태를 변경하지 않습니다.
- 현재 승격 수준을 보려면 `/elevated`(또는 `/elevated:`)를 인수 없이 보내세요.

## 가용성 + 허용 목록

- 기능 게이트: `tools.elevated.enabled`(코드가 지원하더라도 설정을 통해 기본값을 off로 설정할 수 있음).
- 발신자 허용 목록: 프로바이더별 허용 목록이 있는 `tools.elevated.allowFrom`(예: `discord`, `whatsapp`).
- 에이전트별 게이트: `agents.list[].tools.elevated.enabled`(선택사항; 추가로만 제한 가능).
- 에이전트별 허용 목록: `agents.list[].tools.elevated.allowFrom`(선택사항; 설정된 경우 발신자는 **전역 + 에이전트별** 허용 목록 모두와 일치해야 함).
- Discord fallback: `tools.elevated.allowFrom.discord`가 생략되면 `channels.discord.dm.allowFrom` 목록이 fallback으로 사용됩니다. 재정의하려면 `tools.elevated.allowFrom.discord`를 설정하세요(빈 `[]`도 가능). 에이전트별 허용 목록은 fallback을 사용하지 **않습니다**.
- 모든 게이트가 통과해야 합니다. 그렇지 않으면 승격을 사용할 수 없는 것으로 처리됩니다.

## 로깅 + 상태

- 승격된 실행 호출은 info 수준에서 로깅됩니다.
- 세션 상태에는 승격 모드가 포함됩니다(예: `elevated=ask`, `elevated=full`).

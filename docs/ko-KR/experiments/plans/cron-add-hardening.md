---
summary: "cron.add 입력 처리 강화, 스키마 정렬, cron UI/에이전트 도구 개선"
owner: "openclaw"
status: "complete"
last_updated: "2026-01-05"
title: "Cron Add 강화"
---

# Cron Add 강화 및 스키마 정렬

## 배경

최근 게이트웨이 로그에는 잘못된 매개변수를 포함한 반복적인 `cron.add` 실패가 표시되고 있습니다(누락된 `sessionTarget`, `wakeMode`, `payload`, 잘못된 형식의 `schedule`). 이는 최소한 하나의 클라이언트(아마도 에이전트 도구 호출 경로)가 래핑되거나 부분적으로 지정된 작업 페이로드를 전송하고 있음을 나타냅니다. 별도로 TypeScript의 cron 프로바이더 열거형, 게이트웨이 스키마, CLI 플래그, UI 양식 유형 간에 드리프트가 있으며, `cron.status`에 대한 UI 불일치가 있습니다(`jobCount`를 예상하지만 게이트웨이는 `jobs`를 반환).

## 목표

- 일반적인 래퍼 페이로드를 정규화하고 누락된 `kind` 필드를 추론하여 `cron.add` INVALID_REQUEST 스팸을 중단합니다.
- 게이트웨이 스키마, cron 유형, CLI 문서, UI 양식 간에 cron 프로바이더 목록을 정렬합니다.
- 에이전트 cron 도구 스키마를 명시적으로 하여 LLM이 올바른 작업 페이로드를 생성하도록 합니다.
- Control UI cron 상태 작업 수 표시를 수정합니다.
- 정규화 및 도구 동작을 다루는 테스트를 추가합니다.

## 비목표

- cron 스케줄링 의미 또는 작업 실행 동작 변경.
- 새로운 스케줄 종류 또는 cron 식 파싱 추가.
- 필요한 필드 수정 이외의 UI/UX cron 개선.

## 발견 사항 (현재 격차)

- 게이트웨이의 `CronPayloadSchema`는 `signal` + `imessage`를 제외하고 있으며, TS 유형은 이를 포함합니다.
- Control UI CronStatus는 `jobCount`를 예상하지만, 게이트웨이는 `jobs`를 반환합니다.
- 에이전트 cron 도구 스키마는 임의의 `job` 객체를 허용하여 잘못된 입력을 가능하게 합니다.
- 게이트웨이는 `cron.add`를 엄격하게 검증하며 정규화가 없으므로 래핑된 페이로드는 실패합니다.

## 변경된 내용

- `cron.add`와 `cron.update`는 이제 일반적인 래퍼 모양을 정규화하고 누락된 `kind` 필드를 추론합니다.
- 에이전트 cron 도구 스키마는 게이트웨이 스키마와 일치하여 잘못된 페이로드를 줄입니다.
- 프로바이더 열거형은 게이트웨이, CLI, UI, macOS 선택기 간에 정렬됩니다.
- Control UI는 상태에 대해 게이트웨이의 `jobs` 개수 필드를 사용합니다.

## 현재 동작

- **정규화:** 래핑된 `data`/`job` 페이로드는 언래핑됩니다. `schedule.kind`와 `payload.kind`는 안전할 때 추론됩니다.
- **기본값:** 누락된 경우 `wakeMode`와 `sessionTarget`에 대해 안전한 기본값이 적용됩니다.
- **프로바이더:** Discord/Slack/Signal/iMessage는 이제 CLI/UI 전체에서 일관되게 표시됩니다.

정규화된 모양과 예제는 [Cron jobs](/automation/cron-jobs)를 참조하세요.

## 검증

- 게이트웨이 로그에서 감소된 `cron.add` INVALID_REQUEST 오류를 주시합니다.
- Control UI cron 상태가 새로고침 후 작업 수를 표시하는지 확인합니다.

## 선택 사항 후속

- 수동 Control UI 스모크 테스트: 프로바이더당 하나의 cron 작업을 추가하고 상태 작업 수를 확인합니다.

## 미해결 질문

- `cron.add`가 클라이언트로부터 명시적인 `state`를 수락해야 합니까(현재 스키마에서는 허용되지 않음)?
- `webchat`을 명시적 전달 프로바이더로 허용해야 합니까(현재 전달 해석에서 필터링됨)?

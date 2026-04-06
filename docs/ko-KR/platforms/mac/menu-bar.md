---
summary: "메뉴 바 상태 로직 및 사용자에게 표시되는 정보"
read_when:
  - macOS 메뉴 UI 또는 상태 로직 조정 시
title: "메뉴 바"
---

# 메뉴 바 상태 로직

## 표시되는 내용

- 메뉴 바 아이콘과 메뉴의 첫 번째 상태 행에 현재 에이전트 작업 상태가 표시됩니다.
- 작업이 활성 상태일 때는 상태 정보가 숨겨지며, 모든 세션이 유휴 상태가 되면 다시 표시됩니다.
- 메뉴의 "Nodes" 블록은 **디바이스**(`node.list`를 통한 페어링된 노드)만 표시하며, 클라이언트/프레즌스 항목은 표시하지 않습니다.
- 프로바이더 사용량 스냅샷을 사용할 수 있는 경우 컨텍스트 하위에 "Usage" 섹션이 나타납니다.

## 상태 모델

- 세션: 이벤트는 `runId`(실행당) 및 페이로드의 `sessionKey`와 함께 도착합니다. "main" 세션은 `main` 키이며, 없는 경우 가장 최근에 업데이트된 세션으로 대체됩니다.
- 우선순위: main이 항상 우선합니다. main이 활성 상태이면 해당 상태가 즉시 표시됩니다. main이 유휴 상태이면 가장 최근에 활성화된 non-main 세션이 표시됩니다. 활동 중에는 전환하지 않으며, 현재 세션이 유휴 상태가 되거나 main이 활성화될 때만 전환합니다.
- 활동 종류:
  - `job`: 상위 수준 명령 실행 (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result`와 함께 `toolName` 및 `meta/args` 포함.

## IconState enum (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (디버그 재정의)

### ActivityKind → 글리프

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- default → 🛠️

### 시각적 매핑

- `idle`: 일반 크리터.
- `workingMain`: 글리프가 있는 배지, 전체 색조, 다리 "working" 애니메이션.
- `workingOther`: 글리프가 있는 배지, 음소거된 색조, scurry 없음.
- `overridden`: 활동과 관계없이 선택한 글리프/색조 사용.

## 상태 행 텍스트 (메뉴)

- 작업이 활성 상태일 때: `<Session role> · <activity label>`
  - 예시: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- 유휴 상태일 때: 상태 요약으로 대체됩니다.

## 이벤트 수집

- 소스: 컨트롤 채널 `agent` 이벤트 (`ControlChannel.handleAgentEvent`).
- 파싱된 필드:
  - `stream: "job"` 및 시작/중지를 위한 `data.state`.
  - `stream: "tool"` 및 `data.phase`, `name`, 선택적 `meta`/`args`.
- 레이블:
  - `exec`: `args.command`의 첫 번째 줄.
  - `read`/`write`: 단축된 경로.
  - `edit`: 경로 및 `meta`/diff 카운트에서 추론된 변경 종류.
  - 대체: 도구 이름.

## 디버그 재정의

- 설정 ▸ 디버그 ▸ "Icon override" 선택기:
  - `System (auto)` (기본값)
  - `Working: main` (도구 종류별)
  - `Working: other` (도구 종류별)
  - `Idle`
- `@AppStorage("iconOverride")`를 통해 저장되며 `IconState.overridden`으로 매핑됩니다.

## 테스트 체크리스트

- main 세션 작업 트리거: 아이콘이 즉시 전환되고 상태 행에 main 레이블이 표시되는지 확인.
- main이 유휴 상태일 때 non-main 세션 작업 트리거: 아이콘/상태가 non-main을 표시하며 완료될 때까지 안정적으로 유지.
- 다른 세션이 활성 상태일 때 main 시작: 아이콘이 즉시 main으로 전환.
- 빠른 도구 버스트: 배지가 깜박이지 않는지 확인 (도구 결과에 대한 TTL 유예).
- 모든 세션이 유휴 상태가 되면 상태 행이 다시 나타남.

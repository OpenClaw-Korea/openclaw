---
title: 형식 검증 (보안 모델)
summary: OpenClaw의 최고 위험 경로에 대한 기계 검증 보안 모델입니다.
permalink: /ko-KR/security/formal-verification/
---

# 형식 검증 (보안 모델)

이 페이지에서는 OpenClaw의 **형식 보안 모델**(현재 TLA+/TLC; 필요에 따라 추가)을 추적합니다.

> 참고: 일부 기존 링크는 이전 프로젝트명을 참조할 수 있습니다.

**목표(북극성):** OpenClaw가 명시적 가정 하에서 의도한 보안 정책(인증, 세션 격리, 도구 게이팅, 오설정 안전성)을 적용하는지에 대한 기계 검증 논거를 제공합니다.

**현재 내용:** 실행 가능하고 공격자 중심의 **보안 회귀 테스트 모음**입니다:

- 각 주장은 유한 상태 공간에 대한 실행 가능한 모델 확인을 가지고 있습니다.
- 많은 주장은 현실적인 버그 종류에 대한 반례 트레이스를 생성하는 쌍을 이루는 **네거티브 모델**을 가지고 있습니다.

**현재 내용이 아닌 것:** "OpenClaw가 모든 측면에서 안전하다"는 증명이거나 전체 TypeScript 구현의 정확성 증명입니다.

## 모델이 있는 위치

모델은 별도 저장소에서 관리됩니다: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## 중요한 주의사항

- 이것은 전체 TypeScript 구현이 아닌 **모델**입니다. 모델과 코드 간의 차이가 발생할 수 있습니다.
- 결과는 TLC가 탐색한 상태 공간으로 한정됩니다. "완료"는 모델링된 가정과 범위 이상의 보안을 의미하지 않습니다.
- 일부 주장은 명시적 환경 가정(예: 올바른 배포, 올바른 설정 입력)에 따라 달라집니다.

## 결과 재현

현재 결과는 모델 저장소를 로컬에 복제하고 TLC를 실행하여 재현합니다(아래 참조). 향후 반복은 다음을 제공할 수 있습니다:

- CI 실행 모델과 공개 아티팩트(반례 트레이스, 실행 로그)
- 작고 제한된 확인을 위한 호스팅된 "이 모델 실행" 워크플로우

시작하기:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ 필요 (TLC는 JVM에서 실행됨).
# 저장소는 고정된 `tla2tools.jar`(TLA+ 도구)를 포함하고 `bin/tlc` + Make 대상을 제공합니다.

make <target>
```

### 게이트웨이 노출 및 개방 게이트웨이 오설정

**주장:** 인증 없이 루프백 이상으로 바인딩하면 원격 손상이 가능하거나 노출이 증가할 수 있습니다. 토큰/비밀번호는 인증되지 않은 공격자를 차단합니다(모델 가정에 따름).

- 완료 실행:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- 빨강 (예상):
  - `make gateway-exposure-v2-negative`

참조: 모델 저장소의 `docs/gateway-exposure-matrix.md`.

### Nodes.run 파이프라인 (최고 위험 기능)

**주장:** `nodes.run`은 (a) 노드 명령 허용 목록 및 선언된 명령과 (b) 설정된 경우 라이브 승인을 요구합니다. 승인은 재생을 방지하기 위해 토큰화됩니다(모델에서).

- 완료 실행:
  - `make nodes-pipeline`
  - `make approvals-token`
- 빨강 (예상):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### 페어링 저장소 (DM 게이팅)

**주장:** 페어링 요청은 TTL 및 보류 중인 요청 제한을 준수합니다.

- 완료 실행:
  - `make pairing`
  - `make pairing-cap`
- 빨강 (예상):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### 수신 게이팅 (멘션 + 제어 명령 우회)

**주장:** 멘션이 필요한 그룹 컨텍스트에서 승인되지 않은 "제어 명령"은 멘션 게이팅을 우회할 수 없습니다.

- 완료:
  - `make ingress-gating`
- 빨강 (예상):
  - `make ingress-gating-negative`

### 라우팅/세션 키 격리

**주장:** 별개 피어의 DM은 명시적으로 연결/설정되지 않는 한 동일한 세션으로 축소되지 않습니다.

- 완료:
  - `make routing-isolation`
- 빨강 (예상):
  - `make routing-isolation-negative`

## v1++: 추가 제한된 모델 (동시성, 재시도, 트레이스 정확성)

이것은 실제 고장 모드(비원자적 업데이트, 재시도, 메시지 팬아웃) 주변의 충실도를 강화하는 후속 모델입니다.

### 페어링 저장소 동시성 / 멱등성

**주장:** 페어링 저장소는 인터리빙 하에서도 `MaxPending`과 멱등성을 적용해야 합니다(즉, "확인 후 쓰기"는 원자적이어야 함 / 잠금되어야 함; 새로고침은 중복을 만들지 않아야 함).

의미:

- 동시 요청 하에서 채널에 대해 `MaxPending`을 초과할 수 없습니다.
- 동일한 `(channel, sender)`에 대한 반복 요청/새로고침은 중복 라이브 보류 중인 행을 만들지 않아야 합니다.

- 완료 실행:
  - `make pairing-race` (원자적/잠금된 제한 확인)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- 빨강 (예상):
  - `make pairing-race-negative` (비원자적 begin/commit 제한 경합)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### 수신 트레이스 상관관계 / 멱등성

**주장:** 수집은 팬아웃 전반에 걸쳐 트레이스 상관관계를 유지하고 프로바이더 재시도 하에서 멱등해야 합니다.

의미:

- 외부 이벤트가 여러 내부 메시지가 될 때 모든 부분은 동일한 트레이스/이벤트 정보를 유지합니다.
- 재시도는 이중 처리로 이어지지 않습니다.
- 프로바이더 이벤트 ID가 누락된 경우 중복 제거는 안전한 키(예: 트레이스 ID)로 폴백하여 서로 다른 이벤트 삭제를 방지합니다.

- 완료:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- 빨강 (예상):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### 라우팅 dmScope 우선순위 + identityLinks

**주장:** 라우팅은 기본적으로 DM 세션을 격리된 상태로 유지하고 명시적으로 설정된 경우(채널 우선순위 + 정체성 링크)에만 세션을 축소해야 합니다.

의미:

- 채널별 dmScope 재정의는 전역 기본값을 이겨야 합니다.
- identityLinks는 관련 없는 피어 간이 아닌 명시적 연결된 그룹 내에서만 축소되어야 합니다.

- 완료:
  - `make routing-precedence`
  - `make routing-identitylinks`
- 빨강 (예상):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

---
title: 형식 검증(보안 모델)
summary: OpenClaw의 가장 위험한 경로에 대한 기계 검증 보안 모델입니다.
permalink: /security/formal-verification/
---

# 형식 검증(보안 모델)

이 페이지는 OpenClaw의 **형식 보안 모델**(현재 TLA+/TLC; 필요에 따라 추가)을 추적합니다.

> 참고: 이전 프로젝트 이름을 참조하는 오래된 링크가 있을 수 있습니다.

**목표(북극성):** OpenClaw가 명시적 가정 하에서 의도된 보안 정책(인증, 세션 격리, 도구 게이팅 및 설정 오류 안전성)을 실행한다는 기계 검증 주장을 제공합니다.

**현재 상태:** 실행 가능한, 공격자 중심의 **보안 회귀 테스트 모음**입니다:

- 각 주장은 유한 상태 공간에서 실행 가능한 모델 검사를 합니다.
- 많은 주장은 현실적인 버그 유형에 대한 반례 추적을 생성하는 쌍을 이룬 **음수 모델**을 포함합니다.

**현재 상태가 아님:** "OpenClaw는 모든 측면에서 안전하다" 또는 전체 TypeScript 구현이 올바르다는 증명입니다.

## 모델이 있는 위치

모델은 별도의 저장소에서 관리됩니다: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)

## 중요한 주의사항

- 이들은 **모델**이지, 전체 TypeScript 구현이 아닙니다. 모델과 코드 간의 차이가 발생할 수 있습니다.
- 결과는 TLC에서 탐색하는 상태 공간으로 제한됩니다. "통과"는 모델링된 가정 및 경계를 넘어서는 보안을 의미하지 않습니다.
- 일부 주장은 명시적 환경 가정(예: 올바른 배포, 올바른 설정 입력)에 의존합니다.

## 결과 재현

현재 결과는 모델 저장소를 로컬로 복제하고 TLC를 실행하여 재현합니다(아래 참조). 향후 반복은 다음을 제공할 수 있습니다:

- CI 실행 모델(공개 아티팩트, 반례 추적, 실행 로그 포함)
- 작고 제한된 검사를 위한 호스팅되는 "이 모델 실행" 워크플로우

시작하기:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ 필수 (TLC는 JVM에서 실행됩니다).
# 저장소는 고정된 `tla2tools.jar`(TLA+ 도구)를 포함하며 `bin/tlc` + Make 대상을 제공합니다.

make <target>
```

### 게이트웨이 노출 및 개방 게이트웨이 설정 오류

**주장:** 인증 없이 루프백을 넘어 바인딩하면 원격 손상이 가능해질 수 있습니다. 토큰/비밀번호는 인증되지 않은 공격자를 차단합니다(모델 가정에 따름).

- 통과 실행:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- 실패 (예상):
  - `make gateway-exposure-v2-negative`

참조: 모델 저장소의 `docs/gateway-exposure-matrix.md`도 확인하세요.

### Nodes.run 파이프라인 (가장 위험한 기능)

**주장:** `nodes.run`은 (a) 노드 명령 허용 목록 + 선언된 명령 및 (b) 구성된 경우 라이브 승인이 필요합니다. 승인은 재생을 방지하기 위해 토큰화됩니다(모델에서).

- 통과 실행:
  - `make nodes-pipeline`
  - `make approvals-token`
- 실패 (예상):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### 페어링 저장소 (DM 게이팅)

**주장:** 페어링 요청은 TTL 및 보류 중인 요청 상한을 준수합니다.

- 통과 실행:
  - `make pairing`
  - `make pairing-cap`
- 실패 (예상):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### 수신 게이팅 (멘션 + 제어 명령 우회)

**주장:** 멘션이 필요한 그룹 컨텍스트에서는 권한이 없는 "제어 명령"이 멘션 게이팅을 우회할 수 없습니다.

- 통과:
  - `make ingress-gating`
- 실패 (예상):
  - `make ingress-gating-negative`

### 라우팅/세션 키 격리

**주장:** 서로 다른 피어로부터의 DM은 명시적으로 링크되거나 설정되지 않는 한 동일한 세션으로 축약되지 않습니다.

- 통과:
  - `make routing-isolation`
- 실패 (예상):
  - `make routing-isolation-negative`

## v1++: 추가 제한된 모델 (동시성, 재시도, 추적 정확성)

이들은 실제 장애 모드(원자성 없는 업데이트, 재시도 및 메시지 팬아웃) 주변의 충실도를 강화하는 후속 모델입니다.

### 페어링 저장소 동시성 / 멱등성

**주장:** 페어링 저장소는 인터리빙 아래에서도 `MaxPending`을 시행하고 멱등성을 보장해야 합니다(즉, "확인-후-쓰기"는 원자성이어야 함 / 잠금되어야 함; 새로고침은 중복을 생성하지 않아야 함).

의미:

- 동시 요청 아래에서 채널에 대해 `MaxPending`을 초과할 수 없습니다.
- 동일한 `(channel, sender)`에 대한 반복된 요청/새로고침은 중복된 라이브 보류 중인 행을 생성하지 않아야 합니다.

- 통과 실행:
  - `make pairing-race` (원자성/잠금된 상한 검사)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- 실패 (예상):
  - `make pairing-race-negative` (원자성 없는 시작/커밋 상한 경쟁)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### 수신 추적 상관관계 / 멱등성

**주장:** 수집은 팬아웃 전체에서 추적 상관관계를 보존하고 프로바이더 재시도에서 멱등성을 유지해야 합니다.

의미:

- 하나의 외부 이벤트가 여러 내부 메시지가 될 때 모든 부분은 동일한 추적/이벤트 정체성을 유지합니다.
- 재시도로 인해 이중 처리가 발생하지 않습니다.
- 프로바이더 이벤트 ID가 누락된 경우 중복 제거는 안전한 키(예: 추적 ID)로 폴백하여 고유 이벤트 손실을 방지합니다.

- 통과:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- 실패 (예상):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### 라우팅 dmScope 우선순위 + identityLinks

**주장:** 라우팅은 기본적으로 DM 세션을 격리된 상태로 유지해야 하며, 명시적으로 구성된 경우에만(채널 우선순위 + ID 링크) 세션을 축약해야 합니다.

의미:

- 채널별 dmScope 오버라이드는 전역 기본값을 재정의해야 합니다.
- identityLinks는 관련 없는 피어 간이 아닌 명시적으로 링크된 그룹 내에서만 축약되어야 합니다.

- 통과:
  - `make routing-precedence`
  - `make routing-identitylinks`
- 실패 (예상):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

---
summary: "OpenClaw가 프롬프트 컨텍스트를 구성하는 방법과 토큰 사용량 및 비용을 보고하는 방식"
read_when:
  - 토큰 사용량, 비용 또는 컨텍스트 윈도우 설명
  - 컨텍스트 증가 또는 압축 동작 디버깅
title: "토큰 사용 및 비용"
---

# 토큰 사용 및 비용

OpenClaw는 **토큰**을 추적합니다. 토큰은 모델별로 다르지만 대부분의
OpenAI 스타일 모델은 영문 텍스트에서 평균적으로 약 4자에 1토큰의 비율을 가집니다.

## 시스템 프롬프트 구성 방식

OpenClaw는 매 실행마다 자체 시스템 프롬프트를 조립합니다. 여기에는 다음이 포함됩니다:

- 도구 목록 + 간단한 설명
- 스킬 목록 (메타데이터만; 지시문은 `read`를 사용해 필요에 따라 로드됨)
- 자동 업데이트 지시문
- 워크스페이스 + 부트스트랩 파일 (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` 신규 파일 포함). 큰 파일은 `agents.defaults.bootstrapMaxChars` (기본값: 20000)로 자릅니다.
- 시간 (UTC + 사용자 시간대)
- 답변 태그 + 하트비트 동작
- 런타임 메타데이터 (호스트/OS/모델/생각)

[시스템 프롬프트](/concepts/system-prompt)에서 전체 분석을 참조하세요.

## 컨텍스트 윈도우에 포함되는 항목

모델이 받는 모든 항목이 컨텍스트 제한에 포함됩니다:

- 시스템 프롬프트 (위에 나열된 모든 섹션)
- 대화 기록 (사용자 + 어시스턴트 메시지)
- 도구 호출 및 도구 결과
- 첨부 파일/트랜스크립션 (이미지, 오디오, 파일)
- 압축 요약 및 가지치기 아티팩트
- 프로바이더 래퍼 또는 안전 헤더 (보이지 않지만 계산됨)

실제 분석 (주입된 파일, 도구, 스킬 및 시스템 프롬프트 크기별)을 보려면 `/context list` 또는 `/context detail`을 사용하세요. [컨텍스트](/concepts/context)를 참조하세요.

## 현재 토큰 사용량 확인 방법

채팅에서 다음을 사용합니다:

- `/status` → 세션 모델, 컨텍스트 사용량,
  마지막 응답 입력/출력 토큰 및 **예상 비용** (API 키만)이 포함된 **이모지가 있는 상태 카드**입니다.
- `/usage off|tokens|full` → 모든 답변에 **응답별 사용량 바닥글**을 추가합니다.
  - 세션별로 유지됩니다 (`responseUsage`로 저장됨).
  - OAuth 인증은 **비용을 숨깁니다** (토큰만).
- `/usage cost` → OpenClaw 세션 로그에서 로컬 비용 요약을 표시합니다.

기타 화면:

- **TUI/웹 TUI:** `/status` + `/usage`가 지원됩니다.
- **CLI:** `openclaw status --usage` 및 `openclaw channels list`는
  프로바이더 할당량 윈도우를 표시합니다 (응답별 비용 아님).

## 비용 추정 (표시될 때)

비용은 모델 가격 설정에서 추정됩니다:

```
models.providers.<provider>.models[].cost
```

이는 `input`, `output`, `cacheRead` 및
`cacheWrite`에 대해 **1,000,000토큰당 USD**입니다. 가격 책정이 없으면 OpenClaw는 토큰만 표시합니다. OAuth 토큰은 절대 달러 비용을 표시하지 않습니다.

## 캐시 TTL 및 가지치기 영향

프로바이더 프롬프트 캐싱은 캐시 TTL 윈도우 내에서만 적용됩니다. OpenClaw는
선택적으로 **캐시-TTL 가지치기**를 실행할 수 있습니다: 캐시 TTL이 만료되면 세션을 가지치고
캐시 윈도우를 재설정하여 후속 요청이 전체 기록을 다시 캐싱하는 대신 새로 캐시된 컨텍스트를 다시 사용할 수 있습니다. 이렇게 하면 세션이 TTL을 지나 유휴 상태에 있을 때 캐시 쓰기 비용이 낮게 유지됩니다.

[게이트웨이 설정](/gateway/configuration)에서 구성하고 [세션 가지치기](/concepts/session-pruning)에서 동작 세부 정보를 참조하세요.

하트비트는 캐시를 유휴 간격을 통해 **따뜻하게** 유지할 수 있습니다. 모델 캐시 TTL이
`1h`인 경우 하트비트 간격을 그보다 약간 작게 설정하면 (예: `55m`), 전체 프롬프트를 다시 캐싱하는 것을 피할 수 있으며
캐시 쓰기 비용이 감소합니다.

Anthropic API 가격의 경우 캐시 읽기가 입력 토큰보다 훨씬 저렴하지만
캐시 쓰기는 더 높은 승수로 청구됩니다. 최신 요금 및 TTL 배수는 Anthropic의 프롬프트 캐싱 가격 책정을 참조하세요:
https://docs.anthropic.com/docs/build-with-claude/prompt-caching

### 예: 하트비트를 사용해 1시간 캐시 따뜻하게 유지

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-5"
    models:
      "anthropic/claude-opus-4-5":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

## 토큰 압력 감소 팁

- `/compact`를 사용해 긴 세션을 요약합니다.
- 워크플로우에서 큰 도구 출력을 자릅니다.
- 스킬 설명을 짧게 유지합니다 (스킬 목록이 프롬프트에 주입됨).
- 상세한 탐색 작업에는 더 작은 모델을 선호합니다.

정확한 스킬 목록 오버헤드 공식은 [스킬](/tools/skills)을 참조하세요.

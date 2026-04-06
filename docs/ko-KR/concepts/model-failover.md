---
summary: "OpenClaw가 인증 프로필을 순환하고 모델 간 폴백하는 방법"
read_when:
  - 인증 프로필 순환, 쿨다운 또는 모델 폴백 동작 진단
  - 인증 프로필 또는 모델에 대한 폴백 규칙 업데이트
title: "모델 폴백"
---

# 모델 폴백

OpenClaw는 두 단계로 실패를 처리합니다:

1. **인증 프로필 순환**: 현재 프로바이더 내에서 순환
2. **모델 폴백**: `agents.defaults.model.fallbacks`의 다음 모델로 폴백

이 문서는 런타임 규칙과 이를 뒷받침하는 데이터를 설명합니다.

## 인증 저장소 (키 + OAuth)

OpenClaw는 API 키와 OAuth 토큰 모두에 **인증 프로필**을 사용합니다.

- 시크릿은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 있습니다 (레거시: `~/.openclaw/agent/auth-profiles.json`).
- 설정 `auth.profiles` / `auth.order`는 **메타데이터 + 라우팅 전용**입니다 (시크릿 없음).
- 레거시 가져오기 전용 OAuth 파일: `~/.openclaw/credentials/oauth.json` (처음 사용 시 `auth-profiles.json`으로 가져옴).

자세한 내용: [/concepts/oauth](/concepts/oauth)

자격 증명 유형:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (일부 프로바이더의 경우 `projectId`/`enterpriseUrl` 포함)

## 프로필 ID

OAuth 로그인은 여러 계정이 공존할 수 있도록 별개의 프로필을 생성합니다.

- 기본값: 이메일을 사용할 수 없는 경우 `provider:default`
- 이메일이 있는 OAuth: `provider:<email>` (예: `google-antigravity:user@gmail.com`)

프로필은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`의 `profiles` 아래에 있습니다.

## 순환 순서

프로바이더에 여러 프로필이 있는 경우, OpenClaw는 다음과 같이 순서를 선택합니다:

1. **명시적 설정**: `auth.order[provider]` (설정된 경우)
2. **설정된 프로필**: 프로바이더로 필터링된 `auth.profiles`
3. **저장된 프로필**: 프로바이더에 대한 `auth-profiles.json`의 항목

명시적 순서가 설정되지 않은 경우, OpenClaw는 라운드 로빈 순서를 사용합니다:

- **기본 키:** 프로필 유형 (**OAuth가 API 키보다 우선**)
- **보조 키:** `usageStats.lastUsed` (각 유형 내에서 가장 오래된 것이 먼저)
- **쿨다운/비활성화된 프로필**은 끝으로 이동하며, 가장 빠른 만료 순으로 정렬됩니다.

### 세션 고정성 (캐시 친화적)

OpenClaw는 프로바이더 캐시를 따뜻하게 유지하기 위해 **세션당 선택한 인증 프로필을 고정**합니다. 모든 요청마다 순환하지 **않습니다**. 고정된 프로필은 다음까지 재사용됩니다:

- 세션이 재설정됨 (`/new` / `/reset`)
- 압축이 완료됨 (압축 카운트 증가)
- 프로필이 쿨다운/비활성화 상태임

`/model …@<profileId>`를 통한 수동 선택은 해당 세션에 대한 **사용자 오버라이드**를 설정하며 새 세션이 시작될 때까지 자동 순환되지 않습니다.

자동 고정 프로필 (세션 라우터가 선택)은 **선호도**로 처리됩니다: 먼저 시도되지만, OpenClaw는 속도 제한/타임아웃 시 다른 프로필로 순환할 수 있습니다. 사용자 고정 프로필은 해당 프로필에 잠겨 있습니다. 실패하고 모델 폴백이 설정된 경우, OpenClaw는 프로필을 전환하는 대신 다음 모델로 이동합니다.

### OAuth가 "손실된 것처럼 보이는" 이유

동일한 프로바이더에 대해 OAuth 프로필과 API 키 프로필이 모두 있는 경우, 고정되지 않으면 라운드 로빈이 메시지 간에 전환될 수 있습니다. 단일 프로필을 강제하려면:

- `auth.order[provider] = ["provider:profileId"]`로 고정하거나
- UI/채팅 표면에서 지원하는 경우 프로필 오버라이드와 함께 `/model …`을 통해 세션별 오버라이드를 사용합니다.

## 쿨다운

인증/속도 제한 오류 (또는 속도 제한처럼 보이는 타임아웃)로 인해 프로필이 실패하면, OpenClaw는 쿨다운으로 표시하고 다음 프로필로 이동합니다. 형식/잘못된 요청 오류 (예: Cloud Code Assist 도구 호출 ID 검증 실패)는 폴백 가능한 것으로 처리되며 동일한 쿨다운을 사용합니다.

쿨다운은 지수 백오프를 사용합니다:

- 1분
- 5분
- 25분
- 1시간 (상한)

상태는 `usageStats` 아래 `auth-profiles.json`에 저장됩니다:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## 청구 비활성화

청구/크레딧 실패 (예: "크레딧 부족" / "크레딧 잔액이 너무 낮음")는 폴백 가능한 것으로 처리되지만, 일반적으로 일시적이지 않습니다. 짧은 쿨다운 대신, OpenClaw는 프로필을 **비활성화** (더 긴 백오프 포함)로 표시하고 다음 프로필/프로바이더로 순환합니다.

상태는 `auth-profiles.json`에 저장됩니다:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

기본값:

- 청구 백오프는 **5시간**에서 시작하여 청구 실패당 두 배로 증가하며 **24시간**에서 제한됩니다.
- 프로필이 **24시간** 동안 실패하지 않은 경우 백오프 카운터가 재설정됩니다 (설정 가능).

## 모델 폴백

프로바이더의 모든 프로필이 실패하면, OpenClaw는 `agents.defaults.model.fallbacks`의 다음 모델로 이동합니다. 이는 인증 실패, 속도 제한 및 프로필 순환을 소진한 타임아웃에 적용됩니다 (다른 오류는 폴백을 진행하지 않음).

런이 모델 오버라이드 (훅 또는 CLI)로 시작되면, 폴백은 설정된 폴백을 시도한 후 여전히 `agents.defaults.model.primary`에서 끝납니다.

## 관련 설정

다음은 [게이트웨이 설정](/gateway/configuration)을 참조하세요:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 라우팅

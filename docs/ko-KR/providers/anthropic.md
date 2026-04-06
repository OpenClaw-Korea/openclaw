---
summary: "OpenClaw에서 API 키 또는 setup-token을 통해 Anthropic Claude 사용"
read_when:
  - OpenClaw에서 Anthropic 모델을 사용하려는 경우
  - API 키 대신 setup-token을 사용하려는 경우
title: "Anthropic"
---

# Anthropic (Claude)

Anthropic은 **Claude** 모델 제품군을 제작하고 API를 통해 액세스를 제공합니다.
OpenClaw에서는 API 키 또는 **setup-token**으로 인증할 수 있습니다.

## 옵션 A: Anthropic API 키

**적합한 경우:** 표준 API 액세스 및 사용량 기반 청구.
Anthropic Console에서 API 키를 생성하세요.

### CLI 설정

```bash
openclaw onboard
# 선택: Anthropic API key

# 또는 비대화형
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### 설정 스니펫

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-5" } } },
}
```

## 프롬프트 캐싱 (Anthropic API)

OpenClaw는 Anthropic의 프롬프트 캐싱 기능을 지원합니다. 이것은 **API 전용**이며, 구독 인증은 캐시 설정을 준수하지 않습니다.

### 설정

모델 설정에서 `cacheRetention` 파라미터를 사용하세요:

| 값      | 캐시 지속 시간 | 설명                         |
| ------- | -------------- | ---------------------------- |
| `none`  | 캐싱 없음      | 프롬프트 캐싱 비활성화       |
| `short` | 5분            | API 키 인증의 기본값         |
| `long`  | 1시간          | 확장 캐시 (베타 플래그 필요) |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-5": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### 기본값

Anthropic API 키 인증을 사용할 때 OpenClaw는 모든 Anthropic 모델에 대해 자동으로 `cacheRetention: "short"` (5분 캐시)를 적용합니다. 설정에서 `cacheRetention`을 명시적으로 설정하여 이를 재정의할 수 있습니다.

### 레거시 파라미터

이전 `cacheControlTtl` 파라미터는 하위 호환성을 위해 여전히 지원됩니다:

- `"5m"`은 `short`에 매핑됩니다
- `"1h"`는 `long`에 매핑됩니다

새로운 `cacheRetention` 파라미터로 마이그레이션하는 것을 권장합니다.

OpenClaw는 Anthropic API 요청에 `extended-cache-ttl-2025-04-11` 베타 플래그를 포함합니다. 프로바이더 헤더를 재정의하는 경우 이를 유지하세요([/gateway/configuration](/gateway/configuration) 참조).

## 옵션 B: Claude setup-token

**적합한 경우:** Claude 구독을 사용하는 경우.

### setup-token을 받는 방법

Setup-token은 Anthropic Console이 아니라 **Claude Code CLI**에서 생성됩니다. **어떤 머신**에서든 실행할 수 있습니다:

```bash
claude setup-token
```

토큰을 OpenClaw에 붙여넣거나(마법사: **Anthropic token (paste setup-token)**), 게이트웨이 호스트에서 실행하세요:

```bash
openclaw models auth setup-token --provider anthropic
```

다른 머신에서 토큰을 생성한 경우 붙여넣으세요:

```bash
openclaw models auth paste-token --provider anthropic
```

### CLI 설정

```bash
# 온보딩 중 setup-token 붙여넣기
openclaw onboard --auth-choice setup-token
```

### 설정 스니펫

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-5" } } },
}
```

## 참고사항

- `claude setup-token`으로 setup-token을 생성하여 붙여넣거나, 게이트웨이 호스트에서 `openclaw models auth setup-token`을 실행하세요.
- Claude 구독에서 "OAuth token refresh failed …"가 표시되면 setup-token으로 재인증하세요. [/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription](/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription)을 참조하세요.
- 인증 세부 정보 + 재사용 규칙은 [/concepts/oauth](/concepts/oauth)에 있습니다.

## 문제 해결

**401 오류 / 토큰이 갑자기 유효하지 않음**

- Claude 구독 인증은 만료되거나 취소될 수 있습니다. `claude setup-token`을 다시 실행하고
  **게이트웨이 호스트**에 붙여넣으세요.
- Claude CLI 로그인이 다른 머신에 있는 경우 게이트웨이 호스트에서
  `openclaw models auth paste-token --provider anthropic`을 사용하세요.

**No API key found for provider "anthropic"**

- 인증은 **에이전트별**로 이루어집니다. 새 에이전트는 메인 에이전트의 키를 상속하지 않습니다.
- 해당 에이전트에 대해 온보딩을 다시 실행하거나, 게이트웨이 호스트에 setup-token / API 키를 붙여넣은 후
  `openclaw models status`로 확인하세요.

**No credentials found for profile `anthropic:default`**

- `openclaw models status`를 실행하여 활성 인증 프로필을 확인하세요.
- 온보딩을 다시 실행하거나, 해당 프로필에 대한 setup-token / API 키를 붙여넣으세요.

**No available auth profile (all in cooldown/unavailable)**

- `openclaw models status --json`에서 `auth.unusableProfiles`를 확인하세요.
- 다른 Anthropic 프로필을 추가하거나 쿨다운이 끝날 때까지 기다리세요.

자세한 내용: [/gateway/troubleshooting](/gateway/troubleshooting) 및 [/help/faq](/help/faq).

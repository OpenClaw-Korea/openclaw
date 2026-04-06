---
summary: "OpenClaw에서 Qwen OAuth (무료 티어) 사용하기"
read_when:
  - OpenClaw에서 Qwen을 사용하고 싶을 때
  - Qwen Coder에 무료 티어 OAuth 액세스가 필요할 때
title: "Qwen"
---

# Qwen

Qwen은 Qwen Coder 및 Qwen Vision 모델에 대한 무료 티어 OAuth 플로우를 제공합니다
(하루 2,000 요청, Qwen 속도 제한 적용).

## 플러그인 활성화

```bash
openclaw plugins enable qwen-portal-auth
```

활성화 후 게이트웨이를 재시작하세요.

## 인증

```bash
openclaw models auth login --provider qwen-portal --set-default
```

이 명령은 Qwen 디바이스 코드 OAuth 플로우를 실행하고 프로바이더 항목을 `models.json`에 작성합니다 (빠른 전환을 위한 `qwen` 별칭 포함).

## 모델 ID

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

다음 명령으로 모델을 전환하세요:

```bash
openclaw models set qwen-portal/coder-model
```

## Qwen Code CLI 로그인 재사용

Qwen Code CLI로 이미 로그인한 경우, OpenClaw는 인증 저장소를 로드할 때 `~/.qwen/oauth_creds.json`에서 자격 증명을 동기화합니다. 여전히 `models.providers.qwen-portal` 항목이 필요합니다 (위의 로그인 명령을 사용하여 생성하세요).

## 참고사항

- 토큰은 자동으로 갱신됩니다. 갱신에 실패하거나 액세스가 취소되면 로그인 명령을 다시 실행하세요.
- 기본 베이스 URL: `https://portal.qwen.ai/v1` (Qwen이 다른 엔드포인트를 제공하는 경우 `models.providers.qwen-portal.baseUrl`로 재정의).
- 프로바이더 전역 규칙은 [모델 프로바이더](/concepts/model-providers)를 참조하세요.

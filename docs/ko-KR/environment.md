---
summary: "OpenClaw가 환경 변수를 로드하는 위치 및 우선순위"
read_when:
  - 로드되는 환경 변수와 순서를 알아야 하는 경우
  - 게이트웨이에서 누락된 API 키를 디버깅하는 경우
  - 프로바이더 인증 또는 배포 환경을 문서화하는 경우
title: "환경 변수"
---

# 환경 변수

OpenClaw는 여러 소스에서 환경 변수를 가져옵니다. 규칙은 **기존 값을 절대 재정의하지 않음**입니다.

## 우선순위 (높음 → 낮음)

1. **프로세스 환경** (게이트웨이 프로세스가 이미 부모 셸/데몬으로부터 가지고 있는 것).
2. **현재 작업 디렉토리의 `.env`** (dotenv 기본값; 재정의하지 않음).
3. **전역 `.env`** (`~/.openclaw/.env` 또는 `$OPENCLAW_STATE_DIR/.env`; 재정의하지 않음).
4. **설정의 `env` 블록** (`~/.openclaw/openclaw.json`에서, 누락된 경우에만 적용).
5. **선택적 로그인 셸 가져오기** (`env.shellEnv.enabled` 또는 `OPENCLAW_LOAD_SHELL_ENV=1`), 누락된 필요한 키에만 적용.

설정 파일이 완전히 누락된 경우 4단계는 건너뛰어집니다. 셸 가져오기는 활성화된 경우 여전히 실행됩니다.

## 설정 `env` 블록

인라인 환경 변수를 설정하는 두 가지 동등한 방법(둘 다 재정의하지 않음):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## 셸 환경 변수 가져오기

`env.shellEnv`는 로그인 셸을 실행하고 **누락된** 필요한 키만 가져옵니다:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

환경 변수 동등물:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## 설정에서 환경 변수 대체

`${VAR_NAME}` 구문을 사용하여 설정 문자열 값에서 환경 변수를 직접 참조할 수 있습니다:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

자세한 내용은 [설정: 환경 변수 대체](/gateway/configuration#env-var-substitution-in-config)를 참조하세요.

## 관련 문서

- [게이트웨이 설정](/gateway/configuration)
- [FAQ: 환경 변수 및 .env 로딩](/help/faq#env-vars-and-env-loading)
- [모델 개요](/concepts/models)

---
summary: "OpenClaw에서 MiniMax M2.1 사용하기"
read_when:
  - OpenClaw에서 MiniMax 모델을 사용하고 싶을 때
  - MiniMax 설정 가이드가 필요할 때
title: "MiniMax"
---

# MiniMax

MiniMax는 **M2/M2.1** 모델 패밀리를 구축하는 AI 회사입니다. 현재 코딩에 중점을 둔 릴리스는 **MiniMax M2.1** (2025년 12월 23일)이며, 실제 복잡한 작업을 위해 구축되었습니다.

출처: [MiniMax M2.1 릴리스 노트](https://www.minimax.io/news/minimax-m21)

## 모델 개요 (M2.1)

MiniMax는 M2.1의 다음 개선 사항을 강조합니다:

- 더 강력한 **다중 언어 코딩** (Rust, Java, Go, C++, Kotlin, Objective-C, TS/JS).
- 더 나은 **웹/앱 개발** 및 심미적 출력 품질 (네이티브 모바일 포함).
- 오피스 스타일 워크플로우를 위한 **복합 명령** 처리 개선, 교차 사고와 통합된 제약 실행 기반.
- **더 간결한 응답**으로 토큰 사용량 감소 및 빠른 반복 루프.
- 더 강력한 **도구/에이전트 프레임워크** 호환성 및 컨텍스트 관리 (Claude Code, Droid/Factory AI, Cline, Kilo Code, Roo Code, BlackBox).
- 더 높은 품질의 **대화 및 기술 작성** 출력.

## MiniMax M2.1 vs MiniMax M2.1 Lightning

- **속도:** Lightning은 MiniMax 가격 문서의 "빠른" 변형입니다.
- **비용:** 가격 책정은 동일한 입력 비용을 보여주지만 Lightning은 출력 비용이 더 높습니다.
- **코딩 플랜 라우팅:** Lightning 백엔드는 MiniMax 코딩 플랜에서 직접 사용할 수 없습니다. MiniMax는 대부분의 요청을 Lightning으로 자동 라우팅하지만, 트래픽 급증 시 일반 M2.1 백엔드로 폴백합니다.

## 설정 선택

### MiniMax OAuth (코딩 플랜) — 권장

**최적 사용:** OAuth를 통한 MiniMax 코딩 플랜 빠른 설정, API 키 불필요.

번들 OAuth 플러그인을 활성화하고 인증하세요:

```bash
openclaw plugins enable minimax-portal-auth  # 이미 로드된 경우 건너뛰기
openclaw gateway restart  # 게이트웨이가 이미 실행 중인 경우 재시작
openclaw onboard --auth-choice minimax-portal
```

엔드포인트 선택 프롬프트가 표시됩니다:

- **Global** - 국제 사용자 (`api.minimax.io`)
- **CN** - 중국 사용자 (`api.minimaxi.com`)

자세한 내용은 [MiniMax OAuth 플러그인 README](https://github.com/openclaw/openclaw/tree/main/extensions/minimax-portal-auth)를 참조하세요.

### MiniMax M2.1 (API 키)

**최적 사용:** Anthropic 호환 API를 사용한 호스팅 MiniMax.

CLI를 통한 설정:

- `openclaw configure` 실행
- **Model/auth** 선택
- **MiniMax M2.1** 선택

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.1" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.1",
            name: "MiniMax M2.1",
            reasoning: false,
            input: ["text"],
            cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### MiniMax M2.1을 폴백으로 사용 (Opus 기본)

**최적 사용:** Opus 4.5를 기본으로 유지하고, MiniMax M2.1로 폴백.

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-5": { alias: "opus" },
        "minimax/MiniMax-M2.1": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-5",
        fallbacks: ["minimax/MiniMax-M2.1"],
      },
    },
  },
}
```

### 선택 사항: LM Studio를 통한 로컬 (수동)

**최적 사용:** LM Studio를 사용한 로컬 추론.
강력한 하드웨어 (예: 데스크톱/서버)에서 LM Studio의 로컬 서버를 사용하여 MiniMax M2.1로 강력한 결과를 확인했습니다.

`openclaw.json`을 통해 수동으로 설정:

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.1-gs32" },
      models: { "lmstudio/minimax-m2.1-gs32": { alias: "Minimax" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.1-gs32",
            name: "MiniMax M2.1 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## `openclaw configure`를 통한 설정

JSON을 편집하지 않고 대화형 설정 마법사를 사용하여 MiniMax를 설정하세요:

1. `openclaw configure` 실행.
2. **Model/auth** 선택.
3. **MiniMax M2.1** 선택.
4. 프롬프트가 표시되면 기본 모델을 선택하세요.

## 설정 옵션

- `models.providers.minimax.baseUrl`: `https://api.minimax.io/anthropic` 권장 (Anthropic 호환); `https://api.minimax.io/v1`은 OpenAI 호환 페이로드에 선택 사항.
- `models.providers.minimax.api`: `anthropic-messages` 권장; `openai-completions`는 OpenAI 호환 페이로드에 선택 사항.
- `models.providers.minimax.apiKey`: MiniMax API 키 (`MINIMAX_API_KEY`).
- `models.providers.minimax.models`: `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` 정의.
- `agents.defaults.models`: 허용 목록에 원하는 모델의 별칭 지정.
- `models.mode`: 기본 제공 모델과 함께 MiniMax를 추가하려면 `merge` 유지.

## 참고사항

- 모델 참조는 `minimax/<model>`입니다.
- 코딩 플랜 사용량 API: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (코딩 플랜 키 필요).
- 정확한 비용 추적이 필요한 경우 `models.json`의 가격 값을 업데이트하세요.
- MiniMax 코딩 플랜 추천 링크 (10% 할인): https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link
- 프로바이더 규칙은 [/concepts/model-providers](/concepts/model-providers)를 참조하세요.
- `openclaw models list` 및 `openclaw models set minimax/MiniMax-M2.1`을 사용하여 전환하세요.

## 문제 해결

### "Unknown model: minimax/MiniMax-M2.1"

이는 일반적으로 **MiniMax 프로바이더가 설정되지 않았음**을 의미합니다 (프로바이더 항목이 없고 MiniMax 인증 프로필/환경 키를 찾을 수 없음). 이 감지에 대한 수정 사항은 **2026.1.12** (작성 시점에는 미출시)에 있습니다. 다음과 같이 수정하세요:

- **2026.1.12**로 업그레이드 (또는 소스 `main`에서 실행)한 후 게이트웨이를 재시작하세요.
- `openclaw configure`를 실행하고 **MiniMax M2.1**을 선택하거나,
- `models.providers.minimax` 블록을 수동으로 추가하거나,
- `MINIMAX_API_KEY` (또는 MiniMax 인증 프로필)를 설정하여 프로바이더를 주입할 수 있도록 하세요.

모델 ID가 **대소문자를 구분**하는지 확인하세요:

- `minimax/MiniMax-M2.1`
- `minimax/MiniMax-M2.1-lightning`

그런 다음 다음 명령으로 다시 확인하세요:

```bash
openclaw models list
```

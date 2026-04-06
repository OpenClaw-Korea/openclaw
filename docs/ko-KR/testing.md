---
summary: "테스트 키트: 단위/e2e/라이브 스위트, Docker 러너 및 각 테스트가 다루는 내용"
read_when:
  - 로컬 또는 CI에서 테스트를 실행하는 경우
  - 모델/프로바이더 버그에 대한 회귀를 추가하는 경우
  - 게이트웨이 + 에이전트 동작을 디버깅하는 경우
title: "테스트"
---

# 테스트

OpenClaw는 세 개의 Vitest 스위트(단위/통합, e2e, 라이브)와 작은 Docker 러너 세트를 가지고 있습니다.

이 문서는 "테스트 방법" 가이드입니다:

- 각 스위트가 다루는 것(그리고 의도적으로 다루지 _않는_ 것)
- 일반적인 워크플로(로컬, 푸시 전, 디버깅)에 대해 실행할 명령어
- 라이브 테스트가 자격 증명을 발견하고 모델/프로바이더를 선택하는 방법
- 실제 모델/프로바이더 이슈에 대한 회귀를 추가하는 방법

## 빠른 시작

대부분의 날:

- 전체 게이트 (푸시 전 예상): `pnpm build && pnpm check && pnpm test`

테스트를 만지거나 추가 확신이 필요할 때:

- 커버리지 게이트: `pnpm test:coverage`
- E2E 스위트: `pnpm test:e2e`

실제 프로바이더/모델 디버깅 시(실제 자격 증명 필요):

- 라이브 스위트 (모델 + 게이트웨이 도구/이미지 프로브): `pnpm test:live`

팁: 실패하는 케이스가 하나만 필요한 경우, 아래에 설명된 허용 목록 환경 변수를 통해 라이브 테스트를 좁히는 것을 선호하세요.

## 테스트 스위트 (어디서 무엇이 실행되는지)

스위트를 "현실성 증가"(그리고 불안정성/비용 증가)로 생각하세요:

### 단위 / 통합 (기본값)

- 명령어: `pnpm test`
- 설정: `vitest.config.ts`
- 파일: `src/**/*.test.ts`
- 범위:
  - 순수 단위 테스트
  - 프로세스 내 통합 테스트 (게이트웨이 인증, 라우팅, 도구, 파싱, 설정)
  - 알려진 버그에 대한 결정론적 회귀
- 기대사항:
  - CI에서 실행
  - 실제 키 불필요
  - 빠르고 안정적이어야 함

### E2E (게이트웨이 스모크)

- 명령어: `pnpm test:e2e`
- 설정: `vitest.e2e.config.ts`
- 파일: `src/**/*.e2e.test.ts`
- 범위:
  - 다중 인스턴스 게이트웨이 엔드투엔드 동작
  - WebSocket/HTTP 서페이스, 노드 페어링 및 더 무거운 네트워킹
- 기대사항:
  - CI에서 실행 (파이프라인에서 활성화된 경우)
  - 실제 키 불필요
  - 단위 테스트보다 더 많은 움직이는 부분 (더 느릴 수 있음)

### 라이브 (실제 프로바이더 + 실제 모델)

- 명령어: `pnpm test:live`
- 설정: `vitest.live.config.ts`
- 파일: `src/**/*.live.test.ts`
- 기본값: `pnpm test:live`에 의해 **활성화** (`OPENCLAW_LIVE_TEST=1` 설정)
- 범위:
  - "이 프로바이더/모델이 실제 자격 증명으로 _오늘_ 실제로 작동하는가?"
  - 프로바이더 형식 변경, 도구 호출 특이점, 인증 문제 및 속도 제한 동작 포착
- 기대사항:
  - 설계상 CI 안정적이지 않음 (실제 네트워크, 실제 프로바이더 정책, 할당량, 중단)
  - 비용 발생 / 속도 제한 사용
  - "모든 것" 대신 좁힌 하위 집합 실행 선호
  - 라이브 실행은 `~/.profile`을 소싱하여 누락된 API 키를 선택합니다
  - Anthropic 키 회전: `OPENCLAW_LIVE_ANTHROPIC_KEYS="sk-...,sk-..."` (또는 `OPENCLAW_LIVE_ANTHROPIC_KEY=sk-...`) 또는 여러 `ANTHROPIC_API_KEY*` 변수 설정; 테스트는 속도 제한에서 재시도합니다

## 어떤 스위트를 실행해야 하나요?

이 결정 테이블을 사용하세요:

- 로직/테스트 편집: `pnpm test` 실행 (많이 변경한 경우 `pnpm test:coverage`)
- 게이트웨이 네트워킹 / WS 프로토콜 / 페어링 작업: `pnpm test:e2e` 추가
- "내 봇이 다운됨" / 프로바이더별 실패 / 도구 호출 디버깅: 좁힌 `pnpm test:live` 실행

## 라이브: 모델 스모크 (프로필 키)

라이브 테스트는 두 레이어로 분할되어 실패를 격리할 수 있습니다:

- "직접 모델"은 프로바이더/모델이 주어진 키로 응답할 수 있는지 알려줍니다.
- "게이트웨이 스모크"는 전체 게이트웨이+에이전트 파이프라인이 해당 모델에 대해 작동하는지 알려줍니다(세션, 히스토리, 도구, 샌드박스 정책 등).

### 레이어 1: 직접 모델 완성 (게이트웨이 없음)

- 테스트: `src/agents/models.profiles.live.test.ts`
- 목표:
  - 발견된 모델 열거
  - `getApiKeyForModel`을 사용하여 자격 증명이 있는 모델 선택
  - 모델당 작은 완성 실행 (필요한 경우 대상 회귀)
- 활성화 방법:
  - `pnpm test:live` (또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
- 이 스위트를 실제로 실행하려면 `OPENCLAW_LIVE_MODELS=modern` (또는 `all`, modern의 별칭) 설정; 그렇지 않으면 `pnpm test:live`를 게이트웨이 스모크에 집중하기 위해 건너뜁니다
- 모델 선택 방법:
  - `OPENCLAW_LIVE_MODELS=modern`으로 현대 허용 목록 실행 (Opus/Sonnet/Haiku 4.5, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.1, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`은 현대 허용 목록의 별칭
  - 또는 `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-5,..."` (쉼표 허용 목록)
- 프로바이더 선택 방법:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (쉼표 허용 목록)
- 키가 어디서 오는지:
  - 기본값: 프로필 저장소 및 환경 변수 대체
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 설정으로 **프로필 저장소**만 강제
- 왜 존재하는지:
  - "프로바이더 API가 손상됨 / 키가 유효하지 않음"을 "게이트웨이 에이전트 파이프라인이 손상됨"과 분리
  - 작고 격리된 회귀 포함 (예: OpenAI Responses/Codex Responses 추론 재생 + 도구 호출 흐름)

### 레이어 2: 게이트웨이 + 개발 에이전트 스모크 ("@openclaw"가 실제로 수행하는 작업)

- 테스트: `src/gateway/gateway-models.profiles.live.test.ts`
- 목표:
  - 프로세스 내 게이트웨이 시작
  - `agent:dev:*` 세션 생성/패치 (실행당 모델 재정의)
  - 키가 있는 모델을 반복하고 검증:
    - "의미 있는" 응답 (도구 없음)
    - 실제 도구 호출 작동 (읽기 프로브)
    - 선택적 추가 도구 프로브 (exec+읽기 프로브)
    - OpenAI 회귀 경로 (도구 호출 전용 → 후속) 계속 작동
- 프로브 세부 정보 (실패를 빠르게 설명할 수 있도록):
  - `read` 프로브: 테스트가 워크스페이스에 논스 파일을 작성하고 에이전트에게 `read`하고 논스를 다시 에코하도록 요청합니다.
  - `exec+read` 프로브: 테스트가 에이전트에게 `exec`로 논스를 임시 파일에 작성한 다음 `read`하도록 요청합니다.
  - 이미지 프로브: 테스트가 생성된 PNG(고양이 + 무작위 코드)를 첨부하고 모델이 `cat <CODE>`를 반환할 것으로 예상합니다.
  - 구현 참조: `src/gateway/gateway-models.profiles.live.test.ts` 및 `src/gateway/live-image-probe.ts`.
- 활성화 방법:
  - `pnpm test:live` (또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
- 모델 선택 방법:
  - 기본값: 현대 허용 목록 (Opus/Sonnet/Haiku 4.5, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.1, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`은 현대 허용 목록의 별칭
  - 또는 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (또는 쉼표 목록) 설정으로 좁히기
- 프로바이더 선택 방법 ("OpenRouter 모든 것" 방지):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (쉼표 허용 목록)
- 도구 + 이미지 프로브는 이 라이브 테스트에서 항상 켜짐:
  - `read` 프로브 + `exec+read` 프로브 (도구 스트레스)
  - 이미지 프로브는 모델이 이미지 입력 지원을 광고할 때 실행
  - 흐름 (높은 수준):
    - 테스트가 "CAT" + 무작위 코드로 작은 PNG 생성 (`src/gateway/live-image-probe.ts`)
    - `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`를 통해 전송
    - 게이트웨이가 첨부 파일을 `images[]`로 파싱 (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - 임베디드 에이전트가 모델에 멀티모달 사용자 메시지 전달
    - 검증: 응답에 `cat` + 코드 포함 (OCR 허용 오차: 사소한 실수 허용)

팁: 머신에서 테스트할 수 있는 것(및 정확한 `provider/model` ID)을 보려면 실행하세요:

```bash
openclaw models list
openclaw models list --json
```

## 라이브: Anthropic setup-token 스모크

- 테스트: `src/agents/anthropic.setup-token.live.test.ts`
- 목표: Claude Code CLI setup-token(또는 붙여넣은 setup-token 프로필)이 Anthropic 프롬프트를 완료할 수 있는지 확인.
- 활성화:
  - `pnpm test:live` (또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_SETUP_TOKEN=1`
- 토큰 소스 (하나 선택):
  - 프로필: `OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test`
  - 원시 토큰: `OPENCLAW_LIVE_SETUP_TOKEN_VALUE=sk-ant-oat01-...`
- 모델 재정의 (선택 사항):
  - `OPENCLAW_LIVE_SETUP_TOKEN_MODEL=anthropic/claude-opus-4-5`

설정 예시:

```bash
openclaw models auth paste-token --provider anthropic --profile-id anthropic:setup-token-test
OPENCLAW_LIVE_SETUP_TOKEN=1 OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test pnpm test:live src/agents/anthropic.setup-token.live.test.ts
```

## 라이브: CLI 백엔드 스모크 (Claude Code CLI 또는 기타 로컬 CLI)

- 테스트: `src/gateway/gateway-cli-backend.live.test.ts`
- 목표: 로컬 CLI 백엔드를 사용하여 게이트웨이 + 에이전트 파이프라인 검증, 기본 설정을 건드리지 않음.
- 활성화:
  - `pnpm test:live` (또는 Vitest를 직접 호출하는 경우 `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 기본값:
  - 모델: `claude-cli/claude-sonnet-4-5`
  - 명령: `claude`
  - 인수: `["-p","--output-format","json","--dangerously-skip-permissions"]`
- 재정의 (선택 사항):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2-codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`로 실제 이미지 첨부 파일 전송 (경로가 프롬프트에 주입됨).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`로 프롬프트 주입 대신 CLI 인수로 이미지 파일 경로 전달.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (또는 `"list"`)로 `IMAGE_ARG`가 설정된 경우 이미지 인수가 전달되는 방식 제어.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`로 두 번째 턴을 보내고 재개 흐름 검증.
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0`으로 Claude Code CLI MCP 설정 활성화 유지 (기본값은 임시 빈 파일로 MCP 설정 비활성화).

예시:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

### 권장 라이브 레시피

좁고 명시적인 허용 목록이 가장 빠르고 가장 안정적입니다:

- 단일 모델, 직접 (게이트웨이 없음):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- 단일 모델, 게이트웨이 스모크:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 여러 프로바이더에 걸친 도구 호출:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-5,google/gemini-3-flash-preview,zai/glm-4.7,minimax/minimax-m2.1" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 포커스 (Gemini API 키 + Antigravity):
  - Gemini (API 키): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-5-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

참고:

- `google/...`는 Gemini API(API 키) 사용.
- `google-antigravity/...`는 Antigravity OAuth 브리지(Cloud Code Assist 스타일 에이전트 엔드포인트) 사용.
- `google-gemini-cli/...`는 머신의 로컬 Gemini CLI 사용(별도 인증 + 도구 특이점).
- Gemini API vs Gemini CLI:
  - API: OpenClaw가 HTTP를 통해 Google의 호스팅된 Gemini API 호출(API 키 / 프로필 인증); 대부분의 사용자가 "Gemini"를 의미하는 것.
  - CLI: OpenClaw가 로컬 `gemini` 바이너리로 셸 아웃; 자체 인증이 있으며 다르게 동작할 수 있음(스트리밍/도구 지원/버전 불일치).

## 라이브: 모델 매트릭스 (다루는 것)

고정된 "CI 모델 목록"은 없지만(라이브는 옵트인) 이것들은 키가 있는 개발 머신에서 정기적으로 다루도록 **권장**되는 모델입니다.

### 현대 스모크 세트 (도구 호출 + 이미지)

이것은 계속 작동할 것으로 예상되는 "일반 모델" 실행입니다:

- OpenAI (Codex 아님): `openai/gpt-5.2` (선택 사항: `openai/gpt-5.1`)
- OpenAI Codex: `openai-codex/gpt-5.2` (선택 사항: `openai-codex/gpt-5.2-codex`)
- Anthropic: `anthropic/claude-opus-4-5` (또는 `anthropic/claude-sonnet-4-5`)
- Google (Gemini API): `google/gemini-3-pro-preview` 및 `google/gemini-3-flash-preview` (이전 Gemini 2.x 모델 피하기)
- Google (Antigravity): `google-antigravity/claude-opus-4-5-thinking` 및 `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/minimax-m2.1`

도구 + 이미지로 게이트웨이 스모크 실행:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-5,google/gemini-3-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-5-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/minimax-m2.1" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 기본: 도구 호출 (Read + 선택적 Exec)

프로바이더 패밀리당 최소 하나 선택:

- OpenAI: `openai/gpt-5.2` (또는 `openai/gpt-5-mini`)
- Anthropic: `anthropic/claude-opus-4-5` (또는 `anthropic/claude-sonnet-4-5`)
- Google: `google/gemini-3-flash-preview` (또는 `google/gemini-3-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/minimax-m2.1`

선택적 추가 커버리지 (있으면 좋음):

- xAI: `xai/grok-4` (또는 사용 가능한 최신)
- Mistral: `mistral/`… (활성화한 "도구" 가능 모델 하나 선택)
- Cerebras: `cerebras/`… (접근 권한이 있는 경우)
- LM Studio: `lmstudio/`… (로컬; 도구 호출은 API 모드에 따라 다름)

### 비전: 이미지 전송 (첨부 파일 → 멀티모달 메시지)

이미지 프로브를 실행하려면 `OPENCLAW_LIVE_GATEWAY_MODELS`에 최소 하나의 이미지 지원 모델을 포함하세요(Claude/Gemini/OpenAI 비전 지원 변형 등).

### 집계자 / 대체 게이트웨이

키가 활성화되어 있는 경우 다음을 통해 테스트도 지원합니다:

- OpenRouter: `openrouter/...` (수백 개의 모델; `openclaw models scan`을 사용하여 도구+이미지 가능 후보 찾기)
- OpenCode Zen: `opencode/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`를 통한 인증)

자격 증명/설정이 있는 경우 라이브 매트릭스에 포함할 수 있는 더 많은 프로바이더:

- 내장: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers`를 통해 (커스텀 엔드포인트): `minimax` (클라우드/API), OpenAI/Anthropic 호환 프록시(LM Studio, vLLM, LiteLLM 등)

팁: 문서에 "모든 모델"을 하드코딩하려고 하지 마세요. 권위 있는 목록은 머신에서 `discoverModels(...)`가 반환하는 것 + 사용 가능한 키입니다.

## 자격 증명 (절대 커밋하지 마세요)

라이브 테스트는 CLI와 동일한 방식으로 자격 증명을 발견합니다. 실질적 의미:

- CLI가 작동하면 라이브 테스트도 동일한 키를 찾아야 합니다.
- 라이브 테스트가 "자격 증명 없음"이라고 하면 `openclaw models list` / 모델 선택을 디버깅하는 것과 동일한 방식으로 디버깅하세요.

- 프로필 저장소: `~/.openclaw/credentials/` (선호; 테스트에서 "프로필 키"가 의미하는 것)
- 설정: `~/.openclaw/openclaw.json` (또는 `OPENCLAW_CONFIG_PATH`)

환경 변수 키에 의존하려면(예: `~/.profile`에 내보낸 것) `source ~/.profile` 후 로컬 테스트를 실행하거나 아래 Docker 러너를 사용하세요(컨테이너에 `~/.profile`을 마운트할 수 있음).

## Deepgram 라이브 (오디오 전사)

- 테스트: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- 활성화: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Docker 러너 (선택적 "Linux에서 작동" 확인)

이것들은 로컬 설정 디렉토리 및 워크스페이스를 마운트하고(그리고 마운트된 경우 `~/.profile` 소싱) 리포지토리 Docker 이미지 내에서 `pnpm test:live`를 실행합니다:

- 직접 모델: `pnpm test:docker:live-models` (스크립트: `scripts/test-live-models-docker.sh`)
- 게이트웨이 + 개발 에이전트: `pnpm test:docker:live-gateway` (스크립트: `scripts/test-live-gateway-models-docker.sh`)
- 온보딩 마법사 (TTY, 전체 스캐폴딩): `pnpm test:docker:onboard` (스크립트: `scripts/e2e/onboard-docker.sh`)
- 게이트웨이 네트워킹 (두 개의 컨테이너, WS 인증 + 상태): `pnpm test:docker:gateway-network` (스크립트: `scripts/e2e/gateway-network-docker.sh`)
- 플러그인 (커스텀 확장 로드 + 레지스트리 스모크): `pnpm test:docker:plugins` (스크립트: `scripts/e2e/plugins-docker.sh`)

유용한 환경 변수:

- `OPENCLAW_CONFIG_DIR=...` (기본값: `~/.openclaw`) `/home/node/.openclaw`에 마운트
- `OPENCLAW_WORKSPACE_DIR=...` (기본값: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace`에 마운트
- `OPENCLAW_PROFILE_FILE=...` (기본값: `~/.profile`) `/home/node/.profile`에 마운트되고 테스트 실행 전 소싱
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`로 실행 좁히기
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`로 자격 증명이 프로필 저장소에서 오도록 보장(환경 변수 아님)

## 문서 정상성

문서 편집 후 문서 확인 실행: `pnpm docs:list`.

## 오프라인 회귀 (CI 안전)

이것들은 실제 프로바이더 없이 "실제 파이프라인" 회귀입니다:

- 게이트웨이 도구 호출 (모의 OpenAI, 실제 게이트웨이 + 에이전트 루프): `src/gateway/gateway.tool-calling.mock-openai.test.ts`
- 게이트웨이 마법사 (WS `wizard.start`/`wizard.next`, 설정 + 인증 강제 작성): `src/gateway/gateway.wizard.e2e.test.ts`

## 에이전트 신뢰성 평가 (스킬)

"에이전트 신뢰성 평가"처럼 작동하는 몇 가지 CI 안전 테스트가 이미 있습니다:

- 실제 게이트웨이 + 에이전트 루프를 통한 모의 도구 호출 (`src/gateway/gateway.tool-calling.mock-openai.test.ts`).
- 세션 배선 및 설정 효과를 검증하는 엔드투엔드 마법사 흐름 (`src/gateway/gateway.wizard.e2e.test.ts`).

스킬에 여전히 누락된 것([스킬](/tools/skills) 참조):

- **의사 결정:** 스킬이 프롬프트에 나열될 때 에이전트가 올바른 스킬을 선택하는가(또는 관련 없는 것을 피하는가)?
- **규정 준수:** 에이전트가 사용 전에 `SKILL.md`를 읽고 필수 단계/인수를 따르는가?
- **워크플로 계약:** 도구 순서, 세션 히스토리 이월 및 샌드박스 경계를 검증하는 다중 턴 시나리오.

향후 평가는 먼저 결정론적으로 유지해야 합니다:

- 모의 프로바이더를 사용하여 도구 호출 + 순서, 스킬 파일 읽기 및 세션 배선을 검증하는 시나리오 러너.
- 스킬 중심 시나리오의 작은 스위트(사용 vs 회피, 게이팅, 프롬프트 주입).
- CI 안전 스위트가 준비된 후에만 선택적 라이브 평가(옵트인, 환경 변수 게이트).

## 회귀 추가 (가이드)

라이브에서 발견된 프로바이더/모델 이슈를 수정할 때:

- 가능한 경우 CI 안전 회귀 추가(모의/스텁 프로바이더 또는 정확한 요청 형태 변환 캡처)
- 본질적으로 라이브 전용인 경우(속도 제한, 인증 정책) 라이브 테스트를 좁게 유지하고 환경 변수를 통해 옵트인
- 버그를 잡는 가장 작은 레이어를 대상으로 하는 것을 선호:
  - 프로바이더 요청 변환/재생 버그 → 직접 모델 테스트
  - 게이트웨이 세션/히스토리/도구 파이프라인 버그 → 게이트웨이 라이브 스모크 또는 CI 안전 게이트웨이 모의 테스트

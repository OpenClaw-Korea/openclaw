---
summary: "비용을 낼 수 있는 기능, 사용되는 키, 사용량 확인 방법 감시"
read_when:
  - API 키를 호출할 수 있는 기능을 이해하고 싶을 때
  - 키, 비용, 사용량 가시성을 감시해야 할 때
  - /status 또는 /usage 비용 리포팅을 설명할 때
title: "API 사용량 및 비용"
---

# API 사용량 및 비용

이 문서는 **API 키를 호출할 수 있는 기능**과 해당 비용이 표시되는 위치를 나열합니다. OpenClaw 기능 중 프로바이더 사용량이나 유료 API 호출을 발생시킬 수 있는 기능에 중점을 둡니다.

## 비용이 표시되는 위치 (채팅 + CLI)

**세션별 비용 스냅샷**

- `/status`는 현재 세션 모델, 컨텍스트 사용량, 마지막 응답 토큰을 표시합니다.
- 모델에서 **API 키 인증**을 사용하는 경우, `/status`는 마지막 응답의 **예상 비용**도 표시합니다.

**메시지별 비용 표시**

- `/usage full`은 모든 응답에 사용량 표시를 추가하며, **예상 비용**(API 키만)을 포함합니다.
- `/usage tokens`은 토큰만 표시하며, OAuth 흐름은 달러 비용을 숨깁니다.

**CLI 사용량 창 (프로바이더 할당량)**

- `openclaw status --usage` 및 `openclaw channels list`는 프로바이더 **사용량 창**(할당량 스냅샷, 메시지별 비용 아님)을 표시합니다.

자세한 내용과 예제는 [토큰 사용 및 비용](/token-use)을 참조하세요.

## 키 발견 방법

OpenClaw는 다음 위치에서 자격 증명을 선택할 수 있습니다:

- **인증 프로필** (에이전트별, `auth-profiles.json`에 저장).
- **환경 변수** (예: `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **설정** (`models.providers.*.apiKey`, `tools.web.search.*`, `tools.web.fetch.firecrawl.*`,
  `memorySearch.*`, `talk.apiKey`).
- **스킬** (`skills.entries.<name>.apiKey`)는 스킬 프로세스 환경에 키를 내보낼 수 있습니다.

## 키를 사용할 수 있는 기능

### 1) 핵심 모델 응답 (채팅 + 도구)

모든 응답이나 도구 호출은 **현재 모델 프로바이더** (OpenAI, Anthropic 등)를 사용합니다. 이것이 사용량과 비용의 주요 원인입니다.

가격 설정은 [모델](/providers/models)을 참고하고 표시에 대해서는 [토큰 사용 및 비용](/token-use)을 참고하세요.

### 2) 미디어 이해 (오디오/이미지/비디오)

인바운드 미디어는 응답 실행 전에 요약/전사될 수 있습니다. 이는 모델/프로바이더 API를 사용합니다.

- 오디오: OpenAI / Groq / Deepgram (키가 있을 때 **자동 활성화**됨).
- 이미지: OpenAI / Anthropic / Google.
- 비디오: Google.

자세한 내용은 [미디어 이해](/nodes/media-understanding)를 참고하세요.

### 3) 메모리 임베딩 + 의미론적 검색

의미론적 메모리 검색은 원격 프로바이더에 대해 구성되었을 때 **임베딩 API**를 사용합니다:

- `memorySearch.provider = "openai"` → OpenAI 임베딩
- `memorySearch.provider = "gemini"` → Gemini 임베딩
- 로컬 임베딩 실패 시 OpenAI로 선택적 대체

`memorySearch.provider = "local"`로 로컬 유지할 수 있습니다(API 사용 없음).

자세한 내용은 [메모리](/concepts/memory)를 참고하세요.

### 4) 웹 검색 도구 (Brave / OpenRouter를 통한 Perplexity)

`web_search`는 API 키를 사용하며 사용 요금이 발생할 수 있습니다:

- **Brave Search API**: `BRAVE_API_KEY` 또는 `tools.web.search.apiKey`
- **Perplexity** (OpenRouter 경유): `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY`

**Brave 무료 요금제 (관대함):**

- **월 2,000 요청**
- **초당 1 요청**
- **신용카드 필수** (검증 용도, 업그레이드 시에만 요금 부과)

자세한 내용은 [웹 도구](/tools/web)를 참고하세요.

### 5) 웹 가져오기 도구 (Firecrawl)

`web_fetch`는 API 키가 있을 때 **Firecrawl**을 호출할 수 있습니다:

- `FIRECRAWL_API_KEY` 또는 `tools.web.fetch.firecrawl.apiKey`

Firecrawl이 구성되지 않은 경우, 도구는 직접 가져오기 + 가독성으로 대체됩니다(유료 API 없음).

자세한 내용은 [웹 도구](/tools/web)를 참고하세요.

### 6) 프로바이더 사용량 스냅샷 (상태/상태 확인)

일부 상태 명령은 **프로바이더 사용량 엔드포인트**를 호출하여 할당량 창 또는 인증 상태를 표시합니다.
이러한 호출은 일반적으로 낮은 볼륨이지만 여전히 프로바이더 API에 도달합니다:

- `openclaw status --usage`
- `openclaw models status --json`

자세한 내용은 [모델 CLI](/cli/models)를 참고하세요.

### 7) 압축 안전장치 요약

압축 안전장치는 **현재 모델**을 사용하여 세션 기록을 요약할 수 있으며, 실행될 때 프로바이더 API를 호출합니다.

자세한 내용은 [세션 관리 + 압축](/reference/session-management-compaction)을 참고하세요.

### 8) 모델 스캔 / 프로브

`openclaw models scan`은 OpenRouter 모델을 프로브할 수 있으며 프로브가 활성화되었을 때 `OPENROUTER_API_KEY`를 사용합니다.

자세한 내용은 [모델 CLI](/cli/models)를 참고하세요.

### 9) Talk (음성)

Talk 모드는 구성되었을 때 **ElevenLabs**를 호출할 수 있습니다:

- `ELEVENLABS_API_KEY` 또는 `talk.apiKey`

자세한 내용은 [Talk 모드](/nodes/talk)를 참고하세요.

### 10) 스킬 (타사 API)

스킬은 `skills.entries.<name>.apiKey`에 `apiKey`를 저장할 수 있습니다. 스킬이 외부 API에 해당 키를 사용하는 경우, 스킬의 프로바이더에 따라 비용이 발생할 수 있습니다.

자세한 내용은 [스킬](/tools/skills)을 참고하세요.

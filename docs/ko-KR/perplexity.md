---
summary: "웹 검색을 위한 Perplexity Sonar 설정"
read_when:
  - Perplexity Sonar를 웹 검색에 사용하고 싶은 경우
  - PERPLEXITY_API_KEY 또는 OpenRouter 설정이 필요한 경우
title: "Perplexity Sonar"
---

# Perplexity Sonar

OpenClaw는 `web_search` 도구에 Perplexity Sonar를 사용할 수 있습니다. Perplexity의 직접 API 또는 OpenRouter를 통해 연결할 수 있습니다.

## API 옵션

### Perplexity (직접)

- Base URL: https://api.perplexity.ai
- 환경 변수: `PERPLEXITY_API_KEY`

### OpenRouter (대안)

- Base URL: https://openrouter.ai/api/v1
- 환경 변수: `OPENROUTER_API_KEY`
- 선불 크레딧/암호화폐 크레딧을 지원합니다.

## 설정 예시

```json5
{
  tools: {
    web: {
      search: {
        provider: "perplexity",
        perplexity: {
          apiKey: "pplx-...",
          baseUrl: "https://api.perplexity.ai",
          model: "perplexity/sonar-pro",
        },
      },
    },
  },
}
```

## Brave에서 전환하기

```json5
{
  tools: {
    web: {
      search: {
        provider: "perplexity",
        perplexity: {
          apiKey: "pplx-...",
          baseUrl: "https://api.perplexity.ai",
        },
      },
    },
  },
}
```

`PERPLEXITY_API_KEY`와 `OPENROUTER_API_KEY`가 모두 설정된 경우, `tools.web.search.perplexity.baseUrl` (또는 `tools.web.search.perplexity.apiKey`)을 설정하여 구분합니다.

기본 URL이 설정되지 않은 경우, OpenClaw는 API 키 소스에 따라 기본값을 선택합니다:

- `PERPLEXITY_API_KEY` 또는 `pplx-...` → Perplexity 직접 (`https://api.perplexity.ai`)
- `OPENROUTER_API_KEY` 또는 `sk-or-...` → OpenRouter (`https://openrouter.ai/api/v1`)
- 알 수 없는 키 형식 → OpenRouter (안전한 대안)

## 모델

- `perplexity/sonar` — 웹 검색을 이용한 빠른 Q&A
- `perplexity/sonar-pro` (기본값) — 다단계 추론 + 웹 검색
- `perplexity/sonar-reasoning-pro` — 깊이 있는 연구

전체 웹 검색 설정은 [웹 도구](/tools/web)를 참조하세요.

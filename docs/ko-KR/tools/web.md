---
summary: "웹 검색 + 가져오기 도구 (Brave Search API, Perplexity 직접/OpenRouter)"
read_when:
  - web_search 또는 web_fetch를 활성화하려는 경우
  - Brave Search API 키 설정이 필요한 경우
  - 웹 검색에 Perplexity Sonar를 사용하려는 경우
title: "웹 도구"
---

# 웹 도구

OpenClaw는 두 가지 경량 웹 도구를 제공합니다:

- `web_search` — Brave Search API (기본값) 또는 Perplexity Sonar (직접 또는 OpenRouter를 통해)를 통해 웹을 검색합니다.
- `web_fetch` — HTTP 가져오기 + 읽기 가능한 추출 (HTML → 마크다운/텍스트).

이들은 브라우저 자동화가 **아닙니다**. JS가 많은 사이트 또는 로그인의 경우,
[브라우저 도구](/tools/browser)를 사용하세요.

## 작동 방식

- `web_search`는 설정된 프로바이더를 호출하고 결과를 반환합니다.
  - **Brave** (기본값): 구조화된 결과 (제목, URL, 스니펫)를 반환합니다.
  - **Perplexity**: 실시간 웹 검색의 인용과 함께 AI 합성 답변을 반환합니다.
- 결과는 쿼리별로 15분 동안 캐시됩니다 (설정 가능).
- `web_fetch`는 일반 HTTP GET을 수행하고 읽기 가능한 콘텐츠를 추출합니다
  (HTML → 마크다운/텍스트). JavaScript를 실행하지 **않습니다**.
- `web_fetch`는 기본적으로 활성화되어 있습니다 (명시적으로 비활성화하지 않는 한).

## 검색 프로바이더 선택

| 프로바이더         | 장점                           | 단점                                   | API 키                                         |
| ------------------ | ------------------------------ | -------------------------------------- | ---------------------------------------------- |
| **Brave** (기본값) | 빠름, 구조화된 결과, 무료 티어 | 전통적인 검색 결과                     | `BRAVE_API_KEY`                                |
| **Perplexity**     | AI 합성 답변, 인용, 실시간     | Perplexity 또는 OpenRouter 액세스 필요 | `OPENROUTER_API_KEY` 또는 `PERPLEXITY_API_KEY` |

프로바이더별 세부 정보는 [Brave Search 설정](/brave-search) 및 [Perplexity Sonar](/perplexity)를 참조하세요.

설정에서 프로바이더를 설정하세요:

```json5
{
  tools: {
    web: {
      search: {
        provider: "brave", // 또는 "perplexity"
      },
    },
  },
}
```

예시: Perplexity Sonar로 전환 (직접 API):

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

## Brave API 키 받기

1. https://brave.com/search/api/에서 Brave Search API 계정을 만드세요
2. 대시보드에서 **Data for Search** 플랜 ("Data for AI"가 아님)을 선택하고 API 키를 생성하세요.
3. `openclaw configure --section web`을 실행하여 설정에 키를 저장하거나 (권장), 환경 변수에 `BRAVE_API_KEY`를 설정하세요.

Brave는 무료 티어와 유료 플랜을 제공합니다; 현재 제한 사항 및 가격은 Brave API 포털을 확인하세요.

### 키를 설정할 위치 (권장)

**권장:** `openclaw configure --section web`을 실행하세요. `~/.openclaw/openclaw.json`의 `tools.web.search.apiKey` 아래에 키를 저장합니다.

**환경 변수 대안:** 게이트웨이 프로세스 환경에 `BRAVE_API_KEY`를 설정하세요.
게이트웨이 설치의 경우, `~/.openclaw/.env` (또는 서비스 환경)에 넣으세요. [환경 변수](/help/faq#how-does-openclaw-load-environment-variables)를 참조하세요.

## Perplexity 사용 (직접 또는 OpenRouter를 통해)

Perplexity Sonar 모델은 내장 웹 검색 기능을 가지고 있으며 인용과 함께 AI 합성
답변을 반환합니다. OpenRouter를 통해 사용할 수 있습니다 (신용카드 불필요 - 암호화폐/선불 지원).

### OpenRouter API 키 받기

1. https://openrouter.ai/에서 계정을 만드세요
2. 크레딧 추가 (암호화폐, 선불 또는 신용카드 지원)
3. 계정 설정에서 API 키 생성

### Perplexity 검색 설정

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "perplexity",
        perplexity: {
          // API 키 (OPENROUTER_API_KEY 또는 PERPLEXITY_API_KEY가 설정된 경우 선택사항)
          apiKey: "sk-or-v1-...",
          // 기본 URL (생략된 경우 키 인식 기본값)
          baseUrl: "https://openrouter.ai/api/v1",
          // 모델 (기본값은 perplexity/sonar-pro)
          model: "perplexity/sonar-pro",
        },
      },
    },
  },
}
```

**환경 변수 대안:** 게이트웨이 환경에 `OPENROUTER_API_KEY` 또는 `PERPLEXITY_API_KEY`를 설정하세요.
게이트웨이 설치의 경우, `~/.openclaw/.env`에 넣으세요.

기본 URL이 설정되지 않은 경우, OpenClaw는 API 키 소스를 기반으로 기본값을 선택합니다:

- `PERPLEXITY_API_KEY` 또는 `pplx-...` → `https://api.perplexity.ai`
- `OPENROUTER_API_KEY` 또는 `sk-or-...` → `https://openrouter.ai/api/v1`
- 알 수 없는 키 형식 → OpenRouter (안전한 대체)

### 사용 가능한 Perplexity 모델

| 모델                             | 설명                         | 최적 용도   |
| -------------------------------- | ---------------------------- | ----------- |
| `perplexity/sonar`               | 웹 검색을 사용한 빠른 Q&A    | 빠른 조회   |
| `perplexity/sonar-pro` (기본값)  | 웹 검색을 사용한 다단계 추론 | 복잡한 질문 |
| `perplexity/sonar-reasoning-pro` | 생각의 사슬 분석             | 심층 연구   |

## web_search

설정된 프로바이더를 사용하여 웹을 검색합니다.

### 요구 사항

- `tools.web.search.enabled`가 `false`가 아니어야 합니다 (기본값: 활성화)
- 선택한 프로바이더를 위한 API 키:
  - **Brave**: `BRAVE_API_KEY` 또는 `tools.web.search.apiKey`
  - **Perplexity**: `OPENROUTER_API_KEY`, `PERPLEXITY_API_KEY`, 또는 `tools.web.search.perplexity.apiKey`

### 설정

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "BRAVE_API_KEY_HERE", // BRAVE_API_KEY가 설정된 경우 선택사항
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

### 도구 매개변수

- `query` (필수)
- `count` (1–10; 설정의 기본값)
- `country` (선택사항): 지역별 결과를 위한 2자리 국가 코드 (예: "DE", "US", "ALL"). 생략된 경우, Brave가 기본 지역을 선택합니다.
- `search_lang` (선택사항): 검색 결과를 위한 ISO 언어 코드 (예: "de", "en", "fr")
- `ui_lang` (선택사항): UI 요소를 위한 ISO 언어 코드
- `freshness` (선택사항, Brave만): 발견 시간별 필터 (`pd`, `pw`, `pm`, `py`, 또는 `YYYY-MM-DDtoYYYY-MM-DD`)

**예시:**

```javascript
// 독일 전용 검색
await web_search({
  query: "TV online schauen",
  count: 10,
  country: "DE",
  search_lang: "de",
});

// 프랑스어 UI가 있는 프랑스 검색
await web_search({
  query: "actualités",
  country: "FR",
  search_lang: "fr",
  ui_lang: "fr",
});

// 최근 결과 (지난 주)
await web_search({
  query: "TMBG interview",
  freshness: "pw",
});
```

## web_fetch

URL을 가져와서 읽기 가능한 콘텐츠를 추출합니다.

### 요구 사항

- `tools.web.fetch.enabled`가 `false`가 아니어야 합니다 (기본값: 활성화)
- 선택적 Firecrawl 대체: `tools.web.fetch.firecrawl.apiKey` 또는 `FIRECRAWL_API_KEY`를 설정하세요.

### 설정

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true,
        maxChars: 50000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        readability: true,
        firecrawl: {
          enabled: true,
          apiKey: "FIRECRAWL_API_KEY_HERE", // FIRECRAWL_API_KEY가 설정된 경우 선택사항
          baseUrl: "https://api.firecrawl.dev",
          onlyMainContent: true,
          maxAgeMs: 86400000, // ms (1일)
          timeoutSeconds: 60,
        },
      },
    },
  },
}
```

### 도구 매개변수

- `url` (필수, http/https만)
- `extractMode` (`markdown` | `text`)
- `maxChars` (긴 페이지 잘라내기)

참고사항:

- `web_fetch`는 Readability (메인 콘텐츠 추출)를 먼저 사용한 다음 Firecrawl (설정된 경우)을 사용합니다. 둘 다 실패하면, 도구는 오류를 반환합니다.
- Firecrawl 요청은 기본적으로 봇 회피 모드를 사용하고 결과를 캐시합니다.
- `web_fetch`는 기본적으로 Chrome과 유사한 User-Agent 및 `Accept-Language`를 보냅니다; 필요한 경우 `userAgent`를 재정의하세요.
- `web_fetch`는 프라이빗/내부 호스트 이름을 차단하고 리디렉션을 다시 확인합니다 (`maxRedirects`로 제한).
- `web_fetch`는 최선의 노력 추출입니다; 일부 사이트는 브라우저 도구가 필요합니다.
- 키 설정 및 서비스 세부 정보는 [Firecrawl](/tools/firecrawl)을 참조하세요.
- 응답은 캐시됩니다 (기본값 15분) 반복적인 가져오기를 줄이기 위해.
- 도구 프로필/허용 목록을 사용하는 경우, `web_search`/`web_fetch` 또는 `group:web`을 추가하세요.
- Brave 키가 누락된 경우, `web_search`는 문서 링크가 포함된 짧은 설정 힌트를 반환합니다.

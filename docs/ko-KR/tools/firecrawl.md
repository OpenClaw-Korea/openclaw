---
summary: "Firecrawl fallback for web_fetch (anti-bot + cached extraction)"
read_when:
  - You want Firecrawl-backed web extraction
  - You need a Firecrawl API key
  - You want anti-bot extraction for web_fetch
title: "Firecrawl"
---

# Firecrawl

OpenClaw는 **Firecrawl**을 `web_fetch`의 폴백 추출기로 사용할 수 있습니다. 이는 봇 우회와 캐싱을 지원하는 호스팅된 콘텐츠 추출 서비스로, JavaScript가 많이 사용되는 사이트나 일반 HTTP 요청을 차단하는 페이지에 도움이 됩니다.

## API 키 획득

1. Firecrawl 계정을 생성하고 API 키를 생성합니다.
2. 설정에 저장하거나 게이트웨이 환경에서 `FIRECRAWL_API_KEY`를 설정합니다.

## Firecrawl 설정

```json5
{
  tools: {
    web: {
      fetch: {
        firecrawl: {
          apiKey: "FIRECRAWL_API_KEY_HERE",
          baseUrl: "https://api.firecrawl.dev",
          onlyMainContent: true,
          maxAgeMs: 172800000,
          timeoutSeconds: 60,
        },
      },
    },
  },
}
```

참고:

- `firecrawl.enabled`는 API 키가 있을 때 기본값으로 true입니다.
- `maxAgeMs`는 캐시된 결과가 얼마나 오래될 수 있는지를 제어합니다 (밀리초). 기본값은 2일입니다.

## 스텔스 / 봇 우회

Firecrawl은 봇 우회를 위한 **프록시 모드** 매개변수를 제공합니다 (`basic`, `stealth` 또는 `auto`).
OpenClaw는 항상 Firecrawl 요청에 대해 `proxy: "auto"` 및 `storeInCache: true`를 사용합니다.
프록시가 생략되면 Firecrawl은 기본값으로 `auto`입니다. `auto`는 기본 시도가 실패하면 스텔스 프록시로 다시 시도하며, 이는 기본 전용 스크래핑보다 더 많은 크레딧을 사용할 수 있습니다.

## `web_fetch`가 Firecrawl을 사용하는 방법

`web_fetch` 추출 순서:

1. Readability (로컬)
2. Firecrawl (설정된 경우)
3. 기본 HTML 정리 (마지막 폴백)

전체 웹 도구 설정은 [웹 도구](/tools/web)를 참조하세요.

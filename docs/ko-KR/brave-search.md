---
summary: "web_search용 Brave Search API 설정"
read_when:
  - web_search에 Brave Search를 사용하고 싶으실 때
  - BRAVE_API_KEY 또는 요금 계획 세부 정보가 필요할 때
title: "Brave Search"
---

# Brave Search API

OpenClaw는 `web_search`에 대해 기본 프로바이더로 Brave Search를 사용합니다.

## API 키 얻기

1. https://brave.com/search/api/에서 Brave Search API 계정을 생성합니다.
2. 대시보드에서 **Data for Search** 요금 계획을 선택하고 API 키를 생성합니다.
3. 키를 설정에 저장하거나(권장) 게이트웨이 환경에서 `BRAVE_API_KEY`를 설정합니다.

## 설정 예시

```json5
{
  tools: {
    web: {
      search: {
        provider: "brave",
        apiKey: "BRAVE_API_KEY_HERE",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

## 참고사항

- Data for AI 요금 계획은 `web_search`와 호환되지 **않습니다**.
- Brave는 무료 티어와 유료 계획을 제공합니다. 현재 제한사항은 Brave API 포털을 확인하세요.

전체 web_search 설정은 [웹 도구](/tools/web)를 참고하세요.

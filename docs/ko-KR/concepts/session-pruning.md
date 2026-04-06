---
summary: "세션 프루닝: 컨텍스트 비대화를 줄이기 위한 도구 결과 정리"
read_when:
  - 도구 출력으로 인한 LLM 컨텍스트 증가를 줄이려 할 때
  - agents.defaults.contextPruning을 조정할 때
---

# 세션 프루닝

세션 프루닝은 각 LLM 호출 직전에 메모리 내 컨텍스트에서 **이전 도구 결과**를 정리합니다. 디스크에 저장된 세션 기록(`*.jsonl`)을 다시 쓰지는 않습니다.

## 실행 시점

- `mode: "cache-ttl"`이 활성화되어 있고 세션의 마지막 Anthropic 호출이 `ttl`보다 오래되었을 때 실행됩니다.
- 해당 요청에 대해 모델로 전송되는 메시지에만 영향을 미칩니다.
- Anthropic API 호출(및 OpenRouter Anthropic 모델)에만 활성화됩니다.
- 최상의 결과를 위해 `ttl`을 모델의 `cacheControlTtl`과 일치시키세요.
- 프루닝 후 TTL 윈도우가 재설정되므로 후속 요청은 `ttl`이 만료될 때까지 캐시를 유지합니다.

## 스마트 기본값(Anthropic)

- **OAuth 또는 설정 토큰** 프로필: `cache-ttl` 프루닝을 활성화하고 하트비트를 `1h`로 설정합니다.
- **API 키** 프로필: `cache-ttl` 프루닝을 활성화하고, 하트비트를 `30m`으로 설정하며, Anthropic 모델의 기본 `cacheControlTtl`을 `1h`로 설정합니다.
- 이 값 중 하나라도 명시적으로 설정하면 OpenClaw는 이를 재정의하지 않습니다.

## 개선 사항(비용 + 캐시 동작)

- **프루닝하는 이유**: Anthropic 프롬프트 캐싱은 TTL 내에서만 적용됩니다. 세션이 TTL을 지나 유휴 상태가 되면, 먼저 정리하지 않으면 다음 요청에서 전체 프롬프트를 다시 캐시합니다.
- **더 저렴해지는 것**: 프루닝은 TTL 만료 후 첫 번째 요청의 **cacheWrite** 크기를 줄입니다.
- **TTL 재설정이 중요한 이유**: 프루닝이 실행되면 캐시 윈도우가 재설정되므로 후속 요청이 새로 캐시된 프롬프트를 재사용하는 대신 전체 기록을 다시 캐시할 수 있습니다.
- **하지 않는 것**: 프루닝은 토큰을 추가하거나 "이중" 비용을 발생시키지 않습니다. TTL 후 첫 번째 요청에서 캐시되는 대상만 변경합니다.

## 정리될 수 있는 것

- `toolResult` 메시지만 해당합니다.
- 사용자 + 어시스턴트 메시지는 **절대로** 수정되지 않습니다.
- 마지막 `keepLastAssistants` 어시스턴트 메시지는 보호됩니다. 해당 임계점 이후의 도구 결과는 프루닝되지 않습니다.
- 임계점을 설정할 만큼 충분한 어시스턴트 메시지가 없으면 프루닝이 건너뜁니다.
- **이미지 블록**을 포함하는 도구 결과는 건너뜁니다(절대로 정리/제거되지 않음).

## 컨텍스트 윈도우 추정

프루닝은 추정된 컨텍스트 윈도우를 사용합니다(문자 ≈ 토큰 × 4). 기본 윈도우는 이 순서대로 해결됩니다:

1. `models.providers.*.models[].contextWindow` 오버라이드.
2. 모델 정의 `contextWindow`(모델 레지스트리에서).
3. 기본값 `200000` 토큰.

`agents.defaults.contextTokens`이 설정되면 해결된 윈도우의 캡(최소)으로 처리됩니다.

## 모드

### cache-ttl

- 마지막 Anthropic 호출이 `ttl`(기본값 `5m`)보다 오래되었을 때만 프루닝이 실행됩니다.
- 실행될 때: 이전과 동일한 소프트 정리 + 하드 제거 동작입니다.

## 소프트 vs 하드 프루닝

- **소프트 정리**: 크기 초과 도구 결과에만 해당합니다.
  - 시작 + 끝을 유지하고 `...`을 삽입하며 원본 크기에 대한 참고사항을 추가합니다.
  - 이미지 블록이 있는 결과는 건너뜁니다.
- **하드 제거**: 전체 도구 결과를 `hardClear.placeholder`로 대체합니다.

## 도구 선택

- `tools.allow` / `tools.deny`는 `*` 와일드카드를 지원합니다.
- Deny가 우선합니다.
- 매칭은 대소문자를 구분하지 않습니다.
- 빈 allow 목록 => 모든 도구 허용됨.

## 다른 제한과의 상호작용

- 기본 제공 도구는 이미 자신의 출력을 자릅니다. 세션 프루닝은 장시간 실행되는 채팅에서 도구 출력이 모델 컨텍스트에 축적되지 않도록 방지하는 추가 계층입니다.
- 압축은 별개입니다: 압축은 요약하고 지속하며, 프루닝은 요청당 일시적입니다. [개념/압축](/concepts/compaction)을 참조하세요.

## 기본값(활성화 시)

- `ttl`: `"5m"`
- `keepLastAssistants`: `3`
- `softTrimRatio`: `0.3`
- `hardClearRatio`: `0.5`
- `minPrunableToolChars`: `50000`
- `softTrim`: `{ maxChars: 4000, headChars: 1500, tailChars: 1500 }`
- `hardClear`: `{ enabled: true, placeholder: "[Old tool result content cleared]" }`

## 예시

기본값(비활성):

```json5
{
  agent: {
    contextPruning: { mode: "off" },
  },
}
```

TTL 인식 프루닝 활성화:

```json5
{
  agent: {
    contextPruning: { mode: "cache-ttl", ttl: "5m" },
  },
}
```

특정 도구에 프루닝 제한:

```json5
{
  agent: {
    contextPruning: {
      mode: "cache-ttl",
      tools: { allow: ["exec", "read"], deny: ["*image*"] },
    },
  },
}
```

설정 참조 확인: [게이트웨이 설정](/gateway/configuration)

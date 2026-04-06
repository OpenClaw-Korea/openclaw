# OpenClaw 문서 i18n 자산

이 폴더에는 문서 번역을 위한 **생성된** 파일과 **설정** 파일이 저장됩니다.

## 파일

- `glossary.<lang>.json` — 선호 용어 매핑 (프롬프트 지침에 사용됨).
- `<lang>.tm.jsonl` — 번역 메모리 (캐시), 워크플로우 + 모델 + 텍스트 해시로 키 지정됨.

## 용어집 형식

`glossary.<lang>.json`은 항목의 배열입니다:

```json
{
  "source": "troubleshooting",
  "target": "故障排除",
  "ignore_case": true,
  "whole_word": false
}
```

필드:

- `source`: 선호되는 영어 (또는 원어) 구문입니다.
- `target`: 선호되는 번역 결과입니다.

## 참고 사항

- 용어집 항목은 **프롬프트 지침**으로 모델에 전달됩니다 (결정론적 재작성 없음).
- 번역 메모리는 `scripts/docs-i18n`에 의해 업데이트됩니다.

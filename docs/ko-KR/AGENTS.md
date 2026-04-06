# AGENTS.md - ko-KR 문서 번역 작업 가이드

## Read When

- `docs/ko-KR/**` 유지보수 시
- 한국어 번역 파이프라인 업데이트 시 (glossary/TM/prompt)
- 한국어 번역 피드백 또는 회귀 처리 시

## Pipeline (docs-i18n)

- 소스 문서: `docs/**/*.md`
- 대상 문서: `docs/ko-KR/**/*.md`
- 용어집: `docs/.i18n/glossary.ko-KR.json`
- 번역 메모리: `docs/.i18n/ko-KR.tm.jsonl`
- 프롬프트 규칙: `scripts/docs-i18n/translator.go`

실행 방법:

```bash
# 배치 (doc 모드, 병렬 처리)
go run scripts/docs-i18n/main.go -lang ko-KR -mode doc -parallel 6 docs/**/*.md

# 단일 파일
go run scripts/docs-i18n/main.go -lang ko-KR -mode doc docs/index.md

# 세그먼트 모드 (TM 사용, 소규모 패치)
go run scripts/docs-i18n/main.go -lang ko-KR -mode segment docs/channels/telegram.md
```

주의사항:

- doc 모드: 전체 페이지 번역용
- segment 모드: 소규모 수정용 (TM 의존)
- 대용량 파일 타임아웃 시: 정확한 부분 교체 또는 분할 후 실행
- 번역 후 검토: 한글 맞춤법, 외래어 표기, 용어 일관성 확인

## ko-KR 스타일 가이드

- **외래어 표기**: 기술 용어는 원어 또는 관용적 표기 유지
  - Gateway, Skills, CLI, API → 원어 유지
  - sandbox → 샌드박스 (관용)
  - agent → 에이전트 (관용)
- **띄어쓰기**: 영문-한글 사이 공백 없음 (`Gateway를`, `Skills에서`)
- **문체**: 경어체 (합니다, 입니다, 하세요)
- **코드블록**: 번역하지 않음, 원문 유지
- **인라인 코드**: 번역하지 않음, 원문 유지
- **인용부호**: 한글 따옴표 사용 (`""`, `''`)

## 핵심 용어 (glossary.ko-KR.json)

| English         | Korean     |
| --------------- | ---------- |
| Gateway         | 게이트웨이 |
| agent           | 에이전트   |
| channel         | 채널       |
| session         | 세션       |
| provider        | 프로바이더 |
| Skills          | 스킬       |
| sandbox         | 샌드박스   |
| onboarding      | 온보딩     |
| pairing         | 페어링     |
| Getting Started | 시작하기   |
| troubleshooting | 문제 해결  |

## 피드백 및 변경 기록

- 피드백 출처: GitHub issue #3460
- 초기 셋업: 2026-02-04
- 변경 요점: 초기 용어집 생성, 파이프라인 테스트

---
summary: "참조: 프로바이더별 대화 기록 정규화 및 복구 규칙"
read_when:
  - 프로바이더 요청 거부가 대화 기록 형식과 관련되어 있을 때
  - 대화 기록 정규화 또는 도구 호출 복구 로직을 변경할 때
  - 프로바이더 간 도구 호출 ID 불일치를 조사할 때
title: "대화 기록 정규화"
---

# 대화 기록 정규화 (프로바이더 수정사항)

이 문서에서는 실행 전 대화 기록에 적용되는 **프로바이더별 수정사항**을 설명합니다(모델 컨텍스트 구축). 이러한 정규화 단계는 엄격한 프로바이더 요구사항을 충족하기 위한 **메모리 내** 조정입니다. 이 정규화 단계는 디스크에 저장된 JSONL 대화 기록을 재작성하지 않습니다. 다만, 별도의 세션 파일 복구 과정에서 세션이 로드되기 전에 형식이 잘못된 JSONL 파일을 복구할 수 있으며, 잘못된 줄을 삭제하여 파일을 재작성합니다. 복구가 발생하면 원본 파일이 세션 파일 옆에 백업됩니다.

범위는 다음을 포함합니다:

- 도구 호출 ID 정규화
- 도구 호출 입력 검증
- 도구 결과 페어링 복구
- 턴 검증 / 순서 변경
- Thought 서명 정리
- 이미지 페이로드 정규화

대화 기록 저장소 세부사항이 필요하면 다음을 참조하세요:

- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## 실행 위치

모든 대화 기록 정규화는 임베드된 러너에서 중앙집중화됩니다:

- 정책 선택: `src/agents/transcript-policy.ts`
- 정규화/복구 적용: `src/agents/pi-embedded-runner/google.ts`의 `sanitizeSessionHistory`

정책은 `provider`, `modelApi`, `modelId`를 사용하여 적용할 항목을 결정합니다.

대화 기록 정규화와 별개로, 세션 파일은 로드 전에 필요한 경우 복구됩니다:

- `src/agents/session-file-repair.ts`의 `repairSessionFileIfNeeded`
- `run/attempt.ts` 및 `compact.ts`(임베드된 러너)에서 호출됨

---

## 글로벌 규칙: 이미지 정규화

이미지 페이로드는 항상 정규화되어 프로바이더 측 크기 제한으로 인한 거부를 방지합니다(크기 초과 base64 이미지 축소/재압축).

구현:

- `src/agents/pi-embedded-helpers/images.ts`의 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts`의 `sanitizeContentBlocksImages`

---

## 글로벌 규칙: 형식이 잘못된 도구 호출

`input`과 `arguments` 모두 없는 보조 도구 호출 블록은 모델 컨텍스트 구축 전에 삭제됩니다. 이는 부분적으로 저장된 도구 호출(예: 속도 제한 실패 후)로 인한 프로바이더 거부를 방지합니다.

구현:

- `src/agents/session-transcript-repair.ts`의 `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/google.ts`의 `sanitizeSessionHistory`에서 적용

---

## 프로바이더 매트릭스 (현재 동작)

**OpenAI / OpenAI Codex**

- 이미지 정규화만 수행합니다.
- OpenAI Responses/Codex로 모델 전환 시, orphaned reasoning 서명(다음 콘텐츠 블록이 없는 독립 실행형 reasoning 항목) 삭제합니다.
- 도구 호출 ID 정규화 없음.
- 도구 결과 페어링 복구 없음.
- 턴 검증 또는 재정렬 없음.
- 합성 도구 결과 없음.
- Thought 서명 제거 없음.

**Google (Generative AI / Gemini CLI / Antigravity)**

- 도구 호출 ID 정규화: 엄격한 영숫자.
- 도구 결과 페어링 복구 및 합성 도구 결과.
- 턴 검증(Gemini 스타일 턴 교대).
- Google 턴 순서 수정(히스토리가 보조자로 시작하면 작은 사용자 부트스트랩 앞에 추가).
- Antigravity Claude: thinking 서명 정규화; 서명 없는 thinking 블록 삭제.

**Anthropic / Minimax (Anthropic 호환)**

- 도구 결과 페어링 복구 및 합성 도구 결과.
- 턴 검증(엄격한 교대를 충족하기 위해 연속 사용자 턴 병합).

**Mistral (모델 ID 기반 감지 포함)**

- 도구 호출 ID 정규화: strict9 (영숫자 길이 9).

**OpenRouter Gemini**

- Thought 서명 정리: base64가 아닌 `thought_signature` 값 제거(base64는 유지).

**기타 모두**

- 이미지 정규화만 수행합니다.

---

## 과거 동작 (2026.1.22 이전)

2026.1.22 릴리스 이전에 OpenClaw는 여러 계층의 대화 기록 정규화를 적용했습니다:

- **transcript-sanitize extension**은 모든 컨텍스트 구축에서 실행되었으며 다음을 수행할 수 있었습니다:
  - 도구 사용/결과 페어링 복구.
  - 도구 호출 ID 정규화(`_`/`-` 보존하는 비엄격 모드 포함).
- 러너는 또한 프로바이더별 정규화를 수행했으며, 이는 중복 작업이었습니다.
- 프로바이더 정책 외부에서도 추가 변경이 발생했습니다:
  - 지속성 전에 보조 텍스트에서 `<final>` 태그 제거.
  - 빈 보조 오류 턴 삭제.
  - 도구 호출 후 보조 콘텐츠 트리밍.

이 복잡성으로 인해 교차 프로바이더 회귀가 발생했습니다(특히 `openai-responses` `call_id|fc_id` 페어링). 2026.1.22 정리는 extension을 제거하고, 로직을 러너에 중앙집중화하며, OpenAI를 이미지 정규화 이상으로는 **무터치** 상태로 만들었습니다.

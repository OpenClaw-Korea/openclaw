---
summary: "apply_patch 도구를 사용하여 여러 파일 패치를 적용합니다"
read_when:
  - 여러 파일에 걸친 구조화된 파일 편집이 필요한 경우
  - 패치 기반 편집을 문서화하거나 디버깅하려는 경우
title: "apply_patch 도구"
---

# apply_patch 도구

구조화된 패치 형식을 사용하여 파일 변경사항을 적용합니다. 이 도구는 단일 `edit` 호출로는 취약할 수 있는 여러 파일 또는 여러 청크 편집에 이상적입니다.

이 도구는 하나 이상의 파일 작업을 포함하는 단일 `input` 문자열을 받습니다:

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## 매개변수

- `input` (필수): `*** Begin Patch`와 `*** End Patch`를 포함한 전체 패치 콘텐츠입니다.

## 참고사항

- 경로는 작업 공간 루트를 기준으로 해석됩니다.
- `*** Update File:` 청크 내에서 `*** Move to:`를 사용하여 파일을 이름 변경합니다.
- `*** End of File`은 필요할 때 EOF 전용 삽입을 표시합니다.
- 실험 기능이며 기본적으로 비활성화되어 있습니다. `tools.exec.applyPatch.enabled`로 활성화합니다.
- OpenAI 전용입니다 (OpenAI Codex 포함). 선택적으로 `tools.exec.applyPatch.allowModels`을 통해 모델별로 제한합니다.
- 설정은 `tools.exec` 아래에만 있습니다.

## 예시

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

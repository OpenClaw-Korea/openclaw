---
summary: "`openclaw memory` CLI 참조 (status/index/search)"
read_when:
  - 시맨틱 메모리를 인덱싱하거나 검색하려는 경우
  - 메모리 가용성이나 인덱싱을 디버깅하는 경우
title: "memory"
---

# `openclaw memory`

시맨틱 메모리 인덱싱 및 검색을 관리합니다.
활성 메모리 플러그인에서 제공됩니다(기본값: `memory-core`; 비활성화하려면 `plugins.slots.memory = "none"` 설정).

관련 문서:

- 메모리 개념: [메모리](/ko-KR/concepts/memory)
- 플러그인: [플러그인](/ko-KR/plugins)

## 예제

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory index
openclaw memory index --verbose
openclaw memory search "release checklist"
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## 옵션

공통 옵션:

- `--agent <id>`: 단일 에이전트로 범위 제한 (기본값: 모든 설정된 에이전트).
- `--verbose`: 프로브 및 인덱싱 중 상세 로그 출력.

참고사항:

- `memory status --deep`은 벡터 및 임베딩 가용성을 프로브합니다.
- `memory status --deep --index`는 스토어가 더티 상태일 때 재인덱싱을 실행합니다.
- `memory index --verbose`는 단계별 세부정보(프로바이더, 모델, 소스, 배치 활동)를 출력합니다.
- `memory status`는 `memorySearch.extraPaths`를 통해 설정된 추가 경로를 포함합니다.

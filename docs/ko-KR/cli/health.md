---
summary: "`openclaw health` CLI 참조 (RPC를 통한 게이트웨이 상태 엔드포인트)"
read_when:
  - 실행 중인 게이트웨이의 상태를 빠르게 확인하고 싶을 때
title: "health"
---

# `openclaw health`

실행 중인 게이트웨이에서 상태를 가져옵니다.

```bash
openclaw health
openclaw health --json
openclaw health --verbose
```

참고:

- `--verbose`는 실시간 프로브를 실행하고 여러 계정이 설정된 경우 계정별 타이밍을 출력합니다.
- 출력에는 여러 에이전트가 설정된 경우 에이전트별 세션 저장소가 포함됩니다.

---
summary: "`openclaw logs` CLI 참조 (RPC를 통한 게이트웨이 로그 tail)"
read_when:
  - 원격으로 게이트웨이 로그를 tail해야 하는 경우 (SSH 없이)
  - 도구 처리를 위한 JSON 로그 라인이 필요한 경우
title: "logs"
---

# `openclaw logs`

RPC를 통해 게이트웨이 파일 로그를 tail합니다 (원격 모드에서 작동).

관련 문서:

- 로깅 개요: [로깅](/ko-KR/logging)

## 예제

```bash
openclaw logs
openclaw logs --follow
openclaw logs --json
openclaw logs --limit 500
```

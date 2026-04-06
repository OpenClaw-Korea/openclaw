---
summary: "`openclaw agent` CLI 참조 (게이트웨이를 통해 에이전트 턴 한 번 전송)"
read_when:
  - 스크립트에서 에이전트 턴을 한 번 실행하려는 경우 (선택적으로 답장 전달)
title: "agent"
---

# `openclaw agent`

게이트웨이를 통해 에이전트 턴을 실행합니다(임베디드는 `--local` 사용).
설정된 에이전트를 직접 대상으로 지정하려면 `--agent <id>`를 사용하세요.

관련:

- 에이전트 전송 도구: [에이전트 전송](/tools/agent-send)

## 예제

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```

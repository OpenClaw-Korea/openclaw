---
summary: "게이트웨이 또는 노드 호스트의 `openclaw approvals` (실행 승인 관리) CLI 참조"
read_when:
  - CLI에서 실행 승인을 편집하려고 할 때
  - 게이트웨이 또는 노드 호스트의 허용 목록을 관리해야 할 때
title: "approvals"
---

# `openclaw approvals`

**로컬 호스트**, **게이트웨이 호스트** 또는 **노드 호스트**의 실행 승인을 관리합니다.
기본적으로 명령은 로컬 승인 파일을 대상으로 합니다. `--gateway`를 사용하여 게이트웨이를 대상으로 하거나 `--node`를 사용하여 특정 노드를 대상으로 할 수 있습니다.

관련 항목:

- 실행 승인: [Exec approvals](/tools/exec-approvals)
- 노드: [Nodes](/nodes)

## 공용 명령

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

## 파일에서 승인 대체

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

## 허용 목록 헬퍼

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 참고사항

- `--node`는 `openclaw nodes`와 동일한 리졸버를 사용합니다(ID, 이름, IP 또는 ID 접두사).
- `--agent`의 기본값은 `"*"`이며, 이는 모든 에이전트에 적용됩니다.
- 노드 호스트는 `system.execApprovals.get/set`을 광고해야 합니다(macOS 앱 또는 헤드리스 노드 호스트).
- 승인 파일은 호스트별로 `~/.openclaw/exec-approvals.json`에 저장됩니다.

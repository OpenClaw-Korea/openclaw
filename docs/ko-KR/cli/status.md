---
summary: "`openclaw status` CLI 참조 (진단, 프로브, 사용량 스냅샷)"
read_when:
  - 채널 상태 + 최근 세션 수신자의 빠른 진단을 원할 때
  - 디버깅을 위한 붙여넣기 가능한 "all" 상태를 원할 때
title: "status"
---

# `openclaw status`

채널 + 세션에 대한 진단.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

참고:

- `--deep`는 실시간 프로브를 실행합니다 (WhatsApp Web + Telegram + Discord + Google Chat + Slack + Signal).
- 출력에는 여러 에이전트가 설정된 경우 에이전트별 세션 저장소가 포함됩니다.
- 개요에는 사용 가능한 경우 게이트웨이 + 노드 호스트 서비스 설치/런타임 상태가 포함됩니다.
- 개요에는 업데이트 채널 + git SHA가 포함됩니다 (소스 체크아웃의 경우).
- 업데이트 정보가 개요에 표시됩니다; 업데이트가 사용 가능한 경우 상태가 `openclaw update` 실행 힌트를 출력합니다 ([업데이트](/install/updating)를 참조하세요).

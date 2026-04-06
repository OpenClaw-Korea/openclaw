---
summary: "`openclaw cron` CLI 참조 (백그라운드 작업 예약 및 실행)"
read_when:
  - 예약 작업 및 웨이크업을 사용하고 싶을 때
  - cron 실행 및 로그를 디버깅할 때
title: "cron"
---

# `openclaw cron`

게이트웨이 스케줄러의 cron 작업을 관리합니다.

관련 문서:

- Cron 작업: [Cron 작업](/automation/cron-jobs)

팁: 전체 명령어 목록을 보려면 `openclaw cron --help`를 실행하세요.

## 일반적인 수정

메시지를 변경하지 않고 전달 설정만 업데이트:

```bash
openclaw cron edit <job-id> --deliver --channel telegram --to "123456789"
```

격리된 작업의 전달 비활성화:

```bash
openclaw cron edit <job-id> --no-deliver
```

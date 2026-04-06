---
summary: "`openclaw doctor` CLI 참조 (상태 검사 + 가이드 복구)"
read_when:
  - 연결/인증 문제가 있고 가이드 수정이 필요한 경우
  - 업데이트 후 정상 작동 확인이 필요한 경우
title: "doctor"
---

# `openclaw doctor`

게이트웨이 및 채널에 대한 상태 검사 및 빠른 수정을 제공합니다.

관련 문서:

- 문제 해결: [문제 해결](/ko-KR/gateway/troubleshooting)
- 보안 감사: [보안](/ko-KR/gateway/security)

## 예제

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
```

참고사항:

- 대화형 프롬프트(키체인/OAuth 수정 등)는 stdin이 TTY이고 `--non-interactive`가 설정되지 **않은** 경우에만 실행됩니다. 헤드리스 실행(cron, Telegram, 터미널 없음)은 프롬프트를 건너뜁니다.
- `--fix`(`--repair`의 별칭)는 `~/.openclaw/openclaw.json.bak`에 백업을 작성하고 알 수 없는 설정 키를 제거하며, 각 제거 항목을 나열합니다.

## macOS: `launchctl` env 오버라이드

이전에 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`(또는 `...PASSWORD`)을 실행한 경우, 해당 값이 설정 파일을 오버라이드하여 지속적인 "unauthorized" 오류를 발생시킬 수 있습니다.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

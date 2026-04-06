---
summary: "모델 프로바이더에 대한 OAuth 만료 모니터링"
read_when:
  - 인증 만료 모니터링 또는 알림 설정
  - Claude Code / Codex OAuth 새로 고침 확인 자동화
title: "인증 모니터링"
---

# 인증 모니터링

OpenClaw는 `openclaw models status`를 통해 OAuth 만료 상태를 노출합니다. 자동화 및 알림에 이를 사용하세요; 스크립트는 전화 워크플로를 위한 선택적 추가 기능입니다.

## 권장: CLI 확인 (이식 가능)

```bash
openclaw models status --check
```

종료 코드:

- `0`: 정상
- `1`: 만료되었거나 누락된 자격 증명
- `2`: 곧 만료 (24시간 이내)

이는 cron/systemd에서 작동하며 추가 스크립트가 필요하지 않습니다.

## 선택적 스크립트 (운영 / 전화 워크플로)

이들은 `scripts/` 아래에 있으며 **선택 사항**입니다. 게이트웨이 호스트에 대한 SSH 액세스를 가정하며 systemd + Termux에 맞춰져 있습니다.

- `scripts/claude-auth-status.sh`는 이제 `openclaw models status --json`을 진실의 소스로 사용합니다 (CLI를 사용할 수 없는 경우 직접 파일 읽기로 폴백),
  따라서 타이머를 위해 `openclaw`를 `PATH`에 유지하세요.
- `scripts/auth-monitor.sh`: cron/systemd 타이머 대상; 알림 (ntfy 또는 전화)을 보냅니다.
- `scripts/systemd/openclaw-auth-monitor.{service,timer}`: systemd 사용자 타이머.
- `scripts/claude-auth-status.sh`: Claude Code + OpenClaw 인증 검사기 (전체/json/간단).
- `scripts/mobile-reauth.sh`: SSH를 통한 가이드 재인증 흐름.
- `scripts/termux-quick-auth.sh`: 원탭 위젯 상태 + 인증 URL 열기.
- `scripts/termux-auth-widget.sh`: 전체 가이드 위젯 흐름.
- `scripts/termux-sync-widget.sh`: Claude Code 자격 증명 → OpenClaw 동기화.

전화 자동화 또는 systemd 타이머가 필요하지 않은 경우 이러한 스크립트를 건너뛰세요.

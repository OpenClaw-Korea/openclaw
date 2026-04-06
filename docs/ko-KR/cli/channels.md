---
summary: "`openclaw channels` CLI 참조 (계정, 상태, 로그인/로그아웃, 로그)"
read_when:
  - 채널 계정 추가/제거를 원하는 경우 (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (플러그인)/Signal/iMessage)
  - 채널 상태를 확인하거나 채널 로그를 확인하려는 경우
title: "channels"
---

# `openclaw channels`

게이트웨이에서 채팅 채널 계정 및 런타임 상태를 관리합니다.

관련 문서:

- 채널 가이드: [채널](/channels/index)
- 게이트웨이 설정: [설정](/gateway/configuration)

## 주요 명령어

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## 계정 추가 / 제거

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels remove --channel telegram --delete
```

팁: `openclaw channels add --help`는 채널별 플래그(토큰, 앱 토큰, signal-cli 경로 등)를 표시합니다.

## 로그인 / 로그아웃 (대화형)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

## 문제 해결

- 광범위한 프로브를 위해 `openclaw status --deep`을 실행하세요.
- 가이드 수정을 위해 `openclaw doctor`를 사용하세요.
- `openclaw channels list`가 `Claude: HTTP 403 ... user:profile`를 출력하는 경우 → 사용량 스냅샷에 `user:profile` 범위가 필요합니다. `--no-usage`를 사용하거나, claude.ai 세션 키(`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`)를 제공하거나, Claude Code CLI를 통해 재인증하세요.

## 기능 프로브

프로바이더 기능 힌트(사용 가능한 경우 의도/범위) 및 정적 기능 지원을 가져옵니다.

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

참고사항:

- `--channel`은 선택사항입니다. 생략하면 모든 채널(확장 포함)을 나열합니다.
- `--target`은 `channel:<id>` 또는 원시 숫자 채널 ID를 허용하며 Discord에만 적용됩니다.
- 프로브는 프로바이더별로 다릅니다: Discord 의도 + 선택적 채널 권한, Slack 봇 + 사용자 범위, Telegram 봇 플래그 + 웹훅, Signal 데몬 버전, MS Teams 앱 토큰 + Graph 역할/범위(알려진 경우 주석 처리). 프로브가 없는 채널은 `Probe: unavailable`을 보고합니다.

## 이름을 ID로 확인

프로바이더 디렉터리를 사용하여 채널/사용자 이름을 ID로 확인합니다.

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

참고사항:

- `--kind user|group|auto`를 사용하여 대상 유형을 강제 지정합니다.
- 여러 항목이 동일한 이름을 공유하는 경우 활성 일치 항목이 우선됩니다.

---
summary: "원격 게이트웨이에 연결하는 OpenClaw.app용 SSH 터널 설정"
read_when: "macOS 앱을 원격 게이트웨이에 SSH를 통해 연결할 때"
title: "원격 게이트웨이 설정"
---

# 원격 게이트웨이를 사용한 OpenClaw.app 실행하기

OpenClaw.app은 SSH 터널링을 사용하여 원격 게이트웨이에 연결합니다. 이 가이드에서는 설정 방법을 보여드립니다.

## 개요

```
┌─────────────────────────────────────────────────────────────┐
│                     클라이언트 머신                             │
│                                                              │
│  OpenClaw.app ──► ws://127.0.0.1:18789 (로컬 포트)            │
│                     │                                        │
│                     ▼                                        │
│  SSH 터널 ──────────────────────────────────────────────────│
│                     │                                        │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     원격 머신                                 │
│                                                              │
│  게이트웨이 WebSocket ──► ws://127.0.0.1:18789 ──►           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 빠른 설정

### 단계 1: SSH 설정 추가

`~/.ssh/config`를 편집하여 다음을 추가합니다:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>          # 예: 172.27.187.184
    User <REMOTE_USER>            # 예: jefferson
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>`와 `<REMOTE_USER>`를 실제 값으로 바꿉니다.

### 단계 2: SSH 키 복사

공개 키를 원격 머신으로 복사합니다 (한 번 비밀번호 입력):

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

### 단계 3: 게이트웨이 토큰 설정

```bash
launchctl setenv OPENCLAW_GATEWAY_TOKEN "<your-token>"
```

### 단계 4: SSH 터널 시작

```bash
ssh -N remote-gateway &
```

### 단계 5: OpenClaw.app 재시작

```bash
# OpenClaw.app을 종료한 후 (⌘Q), 다시 열기:
open /path/to/OpenClaw.app
```

이제 앱이 SSH 터널을 통해 원격 게이트웨이에 연결됩니다.

---

## 로그인 시 터널 자동 시작

SSH 터널이 로그인할 때 자동으로 시작되도록 하려면 Launch Agent를 생성합니다.

### PLIST 파일 생성

`~/Library/LaunchAgents/bot.molt.ssh-tunnel.plist`로 다음을 저장합니다:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>bot.molt.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

### Launch Agent 로드

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/bot.molt.ssh-tunnel.plist
```

이제 터널은 다음과 같이 작동합니다:

- 로그인할 때 자동으로 시작
- 충돌 시 자동 재시작
- 백그라운드에서 계속 실행

레거시 참고: 남아있는 `com.openclaw.ssh-tunnel` LaunchAgent가 있다면 제거합니다.

---

## 문제 해결

**터널이 실행 중인지 확인:**

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

**터널 재시작:**

```bash
launchctl kickstart -k gui/$UID/bot.molt.ssh-tunnel
```

**터널 중지:**

```bash
launchctl bootout gui/$UID/bot.molt.ssh-tunnel
```

---

## 작동 원리

| 구성 요소                            | 기능                                           |
| ------------------------------------ | ---------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | 로컬 포트 18789를 원격 포트 18789로 포워딩     |
| `ssh -N`                             | 원격 명령어 실행 없이 SSH 실행 (포트 포워딩만) |
| `KeepAlive`                          | 터널이 충돌하면 자동 재시작                    |
| `RunAtLoad`                          | 에이전트 로드 시 터널 시작                     |

OpenClaw.app은 클라이언트 머신의 `ws://127.0.0.1:18789`에 연결합니다. SSH 터널이 그 연결을 게이트웨이가 실행 중인 원격 머신의 포트 18789로 포워딩합니다.

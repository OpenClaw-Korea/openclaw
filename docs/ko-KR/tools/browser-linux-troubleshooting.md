---
summary: "Linux에서 OpenClaw 브라우저 제어를 위한 Chrome/Brave/Edge/Chromium CDP 시작 문제 해결"
read_when: "Linux에서 브라우저 제어가 실패할 때, 특히 snap Chromium 사용 시"
title: "브라우저 문제 해결"
---

# 브라우저 문제 해결 (Linux)

## 문제: "Failed to start Chrome CDP on port 18800"

OpenClaw의 브라우저 제어 서버가 Chrome/Brave/Edge/Chromium을 시작하지 못하고 다음 오류가 발생합니다:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### 근본 원인

Ubuntu 및 많은 Linux 배포판에서, 기본 Chromium 설치는 **snap 패키지**입니다. Snap의 AppArmor 격리가 OpenClaw가 브라우저 프로세스를 생성하고 모니터링하는 방식과 충돌합니다.

`apt install chromium` 명령은 snap으로 리디렉션하는 스텁 패키지를 설치합니다:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

이것은 실제 브라우저가 아닙니다 — 단순한 래퍼일 뿐입니다.

### 해결책 1: Google Chrome 설치 (권장)

snap으로 샌드박싱되지 않은 공식 Google Chrome `.deb` 패키지를 설치합니다:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # 의존성 오류가 있을 경우
```

그런 다음 OpenClaw 설정을 업데이트합니다 (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### 해결책 2: 첨부 전용 모드로 Snap Chromium 사용

snap Chromium을 사용해야 하는 경우, OpenClaw를 수동으로 시작한 브라우저에 첨부하도록 설정합니다:

1. 설정 업데이트:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Chromium을 수동으로 시작합니다:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. 선택적으로 Chrome을 자동 시작하는 systemd 사용자 서비스를 만듭니다:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

다음 명령으로 활성화합니다: `systemctl --user enable --now openclaw-browser.service`

### 브라우저가 작동하는지 확인

상태를 확인합니다:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

브라우징을 테스트합니다:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### 설정 참조

| 옵션                     | 설명                                                                | 기본값                                       |
| ------------------------ | ------------------------------------------------------------------- | -------------------------------------------- |
| `browser.enabled`        | 브라우저 제어 활성화                                                | `true`                                       |
| `browser.executablePath` | Chromium 기반 브라우저 바이너리의 경로 (Chrome/Brave/Edge/Chromium) | 자동 감지 (Chromium 기반 기본 브라우저 선호) |
| `browser.headless`       | GUI 없이 실행                                                       | `false`                                      |
| `browser.noSandbox`      | `--no-sandbox` 플래그 추가 (일부 Linux 설정에서 필요)               | `false`                                      |
| `browser.attachOnly`     | 브라우저를 시작하지 않고 기존 브라우저에만 첨부                     | `false`                                      |
| `browser.cdpPort`        | Chrome DevTools Protocol 포트                                       | `18800`                                      |

### 문제: "Chrome extension relay is running, but no tab is connected"

`chrome` 프로필(확장 프로그램 릴레이)을 사용하고 있습니다. OpenClaw 브라우저 확장 프로그램이 활성 탭에 첨부되어 있을 것으로 예상합니다.

해결 옵션:

1. **관리형 브라우저 사용:** `openclaw browser start --browser-profile openclaw`
   (또는 `browser.defaultProfile: "openclaw"`를 설정합니다).
2. **확장 프로그램 릴레이 사용:** 확장 프로그램을 설치하고, 탭을 열고, OpenClaw 확장 프로그램 아이콘을 클릭하여 첨부합니다.

참고사항:

- `chrome` 프로필은 가능할 때 **시스템 기본 Chromium 브라우저**를 사용합니다.
- 로컬 `openclaw` 프로필은 `cdpPort`/`cdpUrl`을 자동 할당합니다. 원격 CDP의 경우에만 이들을 설정합니다.

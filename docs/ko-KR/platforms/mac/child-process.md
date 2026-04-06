---
summary: "macOS의 게이트웨이 생명주기 (launchd)"
read_when:
  - Mac 앱과 게이트웨이 생명주기 통합
title: "게이트웨이 생명주기"
---

# macOS의 게이트웨이 생명주기

macOS 앱은 **launchd를 통해 게이트웨이를 관리하며** 기본적으로 게이트웨이를 자식 프로세스로 생성하지 않습니다. 먼저 설정된 포트에서 이미 실행 중인 게이트웨이에 연결을 시도합니다. 연결 가능한 게이트웨이가 없으면 외부 `openclaw` CLI를 통해 launchd 서비스를 활성화합니다 (포함된 런타임 없음). 이를 통해 로그인 시 안정적인 자동 시작과 충돌 시 재시작 기능을 제공합니다.

자식 프로세스 모드 (앱에서 직접 생성한 게이트웨이)는 **현재 사용되지 않습니다**. UI와 더 긴밀한 연결이 필요하면 터미널에서 게이트웨이를 수동으로 실행하세요.

## 기본 동작 (launchd)

- 앱은 `bot.molt.gateway`로 레이블이 지정된 사용자별 LaunchAgent를 설치합니다.
  (`--profile`/`OPENCLAW_PROFILE` 사용 시 `bot.molt.<profile>`; 레거시 `com.openclaw.*` 지원).
- 로컬 모드가 활성화되면, 앱은 LaunchAgent가 로드되고 필요 시 게이트웨이를 시작하도록 합니다.
- 로그는 launchd 게이트웨이 로그 경로에 작성됩니다 (디버그 설정에서 확인 가능).

일반적인 명령:

```bash
launchctl kickstart -k gui/$UID/bot.molt.gateway
launchctl bootout gui/$UID/bot.molt.gateway
```

명명된 프로필을 실행 중일 때는 레이블을 `bot.molt.<profile>`로 바꾸세요.

## 서명되지 않은 개발 빌드

`scripts/restart-mac.sh --no-sign`은 서명 키가 없을 때 빠른 로컬 빌드용입니다. launchd가 서명되지 않은 릴레이 바이너리를 가리키지 않도록 하기 위해:

- `~/.openclaw/disable-launchagent`를 작성합니다.

`scripts/restart-mac.sh`의 서명된 실행은 마커가 있으면 이 재정의를 지웁니다. 수동으로 재설정하려면:

```bash
rm ~/.openclaw/disable-launchagent
```

## 첨부 전용 모드

macOS 앱이 **launchd를 설치하거나 관리하지 않도록** 강제하려면 `--attach-only` (또는 `--no-launchd`) 옵션으로 시작하세요. 이렇게 하면 `~/.openclaw/disable-launchagent`가 설정되므로, 앱은 이미 실행 중인 게이트웨이에만 연결합니다. 디버그 설정에서 동일한 동작을 전환할 수 있습니다.

## 원격 모드

원격 모드는 로컬 게이트웨이를 시작하지 않습니다. 앱은 원격 호스트로의 SSH 터널을 사용하고 그 터널을 통해 연결합니다.

## launchd를 선호하는 이유

- 로그인 시 자동 시작.
- 기본 제공 재시작/KeepAlive 의미론.
- 예측 가능한 로그 및 감독.

진정한 자식 프로세스 모드가 다시 필요한 경우, 이를 별도의 명시적 개발 전용 모드로 문서화해야 합니다.

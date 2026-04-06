---
summary: "OpenClaw 안전하게 업데이트하기 (글로벌 설치 또는 소스), 롤백 전략 포함"
read_when:
  - OpenClaw 업데이트 시
  - 업데이트 후 문제가 발생하는 경우
title: "업데이트"
---

# 업데이트

OpenClaw는 빠르게 발전하고 있습니다 ("1.0" 이전). 업데이트는 인프라 배포처럼 처리하세요: 업데이트 → 확인 실행 → 재시작 (또는 자동 재시작하는 `openclaw update` 사용) → 검증.

## 권장: 웹사이트 설치 프로그램 재실행 (현재 위치에서 업그레이드)

**권장** 업데이트 방법은 웹사이트 설치 프로그램을 재실행하는 것입니다. 기존 설치를 감지하고, 현재 위치에서 업그레이드하며, 필요 시 `openclaw doctor`를 실행합니다.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

참고사항:

- 온보딩 마법사를 다시 실행하지 않으려면 `--no-onboard`를 추가하세요.
- **소스 설치**의 경우:
  ```bash
  curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --no-onboard
  ```
  설치 프로그램은 레포지토리가 깨끗한 경우에만 `git pull --rebase`를 실행합니다.
- **글로벌 설치**의 경우, 스크립트는 내부적으로 `npm install -g openclaw@latest`를 사용합니다.
- 레거시 참고사항: `clawdbot`은 호환성 심(shim)으로 계속 사용 가능합니다.

## 업데이트 전

- 설치 방법 확인: **글로벌** (npm/pnpm) vs **소스에서** (git clone).
- 게이트웨이 실행 방법 확인: **포그라운드 터미널** vs **관리형 서비스** (launchd/systemd).
- 사용자 정의 내용 스냅샷:
  - 설정: `~/.openclaw/openclaw.json`
  - 자격 증명: `~/.openclaw/credentials/`
  - 워크스페이스: `~/.openclaw/workspace`

## 업데이트 (글로벌 설치)

글로벌 설치 (하나 선택):

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

게이트웨이 런타임으로 Bun은 권장하지 **않습니다** (WhatsApp/Telegram 버그).

업데이트 채널 전환 (git + npm 설치):

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --channel stable
```

일회성 설치 태그/버전에는 `--tag <dist-tag|version>`을 사용하세요.

채널 의미 및 릴리스 노트는 [개발 채널](/ko-KR/install/development-channels)을 참조하세요.

참고: npm 설치에서는 게이트웨이가 시작 시 업데이트 힌트를 로깅합니다 (현재 채널 태그 확인). `update.checkOnStart: false`로 비활성화할 수 있습니다.

그 다음:

```bash
openclaw doctor
openclaw gateway restart
openclaw health
```

참고사항:

- 게이트웨이가 서비스로 실행되는 경우, PID를 종료하는 것보다 `openclaw gateway restart`가 선호됩니다.
- 특정 버전에 고정한 경우, 아래 "롤백 / 고정"을 참조하세요.

## 업데이트 (`openclaw update`)

**소스 설치** (git 체크아웃)의 경우 다음을 선호합니다:

```bash
openclaw update
```

안전한 업데이트 플로우를 실행합니다:

- 깨끗한 작업 트리 필요.
- 선택한 채널(태그 또는 브랜치)로 전환.
- 설정된 업스트림에 대해 fetch + rebase (dev 채널).
- 의존성 설치, 빌드, 컨트롤 UI 빌드, `openclaw doctor` 실행.
- 기본적으로 게이트웨이 재시작 (`--no-restart`로 건너뛰기).

**npm/pnpm**으로 설치한 경우 (git 메타데이터 없음), `openclaw update`는 패키지 관리자를 통해 업데이트를 시도합니다. 설치를 감지할 수 없는 경우, "업데이트 (글로벌 설치)"를 대신 사용하세요.

## 업데이트 (컨트롤 UI / RPC)

컨트롤 UI에는 **Update & Restart** (RPC: `update.run`)가 있습니다. 다음을 수행합니다:

1. `openclaw update`와 동일한 소스 업데이트 플로우 실행 (git 체크아웃만).
2. 구조화된 보고서(stdout/stderr 테일)와 함께 재시작 센티널 작성.
3. 게이트웨이를 재시작하고 마지막 활성 세션에 보고서 전송.

리베이스가 실패하면 게이트웨이는 업데이트를 적용하지 않고 중단 및 재시작합니다.

## 업데이트 (소스에서)

레포지토리 체크아웃에서:

권장:

```bash
openclaw update
```

수동 (동등함):

```bash
git pull
pnpm install
pnpm build
pnpm ui:build # 첫 실행 시 UI 의존성 자동 설치
openclaw doctor
openclaw health
```

참고사항:

- `pnpm build`는 패키지된 `openclaw` 바이너리 ([`openclaw.mjs`](https://github.com/openclaw/openclaw/blob/main/openclaw.mjs))를 실행하거나 Node로 `dist/`를 실행할 때 중요합니다.
- 글로벌 설치 없이 레포지토리 체크아웃에서 실행하는 경우, CLI 명령에 `pnpm openclaw ...`를 사용하세요.
- TypeScript에서 직접 실행하는 경우 (`pnpm openclaw ...`), 일반적으로 재빌드가 필요하지 않지만 **설정 마이그레이션은 여전히 적용됨** → doctor 실행.
- 글로벌 설치와 git 설치 간 전환은 쉽습니다: 다른 방식을 설치한 다음 `openclaw doctor`를 실행하여 게이트웨이 서비스 진입점이 현재 설치로 다시 작성되도록 합니다.

## 항상 실행: `openclaw doctor`

Doctor는 "안전한 업데이트" 명령입니다. 의도적으로 단순합니다: 복구 + 마이그레이션 + 경고.

참고: **소스 설치** (git 체크아웃)인 경우, `openclaw doctor`는 먼저 `openclaw update`를 실행할 것을 제안합니다.

일반적으로 수행하는 작업:

- 사용되지 않는 설정 키 / 레거시 설정 파일 위치 마이그레이션.
- DM 정책 감사 및 위험한 "열린" 설정 경고.
- 게이트웨이 상태 확인 및 재시작 제안 가능.
- 이전 게이트웨이 서비스(launchd/systemd; 레거시 schtasks)를 현재 OpenClaw 서비스로 감지 및 마이그레이션.
- Linux에서 systemd 사용자 lingering 보장 (게이트웨이가 로그아웃 후에도 유지됨).

자세한 내용: [Doctor](/ko-KR/gateway/doctor)

## 게이트웨이 시작 / 중지 / 재시작

CLI (OS에 관계없이 작동):

```bash
openclaw gateway status
openclaw gateway stop
openclaw gateway restart
openclaw gateway --port 18789
openclaw logs --follow
```

관리형 서비스인 경우:

- macOS launchd (앱 번들 LaunchAgent): `launchctl kickstart -k gui/$UID/bot.molt.gateway` (`bot.molt.<profile>` 사용; 레거시 `com.openclaw.*`도 여전히 작동)
- Linux systemd 사용자 서비스: `systemctl --user restart openclaw-gateway[-<profile>].service`
- Windows (WSL2): `systemctl --user restart openclaw-gateway[-<profile>].service`
  - `launchctl`/`systemctl`은 서비스가 설치된 경우에만 작동합니다; 그렇지 않으면 `openclaw gateway install`을 실행하세요.

런북 + 정확한 서비스 레이블: [게이트웨이 런북](/ko-KR/gateway)

## 롤백 / 고정 (문제 발생 시)

### 고정 (글로벌 설치)

알려진 정상 버전 설치 (`<version>`을 마지막 작동 버전으로 변경):

```bash
npm i -g openclaw@<version>
```

```bash
pnpm add -g openclaw@<version>
```

팁: 현재 게시된 버전을 확인하려면 `npm view openclaw version`을 실행하세요.

그 다음 재시작 + doctor 재실행:

```bash
openclaw doctor
openclaw gateway restart
```

### 날짜별 고정 (소스)

날짜에서 커밋 선택 (예: "2026-01-01 기준 main 상태"):

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
```

그 다음 의존성 재설치 + 재시작:

```bash
pnpm install
pnpm build
openclaw gateway restart
```

나중에 최신 버전으로 돌아가려면:

```bash
git checkout main
git pull
```

## 문제가 발생한 경우

- `openclaw doctor`를 다시 실행하고 출력을 주의 깊게 읽으세요 (종종 수정 방법을 알려줍니다).
- 확인: [문제 해결](/ko-KR/gateway/troubleshooting)
- Discord에 문의: https://discord.gg/clawd

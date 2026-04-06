---
summary: "설치 스크립트의 작동 방식 (install.sh + install-cli.sh), 플래그, 자동화"
read_when:
  - `openclaw.ai/install.sh`를 이해하고 싶을 때
  - 설치를 자동화하고 싶을 때 (CI / 헤드리스)
  - GitHub 체크아웃에서 설치하고 싶을 때
title: "설치 스크립트 내부 구조"
---

# 설치 스크립트 내부 구조

OpenClaw는 두 가지 설치 스크립트를 제공합니다 (`openclaw.ai`에서 제공):

- `https://openclaw.ai/install.sh` — "권장" 설치 프로그램 (기본적으로 글로벌 npm 설치; GitHub 체크아웃에서도 설치 가능)
- `https://openclaw.ai/install-cli.sh` — non-root 친화적인 CLI 설치 프로그램 (자체 Node가 포함된 prefix에 설치)
- `https://openclaw.ai/install.ps1` — Windows PowerShell 설치 프로그램 (기본적으로 npm; 선택적 git 설치)

현재 플래그/동작을 보려면 다음을 실행하세요:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --help
```

Windows (PowerShell) 도움말:

```powershell
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -?
```

설치 프로그램이 완료되었지만 새 터미널에서 `openclaw`를 찾을 수 없는 경우, 일반적으로 Node/npm PATH 문제입니다. 참조: [설치](/ko-KR/install#nodejs--npm-path-sanity).

## install.sh (권장)

수행하는 작업 (상위 수준):

- OS 감지 (macOS / Linux / WSL).
- Node.js **22+** 확인 (macOS는 Homebrew 사용; Linux는 NodeSource 사용).
- 설치 방법 선택:
  - `npm` (기본값): `npm install -g openclaw@latest`
  - `git`: 소스 체크아웃을 클론/빌드하고 래퍼 스크립트 설치
- Linux에서: 필요할 때 npm의 prefix를 `~/.npm-global`로 전환하여 글로벌 npm 권한 오류 방지.
- 기존 설치를 업그레이드하는 경우: `openclaw doctor --non-interactive` 실행 (최선의 노력).
- git 설치의 경우: 설치/업데이트 후 `openclaw doctor --non-interactive` 실행 (최선의 노력).
- `SHARP_IGNORE_GLOBAL_LIBVIPS=1`을 기본값으로 설정하여 `sharp` 네이티브 설치 문제 완화 (시스템 libvips에 대한 빌드 방지).

시스템에 전역 설치된 libvips에 대해 `sharp`를 링크하고 싶거나 디버깅하는 경우 다음을 설정하세요:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL https://openclaw.ai/install.sh | bash
```

### 검색 가능성 / "git 설치" 프롬프트

OpenClaw 소스 체크아웃 내부에서 설치 프로그램을 실행하는 경우 (`package.json` + `pnpm-workspace.yaml`로 감지), 다음을 프롬프트합니다:

- 이 체크아웃을 업데이트하고 사용 (`git`)
- 또는 글로벌 npm 설치로 마이그레이션 (`npm`)

비대화형 컨텍스트 (TTY 없음 / `--no-prompt`)에서는 `--install-method git|npm`을 전달해야 합니다 (또는 `OPENCLAW_INSTALL_METHOD` 설정), 그렇지 않으면 스크립트가 코드 `2`로 종료됩니다.

### Git이 필요한 이유

Git은 `--install-method git` 경로 (clone / pull)에 필요합니다.

`npm` 설치의 경우, Git은 _일반적으로_ 필요하지 않지만, 일부 환경에서는 여전히 필요할 수 있습니다 (예: 패키지 또는 의존성이 git URL을 통해 가져오는 경우). 설치 프로그램은 현재 Git이 있는지 확인하여 새 배포판에서 `spawn git ENOENT` 놀람을 방지합니다.

### 새 Linux에서 npm이 `EACCES`를 발생시키는 이유

일부 Linux 설정 (특히 시스템 패키지 관리자 또는 NodeSource를 통해 Node를 설치한 후)에서는 npm의 글로벌 prefix가 루트 소유 위치를 가리킵니다. 그러면 `npm install -g ...`가 `EACCES` / `mkdir` 권한 오류로 실패합니다.

`install.sh`는 prefix를 다음으로 전환하여 이 문제를 완화합니다:

- `~/.npm-global` (그리고 존재하는 경우 `~/.bashrc` / `~/.zshrc`의 `PATH`에 추가)

## install-cli.sh (non-root CLI 설치 프로그램)

이 스크립트는 `openclaw`를 prefix (기본값: `~/.openclaw`)에 설치하고 해당 prefix 아래에 전용 Node 런타임도 설치하므로 시스템 Node/npm을 건드리고 싶지 않은 머신에서 작동할 수 있습니다.

도움말:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash -s -- --help
```

## install.ps1 (Windows PowerShell)

수행하는 작업 (상위 수준):

- Node.js **22+** 확인 (winget/Chocolatey/Scoop 또는 수동).
- 설치 방법 선택:
  - `npm` (기본값): `npm install -g openclaw@latest`
  - `git`: 소스 체크아웃을 클론/빌드하고 래퍼 스크립트 설치
- 업그레이드 및 git 설치 시 `openclaw doctor --non-interactive` 실행 (최선의 노력).

예제:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex -InstallMethod git
```

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex -InstallMethod git -GitDir "C:\\openclaw"
```

환경 변수:

- `OPENCLAW_INSTALL_METHOD=git|npm`
- `OPENCLAW_GIT_DIR=...`

Git 요구사항:

`-InstallMethod git`을 선택하고 Git이 없는 경우, 설치 프로그램은 Git for Windows 링크 (`https://git-scm.com/download/win`)를 출력하고 종료합니다.

일반적인 Windows 문제:

- **npm error spawn git / ENOENT**: Git for Windows를 설치하고 PowerShell을 다시 연 다음 설치 프로그램을 다시 실행하세요.
- **"openclaw"가 인식되지 않습니다**: npm 글로벌 bin 폴더가 PATH에 없습니다. 대부분의 시스템은 `%AppData%\\npm`을 사용합니다. `npm config get prefix`를 실행하고 `\\bin`을 PATH에 추가한 다음 PowerShell을 다시 열 수도 있습니다.

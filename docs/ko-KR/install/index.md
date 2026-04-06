---
summary: "OpenClaw 설치 (권장 설치 스크립트, 글로벌 설치, 소스에서 빌드)"
read_when:
  - OpenClaw 설치 시
  - GitHub에서 설치하려는 경우
title: "설치"
---

# 설치

특별한 이유가 없다면 설치 스크립트를 사용하세요. CLI를 설정하고 온보딩을 실행합니다.

## 빠른 설치 (권장)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Windows (PowerShell):

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

다음 단계 (온보딩을 건너뛴 경우):

```bash
openclaw onboard --install-daemon
```

## 시스템 요구사항

- **Node >=22**
- macOS, Linux 또는 WSL2를 통한 Windows
- 소스에서 빌드하는 경우에만 `pnpm` 필요

## 설치 방법 선택

### 1) 설치 스크립트 (권장)

npm을 통해 `openclaw`를 전역 설치하고 온보딩을 실행합니다.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

설치 스크립트 플래그:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --help
```

자세한 내용: [설치 스크립트 내부 구조](/ko-KR/install/installer)

비대화형 모드 (온보딩 건너뛰기):

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
```

### 2) 글로벌 설치 (수동)

Node가 이미 설치되어 있다면:

```bash
npm install -g openclaw@latest
```

macOS에서 Homebrew를 통해 libvips가 전역 설치되어 있고 `sharp` 설치가 실패하는 경우, 사전 빌드된 바이너리를 강제 사용하세요:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

`sharp: Please add node-gyp to your dependencies` 오류가 나타나면, 빌드 도구를 설치하거나 (macOS: Xcode CLT + `npm install -g node-gyp`) 위의 `SHARP_IGNORE_GLOBAL_LIBVIPS=1` 해결책을 사용하세요.

또는 pnpm 사용:

```bash
pnpm add -g openclaw@latest
pnpm approve-builds -g                # openclaw, node-llama-cpp, sharp 등 승인
```

pnpm은 빌드 스크립트가 있는 패키지에 대해 명시적 승인이 필요합니다. 첫 설치 후 "Ignored build scripts" 경고가 표시되면 `pnpm approve-builds -g`를 실행하고 나열된 패키지를 선택하세요.

그 다음:

```bash
openclaw onboard --install-daemon
```

### 3) 소스에서 빌드 (기여자/개발용)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # 첫 실행 시 UI 의존성 자동 설치
pnpm build
openclaw onboard --install-daemon
```

팁: 전역 설치가 없다면 `pnpm openclaw ...`로 레포지토리 명령을 실행하세요.

### 4) 기타 설치 옵션

- Docker: [Docker](/ko-KR/install/docker)
- Nix: [Nix](/ko-KR/install/nix)
- Ansible: [Ansible](/ko-KR/install/ansible)
- Bun (CLI 전용): [Bun](/ko-KR/install/bun)

## 설치 후

- 온보딩 실행: `openclaw onboard --install-daemon`
- 빠른 확인: `openclaw doctor`
- 게이트웨이 상태 확인: `openclaw status` + `openclaw health`
- 대시보드 열기: `openclaw dashboard`

## 설치 방법: npm vs git (설치 스크립트)

설치 스크립트는 두 가지 방법을 지원합니다:

- `npm` (기본값): `npm install -g openclaw@latest`
- `git`: GitHub에서 클론/빌드하여 소스 체크아웃에서 실행

### CLI 플래그

```bash
# 명시적 npm
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm

# GitHub에서 설치 (소스 체크아웃)
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

주요 플래그:

- `--install-method npm|git`
- `--git-dir <path>` (기본값: `~/openclaw`)
- `--no-git-update` (기존 체크아웃 사용 시 `git pull` 건너뛰기)
- `--no-prompt` (프롬프트 비활성화; CI/자동화에 필요)
- `--dry-run` (실행 내용만 출력; 변경 없음)
- `--no-onboard` (온보딩 건너뛰기)

### 환경 변수

동등한 환경 변수 (자동화에 유용):

- `OPENCLAW_INSTALL_METHOD=git|npm`
- `OPENCLAW_GIT_DIR=...`
- `OPENCLAW_GIT_UPDATE=0|1`
- `OPENCLAW_NO_PROMPT=1`
- `OPENCLAW_DRY_RUN=1`
- `OPENCLAW_NO_ONBOARD=1`
- `SHARP_IGNORE_GLOBAL_LIBVIPS=0|1` (기본값: `1`; `sharp`가 시스템 libvips에 대해 빌드하는 것 방지)

## 문제 해결: `openclaw`를 찾을 수 없음 (PATH)

빠른 진단:

```bash
node -v
npm -v
npm prefix -g
echo "$PATH"
```

`$(npm prefix -g)/bin` (macOS/Linux) 또는 `$(npm prefix -g)` (Windows)가 `echo "$PATH"` 출력에 **없다면**, 쉘이 전역 npm 바이너리 (`openclaw` 포함)를 찾을 수 없습니다.

해결: 쉘 시작 파일에 추가하세요 (zsh: `~/.zshrc`, bash: `~/.bashrc`):

```bash
# macOS / Linux
export PATH="$(npm prefix -g)/bin:$PATH"
```

Windows에서는 `npm prefix -g` 출력을 PATH에 추가하세요.

그 다음 새 터미널을 열거나 (zsh에서 `rehash` / bash에서 `hash -r`).

## 업데이트 / 제거

- 업데이트: [업데이트](/ko-KR/install/updating)
- 새 머신으로 마이그레이션: [마이그레이션](/ko-KR/install/migrating)
- 제거: [제거](/ko-KR/install/uninstall)

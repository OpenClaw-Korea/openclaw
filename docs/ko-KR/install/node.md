---
title: "Node.js + npm (PATH 검증)"
summary: "Node.js + npm 설치 검증: 버전, PATH, 글로벌 설치"
read_when:
  - 'OpenClaw를 설치했지만 `openclaw`가 "command not found" 오류를 표시하는 경우'
  - "새 머신에 Node.js/npm을 설정하는 경우"
  - "npm install -g ... 명령이 권한 또는 PATH 문제로 실패하는 경우"
---

# Node.js + npm (PATH 검증)

OpenClaw의 런타임 기준은 **Node 22+**입니다.

`npm install -g openclaw@latest`를 실행할 수 있지만 이후 `openclaw: command not found` 오류가 표시되는 경우, 거의 항상 **PATH** 문제입니다: npm이 글로벌 바이너리를 저장하는 디렉토리가 쉘의 PATH에 없습니다.

## 빠른 진단

다음을 실행하세요:

```bash
node -v
npm -v
npm prefix -g
echo "$PATH"
```

`$(npm prefix -g)/bin` (macOS/Linux) 또는 `$(npm prefix -g)` (Windows)가 `echo "$PATH"` 출력에 **없다면**, 쉘이 글로벌 npm 바이너리 (`openclaw` 포함)를 찾을 수 없습니다.

## 해결: npm의 글로벌 bin 디렉토리를 PATH에 추가

1. 글로벌 npm 접두사 찾기:

```bash
npm prefix -g
```

2. 쉘 시작 파일에 글로벌 npm bin 디렉토리 추가:

- zsh: `~/.zshrc`
- bash: `~/.bashrc`

예시 (경로를 `npm prefix -g` 출력으로 변경):

```bash
# macOS / Linux
export PATH="/path/from/npm/prefix/bin:$PATH"
```

그 다음 **새 터미널**을 열거나 (zsh에서 `rehash` / bash에서 `hash -r` 실행).

Windows에서는 `npm prefix -g` 출력을 PATH에 추가하세요.

## 해결: `sudo npm install -g` 사용 금지 / 권한 오류 방지 (Linux)

`npm install -g ...` 명령이 `EACCES` 오류로 실패하는 경우, npm의 글로벌 접두사를 사용자 쓰기 가능한 디렉토리로 변경하세요:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

쉘 시작 파일에 `export PATH=...` 줄을 저장하세요.

## 권장 Node 설치 옵션

다음과 같은 방식으로 Node/npm을 설치하면 문제를 최소화할 수 있습니다:

- Node를 최신 버전(22+)으로 유지
- 글로벌 npm bin 디렉토리가 안정적이고 새 쉘에서 PATH에 있음

일반적인 선택:

- macOS: Homebrew (`brew install node`) 또는 버전 관리자
- Linux: 선호하는 버전 관리자, 또는 Node 22+를 제공하는 배포판 지원 설치
- Windows: 공식 Node 설치 프로그램, `winget`, 또는 Windows Node 버전 관리자

버전 관리자(nvm/fnm/asdf/등)를 사용하는 경우, 일상적으로 사용하는 쉘(zsh vs bash)에서 초기화되어 설치 프로그램 실행 시 PATH가 설정되도록 해야 합니다.

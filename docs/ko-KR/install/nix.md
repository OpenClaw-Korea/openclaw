---
summary: "Nix로 OpenClaw를 선언적으로 설치"
read_when:
  - 재현 가능하고 롤백 가능한 설치를 원할 때
  - 이미 Nix/NixOS/Home Manager를 사용하고 있는 경우
  - 모든 것을 고정하고 선언적으로 관리하고 싶을 때
title: "Nix"
---

# Nix 설치

Nix로 OpenClaw를 실행하는 권장 방법은 **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — 배터리 포함 Home Manager 모듈을 통하는 것입니다.

## 빠른 시작

AI 에이전트 (Claude, Cursor 등)에 다음을 붙여넣으세요:

```text
Mac에서 nix-openclaw를 설정하고 싶습니다.
레포지토리: github:openclaw/nix-openclaw

수행해야 할 작업:
1. Determinate Nix가 설치되어 있는지 확인 (설치되어 있지 않으면 설치)
2. templates/agent-first/flake.nix를 사용하여 ~/code/openclaw-local에 로컬 flake 생성
3. Telegram 봇 (@BotFather) 생성 및 채팅 ID (@userinfobot) 가져오기 도움
4. 시크릿 설정 (봇 토큰, Anthropic 키) - ~/.secrets/의 일반 파일도 괜찮음
5. 템플릿 플레이스홀더를 채우고 home-manager switch 실행
6. 확인: launchd 실행 중, 봇이 메시지에 응답

모듈 옵션은 nix-openclaw README를 참조하세요.
```

> **📦 전체 가이드: [github.com/openclaw/nix-openclaw](https://github.com/openclaw/nix-openclaw)**
>
> nix-openclaw 레포지토리가 Nix 설치의 진실의 원천입니다. 이 페이지는 간단한 개요일 뿐입니다.

## 얻을 수 있는 것

- 게이트웨이 + macOS 앱 + 도구 (whisper, spotify, cameras) — 모두 고정됨
- 재부팅 후에도 유지되는 Launchd 서비스
- 선언적 설정이 포함된 플러그인 시스템
- 즉시 롤백: `home-manager switch --rollback`

---

## Nix 모드 런타임 동작

`OPENCLAW_NIX_MODE=1`이 설정된 경우 (nix-openclaw로 자동):

OpenClaw는 설정을 결정론적으로 만들고 자동 설치 플로우를 비활성화하는 **Nix 모드**를 지원합니다.
내보내기로 활성화하세요:

```bash
OPENCLAW_NIX_MODE=1
```

macOS에서 GUI 앱은 셸 환경 변수를 자동으로 상속하지 않습니다. defaults를 통해 Nix 모드를 활성화할 수도 있습니다:

```bash
defaults write bot.molt.mac openclaw.nixMode -bool true
```

### 설정 + 상태 경로

OpenClaw는 `OPENCLAW_CONFIG_PATH`에서 JSON5 설정을 읽고 `OPENCLAW_STATE_DIR`에 변경 가능한 데이터를 저장합니다.

- `OPENCLAW_STATE_DIR` (기본값: `~/.openclaw`)
- `OPENCLAW_CONFIG_PATH` (기본값: `$OPENCLAW_STATE_DIR/openclaw.json`)

Nix에서 실행할 때, 런타임 상태와 설정이 불변 스토어 외부에 유지되도록 이를 명시적으로 Nix 관리 위치로 설정하세요.

### Nix 모드의 런타임 동작

- 자동 설치 및 자체 변이 플로우가 비활성화됩니다
- 누락된 의존성은 Nix 특정 교정 메시지를 표시합니다
- UI는 읽기 전용 Nix 모드 배너를 표시합니다 (존재하는 경우)

## 패키징 참고사항 (macOS)

macOS 패키징 플로우는 다음에서 안정적인 Info.plist 템플릿을 기대합니다:

```
apps/macos/Sources/OpenClaw/Resources/Info.plist
```

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)는 이 템플릿을 앱 번들에 복사하고 동적 필드 (번들 ID, 버전/빌드, Git SHA, Sparkle 키)를 패치합니다. 이는 SwiftPM 패키징 및 Nix 빌드 (전체 Xcode 툴체인에 의존하지 않음)를 위해 plist를 결정론적으로 유지합니다.

## 관련 항목

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) — 전체 설정 가이드
- [마법사](/ko-KR/start/wizard) — 비 Nix CLI 설정
- [Docker](/ko-KR/install/docker) — 컨테이너화된 설정

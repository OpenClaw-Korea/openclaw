---
summary: "OpenClaw macOS 앱 개발자를 위한 설정 가이드"
read_when:
  - macOS 개발 환경 설정 시
title: "macOS 개발 설정"
---

# macOS 개발자 설정

이 가이드는 소스에서 OpenClaw macOS 애플리케이션을 빌드하고 실행하는 데 필요한 단계를 다룹니다.

## 사전 요구사항

앱을 빌드하기 전에 다음이 설치되어 있는지 확인하세요:

1.  **Xcode 26.2+**: Swift 개발에 필요합니다.
2.  **Node.js 22+ & pnpm**: 게이트웨이, CLI 및 패키징 스크립트에 필요합니다.

## 1. 의존성 설치

프로젝트 전체 의존성을 설치합니다:

```bash
pnpm install
```

## 2. 앱 빌드 및 패키징

macOS 앱을 빌드하고 `dist/OpenClaw.app`으로 패키징하려면 다음을 실행합니다:

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID 인증서가 없는 경우, 스크립트는 자동으로 **ad-hoc 서명** (`-`)을 사용합니다.

개발 실행 모드, 서명 플래그 및 Team ID 문제 해결은 macOS 앱 README를 참조하세요:
https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md

> **참고**: Ad-hoc 서명된 앱은 보안 경고를 트리거할 수 있습니다. 앱이 "Abort trap 6"으로 즉시 충돌하는 경우, [문제 해결](#troubleshooting) 섹션을 참조하세요.

## 3. CLI 설치

macOS 앱은 백그라운드 작업을 관리하기 위해 전역 `openclaw` CLI 설치를 기대합니다.

**설치 방법 (권장):**

1.  OpenClaw 앱을 엽니다.
2.  **General** 설정 탭으로 이동합니다.
3.  **"Install CLI"**를 클릭합니다.

또는 수동으로 설치합니다:

```bash
npm install -g openclaw@<version>
```

## 문제 해결

### 빌드 실패: 툴체인 또는 SDK 불일치

macOS 앱 빌드는 최신 macOS SDK 및 Swift 6.2 툴체인을 기대합니다.

**시스템 의존성 (필수):**

- **Software Update에서 사용 가능한 최신 macOS 버전** (Xcode 26.2 SDK에서 필수)
- **Xcode 26.2** (Swift 6.2 툴체인)

**확인:**

```bash
xcodebuild -version
xcrun swift --version
```

버전이 일치하지 않으면, macOS/Xcode를 업데이트하고 빌드를 다시 실행합니다.

### 권한 부여 시 앱 충돌

**음성 인식** 또는 **마이크** 접근을 허용하려 할 때 앱이 충돌하는 경우,
TCC 캐시 손상 또는 서명 불일치 때문일 수 있습니다.

**해결 방법:**

1. TCC 권한 재설정:
   ```bash
   tccutil reset All bot.molt.mac.debug
   ```
2. 실패하는 경우, [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)에서 `BUNDLE_ID`를 임시로 변경하여 macOS에서 "새로운 시작"을 강제합니다.

### 게이트웨이 "Starting..." 무한 대기

게이트웨이 상태가 "Starting..."에 머물러 있는 경우, 좀비 프로세스가 포트를 점유하고 있는지 확인합니다:

```bash
openclaw gateway status
openclaw gateway stop

# LaunchAgent를 사용하지 않는 경우 (개발 모드 / 수동 실행), 리스너 찾기:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

수동 실행이 포트를 점유하고 있는 경우, 해당 프로세스를 중지합니다 (Ctrl+C). 최후의 수단으로, 위에서 찾은 PID를 종료합니다.

---
summary: "패키징 스크립트로 생성된 macOS 디버그 빌드의 서명 단계"
read_when:
  - Mac 디버그 빌드를 빌드하거나 서명할 때
title: "macOS 서명"
---

# mac 서명 (디버그 빌드)

이 앱은 일반적으로 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)에서 빌드되며, 다음과 같은 작업을 합니다:

- 안정적인 디버그 번들 식별자 설정: `ai.openclaw.mac.debug`
- 해당 번들 ID로 Info.plist 작성 (`BUNDLE_ID=...`로 재정의 가능)
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh)를 호출하여 주 바이너리 및 앱 번들에 서명하므로 macOS는 각 재빌드를 동일한 서명된 번들로 취급하고 TCC 권한(알림, 접근성, 화면 기록, 마이크, 음성)을 유지합니다. 안정적인 권한을 위해 실제 서명 ID를 사용하세요. 애드혹 서명은 선택 사항이며 불안정합니다([macOS 권한](/platforms/mac/permissions) 참조).
- 기본적으로 `CODESIGN_TIMESTAMP=auto`를 사용합니다. Developer ID 서명에 대해 신뢰할 수 있는 타임스탬프를 활성화합니다. `CODESIGN_TIMESTAMP=off`로 설정하여 타임스탐핑을 건너뜁니다(오프라인 디버그 빌드).
- 빌드 메타데이터를 Info.plist에 주입합니다: `OpenClawBuildTimestamp` (UTC) 및 `OpenClawGitCommit` (짧은 해시)로 정보 창에서 빌드, git, 디버그/릴리스 채널을 표시할 수 있습니다.
- **패키징에는 Node 22+ 필요**: 스크립트는 TS 빌드 및 Control UI 빌드를 실행합니다.
- 환경에서 `SIGN_IDENTITY`를 읽습니다. 셸 rc에 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (또는 Developer ID Application 인증서)를 추가하여 항상 인증서로 서명하도록 합니다. 애드혹 서명을 위해서는 `ALLOW_ADHOC_SIGNING=1` 또는 `SIGN_IDENTITY="-"`을 통해 명시적으로 선택해야 합니다(권한 테스트에는 권장되지 않음).
- 서명 후 팀 ID 감사를 실행하고 앱 번들 내 모든 Mach-O가 다른 팀 ID로 서명된 경우 실패합니다. `SKIP_TEAM_ID_CHECK=1`을 설정하여 우회합니다.

## 사용 방법

```bash
# 저장소 루트에서
scripts/package-mac-app.sh               # 자동으로 ID 선택; 없으면 오류 발생
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # 실제 인증서
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # 애드혹 (권한이 유지되지 않음)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # 명시적 애드혹 (동일한 주의사항)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # 개발 전용 Sparkle 팀 ID 불일치 해결 방법
```

### 애드혹 서명 참고사항

`SIGN_IDENTITY="-"`(애드혹)로 서명할 때, 스크립트는 자동으로 **강화된 런타임** (`--options runtime`)을 비활성화합니다. 이는 동일한 팀 ID를 공유하지 않는 임베디드 프레임워크(예: Sparkle)를 로드하려고 할 때 앱이 충돌하는 것을 방지하기 위해 필요합니다. 애드혹 서명은 TCC 권한 지속성도 손상시킵니다. 복구 단계는 [macOS 권한](/platforms/mac/permissions)을 참조하세요.

## 정보 창의 빌드 메타데이터

`package-mac-app.sh`는 번들에 다음을 기록합니다:

- `OpenClawBuildTimestamp`: 패키킹 시간의 ISO8601 UTC
- `OpenClawGitCommit`: 짧은 git 해시 (사용할 수 없으면 `unknown`)

정보 탭은 이러한 키를 읽어 버전, 빌드 날짜, git 커밋 및 디버그 빌드 여부(`#if DEBUG`를 통해)를 표시합니다. 코드 변경 후 이러한 값을 새로 고치려면 패키저를 실행하세요.

## 이유

TCC 권한은 번들 식별자 _및_ 코드 서명에 연결됩니다. 변경되는 UUID를 가진 서명되지 않은 디버그 빌드는 각 재빌드 후 macOS가 권한을 잊게 했습니다. 바이너리에 서명하고(기본적으로 애드혹) 고정 번들 ID/경로(`dist/OpenClaw.app`)를 유지하면 빌드 간에 권한이 유지되어 VibeTunnel 접근 방식과 일치합니다.

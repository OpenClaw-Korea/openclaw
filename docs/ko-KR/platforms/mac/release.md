---
summary: "OpenClaw macOS 릴리스 체크리스트 (Sparkle 피드, 패키징, 서명)"
read_when:
  - OpenClaw macOS 릴리스를 진행하거나 검증할 때
  - Sparkle 앱캐스트 또는 피드 자산을 업데이트할 때
title: "macOS 릴리스"
---

# OpenClaw macOS 릴리스 (Sparkle)

이 앱은 이제 Sparkle 자동 업데이트를 포함합니다. 릴리스 빌드는 Developer ID로 서명하고, 압축되며, 서명된 앱캐스트 항목과 함께 발행되어야 합니다.

## 사전 요구사항

- Developer ID Application 인증서 설치됨 (예: `Developer ID Application: <Developer Name> (<TEAMID>)`).
- Sparkle 개인 키 경로가 환경 변수 `SPARKLE_PRIVATE_KEY_FILE`로 설정됨 (Sparkle ed25519 개인 키의 경로, 공개 키는 Info.plist에 포함됨). 누락된 경우 `~/.profile`을 확인하세요.
- `xcrun notarytool`을 위한 공증 자격 증명 (Gatekeeper 안전한 DMG/zip 배포를 원하는 경우 키체인 프로필 또는 API 키).
  - 키체인 프로필 `openclaw-notary`를 사용하며, 셸 프로필의 App Store Connect API 키 환경 변수에서 생성됩니다:
    - `APP_STORE_CONNECT_API_KEY_P8`, `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`
    - `echo "$APP_STORE_CONNECT_API_KEY_P8" | sed 's/\\n/\n/g' > /tmp/openclaw-notary.p8`
    - `xcrun notarytool store-credentials "openclaw-notary" --key /tmp/openclaw-notary.p8 --key-id "$APP_STORE_CONNECT_KEY_ID" --issuer "$APP_STORE_CONNECT_ISSUER_ID"`
- `pnpm` 의존성 설치됨 (`pnpm install --config.node-linker=hoisted`).
- Sparkle 도구는 SwiftPM을 통해 `apps/macos/.build/artifacts/sparkle/Sparkle/bin/` (`sign_update`, `generate_appcast` 등)에서 자동으로 가져와집니다.

## 빌드 및 패키징

참고:

- `APP_BUILD`는 `CFBundleVersion`/`sparkle:version`에 매핑됩니다. 숫자형이고 단조로워야 합니다(no `-beta`). 그렇지 않으면 Sparkle이 동일하게 비교합니다.
- 기본값은 현재 아키텍처입니다(`$(uname -m)`). 릴리스/유니버설 빌드의 경우 `BUILD_ARCHS="arm64 x86_64"`(또는 `BUILD_ARCHS=all`)를 설정하세요.
- 릴리스 아티팩트(zip + DMG + 공증)에는 `scripts/package-mac-dist.sh`를 사용하세요. 로컬/개발 패키징에는 `scripts/package-mac-app.sh`를 사용하세요.

```bash
# 저장소 루트에서; Sparkle 피드를 활성화하기 위해 릴리스 ID를 설정합니다.
# APP_BUILD는 Sparkle 비교를 위해 숫자형이고 단조로워야 합니다.
BUNDLE_ID=bot.molt.mac \
APP_VERSION=2026.2.2 \
APP_BUILD="$(git rev-list --count HEAD)" \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Developer Name> (<TEAMID>)" \
scripts/package-mac-app.sh

# 배포용 Zip 압축 (Sparkle 델타 지원을 위한 리소스 포크 포함)
ditto -c -k --sequesterRsrc --keepParent dist/OpenClaw.app dist/OpenClaw-2026.2.2.zip

# 선택사항: 사용자를 위한 스타일 DMG도 빌드합니다 (응용 프로그램으로 드래그)
scripts/create-dmg.sh dist/OpenClaw.app dist/OpenClaw-2026.2.2.dmg

# 권장: 빌드 + 공증/스테이플 zip + DMG
# 먼저 키체인 프로필을 한 번 만듭니다:
#   xcrun notarytool store-credentials "openclaw-notary" \
#     --apple-id "<apple-id>" --team-id "<team-id>" --password "<app-specific-password>"
NOTARIZE=1 NOTARYTOOL_PROFILE=openclaw-notary \
BUNDLE_ID=bot.molt.mac \
APP_VERSION=2026.2.2 \
APP_BUILD="$(git rev-list --count HEAD)" \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Developer Name> (<TEAMID>)" \
scripts/package-mac-dist.sh

# 선택사항: 릴리스와 함께 dSYM을 배포합니다
ditto -c -k --keepParent apps/macos/.build/release/OpenClaw.app.dSYM dist/OpenClaw-2026.2.2.dSYM.zip
```

## 앱캐스트 항목

Sparkle이 형식화된 HTML 릴리스 노트를 렌더링하도록 릴리스 노트 생성기를 사용합니다:

```bash
SPARKLE_PRIVATE_KEY_FILE=/path/to/ed25519-private-key scripts/make_appcast.sh dist/OpenClaw-2026.2.2.zip https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml
```

`CHANGELOG.md`에서 HTML 릴리스 노트를 생성하고([`scripts/changelog-to-html.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/changelog-to-html.sh) 참조) 앱캐스트 항목에 포함시킵니다.
발행할 때 업데이트된 `appcast.xml`을 릴리스 자산(zip + dSYM)과 함께 커밋합니다.

## 발행 및 검증

- `OpenClaw-2026.2.2.zip`(`OpenClaw-2026.2.2.dSYM.zip` 포함)을 태그 `v2026.2.2`의 GitHub 릴리스에 업로드합니다.
- 원본 앱캐스트 URL이 베이크된 피드와 일치하는지 확인합니다: `https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml`.
- 검증 확인:
  - `curl -I https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml`이 200을 반환합니다.
  - `curl -I <enclosure url>`이 자산 업로드 후 200을 반환합니다.
  - 이전 공개 빌드에서 About 탭의 "업데이트 확인…"을 실행하고 Sparkle이 새 빌드를 깔끔하게 설치하는지 확인합니다.

완료 정의: 서명된 앱 + 앱캐스트가 발행되고, 이전 설치 버전에서 업데이트 흐름이 작동하며, 릴리스 자산이 GitHub 릴리스에 첨부됩니다.

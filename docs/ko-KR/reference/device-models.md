---
summary: "OpenClaw에서 Apple 기기 모델 식별자를 macOS 앱의 친화적인 이름으로 매핑하는 방법입니다."
read_when:
  - 기기 모델 식별자 매핑 또는 NOTICE/라이선스 파일 업데이트
  - Instances UI에서 기기 이름을 표시하는 방식 변경
title: "기기 모델 데이터베이스"
---

# 기기 모델 데이터베이스 (친화적인 이름)

macOS 컴패니언 앱은 **Instances** UI에서 Apple 모델 식별자(예: `iPad16,6`, `Mac16,6`)를 사람이 읽을 수 있는 이름으로 매핑하여 친화적인 Apple 기기 모델 이름을 표시합니다.

매핑은 다음 위치에 JSON으로 저장되어 있습니다:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## 데이터 소스

현재 MIT 라이선스가 적용된 저장소에서 매핑을 공급받습니다:

- `kyle-seongwoo-jun/apple-device-identifiers`

빌드를 결정론적으로 유지하기 위해 JSON 파일은 특정 업스트림 커밋으로 고정됩니다 (`apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`에 기록됨).

## 데이터베이스 업데이트

1. 고정할 업스트림 커밋을 선택합니다 (iOS용 1개, macOS용 1개).
2. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`의 커밋 해시를 업데이트합니다.
3. 해당 커밋으로 고정된 JSON 파일을 다시 다운로드합니다:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt`이 여전히 업스트림과 일치하는지 확인합니다 (업스트림 라이선스가 변경된 경우 파일을 교체합니다).
5. macOS 앱이 경고 없이 정상적으로 빌드되는지 확인합니다:

```bash
swift build --package-path apps/macos
```

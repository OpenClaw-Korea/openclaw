---
summary: "노드 위치 명령(location.get), 권한 모드, 백그라운드 동작"
read_when:
  - 위치 노드 지원 또는 권한 UI 추가 시
  - 백그라운드 위치 + 푸시 흐름 설계 시
title: "위치 명령"
---

# 위치 명령(노드)

## TL;DR

- `location.get`은 노드 명령입니다(`node.invoke`를 통해).
- 기본값으로 비활성화되어 있습니다.
- 설정에서는 선택기를 사용합니다: 끔 / 사용 중일 때 / 항상.
- 별도의 토글: 정확한 위치입니다.

## 선택기를 사용하는 이유(단순한 스위치가 아닌)

OS 권한은 다단계입니다. 앱 내에서 선택기를 노출할 수 있지만, OS는 여전히 실제 부여를 결정합니다.

- iOS/macOS: 사용자는 시스템 프롬프트/설정에서 **사용 중일 때** 또는 **항상**을 선택할 수 있습니다. 앱은 업그레이드를 요청할 수 있지만, OS는 설정을 요구할 수 있습니다.
- Android: 백그라운드 위치는 별도의 권한입니다. Android 10 이상에서는 설정 흐름이 필요한 경우가 많습니다.
- 정확한 위치는 별도의 부여입니다(iOS 14+ "정확함", Android "세밀함" vs "대략적").

UI의 선택기는 요청된 모드를 구동합니다. 실제 부여는 OS 설정에 있습니다.

## 설정 모델

노드 디바이스별:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

UI 동작:

- `whileUsing` 선택 시 포그라운드 권한을 요청합니다.
- `always` 선택 시 먼저 `whileUsing`을 확인한 후 백그라운드를 요청합니다(필요한 경우 설정으로 사용자를 보냅니다).
- OS가 요청된 수준을 거부한 경우 부여된 가장 높은 수준으로 되돌리고 상태를 표시합니다.

## 권한 매핑(node.permissions)

선택 사항입니다. macOS 노드는 권한 맵을 통해 `location`을 보고합니다. iOS/Android는 생략할 수 있습니다.

## 명령: `location.get`

`node.invoke`를 통해 호출됩니다.

매개변수(제안):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

응답 페이로드:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

오류(안정적 코드):

- `LOCATION_DISABLED`: 선택기가 끔 상태입니다.
- `LOCATION_PERMISSION_REQUIRED`: 요청된 모드에 필요한 권한이 없습니다.
- `LOCATION_BACKGROUND_UNAVAILABLE`: 앱이 백그라운드인데 사용 중일 때만 허용됩니다.
- `LOCATION_TIMEOUT`: 제시간에 위치를 획득하지 못했습니다.
- `LOCATION_UNAVAILABLE`: 시스템 장애 / 제공자 없음.

## 백그라운드 동작(향후)

목표: 모델이 노드가 백그라운드인 경우에도 위치를 요청할 수 있습니다. 단, 다음 조건에서만:

- 사용자가 **항상**을 선택했습니다.
- OS가 백그라운드 위치를 부여합니다.
- 앱이 위치를 위해 백그라운드에서 실행될 수 있습니다(iOS 백그라운드 모드 / Android 포그라운드 서비스 또는 특별 허용).

푸시 트리거 흐름(향후):

1. 게이트웨이가 노드에 푸시를 보냅니다(자동 푸시 또는 FCM 데이터).
2. 노드는 간단히 깨어났다가 디바이스에서 위치를 요청합니다.
3. 노드는 페이로드를 게이트웨이로 전달합니다.

참고:

- iOS: 항상 권한 + 백그라운드 위치 모드 필수. 자동 푸시는 스로틀링될 수 있습니다. 간헐적 장애를 예상합니다.
- Android: 백그라운드 위치에 포그라운드 서비스가 필요할 수 있습니다. 그렇지 않으면 거부를 예상합니다.

## 모델/도구 통합

- 도구 표면: `nodes` 도구는 `location_get` 액션을 추가합니다(노드 필수).
- CLI: `openclaw nodes location get --node <id>`.
- 에이전트 지침: 사용자가 위치를 활성화했고 범위를 이해하는 경우에만 호출하세요.

## UX 복사(제안)

- 끔: "위치 공유가 비활성화되어 있습니다."
- 사용 중일 때: "OpenClaw가 열려 있을 때만."
- 항상: "백그라운드 위치 허용. 시스템 권한 필요."
- 정확함: "정확한 GPS 위치 사용. 끄면 대략적인 위치를 공유합니다."

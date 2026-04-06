---
summary: "macOS에서 OpenClaw의 메뉴 바 아이콘 상태 및 애니메이션"
read_when:
  - Changing menu bar icon behavior
title: "메뉴 바 아이콘"
---

# 메뉴 바 아이콘 상태

Author: steipete · Updated: 2025-12-06 · Scope: macOS app (`apps/macos`)

- **Idle:** 일반 아이콘 애니메이션 (깜박임, 가끔 흔들림).
- **Paused:** 상태 항목이 `appearsDisabled`를 사용합니다. 동작이 없습니다.
- **Voice trigger (big ears):** 음성 감지기가 웨이크 워드를 감지할 때 `AppState.triggerVoiceEars(ttl: nil)`을 호출하여, 음성 입력이 캡처되는 동안 `earBoostActive=true`를 유지합니다. 귀의 크기가 확대되고 (1.9배), 가독성을 위해 둥근 귀 구멍이 생긴 후, 1초간의 무음 후 `stopVoiceEars()`를 통해 사라집니다. 앱 내 음성 파이프라인에서만 작동합니다.
- **Working (agent running):** `AppState.isWorking=true`는 "꼬리/다리 움직임" 마이크로 모션을 구동합니다. 작업이 진행 중일 때 다리 흔들림이 빨라지고 약간의 수평 이동이 생깁니다. 현재는 WebChat 에이전트 실행 주변에서 토글되며, 다른 긴 작업을 연결할 때 동일한 토글을 추가하면 됩니다.

## 연결점

- Voice wake: 런타임/테스터가 트리거 시 `AppState.triggerVoiceEars(ttl: nil)`을 호출하고 캡처 창과 일치하도록 1초간의 무음 후 `stopVoiceEars()`를 호출합니다.
- Agent activity: 작업 기간 주변에서 `AppStateStore.shared.setWorking(true/false)`을 설정합니다 (WebChat 에이전트 호출에서 이미 수행됨). 기간을 짧게 유지하고 애니메이션이 고착되지 않도록 `defer` 블록에서 초기화합니다.

## 모양 및 크기

- Base icon은 `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`에서 그려집니다.
- 귀 크기의 기본값은 `1.0`입니다. 음성 부스트는 `earScale=1.9`를 설정하고 전체 프레임을 변경하지 않으면서 `earHoles=true`를 토글합니다 (18×18 pt 템플릿 이미지가 36×36 px Retina 백스토어로 렌더링됨).
- Scurry는 다리 흔들림을 ~1.0까지 사용하며 작은 수평 지터를 추가합니다. 이는 기존의 idle 흔들림에 더해집니다.

## 동작 참고사항

- 귀/작업에 대한 외부 CLI/broker 토글이 없습니다. 실수로 팔딱거리는 것을 방지하기 위해 앱 자체의 신호 내에 유지합니다.
- TTL을 짧게 유지합니다 (&lt;10s). 작업이 멈추면 아이콘이 빠르게 기본 상태로 돌아갑니다.

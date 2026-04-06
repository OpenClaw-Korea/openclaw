---
summary: "웨이크 워드와 푸시투톡이 겹칠 때 음성 오버레이 생명주기"
read_when:
  - 음성 오버레이 동작 조정하기
title: "음성 오버레이"
---

# 음성 오버레이 생명주기 (macOS)

대상: macOS 앱 개발자. 목표: 웨이크 워드와 푸시투톡이 겹칠 때 음성 오버레이를 예측 가능하게 유지합니다.

### 현재 의도

- 오버레이가 이미 웨이크 워드로 표시되고 사용자가 핫키를 누르면, 핫키 세션은 기존 텍스트를 **채택**하며 초기화하지 않습니다. 핫키를 누르고 있는 동안 오버레이가 유지됩니다. 사용자가 손을 떼면: 잘라낸 텍스트가 있으면 전송하고, 없으면 해제합니다.
- 웨이크 워드 단독: 침묵 시 자동 전송; 푸시투톡: 손을 뗄 때 즉시 전송합니다.

### 구현됨 (2025년 12월 9일)

- 오버레이 세션은 이제 캡처당 토큰을 가집니다(웨이크 워드 또는 푸시투톡). 부분/최종/전송/해제/레벨 업데이트는 토큰이 일치하지 않으면 삭제되어 오래된 콜백을 방지합니다.
- 푸시투톡은 표시된 오버레이 텍스트를 접두사로 채택합니다(웨이크 오버레이가 표시되는 동안 핫키를 누르면 텍스트를 유지하고 새 음성을 추가). 최종 변환을 기다리기까지 최대 1.5초를 기다린 후 현재 텍스트로 폴백합니다.
- 차임/오버레이 로깅은 `info` 수준에서 `voicewake.overlay`, `voicewake.ptt`, `voicewake.chime` 카테고리에서 발생합니다(세션 시작, 부분, 최종, 전송, 해제, 차임 이유).

### 다음 단계

1. **VoiceSessionCoordinator (액터)**
   - 한 번에 정확히 하나의 `VoiceSession`을 소유합니다.
   - API (토큰 기반): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - 오래된 토큰을 가진 콜백을 삭제합니다(이전 인식기가 오버레이를 다시 열지 않도록 방지).
2. **VoiceSession (모델)**
   - 필드: `token`, `source` (wakeWord|pushToTalk), 커밋된/휘발성 텍스트, 차임 플래그, 타이머(자동 전송, 유휴), `overlayMode` (display|editing|sending), 쿨다운 기한.
3. **오버레이 바인딩**
   - `VoiceSessionPublisher` (`ObservableObject`)는 활성 세션을 SwiftUI로 미러링합니다.
   - `VoiceWakeOverlayView`는 게시자를 통해서만 렌더링하며, 전역 싱글톤을 직접 변경하지 않습니다.
   - 오버레이 사용자 작업(`sendNow`, `dismiss`, `edit`)은 세션 토큰으로 조정자에게 콜백합니다.
4. **통합 전송 경로**
   - `endCapture`에서: 잘라낸 텍스트가 비어있으면 → 해제; 그렇지 않으면 `performSend(session:)` (한 번 전송 차임을 재생하고, 전달한 후 해제).
   - 푸시투톡: 지연 없음; 웨이크 워드: 자동 전송을 위한 선택적 지연.
   - 푸시투톡이 끝난 후 웨이크 런타임에 짧은 쿨다운을 적용하여 웨이크 워드가 즉시 재트리거되지 않도록 합니다.
5. **로깅**
   - 조정자는 서브시스템 `bot.molt`, 카테고리 `voicewake.overlay` 및 `voicewake.chime`에서 `.info` 로그를 발생시킵니다.
   - 주요 이벤트: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

### 디버깅 체크리스트

- 스티키 오버레이를 재현하는 동안 로그를 스트리밍합니다:

  ```bash
  sudo log stream --predicate 'subsystem == "bot.molt" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- 활성 세션 토큰이 하나만 있는지 확인합니다. 오래된 콜백은 조정자에 의해 삭제되어야 합니다.
- 푸시투톡 해제가 항상 활성 토큰으로 `endCapture`를 호출하는지 확인합니다. 텍스트가 비어있으면 차임이나 전송 없이 `dismiss`를 예상합니다.

### 마이그레이션 단계 (제안)

1. `VoiceSessionCoordinator`, `VoiceSession`, `VoiceSessionPublisher`를 추가합니다.
2. `VoiceWakeRuntime`을 리팩토링하여 `VoiceWakeOverlayController`를 직접 건드리는 대신 세션을 생성/업데이트/종료하도록 합니다.
3. `VoicePushToTalk`를 리팩토링하여 기존 세션을 채택하고 해제 시 `endCapture`를 호출합니다. 런타임 쿨다운을 적용합니다.
4. `VoiceWakeOverlayController`를 게시자에 연결합니다. 런타임/PTT에서 직접 호출을 제거합니다.
5. 세션 채택, 쿨다운, 빈 텍스트 해제를 위한 통합 테스트를 추가합니다.

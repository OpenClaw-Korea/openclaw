---
summary: "토크 모드: ElevenLabs TTS를 사용한 연속 음성 대화"
read_when:
  - macOS/iOS/Android에서 토크 모드 구현
  - 음성/TTS/중단 동작 변경
title: "토크 모드"
---

# 토크 모드

토크 모드는 연속 음성 대화 루프입니다:

1. 음성 듣기
2. 모델에 전사본 전송 (메인 세션, chat.send)
3. 응답 대기
4. ElevenLabs를 통해 음성 출력 (스트리밍 재생)

## 동작 (macOS)

- 토크 모드가 활성화된 동안 **항상 켜진 오버레이**.
- **듣기 → 생각 중 → 말하기** 단계 전환.
- **짧은 일시 정지**(무음 창)에서 현재 전사본이 전송됩니다.
- 응답은 **WebChat에 작성됩니다**(타이핑과 동일).
- **음성 중단**(기본값 켜짐): 어시스턴트가 말하는 동안 사용자가 말하기 시작하면 재생을 중지하고 다음 프롬프트를 위해 중단 타임스탬프를 기록합니다.

## 응답의 음성 지시문

어시스턴트는 음성을 제어하기 위해 응답 앞에 **단일 JSON 라인**을 붙일 수 있습니다:

```json
{ "voice": "<voice-id>", "once": true }
```

규칙:

- 첫 번째 비어 있지 않은 라인만.
- 알 수 없는 키는 무시됩니다.
- `once: true`는 현재 응답에만 적용됩니다.
- `once` 없이는 음성이 토크 모드의 새로운 기본값이 됩니다.
- JSON 라인은 TTS 재생 전에 제거됩니다.

지원되는 키:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## 설정 (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    interruptOnSpeech: true,
  },
}
```

기본값:

- `interruptOnSpeech`: true
- `voiceId`: `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`로 대체 (또는 API 키가 사용 가능한 경우 첫 번째 ElevenLabs 음성)
- `modelId`: 설정되지 않은 경우 `eleven_v3`이 기본값
- `apiKey`: `ELEVENLABS_API_KEY`로 대체 (또는 사용 가능한 경우 게이트웨이 셸 프로필)
- `outputFormat`: macOS/iOS에서 `pcm_44100`, Android에서 `pcm_24000`이 기본값 (MP3 스트리밍을 강제하려면 `mp3_*` 설정)

## macOS UI

- 메뉴바 토글: **토크**
- 설정 탭: **토크 모드** 그룹 (음성 ID + 중단 토글)
- 오버레이:
  - **듣기**: 마이크 레벨로 클라우드 펄스
  - **생각 중**: 가라앉는 애니메이션
  - **말하기**: 방사형 링
  - 클라우드 클릭: 말하기 중지
  - X 클릭: 토크 모드 종료

## 참고사항

- 음성 + 마이크 권한이 필요합니다.
- 세션 키 `main`에 대해 `chat.send`를 사용합니다.
- TTS는 `ELEVENLABS_API_KEY`와 함께 ElevenLabs 스트리밍 API를 사용하며 더 낮은 지연 시간을 위해 macOS/iOS/Android에서 증분 재생을 사용합니다.
- `eleven_v3`의 `stability`는 `0.0`, `0.5` 또는 `1.0`으로 검증됩니다. 다른 모델은 `0..1`을 허용합니다.
- `latency_tier`는 설정된 경우 `0..4`로 검증됩니다.
- Android는 저지연 AudioTrack 스트리밍을 위해 `pcm_16000`, `pcm_22050`, `pcm_24000`, `pcm_44100` 출력 형식을 지원합니다.

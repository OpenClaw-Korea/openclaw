---
summary: "아웃바운드 응답을 위한 텍스트 음성 변환 (TTS)"
read_when:
  - 응답에 대한 텍스트 음성 변환을 활성화할 때
  - TTS 프로바이더 또는 제한을 구성할 때
  - /tts 명령어를 사용할 때
title: "텍스트 음성 변환"
---

# 텍스트 음성 변환 (TTS)

OpenClaw는 ElevenLabs, OpenAI 또는 Edge TTS를 사용하여 아웃바운드 응답을 오디오로 변환할 수 있습니다.
OpenClaw가 오디오를 보낼 수 있는 곳이면 어디서나 작동하며, Telegram은 둥근 음성 메모 버블을 얻습니다.

## 지원되는 서비스

- **ElevenLabs** (기본 또는 폴백 프로바이더)
- **OpenAI** (기본 또는 폴백 프로바이더; 요약에도 사용됨)
- **Edge TTS** (기본 또는 폴백 프로바이더; `node-edge-tts` 사용, API 키가 없을 때 기본값)

### Edge TTS 참고사항

Edge TTS는 `node-edge-tts` 라이브러리를 통해 Microsoft Edge의 온라인 뉴럴 TTS 서비스를 사용합니다. 호스팅 서비스 (로컬이 아님)이며, Microsoft의 엔드포인트를 사용하고, API 키가 필요하지 않습니다. `node-edge-tts`는 음성 설정 옵션과 출력 형식을 노출하지만, Edge 서비스에서 모든 옵션이 지원되는 것은 아닙니다.

Edge TTS는 게시된 SLA 또는 할당량이 없는 공개 웹 서비스이므로 최선의 노력으로 취급하세요. 보장된 제한과 지원이 필요한 경우 OpenAI 또는 ElevenLabs를 사용하세요. Microsoft의 Speech REST API는 요청당 10분 오디오 제한을 문서화합니다. Edge TTS는 제한을 게시하지 않으므로 유사하거나 더 낮은 제한을 가정하세요.

## 선택적 키

OpenAI 또는 ElevenLabs를 원하는 경우:

- `ELEVENLABS_API_KEY` (또는 `XI_API_KEY`)
- `OPENAI_API_KEY`

Edge TTS는 API 키가 **필요하지 않습니다**. API 키가 없으면 OpenClaw는 기본적으로 Edge TTS를 사용합니다 (`messages.tts.edge.enabled=false`를 통해 비활성화되지 않는 한).

여러 프로바이더가 설정된 경우, 선택된 프로바이더가 먼저 사용되고 나머지는 폴백 옵션입니다.
자동 요약은 설정된 `summaryModel` (또는 `agents.defaults.model.primary`)을 사용하므로, 요약을 활성화하는 경우 해당 프로바이더도 인증되어야 합니다.

## 서비스 링크

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## 기본적으로 활성화되어 있나요?

아니요. 자동 TTS는 기본적으로 **꺼져** 있습니다. 설정에서 `messages.tts.auto`로 활성화하거나 세션당 `/tts always` (별칭: `/tts on`)로 활성화하세요.

Edge TTS는 TTS가 켜지면 기본적으로 **활성화**되며, OpenAI 또는 ElevenLabs API 키를 사용할 수 없을 때 자동으로 사용됩니다.

## 설정

TTS 설정은 `openclaw.json`의 `messages.tts` 아래에 있습니다.
전체 스키마는 [게이트웨이 설정](/gateway/configuration)에 있습니다.

### 최소 설정 (활성화 + 프로바이더)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI 기본 + ElevenLabs 폴백

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      openai: {
        apiKey: "openai_api_key",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
    },
  },
}
```

### Edge TTS 기본 (API 키 없음)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "edge",
      edge: {
        enabled: true,
        voice: "en-US-MichelleNeural",
        lang: "en-US",
        outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        rate: "+10%",
        pitch: "-5%",
      },
    },
  },
}
```

### Edge TTS 비활성화

```json5
{
  messages: {
    tts: {
      edge: {
        enabled: false,
      },
    },
  },
}
```

### 커스텀 제한 + 설정 경로

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### 인바운드 음성 메모 후에만 오디오로 응답

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### 긴 응답에 대한 자동 요약 비활성화

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

그런 다음 실행:

```
/tts summary off
```

### 필드 참고사항

- `auto`: 자동 TTS 모드 (`off`, `always`, `inbound`, `tagged`).
  - `inbound`는 인바운드 음성 메모 후에만 오디오를 전송합니다.
  - `tagged`는 응답에 `[[tts]]` 태그가 포함된 경우에만 오디오를 전송합니다.
- `enabled`: 레거시 토글 (doctor가 이를 `auto`로 마이그레이션).
- `mode`: `"final"` (기본값) 또는 `"all"` (도구/블록 응답 포함).
- `provider`: `"elevenlabs"`, `"openai"` 또는 `"edge"` (폴백은 자동).
- `provider`가 **설정되지 않은** 경우, OpenClaw는 `openai` (키가 있는 경우), 그런 다음 `elevenlabs` (키가 있는 경우), 그렇지 않으면 `edge`를 선호합니다.
- `summaryModel`: 자동 요약을 위한 선택적 저렴한 모델; 기본값은 `agents.defaults.model.primary`.
  - `provider/model` 또는 설정된 모델 별칭을 허용합니다.
- `modelOverrides`: 모델이 TTS 지시문을 내보낼 수 있도록 허용 (기본적으로 켜짐).
- `maxTextLength`: TTS 입력의 하드 캡 (문자). 초과하면 `/tts audio`가 실패합니다.
- `timeoutMs`: 요청 타임아웃 (ms).
- `prefsPath`: 로컬 설정 JSON 경로 재정의 (프로바이더/제한/요약).
- `apiKey` 값은 환경 변수 (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `OPENAI_API_KEY`)로 폴백됩니다.
- `elevenlabs.baseUrl`: ElevenLabs API 기본 URL 재정의.
- `elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = 정상)
- `elevenlabs.applyTextNormalization`: `auto|on|off`
- `elevenlabs.languageCode`: 2자 ISO 639-1 (예: `en`, `de`)
- `elevenlabs.seed`: 정수 `0..4294967295` (최선의 노력 결정론)
- `edge.enabled`: Edge TTS 사용 허용 (기본값 `true`; API 키 없음).
- `edge.voice`: Edge 뉴럴 음성 이름 (예: `en-US-MichelleNeural`).
- `edge.lang`: 언어 코드 (예: `en-US`).
- `edge.outputFormat`: Edge 출력 형식 (예: `audio-24khz-48kbitrate-mono-mp3`).
  - 유효한 값은 Microsoft Speech 출력 형식을 참조하세요. Edge에서 모든 형식이 지원되는 것은 아닙니다.
- `edge.rate` / `edge.pitch` / `edge.volume`: 퍼센트 문자열 (예: `+10%`, `-5%`).
- `edge.saveSubtitles`: 오디오 파일과 함께 JSON 자막 작성.
- `edge.proxy`: Edge TTS 요청을 위한 프록시 URL.
- `edge.timeoutMs`: 요청 타임아웃 재정의 (ms).

## 모델 기반 재정의 (기본값 on)

기본적으로 모델은 단일 응답에 대한 TTS 지시문을 내보낼 **수 있습니다**.
`messages.tts.auto`가 `tagged`인 경우, 이러한 지시문은 오디오를 트리거하는 데 필요합니다.

활성화되면 모델은 `[[tts:...]]` 지시문을 내보내 단일 응답의 음성을 재정의하고, 선택적 `[[tts:text]]...[[/tts:text]]` 블록을 제공하여 오디오에만 나타나야 하는 표현적인 태그 (웃음, 노래 큐 등)를 제공할 수 있습니다.

응답 페이로드 예제:

```
Here you go.

[[tts:provider=elevenlabs voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

사용 가능한 지시문 키 (활성화된 경우):

- `provider` (`openai` | `elevenlabs` | `edge`)
- `voice` (OpenAI 음성) 또는 `voiceId` (ElevenLabs)
- `model` (OpenAI TTS 모델 또는 ElevenLabs 모델 id)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

모든 모델 재정의 비활성화:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

선택적 허용 목록 (태그를 활성화한 상태에서 특정 재정의 비활성화):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: false,
        allowSeed: false,
      },
    },
  },
}
```

## 사용자별 설정

슬래시 명령어는 로컬 재정의를 `prefsPath`에 작성합니다 (기본값: `~/.openclaw/settings/tts.json`, `OPENCLAW_TTS_PREFS` 또는 `messages.tts.prefsPath`로 재정의).

저장된 필드:

- `enabled`
- `provider`
- `maxLength` (요약 임계값; 기본값 1500자)
- `summarize` (기본값 `true`)

이들은 해당 호스트의 `messages.tts.*`를 재정의합니다.

## 출력 형식 (고정)

- **Telegram**: Opus 음성 메모 (ElevenLabs의 `opus_48000_64`, OpenAI의 `opus`).
  - 48kHz / 64kbps는 좋은 음성 메모 트레이드오프이며 둥근 버블에 필요합니다.
- **기타 채널**: MP3 (ElevenLabs의 `mp3_44100_128`, OpenAI의 `mp3`).
  - 44.1kHz / 128kbps는 음성 명료도를 위한 기본 균형입니다.
- **Edge TTS**: `edge.outputFormat` 사용 (기본값 `audio-24khz-48kbitrate-mono-mp3`).
  - `node-edge-tts`는 `outputFormat`을 허용하지만, Edge 서비스에서 모든 형식을 사용할 수 있는 것은 아닙니다.
  - 출력 형식 값은 Microsoft Speech 출력 형식을 따릅니다 (Ogg/WebM Opus 포함).
  - Telegram `sendVoice`는 OGG/MP3/M4A를 허용합니다. 보장된 Opus 음성 메모가 필요한 경우 OpenAI/ElevenLabs를 사용하세요.
  - 설정된 Edge 출력 형식이 실패하면 OpenClaw는 MP3로 재시도합니다.

OpenAI/ElevenLabs 형식은 고정되어 있습니다. Telegram은 음성 메모 UX를 위해 Opus를 기대합니다.

## 자동 TTS 동작

활성화되면 OpenClaw는:

- 응답에 이미 미디어 또는 `MEDIA:` 지시문이 포함된 경우 TTS를 건너뜁니다.
- 매우 짧은 응답 (< 10자)을 건너뜁니다.
- 활성화된 경우 `agents.defaults.model.primary` (또는 `summaryModel`)를 사용하여 긴 응답을 요약합니다.
- 생성된 오디오를 응답에 첨부합니다.

응답이 `maxLength`를 초과하고 요약이 꺼져 있거나 (또는 요약 모델에 대한 API 키가 없는 경우) 오디오가 건너뛰고 일반 텍스트 응답이 전송됩니다.

## 플로우 다이어그램

```
응답 -> TTS 활성화?
  아니요  -> 텍스트 전송
  예 -> 미디어 / MEDIA: / 짧음?
          예 -> 텍스트 전송
          아니요  -> 길이 > 제한?
                   아니요  -> TTS -> 오디오 첨부
                   예 -> 요약 활성화?
                            아니요  -> 텍스트 전송
                            예 -> 요약 (summaryModel 또는 agents.defaults.model.primary)
                                      -> TTS -> 오디오 첨부
```

## 슬래시 명령어 사용

단일 명령어가 있습니다: `/tts`.
활성화 세부 정보는 [슬래시 명령어](/tools/slash-commands)를 참조하세요.

Discord 참고: `/tts`는 내장 Discord 명령어이므로 OpenClaw는 `/voice`를 네이티브 명령어로 등록합니다. 텍스트 `/tts ...`는 여전히 작동합니다.

```
/tts off
/tts always
/tts inbound
/tts tagged
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

참고사항:

- 명령어는 승인된 발신자가 필요합니다 (허용 목록/소유자 규칙이 여전히 적용됨).
- `commands.text` 또는 네이티브 명령어 등록이 활성화되어야 합니다.
- `off|always|inbound|tagged`는 세션별 토글입니다 (`/tts on`은 `/tts always`의 별칭).
- `limit` 및 `summary`는 메인 설정이 아닌 로컬 설정에 저장됩니다.
- `/tts audio`는 일회성 오디오 응답을 생성합니다 (TTS를 켜지 않음).

## 에이전트 도구

`tts` 도구는 텍스트를 음성으로 변환하고 `MEDIA:` 경로를 반환합니다. 결과가 Telegram 호환인 경우, 도구는 `[[audio_as_voice]]`를 포함하여 Telegram이 음성 버블을 보내도록 합니다.

## 게이트웨이 RPC

게이트웨이 메서드:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

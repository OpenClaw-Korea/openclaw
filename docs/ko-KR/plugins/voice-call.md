---
summary: "음성 통화 플러그인: Twilio/Telnyx/Plivo를 통한 발신 및 수신 통화 (플러그인 설치 + 설정 + CLI)"
read_when:
  - OpenClaw에서 발신 음성 통화를 진행하려고 할 때
  - voice-call 플러그인을 설정하거나 개발할 때
title: "음성 통화 플러그인"
---

# 음성 통화 (플러그인)

플러그인을 통한 OpenClaw의 음성 통화입니다. 발신 알림 및 수신 정책이 있는 다중 턴 대화를 지원합니다.

현재 지원 프로바이더:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (개발/네트워크 없음)

기본 개념:

- 플러그인 설치
- 게이트웨이 재시작
- `plugins.entries.voice-call.config`에서 설정
- `openclaw voicecall ...` 또는 `voice_call` 도구 사용

## 실행 위치 (로컬 vs 원격)

음성 통화 플러그인은 **게이트웨이 프로세스 내에서** 실행합니다.

원격 게이트웨이를 사용하는 경우 플러그인을 **게이트웨이를 실행하는 머신에** 설치하고 설정한 다음 게이트웨이를 재시작하여 로드합니다.

## 설치

### 옵션 A: npm에서 설치 (권장)

```bash
openclaw plugins install @openclaw/voice-call
```

설치 후 게이트웨이를 재시작합니다.

### 옵션 B: 로컬 폴더에서 설치 (개발, 복사 없음)

```bash
openclaw plugins install ./extensions/voice-call
cd ./extensions/voice-call && pnpm install
```

설치 후 게이트웨이를 재시작합니다.

## 설정

`plugins.entries.voice-call.config` 아래에서 설정합니다:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // 또는 "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // 웹훅 서버
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // 공개 노출 (하나 선택)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            streamPath: "/voice/stream",
          },
        },
      },
    },
  },
}
```

참고사항:

- Twilio/Telnyx는 **공개적으로 접근 가능한** 웹훅 URL이 필요합니다.
- Plivo는 **공개적으로 접근 가능한** 웹훅 URL이 필요합니다.
- `mock`은 로컬 개발 프로바이더입니다 (네트워크 호출 없음).
- `skipSignatureVerification`은 로컬 테스트 전용입니다.
- ngrok 무료 플랜을 사용하는 경우 `publicUrl`을 정확한 ngrok URL로 설정합니다. 서명 검증은 항상 적용됩니다.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true`는 `tunnel.provider="ngrok"`이고 `serve.bind`가 로컬 루프백(ngrok 로컬 에이전트)일 때만 **유효하지 않은** Twilio 웹훅 서명을 허용합니다. 로컬 개발 전용입니다.
- Ngrok 무료 플랜 URL은 변경되거나 인터스티셜 동작이 추가될 수 있습니다. `publicUrl`이 변경되면 Twilio 서명이 실패합니다. 프로덕션의 경우 안정적인 도메인 또는 Tailscale funnel을 선호합니다.

## 통화용 TTS

음성 통화는 스트리밍 음성을 위해 핵심 `messages.tts` 설정(OpenAI 또는 ElevenLabs)을 사용합니다. 플러그인 설정에서 **동일한 형태로** 재정의할 수 있습니다. 이는 `messages.tts`와 깊은 병합됩니다.

```json5
{
  tts: {
    provider: "elevenlabs",
    elevenlabs: {
      voiceId: "pMsXgVXv3BLzUgSXRplE",
      modelId: "eleven_multilingual_v2",
    },
  },
}
```

참고사항:

- **Edge TTS는 음성 통화에서 무시됩니다** (전화 오디오는 PCM이 필요하며, Edge 출력은 신뢰할 수 없습니다).
- Twilio 미디어 스트리밍이 활성화되면 핵심 TTS가 사용되고, 그렇지 않으면 통화는 프로바이더 기본 음성으로 폴백됩니다.

### 추가 예제

핵심 TTS만 사용 (재정의 없음):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      openai: { voice: "alloy" },
    },
  },
}
```

통화 전용으로 ElevenLabs로 재정의 (다른 곳에서는 핵심 기본값 유지):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            elevenlabs: {
              apiKey: "elevenlabs_key",
              voiceId: "pMsXgVXv3BLzUgSXRplE",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

통화용 OpenAI 모델만 재정의 (깊은 병합 예제):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            openai: {
              model: "gpt-4o-mini-tts",
              voice: "marin",
            },
          },
        },
      },
    },
  },
}
```

## 수신 통화

수신 정책은 기본값으로 `disabled`입니다. 수신 통화를 활성화하려면 다음을 설정합니다:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "안녕하세요! 무엇을 도와드릴까요?",
}
```

자동 응답은 에이전트 시스템을 사용합니다. 다음으로 조정합니다:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "OpenClaw에서 보냅니다"
openclaw voicecall continue --call-id <id> --message "질문 있으신가요?"
openclaw voicecall speak --call-id <id> --message "잠시만요"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall expose --mode funnel
```

## 에이전트 도구

도구명: `voice_call`

작업:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

이 저장소는 `skills/voice-call/SKILL.md`에서 일치하는 스킬 문서를 제공합니다.

## 게이트웨이 RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

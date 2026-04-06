---
summary: "프로바이더 + CLI 폴백을 사용한 인바운드 이미지/오디오/비디오 이해 (선택사항)"
read_when:
  - 미디어 이해 기능을 설계하거나 리팩토링할 때
  - 인바운드 오디오/비디오/이미지 전처리를 조정할 때
title: "미디어 이해"
---

# 미디어 이해 (인바운드) — 2026-01-17

OpenClaw는 회신 파이프라인이 실행되기 전에 **인바운드 미디어**(이미지/오디오/비디오)를 요약할 수 있습니다. 로컬 도구나 프로바이더 키를 사용할 수 있는지 자동으로 감지하며, 이를 비활성화하거나 커스터마이징할 수 있습니다. 이해 기능이 비활성화되어 있으면 모델은 여전히 원본 파일/URL을 일반적인 방식으로 받습니다.

## 목표

- 선택사항: 인바운드 미디어를 짧은 텍스트로 미리 처리하여 더 빠른 라우팅과 더 나은 명령 파싱 제공합니다.
- 원본 미디어 전달을 모델에 항상 보존합니다.
- **프로바이더 API**와 **CLI 폴백**을 지원합니다.
- 순서가 있는 폴백을 통해 여러 모델을 사용할 수 있습니다 (오류/크기/타임아웃).

## 고수준 동작

1. 인바운드 첨부파일(`MediaPaths`, `MediaUrls`, `MediaTypes`)을 수집합니다.
2. 활성화된 각 기능(이미지/오디오/비디오)에 대해 정책에 따라 첨부파일을 선택합니다 (기본값: **첫 번째**).
3. 첫 번째 적격 모델 항목을 선택합니다 (크기 + 기능 + 인증).
4. 모델이 실패하거나 미디어가 너무 크면 **다음 항목으로 폴백합니다**.
5. 성공 시:
   - `Body`는 `[Image]`, `[Audio]` 또는 `[Video]` 블록이 됩니다.
   - 오디오는 `{{Transcript}}`를 설정합니다. 명령 파싱은 캡션이 있을 때 캡션 텍스트를 사용하고, 캡션이 없으면 트랜스크립트를 사용합니다.
   - 캡션은 블록 내부에 `User text:` 로 보존됩니다.

이해에 실패하거나 비활성화되어 있으면 **회신 흐름은 원본 본문과 첨부파일로 계속됩니다**.

## 설정 개요

`tools.media`는 **공유 모델**과 기능별 오버라이드를 지원합니다:

- `tools.media.models`: 공유 모델 목록 (`capabilities`로 제어).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - 기본값 (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - 프로바이더 오버라이드 (`baseUrl`, `headers`, `providerOptions`)
  - `tools.media.audio.providerOptions.deepgram`을 통한 Deepgram 오디오 옵션
  - 선택사항 **기능별 `models` 목록** (공유 모델보다 우선)
  - `attachments` 정책 (`mode`, `maxAttachments`, `prefer`)
  - `scope` (채널/chatType/세션 키로 선택사항 제어)
- `tools.media.concurrency`: 최대 동시 기능 실행 수 (기본값 **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### 모델 항목

각 `models[]` 항목은 **프로바이더** 또는 **CLI**일 수 있습니다:

```json5
{
  type: "provider", // 생략하면 기본값
  provider: "openai",
  model: "gpt-5.2",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // 선택사항, 멀티모달 항목에 사용됨
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

CLI 템플릿은 다음도 사용할 수 있습니다:

- `{{MediaDir}}` (미디어 파일이 있는 디렉토리)
- `{{OutputDir}}` (이 실행을 위해 생성된 임시 디렉토리)
- `{{OutputBase}}` (임시 파일 기본 경로, 확장자 없음)

## 기본값 및 제한

권장 기본값:

- `maxChars`: 이미지/비디오의 경우 **500** (짧고 명령 친화적)
- `maxChars`: 오디오의 경우 **설정하지 않음** (제한을 설정하지 않으면 전체 트랜스크립트)
- `maxBytes`:
  - 이미지: **10MB**
  - 오디오: **20MB**
  - 비디오: **50MB**

규칙:

- 미디어가 `maxBytes`를 초과하면 해당 모델을 건너뛰고 **다음 모델을 시도합니다**.
- 모델이 `maxChars`보다 많이 반환하면 출력이 잘립니다.
- `prompt`는 기본적으로 간단한 "Describe the {media}." 및 `maxChars` 지침으로 설정됩니다 (이미지/비디오만 해당).
- `<capability>.enabled: true`이지만 모델이 설정되지 않은 경우 OpenClaw는 기능을 지원하는 **활성 회신 모델**을 시도합니다.

### 미디어 이해 자동 감지 (기본값)

`tools.media.<capability>.enabled`이 `false`로 설정되지 **않았고** 모델을 설정하지 않은 경우 OpenClaw는 다음 순서대로 자동 감지하고 **작동하는 첫 번째 옵션에서 중지합니다**:

1. **로컬 CLI** (오디오만 해당; 설치된 경우)
   - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR`에 encoder/decoder/joiner/tokens 필요)
   - `whisper-cli` (`whisper-cpp`; `WHISPER_CPP_MODEL` 또는 번들된 tiny 모델 사용)
   - `whisper` (Python CLI; 모델 자동 다운로드)
2. **Gemini CLI** (`gemini`)를 사용한 `read_many_files`
3. **프로바이더 키**
   - 오디오: OpenAI → Groq → Deepgram → Google
   - 이미지: OpenAI → Anthropic → Google → MiniMax
   - 비디오: Google

자동 감지를 비활성화하려면 다음을 설정합니다:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

참고: 이진 감지는 macOS/Linux/Windows에서 최선의 노력이므로 CLI가 `PATH`에 있는지 확인합니다 (`~` 확장). 전체 명령 경로로 명시적 CLI 모델을 설정할 수도 있습니다.

## 기능 (선택사항)

`capabilities`를 설정하면 해당 미디어 유형에만 항목이 실행됩니다. 공유 목록의 경우 OpenClaw는 기본값을 유추할 수 있습니다:

- `openai`, `anthropic`, `minimax`: **이미지**
- `google` (Gemini API): **이미지 + 오디오 + 비디오**
- `groq`: **오디오**
- `deepgram`: **오디오**

CLI 항목의 경우 **`capabilities`를 명시적으로 설정**하여 예상치 못한 일치를 피합니다.
`capabilities`를 생략하면 항목이 나타나는 목록에 적격입니다.

## 프로바이더 지원 행렬 (OpenClaw 통합)

| 기능   | 프로바이더 통합                                   | 참고사항                                           |
| ------ | ------------------------------------------------- | -------------------------------------------------- |
| 이미지 | OpenAI / Anthropic / Google / `pi-ai`를 통한 기타 | 레지스트리의 모든 이미지 기능 모델이 작동합니다.   |
| 오디오 | OpenAI, Groq, Deepgram, Google                    | 프로바이더 트랜스크립션 (Whisper/Deepgram/Gemini). |
| 비디오 | Google (Gemini API)                               | 프로바이더 비디오 이해.                            |

## 권장 프로바이더

**이미지**

- 이미지를 지원하는 활성 모델을 선호합니다.
- 좋은 기본값: `openai/gpt-5.2`, `anthropic/claude-opus-4-5`, `google/gemini-3-pro-preview`.

**오디오**

- `openai/gpt-4o-mini-transcribe`, `groq/whisper-large-v3-turbo` 또는 `deepgram/nova-3`.
- CLI 폴백: `whisper-cli` (whisper-cpp) 또는 `whisper`.
- Deepgram 설정: [Deepgram (오디오 트랜스크립션)](/providers/deepgram).

**비디오**

- `google/gemini-3-flash-preview` (빠름), `google/gemini-3-pro-preview` (더 풍부함).
- CLI 폴백: `gemini` CLI (비디오/오디오에 `read_file` 지원).

## 첨부파일 정책

기능별 `attachments`는 처리되는 첨부파일을 제어합니다:

- `mode`: `first` (기본값) 또는 `all`
- `maxAttachments`: 처리된 개수 제한 (기본값 **1**)
- `prefer`: `first`, `last`, `path`, `url`

`mode: "all"`인 경우 출력은 `[Image 1/2]`, `[Audio 2/2]` 등으로 레이블이 지정됩니다.

## 설정 예제

### 1) 공유 모델 목록 + 오버라이드

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.2", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) 오디오 + 비디오만 (이미지 비활성화)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) 선택사항 이미지 이해

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.2" },
          { provider: "anthropic", model: "claude-opus-4-5" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) 멀티모달 단일 항목 (명시적 기능)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## 상태 출력

미디어 이해가 실행되면 `/status`에는 짧은 요약 줄이 포함됩니다:

```
📎 Media: image ok (openai/gpt-5.2) · audio skipped (maxBytes)
```

이것은 기능별 결과와 해당하는 경우 선택한 프로바이더/모델을 표시합니다.

## 참고사항

- 이해는 **최선의 노력**입니다. 오류는 회신을 차단하지 않습니다.
- 이해 기능이 비활성화되어 있어도 첨부파일은 여전히 모델에 전달됩니다.
- `scope`를 사용하여 이해 실행 위치를 제한합니다 (예: DM만).

## 관련 문서

- [설정](/gateway/configuration)
- [이미지 및 미디어 지원](/nodes/images)

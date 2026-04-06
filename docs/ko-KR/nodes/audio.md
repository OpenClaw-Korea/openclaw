---
summary: "인바운드 오디오/음성 메모가 다운로드, 전사 및 응답에 삽입되는 방법"
read_when:
  - 오디오 전사 또는 미디어 처리 변경
title: "오디오 및 음성 메모"
---

# 오디오 / 음성 메모 — 2026-01-17

## 작동 방식

- **미디어 이해 (오디오)**: 오디오 이해가 활성화되거나 자동 감지된 경우, OpenClaw는:
  1. 첫 번째 오디오 첨부 파일(로컬 경로 또는 URL)을 찾고 필요한 경우 다운로드합니다.
  2. 각 모델 항목으로 전송하기 전에 `maxBytes`를 적용합니다.
  3. 순서대로 첫 번째 적격 모델 항목을 실행합니다 (프로바이더 또는 CLI).
  4. 실패하거나 건너뛰면(크기/타임아웃), 다음 항목을 시도합니다.
  5. 성공하면 `Body`를 `[Audio]` 블록으로 교체하고 `{{Transcript}}`를 설정합니다.
- **명령어 파싱**: 전사가 성공하면 `CommandBody`/`RawBody`가 전사본으로 설정되어 슬래시 명령어가 여전히 작동합니다.
- **상세 로깅**: `--verbose`에서 전사가 실행될 때와 본문을 교체할 때 로그를 기록합니다.

## 자동 감지 (기본값)

**모델을 설정하지 않고** `tools.media.audio.enabled`가 `false`로 설정되지 **않은** 경우,
OpenClaw는 다음 순서로 자동 감지하고 첫 번째 작동 옵션에서 중지합니다:

1. **로컬 CLI** (설치된 경우)
   - `sherpa-onnx-offline` (encoder/decoder/joiner/tokens가 있는 `SHERPA_ONNX_MODEL_DIR` 필요)
   - `whisper-cli` (`whisper-cpp`에서; `WHISPER_CPP_MODEL` 또는 번들된 tiny 모델 사용)
   - `whisper` (Python CLI; 모델을 자동으로 다운로드)
2. **Gemini CLI** (`gemini`) `read_many_files` 사용
3. **프로바이더 키** (OpenAI → Groq → Deepgram → Google)

자동 감지를 비활성화하려면 `tools.media.audio.enabled: false`를 설정하세요.
사용자 지정하려면 `tools.media.audio.models`를 설정하세요.
참고: 바이너리 감지는 macOS/Linux/Windows에서 최선의 노력입니다. CLI가 `PATH`에 있는지 확인하세요 (`~` 확장), 또는 전체 명령 경로로 명시적 CLI 모델을 설정하세요.

## 설정 예시

### 프로바이더 + CLI 대체 (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### 범위 게이팅이 있는 프로바이더 전용

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### 프로바이더 전용 (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## 참고사항 및 제한사항

- 프로바이더 인증은 표준 모델 인증 순서를 따릅니다 (인증 프로필, 환경 변수, `models.providers.*.apiKey`).
- Deepgram은 `provider: "deepgram"`이 사용될 때 `DEEPGRAM_API_KEY`를 가져옵니다.
- Deepgram 설정 세부사항: [Deepgram (오디오 전사)](/providers/deepgram).
- 오디오 프로바이더는 `tools.media.audio`를 통해 `baseUrl`, `headers`, `providerOptions`를 재정의할 수 있습니다.
- 기본 크기 제한은 20MB(`tools.media.audio.maxBytes`)입니다. 초과 크기 오디오는 해당 모델에 대해 건너뛰고 다음 항목을 시도합니다.
- 오디오의 기본 `maxChars`는 **설정되지 않음**(전체 전사본)입니다. 출력을 자르려면 `tools.media.audio.maxChars` 또는 항목별 `maxChars`를 설정하세요.
- OpenAI 자동 기본값은 `gpt-4o-mini-transcribe`입니다. 더 높은 정확도를 위해 `model: "gpt-4o-transcribe"`를 설정하세요.
- 여러 음성 메모를 처리하려면 `tools.media.audio.attachments`를 사용하세요 (`mode: "all"` + `maxAttachments`).
- 전사본은 템플릿에 `{{Transcript}}`로 사용 가능합니다.
- CLI stdout은 제한됩니다 (5MB). CLI 출력을 간결하게 유지하세요.

## 주의사항

- 범위 규칙은 첫 번째 일치가 우선합니다. `chatType`은 `direct`, `group` 또는 `room`으로 정규화됩니다.
- CLI가 0으로 종료하고 일반 텍스트를 출력하는지 확인하세요. JSON은 `jq -r .text`를 통해 가공해야 합니다.
- 응답 큐를 차단하지 않도록 타임아웃을 합리적으로 유지하세요 (`timeoutSeconds`, 기본값 60초).

---
summary: "CLI 백엔드: API 프로바이더 실패 시 텍스트 전용 로컬 AI CLI 폴백"
read_when:
  - API 프로바이더가 실패할 때 안정적인 폴백을 원하시는 경우
  - Claude Code CLI 또는 기타 로컬 AI CLI를 실행 중이며 이를 재사용하고 싶은 경우
  - 도구 없이도 세션과 이미지를 지원하는 텍스트 전용 경로가 필요한 경우
title: "CLI 백엔드"
---

# CLI 백엔드 (폴백 런타임)

OpenClaw는 API 프로바이더가 다운되거나 속도 제한에 걸리거나 일시적으로 오작동할 때 **로컬 AI CLI**를 **텍스트 전용 폴백**으로 실행할 수 있습니다. 이는 의도적으로 보수적으로 설계되었습니다:

- **도구 비활성화** (도구 호출 없음)
- **텍스트 입력 → 텍스트 출력** (안정적)
- **세션 지원** (후속 턴이 일관성 있게 유지됨)
- **CLI가 이미지 경로를 수용하는 경우 이미지 전달 가능**

이는 주요 경로가 아닌 **안전 장치**로 설계되었습니다. 외부 API에 의존하지 않고 항상 작동하는 텍스트 응답을 원할 때 사용하세요.

## 초보자 친화적 빠른 시작

설정 없이도 Claude Code CLI를 사용할 수 있습니다(OpenClaw는 기본 제공 기본값을 포함합니다):

```bash
openclaw agent --message "hi" --model claude-cli/opus-4.5
```

Codex CLI도 기본적으로 작동합니다:

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.2-codex
```

게이트웨이가 launchd/systemd에서 실행되고 PATH가 최소한인 경우, 명령 경로만 추가하세요:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

완료되었습니다. CLI 자체를 넘어 키나 추가 인증 설정이 필요하지 않습니다.

## 폴백으로 사용하기

주요 모델이 실패할 때만 실행되도록 설정에서 CLI 백엔드를 폴백 목록에 추가하세요:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-5",
        fallbacks: ["claude-cli/opus-4.5"],
      },
      models: {
        "anthropic/claude-opus-4-5": { alias: "Opus" },
        "claude-cli/opus-4.5": {},
      },
    },
  },
}
```

참고 사항:

- `agents.defaults.models`를 사용하는 경우 (허용 목록), `claude-cli/...`를 포함해야 합니다.
- 주요 프로바이더가 실패하면 (인증, 속도 제한, 시간 초과), OpenClaw는 다음으로 CLI 백엔드를 시도합니다.

## 설정 개요

모든 CLI 백엔드는 다음 위치에 있습니다:

```
agents.defaults.cliBackends
```

각 항목은 **프로바이더 ID** (예: `claude-cli`, `my-cli`)로 키 지정됩니다.
프로바이더 ID는 모델 참조의 왼쪽 부분이 됩니다:

```
<provider>/<model>
```

### 예제 설정

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-5": "opus",
            "claude-sonnet-4-5": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## 작동 원리

1. **프로바이더 접두사 기반 백엔드 선택** (`claude-cli/...`).
2. **시스템 프롬프트 구성** (동일한 OpenClaw 프롬프트 + 워크스페이스 컨텍스트 사용).
3. **CLI 실행** (세션 ID 포함, 지원하는 경우)하여 기록이 일관성 있게 유지됩니다.
4. **출력 구문 분석** (JSON 또는 일반 텍스트)하여 최종 텍스트를 반환합니다.
5. **세션 ID 유지** (백엔드별로), 후속 턴이 동일한 CLI 세션을 재사용합니다.

## 세션

- CLI가 세션을 지원하는 경우, `sessionArg` (예: `--session-id`)를 설정하거나
  `sessionArgs` (플레이스홀더 `{sessionId}`)를 설정합니다. ID를 여러 플래그에 삽입해야 하는 경우입니다.
- CLI가 **재개 서브명령**을 사용하는 경우 다른 플래그로, `resumeArgs` (재개 시 `args` 대체)를 설정하고
  선택적으로 `resumeOutput` (JSON이 아닌 재개)을 설정합니다.
- `sessionMode`:
  - `always`: 항상 세션 ID를 전송합니다 (저장되지 않은 경우 새 UUID).
  - `existing`: 이전에 저장된 세션 ID가 있는 경우에만 전송합니다.
  - `none`: 세션 ID를 절대 전송하지 않습니다.

## 이미지 (전달)

CLI가 이미지 경로를 수용하는 경우 `imageArg`를 설정하세요:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw는 base64 이미지를 임시 파일에 작성합니다. `imageArg`가 설정되면
해당 경로가 CLI 인수로 전달됩니다. `imageArg`가 없으면, OpenClaw는
파일 경로를 프롬프트에 추가합니다 (경로 주입). 이는 일반 경로에서
로컬 파일을 자동 로드하는 CLI에 충분합니다 (Claude Code CLI 동작).

## 입력 / 출력

- `output: "json"` (기본값)은 JSON을 구문 분석하고 텍스트 + 세션 ID를 추출하려고 시도합니다.
- `output: "jsonl"`은 JSONL 스트림을 구문 분석합니다 (Codex CLI `--json`)하고 마지막 에이전트 메시지와
  `thread_id` (있는 경우)를 추출합니다.
- `output: "text"`는 stdout을 최종 응답으로 취급합니다.

입력 모드:

- `input: "arg"` (기본값)은 프롬프트를 마지막 CLI 인수로 전달합니다.
- `input: "stdin"`은 프롬프트를 stdin을 통해 보냅니다.
- 프롬프트가 매우 길고 `maxPromptArgChars`가 설정된 경우, stdin이 사용됩니다.

## 기본값 (기본 제공)

OpenClaw는 `claude-cli`에 대한 기본값을 포함합니다:

- `command: "claude"`
- `args: ["-p", "--output-format", "json", "--dangerously-skip-permissions"]`
- `resumeArgs: ["-p", "--output-format", "json", "--dangerously-skip-permissions", "--resume", "{sessionId}"]`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

OpenClaw는 또한 `codex-cli`에 대한 기본값을 포함합니다:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

필요한 경우에만 재정의하세요 (일반적: 절대 `command` 경로).

## 제한 사항

- **OpenClaw 도구 없음** (CLI 백엔드는 도구 호출을 받지 않습니다). 일부 CLI는 여전히 자체 에이전트 도구를 실행할 수 있습니다.
- **스트리밍 없음** (CLI 출력이 수집된 후 반환됩니다).
- **구조화된 출력**은 CLI의 JSON 형식에 따라 다릅니다.
- **Codex CLI 세션**은 텍스트 출력을 통해 재개됩니다 (JSONL 없음). 초기 `--json` 실행보다 덜 구조화되어 있습니다. OpenClaw 세션은 정상적으로 작동합니다.

## 문제 해결

- **CLI를 찾을 수 없음**: `command`를 전체 경로로 설정하세요.
- **잘못된 모델 이름**: `modelAliases`를 사용하여 `provider/model` → CLI 모델을 매핑하세요.
- **세션 연속성 없음**: `sessionArg`가 설정되어 있고 `sessionMode`가 `none`이 아닌지 확인하세요 (Codex CLI는 현재 JSON 출력으로 재개할 수 없습니다).
- **이미지 무시됨**: `imageArg`를 설정하세요 (그리고 CLI가 파일 경로를 지원하는지 확인하세요).

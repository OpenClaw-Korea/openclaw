---
summary: "모델 CLI: list, set, 별칭, 폴백, scan, status"
read_when:
  - 모델 CLI 추가 또는 수정 (models list/set/scan/aliases/fallbacks)
  - 모델 폴백 동작 또는 선택 UX 변경
  - 모델 스캔 프로브 업데이트 (도구/이미지)
title: "모델 CLI"
---

# 모델 CLI

인증 프로필 순환, 쿨다운 및 폴백과의 상호 작용은 [/concepts/model-failover](/concepts/model-failover)를 참조하세요. 빠른 프로바이더 개요 + 예제: [/concepts/model-providers](/concepts/model-providers)

## 모델 선택 작동 방식

OpenClaw는 다음 순서로 모델을 선택합니다:

1. **기본** 모델 (`agents.defaults.model.primary` 또는 `agents.defaults.model`)
2. `agents.defaults.model.fallbacks`의 **폴백** (순서대로)
3. **프로바이더 인증 폴백**은 다음 모델로 이동하기 전에 프로바이더 내에서 발생합니다.

관련:

- `agents.defaults.models`는 OpenClaw가 사용할 수 있는 모델의 허용 목록/카탈로그입니다 (별칭 포함).
- `agents.defaults.imageModel`은 기본 모델이 이미지를 수락할 수 없는 **경우에만** 사용됩니다.
- 에이전트별 기본값은 `agents.list[].model` 및 바인딩을 통해 `agents.defaults.model`을 오버라이드할 수 있습니다 ([/concepts/multi-agent](/concepts/multi-agent) 참조).

## 빠른 모델 선택 (일화)

- **GLM**: 코딩/도구 호출에 약간 더 좋습니다.
- **MiniMax**: 쓰기 및 분위기에 더 좋습니다.

## 설정 마법사 (권장)

설정을 수동으로 편집하지 않으려면 온보딩 마법사를 실행합니다:

```bash
openclaw onboard
```

**OpenAI Code (Codex) 구독** (OAuth) 및 **Anthropic** (API 키 권장; `claude setup-token`도 지원됨)을 포함한 일반적인 프로바이더에 대한 모델 + 인증을 설정할 수 있습니다.

## 설정 키 (개요)

- `agents.defaults.model.primary` 및 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 및 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.models` (허용 목록 + 별칭 + 프로바이더 매개변수)
- `models.providers` (`models.json`에 작성된 사용자 정의 프로바이더)

모델 참조는 소문자로 정규화됩니다. `z.ai/*`와 같은 프로바이더 별칭은 `zai/*`로 정규화됩니다.

프로바이더 설정 예제 (OpenCode Zen 포함)는 [/gateway/configuration](/gateway/configuration#opencode-zen-multi-model-proxy)에 있습니다.

## "모델이 허용되지 않음" (및 응답이 중지되는 이유)

`agents.defaults.models`가 설정된 경우, `/model` 및 세션 오버라이드에 대한 **허용 목록**이 됩니다. 사용자가 해당 허용 목록에 없는 모델을 선택하면 OpenClaw는 다음을 반환합니다:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

이는 일반 응답이 생성되기 **전에** 발생하므로 메시지가 "응답하지 않은" 것처럼 느껴질 수 있습니다. 수정은 다음 중 하나입니다:

- `agents.defaults.models`에 모델을 추가하거나
- 허용 목록을 지우거나 (`agents.defaults.models` 제거)
- `/model list`에서 모델을 선택합니다.

예제 허용 목록 설정:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-5" },
    models: {
      "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
      "anthropic/claude-opus-4-5": { alias: "Opus" },
    },
  },
}
```

## 채팅에서 모델 전환 (`/model`)

재시작 없이 현재 세션의 모델을 전환할 수 있습니다:

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model status
```

참고사항:

- `/model` (및 `/model list`)은 간결한 번호가 매겨진 선택기입니다 (모델 패밀리 + 사용 가능한 프로바이더).
- `/model <#>`는 해당 선택기에서 선택합니다.
- `/model status`는 상세 보기입니다 (인증 후보 및 설정된 경우 프로바이더 엔드포인트 `baseUrl` + `api` 모드).
- 모델 참조는 **첫 번째** `/`로 분할하여 파싱됩니다. `/model <ref>`를 입력할 때 `provider/model`을 사용합니다.
- 모델 ID 자체에 `/`가 포함된 경우 (OpenRouter 스타일), 프로바이더 접두사를 포함해야 합니다 (예: `/model openrouter/moonshotai/kimi-k2`).
- 프로바이더를 생략하면 OpenClaw는 입력을 별칭 또는 **기본 프로바이더**용 모델로 처리합니다 (모델 ID에 `/`가 없는 경우에만 작동).

전체 명령 동작/설정: [슬래시 명령](/tools/slash-commands)

## CLI 명령

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (하위 명령 없음)는 `models status`의 단축키입니다.

### `models list`

기본적으로 설정된 모델을 표시합니다. 유용한 플래그:

- `--all`: 전체 카탈로그
- `--local`: 로컬 프로바이더만
- `--provider <name>`: 프로바이더로 필터링
- `--plain`: 한 줄에 하나의 모델
- `--json`: 머신 판독 가능한 출력

### `models status`

해결된 기본 모델, 폴백, 이미지 모델 및 설정된 프로바이더의 인증 개요를 표시합니다. 또한 인증 저장소에서 찾은 프로필에 대한 OAuth 만료 상태를 표시합니다 (기본적으로 24시간 이내에 경고). `--plain`은 해결된 기본 모델만 출력합니다. OAuth 상태는 항상 표시됩니다 (`--json` 출력에 포함됨). 설정된 프로바이더에 자격 증명이 없는 경우, `models status`는 **Missing auth** 섹션을 출력합니다. JSON에는 `auth.oauth` (경고 창 + 프로필) 및 `auth.providers` (프로바이더당 유효 인증)가 포함됩니다. 자동화를 위해 `--check`를 사용합니다 (누락/만료 시 종료 `1`, 만료 중 시 `2`).

선호하는 Anthropic 인증은 Claude Code CLI setup-token입니다 (어디서나 실행 가능; 필요한 경우 게이트웨이 호스트에 붙여넣기):

```bash
claude setup-token
openclaw models status
```

## 스캐닝 (OpenRouter 무료 모델)

`openclaw models scan`은 OpenRouter의 **무료 모델 카탈로그**를 검사하고 선택적으로 도구 및 이미지 지원을 위해 모델을 프로브할 수 있습니다.

주요 플래그:

- `--no-probe`: 라이브 프로브 건너뛰기 (메타데이터만)
- `--min-params <b>`: 최소 매개변수 크기 (십억)
- `--max-age-days <days>`: 오래된 모델 건너뛰기
- `--provider <name>`: 프로바이더 접두사 필터
- `--max-candidates <n>`: 폴백 목록 크기
- `--set-default`: 첫 번째 선택 항목으로 `agents.defaults.model.primary` 설정
- `--set-image`: 첫 번째 이미지 선택 항목으로 `agents.defaults.imageModel.primary` 설정

프로빙에는 OpenRouter API 키가 필요합니다 (인증 프로필 또는 `OPENROUTER_API_KEY`에서). 키가 없으면 `--no-probe`를 사용하여 후보만 나열합니다.

스캔 결과는 다음 순서로 순위가 매겨집니다:

1. 이미지 지원
2. 도구 지연 시간
3. 컨텍스트 크기
4. 매개변수 수

입력

- OpenRouter `/models` 목록 (`:free` 필터)
- 인증 프로필 또는 `OPENROUTER_API_KEY`에서 OpenRouter API 키 필요 ([/environment](/environment) 참조)
- 선택적 필터: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- 프로브 제어: `--timeout`, `--concurrency`

TTY에서 실행하면 폴백을 대화식으로 선택할 수 있습니다. 비대화식 모드에서는 `--yes`를 전달하여 기본값을 수락합니다.

## 모델 레지스트리 (`models.json`)

`models.providers`의 사용자 정의 프로바이더는 에이전트 디렉토리 (기본값 `~/.openclaw/agents/<agentId>/models.json`) 아래의 `models.json`에 작성됩니다. 이 파일은 `models.mode`가 `replace`로 설정되지 않은 한 기본적으로 병합됩니다.

---
title: 샌드박스 vs 도구 정책 vs 상승된 권한
summary: "도구가 차단되는 이유: 샌드박스 런타임, 도구 허용/거부 정책, 상승된 권한 실행 게이트"
read_when: "'샌드박스 감옥' 오류가 나거나 도구/상승된 권한 거부를 보았을 때 변경할 정확한 설정 키를 알고 싶을 때 읽으세요."
status: active
---

# 샌드박스 vs 도구 정책 vs 상승된 권한

OpenClaw에는 세 가지 관련된 (하지만 다른) 제어 기능이 있습니다:

1. **샌드박스** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`)는 **도구가 실행되는 위치**(Docker vs 호스트)를 결정합니다.
2. **도구 정책** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`)는 **어떤 도구를 사용할 수 있는지/허용하는지**를 결정합니다.
3. **상승된 권한** (`tools.elevated.*`, `agents.list[].tools.elevated.*`)은 샌드박스 격리 상태일 때 호스트에서 실행하기 위한 **실행 전용 탈출구**입니다.

## 빠른 디버깅

inspector를 사용하여 OpenClaw가 _실제로_ 하는 일을 확인하세요:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

다음을 출력합니다:

- 효과적인 샌드박스 모드/범위/작업 공간 액세스
- 세션이 현재 샌드박스 격리 상태인지 여부 (메인 vs 비메인)
- 효과적인 샌드박스 도구 허용/거부 (그리고 에이전트/전역/기본값에서 온 것인지)
- 상승된 권한 게이트와 수정 키 경로

## 샌드박스: 도구가 실행되는 위치

샌드박싱은 `agents.defaults.sandbox.mode`로 제어됩니다:

- `"off"`: 모든 것이 호스트에서 실행됩니다.
- `"non-main"`: 비메인 세션만 샌드박스 격리됩니다 (그룹/채널의 일반적인 "예상 밖의" 상황).
- `"all"`: 모든 것이 샌드박스 격리됩니다.

전체 매트릭스 (범위, 작업 공간 마운트, 이미지)는 [샌드박싱](/gateway/sandboxing)을 참조하세요.

### 바인드 마운트 (보안 빠른 확인)

- `docker.binds`는 샌드박스 파일 시스템을 _관통합니다_: 마운트된 모든 것은 설정한 모드(`:ro` 또는 `:rw`)로 컨테이너 내부에서 보입니다.
- 모드를 생략하면 기본값은 읽기-쓰기입니다. 소스/시크릿의 경우 `:ro`를 선호하세요.
- `scope: "shared"`는 에이전트별 바인드를 무시합니다 (전역 바인드만 적용됩니다).
- `/var/run/docker.sock`을 바인드하면 효과적으로 샌드박스에 호스트 제어를 전달합니다. 의도적으로만 하세요.
- 작업 공간 액세스 (`workspaceAccess: "ro"`/`"rw"`)는 바인드 모드와 독립적입니다.

## 도구 정책: 어떤 도구가 존재/호출 가능한지

두 가지 계층이 중요합니다:

- **도구 프로필**: `tools.profile` 및 `agents.list[].tools.profile` (기본 허용 목록)
- **프로바이더 도구 프로필**: `tools.byProvider[provider].profile` 및 `agents.list[].tools.byProvider[provider].profile`
- **전역/에이전트별 도구 정책**: `tools.allow`/`tools.deny` 및 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **프로바이더 도구 정책**: `tools.byProvider[provider].allow/deny` 및 `agents.list[].tools.byProvider[provider].allow/deny`
- **샌드박스 도구 정책** (샌드박스 격리 상태일 때만 적용): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 및 `agents.list[].tools.sandbox.tools.*`

경험적 규칙:

- `deny`는 항상 우선합니다.
- `allow`가 비어있지 않으면 다른 모든 것은 차단된 것으로 처리됩니다.
- 도구 정책은 강제 정지입니다: `/exec`은 거부된 `exec` 도구를 재정의할 수 없습니다.
- `/exec`은 인증된 발신자에 대해서만 세션 기본값을 변경합니다. 도구 액세스를 부여하지 않습니다.
  프로바이더 도구 키는 `provider` (예: `google-antigravity`) 또는 `provider/model` (예: `openai/gpt-5.2`)을 허용합니다.

### 도구 그룹 (단축어)

도구 정책 (전역, 에이전트, 샌드박스)은 여러 도구로 확장되는 `group:*` 항목을 지원합니다:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

사용 가능한 그룹:

- `group:runtime`: `exec`, `bash`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: 모든 내장 OpenClaw 도구 (프로바이더 플러그인 제외)

## 상승된 권한: 실행 전용 "호스트에서 실행"

상승된 권한은 추가 도구를 부여하지 않습니다. `exec`에만 영향을 미칩니다.

- 샌드박스 격리 상태인 경우, `/elevated on` (또는 `elevated: true`가 있는 `exec`)은 호스트에서 실행합니다 (승인이 여전히 적용될 수 있습니다).
- `/elevated full`을 사용하여 세션의 exec 승인을 건너뛰세요.
- 이미 직접 실행 중인 경우, 상승된 권한은 효과적으로 작동하지 않습니다 (여전히 게이트됩니다).
- 상승된 권한은 **스킬 범위가 아니며** 도구 허용/거부를 재정의하지 않습니다.
- `/exec`은 상승된 권한과 별개입니다. 인증된 발신자에 대해서만 세션별 exec 기본값만 조정합니다.

게이트:

- 활성화: `tools.elevated.enabled` (선택적으로 `agents.list[].tools.elevated.enabled`)
- 발신자 허용 목록: `tools.elevated.allowFrom.<provider>` (선택적으로 `agents.list[].tools.elevated.allowFrom.<provider>`)

[상승된 권한 모드](/tools/elevated)를 참조하세요.

## 일반적인 "샌드박스 감옥" 수정

### "도구 X가 샌드박스 도구 정책으로 차단됨"

수정 키 (하나를 선택하세요):

- 샌드박스 비활성화: `agents.defaults.sandbox.mode=off` (또는 에이전트별 `agents.list[].sandbox.mode=off`)
- 샌드박스 내에서 도구 허용:
  - `tools.sandbox.tools.deny`에서 제거 (또는 에이전트별 `agents.list[].tools.sandbox.tools.deny`)
  - 또는 `tools.sandbox.tools.allow`에 추가 (또는 에이전트별 허용)

### "이건 메인이라고 생각했는데, 왜 샌드박스 격리되어 있나요?"

`"non-main"` 모드에서 그룹/채널 키는 _메인이 아닙니다_. 메인 세션 키(`sandbox explain`로 표시됨)를 사용하거나 모드를 `"off"`로 전환하세요.

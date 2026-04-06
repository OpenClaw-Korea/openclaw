---
summary: "OpenClaw 샌드박싱 작동 방식: 모드, 범위, 워크스페이스 액세스 및 이미지"
title: 샌드박싱
read_when: "샌드박싱에 대한 전용 설명이 필요하거나 agents.defaults.sandbox를 조정해야 하는 경우."
status: active
---

# 샌드박싱

OpenClaw는 피해 반경을 줄이기 위해 **Docker 컨테이너 내에서 도구를 실행**할 수 있습니다.
이는 **선택 사항**이며 설정 (`agents.defaults.sandbox` 또는 `agents.list[].sandbox`)에 의해 제어됩니다. 샌드박싱이 꺼져 있으면 도구는 호스트에서 실행됩니다.
게이트웨이는 호스트에 유지됩니다. 활성화된 경우 도구 실행은 격리된 샌드박스에서 실행됩니다.

이는 완벽한 보안 경계가 아니지만 모델이 잘못된 작업을 수행할 때 파일시스템 및 프로세스 액세스를 실질적으로 제한합니다.

## 샌드박스 격리 대상

- 도구 실행 (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` 등).
- 선택적 샌드박스 브라우저 (`agents.defaults.sandbox.browser`).
  - 기본적으로 샌드박스 브라우저는 브라우저 도구가 필요할 때 자동으로 시작됩니다 (CDP 연결 가능 보장).
    `agents.defaults.sandbox.browser.autoStart` 및 `agents.defaults.sandbox.browser.autoStartTimeoutMs`를 통해 구성합니다.
  - `agents.defaults.sandbox.browser.allowHostControl`은 샌드박스 세션이 호스트 브라우저를 명시적으로 대상으로 지정할 수 있게 합니다.
  - 선택적 허용 목록이 `target: "custom"`을 제어합니다: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

샌드박스 격리되지 않는 항목:

- 게이트웨이 프로세스 자체.
- 호스트에서 실행하도록 명시적으로 허용된 모든 도구 (예: `tools.elevated`).
  - **Elevated exec은 호스트에서 실행되며 샌드박싱을 우회합니다.**
  - 샌드박싱이 꺼져 있으면 `tools.elevated`는 실행을 변경하지 않습니다 (이미 호스트에서). [Elevated 모드](/tools/elevated) 참조.

## 모드

`agents.defaults.sandbox.mode`는 샌드박싱이 **언제** 사용되는지 제어합니다:

- `"off"`: 샌드박싱 없음.
- `"non-main"`: **non-main** 세션만 샌드박스 격리 (호스트에서 일반 채팅을 원하는 경우 기본값).
- `"all"`: 모든 세션이 샌드박스에서 실행됩니다.
  참고: `"non-main"`은 에이전트 ID가 아닌 `session.mainKey` (기본값 `"main"`)를 기반으로 합니다.
  그룹/채널 세션은 자체 키를 사용하므로 non-main으로 계산되어 샌드박스 격리됩니다.

## 범위

`agents.defaults.sandbox.scope`는 **몇 개의 컨테이너**가 생성되는지 제어합니다:

- `"session"` (기본값): 세션당 하나의 컨테이너.
- `"agent"`: 에이전트당 하나의 컨테이너.
- `"shared"`: 모든 샌드박스 세션이 공유하는 하나의 컨테이너.

## 워크스페이스 액세스

`agents.defaults.sandbox.workspaceAccess`는 **샌드박스가 볼 수 있는 것**을 제어합니다:

- `"none"` (기본값): 도구는 `~/.openclaw/sandboxes` 아래의 샌드박스 워크스페이스를 봅니다.
- `"ro"`: 에이전트 워크스페이스를 `/agent`에 읽기 전용으로 마운트합니다 (`write`/`edit`/`apply_patch` 비활성화).
- `"rw"`: 에이전트 워크스페이스를 `/workspace`에 읽기/쓰기로 마운트합니다.

인바운드 미디어는 활성 샌드박스 워크스페이스 (`media/inbound/*`)로 복사됩니다.
스킬 참고 사항: `read` 도구는 샌드박스 루트입니다. `workspaceAccess: "none"`일 때,
OpenClaw는 적격 스킬을 샌드박스 워크스페이스 (`.../skills`)로 미러링하여 읽을 수 있도록 합니다. `"rw"`일 때, 워크스페이스 스킬은 `/workspace/skills`에서 읽을 수 있습니다.

## 사용자 정의 바인드 마운트

`agents.defaults.sandbox.docker.binds`는 추가 호스트 디렉토리를 컨테이너에 마운트합니다.
형식: `host:container:mode` (예: `"/home/user/source:/source:rw"`).

전역 및 에이전트별 바인드는 **병합**됩니다 (대체되지 않음). `scope: "shared"` 아래에서는 에이전트별 바인드가 무시됩니다.

예제 (읽기 전용 소스 + docker 소켓):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/run/docker.sock:/var/run/docker.sock"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

보안 참고 사항:

- 바인드는 샌드박스 파일시스템을 우회합니다: 설정한 모드 (`:ro` 또는 `:rw`)로 호스트 경로를 노출합니다.
- 민감한 마운트 (예: `docker.sock`, 비밀, SSH 키)는 절대적으로 필요한 경우가 아니면 `:ro`여야 합니다.
- 워크스페이스에 대한 읽기 액세스만 필요한 경우 `workspaceAccess: "ro"`와 결합하세요. 바인드 모드는 독립적으로 유지됩니다.
- 바인드가 도구 정책 및 elevated exec와 상호 작용하는 방식은 [샌드박스 vs 도구 정책 vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)를 참조하세요.

## 이미지 + 설정

기본 이미지: `openclaw-sandbox:bookworm-slim`

한 번 빌드:

```bash
scripts/sandbox-setup.sh
```

참고: 기본 이미지에는 Node가 **포함되어 있지 않습니다**. 스킬에 Node (또는 기타 런타임)가 필요한 경우, 사용자 정의 이미지를 구워 사용하거나 `sandbox.docker.setupCommand`를 통해 설치하세요 (네트워크 송신 + 쓰기 가능한 루트 + 루트 사용자 필요).

샌드박스 브라우저 이미지:

```bash
scripts/sandbox-browser-setup.sh
```

기본적으로 샌드박스 컨테이너는 **네트워크 없이** 실행됩니다.
`agents.defaults.sandbox.docker.network`로 재정의합니다.

Docker 설치 및 컨테이너화된 게이트웨이 정보:
[Docker](/install/docker)

## setupCommand (일회성 컨테이너 설정)

`setupCommand`는 샌드박스 컨테이너가 생성된 후 **한 번** 실행됩니다 (매번 실행되지 않음).
`sh -lc`를 통해 컨테이너 내부에서 실행됩니다.

경로:

- 전역: `agents.defaults.sandbox.docker.setupCommand`
- 에이전트별: `agents.list[].sandbox.docker.setupCommand`

일반적인 함정:

- 기본 `docker.network`는 `"none"` (송신 없음)이므로 패키지 설치가 실패합니다.
- `readOnlyRoot: true`는 쓰기를 방지합니다. `readOnlyRoot: false`로 설정하거나 사용자 정의 이미지를 구워 사용하세요.
- `user`는 패키지 설치를 위해 루트여야 합니다 (`user` 생략 또는 `user: "0:0"` 설정).
- 샌드박스 exec은 호스트 `process.env`를 상속하지 **않습니다**. 스킬 API 키에 `agents.defaults.sandbox.docker.env` (또는 사용자 정의 이미지)를 사용하세요.

## 도구 정책 + 탈출구

도구 허용/거부 정책은 샌드박스 규칙 이전에 여전히 적용됩니다. 도구가 전역적으로 또는 에이전트별로 거부된 경우, 샌드박싱이 이를 되돌리지 않습니다.

`tools.elevated`는 호스트에서 `exec`를 실행하는 명시적 탈출구입니다.
`/exec` 지시문은 승인된 발신자에 대해서만 적용되고 세션별로 유지됩니다. `exec`를 완전히 비활성화하려면 도구 정책 거부를 사용하세요 ([샌드박스 vs 도구 정책 vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) 참조).

디버깅:

- `openclaw sandbox explain`을 사용하여 유효한 샌드박스 모드, 도구 정책 및 수정 설정 키를 검사합니다.
- "왜 차단되나요?" 멘탈 모델은 [샌드박스 vs 도구 정책 vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)를 참조하세요.
  잠금 상태로 유지하세요.

## 다중 에이전트 재정의

각 에이전트는 샌드박스 + 도구를 재정의할 수 있습니다:
`agents.list[].sandbox` 및 `agents.list[].tools` (샌드박스 도구 정책의 경우 `agents.list[].tools.sandbox.tools` 추가).
우선순위는 [다중 에이전트 샌드박스 & 도구](/multi-agent-sandbox-tools)를 참조하세요.

## 최소 활성화 예제

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## 관련 문서

- [샌드박스 설정](/gateway/configuration#agentsdefaults-sandbox)
- [다중 에이전트 샌드박스 & 도구](/multi-agent-sandbox-tools)
- [보안](/gateway/security)

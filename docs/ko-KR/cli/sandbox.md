---
title: 샌드박스 CLI
summary: "샌드박스 컨테이너 관리 및 유효 샌드박스 정책 검사"
read_when: "샌드박스 컨테이너를 관리하거나 샌드박스/도구 정책 동작을 디버깅하는 경우."
status: active
---

# 샌드박스 CLI

격리된 에이전트 실행을 위한 Docker 기반 샌드박스 컨테이너를 관리합니다.

## 개요

OpenClaw는 보안을 위해 격리된 Docker 컨테이너에서 에이전트를 실행할 수 있습니다. `sandbox` 명령은 업데이트나 설정 변경 후 이러한 컨테이너를 관리하는 데 도움이 됩니다.

## 명령

### `openclaw sandbox explain`

**유효한** 샌드박스 모드/범위/워크스페이스 액세스, 샌드박스 도구 정책 및 승격된 게이트를 검사합니다(수정 가능한 설정 키 경로 포함).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

모든 샌드박스 컨테이너를 상태 및 설정과 함께 나열합니다.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # 브라우저 컨테이너만 나열
openclaw sandbox list --json     # JSON 출력
```

**출력 포함 항목:**

- 컨테이너 이름 및 상태 (실행중/중지됨)
- Docker 이미지 및 설정 일치 여부
- 생성 시간 (생성 후 경과 시간)
- 유휴 시간 (마지막 사용 후 경과 시간)
- 연결된 세션/에이전트

### `openclaw sandbox recreate`

업데이트된 이미지/설정으로 재생성을 강제하기 위해 샌드박스 컨테이너를 제거합니다.

```bash
openclaw sandbox recreate --all                # 모든 컨테이너 재생성
openclaw sandbox recreate --session main       # 특정 세션
openclaw sandbox recreate --agent mybot        # 특정 에이전트
openclaw sandbox recreate --browser            # 브라우저 컨테이너만
openclaw sandbox recreate --all --force        # 확인 건너뛰기
```

**옵션:**

- `--all`: 모든 샌드박스 컨테이너 재생성
- `--session <key>`: 특정 세션의 컨테이너 재생성
- `--agent <id>`: 특정 에이전트의 컨테이너 재생성
- `--browser`: 브라우저 컨테이너만 재생성
- `--force`: 확인 프롬프트 건너뛰기

**중요:** 컨테이너는 다음에 에이전트를 사용할 때 자동으로 재생성됩니다.

## 사용 사례

### Docker 이미지 업데이트 후

```bash
# 새 이미지 풀
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# 새 이미지를 사용하도록 설정 업데이트
# 설정 편집: agents.defaults.sandbox.docker.image (또는 agents.list[].sandbox.docker.image)

# 컨테이너 재생성
openclaw sandbox recreate --all
```

### 샌드박스 설정 변경 후

```bash
# 설정 편집: agents.defaults.sandbox.* (또는 agents.list[].sandbox.*)

# 새 설정을 적용하기 위해 재생성
openclaw sandbox recreate --all
```

### setupCommand 변경 후

```bash
openclaw sandbox recreate --all
# 또는 특정 에이전트만:
openclaw sandbox recreate --agent family
```

### 특정 에이전트만

```bash
# 하나의 에이전트 컨테이너만 업데이트
openclaw sandbox recreate --agent alfred
```

## 왜 필요한가요?

**문제:** 샌드박스 Docker 이미지나 설정을 업데이트할 때:

- 기존 컨테이너는 이전 설정으로 계속 실행됩니다
- 컨테이너는 24시간 비활성 후에만 정리됩니다
- 정기적으로 사용되는 에이전트는 이전 컨테이너를 무기한 실행 상태로 유지합니다

**해결책:** `openclaw sandbox recreate`를 사용하여 이전 컨테이너를 강제로 제거합니다. 다음에 필요할 때 현재 설정으로 자동으로 재생성됩니다.

팁: 수동 `docker rm` 대신 `openclaw sandbox recreate`를 선호하세요. 게이트웨이의 컨테이너 명명 규칙을 사용하고 범위/세션 키가 변경될 때 불일치를 방지합니다.

## 설정

샌드박스 설정은 `~/.openclaw/openclaw.json`의 `agents.defaults.sandbox` 아래에 있습니다(에이전트별 오버라이드는 `agents.list[].sandbox`에 있음):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... 추가 Docker 옵션
        },
        "prune": {
          "idleHours": 24, // 24시간 유휴 후 자동 정리
          "maxAgeDays": 7, // 7일 후 자동 정리
        },
      },
    },
  },
}
```

## 관련 문서

- [샌드박스 문서](/ko-KR/gateway/sandboxing)
- [에이전트 설정](/ko-KR/concepts/agent-workspace)
- [Doctor 명령](/ko-KR/gateway/doctor) - 샌드박스 설정 확인

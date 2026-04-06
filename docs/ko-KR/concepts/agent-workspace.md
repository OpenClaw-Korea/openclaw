---
summary: "에이전트 워크스페이스: 위치, 레이아웃 및 백업 전략"
read_when:
  - 에이전트 워크스페이스 또는 파일 레이아웃 설명 필요 시
  - 에이전트 워크스페이스 백업 또는 마이그레이션 시
title: "에이전트 워크스페이스"
---

# 에이전트 워크스페이스

워크스페이스는 에이전트의 홈입니다. 파일 도구 및 워크스페이스 컨텍스트에 사용되는 유일한 작업 디렉토리입니다. 워크스페이스를 비공개로 유지하고 메모리처럼 취급하세요.

이는 설정, 자격 증명 및 세션을 저장하는 `~/.openclaw/`와 별개입니다.

**중요:** 워크스페이스는 **기본 cwd**이며, 완전한 샌드박스가 아닙니다. 도구는 워크스페이스에 대해 상대 경로를 해석하지만, 샌드박싱이 활성화되지 않은 한 절대 경로는 여전히 호스트의 다른 곳에 접근할 수 있습니다. 격리가 필요한 경우 [`agents.defaults.sandbox`](/gateway/sandboxing)를 사용하세요(그리고/또는 에이전트별 샌드박스 설정).
샌드박싱이 활성화되고 `workspaceAccess`가 `"rw"`가 아닌 경우, 도구는 호스트 워크스페이스가 아닌 `~/.openclaw/sandboxes` 아래의 샌드박스 워크스페이스에서 작동합니다.

## 기본 위치

- 기본값: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE`이 설정되어 있고 `"default"`가 아닌 경우, 기본값은
  `~/.openclaw/workspace-<profile>`이 됩니다.
- `~/.openclaw/openclaw.json`에서 재정의:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` 또는 `openclaw setup`은 `~/.openclaw/openclaw.json`이 없는 경우 워크스페이스를 생성하고 부트스트랩 파일을 초기화합니다.

이미 워크스페이스 파일을 직접 관리하는 경우, 부트스트랩 파일 생성을 비활성화할 수 있습니다:

```json5
{ agent: { skipBootstrap: true } }
```

## 추가 워크스페이스 폴더

이전 설치에서는 `~/openclaw`를 생성했을 수 있습니다. 여러 워크스페이스 디렉토리를 유지하면 한 번에 하나의 워크스페이스만 활성화되므로 인증 또는 상태 드리프트가 발생할 수 있습니다.

**권장 사항:** 단일 활성 워크스페이스를 유지하세요. 더 이상 추가 폴더를 사용하지 않는 경우 아카이브하거나 휴지통으로 이동하세요(예: `trash ~/openclaw`).
의도적으로 여러 워크스페이스를 유지하는 경우 `agents.defaults.workspace`가 활성 워크스페이스를 가리키는지 확인하세요.

`openclaw doctor`는 추가 워크스페이스 디렉토리를 감지하면 경고합니다.

## 워크스페이스 파일 맵 (각 파일의 의미)

OpenClaw가 워크스페이스 내부에서 기대하는 표준 파일은 다음과 같습니다:

- `AGENTS.md`
  - 에이전트를 위한 운영 지침 및 메모리 사용 방법.
  - 모든 세션 시작 시 로드됩니다.
  - 규칙, 우선순위 및 "행동 방식" 세부 정보를 위한 좋은 장소입니다.

- `SOUL.md`
  - 페르소나, 톤 및 경계.
  - 모든 세션에서 로드됩니다.

- `USER.md`
  - 사용자가 누구이며 어떻게 호칭할지.
  - 모든 세션에서 로드됩니다.

- `IDENTITY.md`
  - 에이전트의 이름, 분위기 및 이모지.
  - 부트스트랩 의식 중에 생성/업데이트됩니다.

- `TOOLS.md`
  - 로컬 도구 및 규칙에 대한 노트.
  - 도구 가용성을 제어하지 않으며, 안내일 뿐입니다.

- `HEARTBEAT.md`
  - 하트비트 실행을 위한 선택적 작은 체크리스트.
  - 토큰 소모를 피하기 위해 짧게 유지하세요.

- `BOOT.md`
  - 내부 훅이 활성화된 경우 게이트웨이 재시작 시 실행되는 선택적 시작 체크리스트.
  - 짧게 유지하세요; 아웃바운드 전송에는 메시지 도구를 사용하세요.

- `BOOTSTRAP.md`
  - 일회성 첫 실행 의식.
  - 완전히 새로운 워크스페이스(다른 부트스트랩 파일이 없는 경우)에서만 생성됩니다.
  - 의식 완료 후 삭제하세요.

- `memory/YYYY-MM-DD.md`
  - 일일 메모리 로그(하루에 하나의 파일).
  - 세션 시작 시 오늘 + 어제 파일을 읽는 것을 권장합니다.

- `MEMORY.md` (선택 사항)
  - 큐레이션된 장기 메모리.
  - 메인, 비공개 세션에서만 로드하세요(공유/그룹 컨텍스트가 아님).

메모리 워크플로우 및 자동 메모리 플러시는 [메모리](/concepts/memory)를 참조하세요.

- `skills/` (선택 사항)
  - 워크스페이스별 스킬.
  - 이름 충돌 시 관리/번들 스킬을 재정의합니다.

- `canvas/` (선택 사항)
  - 노드 디스플레이를 위한 캔버스 UI 파일(예: `canvas/index.html`).

부트스트랩 파일이 누락된 경우, OpenClaw는 "파일 누락" 마커를 세션에 주입하고 계속합니다. 큰 부트스트랩 파일은 주입 시 잘립니다; `agents.defaults.bootstrapMaxChars`로 제한을 조정하세요(기본값: 20000).
`openclaw setup`은 기존 파일을 덮어쓰지 않고 누락된 기본값을 다시 생성할 수 있습니다.

## 워크스페이스에 포함되지 않는 것

다음은 `~/.openclaw/` 아래에 있으며 워크스페이스 저장소에 커밋해서는 안 됩니다:

- `~/.openclaw/openclaw.json` (설정)
- `~/.openclaw/credentials/` (OAuth 토큰, API 키)
- `~/.openclaw/agents/<agentId>/sessions/` (세션 트랜스크립트 + 메타데이터)
- `~/.openclaw/skills/` (관리 스킬)

세션 또는 설정을 마이그레이션해야 하는 경우, 별도로 복사하고 버전 관리에서 제외하세요.

## Git 백업 (권장, 비공개)

워크스페이스를 비공개 메모리로 취급하세요. **비공개** git 저장소에 넣어 백업하고 복구 가능하도록 하세요.

게이트웨이가 실행되는 머신(워크스페이스가 있는 곳)에서 다음 단계를 실행하세요.

### 1) 저장소 초기화

git이 설치된 경우, 완전히 새로운 워크스페이스는 자동으로 초기화됩니다. 이 워크스페이스가 아직 저장소가 아닌 경우 실행하세요:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) 비공개 원격 추가 (초보자 친화적 옵션)

옵션 A: GitHub 웹 UI

1. GitHub에서 새 **비공개** 저장소를 만드세요.
2. README로 초기화하지 마세요(병합 충돌 방지).
3. HTTPS 원격 URL을 복사하세요.
4. 원격을 추가하고 푸시하세요:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

옵션 B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

옵션 C: GitLab 웹 UI

1. GitLab에서 새 **비공개** 저장소를 만드세요.
2. README로 초기화하지 마세요(병합 충돌 방지).
3. HTTPS 원격 URL을 복사하세요.
4. 원격을 추가하고 푸시하세요:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) 지속적인 업데이트

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## 시크릿 커밋 금지

비공개 저장소라도 워크스페이스에 시크릿을 저장하지 마세요:

- API 키, OAuth 토큰, 비밀번호 또는 비공개 자격 증명.
- `~/.openclaw/` 아래의 모든 것.
- 채팅 또는 민감한 첨부 파일의 원시 덤프.

민감한 참조를 저장해야 하는 경우, 플레이스홀더를 사용하고 실제 시크릿은 다른 곳(비밀번호 관리자, 환경 변수 또는 `~/.openclaw/`)에 보관하세요.

권장 `.gitignore` 시작:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 워크스페이스를 새 머신으로 이동

1. 원하는 경로(기본값 `~/.openclaw/workspace`)로 저장소를 복제하세요.
2. `~/.openclaw/openclaw.json`에서 `agents.defaults.workspace`를 해당 경로로 설정하세요.
3. `openclaw setup --workspace <path>`를 실행하여 누락된 파일을 초기화하세요.
4. 세션이 필요한 경우, 이전 머신에서 `~/.openclaw/agents/<agentId>/sessions/`를 별도로 복사하세요.

## 고급 노트

- 다중 에이전트 라우팅은 에이전트별로 다른 워크스페이스를 사용할 수 있습니다. 라우팅 설정은 [채널 라우팅](/concepts/channel-routing)을 참조하세요.
- `agents.defaults.sandbox`가 활성화된 경우, 비메인 세션은 `agents.defaults.sandbox.workspaceRoot` 아래의 세션별 샌드박스 워크스페이스를 사용할 수 있습니다.

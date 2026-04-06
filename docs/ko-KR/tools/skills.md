---
summary: "스킬: 관리형 vs 워크스페이스, 게이팅 규칙, 설정/환경 변수 연결"
read_when:
  - 스킬 추가 또는 수정 시
  - 스킬 게이팅 또는 로드 규칙 변경 시
title: "스킬"
---

# 스킬 (OpenClaw)

OpenClaw는 **[AgentSkills](https://agentskills.io) 호환** 스킬 폴더를 사용하여 에이전트에게 도구 사용 방법을 가르칩니다. 각 스킬은 YAML 프론트매터와 지침이 포함된 `SKILL.md`를 포함하는 디렉토리입니다. OpenClaw는 **번들 스킬**과 선택적 로컬 재정의를 로드하고, 환경 변수, 설정 및 바이너리 존재 여부에 따라 로드 시 필터링합니다.

## 위치 및 우선순위

스킬은 **세 곳**에서 로드됩니다:

1. **번들 스킬**: 설치와 함께 제공됨 (npm 패키지 또는 OpenClaw.app)
2. **관리형/로컬 스킬**: `~/.openclaw/skills`
3. **워크스페이스 스킬**: `<workspace>/skills`

스킬 이름이 충돌하는 경우, 우선순위는:

`<workspace>/skills` (최상위) → `~/.openclaw/skills` → 번들 스킬 (최하위)

또한, `~/.openclaw/openclaw.json`의 `skills.load.extraDirs`를 통해 추가 스킬 폴더 (최하위 우선순위)를 설정할 수 있습니다.

## 에이전트별 vs 공유 스킬

**다중 에이전트** 설정에서는 각 에이전트가 자체 워크스페이스를 가집니다. 즉:

- **에이전트별 스킬**은 해당 에이전트 전용 `<workspace>/skills`에 위치합니다.
- **공유 스킬**은 `~/.openclaw/skills` (관리형/로컬)에 위치하며 동일한 머신의
  **모든 에이전트**에게 표시됩니다.
- **공유 폴더**는 여러 에이전트가 사용하는 공통 스킬 팩을 원하는 경우 `skills.load.extraDirs` (최하위
  우선순위)를 통해 추가할 수도 있습니다.

동일한 스킬 이름이 둘 이상의 위치에 존재하는 경우, 일반적인 우선순위가
적용됩니다: 워크스페이스가 우선, 그 다음 관리형/로컬, 그 다음 번들.

## 플러그인 + 스킬

플러그인은 `openclaw.plugin.json`의 `skills` 디렉토리 목록 (플러그인 루트에 상대적인 경로)을 통해 자체 스킬을 제공할 수 있습니다. 플러그인 스킬은
플러그인이 활성화되면 로드되며 일반 스킬 우선순위 규칙에 참여합니다.
플러그인의 설정 항목에서 `metadata.openclaw.requires.config`를 통해 게이팅할 수 있습니다. 발견/설정은 [플러그인](/plugin)을 참조하고, 해당 스킬이 가르치는
도구 표면은 [도구](/tools)를 참조하세요.

## ClawHub (설치 + 동기화)

ClawHub는 OpenClaw를 위한 공개 스킬 레지스트리입니다. https://clawhub.com에서 탐색하세요. 스킬을 발견하고, 설치하고, 업데이트하고, 백업하는 데 사용하세요.
전체 가이드: [ClawHub](/tools/clawhub).

일반적인 흐름:

- 워크스페이스에 스킬 설치:
  - `clawhub install <skill-slug>`
- 설치된 모든 스킬 업데이트:
  - `clawhub update --all`
- 동기화 (스캔 + 업데이트 게시):
  - `clawhub sync --all`

기본적으로, `clawhub`는 현재 작업 디렉토리의 `./skills`에 설치합니다 (또는 설정된 OpenClaw 워크스페이스로 대체). OpenClaw는
다음 세션에서 이를 `<workspace>/skills`로 선택합니다.

## 보안 참고사항

- 타사 스킬을 **신뢰할 수 없는 코드**로 취급하세요. 활성화하기 전에 읽으세요.
- 신뢰할 수 없는 입력 및 위험한 도구에는 샌드박스 격리 실행을 선호하세요. [샌드박싱](/gateway/sandboxing)을 참조하세요.
- `skills.entries.*.env` 및 `skills.entries.*.apiKey`는 해당 에이전트 턴에 대해 **호스트** 프로세스에 시크릿을 주입합니다
  (샌드박스가 아님). 프롬프트 및 로그에서 시크릿을 제거하세요.
- 더 넓은 위협 모델 및 체크리스트는 [보안](/gateway/security)을 참조하세요.

## 형식 (AgentSkills + Pi 호환)

`SKILL.md`는 최소한 다음을 포함해야 합니다:

```markdown
---
name: nano-banana-pro
description: Generate or edit images via Gemini 3 Pro Image
---
```

참고사항:

- 레이아웃/의도에 대해 AgentSkills 사양을 따릅니다.
- 임베디드 에이전트가 사용하는 파서는 **단일 라인** 프론트매터 키만 지원합니다.
- `metadata`는 **단일 라인 JSON 객체**여야 합니다.
- 지침에서 `{baseDir}`을 사용하여 스킬 폴더 경로를 참조하세요.
- 선택적 프론트매터 키:
  - `homepage` — macOS 스킬 UI에서 "웹사이트"로 표시되는 URL (`metadata.openclaw.homepage`를 통해서도 지원됨).
  - `user-invocable` — `true|false` (기본값: `true`). `true`인 경우, 스킬은 사용자 슬래시 명령으로 노출됩니다.
  - `disable-model-invocation` — `true|false` (기본값: `false`). `true`인 경우, 스킬은 모델 프롬프트에서 제외됩니다 (사용자 호출을 통해서는 여전히 사용 가능).
  - `command-dispatch` — `tool` (선택사항). `tool`로 설정하면, 슬래시 명령은 모델을 우회하고 도구로 직접 디스패치됩니다.
  - `command-tool` — `command-dispatch: tool`이 설정된 경우 호출할 도구 이름.
  - `command-arg-mode` — `raw` (기본값). 도구 디스패치의 경우, 원시 인수 문자열을 도구로 전달합니다 (핵심 파싱 없음).

    도구는 매개변수로 호출됩니다:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## 게이팅 (로드 시 필터)

OpenClaw는 `metadata` (단일 라인 JSON)를 사용하여 **로드 시 스킬을 필터링**합니다:

```markdown
---
name: nano-banana-pro
description: Generate or edit images via Gemini 3 Pro Image
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

`metadata.openclaw` 아래 필드:

- `always: true` — 항상 스킬을 포함합니다 (다른 게이트 건너뜀).
- `emoji` — macOS 스킬 UI에서 사용하는 선택적 이모지.
- `homepage` — macOS 스킬 UI에서 "웹사이트"로 표시되는 선택적 URL.
- `os` — 선택적 플랫폼 목록 (`darwin`, `linux`, `win32`). 설정된 경우, 스킬은 해당 OS에서만 적격입니다.
- `requires.bins` — 목록; 각 항목이 `PATH`에 존재해야 합니다.
- `requires.anyBins` — 목록; 최소한 하나가 `PATH`에 존재해야 합니다.
- `requires.env` — 목록; 환경 변수가 존재**하거나** 설정에 제공되어야 합니다.
- `requires.config` — 참인 값이어야 하는 `openclaw.json` 경로 목록.
- `primaryEnv` — `skills.entries.<name>.apiKey`와 연결된 환경 변수 이름.
- `install` — macOS 스킬 UI에서 사용하는 선택적 설치 프로그램 사양 배열 (brew/node/go/uv/download).

샌드박싱 참고사항:

- `requires.bins`는 스킬 로드 시 **호스트**에서 확인됩니다.
- 에이전트가 샌드박스 격리된 경우, 바이너리도 **컨테이너 내부**에 존재해야 합니다.
  `agents.defaults.sandbox.docker.setupCommand` (또는 사용자 정의 이미지)를 통해 설치하세요.
  `setupCommand`는 컨테이너 생성 후 한 번 실행됩니다.
  패키지 설치는 네트워크 송신, 쓰기 가능한 루트 FS, 샌드박스의 루트 사용자도 필요합니다.
  예시: `summarize` 스킬 (`skills/summarize/SKILL.md`)은 샌드박스 컨테이너에서 실행하려면 `summarize` CLI가
  필요합니다.

설치 프로그램 예시:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

참고사항:

- 여러 설치 프로그램이 나열된 경우, 게이트웨이는 **단일** 선호 옵션을 선택합니다 (가능한 경우 brew, 그렇지 않으면 node).
- 모든 설치 프로그램이 `download`인 경우, OpenClaw는 각 항목을 나열하여 사용 가능한 아티팩트를 볼 수 있도록 합니다.
- 설치 프로그램 사양은 플랫폼별로 옵션을 필터링하기 위해 `os: ["darwin"|"linux"|"win32"]`를 포함할 수 있습니다.
- 노드 설치는 `openclaw.json`의 `skills.install.nodeManager`를 존중합니다 (기본값: npm; 옵션: npm/pnpm/yarn/bun).
  이는 **스킬 설치**에만 영향을 미칩니다; 게이트웨이 런타임은 여전히 Node여야 합니다
  (WhatsApp/Telegram에는 Bun이 권장되지 않습니다).
- Go 설치: `go`가 누락되고 `brew`를 사용할 수 있는 경우, 게이트웨이는 Homebrew를 통해 먼저 Go를 설치하고 가능한 경우 Homebrew의 `bin`으로 `GOBIN`을 설정합니다.
- 다운로드 설치: `url` (필수), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (기본값: 아카이브 감지 시 자동), `stripComponents`, `targetDir` (기본값: `~/.openclaw/tools/<skillKey>`).

`metadata.openclaw`가 없으면, 스킬은 항상 적격입니다 (설정에서 비활성화되거나 번들 스킬에 대해 `skills.allowBundled`에 의해 차단되지 않는 한).

## 설정 재정의 (`~/.openclaw/openclaw.json`)

번들/관리형 스킬은 토글하고 환경 변수 값을 제공할 수 있습니다:

```json5
{
  skills: {
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: "GEMINI_KEY_HERE",
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

참고: 스킬 이름에 하이픈이 포함된 경우, 키를 인용하세요 (JSON5는 인용된 키를 허용합니다).

설정 키는 기본적으로 **스킬 이름**과 일치합니다. 스킬이
`metadata.openclaw.skillKey`를 정의하는 경우, `skills.entries` 아래에서 해당 키를 사용하세요.

규칙:

- `enabled: false`는 번들/설치된 경우에도 스킬을 비활성화합니다.
- `env`: 프로세스에 변수가 아직 설정되지 **않은 경우에만** 주입됩니다.
- `apiKey`: `metadata.openclaw.primaryEnv`를 선언하는 스킬을 위한 편의 기능.
- `config`: 사용자 정의 스킬별 필드를 위한 선택적 백; 사용자 정의 키는 여기에 위치해야 합니다.
- `allowBundled`: **번들** 스킬 전용 선택적 허용 목록. 설정된 경우, 목록의 번들 스킬만
  적격입니다 (관리형/워크스페이스 스킬은 영향을 받지 않음).

## 환경 변수 주입 (에이전트 실행당)

에이전트 실행이 시작되면, OpenClaw:

1. 스킬 메타데이터를 읽습니다.
2. 모든 `skills.entries.<key>.env` 또는 `skills.entries.<key>.apiKey`를
   `process.env`에 적용합니다.
3. **적격** 스킬로 시스템 프롬프트를 구축합니다.
4. 실행 종료 후 원래 환경을 복원합니다.

이는 **에이전트 실행에 범위가 지정**되며, 전역 셸 환경이 아닙니다.

## 세션 스냅샷 (성능)

OpenClaw는 **세션이 시작될 때** 적격 스킬을 스냅샷하고 동일한 세션의 후속 턴에 대해 해당 목록을 재사용합니다. 스킬 또는 설정 변경 사항은 다음 새 세션에서 적용됩니다.

스킬은 스킬 감시자가 활성화되거나 새로운 적격 원격 노드가 나타나면 세션 중간에 새로 고쳐질 수도 있습니다 (아래 참조). 이를 **핫 리로드**로 생각하세요: 새로 고쳐진 목록은 다음 에이전트 턴에서 선택됩니다.

## 원격 macOS 노드 (Linux 게이트웨이)

게이트웨이가 Linux에서 실행되지만 **macOS 노드**가 **`system.run` 허용과 함께** 연결된 경우 (Exec 승인 보안이 `deny`로 설정되지 않음), OpenClaw는 필요한 바이너리가 해당 노드에 존재하는 경우 macOS 전용 스킬을 적격으로 취급할 수 있습니다. 에이전트는 `nodes` 도구 (일반적으로 `nodes.run`)를 통해 해당 스킬을 실행해야 합니다.

이는 노드가 명령 지원을 보고하고 `system.run`을 통한 바이너리 프로브에 의존합니다. macOS 노드가 나중에 오프라인이 되면, 스킬은 표시된 채로 유지됩니다; 노드가 다시 연결될 때까지 호출이 실패할 수 있습니다.

## 스킬 감시자 (자동 새로 고침)

기본적으로, OpenClaw는 스킬 폴더를 감시하고 `SKILL.md` 파일이 변경되면 스킬 스냅샷을 업데이트합니다. `skills.load` 아래에서 이를 설정하세요:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## 토큰 영향 (스킬 목록)

스킬이 적격인 경우, OpenClaw는 사용 가능한 스킬의 간결한 XML 목록을 시스템 프롬프트에 주입합니다 (`pi-coding-agent`의 `formatSkillsForPrompt`를 통해). 비용은 결정적입니다:

- **기본 오버헤드 (≥1 스킬인 경우에만):** 195자.
- **스킬당:** 97자 + XML 이스케이프된 `<name>`, `<description>`, `<location>` 값의 길이.

공식 (문자):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

참고사항:

- XML 이스케이프는 `& < > " '`를 엔티티 (`&amp;`, `&lt;` 등)로 확장하여 길이를 증가시킵니다.
- 토큰 수는 모델 토크나이저에 따라 다릅니다. 대략적인 OpenAI 스타일 추정치는 ~4자/토큰이므로 **97자 ≈ 스킬당 24 토큰** + 실제 필드 길이입니다.

## 관리형 스킬 수명 주기

OpenClaw는 설치의 일부로 **번들 스킬**의 기준 세트를 제공합니다 (npm 패키지 또는 OpenClaw.app). `~/.openclaw/skills`는 로컬
재정의를 위해 존재합니다 (예: 번들 사본을 변경하지 않고 스킬을 고정/패치). 워크스페이스 스킬은 사용자 소유이며 이름 충돌 시 둘 다를 재정의합니다.

## 설정 참조

전체 설정 스키마는 [스킬 설정](/tools/skills-config)을 참조하세요.

## 더 많은 스킬을 찾고 계신가요?

https://clawhub.com을 탐색하세요.

---

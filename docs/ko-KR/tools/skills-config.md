---
summary: "스킬 설정 스키마 및 예시"
read_when:
  - 스킬 설정 추가 또는 수정 시
  - 번들 허용 목록 또는 설치 동작 조정 시
title: "스킬 설정"
---

# 스킬 설정

모든 스킬 관련 설정은 `~/.openclaw/openclaw.json`의 `skills` 아래에 위치합니다.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (게이트웨이 런타임은 여전히 Node; bun은 권장되지 않음)
    },
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: "GEMINI_KEY_HERE",
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

## 필드

- `allowBundled`: **번들** 스킬 전용 선택적 허용 목록. 설정된 경우, 목록의 번들 스킬만
  적격입니다 (관리형/워크스페이스 스킬은 영향을 받지 않음).
- `load.extraDirs`: 스캔할 추가 스킬 디렉토리 (최하위 우선순위).
- `load.watch`: 스킬 폴더를 감시하고 스킬 스냅샷을 새로 고침 (기본값: true).
- `load.watchDebounceMs`: 스킬 감시자 이벤트에 대한 디바운스 (밀리초) (기본값: 250).
- `install.preferBrew`: 사용 가능한 경우 brew 설치 프로그램을 선호 (기본값: true).
- `install.nodeManager`: 노드 설치 프로그램 선호도 (`npm` | `pnpm` | `yarn` | `bun`, 기본값: npm).
  이는 **스킬 설치**에만 영향을 미칩니다; 게이트웨이 런타임은 여전히 Node여야 합니다
  (WhatsApp/Telegram에는 Bun이 권장되지 않습니다).
- `entries.<skillKey>`: 스킬별 재정의.

스킬별 필드:

- `enabled`: 번들/설치된 경우에도 스킬을 비활성화하려면 `false`로 설정하세요.
- `env`: 에이전트 실행에 주입되는 환경 변수 (아직 설정되지 않은 경우에만).
- `apiKey`: 기본 환경 변수를 선언하는 스킬을 위한 선택적 편의 기능.

## 참고사항

- `entries` 아래의 키는 기본적으로 스킬 이름에 매핑됩니다. 스킬이
  `metadata.openclaw.skillKey`를 정의하는 경우, 대신 해당 키를 사용하세요.
- 스킬 변경 사항은 감시자가 활성화된 경우 다음 에이전트 턴에서 선택됩니다.

### 샌드박스 격리 스킬 + 환경 변수

세션이 **샌드박스 격리**된 경우, 스킬 프로세스는 Docker 내부에서 실행됩니다. 샌드박스는
호스트 `process.env`를 **상속하지 않습니다**.

다음 중 하나를 사용하세요:

- `agents.defaults.sandbox.docker.env` (또는 에이전트별 `agents.list[].sandbox.docker.env`)
- 사용자 정의 샌드박스 이미지에 환경 변수를 구워 넣기

전역 `env` 및 `skills.entries.<skill>.env/apiKey`는 **호스트** 실행에만 적용됩니다.

---
summary: "개인 어시스턴트로 OpenClaw를 실행하기 위한 종합 가이드 및 안전 주의사항"
read_when:
  - 새로운 어시스턴트 인스턴스를 온보딩할 때
  - 안전/권한 implications을 검토할 때
title: "개인 어시스턴트 설정"
---

# OpenClaw로 개인 어시스턴트 구축하기

OpenClaw는 **Pi** 에이전트를 위한 WhatsApp + Telegram + Discord + iMessage 게이트웨이입니다. 플러그인으로 Mattermost를 추가할 수 있습니다. 이 가이드는 "개인 어시스턴트" 설정입니다: 항상 켜져 있는 에이전트처럼 동작하는 전용 WhatsApp 번호입니다.

## ⚠️ 안전을 먼저

에이전트를 다음과 같은 상황에 노출시키고 있습니다:

- 머신에서 명령 실행 (Pi 도구 설정에 따라)
- 작업 공간에서 파일 읽기/쓰기
- WhatsApp/Telegram/Discord/Mattermost(플러그인)를 통해 메시지 전송

보수적으로 시작하세요:

- 항상 `channels.whatsapp.allowFrom`을 설정하세요 (개인 Mac에서 열린 상태로 실행하지 마세요).
- 어시스턴트를 위해 전용 WhatsApp 번호를 사용하세요.
- 하트비트는 이제 기본값으로 30분마다 실행됩니다. 설정에 신뢰가 생길 때까지 `agents.defaults.heartbeat.every: "0m"`을 설정하여 비활성화하세요.

## 전제 조건

- Node **22+**
- PATH에 있는 OpenClaw (권장: 전역 설치)
- 어시스턴트용 두 번째 전화번호 (SIM/eSIM/선불)

```bash
npm install -g openclaw@latest
# 또는: pnpm add -g openclaw@latest
```

소스에서 (개발용):

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # 첫 실행 시 자동으로 UI deps 설치
pnpm build
pnpm link --global
```

## 2단계 전화 설정 (권장)

다음과 같이 설정하고 싶을 것입니다:

```
Your Phone (personal)          Second Phone (assistant)
┌─────────────────┐           ┌─────────────────┐
│  Your WhatsApp  │  ──────▶  │  Assistant WA   │
│  +1-555-YOU     │  message  │  +1-555-ASSIST  │
└─────────────────┘           └────────┬────────┘
                                       │ linked via QR
                                       ▼
                              ┌─────────────────┐
                              │  Your Mac       │
                              │  (openclaw)      │
                              │    Pi agent     │
                              └─────────────────┘
```

개인 WhatsApp을 OpenClaw에 연결하면, 당신에게 오는 모든 메시지가 "에이전트 입력"이 됩니다. 이것은 거의 원하는 상황이 아닙니다.

## 5분 빠른 시작

1. WhatsApp Web 페어링 (QR 코드 표시; 어시스턴트 전화로 스캔):

```bash
openclaw channels login
```

2. 게이트웨이 시작 (실행 상태 유지):

```bash
openclaw gateway --port 18789
```

3. `~/.openclaw/openclaw.json`에 최소한의 설정을 입력하세요:

```json5
{
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

이제 허용 목록에 있는 전화번호에서 어시스턴트 번호로 메시지를 보내세요.

온보딩이 완료되면, 게이트웨이 토큰과 함께 대시보드를 자동으로 열고 토큰화된 링크를 인쇄합니다. 나중에 다시 열려면: `openclaw dashboard`

## 에이전트에게 작업 공간 제공 (AGENTS)

OpenClaw는 작업 공간 디렉터리에서 운영 지침 및 "메모리"를 읽습니다.

기본적으로 OpenClaw는 `~/.openclaw/workspace`를 에이전트 작업 공간으로 사용하며, 설정/첫 에이전트 실행 시 생성합니다 (스타터 `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md` 포함). `BOOTSTRAP.md`는 작업 공간이 새로 생성될 때만 생성됩니다 (삭제 후에는 다시 나타나지 않음).

팁: 이 폴더를 OpenClaw의 "메모리"처럼 취급하고 git 저장소로 만드세요 (이상적으로는 비공개) 그래야 `AGENTS.md` + 메모리 파일이 백업됩니다. git이 설치되어 있으면, 새 작업 공간이 자동으로 초기화됩니다.

```bash
openclaw setup
```

전체 작업 공간 레이아웃 + 백업 가이드: [에이전트 작업 공간](/concepts/agent-workspace)
메모리 워크플로우: [메모리](/concepts/memory)

선택사항: `agents.defaults.workspace`로 다른 작업 공간을 선택하세요 (`~` 지원).

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

이미 저장소에서 자신의 작업 공간 파일을 제공하고 있다면, 부트스트랩 파일 생성을 완전히 비활성화할 수 있습니다:

```json5
{
  agent: {
    skipBootstrap: true,
  },
}
```

## 그것을 "어시스턴트"로 만드는 설정

OpenClaw는 좋은 어시스턴트 설정을 기본값으로 제공하지만, 일반적으로 다음을 조정하고 싶을 것입니다:

- `SOUL.md`의 페르소나/지침
- 생각 기본값 (필요한 경우)
- 하트비트 (신뢰하게 되면)

예시:

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-5",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // 0으로 시작; 나중에 활성화.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## 세션 및 메모리

- 세션 파일: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- 세션 메타데이터 (토큰 사용량, 마지막 라우트 등): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (레거시: `~/.openclaw/sessions/sessions.json`)
- `/new` 또는 `/reset`은 해당 채팅에 대한 새 세션을 시작합니다 (`resetTriggers`로 설정 가능). 단독으로 전송되면, 에이전트는 리셋을 확인하기 위해 짧은 인사말로 응답합니다.
- `/compact [instructions]`은 세션 컨텍스트를 압축하고 남은 컨텍스트 예산을 보고합니다.

## 하트비트 (능동형 모드)

기본적으로 OpenClaw는 다음 프롬프트와 함께 30분마다 하트비트를 실행합니다:
`HEARTBEAT.md가 존재하면 읽으세요 (작업 공간 컨텍스트). 엄격하게 따르세요. 이전 채팅에서 이전 작업을 추론하거나 반복하지 마세요. 주의가 필요한 것이 없으면 HEARTBEAT_OK로 응답하세요.`
`agents.defaults.heartbeat.every: "0m"`을 설정하여 비활성화하세요.

- `HEARTBEAT.md`가 존재하지만 실질적으로 비어 있으면 (빈 줄과 `# Heading`과 같은 마크다운 헤더만 포함), OpenClaw는 API 호출을 절약하기 위해 하트비트 실행을 건너뜁니다.
- 파일이 누락되면, 하트비트는 여전히 실행되고 모델이 수행할 작업을 결정합니다.
- 에이전트가 `HEARTBEAT_OK`로 응답하면 (선택적으로 짧은 패딩 포함; `agents.defaults.heartbeat.ackMaxChars` 참조), OpenClaw는 해당 하트비트에 대한 아웃바운드 전달을 억제합니다.
- 하트비트는 전체 에이전트 턴을 실행합니다 — 더 짧은 간격은 더 많은 토큰을 소비합니다.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## 입출력 미디어

인바운드 첨부 파일 (이미지/오디오/문서)은 템플릿을 통해 명령에 표시될 수 있습니다:

- `{{MediaPath}}` (로컬 임시 파일 경로)
- `{{MediaUrl}}` (의사 URL)
- `{{Transcript}}` (오디오 전사가 활성화된 경우)

에이전트의 아웃바운드 첨부 파일: 자신의 줄에 `MEDIA:<path-or-url>`을 포함하세요 (공백 없음). 예시:

```
Here's the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw는 이들을 추출하고 텍스트와 함께 미디어로 전송합니다.

## 운영 체크리스트

```bash
openclaw status          # 로컬 상태 (자격 증명, 세션, 큐 이벤트)
openclaw status --all    # 전체 진단 (읽기 전용, 붙여넣기 가능)
openclaw status --deep   # 게이트웨이 상태 프로브 추가 (Telegram + Discord)
openclaw health --json   # 게이트웨이 상태 스냅샷 (WS)
```

로그는 `/tmp/openclaw/` 아래에 있습니다 (기본값: `openclaw-YYYY-MM-DD.log`).

## 다음 단계

- WebChat: [WebChat](/web/webchat)
- 게이트웨이 운영: [게이트웨이 실행 설명서](/gateway)
- Cron + 웨이크업: [Cron 작업](/automation/cron-jobs)
- macOS 메뉴바 컴패니언: [OpenClaw macOS 앱](/platforms/macos)
- iOS 노드 앱: [iOS 앱](/platforms/ios)
- Android 노드 앱: [Android 앱](/platforms/android)
- Windows 상태: [Windows (WSL2)](/platforms/windows)
- Linux 상태: [Linux 앱](/platforms/linux)
- 보안: [보안](/gateway/security)

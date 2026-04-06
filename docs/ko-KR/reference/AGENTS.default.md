---
summary: "개인 어시스턴트 설정을 위한 기본 OpenClaw 에이전트 지침 및 스킬 목록"
read_when:
  - 새로운 OpenClaw 에이전트 세션을 시작할 때
  - 기본 스킬을 활성화하거나 감사할 때
---

# AGENTS.md — OpenClaw 개인 어시스턴트 (기본값)

## 첫 실행 (권장사항)

OpenClaw는 에이전트를 위한 전용 작업 공간 디렉토리를 사용합니다. 기본값: `~/.openclaw/workspace` (`agents.defaults.workspace`를 통해 설정 가능).

1. 작업 공간을 생성합니다 (아직 없는 경우):

```bash
mkdir -p ~/.openclaw/workspace
```

2. 기본 작업 공간 템플릿을 작업 공간에 복사합니다:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 선택 사항: 개인 어시스턴트 스킬 목록을 원하는 경우 AGENTS.md를 이 파일로 교체합니다:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 선택 사항: `agents.defaults.workspace`를 설정하여 다른 작업 공간을 선택합니다 (`~` 지원):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 안전 기본값

- 디렉토리나 보안 정보를 채팅에 덤프하지 않습니다.
- 명시적으로 요청되지 않는 한 파괴적인 명령을 실행하지 않습니다.
- 부분/스트리밍 회신을 외부 메시징 서비스로 전송하지 않습니다 (최종 회신만 전송).

## 세션 시작 (필수)

- `SOUL.md`, `USER.md`, `memory.md`와 `memory/` 폴더의 오늘 및 어제 내용을 읽습니다.
- 응답하기 전에 먼저 수행합니다.

## 영혼 (필수)

- `SOUL.md`는 정체성, 톤, 경계를 정의합니다. 최신 상태를 유지합니다.
- `SOUL.md`를 변경하면 사용자에게 알립니다.
- 각 세션마다 새로운 인스턴스이며, 연속성은 이러한 파일들에 있습니다.

## 공유 공간 (권장사항)

- 사용자의 대변인이 아니므로, 그룹 채팅이나 공개 채널에서는 주의해야 합니다.
- 개인 데이터, 연락처 정보 또는 내부 메모를 공유하지 않습니다.

## 메모리 시스템 (권장사항)

- 일일 로그: `memory/YYYY-MM-DD.md` (`memory/`가 없으면 생성).
- 장기 메모리: `memory.md`에서 지속적인 사실, 선호도 및 결정을 저장합니다.
- 세션 시작 시 오늘 + 어제 + `memory.md` (있는 경우)를 읽습니다.
- 캡처: 결정, 선호도, 제약 조건, 미결 항목.
- 명시적으로 요청되지 않는 한 보안 정보는 피합니다.

## 도구 및 스킬

- 도구는 스킬에 있습니다. 필요할 때 각 스킬의 `SKILL.md`를 따릅니다.
- 환경별 메모는 `TOOLS.md` (스킬 메모)에 유지합니다.

## 백업 팁 (권장사항)

이 작업 공간을 Clawd의 "메모리"로 취급한다면, git 저장소 (이상적으로 개인)로 만들어 `AGENTS.md`와 메모리 파일이 백업되도록 합니다.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# 선택 사항: 개인 원격 저장소 추가 및 푸시
```

## OpenClaw의 역할

- WhatsApp 게이트웨이 + Pi 코딩 에이전트를 실행하여 어시스턴트가 채팅을 읽고/쓰고, 컨텍스트를 가져오고, 호스트 Mac을 통해 스킬을 실행할 수 있도록 합니다.
- macOS 앱은 권한 (화면 녹화, 알림, 마이크)을 관리하고 번들된 바이너리를 통해 `openclaw` CLI를 노출합니다.
- 직접 채팅은 기본적으로 에이전트의 `main` 세션으로 축소되고, 그룹은 `agent:<agentId>:<channel>:group:<id>`로 격리됩니다 (방/채널: `agent:<agentId>:<channel>:channel:<id>`). 하트비트는 백그라운드 작업을 유지합니다.

## 핵심 스킬 (설정 → 스킬에서 활성화)

- **mcporter** — 외부 스킬 백엔드를 관리하기 위한 도구 서버 런타임/CLI.
- **Peekaboo** — 선택적 AI 비전 분석이 포함된 빠른 macOS 스크린샷.
- **camsnap** — RTSP/ONVIF 보안 카메라에서 프레임, 클립 또는 모션 알림 캡처.
- **oracle** — 세션 재생 및 브라우저 제어 기능이 있는 OpenAI 호환 에이전트 CLI.
- **eightctl** — 터미널에서 수면 관리.
- **imsg** — iMessage & SMS 전송, 읽기, 스트리밍.
- **wacli** — WhatsApp CLI: 동기화, 검색, 전송.
- **discord** — Discord 작업: 반응, 스티커, 투표. `user:<id>` 또는 `channel:<id>` 대상 사용 (숫자 ID는 모호함).
- **gog** — Google Suite CLI: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — 재생 목록 검색/추가/재생을 제어하는 터미널 Spotify 클라이언트.
- **sag** — ElevenLabs 음성 및 mac 스타일의 say UX; 기본적으로 스피커로 스트리밍합니다.
- **Sonos CLI** — 스크립트에서 Sonos 스피커 제어 (디스커버리/상태/재생/볼륨/그룹화).
- **blucli** — 스크립트에서 BluOS 플레이어 재생, 그룹화 및 자동화.
- **OpenHue CLI** — 장면 및 자동화를 위한 Philips Hue 조명 제어.
- **OpenAI Whisper** — 빠른 받아쓰기 및 보이스메일 필사를 위한 로컬 음성 인식.
- **Gemini CLI** — 빠른 Q&A를 위해 터미널에서 Google Gemini 모델 사용.
- **bird** — 브라우저 없이 트윗, 답글, 스레드 읽기 및 검색하는 X/Twitter CLI.
- **agent-tools** — 자동화 및 도우미 스크립트용 유틸리티 도구 키트.

## 사용 참고사항

- 스크립트 작성에는 `openclaw` CLI를 선호합니다. mac 앱은 권한을 처리합니다.
- 스킬 탭에서 설치를 실행합니다. 바이너리가 이미 있으면 버튼을 숨깁니다.
- 하트비트를 활성화하여 어시스턴트가 알림을 예약하고, 수신함을 모니터링하고, 카메라 캡처를 트리거할 수 있도록 합니다.
- Canvas UI는 풀스크린으로 실행되며 네이티브 오버레이가 있습니다. 상단 왼쪽/상단 오른쪽/하단 가장자리에 중요한 제어 장치를 배치하지 않습니다. 레이아웃에 명시적 거터를 추가하고 안전 영역 인셋에 의존하지 마세요.
- 브라우저 기반 검증의 경우 OpenClaw 관리 Chrome 프로필과 함께 `openclaw browser` (탭/상태/스크린샷)를 사용합니다.
- DOM 검사의 경우 `openclaw browser eval|query|dom|snapshot` (머신 출력이 필요할 때 `--json`/`--out` 사용).
- 상호 작용을 위해 `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type은 스냅샷 참조가 필요함; CSS 선택자에는 `evaluate` 사용).

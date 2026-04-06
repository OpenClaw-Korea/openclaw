---
summary: "OpenClaw의 OAuth: 토큰 교환, 저장 및 다중 계정 패턴"
read_when:
  - OpenClaw OAuth를 전체적으로 이해하고 싶을 때
  - 토큰 무효화/로그아웃 문제가 발생했을 때
  - setup-token 또는 OAuth 인증 플로우를 사용하고 싶을 때
  - 다중 계정 또는 프로필 라우팅을 사용하고 싶을 때
title: "OAuth"
---

# OAuth

OpenClaw는 제공하는 프로바이더(특히 **OpenAI Codex (ChatGPT OAuth)**)에 대해 OAuth를 통한 "구독 인증"을 지원합니다. Anthropic 구독의 경우 **setup-token** 플로우를 사용하세요. 이 페이지에서는 다음 내용을 설명합니다:

- OAuth **토큰 교환**의 작동 방식 (PKCE)
- 토큰이 **저장되는** 위치 (그리고 그 이유)
- **다중 계정** 처리 방법 (프로필 + 세션별 오버라이드)

OpenClaw는 자체 OAuth 또는 API 키 플로우를 제공하는 **프로바이더 플러그인**도 지원합니다. 다음과 같이 실행하세요:

```bash
openclaw models auth login --provider <id>
```

## 토큰 싱크 (존재 이유)

OAuth 프로바이더는 일반적으로 로그인/갱신 플로우 중에 **새 갱신 토큰**을 발행합니다. 일부 프로바이더(또는 OAuth 클라이언트)는 동일한 사용자/앱에 대해 새 토큰이 발행되면 이전 갱신 토큰을 무효화할 수 있습니다.

실질적인 증상:

- OpenClaw _및_ Claude Code / Codex CLI를 통해 로그인 → 나중에 둘 중 하나가 무작위로 "로그아웃"됨

이를 줄이기 위해 OpenClaw는 `auth-profiles.json`을 **토큰 싱크**로 취급합니다:

- 런타임이 **한 곳**에서 자격 증명을 읽음
- 여러 프로필을 유지하고 결정적으로 라우팅할 수 있음

## 저장 위치 (토큰 저장 위치)

시크릿은 **에이전트별로** 저장됩니다:

- 인증 프로필 (OAuth + API 키): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 런타임 캐시 (자동 관리; 편집하지 마세요): `~/.openclaw/agents/<agentId>/agent/auth.json`

레거시 가져오기 전용 파일 (여전히 지원되지만 주 저장소가 아님):

- `~/.openclaw/credentials/oauth.json` (처음 사용 시 `auth-profiles.json`로 가져옴)

위의 모든 파일은 `$OPENCLAW_STATE_DIR` (상태 디렉토리 오버라이드)도 존중합니다. 전체 참조: [/gateway/configuration](/gateway/configuration#auth-storage-oauth--api-keys)

## Anthropic setup-token (구독 인증)

모든 머신에서 `claude setup-token`을 실행한 다음 OpenClaw에 붙여넣으세요:

```bash
openclaw models auth setup-token --provider anthropic
```

다른 곳에서 토큰을 생성한 경우 수동으로 붙여넣으세요:

```bash
openclaw models auth paste-token --provider anthropic
```

확인:

```bash
openclaw models status
```

## OAuth 교환 (로그인 작동 방식)

OpenClaw의 대화형 로그인 플로우는 `@mariozechner/pi-ai`에 구현되어 마법사/명령어에 연결됩니다.

### Anthropic (Claude Pro/Max) setup-token

플로우 형태:

1. `claude setup-token` 실행
2. 토큰을 OpenClaw에 붙여넣기
3. 토큰 인증 프로필로 저장 (갱신 없음)

마법사 경로는 `openclaw onboard` → 인증 선택 `setup-token` (Anthropic)입니다.

### OpenAI Codex (ChatGPT OAuth)

플로우 형태 (PKCE):

1. PKCE verifier/challenge + 무작위 `state` 생성
2. `https://auth.openai.com/oauth/authorize?...` 열기
3. `http://127.0.0.1:1455/auth/callback`에서 콜백 캡처 시도
4. 콜백이 바인딩되지 않거나 원격/헤드리스인 경우, 리디렉션 URL/코드 붙여넣기
5. `https://auth.openai.com/oauth/token`에서 교환
6. 액세스 토큰에서 `accountId`를 추출하고 `{ access, refresh, expires, accountId }` 저장

마법사 경로는 `openclaw onboard` → 인증 선택 `openai-codex`입니다.

## 갱신 + 만료

프로필은 `expires` 타임스탬프를 저장합니다.

런타임 시:

- `expires`가 미래인 경우 → 저장된 액세스 토큰 사용
- 만료된 경우 → (파일 잠금 하에서) 갱신하고 저장된 자격 증명 덮어쓰기

갱신 플로우는 자동입니다. 일반적으로 토큰을 수동으로 관리할 필요가 없습니다.

## 다중 계정 (프로필) + 라우팅

두 가지 패턴:

### 1) 권장: 별도 에이전트

"개인"과 "업무"가 절대 상호작용하지 않도록 하려면 격리된 에이전트(별도 세션 + 자격 증명 + 워크스페이스)를 사용하세요:

```bash
openclaw agents add work
openclaw agents add personal
```

그런 다음 에이전트별로 인증을 설정하고(마법사) 채팅을 올바른 에이전트로 라우팅하세요.

### 2) 고급: 하나의 에이전트에 여러 프로필

`auth-profiles.json`은 동일한 프로바이더에 대해 여러 프로필 ID를 지원합니다.

사용할 프로필 선택:

- 설정 순서를 통한 전역 설정 (`auth.order`)
- `/model ...@<profileId>`를 통한 세션별 설정

예시 (세션 오버라이드):

- `/model Opus@anthropic:work`

존재하는 프로필 ID 확인 방법:

- `openclaw channels list --json` (`auth[]` 표시)

관련 문서:

- [/concepts/model-failover](/concepts/model-failover) (로테이션 + 쿨다운 규칙)
- [/tools/slash-commands](/tools/slash-commands) (명령 표면)

---
summary: "초보자 가이드: 처음부터 첫 메시지까지 (마법사, 인증, 채널, 페어링)"
read_when:
  - 처음부터 설정하는 경우
  - 설치 → 온보딩 → 첫 메시지까지 가장 빠른 경로를 원하는 경우
title: "시작하기"
---

# 시작하기

목표: **처음**부터 → **첫 번째 작동하는 채팅** (적절한 기본 설정)까지 최대한 빠르게 도달합니다.

가장 빠른 채팅: Control UI를 열어보세요 (채널 설정 불필요). `openclaw dashboard`를 실행하고 브라우저에서 채팅하거나, 게이트웨이 호스트에서 `http://127.0.0.1:18789/`를 여세요.
문서: [대시보드](/ko-KR/web/dashboard) 및 [Control UI](/ko-KR/web/control-ui)

권장 경로: **CLI 온보딩 마법사** (`openclaw onboard`)를 사용하세요. 다음을 설정합니다:

- 모델/인증 (OAuth 권장)
- 게이트웨이 설정
- 채널 (WhatsApp/Telegram/Discord/Mattermost (플러그인)/...)
- 페어링 기본값 (보안 DM)
- 워크스페이스 부트스트랩 + 스킬
- 선택적 백그라운드 서비스

더 자세한 참조 페이지를 원한다면: [마법사](/ko-KR/start/wizard), [설정](/ko-KR/start/setup), [페어링](/ko-KR/start/pairing), [보안](/ko-KR/gateway/security)

샌드박싱 참고: `agents.defaults.sandbox.mode: "non-main"`은 `session.mainKey` (기본값 `"main"`)를 사용하므로 그룹/채널 세션이 샌드박스됩니다. 메인 에이전트가 항상 호스트에서 실행되길 원한다면, 에이전트별 명시적 오버라이드를 설정하세요:

```json
{
  "routing": {
    "agents": {
      "main": {
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    }
  }
}
```

## 0) 사전 요구사항

- Node `>=22`
- `pnpm` (선택사항; 소스에서 빌드하는 경우 권장)
- **권장:** 웹 검색을 위한 Brave Search API 키. 가장 쉬운 방법:
  `openclaw configure --section web` (`tools.web.search.apiKey` 저장)
  자세한 내용: [웹 도구](/ko-KR/tools/web)

macOS: 앱을 빌드할 계획이라면 Xcode / CLT를 설치하세요. CLI + 게이트웨이만 사용한다면 Node만 있으면 됩니다.
Windows: **WSL2** 사용 (Ubuntu 권장). WSL2를 강력히 권장합니다; 네이티브 Windows는 테스트되지 않았고 문제가 더 많으며 도구 호환성이 떨어집니다. 먼저 WSL2를 설치한 다음 WSL 내에서 Linux 단계를 실행하세요. 자세한 내용: [Windows (WSL2)](/ko-KR/platforms/windows)

## 1) CLI 설치 (권장)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

설치 옵션 (설치 방법, 비대화형, GitHub에서): [설치](/ko-KR/install)

Windows (PowerShell):

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

대안 (글로벌 설치):

```bash
npm install -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

## 2) 온보딩 마법사 실행 (및 서비스 설치)

```bash
openclaw onboard --install-daemon
```

선택할 항목:

- **로컬 vs 원격** 게이트웨이
- **인증**: OpenAI Code (Codex) 구독 (OAuth) 또는 API 키. Anthropic의 경우 API 키를 권장합니다; `claude setup-token`도 지원됩니다.
- **프로바이더**: WhatsApp QR 로그인, Telegram/Discord 봇 토큰, Mattermost 플러그인 토큰 등
- **데몬**: 백그라운드 설치 (launchd/systemd; WSL2는 systemd 사용)
  - **런타임**: Node (권장; WhatsApp/Telegram에 필수). Bun은 **권장하지 않습니다**.
- **게이트웨이 토큰**: 마법사가 기본적으로 생성하고 (루프백에서도) `gateway.auth.token`에 저장합니다.

마법사 문서: [마법사](/ko-KR/start/wizard)

### 인증: 저장 위치 (중요)

- **권장 Anthropic 경로:** API 키 설정 (마법사가 서비스용으로 저장 가능). `claude setup-token`도 Claude Code 자격 증명을 재사용하려는 경우 지원됩니다.

- OAuth 자격 증명 (레거시 임포트): `~/.openclaw/credentials/oauth.json`
- 인증 프로필 (OAuth + API 키): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

헤드리스/서버 팁: 먼저 일반 머신에서 OAuth를 수행한 다음 `oauth.json`을 게이트웨이 호스트로 복사하세요.

## 3) 게이트웨이 시작

온보딩 중 서비스를 설치했다면, 게이트웨이가 이미 실행 중이어야 합니다:

```bash
openclaw gateway status
```

수동 실행 (포그라운드):

```bash
openclaw gateway --port 18789 --verbose
```

대시보드 (로컬 루프백): `http://127.0.0.1:18789/`
토큰이 설정되어 있다면 Control UI 설정에 붙여넣으세요 (`connect.params.auth.token`으로 저장됨).

**Bun 경고 (WhatsApp + Telegram):** Bun은 이러한 채널에서 알려진 문제가 있습니다. WhatsApp이나 Telegram을 사용한다면 **Node**로 게이트웨이를 실행하세요.

## 3.5) 빠른 확인 (2분)

```bash
openclaw status
openclaw health
openclaw security audit --deep
```

## 4) 첫 번째 채팅 서피스 페어링 + 연결

### WhatsApp (QR 로그인)

```bash
openclaw channels login
```

WhatsApp → 설정 → 연결된 기기에서 스캔하세요.

WhatsApp 문서: [WhatsApp](/ko-KR/channels/whatsapp)

### Telegram / Discord / 기타

마법사가 토큰/설정을 작성할 수 있습니다. 수동 설정을 선호한다면 다음부터 시작하세요:

- Telegram: [Telegram](/ko-KR/channels/telegram)
- Discord: [Discord](/ko-KR/channels/discord)
- Mattermost (플러그인): [Mattermost](/ko-KR/channels/mattermost)

**Telegram DM 팁:** 첫 DM은 페어링 코드를 반환합니다. 승인하세요 (다음 단계 참조) 그렇지 않으면 봇이 응답하지 않습니다.

## 5) DM 안전 (페어링 승인)

기본 설정: 알 수 없는 DM은 짧은 코드를 받고 승인될 때까지 메시지가 처리되지 않습니다.
첫 DM에 응답이 없다면 페어링을 승인하세요:

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <code>
```

페어링 문서: [페어링](/ko-KR/start/pairing)

## 소스에서 개발

OpenClaw 자체를 해킹하는 경우 소스에서 실행하세요:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # 첫 실행 시 UI 의존성 자동 설치
pnpm build
openclaw onboard --install-daemon
```

전역 설치가 없다면 레포에서 `pnpm openclaw ...`로 온보딩 단계를 실행하세요.
`pnpm build`는 A2UI 자산도 번들합니다; 해당 단계만 실행해야 한다면 `pnpm canvas:a2ui:bundle`을 사용하세요.

게이트웨이 (이 레포에서):

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 7) 엔드투엔드 확인

새 터미널에서 테스트 메시지를 보내세요:

```bash
openclaw message send --target +15555550123 --message "Hello from OpenClaw"
```

`openclaw health`에서 "no auth configured"가 표시되면 마법사로 돌아가서 OAuth/키 인증을 설정하세요 — 인증 없이는 에이전트가 응답할 수 없습니다.

팁: `openclaw status --all`은 복사 가능하고 읽기 전용인 최고의 디버그 리포트입니다.
상태 프로브: `openclaw health` (또는 `openclaw status --deep`)는 실행 중인 게이트웨이에 상태 스냅샷을 요청합니다.

## 다음 단계 (선택사항이지만 권장)

- macOS 메뉴 바 앱 + 음성 웨이크: [macOS 앱](/ko-KR/platforms/macos)
- iOS/Android 노드 (Canvas/카메라/음성): [노드](/ko-KR/nodes)
- 원격 접속 (SSH 터널 / Tailscale Serve): [원격 접속](/ko-KR/gateway/remote) 및 [Tailscale](/ko-KR/gateway/tailscale)
- 항상 켜짐 / VPN 설정: [원격 접속](/ko-KR/gateway/remote), [exe.dev](/ko-KR/platforms/exe-dev), [Hetzner](/ko-KR/platforms/hetzner), [macOS 원격](/ko-KR/platforms/mac/remote)

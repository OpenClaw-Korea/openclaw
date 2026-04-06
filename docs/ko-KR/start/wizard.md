---
summary: "CLI 온보딩 마법사: 게이트웨이, 워크스페이스, 채널, 스킬의 가이드 설정"
read_when:
  - 온보딩 마법사 실행 또는 설정 시
  - 새 머신 설정 시
title: "온보딩 마법사"
---

# 온보딩 마법사 (CLI)

온보딩 마법사는 macOS, Linux 또는 Windows(WSL2 권장)에서 OpenClaw를 설정하는 **권장** 방법입니다.
로컬 게이트웨이 또는 원격 게이트웨이 연결, 채널, 스킬, 워크스페이스 기본값을 하나의 가이드 흐름으로 설정합니다.

기본 진입점:

```bash
openclaw onboard
```

가장 빠른 첫 채팅: Control UI를 열어보세요 (채널 설정 불필요). `openclaw dashboard`를 실행하고 브라우저에서 채팅하세요. 문서: [대시보드](/ko-KR/web/dashboard)

후속 재설정:

```bash
openclaw configure
```

권장: Brave Search API 키를 설정하여 에이전트가 `web_search`를 사용할 수 있게 하세요 (`web_fetch`는 키 없이 작동). 가장 쉬운 방법: `openclaw configure --section web`으로 `tools.web.search.apiKey`를 저장합니다. 문서: [웹 도구](/ko-KR/tools/web)

## 빠른시작 vs 고급

마법사는 **빠른시작** (기본값) vs **고급** (전체 제어)로 시작합니다.

**빠른시작**은 기본값을 유지합니다:

- 로컬 게이트웨이 (루프백)
- 워크스페이스 기본값 (또는 기존 워크스페이스)
- 게이트웨이 포트 **18789**
- 게이트웨이 인증 **토큰** (루프백에서도 자동 생성)
- Tailscale 노출 **끔**
- Telegram + WhatsApp DM 기본값은 **허용목록** (전화번호 입력 프롬프트)

**고급**은 모든 단계를 노출합니다 (모드, 워크스페이스, 게이트웨이, 채널, 데몬, 스킬).

## 마법사가 하는 일

**로컬 모드 (기본값)**는 다음을 안내합니다:

- 모델/인증 (OpenAI Code (Codex) 구독 OAuth, Anthropic API 키 (권장) 또는 setup-token (붙여넣기), MiniMax/GLM/Moonshot/AI Gateway 옵션)
- 워크스페이스 위치 + 부트스트랩 파일
- 게이트웨이 설정 (포트/바인드/인증/tailscale)
- 프로바이더 (Telegram, WhatsApp, Discord, Google Chat, Mattermost (플러그인), Signal)
- 데몬 설치 (LaunchAgent / systemd 사용자 유닛)
- 상태 확인
- 스킬 (권장)

**원격 모드**는 다른 곳의 게이트웨이에 연결하도록 로컬 클라이언트만 설정합니다.
원격 호스트에 설치하거나 변경하지 **않습니다**.

더 격리된 에이전트를 추가하려면 (별도 워크스페이스 + 세션 + 인증):

```bash
openclaw agents add <name>
```

팁: `--json`은 비대화형 모드를 의미하지 **않습니다**. 스크립트에는 `--non-interactive` (및 `--workspace`)를 사용하세요.

## 흐름 세부사항 (로컬)

1. **기존 설정 감지**
   - `~/.openclaw/openclaw.json`이 있으면 **유지 / 수정 / 초기화**를 선택합니다.
   - 마법사를 다시 실행해도 명시적으로 **초기화**를 선택하거나 `--reset`을 전달하지 않으면 아무것도 삭제되지 **않습니다**.
   - 설정이 유효하지 않거나 레거시 키가 있으면 마법사가 중지되고 계속하기 전에 `openclaw doctor`를 실행하라고 요청합니다.
   - 초기화는 `trash`를 사용하고 (`rm` 아님) 범위를 제공합니다:
     - 설정만
     - 설정 + 자격 증명 + 세션
     - 전체 초기화 (워크스페이스도 제거)

2. **모델/인증**
   - **Anthropic API 키 (권장)**: `ANTHROPIC_API_KEY`가 있으면 사용하거나 키를 입력받고 데몬용으로 저장합니다.
   - **Anthropic OAuth (Claude Code CLI)**: macOS에서는 마법사가 Keychain 항목 "Claude Code-credentials"를 확인합니다 (launchd 시작이 차단되지 않도록 "항상 허용" 선택); Linux/Windows에서는 `~/.claude/.credentials.json`이 있으면 재사용합니다.
   - **Anthropic 토큰 (setup-token 붙여넣기)**: 아무 머신에서 `claude setup-token`을 실행한 다음 토큰을 붙여넣습니다 (이름 지정 가능; 비워두면 기본값).
   - **OpenAI Code (Codex) 구독 (Codex CLI)**: `~/.codex/auth.json`이 있으면 마법사가 재사용할 수 있습니다.
   - **OpenAI Code (Codex) 구독 (OAuth)**: 브라우저 흐름; `code#state`를 붙여넣습니다.
     - 모델이 설정되지 않았거나 `openai/*`이면 `agents.defaults.model`을 `openai-codex/gpt-5.2`로 설정합니다.
   - **OpenAI API 키**: `OPENAI_API_KEY`가 있으면 사용하거나 키를 입력받고 launchd가 읽을 수 있도록 `~/.openclaw/.env`에 저장합니다.
   - **OpenCode Zen (멀티모델 프록시)**: `OPENCODE_API_KEY`를 입력받습니다 (또는 `OPENCODE_ZEN_API_KEY`, https://opencode.ai/auth에서 발급).
   - **API 키**: 키를 저장합니다.
   - **Vercel AI Gateway (멀티모델 프록시)**: `AI_GATEWAY_API_KEY`를 입력받습니다. 자세한 내용: [Vercel AI Gateway](/ko-KR/providers/vercel-ai-gateway)
   - **MiniMax M2.1**: 설정이 자동 작성됩니다. 자세한 내용: [MiniMax](/ko-KR/providers/minimax)
   - **Synthetic (Anthropic 호환)**: `SYNTHETIC_API_KEY`를 입력받습니다. 자세한 내용: [Synthetic](/ko-KR/providers/synthetic)
   - **Moonshot (Kimi K2)**: 설정이 자동 작성됩니다.
   - **Kimi Coding**: 설정이 자동 작성됩니다. 자세한 내용: [Moonshot AI (Kimi + Kimi Coding)](/ko-KR/providers/moonshot)
   - **건너뛰기**: 아직 인증이 설정되지 않습니다.
   - 감지된 옵션에서 기본 모델을 선택하거나 provider/model을 수동 입력합니다.
   - 마법사가 모델 확인을 실행하고 설정된 모델이 알 수 없거나 인증이 누락되면 경고합니다.

- OAuth 자격 증명은 `~/.openclaw/credentials/oauth.json`에; 인증 프로필은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 있습니다 (API 키 + OAuth).
- 자세한 내용: [/concepts/oauth](/ko-KR/concepts/oauth)

3. **워크스페이스**
   - 기본값 `~/.openclaw/workspace` (설정 가능).
   - 에이전트 부트스트랩 리추얼에 필요한 워크스페이스 파일을 시드합니다.
   - 전체 워크스페이스 레이아웃 + 백업 가이드: [에이전트 워크스페이스](/ko-KR/concepts/agent-workspace)

4. **게이트웨이**
   - 포트, 바인드, 인증 모드, tailscale 노출.
   - 인증 권장: 로컬 WS 클라이언트가 인증해야 하도록 루프백에서도 **토큰**을 유지하세요.
   - 모든 로컬 프로세스를 완전히 신뢰하는 경우에만 인증을 비활성화하세요.
   - 비루프백 바인드는 여전히 인증이 필요합니다.

5. **채널**
   - [WhatsApp](/ko-KR/channels/whatsapp): 선택적 QR 로그인.
   - [Telegram](/ko-KR/channels/telegram): 봇 토큰.
   - [Discord](/ko-KR/channels/discord): 봇 토큰.
   - [Google Chat](/ko-KR/channels/googlechat): 서비스 계정 JSON + 웹훅 오디언스.
   - [Mattermost](/ko-KR/channels/mattermost) (플러그인): 봇 토큰 + 기본 URL.
   - [Signal](/ko-KR/channels/signal): 선택적 `signal-cli` 설치 + 계정 설정.
   - [iMessage](/ko-KR/channels/imessage): 로컬 `imsg` CLI 경로 + DB 접근.
   - DM 보안: 기본값은 페어링입니다. 첫 DM은 코드를 보내고; `openclaw pairing approve <channel> <code>`로 승인하거나 허용목록을 사용하세요.

6. **데몬 설치**
   - macOS: LaunchAgent
     - 로그인된 사용자 세션 필요; 헤드리스의 경우 커스텀 LaunchDaemon을 사용하세요 (제공되지 않음).
   - Linux (및 WSL2를 통한 Windows): systemd 사용자 유닛
     - 마법사는 게이트웨이가 로그아웃 후에도 유지되도록 `loginctl enable-linger <user>`를 통해 링거링을 활성화하려고 시도합니다.
     - sudo를 요청할 수 있습니다 (`/var/lib/systemd/linger` 작성); 먼저 sudo 없이 시도합니다.
   - **런타임 선택:** Node (권장; WhatsApp/Telegram에 필수). Bun은 **권장하지 않습니다**.

7. **상태 확인**
   - 필요한 경우 게이트웨이를 시작하고 `openclaw health`를 실행합니다.
   - 팁: `openclaw status --deep`은 상태 출력에 게이트웨이 상태 프로브를 추가합니다 (도달 가능한 게이트웨이 필요).

8. **스킬 (권장)**
   - 사용 가능한 스킬을 읽고 요구 사항을 확인합니다.
   - 노드 매니저를 선택할 수 있습니다: **npm / pnpm** (bun 권장하지 않음).
   - 선택적 의존성을 설치합니다 (일부는 macOS에서 Homebrew 사용).

9. **완료**
   - 요약 + 추가 기능을 위한 iOS/Android/macOS 앱 포함 다음 단계.

- GUI가 감지되지 않으면 마법사는 브라우저를 열지 않고 Control UI용 SSH 포트 포워드 지침을 출력합니다.
- Control UI 자산이 누락되면 마법사가 빌드를 시도합니다; 폴백은 `pnpm ui:build` (UI 의존성 자동 설치).

## 원격 모드

원격 모드는 다른 곳의 게이트웨이에 연결하도록 로컬 클라이언트를 설정합니다.

설정할 항목:

- 원격 게이트웨이 URL (`ws://...`)
- 원격 게이트웨이가 인증을 요구하면 토큰 (권장)

참고:

- 원격 설치나 데몬 변경은 수행되지 않습니다.
- 게이트웨이가 루프백 전용이면 SSH 터널링이나 tailnet을 사용하세요.
- 디스커버리 힌트:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

## 다른 에이전트 추가

`openclaw agents add <name>`을 사용하여 자체 워크스페이스, 세션, 인증 프로필을 가진 별도의 에이전트를 생성합니다. `--workspace` 없이 실행하면 마법사가 시작됩니다.

설정 항목:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

참고:

- 기본 워크스페이스는 `~/.openclaw/workspace-<agentId>`를 따릅니다.
- 인바운드 메시지를 라우팅하려면 `bindings`를 추가하세요 (마법사가 할 수 있음).
- 비대화형 플래그: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## 비대화형 모드

`--non-interactive`를 사용하여 온보딩을 자동화하거나 스크립트화합니다:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

머신이 읽을 수 있는 요약을 위해 `--json`을 추가합니다.

## 마법사가 작성하는 것

`~/.openclaw/openclaw.json`의 일반적인 필드:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (Minimax 선택 시)
- `gateway.*` (mode, bind, auth, tailscale)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.signal.*`, `channels.imessage.*`
- 프롬프트에서 옵트인할 때 채널 허용목록 (Slack/Discord/Matrix/Microsoft Teams) (가능한 경우 이름을 ID로 해석).
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`는 `agents.list[]`와 선택적 `bindings`를 작성합니다.

WhatsApp 자격 증명은 `~/.openclaw/credentials/whatsapp/<accountId>/`에 저장됩니다.
세션은 `~/.openclaw/agents/<agentId>/sessions/`에 저장됩니다.

일부 채널은 플러그인으로 제공됩니다. 온보딩 중 하나를 선택하면 마법사가 설정하기 전에 설치하라는 프롬프트를 표시합니다 (npm 또는 로컬 경로).

## 관련 문서

- macOS 앱 온보딩: [온보딩](/ko-KR/start/onboarding)
- 설정 참조: [게이트웨이 설정](/ko-KR/gateway/configuration)
- 프로바이더: [WhatsApp](/ko-KR/channels/whatsapp), [Telegram](/ko-KR/channels/telegram), [Discord](/ko-KR/channels/discord), [Google Chat](/ko-KR/channels/googlechat), [Signal](/ko-KR/channels/signal), [iMessage](/ko-KR/channels/imessage)
- 스킬: [스킬](/ko-KR/tools/skills), [스킬 설정](/ko-KR/tools/skills-config)

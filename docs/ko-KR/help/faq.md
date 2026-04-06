---
summary: "OpenClaw 설정, 설정 및 사용에 대한 자주 묻는 질문"
title: "FAQ"
---

# FAQ

실제 설정 (로컬 개발, VPS, 다중 에이전트, OAuth/API 키, 모델 페일오버)에 대한 빠른 답변과 심층 문제 해결입니다. 런타임 진단은 [문제 해결](/gateway/troubleshooting)을 참조하세요. 전체 설정 참조는 [설정](/gateway/configuration)을 참조하세요.

## 목차

- [빠른 시작 및 초기 설정](#빠른-시작-및-초기-설정)
- [OpenClaw란 무엇인가](#openclaw란-무엇인가)
- [스킬 및 자동화](#스킬-및-자동화)
- [샌드박싱 및 메모리](#샌드박싱-및-메모리)
- [디스크의 데이터 위치](#디스크의-데이터-위치)
- [설정 기본사항](#설정-기본사항)
- [원격 게이트웨이 + 노드](#원격-게이트웨이--노드)
- [환경 변수 및 .env 로딩](#환경-변수-및-env-로딩)
- [세션 및 다중 채팅](#세션-및-다중-채팅)
- [모델: 기본값, 선택, 별칭, 전환](#모델-기본값-선택-별칭-전환)
- [모델 페일오버 및 "모든 모델 실패"](#모델-페일오버-및-모든-모델-실패)
- [인증 프로필: 정의 및 관리 방법](#인증-프로필-정의-및-관리-방법)
- [게이트웨이: 포트, "이미 실행 중", 원격 모드](#게이트웨이-포트-이미-실행-중-원격-모드)
- [로깅 및 디버깅](#로깅-및-디버깅)
- [미디어 및 첨부파일](#미디어-및-첨부파일)
- [보안 및 액세스 제어](#보안-및-액세스-제어)
- [채팅 명령, 작업 중단, "멈추지 않음"](#채팅-명령-작업-중단-멈추지-않음)

## 문제 발생 시 처음 60초

1. **빠른 상태 (첫 번째 확인)**

   ```bash
   openclaw status
   ```

   빠른 로컬 요약: OS + 업데이트, 게이트웨이/서비스 연결 가능성, 에이전트/세션, 프로바이더 설정 + 런타임 문제 (게이트웨이 연결 가능 시).

2. **붙여넣기 가능한 보고서 (공유 안전)**

   ```bash
   openclaw status --all
   ```

   읽기 전용 진단 및 로그 테일 (토큰 편집됨).

3. **데몬 + 포트 상태**

   ```bash
   openclaw gateway status
   ```

   슈퍼바이저 런타임 vs RPC 연결 가능성, 프로브 대상 URL, 서비스가 사용한 것으로 보이는 설정을 표시합니다.

4. **심층 프로브**

   ```bash
   openclaw status --deep
   ```

   게이트웨이 상태 점검 + 프로바이더 프로브 실행 (연결 가능한 게이트웨이 필요). [Health](/gateway/health)를 참조하세요.

5. **최신 로그 테일**

   ```bash
   openclaw logs --follow
   ```

   RPC가 다운된 경우 대체:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   파일 로그는 서비스 로그와 별개입니다. [로깅](/logging) 및 [문제 해결](/gateway/troubleshooting)을 참조하세요.

6. **Doctor 실행 (복구)**

   ```bash
   openclaw doctor
   ```

   설정/상태 복구/마이그레이션 + 상태 점검 실행. [Doctor](/gateway/doctor)를 참조하세요.

7. **게이트웨이 스냅샷**
   ```bash
   openclaw health --json
   openclaw health --verbose   # 오류 시 대상 URL + 설정 경로 표시
   ```
   실행 중인 게이트웨이에 전체 스냅샷 요청 (WS 전용). [Health](/gateway/health)를 참조하세요.

## 빠른 시작 및 초기 설정

### 막혔습니다. 가장 빠르게 문제를 해결하는 방법은 무엇인가요

**머신을 볼 수 있는** 로컬 AI 에이전트를 사용하세요. 대부분의 "막혔습니다" 사례는 원격 도우미가 검사할 수 없는 **로컬 설정 또는 환경 문제**이기 때문에 Discord에서 묻는 것보다 훨씬 효과적입니다.

- **Claude Code**: https://www.anthropic.com/claude-code/
- **OpenAI Codex**: https://openai.com/codex/

이러한 도구는 리포지토리를 읽고, 명령을 실행하고, 로그를 검사하고, 머신 수준 설정 (PATH, 서비스, 권한, 인증 파일)을 수정할 수 있습니다. 해킹 가능한 (git) 설치를 통해 **전체 소스 체크아웃**을 제공하세요.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

이렇게 하면 **git 체크아웃에서** OpenClaw를 설치하므로 에이전트가 코드 + 문서를 읽고 실행 중인 정확한 버전에 대해 추론할 수 있습니다. `--install-method git` 없이 설치 프로그램을 다시 실행하여 나중에 언제든지 stable로 다시 전환할 수 있습니다.

팁: 에이전트에게 수정 사항을 **계획하고 감독**하도록 요청한 다음 (단계별) 필요한 명령만 실행하세요. 그러면 변경 사항이 작고 감사하기 쉬워집니다.

실제 버그나 수정 사항을 발견하면 GitHub 이슈를 제출하거나 PR을 보내주세요:
https://github.com/openclaw/openclaw/issues
https://github.com/openclaw/openclaw/pulls

다음 명령으로 시작하세요 (도움을 요청할 때 출력 공유):

```bash
openclaw status
openclaw models status
openclaw doctor
```

각 명령의 기능:

- `openclaw status`: 게이트웨이/에이전트 상태 + 기본 설정의 빠른 스냅샷.
- `openclaw models status`: 프로바이더 인증 + 모델 가용성 확인.
- `openclaw doctor`: 일반적인 설정/상태 문제 검증 및 복구.

기타 유용한 CLI 확인: `openclaw status --all`, `openclaw logs --follow`, `openclaw gateway status`, `openclaw health --verbose`

빠른 디버그 루프: [문제 발생 시 처음 60초](#문제-발생-시-처음-60초)
설치 문서: [설치](/install), [설치 프로그램 플래그](/install/installer), [업데이트](/install/updating)

### OpenClaw를 설치하고 설정하는 권장 방법은 무엇인가요

리포지토리는 소스에서 실행하고 온보딩 마법사를 사용하는 것을 권장합니다.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw onboard --install-daemon
```

마법사는 UI 자산도 자동으로 빌드할 수 있습니다. 온보딩 후 일반적으로 포트 **18789**에서 게이트웨이를 실행합니다.

소스에서 (기여자/개발자):

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build # 첫 실행 시 UI 종속성 자동 설치
openclaw onboard
```

아직 전역 설치가 없는 경우 `pnpm openclaw onboard`를 통해 실행하세요.

### 온보딩 후 대시보드를 어떻게 여나요

마법사는 이제 온보딩 직후 토큰이 포함된 대시보드 URL로 브라우저를 열고 요약에 전체 링크 (토큰 포함)도 출력합니다. 해당 탭을 열어 두세요. 실행되지 않은 경우 동일한 머신에서 출력된 URL을 복사/붙여넣기하세요. 토큰은 호스트에 로컬로 유지됩니다. 브라우저에서 가져오는 것은 없습니다.

### localhost vs 원격에서 대시보드 토큰 인증 방법

**Localhost (동일한 머신):**

- `http://127.0.0.1:18789/` 열기.
- 인증을 요청하면 `openclaw dashboard`를 실행하고 토큰 링크 (`?token=...`)를 사용하세요.
- 토큰은 `gateway.auth.token` (또는 `OPENCLAW_GATEWAY_TOKEN`)과 동일한 값이며 첫 로드 후 UI에 저장됩니다.

**localhost가 아닌 경우:**

- **Tailscale Serve** (권장): 바인드를 루프백으로 유지하고 `openclaw gateway --tailscale serve`를 실행한 후 `https://<magicdns>/`를 여세요. `gateway.auth.allowTailscale`이 `true`이면 아이덴티티 헤더가 인증을 만족합니다 (토큰 불필요).
- **Tailnet 바인드**: `openclaw gateway --bind tailnet --token "<token>"`을 실행하고 `http://<tailscale-ip>:18789/`를 연 후 대시보드 설정에 토큰을 붙여넣으세요.
- **SSH 터널**: `ssh -N -L 18789:127.0.0.1:18789 user@host`를 실행한 후 `openclaw dashboard`에서 `http://127.0.0.1:18789/?token=...`를 여세요.

바인드 모드 및 인증 세부정보는 [대시보드](/web/dashboard) 및 [웹 인터페이스](/web)를 참조하세요.

### 어떤 런타임이 필요한가요

Node **>= 22**가 필요합니다. `pnpm`을 권장합니다. 게이트웨이에는 Bun을 **권장하지 않습니다**.

### Raspberry Pi에서 실행되나요

예. 게이트웨이는 가볍습니다. 문서에는 개인 사용을 위해 **512MB-1GB RAM**, **1코어**, 약 **500MB** 디스크면 충분하며 **Raspberry Pi 4에서 실행할 수 있다**고 나와 있습니다.

추가 여유 공간 (로그, 미디어, 기타 서비스)을 원하면 **2GB를 권장**하지만 하드 최소값은 아닙니다.

팁: 작은 Pi/VPS가 게이트웨이를 호스팅할 수 있으며 로컬 화면/카메라/캔버스 또는 명령 실행을 위해 노트북/휴대폰에 **노드**를 페어링할 수 있습니다. [노드](/nodes)를 참조하세요.

### "wake up my friend"에 멈춰 있고 온보딩이 부화하지 않습니다. 어떻게 하나요

해당 화면은 게이트웨이에 연결 가능하고 인증되어야 합니다. TUI는 첫 부화 시 "Wake up, my friend!"를 자동으로 전송합니다. **응답 없이** 해당 줄이 표시되고 토큰이 0으로 유지되면 에이전트가 실행되지 않은 것입니다.

1. 게이트웨이 재시작:

```bash
openclaw gateway restart
```

2. 상태 + 인증 확인:

```bash
openclaw status
openclaw models status
openclaw logs --follow
```

3. 여전히 멈춰 있으면 실행:

```bash
openclaw doctor
```

게이트웨이가 원격에 있는 경우 터널/Tailscale 연결이 작동하고 UI가 올바른 게이트웨이를 가리키고 있는지 확인하세요. [원격 액세스](/gateway/remote)를 참조하세요.

### 새 머신 (Mac mini)으로 설정을 마이그레이션할 수 있나요 (온보딩 재수행 없이)

예. **상태 디렉터리**와 **작업 공간**을 복사한 후 Doctor를 한 번 실행하세요. **두 위치**를 모두 복사하면 봇이 "정확히 동일하게" (메모리, 세션 기록, 인증, 채널 상태) 유지됩니다.

1. 새 머신에 OpenClaw를 설치합니다.
2. 이전 머신에서 `$OPENCLAW_STATE_DIR` (기본값: `~/.openclaw`)을 복사합니다.
3. 작업 공간 (기본값: `~/.openclaw/workspace`)을 복사합니다.
4. `openclaw doctor`를 실행하고 게이트웨이 서비스를 재시작합니다.

그러면 설정, 인증 프로필, WhatsApp 자격 증명, 세션, 메모리가 유지됩니다. 원격 모드인 경우 게이트웨이 호스트가 세션 저장소와 작업 공간을 소유합니다.

**중요:** 작업 공간만 GitHub에 커밋/푸시하는 경우 **메모리 + 부트스트랩 파일**을 백업하는 것이지만 세션 기록이나 인증은 **백업하지 않습니다**. 이들은 `~/.openclaw/` 아래에 있습니다 (예: `~/.openclaw/agents/<agentId>/sessions/`).

관련: [마이그레이션](/install/migrating), [디스크의 데이터 위치](#openclaw는-데이터를-어디에-저장하나요), [에이전트 작업 공간](/concepts/agent-workspace), [Doctor](/gateway/doctor), [원격 모드](/gateway/remote)

### 최신 버전의 새로운 기능은 어디에서 확인하나요

GitHub 체인지로그를 확인하세요:
https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md

최신 항목이 맨 위에 있습니다. 맨 위 섹션이 **Unreleased**로 표시되면 다음 날짜 섹션이 최신 출시 버전입니다. 항목은 **Highlights**, **Changes**, **Fixes** (필요 시 문서/기타 섹션 추가)로 그룹화되어 있습니다.

### `docs.openclaw.ai`에 액세스할 수 없습니다 (SSL 오류). 어떻게 하나요

일부 Comcast/Xfinity 연결은 Xfinity Advanced Security를 통해 `docs.openclaw.ai`를 잘못 차단합니다. 비활성화하거나 `docs.openclaw.ai`를 허용 목록에 추가한 후 다시 시도하세요. 자세한 내용: [문제 해결](/help/troubleshooting#docsopenclawai-shows-an-ssl-error-comcastxfinity)
여기에 보고하여 차단 해제를 도와주세요: https://spa.xfinity.com/check_url_status

여전히 사이트에 연결할 수 없는 경우 문서는 GitHub에 미러링되어 있습니다:
https://github.com/openclaw/openclaw/tree/main/docs

### stable과 beta의 차이점은 무엇인가요

**Stable**과 **beta**는 별도의 코드 라인이 아닌 **npm dist-tag**입니다.

- `latest` = stable
- `beta` = 테스트용 조기 빌드

빌드를 **beta**에 출시하고 테스트한 후 빌드가 안정되면 **동일한 버전을 `latest`로 승격**합니다. 그래서 beta와 stable이 **동일한 버전**을 가리킬 수 있습니다.

변경 사항 확인:
https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md

## OpenClaw란 무엇인가

### OpenClaw란 무엇인가요 (한 단락으로)

OpenClaw는 메시징 앱 (Telegram, WhatsApp, Discord, Slack, iMessage 등)을 AI 에이전트와 연결하는 오픈 소스 게이트웨이입니다. 스킬, 메모리, 자동화 (크론, 훅), 샌드박싱 및 다중 에이전트 지원을 제공합니다. 자체 호스팅되며 개인 정보를 보호하고 확장 가능합니다.

### 가치 제안은 무엇인가요

- **자체 호스팅**: 데이터와 에이전트를 제어합니다.
- **메시징 앱 통합**: 어디서나 봇과 채팅합니다.
- **스킬 + 메모리**: 장기 메모리 및 사용자 정의 도구로 봇을 가르칩니다.
- **자동화**: 크론 작업, 웹훅, 이벤트 기반 훅.
- **샌드박싱**: 안전한 코드 실행.
- **다중 에이전트**: 여러 에이전트, 여러 모델, 여러 채널.

## 디스크의 데이터 위치

### OpenClaw와 함께 사용되는 모든 데이터가 로컬로 저장되나요

예. OpenClaw는 자체 호스팅됩니다. 모든 설정, 세션, 메모리, 자격 증명은 머신에 로컬로 저장됩니다 (기본값: `~/.openclaw`).

### OpenClaw는 데이터를 어디에 저장하나요

기본 위치:

- **상태 디렉터리**: `~/.openclaw` (설정, 인증, 세션, 로그, 자격 증명)
- **작업 공간**: `~/.openclaw/workspace` (에이전트 파일, 메모리, 사용자 정의 스킬)

환경 변수로 재정의:

- `OPENCLAW_STATE_DIR`: 상태 디렉터리 경로
- `OPENCLAW_WORKSPACE`: 작업 공간 경로

관련: [에이전트 작업 공간](/concepts/agent-workspace), [설정](/gateway/configuration)

## 설정 기본사항

### 설정 형식은 무엇이고 어디에 있나요

**형식**: JSON5 (주석 포함 JSON)

**위치**: `~/.openclaw/openclaw.json` (또는 `$OPENCLAW_STATE_DIR/openclaw.json`)

**편집**: `openclaw config edit` 또는 대시보드 설정 탭

**보기**: `openclaw config get`

**설정**: `openclaw config set <key> <value>`

전체 참조: [설정](/gateway/configuration)

### 설정 변경 후 재시작해야 하나요

대부분의 경우 **예**. 설정 변경 후 게이트웨이를 재시작하세요.

```bash
openclaw gateway restart
```

대시보드는 `config.apply`를 제공하여 유효성 검사 + 재시작을 수행합니다.

## 게이트웨이 포트 이미 실행 중 원격 모드

### 게이트웨이는 어떤 포트를 사용하나요

기본값: **18789**

재정의: `gateway.port` 또는 `OPENCLAW_GATEWAY_PORT`

확인: `openclaw gateway status`

### "또 다른 게이트웨이 인스턴스가 이미 수신 대기 중"은 무엇을 의미하나요

게이트웨이가 이미 동일한 포트에서 실행 중입니다.

수정:

```bash
openclaw gateway restart
```

또는:

```bash
openclaw gateway stop
openclaw gateway start
```

## 로깅 및 디버깅

### 로그는 어디에 있나요

**파일 로그**: `/tmp/openclaw/openclaw-*.log` (또는 `$OPENCLAW_STATE_DIR/logs/`)

**서비스 로그**: `openclaw logs --follow`

**게이트웨이 로그**: Control UI 로그 탭 또는 `logs.tail` RPC

자세한 내용: [로깅](/logging), [게이트웨이 로깅](/gateway/logging)

### 게이트웨이 서비스를 시작/중지/재시작하려면 어떻게 하나요

```bash
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway status
```

## 보안 및 액세스 제어

### OpenClaw를 인바운드 DM에 노출하는 것이 안전한가요

**개인 사용**: 예, 허용 목록 (`telegram.allowFrom`, `discord.allowFrom` 등) 사용 시.

**공개 봇**: 아니요. 프롬프트 주입 및 악용 가능성이 있습니다. 공개 봇의 경우 제한된 스킬 + 실행 승인을 사용하세요.

관련: [보안](/gateway/security), [페어링](/concepts/pairing)

## 채팅 명령 작업 중단 멈추지 않음

### 실행 중인 작업을 중지/취소하려면 어떻게 하나요

채팅에서:

```
/stop
```

또는:

```
stop
esc
abort
wait
exit
interrupt
```

Control UI: **Stop** 버튼 클릭

CLI: `openclaw chat abort`

관련: [채팅 명령](/cli/chat), [Control UI](/web/control-ui)

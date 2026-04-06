---
summary: "일반적인 OpenClaw 장애에 대한 빠른 문제 해결 가이드"
read_when:
  - 런타임 문제 또는 장애 조사 시
title: "문제 해결"
---

# 문제 해결 🔧

OpenClaw가 오작동할 때 수정하는 방법입니다.

빠른 점검 절차를 원하시면 FAQ의 [처음 60초](/help/faq#first-60-seconds-if-somethings-broken)부터 시작하세요. 이 페이지는 런타임 장애 및 진단에 대해 더 깊이 다룹니다.

프로바이더별 단축키: [/channels/troubleshooting](/channels/troubleshooting)

## 상태 및 진단

빠른 점검 명령 (순서대로):

| 명령                               | 알려주는 내용                                                                                      | 사용 시기                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `openclaw status`                  | 로컬 요약: OS + 업데이트, 게이트웨이 도달 가능성/모드, 서비스, 에이전트/세션, 프로바이더 설정 상태 | 첫 번째 확인, 빠른 개요                                  |
| `openclaw status --all`            | 전체 로컬 진단 (읽기 전용, 붙여넣기 가능, 안전함) 로그 tail 포함                                   | 디버그 리포트를 공유해야 할 때                           |
| `openclaw status --deep`           | 게이트웨이 상태 확인 실행 (프로바이더 프로브 포함; 도달 가능한 게이트웨이 필요)                    | "설정됨"이 "작동함"을 의미하지 않을 때                   |
| `openclaw gateway probe`           | 게이트웨이 검색 + 도달 가능성 (로컬 + 원격 타겟)                                                   | 잘못된 게이트웨이를 프로브하고 있다고 의심될 때          |
| `openclaw channels status --probe` | 실행 중인 게이트웨이에 채널 상태 요청 (및 선택적으로 프로브)                                       | 게이트웨이는 도달 가능하지만 채널이 오작동할 때          |
| `openclaw gateway status`          | 슈퍼바이저 상태 (launchd/systemd/schtasks), 런타임 PID/종료, 마지막 게이트웨이 오류                | 서비스가 "로드됨"처럼 보이지만 아무것도 실행되지 않을 때 |
| `openclaw logs --follow`           | 실시간 로그 (런타임 문제에 대한 최상의 신호)                                                       | 실제 장애 이유가 필요할 때                               |

**출력 공유:** `openclaw status --all`을 선호하세요 (토큰을 삭제합니다). `openclaw status`를 붙여넣는 경우 먼저 `OPENCLAW_SHOW_SECRETS=0` 설정을 고려하세요 (토큰 미리보기).

참조: [상태 확인](/gateway/health) 및 [로깅](/logging).

## 일반적인 문제

### No API key found for provider "anthropic"

이는 **에이전트의 인증 저장소가 비어있거나** Anthropic 자격 증명이 누락되었음을 의미합니다.
인증은 **에이전트별**로 이루어지므로 새 에이전트는 메인 에이전트의 키를 상속받지 않습니다.

수정 옵션:

- 온보딩을 다시 실행하고 해당 에이전트에 대해 **Anthropic**을 선택합니다.
- 또는 **게이트웨이 호스트**에서 setup-token을 붙여넣습니다:
  ```bash
  openclaw models auth setup-token --provider anthropic
  ```
- 또는 메인 에이전트 디렉토리에서 새 에이전트 디렉토리로 `auth-profiles.json`을 복사합니다.

확인:

```bash
openclaw models status
```

### OAuth token refresh failed (Anthropic Claude subscription)

이는 저장된 Anthropic OAuth 토큰이 만료되고 갱신에 실패했음을 의미합니다.
Claude 구독 (API 키 없음)을 사용 중이라면 가장 안정적인 수정 방법은
**Claude Code setup-token**으로 전환하고 **게이트웨이 호스트**에 붙여넣는 것입니다.

**권장 (setup-token):**

```bash
# 게이트웨이 호스트에서 실행 (setup-token 붙여넣기)
openclaw models auth setup-token --provider anthropic
openclaw models status
```

다른 곳에서 토큰을 생성한 경우:

```bash
openclaw models auth paste-token --provider anthropic
openclaw models status
```

자세한 내용: [Anthropic](/providers/anthropic) 및 [OAuth](/concepts/oauth).

### Control UI fails on HTTP ("device identity required" / "connect failed")

일반 HTTP로 대시보드를 열면 (예: `http://<lan-ip>:18789/` 또는
`http://<tailscale-ip>:18789/`), 브라우저가 **비보안 컨텍스트**에서 실행되어
WebCrypto를 차단하므로 디바이스 ID를 생성할 수 없습니다.

**수정:**

- [Tailscale Serve](/gateway/tailscale)를 통한 HTTPS를 선호하세요.
- 또는 게이트웨이 호스트에서 로컬로 엽니다: `http://127.0.0.1:18789/`.
- HTTP를 유지해야 하는 경우 `gateway.controlUi.allowInsecureAuth: true`를 활성화하고
  게이트웨이 토큰을 사용하세요 (토큰만; 디바이스 ID/페어링 없음).
  [Control UI](/web/control-ui#insecure-http)를 참조하세요.

### CI Secrets Scan Failed

이는 `detect-secrets`가 베이스라인에 아직 없는 새로운 후보를 발견했음을 의미합니다.
[비밀 스캔](/gateway/security#secret-scanning-detect-secrets)을 따르세요.

### Service Installed but Nothing is Running

게이트웨이 서비스가 설치되었지만 프로세스가 즉시 종료되면 서비스가
"로드됨"으로 보이지만 아무것도 실행되지 않을 수 있습니다.

**확인:**

```bash
openclaw gateway status
openclaw doctor
```

Doctor/service가 런타임 상태 (PID/마지막 종료) 및 로그 힌트를 표시합니다.

**로그:**

- 선호: `openclaw logs --follow`
- 파일 로그 (항상): `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (또는 설정된 `logging.file`)
- macOS LaunchAgent (설치된 경우): `$OPENCLAW_STATE_DIR/logs/gateway.log` 및 `gateway.err.log`
- Linux systemd (설치된 경우): `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
- Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

**더 많은 로깅 활성화:**

- 파일 로그 상세도 증가 (지속된 JSONL):
  ```json
  { "logging": { "level": "debug" } }
  ```
- 콘솔 상세도 증가 (TTY 출력만):
  ```json
  { "logging": { "consoleLevel": "debug", "consoleStyle": "pretty" } }
  ```
- 빠른 팁: `--verbose`는 **콘솔** 출력에만 영향을 줍니다. 파일 로그는 `logging.level`에 의해 제어됩니다.

로깅에 대한 전체 개요는 [/logging](/logging)을 참조하세요.

### "Gateway start blocked: set gateway.mode=local"

이는 설정이 존재하지만 `gateway.mode`가 설정되지 않았거나 (`local`이 아님), 그래서
게이트웨이가 시작을 거부함을 의미합니다.

**수정 (권장):**

- 마법사를 실행하고 게이트웨이 실행 모드를 **Local**로 설정합니다:
  ```bash
  openclaw configure
  ```
- 또는 직접 설정합니다:
  ```bash
  openclaw config set gateway.mode local
  ```

**원격 게이트웨이를 실행하려는 경우:**

- 원격 URL을 설정하고 `gateway.mode=remote`를 유지합니다:
  ```bash
  openclaw config set gateway.mode remote
  openclaw config set gateway.remote.url "wss://gateway.example.com"
  ```

**임시/개발용만:** `gateway.mode=local` 없이 게이트웨이를 시작하려면 `--allow-unconfigured`를 전달합니다.

**설정 파일이 아직 없나요?** `openclaw setup`을 실행하여 시작 설정을 생성한 다음 게이트웨이를 다시 실행합니다.

### Service Environment (PATH + runtime)

게이트웨이 서비스는 셸/관리자 잔여물을 피하기 위해 **최소 PATH**로 실행됩니다:

- macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
- Linux: `/usr/local/bin`, `/usr/bin`, `/bin`

이는 의도적으로 버전 관리자(nvm/fnm/volta/asdf) 및 패키지
관리자(pnpm/npm)를 제외합니다. 서비스가 셸 초기화를 로드하지 않기 때문입니다. 런타임
변수인 `DISPLAY`는 `~/.openclaw/.env`에 있어야 합니다 (게이트웨이가 일찍 로드).
`host=gateway`에서 Exec 실행은 로그인 셸 `PATH`를 exec 환경에 병합하므로
누락된 도구는 일반적으로 셸 초기화가 내보내지 않음을 의미합니다 (또는
`tools.exec.pathPrepend`를 설정). [/tools/exec](/tools/exec)을 참조하세요.

WhatsApp + Telegram 채널은 **Node**가 필요합니다; Bun은 지원되지 않습니다. 서비스가
Bun 또는 버전 관리 Node 경로로 설치된 경우 `openclaw doctor`를 실행하여
시스템 Node 설치로 마이그레이션합니다.

### Skill missing API key in sandbox

**증상:** 스킬이 호스트에서는 작동하지만 샌드박스에서 누락된 API 키로 실패합니다.

**이유:** 샌드박스 exec는 Docker 내부에서 실행되며 호스트 `process.env`를 상속받지 **않습니다**.

**수정:**

- `agents.defaults.sandbox.docker.env`를 설정합니다 (또는 에이전트별 `agents.list[].sandbox.docker.env`)
- 또는 사용자 정의 샌드박스 이미지에 키를 포함시킵니다
- 그런 다음 `openclaw sandbox recreate --agent <id>` (또는 `--all`)를 실행합니다

### Service Running but Port Not Listening

서비스가 **실행 중**으로 보고되지만 게이트웨이 포트에서 아무것도 수신하지 않으면
게이트웨이가 바인드를 거부했을 가능성이 높습니다.

**여기서 "실행 중"의 의미**

- `Runtime: running`은 슈퍼바이저 (launchd/systemd/schtasks)가 프로세스가 살아있다고 생각함을 의미합니다.
- `RPC probe`는 CLI가 실제로 게이트웨이 WebSocket에 연결하고 `status`를 호출할 수 있었음을 의미합니다.
- 항상 `Probe target:` + `Config (service):`를 "실제로 무엇을 시도했나?" 라인으로 신뢰하세요.

**확인:**

- `openclaw gateway` 및 서비스에 대해 `gateway.mode`가 `local`이어야 합니다.
- `gateway.mode=remote`를 설정한 경우 **CLI 기본값**은 원격 URL입니다. 서비스는 여전히 로컬에서 실행 중일 수 있지만 CLI가 잘못된 위치를 프로브할 수 있습니다. `openclaw gateway status`를 사용하여 서비스의 해결된 포트 + 프로브 타겟을 확인합니다 (또는 `--url` 전달).
- `openclaw gateway status` 및 `openclaw doctor`는 서비스가 실행 중처럼 보이지만 포트가 닫혀있을 때 로그에서 **마지막 게이트웨이 오류**를 표시합니다.
- 루프백이 아닌 바인드 (`lan`/`tailnet`/`custom`, 또는 루프백을 사용할 수 없을 때 `auto`)는 인증이 필요합니다:
  `gateway.auth.token` (또는 `OPENCLAW_GATEWAY_TOKEN`).
- `gateway.remote.token`은 원격 CLI 호출 전용입니다; 로컬 인증을 활성화하지 **않습니다**.
- `gateway.token`은 무시됩니다; `gateway.auth.token`을 사용하세요.

**`openclaw gateway status`가 설정 불일치를 표시하는 경우**

- `Config (cli): ...`와 `Config (service): ...`는 일반적으로 일치해야 합니다.
- 일치하지 않으면 서비스가 다른 설정을 실행하는 동안 하나의 설정을 편집하고 있을 가능성이 높습니다.
- 수정: 서비스가 사용할 동일한 `--profile` / `OPENCLAW_STATE_DIR`에서 `openclaw gateway install --force`를 다시 실행합니다.

**`openclaw gateway status`가 서비스 설정 문제를 보고하는 경우**

- 슈퍼바이저 설정 (launchd/systemd/schtasks)이 현재 기본값을 누락하고 있습니다.
- 수정: `openclaw doctor`를 실행하여 업데이트합니다 (또는 전체 재작성을 위해 `openclaw gateway install --force`).

**`Last gateway error:`가 "refusing to bind … without auth"를 언급하는 경우**

- `gateway.bind`를 루프백이 아닌 모드 (`lan`/`tailnet`/`custom`, 또는 루프백을 사용할 수 없을 때 `auto`)로 설정했지만 인증을 설정하지 않았습니다.
- 수정: `gateway.auth.mode` + `gateway.auth.token`을 설정합니다 (또는 `OPENCLAW_GATEWAY_TOKEN` 내보내기) 그리고 서비스를 재시작합니다.

**`openclaw gateway status`가 `bind=tailnet`이지만 tailnet 인터페이스를 찾을 수 없다고 말하는 경우**

- 게이트웨이가 Tailscale IP (100.64.0.0/10)에 바인드하려고 했지만 호스트에서 감지되지 않았습니다.
- 수정: 해당 머신에서 Tailscale을 활성화합니다 (또는 `gateway.bind`를 `loopback`/`lan`으로 변경).

**`Probe note:`가 프로브가 루프백을 사용한다고 말하는 경우**

- `bind=lan`의 경우 예상됩니다: 게이트웨이는 `0.0.0.0` (모든 인터페이스)에서 수신하며 루프백은 여전히 로컬로 연결되어야 합니다.
- 원격 클라이언트의 경우 실제 LAN IP (`0.0.0.0`이 아님)와 포트를 사용하고 인증이 설정되었는지 확인합니다.

### Address Already in Use (Port 18789)

이는 게이트웨이 포트에서 이미 무언가가 수신 중임을 의미합니다.

**확인:**

```bash
openclaw gateway status
```

리스너 및 가능한 원인 (게이트웨이가 이미 실행 중, SSH 터널)을 표시합니다.
필요한 경우 서비스를 중지하거나 다른 포트를 선택합니다.

### Extra Workspace Folders Detected

이전 설치에서 업그레이드한 경우 디스크에 `~/openclaw`가 여전히 있을 수 있습니다.
여러 워크스페이스 디렉토리는 혼란스러운 인증 또는 상태 드리프트를 유발할 수 있습니다.
하나의 워크스페이스만 활성화되기 때문입니다.

**수정:** 단일 활성 워크스페이스를 유지하고 나머지는 보관/제거합니다.
[에이전트 워크스페이스](/concepts/agent-workspace#extra-workspace-folders)를 참조하세요.

### Main chat running in a sandbox workspace

증상: 호스트 워크스페이스를 예상했지만 `pwd` 또는 파일 도구가 `~/.openclaw/sandboxes/...`를 표시합니다.

**이유:** `agents.defaults.sandbox.mode: "non-main"`은 `session.mainKey` (기본값 `"main"`)를 기준으로 합니다.
그룹/채널 세션은 자체 키를 사용하므로 비메인으로 처리되어
샌드박스 워크스페이스를 얻습니다.

**수정 옵션:**

- 에이전트에 대한 호스트 워크스페이스를 원하는 경우: `agents.list[].sandbox.mode: "off"`를 설정합니다.
- 샌드박스 내부에서 호스트 워크스페이스 액세스를 원하는 경우: 해당 에이전트에 대해 `workspaceAccess: "rw"`를 설정합니다.

### "Agent was aborted"

에이전트가 응답 중간에 중단되었습니다.

**원인:**

- 사용자가 `stop`, `abort`, `esc`, `wait`, 또는 `exit`를 보냄
- 타임아웃 초과
- 프로세스 충돌

**수정:** 다른 메시지를 보내기만 하면 됩니다. 세션은 계속됩니다.

### "Agent failed before reply: Unknown model: anthropic/claude-haiku-3-5"

OpenClaw는 의도적으로 **이전/불안전한 모델** (특히 프롬프트 주입에 더 취약한 모델)을 거부합니다. 이 오류가 표시되면 모델 이름이 더 이상
지원되지 않습니다.

**수정:**

- 프로바이더에 대한 **최신** 모델을 선택하고 설정 또는 모델 별칭을 업데이트합니다.
- 사용 가능한 모델이 확실하지 않은 경우 `openclaw models list` 또는
  `openclaw models scan`을 실행하고 지원되는 모델을 선택합니다.
- 상세한 실패 이유는 게이트웨이 로그를 확인합니다.

참조: [Models CLI](/cli/models) 및 [모델 프로바이더](/concepts/model-providers).

### Messages Not Triggering

**확인 1:** 발신자가 허용 목록에 있나요?

```bash
openclaw status
```

출력에서 `AllowFrom: ...`을 찾습니다.

**확인 2:** 그룹 채팅의 경우 멘션이 필요한가요?

```bash
# 메시지는 mentionPatterns 또는 명시적 멘션과 일치해야 합니다; 기본값은 채널 그룹/길드에 있습니다.
# 다중 에이전트: `agents.list[].groupChat.mentionPatterns`가 전역 패턴을 재정의합니다.
grep -n "agents\\|groupChat\\|mentionPatterns\\|channels\\.whatsapp\\.groups\\|channels\\.telegram\\.groups\\|channels\\.imessage\\.groups\\|channels\\.discord\\.guilds" \
  "${OPENCLAW_CONFIG_PATH:-$HOME/.openclaw/openclaw.json}"
```

**확인 3:** 로그 확인

```bash
openclaw logs --follow
# 또는 빠른 필터를 원하는 경우:
tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)" | grep "blocked\\|skip\\|unauthorized"
```

### Pairing Code Not Arriving

`dmPolicy`가 `pairing`인 경우 알 수 없는 발신자는 코드를 받아야 하며 승인될 때까지 메시지가 무시됩니다.

**확인 1:** 대기 중인 요청이 이미 있나요?

```bash
openclaw pairing list <channel>
```

대기 중인 DM 페어링 요청은 기본적으로 **채널당 3개**로 제한됩니다. 목록이 가득 차면 하나가 승인되거나 만료될 때까지 새 요청이 코드를 생성하지 않습니다.

**확인 2:** 요청이 생성되었지만 응답이 전송되지 않았나요?

```bash
openclaw logs --follow | grep "pairing request"
```

**확인 3:** 해당 채널에 대해 `dmPolicy`가 `open`/`allowlist`가 아닌지 확인합니다.

### Image + Mention Not Working

알려진 문제: 멘션만 있는 (다른 텍스트 없는) 이미지를 보내면 WhatsApp이 때때로 멘션 메타데이터를 포함하지 않습니다.

**해결책:** 멘션과 함께 일부 텍스트를 추가합니다:

- ❌ `@openclaw` + 이미지
- ✅ `@openclaw check this` + 이미지

### Session Not Resuming

**확인 1:** 세션 파일이 있나요?

```bash
ls -la ~/.openclaw/agents/<agentId>/sessions/
```

**확인 2:** 재설정 창이 너무 짧나요?

```json
{
  "session": {
    "reset": {
      "mode": "daily",
      "atHour": 4,
      "idleMinutes": 10080 // 7일
    }
  }
}
```

**확인 3:** 누군가 `/new`, `/reset` 또는 재설정 트리거를 보냈나요?

### Agent Timing Out

기본 타임아웃은 30분입니다. 긴 작업의 경우:

```json
{
  "reply": {
    "timeoutSeconds": 3600 // 1시간
  }
}
```

또는 `process` 도구를 사용하여 긴 명령을 백그라운드로 실행합니다.

### WhatsApp Disconnected

```bash
# 로컬 상태 확인 (자격 증명, 세션, 대기 중인 이벤트)
openclaw status
# 실행 중인 게이트웨이 + 채널 프로브 (WA 연결 + Telegram + Discord API)
openclaw status --deep

# 최근 연결 이벤트 보기
openclaw logs --limit 200 | grep "connection\\|disconnect\\|logout"
```

**수정:** 일반적으로 게이트웨이가 실행 중이면 자동으로 다시 연결됩니다. 막힌 경우 게이트웨이 프로세스를 재시작합니다 (슈퍼바이즈하는 방법에 따라), 또는 상세 출력으로 수동으로 실행합니다:

```bash
openclaw gateway --verbose
```

로그아웃 / 연결 해제된 경우:

```bash
openclaw channels logout
trash "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/credentials" # 로그아웃이 모든 것을 깨끗하게 제거할 수 없는 경우
openclaw channels login --verbose       # QR 다시 스캔
```

### Media Send Failing

**확인 1:** 파일 경로가 유효한가요?

```bash
ls -la /path/to/your/image.jpg
```

**확인 2:** 너무 크지 않나요?

- 이미지: 최대 6MB
- 오디오/비디오: 최대 16MB
- 문서: 최대 100MB

**확인 3:** 미디어 로그 확인

```bash
grep "media\\|fetch\\|download" "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)" | tail -20
```

### High Memory Usage

OpenClaw는 대화 기록을 메모리에 유지합니다.

**수정:** 주기적으로 재시작하거나 세션 제한을 설정합니다:

```json
{
  "session": {
    "historyLimit": 100 // 유지할 최대 메시지 수
  }
}
```

## 일반적인 문제 해결

### "Gateway won't start — configuration invalid"

OpenClaw는 이제 설정에 알 수 없는 키, 잘못된 형식의 값 또는 잘못된 타입이 포함된 경우 시작을 거부합니다.
이는 안전을 위해 의도적입니다.

Doctor로 수정:

```bash
openclaw doctor
openclaw doctor --fix
```

참고:

- `openclaw doctor`는 모든 유효하지 않은 항목을 보고합니다.
- `openclaw doctor --fix`는 마이그레이션/수리를 적용하고 설정을 다시 작성합니다.
- `openclaw logs`, `openclaw health`, `openclaw status`, `openclaw gateway status`, `openclaw gateway probe`와 같은 진단 명령은 설정이 유효하지 않아도 여전히 실행됩니다.

### "All models failed" — what should I check first?

- 시도 중인 프로바이더에 대한 **자격 증명** 존재 (인증 프로필 + 환경 변수).
- **모델 라우팅**: `agents.defaults.model.primary` 및 폴백이 액세스할 수 있는 모델인지 확인합니다.
- **게이트웨이 로그** (`/tmp/openclaw/…`)에서 정확한 프로바이더 오류 확인.
- **모델 상태**: `/model status` (채팅) 또는 `openclaw models status` (CLI) 사용.

### I'm running on my personal WhatsApp number — why is self-chat weird?

셀프 채팅 모드를 활성화하고 자신의 번호를 허용 목록에 추가합니다:

```json5
{
  channels: {
    whatsapp: {
      selfChatMode: true,
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123"],
    },
  },
}
```

[WhatsApp 설정](/channels/whatsapp)을 참조하세요.

### WhatsApp logged me out. How do I re‑auth?

로그인 명령을 다시 실행하고 QR 코드를 스캔합니다:

```bash
openclaw channels login
```

### Build errors on `main` — what's the standard fix path?

1. `git pull origin main && pnpm install`
2. `openclaw doctor`
3. GitHub 이슈 또는 Discord 확인
4. 임시 해결책: 이전 커밋을 체크아웃

### npm install fails (allow-build-scripts / missing tar or yargs). What now?

소스에서 실행 중인 경우 저장소의 패키지 관리자를 사용합니다: **pnpm** (권장).
저장소는 `packageManager: "pnpm@…"`을 선언합니다.

일반적인 복구:

```bash
git status   # 저장소 루트에 있는지 확인
pnpm install
pnpm build
openclaw doctor
openclaw gateway restart
```

이유: pnpm은 이 저장소에 대해 설정된 패키지 관리자입니다.

### How do I switch between git installs and npm installs?

**웹사이트 설치 프로그램**을 사용하고 플래그로 설치 방법을 선택합니다.
제자리에서 업그레이드하고 게이트웨이 서비스를 새 설치를 가리키도록 다시 작성합니다.

**git 설치**로 전환:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --no-onboard
```

**npm 전역**으로 전환:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

참고:

- git 흐름은 저장소가 깨끗한 경우에만 리베이스합니다. 먼저 변경 사항을 커밋하거나 스태시합니다.
- 전환 후 다음을 실행합니다:
  ```bash
  openclaw doctor
  openclaw gateway restart
  ```

### Telegram block streaming isn't splitting text between tool calls. Why?

블록 스트리밍은 **완료된 텍스트 블록**만 보냅니다. 단일 메시지가 표시되는 일반적인 이유:

- `agents.defaults.blockStreamingDefault`가 여전히 `"off"`입니다.
- `channels.telegram.blockStreaming`이 `false`로 설정되어 있습니다.
- `channels.telegram.streamMode`가 `partial` 또는 `block`이고 **초안 스트리밍이 활성화됨**
  (비공개 채팅 + 주제). 초안 스트리밍은 해당 경우 블록 스트리밍을 비활성화합니다.
- `minChars` / 병합 설정이 너무 높아서 청크가 병합됩니다.
- 모델이 하나의 큰 텍스트 블록을 내보냅니다 (중간 응답 플러시 포인트 없음).

수정 체크리스트:

1. 블록 스트리밍 설정을 루트가 아닌 `agents.defaults` 아래에 배치합니다.
2. 실제 다중 메시지 블록 응답을 원하는 경우 `channels.telegram.streamMode: "off"`를 설정합니다.
3. 디버깅하는 동안 더 작은 청크/병합 임계값을 사용합니다.

[스트리밍](/concepts/streaming)을 참조하세요.

### Discord doesn't reply in my server even with `requireMention: false`. Why?

`requireMention`은 채널이 허용 목록을 통과한 **후** 멘션 게이팅만 제어합니다.
기본적으로 `channels.discord.groupPolicy`는 **allowlist**이므로 길드를 명시적으로 활성화해야 합니다.
`channels.discord.guilds.<guildId>.channels`를 설정하면 나열된 채널만 허용됩니다; 길드의 모든 채널을 허용하려면 생략합니다.

수정 체크리스트:

1. `channels.discord.groupPolicy: "open"`을 설정하거나 길드 허용 목록 항목을 추가합니다 (및 선택적으로 채널 허용 목록).
2. `channels.discord.guilds.<guildId>.channels`에서 **숫자 채널 ID**를 사용합니다.
3. `requireMention: false`를 `channels.discord.guilds` **아래**에 배치합니다 (전역 또는 채널별).
   최상위 `channels.discord.requireMention`은 지원되는 키가 아닙니다.
4. 봇에 **Message Content Intent** 및 채널 권한이 있는지 확인합니다.
5. 감사 힌트는 `openclaw channels status --probe`를 실행합니다.

문서: [Discord](/channels/discord), [채널 문제 해결](/channels/troubleshooting).

### Cloud Code Assist API error: invalid tool schema (400). What now?

이는 거의 항상 **도구 스키마 호환성** 문제입니다. Cloud Code Assist
엔드포인트는 JSON 스키마의 엄격한 하위 집합을 허용합니다. OpenClaw는 현재 `main`에서 도구
스키마를 정리/정규화하지만 수정은 아직 마지막 릴리스에 없습니다 (2026년 1월 13일 기준).

수정 체크리스트:

1. **OpenClaw 업데이트**:
   - 소스에서 실행할 수 있는 경우 `main`을 pull하고 게이트웨이를 재시작합니다.
   - 그렇지 않으면 스키마 스크러버를 포함하는 다음 릴리스를 기다립니다.
2. `anyOf/oneOf/allOf`, `patternProperties`,
   `additionalProperties`, `minLength`, `maxLength`, `format` 등과 같은 지원되지 않는 키워드를 피합니다.
3. 사용자 정의 도구를 정의하는 경우 최상위 스키마를 `type: "object"`로 유지하고
   `properties`와 간단한 열거형을 사용합니다.

[도구](/tools) 및 [TypeBox 스키마](/concepts/typebox)를 참조하세요.

## macOS 특정 문제

### App Crashes when Granting Permissions (Speech/Mic)

개인 정보 프롬프트에서 "허용"을 클릭할 때 앱이 사라지거나 "Abort trap 6"이 표시되는 경우:

**수정 1: TCC 캐시 재설정**

```bash
tccutil reset All bot.molt.mac.debug
```

**수정 2: 새 번들 ID 강제**
재설정이 작동하지 않으면 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)에서 `BUNDLE_ID`를 변경하고 (예: `.test` 접미사 추가) 다시 빌드합니다. 이렇게 하면 macOS가 새 앱으로 취급합니다.

### Gateway stuck on "Starting..."

앱이 포트 `18789`의 로컬 게이트웨이에 연결합니다. 계속 막혀있는 경우:

**수정 1: 슈퍼바이저 중지 (권장)**
게이트웨이가 launchd에 의해 슈퍼바이즈되는 경우 PID를 종료하면 다시 생성됩니다. 먼저 슈퍼바이저를 중지합니다:

```bash
openclaw gateway status
openclaw gateway stop
# 또는: launchctl bootout gui/$UID/bot.molt.gateway (bot.molt.<profile>로 교체; 레거시 com.openclaw.*도 여전히 작동)
```

**수정 2: 포트가 사용 중 (리스너 찾기)**

```bash
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

슈퍼바이즈되지 않은 프로세스인 경우 먼저 우아한 중지를 시도한 다음 에스컬레이션합니다:

```bash
kill -TERM <PID>
sleep 1
kill -9 <PID> # 최후의 수단
```

**수정 3: CLI 설치 확인**
전역 `openclaw` CLI가 설치되어 있고 앱 버전과 일치하는지 확인합니다:

```bash
openclaw --version
npm install -g openclaw@<version>
```

## Debug Mode

상세 로깅 얻기:

```bash
# 설정에서 추적 로깅 켜기:
#   ${OPENCLAW_CONFIG_PATH:-$HOME/.openclaw/openclaw.json} -> { logging: { level: "trace" } }
#
# 그런 다음 상세 명령을 실행하여 디버그 출력을 로그 파일에서 stdout으로 미러링:
openclaw gateway --verbose
openclaw channels login --verbose
```

## Log Locations

| 로그                                | 위치                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 게이트웨이 파일 로그 (구조화)       | `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (또는 `logging.file`)                                                                                                                                                                                                                                                               |
| 게이트웨이 서비스 로그 (슈퍼바이저) | macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` + `gateway.err.log` (기본값: `~/.openclaw/logs/...`; 프로필은 `~/.openclaw-<profile>/logs/...` 사용)<br />Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`<br />Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST` |
| 세션 파일                           | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                                                                                                                                                                                                                                                                            |
| 미디어 캐시                         | `$OPENCLAW_STATE_DIR/media/`                                                                                                                                                                                                                                                                                                |
| 자격 증명                           | `$OPENCLAW_STATE_DIR/credentials/`                                                                                                                                                                                                                                                                                          |

## Health Check

```bash
# 슈퍼바이저 + 프로브 타겟 + 설정 경로
openclaw gateway status
# 시스템 수준 스캔 포함 (레거시/추가 서비스, 포트 리스너)
openclaw gateway status --deep

# 게이트웨이에 도달 가능한가요?
openclaw health --json
# 실패하면 연결 세부 정보와 함께 다시 실행:
openclaw health --verbose

# 기본 포트에서 무언가 수신 중인가요?
lsof -nP -iTCP:18789 -sTCP:LISTEN

# 최근 활동 (RPC 로그 tail)
openclaw logs --follow
# RPC가 다운된 경우 대체
tail -20 /tmp/openclaw/openclaw-*.log
```

## Reset Everything

핵 옵션:

```bash
openclaw gateway stop
# 서비스를 설치했고 깨끗한 설치를 원하는 경우:
# openclaw gateway uninstall

trash "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
openclaw channels login         # WhatsApp 다시 페어링
openclaw gateway restart           # 또는: openclaw gateway
```

⚠️ 이렇게 하면 모든 세션이 손실되고 WhatsApp을 다시 페어링해야 합니다.

## Getting Help

1. 먼저 로그 확인: `/tmp/openclaw/` (기본값: `openclaw-YYYY-MM-DD.log`, 또는 설정된 `logging.file`)
2. GitHub에서 기존 이슈 검색
3. 다음과 함께 새 이슈 열기:
   - OpenClaw 버전
   - 관련 로그 스니펫
   - 재현 단계
   - 설정 (비밀 삭제!)

---

_"껐다가 다시 켜봤나요?"_ — 모든 IT 담당자

🦞🔧

### Browser Not Starting (Linux)

`"Failed to start Chrome CDP on port 18800"`이 표시되는 경우:

**가장 가능성 높은 원인:** Ubuntu의 Snap 패키지 Chromium.

**빠른 수정:** 대신 Google Chrome을 설치합니다:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

그런 다음 설정에서 설정합니다:

```json
{
  "browser": {
    "executablePath": "/usr/bin/google-chrome-stable"
  }
}
```

**전체 가이드:** [browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)을 참조하세요

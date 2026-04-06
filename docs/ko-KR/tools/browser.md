---
summary: "통합 브라우저 제어 서비스 + 작업 명령"
read_when:
  - 에이전트 제어 브라우저 자동화 추가 시
  - openclaw가 사용자의 Chrome과 충돌하는 이유 디버깅 시
  - macOS 앱에서 브라우저 설정 + 수명 주기 구현 시
title: "브라우저 (OpenClaw 관리)"
---

# 브라우저 (openclaw 관리)

OpenClaw는 에이전트가 제어하는 **전용 Chrome/Brave/Edge/Chromium 프로필**을 실행할 수 있습니다.
개인 브라우저와 분리되어 있으며 게이트웨이 내부의 작은 로컬
제어 서비스를 통해 관리됩니다 (루프백 전용).

초보자 관점:

- **별도의 에이전트 전용 브라우저**로 생각하세요.
- `openclaw` 프로필은 개인 브라우저 프로필을 **건드리지 않습니다**.
- 에이전트는 안전한 레인에서 **탭 열기, 페이지 읽기, 클릭, 타이핑**을 할 수 있습니다.
- 기본 `chrome` 프로필은 확장 프로그램 릴레이를 통해 **시스템 기본 Chromium 브라우저**를 사용합니다; 격리된 관리형 브라우저를 위해 `openclaw`로 전환하세요.

## 얻을 수 있는 것

- **openclaw**라는 이름의 별도 브라우저 프로필 (기본적으로 주황색 강조).
- 결정적 탭 제어 (목록/열기/포커스/닫기).
- 에이전트 작업 (클릭/타이핑/드래그/선택), 스냅샷, 스크린샷, PDF.
- 선택적 다중 프로필 지원 (`openclaw`, `work`, `remote`, ...).

이 브라우저는 일상적으로 사용하는 브라우저가 **아닙니다**. 에이전트 자동화 및 검증을 위한 안전하고 격리된 표면입니다.

## 빠른 시작

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

"브라우저 비활성화" 오류가 발생하면, 설정에서 활성화하고 (아래 참조) 게이트웨이를 재시작하세요.

## 프로필: `openclaw` vs `chrome`

- `openclaw`: 관리형, 격리된 브라우저 (확장 프로그램 불필요).
- `chrome`: **시스템 브라우저**로의 확장 프로그램 릴레이 (OpenClaw
  확장 프로그램이 탭에 연결되어 있어야 함).

기본적으로 관리 모드를 원하면 `browser.defaultProfile: "openclaw"`를 설정하세요.

## 설정

브라우저 설정은 `~/.openclaw/openclaw.json`에 위치합니다.

```json5
{
  browser: {
    enabled: true, // 기본값: true
    // cdpUrl: "http://127.0.0.1:18792", // 레거시 단일 프로필 재정의
    remoteCdpTimeoutMs: 1500, // 원격 CDP HTTP 타임아웃 (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // 원격 CDP WebSocket 핸드셰이크 타임아웃 (ms)
    defaultProfile: "chrome",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

참고사항:

- 브라우저 제어 서비스는 `gateway.port`에서 파생된 포트에서 루프백에 바인딩됩니다
  (기본값: `18791`, 게이트웨이 + 2). 릴레이는 다음 포트 (`18792`)를 사용합니다.
- 게이트웨이 포트 (`gateway.port` 또는 `OPENCLAW_GATEWAY_PORT`)를 재정의하면,
  파생된 브라우저 포트가 동일한 "패밀리"에 유지되도록 이동합니다.
- `cdpUrl`은 설정되지 않은 경우 릴레이 포트로 기본 설정됩니다.
- `remoteCdpTimeoutMs`는 원격 (루프백이 아닌) CDP 도달 가능성 확인에 적용됩니다.
- `remoteCdpHandshakeTimeoutMs`는 원격 CDP WebSocket 도달 가능성 확인에 적용됩니다.
- `attachOnly: true`는 "로컬 브라우저를 시작하지 않음; 이미 실행 중인 경우에만 연결"을 의미합니다.
- `color` + 프로필별 `color`는 브라우저 UI에 색조를 입혀 어떤 프로필이 활성화되어 있는지 볼 수 있도록 합니다.
- 기본 프로필은 `chrome` (확장 프로그램 릴레이)입니다. 관리형 브라우저를 위해 `defaultProfile: "openclaw"`를 사용하세요.
- 자동 감지 순서: Chromium 기반 시스템 기본 브라우저; 그렇지 않으면 Chrome → Brave → Edge → Chromium → Chrome Canary.
- 로컬 `openclaw` 프로필은 `cdpPort`/`cdpUrl`을 자동 할당합니다 — 원격 CDP에만 설정하세요.

## Brave (또는 다른 Chromium 기반 브라우저) 사용

**시스템 기본** 브라우저가 Chromium 기반 (Chrome/Brave/Edge 등)인 경우,
OpenClaw가 자동으로 사용합니다. 자동 감지를 재정의하려면 `browser.executablePath`를 설정하세요:

CLI 예시:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## 로컬 vs 원격 제어

- **로컬 제어 (기본값):** 게이트웨이가 루프백 제어 서비스를 시작하고 로컬 브라우저를 시작할 수 있습니다.
- **원격 제어 (노드 호스트):** 브라우저가 있는 머신에서 노드 호스트를 실행합니다; 게이트웨이가 브라우저 작업을 프록시합니다.
- **원격 CDP:** `browser.profiles.<name>.cdpUrl` (또는 `browser.cdpUrl`)을 설정하여
  원격 Chromium 기반 브라우저에 연결합니다. 이 경우, OpenClaw는 로컬 브라우저를 시작하지 않습니다.

원격 CDP URL은 인증을 포함할 수 있습니다:

- 쿼리 토큰 (예: `https://provider.example?token=<token>`)
- HTTP 기본 인증 (예: `https://user:pass@provider.example`)

OpenClaw는 `/json/*` 엔드포인트를 호출할 때와 CDP WebSocket에 연결할 때 인증을 유지합니다. 설정 파일에 커밋하는 대신 토큰에 대해 환경 변수 또는 시크릿 관리자를 선호하세요.

## 노드 브라우저 프록시 (제로 설정 기본값)

브라우저가 있는 머신에서 **노드 호스트**를 실행하는 경우, OpenClaw는
추가 브라우저 설정 없이 브라우저 도구 호출을 해당 노드로 자동 라우팅할 수 있습니다.
이는 원격 게이트웨이의 기본 경로입니다.

참고사항:

- 노드 호스트는 **프록시 명령**을 통해 로컬 브라우저 제어 서버를 노출합니다.
- 프로필은 노드 자체 `browser.profiles` 설정에서 가져옵니다 (로컬과 동일).
- 원하지 않으면 비활성화하세요:
  - 노드에서: `nodeHost.browserProxy.enabled=false`
  - 게이트웨이에서: `gateway.nodes.browser.mode="off"`

## Browserless (호스팅 원격 CDP)

[Browserless](https://browserless.io)는 HTTPS를 통해 CDP 엔드포인트를 노출하는 호스팅 Chromium 서비스입니다. OpenClaw 브라우저 프로필을
Browserless 리전 엔드포인트로 지정하고 API 키로 인증할 수 있습니다.

예시:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "https://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

참고사항:

- `<BROWSERLESS_API_KEY>`를 실제 Browserless 토큰으로 교체하세요.
- Browserless 계정과 일치하는 리전 엔드포인트를 선택하세요 (문서 참조).

## 보안

핵심 아이디어:

- 브라우저 제어는 루프백 전용입니다; 액세스는 게이트웨이의 인증 또는 노드 페어링을 통해 흐릅니다.
- 게이트웨이 및 모든 노드 호스트를 프라이빗 네트워크 (Tailscale)에 유지하세요; 공개 노출을 피하세요.
- 원격 CDP URL/토큰을 시크릿으로 취급하세요; 환경 변수 또는 시크릿 관리자를 선호하세요.

원격 CDP 팁:

- 가능한 경우 HTTPS 엔드포인트와 단기 토큰을 선호하세요.
- 설정 파일에 직접 장기 토큰을 포함하지 마세요.

## 프로필 (다중 브라우저)

OpenClaw는 여러 명명된 프로필 (라우팅 설정)을 지원합니다. 프로필은 다음과 같을 수 있습니다:

- **openclaw 관리형**: 자체 사용자 데이터 디렉토리 + CDP 포트를 가진 전용 Chromium 기반 브라우저 인스턴스
- **원격**: 명시적 CDP URL (다른 곳에서 실행 중인 Chromium 기반 브라우저)
- **확장 프로그램 릴레이**: 로컬 릴레이 + Chrome 확장 프로그램을 통한 기존 Chrome 탭

기본값:

- `openclaw` 프로필이 누락된 경우 자동 생성됩니다.
- `chrome` 프로필은 Chrome 확장 프로그램 릴레이를 위해 내장되어 있습니다 (기본적으로 `http://127.0.0.1:18792`를 가리킴).
- 로컬 CDP 포트는 기본적으로 **18800–18899**에서 할당됩니다.
- 프로필을 삭제하면 로컬 데이터 디렉토리가 휴지통으로 이동됩니다.

모든 제어 엔드포인트는 `?profile=<name>`을 허용합니다; CLI는 `--browser-profile`을 사용합니다.

## Chrome 확장 프로그램 릴레이 (기존 Chrome 사용)

OpenClaw는 로컬 CDP 릴레이 + Chrome 확장 프로그램을 통해 **기존 Chrome 탭** (별도의 "openclaw" Chrome 인스턴스 없음)을 구동할 수도 있습니다.

전체 가이드: [Chrome 확장 프로그램](/tools/chrome-extension)

흐름:

- 게이트웨이가 로컬로 실행되거나 (동일한 머신) 노드 호스트가 브라우저 머신에서 실행됩니다.
- 로컬 **릴레이 서버**가 루프백 `cdpUrl` (기본값: `http://127.0.0.1:18792`)에서 수신 대기합니다.
- 탭에서 **OpenClaw 브라우저 릴레이** 확장 프로그램 아이콘을 클릭하여 연결합니다 (자동 연결하지 않음).
- 에이전트는 올바른 프로필을 선택하여 일반 `browser` 도구를 통해 해당 탭을 제어합니다.

게이트웨이가 다른 곳에서 실행되는 경우, 게이트웨이가 브라우저 작업을 프록시할 수 있도록 브라우저 머신에서 노드 호스트를 실행하세요.

### 샌드박스 격리 세션

에이전트 세션이 샌드박스 격리된 경우, `browser` 도구가 기본값으로 `target="sandbox"` (샌드박스 브라우저)를 사용할 수 있습니다.
Chrome 확장 프로그램 릴레이 인수는 호스트 브라우저 제어가 필요하므로 다음 중 하나를 수행하세요:

- 샌드박스 격리 없이 세션을 실행하거나,
- `agents.defaults.sandbox.browser.allowHostControl: true`를 설정하고 도구를 호출할 때 `target="host"`를 사용하세요.

### 설정

1. 확장 프로그램 로드 (개발/언팩):

```bash
openclaw browser extension install
```

- Chrome → `chrome://extensions` → "개발자 모드" 활성화
- "압축 해제된 확장 프로그램 로드" → `openclaw browser extension path`가 출력한 디렉토리 선택
- 확장 프로그램을 고정한 다음 제어하려는 탭에서 클릭합니다 (배지에 `ON` 표시).

2. 사용:

- CLI: `openclaw browser --browser-profile chrome tabs`
- 에이전트 도구: `profile="chrome"`을 사용하는 `browser`

선택사항: 다른 이름 또는 릴레이 포트를 원하면, 자체 프로필을 만드세요:

```bash
openclaw browser create-profile \
  --name my-chrome \
  --driver extension \
  --cdp-url http://127.0.0.1:18792 \
  --color "#00AA00"
```

참고사항:

- 이 모드는 대부분의 작업 (스크린샷/스냅샷/작업)에 Playwright-on-CDP를 사용합니다.
- 확장 프로그램 아이콘을 다시 클릭하여 연결을 해제하세요.

## 격리 보장

- **전용 사용자 데이터 디렉토리**: 개인 브라우저 프로필을 절대 건드리지 않습니다.
- **전용 포트**: 개발 워크플로와의 충돌을 방지하기 위해 `9222`를 피합니다.
- **결정적 탭 제어**: "마지막 탭"이 아니라 `targetId`로 탭을 대상으로 지정합니다.

## 브라우저 선택

로컬에서 시작할 때, OpenClaw는 사용 가능한 첫 번째를 선택합니다:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath`로 재정의할 수 있습니다.

플랫폼:

- macOS: `/Applications` 및 `~/Applications`를 확인합니다.
- Linux: `google-chrome`, `brave`, `microsoft-edge`, `chromium` 등을 찾습니다.
- Windows: 일반적인 설치 위치를 확인합니다.

## 제어 API (선택사항)

로컬 통합 전용으로, 게이트웨이는 작은 루프백 HTTP API를 노출합니다:

- 상태/시작/중지: `GET /`, `POST /start`, `POST /stop`
- 탭: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- 스냅샷/스크린샷: `GET /snapshot`, `POST /screenshot`
- 작업: `POST /navigate`, `POST /act`
- 훅: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- 다운로드: `POST /download`, `POST /wait/download`
- 디버깅: `GET /console`, `POST /pdf`
- 디버깅: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- 네트워크: `POST /response/body`
- 상태: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- 상태: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- 설정: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

모든 엔드포인트는 `?profile=<name>`을 허용합니다.

### Playwright 요구 사항

일부 기능 (navigate/act/AI 스냅샷/역할 스냅샷, 요소 스크린샷, PDF)은
Playwright가 필요합니다. Playwright가 설치되지 않은 경우, 해당 엔드포인트는 명확한 501
오류를 반환합니다. ARIA 스냅샷 및 기본 스크린샷은 openclaw 관리 Chrome에서 여전히 작동합니다.
Chrome 확장 프로그램 릴레이 드라이버의 경우, ARIA 스냅샷 및 스크린샷에 Playwright가 필요합니다.

`Playwright is not available in this gateway build` 오류가 표시되면, 전체
Playwright 패키지 (`playwright-core`가 아님)를 설치하고 게이트웨이를 재시작하거나, 브라우저 지원과 함께
OpenClaw를 재설치하세요.

#### Docker Playwright 설치

게이트웨이가 Docker에서 실행되는 경우, `npx playwright`를 피하세요 (npm 재정의 충돌).
대신 번들 CLI를 사용하세요:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

브라우저 다운로드를 유지하려면, `PLAYWRIGHT_BROWSERS_PATH` (예:
`/home/node/.cache/ms-playwright`)를 설정하고 `/home/node`가
`OPENCLAW_HOME_VOLUME` 또는 바인드 마운트를 통해 유지되는지 확인하세요. [Docker](/install/docker)를 참조하세요.

## 작동 방식 (내부)

고급 흐름:

- 작은 **제어 서버**가 HTTP 요청을 수락합니다.
- **CDP**를 통해 Chromium 기반 브라우저 (Chrome/Brave/Edge/Chromium)에 연결합니다.
- 고급 작업 (클릭/타이핑/스냅샷/PDF)의 경우, CDP 위에 **Playwright**를 사용합니다.
- Playwright가 누락된 경우, Playwright가 아닌 작업만 사용할 수 있습니다.

이 설계는 에이전트를 안정적이고 결정적인 인터페이스에 유지하면서
로컬/원격 브라우저 및 프로필을 교체할 수 있도록 합니다.

## CLI 빠른 참조

모든 명령은 `--browser-profile <name>`을 허용하여 특정 프로필을 대상으로 지정합니다.
모든 명령은 머신 판독 가능한 출력을 위한 `--json`도 허용합니다 (안정적인 페이로드).

기본:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

검사:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

작업:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 /tmp/report.pdf`
- `openclaw browser waitfordownload /tmp/report.pdf`
- `openclaw browser upload /tmp/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

상태:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

참고사항:

- `upload` 및 `dialog`는 **준비** 호출입니다; 선택기/대화 상자를 트리거하는 클릭/누르기 전에 실행하세요.
- `upload`는 `--input-ref` 또는 `--element`를 통해 파일 입력을 직접 설정할 수도 있습니다.
- `snapshot`:
  - `--format ai` (Playwright가 설치된 경우 기본값): 숫자 참조 (`aria-ref="<n>"`)를 가진 AI 스냅샷을 반환합니다.
  - `--format aria`: 접근성 트리를 반환합니다 (참조 없음; 검사 전용).
  - `--efficient` (또는 `--mode efficient`): 간결한 역할 스냅샷 프리셋 (interactive + compact + depth + 더 낮은 maxChars).
  - 설정 기본값 (도구/CLI만): 호출자가 모드를 전달하지 않을 때 효율적인 스냅샷을 사용하려면 `browser.snapshotDefaults.mode: "efficient"`를 설정하세요 ([게이트웨이 설정](/gateway/configuration#browser-openclaw-managed-browser) 참조).
  - 역할 스냅샷 옵션 (`--interactive`, `--compact`, `--depth`, `--selector`)은 `e12`와 같은 참조를 가진 역할 기반 스냅샷을 강제합니다.
  - `--frame "<iframe selector>"`는 역할 스냅샷을 iframe으로 범위 지정합니다 (`e12`와 같은 역할 참조와 쌍을 이룸).
  - `--interactive`는 대화형 요소의 평면적이고 쉽게 선택할 수 있는 목록을 출력합니다 (작업 구동에 가장 적합).
  - `--labels`는 겹쳐진 참조 레이블이 있는 뷰포트 전용 스크린샷을 추가합니다 (`MEDIA:<path>` 출력).
- `click`/`type` 등은 `snapshot`의 `ref`가 필요합니다 (숫자 `12` 또는 역할 참조 `e12`).
  CSS 선택자는 작업에 의도적으로 지원되지 않습니다.

## 스냅샷 및 참조

OpenClaw는 두 가지 "스냅샷" 스타일을 지원합니다:

- **AI 스냅샷 (숫자 참조)**: `openclaw browser snapshot` (기본값; `--format ai`)
  - 출력: 숫자 참조를 포함하는 텍스트 스냅샷.
  - 작업: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - 내부적으로, 참조는 Playwright의 `aria-ref`를 통해 해결됩니다.

- **역할 스냅샷 (역할 참조 `e12`와 같은)**: `openclaw browser snapshot --interactive` (또는 `--compact`, `--depth`, `--selector`, `--frame`)
  - 출력: `[ref=e12]` (및 선택적 `[nth=1]`)를 가진 역할 기반 목록/트리.
  - 작업: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - 내부적으로, 참조는 `getByRole(...)` (+ 중복에 대한 `nth()`)를 통해 해결됩니다.
  - 겹쳐진 `e12` 레이블이 있는 뷰포트 스크린샷을 포함하려면 `--labels`를 추가하세요.

참조 동작:

- 참조는 **탐색 간에 안정적이지 않습니다**; 무언가 실패하면, `snapshot`을 다시 실행하고 새로운 참조를 사용하세요.
- 역할 스냅샷이 `--frame`으로 촬영된 경우, 역할 참조는 다음 역할 스냅샷까지 해당 iframe으로 범위가 지정됩니다.

## Wait 강화

시간/텍스트 이상을 기다릴 수 있습니다:

- URL 대기 (Playwright에서 지원하는 글롭):
  - `openclaw browser wait --url "**/dash"`
- 로드 상태 대기:
  - `openclaw browser wait --load networkidle`
- JS 술어 대기:
  - `openclaw browser wait --fn "window.ready===true"`
- 선택자가 표시될 때까지 대기:
  - `openclaw browser wait "#main"`

이들은 결합할 수 있습니다:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## 디버그 워크플로

작업이 실패하는 경우 (예: "표시되지 않음", "엄격 모드 위반", "덮임"):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` 사용 (대화형 모드에서 역할 참조 선호)
3. 여전히 실패하는 경우: `openclaw browser highlight <ref>`로 Playwright가 대상으로 지정하는 것을 확인
4. 페이지가 이상하게 작동하는 경우:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 심층 디버깅의 경우: 추적 기록:
   - `openclaw browser trace start`
   - 문제 재현
   - `openclaw browser trace stop` (`TRACE:<path>` 출력)

## JSON 출력

`--json`은 스크립팅 및 구조화된 도구를 위한 것입니다.

예시:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON의 역할 스냅샷에는 `refs`와 작은 `stats` 블록 (lines/chars/refs/interactive)이 포함되어 있어 도구가 페이로드 크기 및 밀도에 대해 추론할 수 있습니다.

## 상태 및 환경 변수 노브

이들은 "사이트가 X처럼 작동하도록 만들기" 워크플로에 유용합니다:

- 쿠키: `cookies`, `cookies set`, `cookies clear`
- 스토리지: `storage local|session get|set|clear`
- 오프라인: `set offline on|off`
- 헤더: `set headers --json '{"X-Debug":"1"}'` (또는 `--clear`)
- HTTP 기본 인증: `set credentials user pass` (또는 `--clear`)
- 위치 정보: `set geo <lat> <lon> --origin "https://example.com"` (또는 `--clear`)
- 미디어: `set media dark|light|no-preference|none`
- 시간대 / 로케일: `set timezone ...`, `set locale ...`
- 장치 / 뷰포트:
  - `set device "iPhone 14"` (Playwright 장치 프리셋)
  - `set viewport 1280 720`

## 보안 및 개인정보

- openclaw 브라우저 프로필은 로그인된 세션을 포함할 수 있습니다; 민감한 것으로 취급하세요.
- `browser act kind=evaluate` / `openclaw browser evaluate` 및 `wait --fn`은
  페이지 컨텍스트에서 임의의 JavaScript를 실행합니다. 프롬프트 주입이 이를 조종할 수 있습니다.
  필요하지 않으면 `browser.evaluateEnabled=false`로 비활성화하세요.
- 로그인 및 봇 방지 참고사항 (X/Twitter 등)은 [브라우저 로그인 + X/Twitter 게시](/tools/browser-login)를 참조하세요.
- 게이트웨이/노드 호스트를 프라이빗으로 유지하세요 (루프백 또는 tailnet 전용).
- 원격 CDP 엔드포인트는 강력합니다; 터널링 및 보호하세요.

## 문제 해결

Linux 관련 문제 (특히 snap Chromium)는
[브라우저 문제 해결](/tools/browser-linux-troubleshooting)을 참조하세요.

## 에이전트 도구 + 제어 작동 방식

에이전트는 브라우저 자동화를 위한 **하나의 도구**를 얻습니다:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

매핑 방식:

- `browser snapshot`은 안정적인 UI 트리 (AI 또는 ARIA)를 반환합니다.
- `browser act`는 스냅샷 `ref` ID를 사용하여 click/type/drag/select합니다.
- `browser screenshot`은 픽셀을 캡처합니다 (전체 페이지 또는 요소).
- `browser`는 다음을 허용합니다:
  - 명명된 브라우저 프로필 (openclaw, chrome 또는 원격 CDP)을 선택하는 `profile`.
  - 브라우저가 위치하는 곳을 선택하는 `target` (`sandbox` | `host` | `node`).
  - 샌드박스 격리 세션에서, `target: "host"`는 `agents.defaults.sandbox.browser.allowHostControl=true`가 필요합니다.
  - `target`이 생략된 경우: 샌드박스 격리 세션은 기본값이 `sandbox`, 샌드박스 격리 아닌 세션은 기본값이 `host`입니다.
  - 브라우저 가능한 노드가 연결되어 있으면, `target="host"` 또는 `target="node"`를 고정하지 않는 한 도구가 자동으로 해당 노드로 라우팅할 수 있습니다.

이는 에이전트를 결정적으로 유지하고 취약한 선택자를 피합니다.

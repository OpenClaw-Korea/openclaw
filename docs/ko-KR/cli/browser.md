---
summary: "`openclaw browser` CLI 참조 (프로필, 탭, 액션, 확장 프로그램 릴레이)"
read_when:
  - `openclaw browser`를 사용하며 일반적인 작업의 예제를 원할 때
  - 노드 호스트를 통해 다른 머신에서 실행 중인 브라우저를 제어하고 싶을 때
  - Chrome 확장 프로그램 릴레이를 사용하고 싶을 때(툴바 버튼을 통한 연결/연결 해제)
title: "browser"
---

# `openclaw browser`

OpenClaw의 브라우저 제어 서버를 관리하고 브라우저 액션(탭, 스냅샷, 스크린샷, 탐색, 클릭, 타이핑)을 실행합니다.

관련 문서:

- 브라우저 도구 + API: [Browser tool](/tools/browser)
- Chrome 확장 프로그램 릴레이: [Chrome extension](/tools/chrome-extension)

## 공통 플래그

- `--url <gatewayWsUrl>`: 게이트웨이 WebSocket URL (기본값은 설정에서 가져옴).
- `--token <token>`: 게이트웨이 토큰 (필요한 경우).
- `--timeout <ms>`: 요청 타임아웃 (ms).
- `--browser-profile <name>`: 브라우저 프로필 선택 (기본값은 설정에서 가져옴).
- `--json`: 기계 판독 가능한 출력 (지원되는 경우).

## 빠른 시작 (로컬)

```bash
openclaw browser --browser-profile chrome tabs
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## 프로필

프로필은 명명된 브라우저 라우팅 설정입니다. 실제로는:

- `openclaw`: OpenClaw 관리 Chrome 인스턴스를 시작/연결합니다(격리된 사용자 데이터 디렉토리).
- `chrome`: Chrome 확장 프로그램 릴레이를 통해 기존 Chrome 탭을 제어합니다.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser delete-profile --name work
```

특정 프로필 사용:

```bash
openclaw browser --browser-profile work tabs
```

## 탭

```bash
openclaw browser tabs
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## 스냅샷 / 스크린샷 / 액션

스냅샷:

```bash
openclaw browser snapshot
```

스크린샷:

```bash
openclaw browser screenshot
```

탐색/클릭/타이핑 (참조 기반 UI 자동화):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
```

## Chrome 확장 프로그램 릴레이 (툴바 버튼을 통한 연결)

이 모드는 에이전트가 수동으로 연결한 기존 Chrome 탭을 제어할 수 있게 합니다(자동 연결하지 않음).

압축되지 않은 확장 프로그램을 안정적인 경로에 설치:

```bash
openclaw browser extension install
openclaw browser extension path
```

그런 다음 Chrome → `chrome://extensions` → "개발자 모드" 활성화 → "압축해제된 확장 프로그램을 로드합니다" → 출력된 폴더 선택.

전체 가이드: [Chrome extension](/tools/chrome-extension)

## 원격 브라우저 제어 (노드 호스트 프록시)

게이트웨이가 브라우저와 다른 머신에서 실행되는 경우, Chrome/Brave/Edge/Chromium이 있는 머신에서 **노드 호스트**를 실행하세요. 게이트웨이는 해당 노드로 브라우저 액션을 프록시합니다(별도의 브라우저 제어 서버 불필요).

`gateway.nodes.browser.mode`를 사용하여 자동 라우팅을 제어하고, `gateway.nodes.browser.node`를 사용하여 여러 노드가 연결된 경우 특정 노드를 고정합니다.

보안 + 원격 설정: [Browser tool](/tools/browser), [Remote access](/gateway/remote), [Tailscale](/gateway/tailscale), [Security](/gateway/security)

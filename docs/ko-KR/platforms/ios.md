---
summary: "iOS 노드 앱: 게이트웨이 연결, 페어링, Canvas, 문제 해결"
read_when:
  - iOS 노드 페어링 또는 재연결 시
  - 소스에서 iOS 앱 실행 시
  - 게이트웨이 디스커버리 또는 Canvas 명령 디버깅 시
title: "iOS 앱"
---

# iOS 앱 (노드)

가용성: 내부 프리뷰. iOS 앱은 아직 공개 배포되지 않았습니다.

## 주요 기능

- WebSocket을 통해 게이트웨이에 연결 (LAN 또는 tailnet).
- 노드 기능 노출: Canvas, 화면 스냅샷, 카메라 캡처, 위치, Talk 모드, Voice wake.
- `node.invoke` 명령을 수신하고 노드 상태 이벤트를 보고합니다.

## 요구 사항

- 다른 기기에서 실행 중인 게이트웨이 (macOS, Linux 또는 WSL2를 통한 Windows).
- 네트워크 경로:
  - Bonjour를 통한 동일 LAN, **또는**
  - 유니캐스트 DNS-SD를 통한 Tailnet (예제 도메인: `openclaw.internal.`), **또는**
  - 수동 호스트/포트 (대체 방법).

## 빠른 시작 (페어링 + 연결)

1. 게이트웨이 시작:

```bash
openclaw gateway --port 18789
```

2. iOS 앱에서 Settings를 열고 발견된 게이트웨이를 선택합니다 (또는 Manual Host를 활성화하고 호스트/포트를 입력합니다).

3. 게이트웨이 호스트에서 페어링 요청을 승인합니다:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

4. 연결 확인:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 디스커버리 경로

### Bonjour (LAN)

게이트웨이는 `local.`에서 `_openclaw-gw._tcp`를 광고합니다. iOS 앱은 이를 자동으로 나열합니다.

### Tailnet (네트워크 간)

mDNS가 차단된 경우, 유니캐스트 DNS-SD 영역(도메인 선택; 예: `openclaw.internal.`)과 Tailscale split DNS를 사용합니다.
CoreDNS 예제는 [Bonjour](/gateway/bonjour)를 참조하세요.

### 수동 호스트/포트

Settings에서 **Manual Host**를 활성화하고 게이트웨이 호스트 + 포트 (기본값 `18789`)를 입력합니다.

## Canvas + A2UI

iOS 노드는 WKWebView Canvas를 렌더링합니다. `node.invoke`를 사용하여 제어합니다:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18793/__openclaw__/canvas/"}'
```

참고:

- 게이트웨이 Canvas 호스트는 `/__openclaw__/canvas/`와 `/__openclaw__/a2ui/`를 제공합니다.
- iOS 노드는 Canvas 호스트 URL이 광고될 때 연결 시 A2UI로 자동 이동합니다.
- `canvas.navigate`와 `{"url":""}`를 사용하여 내장 scaffold로 돌아갑니다.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk 모드

- Voice wake와 talk 모드는 Settings에서 사용할 수 있습니다.
- iOS가 백그라운드 오디오를 일시 중지할 수 있으므로, 앱이 활성 상태가 아닐 때 음성 기능은 최선 노력으로 처리됩니다.

## 일반적인 오류

- `NODE_BACKGROUND_UNAVAILABLE`: iOS 앱을 포그라운드로 가져오세요 (Canvas/카메라/화면 명령이 필요합니다).
- `A2UI_HOST_NOT_CONFIGURED`: 게이트웨이가 Canvas 호스트 URL을 광고하지 않았습니다. [게이트웨이 설정](/gateway/configuration)에서 `canvasHost`를 확인하세요.
- 페어링 프롬프트가 나타나지 않음: `openclaw nodes pending`을 실행하고 수동으로 승인하세요.
- 재설치 후 재연결 실패: Keychain 페어링 토큰이 삭제되었습니다. 노드를 다시 페어링하세요.

## 관련 문서

- [페어링](/gateway/pairing)
- [디스커버리](/gateway/discovery)
- [Bonjour](/gateway/bonjour)

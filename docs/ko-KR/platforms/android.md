---
summary: "Android 앱 (노드): 연결 런북 + Canvas/Chat/Camera"
read_when:
  - Android 노드 페어링 또는 재연결 시
  - Android 게이트웨이 디스커버리 또는 인증 디버깅 시
  - 클라이언트 간 채팅 히스토리 동기화 확인 시
title: "Android 앱"
---

# Android 앱 (노드)

## 지원 현황

- 역할: 컴패니언 노드 앱 (Android는 게이트웨이를 호스팅하지 않습니다).
- 게이트웨이 필요: 예 (macOS, Linux 또는 WSL2를 통한 Windows에서 실행).
- 설치: [시작하기](/start/getting-started) + [페어링](/gateway/pairing).
- 게이트웨이: [런북](/gateway) + [설정](/gateway/configuration).
  - 프로토콜: [게이트웨이 프로토콜](/gateway/protocol) (노드 + 컨트롤 플레인).

## 시스템 제어

시스템 제어 (launchd/systemd)는 게이트웨이 호스트에 있습니다. [게이트웨이](/gateway)를 참조하세요.

## 연결 런북

Android 노드 앱 ⇄ (mDNS/NSD + WebSocket) ⇄ **게이트웨이**

Android는 게이트웨이 WebSocket (기본값 `ws://<host>:18789`)에 직접 연결하고 게이트웨이 소유 페어링을 사용합니다.

### 사전 요구사항

- "마스터" 머신에서 게이트웨이를 실행할 수 있어야 합니다.
- Android 기기/에뮬레이터가 게이트웨이 WebSocket에 접근할 수 있어야 합니다:
  - mDNS/NSD를 사용하는 동일한 LAN, **또는**
  - Wide-Area Bonjour / 유니캐스트 DNS-SD를 사용하는 동일한 Tailscale tailnet (아래 참조), **또는**
  - 수동 게이트웨이 호스트/포트 (대체 방법)
- 게이트웨이 머신에서 CLI (`openclaw`)를 실행할 수 있어야 합니다 (또는 SSH를 통해).

### 1) 게이트웨이 시작

```bash
openclaw gateway --port 18789 --verbose
```

로그에서 다음과 같은 내용을 확인합니다:

- `listening on ws://0.0.0.0:18789`

tailnet 전용 설정 (Vienna ⇄ London에 권장)의 경우, 게이트웨이를 tailnet IP에 바인딩합니다:

- 게이트웨이 호스트의 `~/.openclaw/openclaw.json`에서 `gateway.bind: "tailnet"`을 설정합니다.
- 게이트웨이 / macOS 메뉴 바 앱을 재시작합니다.

### 2) 디스커버리 확인 (선택사항)

게이트웨이 머신에서:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

더 많은 디버깅 정보: [Bonjour](/gateway/bonjour).

#### 유니캐스트 DNS-SD를 통한 Tailnet (Vienna ⇄ London) 디스커버리

Android NSD/mDNS 디스커버리는 네트워크를 넘어가지 않습니다. Android 노드와 게이트웨이가 서로 다른 네트워크에 있지만 Tailscale을 통해 연결된 경우, Wide-Area Bonjour / 유니캐스트 DNS-SD를 대신 사용합니다:

1. 게이트웨이 호스트에 DNS-SD 존 (예: `openclaw.internal.`)을 설정하고 `_openclaw-gw._tcp` 레코드를 게시합니다.
2. 선택한 도메인에 대한 Tailscale 분할 DNS를 해당 DNS 서버를 가리키도록 설정합니다.

자세한 내용 및 예제 CoreDNS 설정: [Bonjour](/gateway/bonjour).

### 3) Android에서 연결

Android 앱에서:

- 앱은 **포어그라운드 서비스** (영구 알림)를 통해 게이트웨이 연결을 유지합니다.
- **Settings**를 엽니다.
- **Discovered Gateways** 아래에서 게이트웨이를 선택하고 **Connect**를 누릅니다.
- mDNS가 차단된 경우, **Advanced → Manual Gateway** (호스트 + 포트)를 사용하고 **Connect (Manual)**를 누릅니다.

첫 번째 성공적인 페어링 후, Android는 실행 시 자동으로 재연결합니다:

- 수동 엔드포인트 (활성화된 경우), 그렇지 않으면
- 마지막으로 발견된 게이트웨이 (최선 노력).

### 4) 페어링 승인 (CLI)

게이트웨이 머신에서:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

페어링 세부 사항: [게이트웨이 페어링](/gateway/pairing).

### 5) 노드 연결 확인

- 노드 상태를 통해:
  ```bash
  openclaw nodes status
  ```
- 게이트웨이를 통해:
  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) 채팅 + 히스토리

Android 노드의 채팅 시트는 게이트웨이의 **기본 세션 키** (`main`)를 사용하므로, 히스토리와 응답이 WebChat 및 다른 클라이언트와 공유됩니다:

- 히스토리: `chat.history`
- 전송: `chat.send`
- 푸시 업데이트 (최선 노력): `chat.subscribe` → `event:"chat"`

### 7) Canvas + 카메라

#### 게이트웨이 Canvas 호스트 (웹 콘텐츠에 권장)

에이전트가 디스크에서 편집할 수 있는 실제 HTML/CSS/JS를 노드에 표시하려면, 노드를 게이트웨이 Canvas 호스트로 가리킵니다.

참고: 노드는 `canvasHost.port` (기본값 `18793`)의 독립형 Canvas 호스트를 사용합니다.

1. 게이트웨이 호스트에 `~/.openclaw/workspace/canvas/index.html`을 생성합니다.

2. 노드를 해당 위치로 이동합니다 (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18793/__openclaw__/canvas/"}'
```

Tailnet (선택사항): 두 기기가 모두 Tailscale에 있는 경우, `.local` 대신 MagicDNS 이름 또는 tailnet IP를 사용합니다. 예: `http://<gateway-magicdns>:18793/__openclaw__/canvas/`.

이 서버는 HTML에 라이브 리로드 클라이언트를 주입하고 파일 변경 시 리로드합니다.
A2UI 호스트는 `http://<gateway-host>:18793/__openclaw__/a2ui/`에 있습니다.

Canvas 명령 (포어그라운드만):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (`{"url":""}`또는 `{"url":"/"}`를 사용하여 기본 스캐폴드로 돌아가기). `canvas.snapshot`은 `{ format, base64 }`를 반환합니다 (기본값 `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` 레거시 별칭)

카메라 명령 (포어그라운드만; 권한 제어됨):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

파라미터 및 CLI 헬퍼는 [카메라 노드](/nodes/camera)를 참조하세요.

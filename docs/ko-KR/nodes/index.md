---
summary: "노드: 페어링, 기능, 권한, 캔버스/카메라/화면/시스템을 위한 CLI 헬퍼"
read_when:
  - iOS/Android 노드를 게이트웨이에 페어링
  - 에이전트 컨텍스트에 노드 캔버스/카메라 사용
  - 새로운 노드 명령어 또는 CLI 헬퍼 추가
title: "노드"
---

# 노드

**노드**는 게이트웨이 **WebSocket**(운영자와 동일한 포트)에 `role: "node"`로 연결하여 `node.invoke`를 통해 명령어 표면(예: `canvas.*`, `camera.*`, `system.*`)을 노출하는 컴패니언 디바이스(macOS/iOS/Android/헤드리스)입니다. 프로토콜 세부사항: [게이트웨이 프로토콜](/gateway/protocol).

레거시 전송: [브리지 프로토콜](/gateway/bridge-protocol) (TCP JSONL; 현재 노드에서는 사용 중단/제거).

macOS는 **노드 모드**로도 실행할 수 있습니다: 메뉴바 앱이 게이트웨이의 WS 서버에 연결하여 로컬 캔버스/카메라 명령어를 노드로 노출합니다(따라서 `openclaw nodes …`가 이 Mac에서 작동).

참고사항:

- 노드는 **주변기기**이며, 게이트웨이가 아닙니다. 게이트웨이 서비스를 실행하지 않습니다.
- Telegram/WhatsApp 등의 메시지는 노드가 아닌 **게이트웨이**에 도착합니다.

## 페어링 + 상태

**WS 노드는 디바이스 페어링을 사용합니다.** 노드는 `connect` 중에 디바이스 아이덴티티를 제시하며, 게이트웨이는 `role: node`에 대한 디바이스 페어링 요청을 생성합니다. 디바이스 CLI(또는 UI)를 통해 승인하세요.

빠른 CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

참고사항:

- `nodes status`는 디바이스 페어링 역할에 `node`가 포함될 때 노드를 **페어링됨**으로 표시합니다.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject`)는 별도의 게이트웨이 소유 노드 페어링 저장소입니다. WS `connect` 핸드셰이크를 제한하지 **않습니다**.

## 원격 노드 호스트 (system.run)

게이트웨이가 한 머신에서 실행되고 다른 머신에서 명령어를 실행하려는 경우 **노드 호스트**를 사용하세요. 모델은 여전히 **게이트웨이**와 통신하며, `host=node`가 선택되면 게이트웨이가 `exec` 호출을 **노드 호스트**로 전달합니다.

### 어디서 무엇이 실행되는지

- **게이트웨이 호스트**: 메시지를 수신하고, 모델을 실행하며, 도구 호출을 라우팅합니다.
- **노드 호스트**: 노드 머신에서 `system.run`/`system.which`를 실행합니다.
- **승인**: `~/.openclaw/exec-approvals.json`을 통해 노드 호스트에서 시행됩니다.

### 노드 호스트 시작 (포그라운드)

노드 머신에서:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH 터널을 통한 원격 게이트웨이 (루프백 바인드)

게이트웨이가 루프백에 바인드되는 경우(`gateway.bind=loopback`, 로컬 모드 기본값), 원격 노드 호스트는 직접 연결할 수 없습니다. SSH 터널을 생성하고 노드 호스트를 터널의 로컬 끝점으로 지정하세요.

예시 (노드 호스트 -> 게이트웨이 호스트):

```bash
# 터미널 A (계속 실행): 로컬 18790을 게이트웨이 127.0.0.1:18789로 포워딩
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# 터미널 B: 게이트웨이 토큰을 내보내고 터널을 통해 연결
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

참고사항:

- 토큰은 게이트웨이 설정의 `gateway.auth.token`입니다 (게이트웨이 호스트의 `~/.openclaw/openclaw.json`).
- `openclaw node run`은 인증을 위해 `OPENCLAW_GATEWAY_TOKEN`을 읽습니다.

### 노드 호스트 시작 (서비스)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### 페어링 + 이름 지정

게이트웨이 호스트에서:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes list
```

이름 지정 옵션:

- `openclaw node run` / `openclaw node install`의 `--display-name` (노드의 `~/.openclaw/node.json`에 유지됨).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (게이트웨이 재정의).

### 명령어 허용 목록 추가

Exec 승인은 **노드 호스트별**입니다. 게이트웨이에서 허용 목록 항목을 추가하세요:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

승인은 노드 호스트의 `~/.openclaw/exec-approvals.json`에 저장됩니다.

### exec를 노드로 지정

기본값 설정 (게이트웨이 설정):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

또는 세션별:

```
/exec host=node security=allowlist node=<id-or-name>
```

설정이 완료되면 `host=node`를 사용하는 모든 `exec` 호출이 노드 호스트에서 실행됩니다 (노드 허용 목록/승인에 따름).

관련:

- [노드 호스트 CLI](/cli/node)
- [Exec 도구](/tools/exec)
- [Exec 승인](/tools/exec-approvals)

## 명령어 호출

저수준 (원시 RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

일반적인 "에이전트에게 MEDIA 첨부 파일 제공" 워크플로를 위한 고수준 헬퍼가 존재합니다.

## 스크린샷 (캔버스 스냅샷)

노드가 캔버스(WebView)를 표시하는 경우, `canvas.snapshot`이 `{ format, base64 }`를 반환합니다.

CLI 헬퍼 (임시 파일에 쓰고 `MEDIA:<path>` 출력):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### 캔버스 제어

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

참고사항:

- `canvas present`는 URL 또는 로컬 파일 경로(`--target`)와 위치 지정을 위한 선택적 `--x/--y/--width/--height`를 허용합니다.
- `canvas eval`은 인라인 JS(`--js`) 또는 위치 인수를 허용합니다.

### A2UI (캔버스)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

참고사항:

- A2UI v0.8 JSONL만 지원됩니다 (v0.9/createSurface는 거부됨).

## 사진 + 동영상 (노드 카메라)

사진 (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # 기본값: 양면 (2개 MEDIA 라인)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

동영상 클립 (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

참고사항:

- `canvas.*` 및 `camera.*`를 위해서는 노드가 **포그라운드**에 있어야 합니다 (백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE` 반환).
- 클립 길이는 제한됩니다 (현재 `<= 60s`) 너무 큰 base64 페이로드를 방지합니다.
- Android는 가능한 경우 `CAMERA`/`RECORD_AUDIO` 권한을 요청합니다. 거부된 권한은 `*_PERMISSION_REQUIRED`로 실패합니다.

## 화면 녹화 (노드)

노드는 `screen.record` (mp4)를 노출합니다. 예시:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

참고사항:

- `screen.record`는 노드 앱이 포그라운드에 있어야 합니다.
- Android는 녹화 전에 시스템 화면 캡처 프롬프트를 표시합니다.
- 화면 녹화는 `<= 60s`로 제한됩니다.
- `--no-audio`는 마이크 캡처를 비활성화합니다 (iOS/Android에서 지원; macOS는 시스템 캡처 오디오 사용).
- 여러 화면이 있을 때 `--screen <index>`를 사용하여 디스플레이를 선택하세요.

## 위치 (노드)

노드는 설정에서 위치가 활성화된 경우 `location.get`을 노출합니다.

CLI 헬퍼:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

참고사항:

- 위치는 **기본적으로 꺼져 있습니다**.
- "Always"는 시스템 권한이 필요합니다. 백그라운드 페치는 최선의 노력입니다.
- 응답에는 위도/경도, 정확도(미터), 타임스탬프가 포함됩니다.

## SMS (Android 노드)

Android 노드는 사용자가 **SMS** 권한을 부여하고 디바이스가 전화 통신을 지원하는 경우 `sms.send`를 노출할 수 있습니다.

저수준 호출:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

참고사항:

- 기능이 광고되기 전에 Android 디바이스에서 권한 프롬프트를 수락해야 합니다.
- 전화 통신 없이 Wi-Fi 전용 디바이스는 `sms.send`를 광고하지 않습니다.

## 시스템 명령어 (노드 호스트 / mac 노드)

macOS 노드는 `system.run`, `system.notify`, `system.execApprovals.get/set`을 노출합니다.
헤드리스 노드 호스트는 `system.run`, `system.which`, `system.execApprovals.get/set`을 노출합니다.

예시:

```bash
openclaw nodes run --node <idOrNameOrIp> -- echo "Hello from mac node"
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
```

참고사항:

- `system.run`은 페이로드에서 stdout/stderr/종료 코드를 반환합니다.
- `system.notify`는 macOS 앱의 알림 권한 상태를 존중합니다.
- `system.run`은 `--cwd`, `--env KEY=VAL`, `--command-timeout`, `--needs-screen-recording`을 지원합니다.
- `system.notify`는 `--priority <passive|active|timeSensitive>` 및 `--delivery <system|overlay|auto>`를 지원합니다.
- macOS 노드는 `PATH` 재정의를 삭제합니다. 헤드리스 노드 호스트는 노드 호스트 PATH를 앞에 추가하는 경우에만 `PATH`를 허용합니다.
- macOS 노드 모드에서 `system.run`은 macOS 앱의 exec 승인에 의해 제어됩니다 (설정 → Exec 승인).
  Ask/allowlist/full은 헤드리스 노드 호스트와 동일하게 작동합니다. 거부된 프롬프트는 `SYSTEM_RUN_DENIED`를 반환합니다.
- 헤드리스 노드 호스트에서 `system.run`은 exec 승인(`~/.openclaw/exec-approvals.json`)에 의해 제어됩니다.

## Exec 노드 바인딩

여러 노드가 사용 가능한 경우 exec를 특정 노드에 바인딩할 수 있습니다.
이는 `exec host=node`에 대한 기본 노드를 설정합니다 (에이전트별로 재정의 가능).

전역 기본값:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

에이전트별 재정의:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

모든 노드를 허용하려면 설정 해제:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## 권한 맵

노드는 `node.list` / `node.describe`에서 권한 이름(예: `screenRecording`, `accessibility`)을 키로 하고 부울 값(`true` = 부여됨)을 갖는 `permissions` 맵을 포함할 수 있습니다.

## 헤드리스 노드 호스트 (크로스 플랫폼)

OpenClaw는 게이트웨이 WebSocket에 연결하고 `system.run` / `system.which`를 노출하는 **헤드리스 노드 호스트**(UI 없음)를 실행할 수 있습니다. Linux/Windows에서 또는 서버와 함께 최소 노드를 실행하는 데 유용합니다.

시작:

```bash
openclaw node run --host <gateway-host> --port 18789
```

참고사항:

- 페어링은 여전히 필요합니다 (게이트웨이가 노드 승인 프롬프트를 표시함).
- 노드 호스트는 노드 ID, 토큰, 표시 이름 및 게이트웨이 연결 정보를 `~/.openclaw/node.json`에 저장합니다.
- Exec 승인은 `~/.openclaw/exec-approvals.json`을 통해 로컬에서 시행됩니다
  ([Exec 승인](/tools/exec-approvals) 참조).
- macOS에서 헤드리스 노드 호스트는 도달 가능한 경우 컴패니언 앱 exec 호스트를 선호하고 앱을 사용할 수 없는 경우 로컬 실행으로 대체됩니다. 앱을 요구하려면 `OPENCLAW_NODE_EXEC_HOST=app`를 설정하거나, 대체를 비활성화하려면 `OPENCLAW_NODE_EXEC_FALLBACK=0`을 설정하세요.
- 게이트웨이 WS가 TLS를 사용하는 경우 `--tls` / `--tls-fingerprint`를 추가하세요.

## Mac 노드 모드

- macOS 메뉴바 앱은 게이트웨이 WS 서버에 노드로 연결됩니다 (따라서 `openclaw nodes …`가 이 Mac에서 작동함).
- 원격 모드에서 앱은 게이트웨이 포트에 대한 SSH 터널을 열고 `localhost`에 연결합니다.

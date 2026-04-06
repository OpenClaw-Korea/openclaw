---
summary: "Bonjour/mDNS 디스커버리 + 디버깅 (게이트웨이 비콘, 클라이언트 및 일반적인 실패 모드)"
read_when:
  - macOS/iOS에서 Bonjour 디스커버리 문제를 디버깅할 때
  - mDNS 서비스 타입, TXT 레코드 또는 디스커버리 UX를 변경할 때
title: "Bonjour 디스커버리"
---

# Bonjour / mDNS 디스커버리

OpenClaw는 Bonjour(mDNS / DNS‑SD)를 활성 게이트웨이(WebSocket 엔드포인트)를 발견하기 위한
**LAN 전용 편의 기능**으로 사용합니다. 최선의 노력으로 제공되며 SSH 또는
Tailnet 기반 연결을 **대체하지 않습니다**.

## Tailscale을 통한 광역 Bonjour (Unicast DNS‑SD)

노드와 게이트웨이가 서로 다른 네트워크에 있을 경우, 멀티캐스트 mDNS는 경계를 넘지 못합니다.
**유니캐스트 DNS‑SD**("광역 Bonjour")를 Tailscale을 통해 사용하면 동일한 디스커버리 UX를 유지할 수 있습니다.

높은 수준의 단계:

1. 게이트웨이 호스트에서 DNS 서버를 실행합니다(Tailnet을 통해 도달 가능).
2. 전용 존 아래에서 `_openclaw-gw._tcp`에 대한 DNS‑SD 레코드를 게시합니다
   (예: `openclaw.internal.`).
3. Tailscale **분할 DNS**를 설정하여 선택한 도메인이 클라이언트(iOS 포함)를 위해
   해당 DNS 서버를 통해 확인되도록 합니다.

OpenClaw는 모든 디스커버리 도메인을 지원합니다. `openclaw.internal.`은 단지 예시입니다.
iOS/Android 노드는 `local.`과 구성된 광역 도메인을 모두 검색합니다.

### 게이트웨이 설정 (권장)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet 전용 (권장)
  discovery: { wideArea: { enabled: true } }, // 광역 DNS-SD 발행을 활성화합니다
}
```

### 일회성 DNS 서버 설정 (게이트웨이 호스트)

```bash
openclaw dns setup --apply
```

이는 CoreDNS를 설치하고 다음을 수행하도록 구성합니다:

- 게이트웨이의 Tailscale 인터페이스에서만 포트 53에서 수신
- 선택한 도메인(예: `openclaw.internal.`)을 `~/.openclaw/dns/<domain>.db`에서 제공

tailnet에 연결된 머신에서 검증합니다:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 설정

Tailscale 관리 콘솔에서:

- 게이트웨이의 tailnet IP(UDP/TCP 53)를 가리키는 네임서버를 추가합니다.
- 디스커버리 도메인이 해당 네임서버를 사용하도록 분할 DNS를 추가합니다.

클라이언트가 tailnet DNS를 수락하면, iOS 노드는 멀티캐스트 없이
디스커버리 도메인에서 `_openclaw-gw._tcp`를 검색할 수 있습니다.

### 게이트웨이 리스너 보안 (권장)

게이트웨이 WS 포트(기본값 `18789`)는 기본적으로 루프백에 바인딩됩니다. LAN/tailnet
액세스의 경우 명시적으로 바인딩하고 인증을 활성화된 상태로 유지하십시오.

Tailnet 전용 설정의 경우:

- `~/.openclaw/openclaw.json`에서 `gateway.bind: "tailnet"`을 설정합니다.
- 게이트웨이를 다시 시작합니다(또는 macOS 메뉴바 앱을 다시 시작합니다).

## 무엇이 광고되는가

오직 게이트웨이만이 `_openclaw-gw._tcp`를 광고합니다.

## 서비스 타입

- `_openclaw-gw._tcp` — 게이트웨이 전송 비콘(macOS/iOS/Android 노드에서 사용).

## TXT 키 (비밀이 아닌 힌트)

게이트웨이는 UI 흐름을 편리하게 하기 위해 작은 비밀이 아닌 힌트를 광고합니다:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (게이트웨이 WS + HTTP)
- `gatewayTls=1` (TLS가 활성화된 경우에만)
- `gatewayTlsSha256=<sha256>` (TLS가 활성화되고 지문을 사용할 수 있을 때만)
- `canvasPort=<port>` (캔버스 호스트가 활성화된 경우에만; 기본값 `18793`)
- `sshPort=<port>` (재정의되지 않을 경우 기본값 22)
- `transport=gateway`
- `cliPath=<path>` (선택적; 실행 가능한 `openclaw` 진입점의 절대 경로)
- `tailnetDns=<magicdns>` (Tailnet을 사용할 수 있을 때의 선택적 힌트)

## macOS에서의 디버깅

유용한 내장 도구:

- 인스턴스 검색:
  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```
- 한 인스턴스 확인 (`<instance>` 바꾸기):
  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

검색은 작동하지만 확인이 실패하면, 일반적으로 LAN 정책 또는
mDNS 해석기 문제를 겪고 있습니다.

## 게이트웨이 로그에서의 디버깅

게이트웨이는 순환 로그 파일을 작성합니다(시작 시 `gateway log file: ...`로 출력됨).
`bonjour:` 라인을 찾아보세요. 특히:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## iOS 노드에서의 디버깅

iOS 노드는 `NWBrowser`를 사용하여 `_openclaw-gw._tcp`를 발견합니다.

로그를 캡처하려면:

- 설정 → 게이트웨이 → 고급 → **Discovery Debug Logs**
- 설정 → 게이트웨이 → 고급 → **Discovery Logs** → 재현 → **복사**

로그에는 브라우저 상태 전환 및 결과 집합 변경 사항이 포함됩니다.

## 일반적인 실패 모드

- **Bonjour가 네트워크를 넘지 못합니다**: Tailnet 또는 SSH를 사용하세요.
- **멀티캐스트 차단됨**: 일부 Wi‑Fi 네트워크는 mDNS를 비활성화합니다.
- **절전/인터페이스 변동**: macOS는 일시적으로 mDNS 결과를 삭제할 수 있습니다. 다시 시도하세요.
- **검색은 작동하지만 확인 실패**: 머신 이름을 단순하게 유지합니다(이모지 또는
  구두점 피하기). 그런 다음 게이트웨이를 다시 시작합니다. 서비스 인스턴스 이름은
  호스트 이름에서 파생되므로, 과도하게 복잡한 이름은 일부 해석기를 혼동할 수 있습니다.

## 이스케이프된 인스턴스 이름 (`\032`)

Bonjour/DNS‑SD는 종종 서비스 인스턴스 이름의 바이트를 10진수 `\DDD` 시퀀스로
이스케이프합니다(예: 공백은 `\032`가 됨).

- 이것은 프로토콜 수준에서 정상입니다.
- UI는 표시를 위해 디코드해야 합니다(iOS는 `BonjourEscapes.decode` 사용).

## 비활성화 / 설정

- `OPENCLAW_DISABLE_BONJOUR=1`은 광고를 비활성화합니다(레거시: `OPENCLAW_DISABLE_BONJOUR`).
- `~/.openclaw/openclaw.json`의 `gateway.bind`는 게이트웨이 바인드 모드를 제어합니다.
- `OPENCLAW_SSH_PORT`는 TXT에 광고된 SSH 포트를 재정의합니다(레거시: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS`는 TXT에 MagicDNS 힌트를 게시합니다(레거시: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH`는 광고된 CLI 경로를 재정의합니다(레거시: `OPENCLAW_CLI_PATH`).

## 관련 문서

- 디스커버리 정책 및 전송 선택: [디스커버리](/gateway/discovery)
- 노드 페어링 + 승인: [게이트웨이 페어링](/gateway/pairing)

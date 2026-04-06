---
summary: "실행 승인, 허용 목록, 샌드박스 탈출 프롬프트"
read_when:
  - 실행 승인 또는 허용 목록 구성
  - macOS 앱에서 실행 승인 UX 구현
  - 샌드박스 탈출 프롬프트 및 영향 검토
title: "실행 승인"
---

# 실행 승인

실행 승인은 샌드박스 격리된 에이전트가 실제 호스트(`gateway` 또는 `node`)에서 명령을 실행할 수 있도록 하는 **컴패니언 앱 / 노드 호스트 보안 장치**입니다. 안전 인터록과 같은 개념으로, 정책 + 허용 목록 + (선택적) 사용자 승인이 모두 동의할 때만 명령이 허용됩니다.
실행 승인은 도구 정책 및 승격 게이팅에 **추가**됩니다(승격이 `full`로 설정된 경우 승인을 건너뜁니다).
유효 정책은 `tools.exec.*`와 승인 기본값 중 **더 엄격한** 값이며, 승인 필드가 생략되면 `tools.exec` 값이 사용됩니다.

컴패니언 앱 UI를 **사용할 수 없는** 경우, 프롬프트가 필요한 모든 요청은 **ask fallback**에 의해 해결됩니다(기본값: deny).

## 적용 범위

실행 승인은 실행 호스트에서 로컬로 적용됩니다.

- **gateway host** → 게이트웨이 머신의 `openclaw` 프로세스
- **node host** → 노드 러너(macOS 컴패니언 앱 또는 헤드리스 노드 호스트)

macOS 분리:

- **node host service**는 `system.run`을 로컬 IPC를 통해 **macOS app**으로 전달합니다.
- **macOS app**은 승인을 적용하고 UI 컨텍스트에서 명령을 실행합니다.

## 설정 및 저장

승인은 실행 호스트의 로컬 JSON 파일에 저장됩니다.

`~/.openclaw/exec-approvals.json`

예제 스키마:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 정책 설정

### Security (`exec.security`)

- **deny**: 모든 호스트 실행 요청 차단.
- **allowlist**: 허용 목록에 있는 명령만 허용.
- **full**: 모든 것을 허용(승격과 동일).

### Ask (`exec.ask`)

- **off**: 프롬프트 표시 안 함.
- **on-miss**: 허용 목록과 일치하지 않을 때만 프롬프트 표시.
- **always**: 모든 명령에 대해 프롬프트 표시.

### Ask fallback (`askFallback`)

프롬프트가 필요하지만 UI에 연결할 수 없는 경우, fallback이 결정합니다.

- **deny**: 차단.
- **allowlist**: 허용 목록과 일치하는 경우에만 허용.
- **full**: 허용.

## 허용 목록(에이전트별)

허용 목록은 **에이전트별**입니다. 여러 에이전트가 있는 경우, macOS 앱에서 편집할 에이전트를 전환하세요. 패턴은 **대소문자를 구분하지 않는 glob 매치**입니다.
패턴은 **바이너리 경로**로 해석되어야 합니다(basename만 있는 항목은 무시됨).
레거시 `agents.default` 항목은 로드 시 `agents.main`으로 마이그레이션됩니다.

예시:

- `~/Projects/**/bin/bird`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

각 허용 목록 항목은 다음을 추적합니다.

- **id** UI 식별에 사용되는 안정적인 UUID(선택사항)
- **last used** 타임스탬프
- **last used command**
- **last resolved path**

## 스킬 CLI 자동 허용

**Auto-allow skill CLIs**가 활성화되면, 알려진 스킬에서 참조하는 실행 파일이 노드(macOS 노드 또는 헤드리스 노드 호스트)에서 허용 목록으로 처리됩니다. 이는 게이트웨이 RPC를 통해 `skills.bins`을 사용하여 스킬 bin 목록을 가져옵니다. 엄격한 수동 허용 목록을 원하는 경우 이 기능을 비활성화하세요.

## 안전한 bin(stdin 전용)

`tools.exec.safeBins`는 허용 목록 모드에서 **명시적인 허용 목록 항목 없이** 실행할 수 있는 **stdin 전용** 바이너리(예: `jq`)의 작은 목록을 정의합니다. 안전한 bin은 위치 파일 인수와 경로 같은 토큰을 거부하므로 들어오는 스트림에서만 작동할 수 있습니다.
허용 목록 모드에서는 셸 체이닝과 리디렉션이 자동으로 허용되지 않습니다.

셸 체이닝(`&&`, `||`, `;`)은 모든 최상위 세그먼트가 허용 목록(안전한 bin 또는 스킬 자동 허용 포함)을 만족할 때 허용됩니다. 허용 목록 모드에서는 리디렉션이 지원되지 않습니다.
명령 치환(`$()` / 백틱)은 허용 목록 파싱 중에 거부되며, 이중 따옴표 내부에서도 마찬가지입니다. 리터럴 `$()` 텍스트가 필요한 경우 단일 따옴표를 사용하세요.

기본 안전한 bin: `jq`, `grep`, `cut`, `sort`, `uniq`, `head`, `tail`, `tr`, `wc`.

## Control UI 편집

**Control UI → Nodes → Exec approvals** 카드를 사용하여 기본값, 에이전트별 재정의, 허용 목록을 편집하세요. 범위(기본값 또는 에이전트)를 선택하고, 정책을 조정하고, 허용 목록 패턴을 추가/제거한 다음 **저장**하세요. UI는 패턴별로 **마지막 사용** 메타데이터를 표시하므로 목록을 깔끔하게 유지할 수 있습니다.

대상 선택기는 **게이트웨이**(로컬 승인) 또는 **노드**를 선택합니다. 노드는 `system.execApprovals.get/set`을 광고해야 합니다(macOS 앱 또는 헤드리스 노드 호스트).
노드가 아직 실행 승인을 광고하지 않는 경우, 로컬 `~/.openclaw/exec-approvals.json`을 직접 편집하세요.

CLI: `openclaw approvals`는 게이트웨이 또는 노드 편집을 지원합니다([Approvals CLI](/cli/approvals) 참조).

## 승인 플로우

프롬프트가 필요한 경우, 게이트웨이는 `exec.approval.requested`를 운영자 클라이언트에 브로드캐스트합니다.
Control UI 및 macOS 앱은 `exec.approval.resolve`를 통해 이를 해결한 다음 게이트웨이는 승인된 요청을 노드 호스트로 전달합니다.

승인이 필요한 경우, exec 도구는 승인 ID와 함께 즉시 반환됩니다. 해당 ID를 사용하여 나중의 시스템 이벤트(`Exec finished` / `Exec denied`)를 연관시키세요. 시간 초과 전에 결정이 도착하지 않으면 요청은 승인 시간 초과로 처리되고 거부 이유로 표시됩니다.

확인 대화상자에는 다음이 포함됩니다.

- 명령 + 인수
- cwd
- 에이전트 ID
- 해석된 실행 파일 경로
- 호스트 + 정책 메타데이터

작업:

- **Allow once** → 지금 실행
- **Always allow** → 허용 목록에 추가 + 실행
- **Deny** → 차단

## 채팅 채널로 승인 전달

실행 승인 프롬프트를 모든 채팅 채널(플러그인 채널 포함)로 전달하고 `/approve`로 승인할 수 있습니다. 이는 일반 아웃바운드 전달 파이프라인을 사용합니다.

설정:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // substring or regex
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

채팅에서 응답:

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

### macOS IPC 플로우

```
게이트웨이 -> 노드 서비스(WS)
                 |  IPC(UDS + 토큰 + HMAC + TTL)
                 v
             Mac 앱(UI + 승인 + system.run)
```

보안 참고 사항:

- Unix 소켓 모드 `0600`, 토큰은 `exec-approvals.json`에 저장.
- 동일 UID 피어 확인.
- 챌린지/응답(nonce + HMAC 토큰 + 요청 해시) + 짧은 TTL.

## 시스템 이벤트

실행 생애주기는 시스템 메시지로 표시됩니다.

- `Exec running`(명령이 실행 알림 임계값을 초과하는 경우에만)
- `Exec finished`
- `Exec denied`

이들은 노드가 이벤트를 보고한 후 에이전트의 세션에 게시됩니다.
게이트웨이 호스트 실행 승인은 명령이 완료될 때(그리고 선택적으로 임계값보다 오래 실행될 때) 동일한 생애주기 이벤트를 발생시킵니다.
승인이 게이팅된 실행은 쉬운 연관을 위해 승인 ID를 이러한 메시지의 `runId`로 재사용합니다.

## 영향

- **full**은 강력합니다. 가능한 한 허용 목록을 선호하세요.
- **ask**는 빠른 승인을 허용하면서도 계속 확인할 수 있게 합니다.
- 에이전트별 허용 목록은 한 에이전트의 승인이 다른 에이전트로 누출되는 것을 방지합니다.
- 승인은 **승인된 발신자**의 호스트 실행 요청에만 적용됩니다. 승인되지 않은 발신자는 `/exec`를 발행할 수 없습니다.
- `/exec security=full`은 승인된 운영자를 위한 세션 수준 편의 기능이며 설계상 승인을 건너뜁니다.
  호스트 실행을 완전히 차단하려면 승인 보안을 `deny`로 설정하거나 도구 정책을 통해 `exec` 도구를 거부하세요.

관련 항목:

- [Exec 도구](/tools/exec)
- [승격 모드](/tools/elevated)
- [스킬](/tools/skills)

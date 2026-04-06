---
summary: "리팩터 계획: exec host 라우팅, 노드 승인, 헤드리스 러너"
read_when:
  - exec host 라우팅 또는 exec 승인 설계 중
  - 노드 러너 + UI IPC 구현 중
  - exec host 보안 모드 및 슬래시 커맨드 추가 중
title: "Exec Host 리팩터"
---

# Exec host 리팩터 계획

## 목표

- `exec.host` + `exec.security`를 추가하여 **샌드박스**, **게이트웨이**, **노드** 전반에 걸쳐 실행을 라우팅합니다.
- 기본값을 **안전하게** 유지합니다: 명시적으로 활성화되지 않으면 호스트 간 실행 없음.
- 실행을 **헤드리스 러너 서비스**로 분리하며, 선택적 UI(macOS 앱)를 로컬 IPC를 통해 지원합니다.
- **에이전트별** 정책, 허용 목록, 물어보기 모드, 노드 바인딩을 제공합니다.
- 허용 목록 **유무와 관계없이** 작동하는 **물어보기 모드**를 지원합니다.
- 크로스 플랫폼: Unix 소켓 + 토큰 인증 (macOS/Linux/Windows 동등성).

## 비목표

- 기존 허용 목록 마이그레이션 또는 레거시 스키마 지원 없음.
- 노드 exec을 위한 PTY/스트리밍 없음 (집계된 출력만).
- 기존 Bridge + Gateway를 넘어서는 새로운 네트워크 계층 없음.

## 결정 사항 (고정)

- **설정 키:** `exec.host` + `exec.security` (에이전트별 재정의 허용).
- **상향:** `/elevated`를 게이트웨이 전체 접근 권한의 별칭으로 유지합니다.
- **물어보기 기본값:** `on-miss`.
- **승인 저장소:** `~/.openclaw/exec-approvals.json` (JSON, 레거시 마이그레이션 없음).
- **러너:** 헤드리스 시스템 서비스; UI 앱이 승인을 위한 Unix 소켓을 호스트합니다.
- **노드 식별:** 기존 `nodeId` 사용.
- **소켓 인증:** Unix 소켓 + 토큰 (크로스 플랫폼); 필요에 따라 나중에 분할.
- **노드 호스트 상태:** `~/.openclaw/node.json` (노드 id + 페어링 토큰).
- **macOS exec host:** macOS 앱 내에서 `system.run` 실행; 노드 호스트 서비스는 로컬 IPC를 통해 요청을 전달합니다.
- **XPC 헬퍼 없음:** Unix 소켓 + 토큰 + 피어 검사 유지.

## 주요 개념

### 호스트

- `sandbox`: Docker exec (현재 동작).
- `gateway`: 게이트웨이 호스트에서 exec.
- `node`: Bridge를 통한 노드 러너에서 exec (`system.run`).

### 보안 모드

- `deny`: 항상 차단.
- `allowlist`: 일치하는 항목만 허용.
- `full`: 모든 것 허용 (상향과 동등).

### 물어보기 모드

- `off`: 절대 묻지 않음.
- `on-miss`: 허용 목록이 일치하지 않을 때만 물어봄.
- `always`: 매번 물어봄.

물어보기는 **허용 목록과 독립적**입니다; 허용 목록은 `always` 또는 `on-miss`와 함께 사용할 수 있습니다.

### 정책 해결 (exec당)

1. `exec.host` 해결 (도구 매개변수 → 에이전트 재정의 → 전역 기본값).
2. `exec.security` 및 `exec.ask` 해결 (동일한 우선순위).
3. 호스트가 `sandbox`이면 로컬 샌드박스 exec을 진행합니다.
4. 호스트가 `gateway` 또는 `node`이면 해당 호스트에 보안 + 물어보기 정책을 적용합니다.

## 기본 안전

- 기본 `exec.host = sandbox`.
- `gateway` 및 `node`에 대한 기본 `exec.security = deny`.
- 기본 `exec.ask = on-miss` (보안이 허용하는 경우에만 관련).
- 노드 바인딩이 설정되지 않으면 **에이전트는 모든 노드를 대상**으로 할 수 있지만 정책이 허용하는 경우에만 해당됩니다.

## 설정 표면

### 도구 매개변수

- `exec.host` (선택): `sandbox | gateway | node`.
- `exec.security` (선택): `deny | allowlist | full`.
- `exec.ask` (선택): `off | on-miss | always`.
- `exec.node` (선택): `host=node`일 때 사용할 노드 id/name.

### 설정 키 (전역)

- `tools.exec.host`
- `tools.exec.security`
- `tools.exec.ask`
- `tools.exec.node` (기본 노드 바인딩)

### 설정 키 (에이전트별)

- `agents.list[].tools.exec.host`
- `agents.list[].tools.exec.security`
- `agents.list[].tools.exec.ask`
- `agents.list[].tools.exec.node`

### 별칭

- `/elevated on` = 에이전트 세션에 대해 `tools.exec.host=gateway`, `tools.exec.security=full`을 설정합니다.
- `/elevated off` = 에이전트 세션에 대해 이전 exec 설정을 복원합니다.

## 승인 저장소 (JSON)

경로: `~/.openclaw/exec-approvals.json`

목적:

- **실행 호스트**(게이트웨이 또는 노드 러너)에 대한 로컬 정책 + 허용 목록.
- UI를 사용할 수 없을 때 물어보기 폴백.
- UI 클라이언트용 IPC 자격 증명.

제안된 스키마 (v1):

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64-opaque-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny"
  },
  "agents": {
    "agent-id-1": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [
        {
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 0,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

참고:

- 레거시 허용 목록 형식 없음.
- `askFallback`은 `ask`가 필요하고 UI에 도달할 수 없을 때만 적용됩니다.
- 파일 권한: `0600`.

## 러너 서비스 (헤드리스)

### 역할

- 로컬에서 `exec.security` + `exec.ask` 강제 실행.
- 시스템 커맨드를 실행하고 출력을 반환합니다.
- exec 생명주기에 대한 Bridge 이벤트 발출 (선택사항이지만 권장).

### 서비스 생명주기

- macOS의 Launchd/daemon; Linux/Windows의 시스템 서비스.
- 승인 JSON은 실행 호스트에 로컬입니다.
- UI는 로컬 Unix 소켓을 호스트합니다; 러너는 필요에 따라 연결합니다.

## UI 통합 (macOS 앱)

### IPC

- Unix 소켓 위치: `~/.openclaw/exec-approvals.sock` (0600).
- 토큰이 `exec-approvals.json`에 저장됨 (0600).
- 피어 검사: 동일 UID만.
- 챌린지/응답: nonce + HMAC(token, request-hash) 재생 방지.
- 짧은 TTL (예: 10초) + 최대 페이로드 + 속도 제한.

### 물어보기 흐름 (macOS 앱 exec host)

1. 노드 서비스가 게이트웨이로부터 `system.run`을 수신합니다.
2. 노드 서비스는 로컬 소켓에 연결하고 프롬프트/exec 요청을 전송합니다.
3. 앱은 피어 + 토큰 + HMAC + TTL을 검증한 다음 필요하면 대화 상자를 표시합니다.
4. 앱은 UI 컨텍스트에서 커맨드를 실행하고 출력을 반환합니다.
5. 노드 서비스는 게이트웨이에 출력을 반환합니다.

UI가 없는 경우:

- `askFallback` (`deny|allowlist|full`)을 적용합니다.

### 다이어그램 (SCI)

```
Agent -> Gateway -> Bridge -> Node Service (TS)
                         |  IPC (UDS + token + HMAC + TTL)
                         v
                     Mac App (UI + TCC + system.run)
```

## 노드 식별 + 바인딩

- Bridge 페어링의 기존 `nodeId` 사용.
- 바인딩 모델:
  - `tools.exec.node`는 에이전트를 특정 노드로 제한합니다.
  - 설정하지 않으면 에이전트는 모든 노드를 선택할 수 있습니다 (정책이 여전히 기본값 강제 실행).
- 노드 선택 해결:
  - `nodeId` 정확한 일치
  - `displayName` (정규화됨)
  - `remoteIp`
  - `nodeId` 접두사 (>= 6자)

## 이벤팅

### 이벤트를 보는 대상

- 시스템 이벤트는 **세션별**이며 다음 프롬프트에서 에이전트에게 표시됩니다.
- 게이트웨이 인메모리 큐(`enqueueSystemEvent`)에 저장됩니다.

### 이벤트 텍스트

- `Exec started (node=<id>, id=<runId>)`
- `Exec finished (node=<id>, id=<runId>, code=<code>)` + 선택적 출력 테일
- `Exec denied (node=<id>, id=<runId>, <reason>)`

### 전송

옵션 A (권장):

- 러너는 Bridge `event` 프레임 `exec.started` / `exec.finished`를 전송합니다.
- 게이트웨이 `handleBridgeEvent`는 이를 `enqueueSystemEvent`에 매핑합니다.

옵션 B:

- 게이트웨이 `exec` 도구는 생명주기를 직접 처리합니다 (동기만).

## Exec 흐름

### 샌드박스 호스트

- 기존 `exec` 동작 (샌드박싱되지 않은 경우 Docker 또는 호스트).
- PTY는 비샌드박스 모드에서만 지원됩니다.

### 게이트웨이 호스트

- 게이트웨이 프로세스가 자신의 머신에서 실행됩니다.
- 로컬 `exec-approvals.json` (보안/물어보기/허용 목록)을 강제 실행합니다.

### 노드 호스트

- 게이트웨이는 `system.run`을 사용하여 `node.invoke`를 호출합니다.
- 러너는 로컬 승인을 강제 실행합니다.
- 러너는 집계된 stdout/stderr을 반환합니다.
- 시작/완료/거부에 대한 선택적 Bridge 이벤트.

## 출력 제한

- 결합된 stdout+stderr을 **200k**로 제한합니다; 이벤트에 대해 **테일 20k** 유지합니다.
- 명확한 접미사로 잘라냅니다 (예: `"… (truncated)"`).

## 슬래시 커맨드

- `/exec host=<sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`
- 에이전트별, 세션별 재정의; 설정을 통해 저장되지 않으면 비영구적입니다.
- `/elevated on|off|ask|full`은 `host=gateway security=full`의 바로가기로 유지됩니다 (`full`은 승인을 건너뜁니다).

## 크로스 플랫폼 이야기

- 러너 서비스는 이식 가능한 실행 대상입니다.
- UI는 선택사항입니다; 없으면 `askFallback`이 적용됩니다.
- Windows/Linux는 동일한 승인 JSON + 소켓 프로토콜을 지원합니다.

## 구현 단계

### 단계 1: 설정 + exec 라우팅

- `exec.host`, `exec.security`, `exec.ask`, `exec.node`에 대한 설정 스키마를 추가합니다.
- `exec.host`를 준수하도록 도구 배관을 업데이트합니다.
- `/exec` 슬래시 커맨드를 추가하고 `/elevated` 별칭을 유지합니다.

### 단계 2: 승인 저장소 + 게이트웨이 강제 실행

- `exec-approvals.json` 판독기/기록기를 구현합니다.
- `gateway` 호스트에 대해 허용 목록 + 물어보기 모드를 강제 실행합니다.
- 출력 제한을 추가합니다.

### 단계 3: 노드 러너 강제 실행

- 허용 목록 + 물어보기를 강제 실행하도록 노드 러너를 업데이트합니다.
- macOS 앱 UI에 Unix 소켓 프롬프트 브릿지를 추가합니다.
- `askFallback`을 연결합니다.

### 단계 4: 이벤트

- exec 생명주기에 대해 노드 → 게이트웨이 Bridge 이벤트를 추가합니다.
- 에이전트 프롬프트에 대해 `enqueueSystemEvent`에 매핑합니다.

### 단계 5: UI 마무리

- Mac 앱: 허용 목록 편집기, 에이전트별 전환기, 물어보기 정책 UI.
- 노드 바인딩 컨트롤 (선택사항).

## 테스트 계획

- 단위 테스트: 허용 목록 매칭 (glob + 대소문자 구분 없음).
- 단위 테스트: 정책 해결 우선순위 (도구 매개변수 → 에이전트 재정의 → 전역).
- 통합 테스트: 노드 러너 거부/허용/물어보기 흐름.
- Bridge 이벤트 테스트: 노드 이벤트 → 시스템 이벤트 라우팅.

## 열린 위험

- UI 불가능성: `askFallback`이 존중되는지 확인합니다.
- 장기 실행 커맨드: 타임아웃 + 출력 제한에 의존합니다.
- 다중 노드 모호성: 노드 바인딩이나 명시적 노드 매개변수가 없으면 오류입니다.

## 관련 문서

- [Exec tool](/tools/exec)
- [Exec approvals](/tools/exec-approvals)
- [Nodes](/nodes)
- [Elevated mode](/tools/elevated)

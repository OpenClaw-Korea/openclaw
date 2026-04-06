---
summary: "WhatsApp 메시지를 여러 에이전트에 브로드캐스트합니다"
read_when:
  - 브로드캐스트 그룹 설정하기
  - WhatsApp에서 다중 에이전트 응답 디버깅하기
status: experimental
title: "브로드캐스트 그룹"
---

# 브로드캐스트 그룹

**상태:** 실험 기능
**버전:** 2026.1.9에서 추가됨

## 개요

브로드캐스트 그룹을 사용하면 여러 에이전트가 동일한 메시지를 동시에 처리하고 응답할 수 있습니다. 이를 통해 한 개의 전화번호를 사용하면서 단일 WhatsApp 그룹 또는 DM에서 함께 작동하는 특화된 에이전트 팀을 구성할 수 있습니다.

현재 범위: **WhatsApp만 해당** (웹 채널).

브로드캐스트 그룹은 채널 allowlist와 그룹 활성화 규칙 이후에 평가됩니다. WhatsApp 그룹에서는 OpenClaw가 정상적으로 응답할 때 브로드캐스트가 발생합니다(예: 멘션 시, 그룹 설정에 따라).

## 사용 사례

### 1. 특화된 에이전트 팀

원자적이고 집중된 책임을 가진 여러 에이전트를 배치합니다:

```
Group: "Development Team"
Agents:
  - CodeReviewer (코드 스니펫 검토)
  - DocumentationBot (문서 생성)
  - SecurityAuditor (보안 취약점 검사)
  - TestGenerator (테스트 케이스 제안)
```

각 에이전트는 동일한 메시지를 처리하고 고유한 관점을 제공합니다.

### 2. 다국어 지원

```
Group: "International Support"
Agents:
  - Agent_EN (영어로 응답)
  - Agent_DE (독일어로 응답)
  - Agent_ES (스페인어로 응답)
```

### 3. 품질 보증 워크플로우

```
Group: "Customer Support"
Agents:
  - SupportAgent (답변 제공)
  - QAAgent (품질 검토, 문제가 있을 경우에만 응답)
```

### 4. 작업 자동화

```
Group: "Project Management"
Agents:
  - TaskTracker (작업 데이터베이스 업데이트)
  - TimeLogger (소비한 시간 기록)
  - ReportGenerator (요약 생성)
```

## 설정

### 기본 설정

최상위 `broadcast` 섹션을 추가합니다(`bindings` 옆에). 키는 WhatsApp 피어 ID입니다:

- 그룹 채팅: 그룹 JID (예: `120363403215116621@g.us`)
- DM: E.164 전화번호 (예: `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**결과:** OpenClaw가 이 채팅에서 응답할 때 세 에이전트를 모두 실행합니다.

### 처리 전략

에이전트가 메시지를 처리하는 방식을 제어합니다:

#### 병렬 처리 (기본값)

모든 에이전트가 동시에 처리합니다:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### 순차 처리

에이전트들이 순서대로 처리합니다(이전 에이전트가 완료될 때까지 대기):

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### 완전한 예제

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## 작동 방식

### 메시지 흐름

1. **들어오는 메시지**가 WhatsApp 그룹에 도착합니다
2. **브로드캐스트 확인**: 시스템이 피어 ID가 `broadcast`에 있는지 확인합니다
3. **브로드캐스트 목록에 있는 경우**:
   - 나열된 모든 에이전트가 메시지를 처리합니다
   - 각 에이전트는 고유한 세션 키와 격리된 컨텍스트를 가집니다
   - 에이전트는 병렬(기본값) 또는 순차적으로 처리합니다
4. **브로드캐스트 목록에 없는 경우**:
   - 일반적인 라우팅이 적용됩니다(첫 번째 일치하는 바인딩)

참고: 브로드캐스트 그룹은 채널 allowlist 또는 그룹 활성화 규칙(멘션/명령/기타)을 무시하지 않습니다. 메시지 처리 대상이 될 때 *어느 에이전트를 실행할지*만 변경합니다.

### 세션 격리

브로드캐스트 그룹의 각 에이전트는 완전히 분리된 다음을 유지합니다:

- **세션 키** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **대화 기록** (에이전트가 다른 에이전트의 메시지를 보지 못함)
- **워크스페이스** (구성된 경우 별도의 샌드박스)
- **도구 접근** (다른 허용/거부 목록)
- **메모리/컨텍스트** (별도의 IDENTITY.md, SOUL.md 등)
- **그룹 컨텍스트 버퍼** (컨텍스트에 사용되는 최근 그룹 메시지)는 피어당 공유되므로 모든 브로드캐스트 에이전트가 트리거될 때 동일한 컨텍스트를 봅니다

이를 통해 각 에이전트는 다음을 가질 수 있습니다:

- 다양한 성격
- 다양한 도구 접근 (예: 읽기 전용 vs 읽기-쓰기)
- 다양한 모델 (예: opus vs sonnet)
- 다양한 설치된 스킬

### 예제: 격리된 세션

그룹 `120363403215116621@g.us`에서 에이전트 `["alfred", "baerbel"]`을 사용하는 경우:

**Alfred의 컨텍스트:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/pascal/openclaw-alfred/
Tools: read, write, exec
```

**Bärbel의 컨텍스트:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/pascal/openclaw-baerbel/
Tools: read only
```

## 모범 사례

### 1. 에이전트를 집중시키기

각 에이전트를 단일하고 명확한 책임을 가지도록 설계합니다:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **좋음:** 각 에이전트는 하나의 작업을 수행합니다
❌ **나쁨:** 하나의 일반적인 "dev-helper" 에이전트

### 2. 설명적인 이름 사용

각 에이전트가 하는 일을 명확하게 합니다:

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. 도구 접근 다르게 설정

에이전트에게 필요한 도구만 제공합니다:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // 읽기 전용
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // 읽기-쓰기
    }
  }
}
```

### 4. 성능 모니터링

많은 에이전트를 사용할 때 다음을 고려합니다:

- `"strategy": "parallel"`(기본값) 사용으로 속도 향상
- 브로드캐스트 그룹당 5-10개의 에이전트로 제한
- 더 간단한 에이전트는 더 빠른 모델 사용

### 5. 실패를 우아하게 처리

에이전트는 독립적으로 실패합니다. 한 에이전트의 오류가 다른 에이전트를 차단하지 않습니다:

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A와 C가 응답, Agent B는 오류 기록
```

## 호환성

### 프로바이더

브로드캐스트 그룹은 현재 다음과 함께 작동합니다:

- ✅ WhatsApp (구현됨)
- 🚧 Telegram (계획됨)
- 🚧 Discord (계획됨)
- 🚧 Slack (계획됨)

### 라우팅

브로드캐스트 그룹은 기존 라우팅과 함께 작동합니다:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: alfred만 응답합니다(일반적인 라우팅)
- `GROUP_B`: agent1 AND agent2가 응답합니다(브로드캐스트)

**우선순위:** `broadcast`는 `bindings`보다 우선합니다.

## 문제 해결

### 에이전트가 응답하지 않음

**확인:**

1. 에이전트 ID가 `agents.list`에 존재하는지
2. 피어 ID 형식이 올바른지 (예: `120363403215116621@g.us`)
3. 에이전트가 거부 목록에 없는지

**디버그:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### 하나의 에이전트만 응답함

**원인:** 피어 ID가 `bindings`에는 있지만 `broadcast`에는 없을 수 있습니다.

**해결:** 브로드캐스트 설정에 추가하거나 바인딩에서 제거합니다.

### 성능 문제

**많은 에이전트로 인해 느린 경우:**

- 그룹당 에이전트 수 감소
- 더 가벼운 모델 사용 (opus 대신 sonnet)
- 샌드박스 시작 시간 확인

## 예제

### 예제 1: 코드 리뷰 팀

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**사용자 보냄:** 코드 스니펫
**응답:**

- code-formatter: "들여쓰기 수정 및 타입 힌트 추가"
- security-scanner: "⚠️ 12번 줄의 SQL 인젝션 취약점"
- test-coverage: "커버리지는 45%이며, 오류 케이스에 대한 테스트 부족"
- docs-checker: "함수 `process_data`에 대한 docstring 누락"

### 예제 2: 다국어 지원

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## API 참조

### 설정 스키마

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### 필드

- `strategy` (선택사항): 에이전트 처리 방식
  - `"parallel"` (기본값): 모든 에이전트가 동시에 처리합니다
  - `"sequential"`: 에이전트가 배열 순서대로 처리합니다
- `[peerId]`: WhatsApp 그룹 JID, E.164 번호 또는 기타 피어 ID
  - 값: 메시지를 처리해야 할 에이전트 ID의 배열

## 제한 사항

1. **최대 에이전트:** 정해진 한계는 없지만, 10개 이상의 에이전트는 느릴 수 있습니다
2. **공유 컨텍스트:** 에이전트는 서로의 응답을 보지 못합니다(의도적)
3. **메시지 순서:** 병렬 응답은 어떤 순서로든 도착할 수 있습니다
4. **속도 제한:** 모든 에이전트는 WhatsApp 속도 제한에 포함됩니다

## 향후 개선 사항

계획된 기능:

- [ ] 공유 컨텍스트 모드 (에이전트가 서로의 응답을 봅니다)
- [ ] 에이전트 조율 (에이전트가 서로 신호를 보낼 수 있습니다)
- [ ] 동적 에이전트 선택 (메시지 컨텐츠에 따라 에이전트 선택)
- [ ] 에이전트 우선순위 (일부 에이전트가 다른 에이전트보다 먼저 응답합니다)

## 참조

- [다중 에이전트 설정](/multi-agent-sandbox-tools)
- [라우팅 설정](/concepts/channel-routing)
- [세션 관리](/concepts/sessions)

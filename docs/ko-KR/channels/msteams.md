---
summary: "Microsoft Teams 봇 지원 상태, 기능 및 설정"
read_when:
  - MS Teams 채널 기능 작업 시
title: "Microsoft Teams"
---

# Microsoft Teams (플러그인)

> "여기 들어오는 모든 희망을 버려라."

업데이트: 2026-01-21

상태: 텍스트 + DM 첨부 파일 지원됨; 채널/그룹 파일 전송은 `sharePointSiteId` + Graph 권한 필요 ([그룹 채팅에서 파일 전송](#그룹-채팅에서-파일-전송) 참조). 투표는 Adaptive Cards를 통해 전송됩니다.

## 플러그인 필요

Microsoft Teams는 플러그인으로 제공되며 코어 설치에 포함되지 않습니다.

**주요 변경 사항 (2026.1.15):** MS Teams가 코어에서 이동했습니다. 사용하는 경우 플러그인을 설치해야 합니다.

설명 가능: 코어 설치를 더 가볍게 유지하고 MS Teams 종속성이 독립적으로 업데이트되도록 합니다.

CLI를 통해 설치 (npm 레지스트리):

```bash
openclaw plugins install @openclaw/msteams
```

로컬 체크아웃 (git 저장소에서 실행 시):

```bash
openclaw plugins install ./extensions/msteams
```

설정/온보딩 중 Teams를 선택하고 git 체크아웃이 감지되면,
OpenClaw이 자동으로 로컬 설치 경로를 제공합니다.

세부 정보: [플러그인](/plugin)

## 빠른 설정 (초보자용)

1. Microsoft Teams 플러그인을 설치하세요.
2. **Azure Bot**을 생성하세요 (App ID + 클라이언트 비밀 + 테넌트 ID).
3. 해당 자격 증명으로 OpenClaw을 설정하세요.
4. 공개 URL 또는 터널을 통해 `/api/messages` (기본값 포트 3978)를 노출하세요.
5. Teams 앱 패키지를 설치하고 게이트웨이를 시작하세요.

최소 설정:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

참고: 그룹 채팅은 기본적으로 차단됩니다 (`channels.msteams.groupPolicy: "allowlist"`). 그룹 답장을 허용하려면 `channels.msteams.groupAllowFrom`을 설정하세요 (또는 모든 멤버를 허용하되 멘션 게이팅하려면 `groupPolicy: "open"` 사용).

## 목표

- Teams DM, 그룹 채팅 또는 채널을 통해 OpenClaw과 대화.
- 라우팅을 결정론적으로 유지: 답장은 항상 도착한 채널로 돌아갑니다.
- 안전한 채널 동작 기본 설정 (설정되지 않는 한 멘션 필요).

## 설정 쓰기

기본적으로 Microsoft Teams는 `/config set|unset`으로 트리거된 설정 업데이트 쓰기가 허용됩니다 (`commands.config: true` 필요).

비활성화 방법:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## 접근 제어 (DM + 그룹)

**DM 액세스**

- 기본값: `channels.msteams.dmPolicy = "pairing"`. 알 수 없는 발신자는 승인될 때까지 무시됩니다.
- `channels.msteams.allowFrom`은 AAD 객체 ID, UPN 또는 표시 이름을 허용합니다. 마법사는 자격 증명이 허용하는 경우 Microsoft Graph를 통해 이름을 ID로 확인합니다.

**그룹 액세스**

- 기본값: `channels.msteams.groupPolicy = "allowlist"` (`groupAllowFrom`을 추가하지 않으면 차단됨). 설정되지 않은 경우 기본값을 재정의하려면 `channels.defaults.groupPolicy`를 사용하세요.
- `channels.msteams.groupAllowFrom`은 그룹 채팅/채널에서 트리거할 수 있는 발신자를 제어합니다 (`channels.msteams.allowFrom`으로 대체).
- 모든 멤버를 허용하려면 `groupPolicy: "open"`으로 설정하세요 (여전히 기본적으로 멘션 게이팅됨).
- **채널을 허용하지 않으려면** `channels.msteams.groupPolicy: "disabled"`를 설정하세요.

예시:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**팀 + 채널 허용목록**

- `channels.msteams.teams` 아래에 팀과 채널을 나열하여 그룹/채널 답장 범위 지정.
- 키는 팀 ID 또는 이름일 수 있습니다. 채널 키는 대화 ID 또는 이름일 수 있습니다.
- `groupPolicy="allowlist"` 및 팀 허용목록이 있는 경우 나열된 팀/채널만 허용됩니다 (멘션 게이팅됨).
- 설정 마법사는 `Team/Channel` 항목을 받아 저장합니다.
- 시작 시 OpenClaw은 팀/채널 및 사용자 허용목록 이름을 ID로 확인하고 (Graph 권한이 허용하는 경우)
  매핑을 기록합니다. 확인되지 않은 항목은 입력한 대로 유지됩니다.

예시:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## 작동 방식

1. Microsoft Teams 플러그인을 설치하세요.
2. **Azure Bot**을 생성하세요 (App ID + 비밀 + 테넌트 ID).
3. 봇을 참조하고 아래 RSC 권한을 포함하는 **Teams 앱 패키지**를 빌드하세요.
4. Teams 앱을 팀에 업로드/설치하세요 (또는 DM의 경우 개인 범위).
5. `~/.openclaw/openclaw.json` (또는 환경 변수)에서 `msteams`를 설정하고 게이트웨이를 시작하세요.
6. 게이트웨이는 기본적으로 `/api/messages`에서 Bot Framework 웹훅 트래픽을 수신합니다.

## Azure Bot 설정 (사전 요구 사항)

OpenClaw을 설정하기 전에 Azure Bot 리소스를 생성해야 합니다.

### 1단계: Azure Bot 생성

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)으로 이동
2. **기본** 탭을 채우세요:

   | 필드               | 값                                            |
   | ------------------ | --------------------------------------------- |
   | **봇 핸들**        | 봇 이름, 예: `openclaw-msteams` (고유해야 함) |
   | **구독**           | Azure 구독 선택                               |
   | **리소스 그룹**    | 새로 만들기 또는 기존 사용                    |
   | **가격 책정 계층** | 개발/테스트용 **무료**                        |
   | **앱 유형**        | **단일 테넌트** (권장 - 아래 참고 참조)       |
   | **생성 유형**      | **새 Microsoft 앱 ID 만들기**                 |

> **사용 중단 알림:** 2025-07-31 이후 새 다중 테넌트 봇 생성이 중단되었습니다. 새 봇에는 **단일 테넌트**를 사용하세요.

3. **검토 + 만들기** → **만들기** 클릭 (약 1-2분 대기)

### 2단계: 자격 증명 가져오기

1. Azure Bot 리소스 → **설정**으로 이동
2. **Microsoft 앱 ID** 복사 → 이것이 `appId`입니다
3. **암호 관리** 클릭 → 앱 등록으로 이동
4. **인증서 및 비밀** → **새 클라이언트 비밀** → **값** 복사 → 이것이 `appPassword`입니다
5. **개요** → **디렉터리 (테넌트) ID** 복사 → 이것이 `tenantId`입니다

### 3단계: 메시징 엔드포인트 설정

1. Azure Bot → **설정**에서
2. **메시징 엔드포인트**를 웹훅 URL로 설정:
   - 프로덕션: `https://your-domain.com/api/messages`
   - 로컬 개발: 터널 사용 (아래 [로컬 개발](#로컬-개발-터널링) 참조)

### 4단계: Teams 채널 활성화

1. Azure Bot → **채널**에서
2. **Microsoft Teams** 클릭 → 설정 → 저장
3. 서비스 약관 동의

## 로컬 개발 (터널링)

Teams는 `localhost`에 도달할 수 없습니다. 로컬 개발에 터널을 사용하세요:

**옵션 A: ngrok**

```bash
ngrok http 3978
# https URL 복사, 예: https://abc123.ngrok.io
# 메시징 엔드포인트를 다음으로 설정: https://abc123.ngrok.io/api/messages
```

**옵션 B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Tailscale funnel URL을 메시징 엔드포인트로 사용
```

## Teams 개발자 포털 (대안)

매니페스트 ZIP을 수동으로 생성하는 대신 [Teams 개발자 포털](https://dev.teams.microsoft.com/apps)을 사용할 수 있습니다:

1. **+ 새 앱** 클릭
2. 기본 정보 입력 (이름, 설명, 개발자 정보)
3. **앱 기능** → **봇**으로 이동
4. **수동으로 봇 ID 입력** 선택 후 Azure Bot 앱 ID 붙여넣기
5. 범위 확인: **개인**, **팀**, **그룹 채팅**
6. **배포** → **앱 패키지 다운로드** 클릭
7. Teams에서: **앱** → **앱 관리** → **사용자 지정 앱 업로드** → ZIP 선택

이것이 JSON 매니페스트를 수동으로 편집하는 것보다 쉬운 경우가 많습니다.

## 봇 테스트

**옵션 A: Azure 웹 채팅 (웹훅 먼저 확인)**

1. Azure Portal → Azure Bot 리소스 → **웹 채팅에서 테스트**
2. 메시지 전송 - 응답이 표시되어야 함
3. Teams 설정 전에 웹훅 엔드포인트가 작동하는지 확인

**옵션 B: Teams (앱 설치 후)**

1. Teams 앱 설치 (사이드로드 또는 조직 카탈로그)
2. Teams에서 봇을 찾아 DM 전송
3. 들어오는 활동에 대한 게이트웨이 로그 확인

## 설정 (최소 텍스트 전용)

1. **Microsoft Teams 플러그인 설치**
   - npm에서: `openclaw plugins install @openclaw/msteams`
   - 로컬 체크아웃에서: `openclaw plugins install ./extensions/msteams`

2. **봇 등록**
   - Azure Bot을 생성하고 (위 참조) 기록하세요:
     - 앱 ID
     - 클라이언트 비밀 (앱 암호)
     - 테넌트 ID (단일 테넌트)

3. **Teams 앱 매니페스트**
   - `botId = <App ID>`로 `bot` 항목을 포함하세요.
   - 범위: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (개인 범위 파일 처리에 필요).
   - RSC 권한 추가 (아래).
   - 아이콘 생성: `outline.png` (32x32) 및 `color.png` (192x192).
   - 세 파일을 모두 압축: `manifest.json`, `outline.png`, `color.png`.

4. **OpenClaw 설정**

   ```json
   {
     "msteams": {
       "enabled": true,
       "appId": "<APP_ID>",
       "appPassword": "<APP_PASSWORD>",
       "tenantId": "<TENANT_ID>",
       "webhook": { "port": 3978, "path": "/api/messages" }
     }
   }
   ```

   설정 키 대신 환경 변수를 사용할 수도 있습니다:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **봇 엔드포인트**
   - Azure Bot 메시징 엔드포인트를 다음으로 설정:
     - `https://<host>:3978/api/messages` (또는 선택한 경로/포트).

6. **게이트웨이 실행**
   - 플러그인이 설치되고 자격 증명이 있는 `msteams` 설정이 있으면 Teams 채널이 자동으로 시작됩니다.

## 히스토리 컨텍스트

- `channels.msteams.historyLimit`는 프롬프트에 래핑되는 최근 채널/그룹 메시지 수를 제어합니다.
- `messages.groupChat.historyLimit`로 대체됩니다. 비활성화하려면 `0`으로 설정 (기본값 50).
- DM 히스토리는 `channels.msteams.dmHistoryLimit` (사용자 턴)로 제한할 수 있습니다. 사용자별 재정의: `channels.msteams.dms["<user_id>"].historyLimit`.

## 현재 Teams RSC 권한 (매니페스트)

이는 Teams 앱 매니페스트의 **기존 resourceSpecific 권한**입니다. 앱이 설치된 팀/채팅 내에서만 적용됩니다.

**채널용 (팀 범위):**

- `ChannelMessage.Read.Group` (애플리케이션) - @멘션 없이 모든 채널 메시지 수신
- `ChannelMessage.Send.Group` (애플리케이션)
- `Member.Read.Group` (애플리케이션)
- `Owner.Read.Group` (애플리케이션)
- `ChannelSettings.Read.Group` (애플리케이션)
- `TeamMember.Read.Group` (애플리케이션)
- `TeamSettings.Read.Group` (애플리케이션)

**그룹 채팅용:**

- `ChatMessage.Read.Chat` (애플리케이션) - @멘션 없이 모든 그룹 채팅 메시지 수신

## Teams 매니페스트 예시 (편집됨)

필수 필드가 있는 최소한의 유효한 예시입니다. ID와 URL을 바꾸세요.

```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  "manifestVersion": "1.23",
  "version": "1.0.0",
  "id": "00000000-0000-0000-0000-000000000000",
  "name": { "short": "OpenClaw" },
  "developer": {
    "name": "Your Org",
    "websiteUrl": "https://example.com",
    "privacyUrl": "https://example.com/privacy",
    "termsOfUseUrl": "https://example.com/terms"
  },
  "description": { "short": "OpenClaw in Teams", "full": "OpenClaw in Teams" },
  "icons": { "outline": "outline.png", "color": "color.png" },
  "accentColor": "#5B6DEF",
  "bots": [
    {
      "botId": "11111111-1111-1111-1111-111111111111",
      "scopes": ["personal", "team", "groupChat"],
      "isNotificationOnly": false,
      "supportsCalling": false,
      "supportsVideo": false,
      "supportsFiles": true
    }
  ],
  "webApplicationInfo": {
    "id": "11111111-1111-1111-1111-111111111111"
  },
  "authorization": {
    "permissions": {
      "resourceSpecific": [
        { "name": "ChannelMessage.Read.Group", "type": "Application" },
        { "name": "ChannelMessage.Send.Group", "type": "Application" },
        { "name": "Member.Read.Group", "type": "Application" },
        { "name": "Owner.Read.Group", "type": "Application" },
        { "name": "ChannelSettings.Read.Group", "type": "Application" },
        { "name": "TeamMember.Read.Group", "type": "Application" },
        { "name": "TeamSettings.Read.Group", "type": "Application" },
        { "name": "ChatMessage.Read.Chat", "type": "Application" }
      ]
    }
  }
}
```

### 매니페스트 주의 사항 (필수 필드)

- `bots[].botId`는 Azure Bot 앱 ID와 **일치해야** 합니다.
- `webApplicationInfo.id`는 Azure Bot 앱 ID와 **일치해야** 합니다.
- `bots[].scopes`는 사용할 표면을 포함해야 합니다 (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true`는 개인 범위 파일 처리에 필요합니다.
- `authorization.permissions.resourceSpecific`는 채널 트래픽을 원하는 경우 채널 읽기/전송을 포함해야 합니다.

### 기존 앱 업데이트

이미 설치된 Teams 앱을 업데이트하려면 (예: RSC 권한 추가):

1. 새 설정으로 `manifest.json` 업데이트
2. **`version` 필드 증가** (예: `1.0.0` → `1.1.0`)
3. 아이콘과 함께 매니페스트를 **다시 압축** (`manifest.json`, `outline.png`, `color.png`)
4. 새 zip 업로드:
   - **옵션 A (Teams 관리 센터):** Teams 관리 센터 → Teams 앱 → 앱 관리 → 앱 찾기 → 새 버전 업로드
   - **옵션 B (사이드로드):** Teams → 앱 → 앱 관리 → 사용자 지정 앱 업로드
5. **팀 채널의 경우:** 새 권한이 적용되도록 각 팀에서 앱 재설치
6. **Teams 완전 종료 및 재시작** (창만 닫지 말고) 캐시된 앱 메타데이터 지우기

## 기능: RSC 전용 vs Graph

### **Teams RSC만** 사용 (앱 설치, Graph API 권한 없음)

작동:

- 채널 메시지 **텍스트** 콘텐츠 읽기.
- 채널 메시지 **텍스트** 콘텐츠 전송.
- **개인 (DM)** 파일 첨부 파일 수신.

작동 안 함:

- 채널/그룹 **이미지 또는 파일 콘텐츠** (페이로드에 HTML 스텁만 포함).
- SharePoint/OneDrive에 저장된 첨부 파일 다운로드.
- 메시지 히스토리 읽기 (라이브 웹훅 이벤트 외).

### **Teams RSC + Microsoft Graph 애플리케이션 권한** 사용

추가:

- 호스팅된 콘텐츠 다운로드 (메시지에 붙여넣은 이미지).
- SharePoint/OneDrive에 저장된 파일 첨부 파일 다운로드.
- Graph를 통한 채널/채팅 메시지 히스토리 읽기.

### RSC vs Graph API

| 기능                | RSC 권한                  | Graph API                      |
| ------------------- | ------------------------- | ------------------------------ |
| **실시간 메시지**   | 예 (웹훅을 통해)          | 아니오 (폴링만)                |
| **히스토리 메시지** | 아니오                    | 예 (히스토리 쿼리 가능)        |
| **설정 복잡성**     | 앱 매니페스트만           | 관리자 동의 + 토큰 플로우 필요 |
| **오프라인 작동**   | 아니오 (실행 중이어야 함) | 예 (언제든지 쿼리 가능)        |

**결론:** RSC는 실시간 수신용; Graph API는 히스토리 액세스용입니다. 오프라인 동안 놓친 메시지를 따라잡으려면 `ChannelMessage.Read.All`이 있는 Graph API가 필요합니다 (관리자 동의 필요).

## Graph 활성화 미디어 + 히스토리 (채널에 필요)

**채널**에서 이미지/파일이 필요하거나 **메시지 히스토리**를 가져오려면 Microsoft Graph 권한을 활성화하고 관리자 동의를 부여해야 합니다.

1. Entra ID (Azure AD) **앱 등록**에서 Microsoft Graph **애플리케이션 권한** 추가:
   - `ChannelMessage.Read.All` (채널 첨부 파일 + 히스토리)
   - `Chat.Read.All` 또는 `ChatMessage.Read.All` (그룹 채팅)
2. 테넌트에 대한 **관리자 동의 부여**.
3. Teams 앱 **매니페스트 버전** 증가, 다시 업로드 및 **Teams에서 앱 재설치**.
4. **Teams 완전 종료 및 재시작**하여 캐시된 앱 메타데이터 지우기.

## 알려진 제한 사항

### 웹훅 타임아웃

Teams는 HTTP 웹훅을 통해 메시지를 전달합니다. 처리 시간이 너무 오래 걸리면 (예: 느린 LLM 응답) 다음이 표시될 수 있습니다:

- 게이트웨이 타임아웃
- Teams가 메시지 재시도 (중복 발생)
- 답장 삭제됨

OpenClaw은 빠르게 반환하고 답장을 능동적으로 전송하여 처리하지만 매우 느린 응답은 여전히 문제를 일으킬 수 있습니다.

### 포맷팅

Teams 마크다운은 Slack 또는 Discord보다 제한적입니다:

- 기본 포맷팅 작동: **굵게**, _기울임_, `코드`, 링크
- 복잡한 마크다운 (테이블, 중첩 목록)이 올바르게 렌더링되지 않을 수 있음
- Adaptive Cards는 투표 및 임의 카드 전송에 지원됩니다 (아래 참조)

## 설정

주요 설정 (공유 채널 패턴은 `/gateway/configuration` 참조):

- `channels.msteams.enabled`: 채널 활성화/비활성화.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: 봇 자격 증명.
- `channels.msteams.webhook.port` (기본값 `3978`)
- `channels.msteams.webhook.path` (기본값 `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (기본값: pairing)
- `channels.msteams.allowFrom`: DM 허용목록 (AAD 객체 ID, UPN 또는 표시 이름). 마법사는 설정 중 Graph 액세스가 가능할 때 이름을 ID로 확인합니다.
- `channels.msteams.textChunkLimit`: 아웃바운드 텍스트 청크 크기.
- `channels.msteams.chunkMode`: `length` (기본값) 또는 `newline`으로 길이 청킹 전에 빈 줄 (단락 경계)에서 분할.
- `channels.msteams.mediaAllowHosts`: 인바운드 첨부 파일 호스트 허용목록 (기본값 Microsoft/Teams 도메인).
- `channels.msteams.mediaAuthAllowHosts`: 미디어 재시도 시 Authorization 헤더 첨부 허용목록 (기본값 Graph + Bot Framework 호스트).
- `channels.msteams.requireMention`: 채널/그룹에서 @멘션 필요 (기본값 true).
- `channels.msteams.replyStyle`: `thread | top-level` ([답장 스타일](#답장-스타일-스레드-vs-게시물) 참조).
- `channels.msteams.teams.<teamId>.replyStyle`: 팀별 재정의.
- `channels.msteams.teams.<teamId>.requireMention`: 팀별 재정의.
- `channels.msteams.teams.<teamId>.tools`: 채널 재정의가 누락된 경우 사용되는 기본 팀별 도구 정책 재정의 (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.toolsBySender`: 기본 팀별 발신자별 도구 정책 재정의 (`"*"` 와일드카드 지원).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: 채널별 재정의.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: 채널별 재정의.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: 채널별 도구 정책 재정의 (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: 채널별 발신자별 도구 정책 재정의 (`"*"` 와일드카드 지원).
- `channels.msteams.sharePointSiteId`: 그룹 채팅/채널에서 파일 업로드용 SharePoint 사이트 ID ([그룹 채팅에서 파일 전송](#그룹-채팅에서-파일-전송) 참조).

## 라우팅 및 세션

- 세션 키는 표준 에이전트 형식을 따릅니다 ([/concepts/session](/concepts/session) 참조):
  - 직접 메시지는 메인 세션 공유 (`agent:<agentId>:<mainKey>`).
  - 채널/그룹 메시지는 대화 ID 사용:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 답장 스타일: 스레드 vs 게시물

Teams는 최근 같은 기본 데이터 모델 위에 두 가지 채널 UI 스타일을 도입했습니다:

| 스타일                    | 설명                                           | 권장 `replyStyle` |
| ------------------------- | ---------------------------------------------- | ----------------- |
| **게시물** (클래식)       | 메시지가 카드로 표시되고 그 아래에 스레드 답장 | `thread` (기본값) |
| **스레드** (Slack과 유사) | 메시지가 선형으로 흐름, Slack과 비슷           | `top-level`       |

**문제:** Teams API는 채널이 사용하는 UI 스타일을 노출하지 않습니다. 잘못된 `replyStyle`을 사용하면:

- 스레드 스타일 채널에서 `thread` → 답장이 어색하게 중첩됨
- 게시물 스타일 채널에서 `top-level` → 답장이 스레드 내 대신 별도의 최상위 게시물로 나타남

**솔루션:** 채널 설정 방식에 따라 채널별로 `replyStyle`을 설정하세요:

```json
{
  "msteams": {
    "replyStyle": "thread",
    "teams": {
      "19:abc...@thread.tacv2": {
        "channels": {
          "19:xyz...@thread.tacv2": {
            "replyStyle": "top-level"
          }
        }
      }
    }
  }
}
```

## 첨부 파일 및 이미지

**현재 제한 사항:**

- **DM:** 이미지 및 파일 첨부 파일은 Teams 봇 파일 API를 통해 작동합니다.
- **채널/그룹:** 첨부 파일은 M365 저장소 (SharePoint/OneDrive)에 있습니다. 웹훅 페이로드에는 실제 파일 바이트가 아닌 HTML 스텁만 포함됩니다. 채널 첨부 파일을 다운로드하려면 **Graph API 권한이 필요합니다**.

Graph 권한이 없으면 이미지가 있는 채널 메시지는 텍스트 전용으로 수신됩니다 (이미지 콘텐츠는 봇에 액세스할 수 없음).
기본적으로 OpenClaw은 Microsoft/Teams 호스트 이름에서만 미디어를 다운로드합니다. `channels.msteams.mediaAllowHosts`로 재정의 (모든 호스트를 허용하려면 `["*"]` 사용).
Authorization 헤더는 `channels.msteams.mediaAuthAllowHosts`의 호스트에만 첨부됩니다 (기본값 Graph + Bot Framework 호스트). 이 목록을 엄격하게 유지하세요 (다중 테넌트 접미사 피하기).

## 그룹 채팅에서 파일 전송

봇은 FileConsentCard 플로우 (내장)를 사용하여 DM에서 파일을 전송할 수 있습니다. 그러나 **그룹 채팅/채널에서 파일 전송**에는 추가 설정이 필요합니다:

| 컨텍스트                   | 파일 전송 방법                            | 필요한 설정                          |
| -------------------------- | ----------------------------------------- | ------------------------------------ |
| **DM**                     | FileConsentCard → 사용자 수락 → 봇 업로드 | 기본 제공                            |
| **그룹 채팅/채널**         | SharePoint에 업로드 → 공유 링크           | `sharePointSiteId` + Graph 권한 필요 |
| **이미지 (모든 컨텍스트)** | Base64 인코딩 인라인                      | 기본 제공                            |

### 그룹 채팅에 SharePoint가 필요한 이유

봇은 개인 OneDrive 드라이브가 없습니다 (`/me/drive` Graph API 엔드포인트가 애플리케이션 ID에 작동하지 않음). 그룹 채팅/채널에서 파일을 전송하려면 봇이 **SharePoint 사이트**에 업로드하고 공유 링크를 생성합니다.

### 설정

1. **Entra ID (Azure AD) → 앱 등록에서 Graph API 권한 추가**:
   - `Sites.ReadWrite.All` (애플리케이션) - SharePoint에 파일 업로드
   - `Chat.Read.All` (애플리케이션) - 선택사항, 사용자별 공유 링크 활성화

2. **테넌트에 대한 관리자 동의 부여**.

3. **SharePoint 사이트 ID 가져오기:**

   ```bash
   # 유효한 토큰으로 Graph Explorer 또는 curl을 통해:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 예: "contoso.sharepoint.com/sites/BotFiles"의 사이트용
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # 응답에 포함: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw 설정:**
   ```json5
   {
     channels: {
       msteams: {
         // ... 기타 설정 ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### 공유 동작

| 권한                                    | 공유 동작                                            |
| --------------------------------------- | ---------------------------------------------------- |
| `Sites.ReadWrite.All`만                 | 조직 전체 공유 링크 (조직의 모든 사람이 액세스 가능) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 사용자별 공유 링크 (채팅 멤버만 액세스 가능)         |

사용자별 공유는 채팅 참가자만 파일에 액세스할 수 있으므로 더 안전합니다. `Chat.Read.All` 권한이 누락된 경우 봇은 조직 전체 공유로 대체됩니다.

### 대체 동작

| 시나리오                                     | 결과                                            |
| -------------------------------------------- | ----------------------------------------------- |
| 그룹 채팅 + 파일 + `sharePointSiteId` 설정됨 | SharePoint에 업로드, 공유 링크 전송             |
| 그룹 채팅 + 파일 + `sharePointSiteId` 없음   | OneDrive 업로드 시도 (실패 가능), 텍스트만 전송 |
| 개인 채팅 + 파일                             | FileConsentCard 플로우 (SharePoint 없이 작동)   |
| 모든 컨텍스트 + 이미지                       | Base64 인코딩 인라인 (SharePoint 없이 작동)     |

### 파일 저장 위치

업로드된 파일은 설정된 SharePoint 사이트의 기본 문서 라이브러리의 `/OpenClawShared/` 폴더에 저장됩니다.

## 투표 (Adaptive Cards)

OpenClaw은 Teams 투표를 Adaptive Cards로 전송합니다 (네이티브 Teams 투표 API 없음).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 투표는 게이트웨이에 의해 `~/.openclaw/msteams-polls.json`에 기록됩니다.
- 투표를 기록하려면 게이트웨이가 온라인 상태여야 합니다.
- 투표는 아직 결과 요약을 자동 게시하지 않습니다 (필요한 경우 저장소 파일 검사).

## Adaptive Cards (임의)

`message` 도구 또는 CLI를 사용하여 Teams 사용자 또는 대화에 Adaptive Card JSON을 전송하세요.

`card` 매개변수는 Adaptive Card JSON 객체를 허용합니다. `card`가 제공되면 메시지 텍스트는 선택사항입니다.

**에이전트 도구:**

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "user:<id>",
  "card": {
    "type": "AdaptiveCard",
    "version": "1.5",
    "body": [{ "type": "TextBlock", "text": "Hello!" }]
  }
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

카드 스키마 및 예시는 [Adaptive Cards 문서](https://adaptivecards.io/)를 참조하세요. 대상 형식 세부 정보는 아래 [대상 형식](#대상-형식)을 참조하세요.

## 대상 형식

MSTeams 대상은 접두사를 사용하여 사용자와 대화를 구분합니다:

| 대상 유형        | 형식                             | 예시                                            |
| ---------------- | -------------------------------- | ----------------------------------------------- |
| 사용자 (ID별)    | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`     |
| 사용자 (이름별)  | `user:<display-name>`            | `user:John Smith` (Graph API 필요)              |
| 그룹/채널        | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`        |
| 그룹/채널 (원시) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (`@thread` 포함 시) |

**CLI 예시:**

```bash
# ID로 사용자에게 전송
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 표시 이름으로 사용자에게 전송 (Graph API 조회 트리거)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# 그룹 채팅 또는 채널에 전송
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# 대화에 Adaptive Card 전송
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**에이전트 도구 예시:**

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "user:John Smith",
  "message": "Hello!"
}
```

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "conversation:19:abc...@thread.tacv2",
  "card": {
    "type": "AdaptiveCard",
    "version": "1.5",
    "body": [{ "type": "TextBlock", "text": "Hello" }]
  }
}
```

참고: `user:` 접두사가 없으면 이름은 기본적으로 그룹/팀 확인으로 처리됩니다. 표시 이름으로 사람을 대상으로 지정할 때는 항상 `user:`를 사용하세요.

## 능동적 메시징

- 능동적 메시지는 사용자가 상호 작용한 **후**에만 가능합니다. 그 시점에 대화 참조를 저장하기 때문입니다.
- `dmPolicy` 및 허용목록 게이팅은 `/gateway/configuration`을 참조하세요.

## 팀 및 채널 ID (일반적인 함정)

Teams URL의 `groupId` 쿼리 매개변수는 설정에 사용되는 팀 ID가 **아닙니다**. 대신 URL 경로에서 ID를 추출하세요:

**팀 URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    팀 ID (URL 디코딩)
```

**채널 URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      채널 ID (URL 디코딩)
```

**설정용:**

- 팀 ID = `/team/` 뒤의 경로 세그먼트 (URL 디코딩, 예: `19:Bk4j...@thread.tacv2`)
- 채널 ID = `/channel/` 뒤의 경로 세그먼트 (URL 디코딩)
- `groupId` 쿼리 매개변수 **무시**

## 비공개 채널

봇은 비공개 채널에서 제한적으로 지원됩니다:

| 기능                 | 표준 채널 | 비공개 채널             |
| -------------------- | --------- | ----------------------- |
| 봇 설치              | 예        | 제한적                  |
| 실시간 메시지 (웹훅) | 예        | 작동하지 않을 수 있음   |
| RSC 권한             | 예        | 다르게 동작할 수 있음   |
| @멘션                | 예        | 봇에 액세스 가능한 경우 |
| Graph API 히스토리   | 예        | 예 (권한 필요)          |

**비공개 채널이 작동하지 않는 경우 해결 방법:**

1. 봇 상호 작용에 표준 채널 사용
2. DM 사용 - 사용자는 항상 봇에 직접 메시지 가능
3. 히스토리 액세스에 Graph API 사용 (`ChannelMessage.Read.All` 필요)

## 문제 해결

### 일반적인 문제

- **채널에서 이미지가 표시되지 않음:** Graph 권한 또는 관리자 동의 누락. Teams 앱 재설치 및 Teams 완전 종료/재시작.
- **채널에서 응답 없음:** 멘션은 기본적으로 필요합니다. `channels.msteams.requireMention=false`를 설정하거나 팀/채널별로 설정하세요.
- **버전 불일치 (Teams가 여전히 이전 매니페스트 표시):** 앱 제거 + 다시 추가 및 Teams 완전 종료하여 새로고침.
- **웹훅에서 401 Unauthorized:** Azure JWT 없이 수동으로 테스트할 때 예상됨 - 엔드포인트에 도달할 수 있지만 인증 실패를 의미합니다. Azure 웹 채팅을 사용하여 올바르게 테스트하세요.

### 매니페스트 업로드 오류

- **"아이콘 파일이 비어 있을 수 없습니다":** 매니페스트가 0바이트인 아이콘 파일을 참조합니다. 유효한 PNG 아이콘 생성 (`outline.png`는 32x32, `color.png`는 192x192).
- **"webApplicationInfo.Id가 이미 사용 중입니다":** 앱이 여전히 다른 팀/채팅에 설치되어 있습니다. 먼저 찾아서 제거하거나 전파를 위해 5-10분 대기.
- **업로드 시 "문제가 발생했습니다":** 대신 https://admin.teams.microsoft.com을 통해 업로드하고, 브라우저 개발자 도구 (F12) → 네트워크 탭을 열고 실제 오류에 대한 응답 본문을 확인하세요.
- **사이드로드 실패:** "사용자 지정 앱 업로드" 대신 "조직의 앱 카탈로그에 앱 업로드"를 시도하세요 - 이것이 종종 사이드로드 제한을 우회합니다.

### RSC 권한이 작동하지 않음

1. `webApplicationInfo.id`가 봇의 앱 ID와 정확히 일치하는지 확인
2. 앱 다시 업로드 및 팀/채팅에서 재설치
3. 조직 관리자가 RSC 권한을 차단했는지 확인
4. 올바른 범위를 사용하는지 확인: 팀용 `ChannelMessage.Read.Group`, 그룹 채팅용 `ChatMessage.Read.Chat`

## 참조

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 설정 가이드
- [Teams 개발자 포털](https://dev.teams.microsoft.com/apps) - Teams 앱 생성/관리
- [Teams 앱 매니페스트 스키마](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC로 채널 메시지 수신](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 권한 참조](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams 봇 파일 처리](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (채널/그룹은 Graph 필요)
- [능동적 메시징](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

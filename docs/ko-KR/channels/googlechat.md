---
summary: "Google Chat 앱 지원 상태, 기능 및 설정"
read_when:
  - Google Chat 채널 기능 작업 시
title: "Google Chat"
---

# Google Chat (Chat API)

상태: Google Chat API 웹훅을 통한 DM + 스페이스에 대해 준비됨 (HTTP 전용).

## 빠른 설정 (초보자용)

1. Google Cloud 프로젝트를 생성하고 **Google Chat API**를 활성화하세요.
   - 이동: [Google Chat API 자격 증명](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - 아직 활성화되지 않은 경우 API를 활성화하세요.
2. **서비스 계정**을 생성하세요:
   - **자격 증명 만들기** > **서비스 계정**을 누르세요.
   - 원하는 이름을 지정하세요 (예: `openclaw-chat`).
   - 권한은 비워두세요 (**계속** 누르기).
   - 액세스 권한이 있는 주체는 비워두세요 (**완료** 누르기).
3. **JSON 키**를 생성하고 다운로드하세요:
   - 서비스 계정 목록에서 방금 만든 계정을 클릭하세요.
   - **키** 탭으로 이동하세요.
   - **키 추가** > **새 키 만들기**를 클릭하세요.
   - **JSON**을 선택하고 **만들기**를 누르세요.
4. 다운로드한 JSON 파일을 게이트웨이 호스트에 저장하세요 (예: `~/.openclaw/googlechat-service-account.json`).
5. [Google Cloud Console Chat 설정](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat)에서 Google Chat 앱을 생성하세요:
   - **애플리케이션 정보**를 입력하세요:
     - **앱 이름**: (예: `OpenClaw`)
     - **아바타 URL**: (예: `https://openclaw.ai/logo.png`)
     - **설명**: (예: `Personal AI Assistant`)
   - **대화형 기능**을 활성화하세요.
   - **기능** 아래에서 **스페이스 및 그룹 대화 참여**를 선택하세요.
   - **연결 설정** 아래에서 **HTTP 엔드포인트 URL**을 선택하세요.
   - **트리거** 아래에서 **모든 트리거에 공통 HTTP 엔드포인트 URL 사용**을 선택하고 게이트웨이의 공개 URL 뒤에 `/googlechat`을 붙여 설정하세요.
     - _팁: `openclaw status`를 실행하여 게이트웨이의 공개 URL을 확인하세요._
   - **표시 여부** 아래에서 **&lt;귀하의 도메인&gt;의 특정 사용자 및 그룹이 이 Chat 앱을 사용할 수 있도록 설정**을 선택하세요.
   - 텍스트 상자에 이메일 주소를 입력하세요 (예: `user@example.com`).
   - 하단의 **저장**을 클릭하세요.
6. **앱 상태를 활성화**하세요:
   - 저장 후 **페이지를 새로고침**하세요.
   - **앱 상태** 섹션을 찾으세요 (일반적으로 저장 후 상단 또는 하단 근처).
   - 상태를 **라이브 - 사용자가 사용 가능**으로 변경하세요.
   - **저장**을 다시 클릭하세요.
7. 서비스 계정 경로 + 웹훅 대상으로 OpenClaw을 설정하세요:
   - 환경 변수: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - 또는 설정: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. 웹훅 대상 유형 + 값을 설정하세요 (Chat 앱 설정과 일치).
9. 게이트웨이를 시작하세요. Google Chat이 웹훅 경로로 POST합니다.

## Google Chat에 추가

게이트웨이가 실행 중이고 이메일이 표시 여부 목록에 추가되면:

1. [Google Chat](https://chat.google.com/)으로 이동하세요.
2. **직접 메시지** 옆의 **+** (더하기) 아이콘을 클릭하세요.
3. 검색창 (보통 사람을 추가하는 곳)에 Google Cloud Console에서 설정한 **앱 이름**을 입력하세요.
   - **참고**: 비공개 앱이므로 봇이 "마켓플레이스" 탐색 목록에 _표시되지 않습니다_. 이름으로 검색해야 합니다.
4. 결과에서 봇을 선택하세요.
5. **추가** 또는 **채팅**을 클릭하여 1:1 대화를 시작하세요.
6. "Hello"를 보내 어시스턴트를 트리거하세요!

## 공개 URL (웹훅 전용)

Google Chat 웹훅에는 공개 HTTPS 엔드포인트가 필요합니다. 보안을 위해 **`/googlechat` 경로만** 인터넷에 노출하세요. OpenClaw 대시보드 및 기타 민감한 엔드포인트는 개인 네트워크에 보관하세요.

### 옵션 A: Tailscale Funnel (권장)

개인 대시보드에는 Tailscale Serve를, 공개 웹훅 경로에는 Funnel을 사용하세요. 이렇게 하면 `/`는 비공개로 유지하면서 `/googlechat`만 노출됩니다.

1. **게이트웨이가 바인딩된 주소를 확인하세요:**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP 주소를 기록하세요 (예: `127.0.0.1`, `0.0.0.0` 또는 Tailscale IP `100.x.x.x`).

2. **tailnet 전용으로 대시보드 노출 (포트 8443):**

   ```bash
   # localhost에 바인딩된 경우 (127.0.0.1 또는 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Tailscale IP에만 바인딩된 경우 (예: 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **웹훅 경로만 공개적으로 노출:**

   ```bash
   # localhost에 바인딩된 경우 (127.0.0.1 또는 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Tailscale IP에만 바인딩된 경우 (예: 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Funnel 액세스를 위해 노드를 승인하세요:**
   메시지가 표시되면 출력에 표시된 승인 URL을 방문하여 tailnet 정책에서 이 노드에 대한 Funnel을 활성화하세요.

5. **설정을 확인하세요:**
   ```bash
   tailscale serve status
   tailscale funnel status
   ```

공개 웹훅 URL:
`https://<node-name>.<tailnet>.ts.net/googlechat`

개인 대시보드는 tailnet 전용으로 유지:
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat 앱 설정에서 공개 URL (`:8443` 제외)을 사용하세요.

> 참고: 이 설정은 재부팅 시에도 유지됩니다. 나중에 제거하려면 `tailscale funnel reset` 및 `tailscale serve reset`을 실행하세요.

### 옵션 B: 리버스 프록시 (Caddy)

Caddy와 같은 리버스 프록시를 사용하는 경우 특정 경로만 프록시하세요:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

이 설정으로 `your-domain.com/`에 대한 요청은 무시되거나 404로 반환되고, `your-domain.com/googlechat`은 안전하게 OpenClaw으로 라우팅됩니다.

### 옵션 C: Cloudflare Tunnel

터널의 인그레스 규칙을 웹훅 경로만 라우팅하도록 설정하세요:

- **경로**: `/googlechat` -> `http://localhost:18789/googlechat`
- **기본 규칙**: HTTP 404 (찾을 수 없음)

## 작동 방식

1. Google Chat이 게이트웨이로 웹훅 POST를 전송합니다. 각 요청에는 `Authorization: Bearer <token>` 헤더가 포함됩니다.
2. OpenClaw은 설정된 `audienceType` + `audience`에 대해 토큰을 확인합니다:
   - `audienceType: "app-url"` → audience는 HTTPS 웹훅 URL입니다.
   - `audienceType: "project-number"` → audience는 Cloud 프로젝트 번호입니다.
3. 메시지는 스페이스별로 라우팅됩니다:
   - DM은 세션 키 `agent:<agentId>:googlechat:dm:<spaceId>`를 사용합니다.
   - 스페이스는 세션 키 `agent:<agentId>:googlechat:group:<spaceId>`를 사용합니다.
4. DM 액세스는 기본적으로 페어링입니다. 알 수 없는 발신자는 페어링 코드를 받습니다. 승인 방법:
   - `openclaw pairing approve googlechat <code>`
5. 그룹 스페이스는 기본적으로 @-멘션이 필요합니다. 멘션 감지에 앱의 사용자 이름이 필요한 경우 `botUser`를 사용하세요.

## 대상

전달 및 허용목록에 다음 식별자를 사용하세요:

- 직접 메시지: `users/<userId>` 또는 `users/<email>` (이메일 주소 허용).
- 스페이스: `spaces/<spaceId>`.

## 설정 하이라이트

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // 선택사항; 멘션 감지 도움
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890", "name@example.com"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

참고:

- 서비스 계정 자격 증명은 `serviceAccount`로 인라인으로 전달할 수도 있습니다 (JSON 문자열).
- `webhookPath`가 설정되지 않은 경우 기본 웹훅 경로는 `/googlechat`입니다.
- 반응은 `actions.reactions`가 활성화된 경우 `reactions` 도구 및 `channels action`을 통해 사용할 수 있습니다.
- `typingIndicator`는 `none`, `message` (기본값) 및 `reaction` (반응은 사용자 OAuth 필요)을 지원합니다.
- 첨부 파일은 Chat API를 통해 다운로드되고 미디어 파이프라인에 저장됩니다 (`mediaMaxMb`로 크기 제한).

## 문제 해결

### 405 Method Not Allowed

Google Cloud Logs Explorer에 다음과 같은 오류가 표시되면:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

이는 웹훅 핸들러가 등록되지 않았음을 의미합니다. 일반적인 원인:

1. **채널이 설정되지 않음**: 설정에 `channels.googlechat` 섹션이 누락되었습니다. 확인 방법:

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found"를 반환하면 설정을 추가하세요 ([설정 하이라이트](#설정-하이라이트) 참조).

2. **플러그인이 활성화되지 않음**: 플러그인 상태 확인:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   "disabled"가 표시되면 설정에 `plugins.entries.googlechat.enabled: true`를 추가하세요.

3. **게이트웨이가 재시작되지 않음**: 설정을 추가한 후 게이트웨이를 재시작하세요:
   ```bash
   openclaw gateway restart
   ```

채널이 실행 중인지 확인하세요:

```bash
openclaw channels status
# 다음이 표시되어야 함: Google Chat default: enabled, configured, ...
```

### 기타 문제

- 인증 오류 또는 누락된 대상 설정은 `openclaw channels status --probe`를 확인하세요.
- 메시지가 도착하지 않으면 Chat 앱의 웹훅 URL + 이벤트 구독을 확인하세요.
- 멘션 게이팅이 답장을 차단하면 `botUser`를 앱의 사용자 리소스 이름으로 설정하고 `requireMention`을 확인하세요.
- 테스트 메시지를 보내는 동안 `openclaw logs --follow`를 사용하여 요청이 게이트웨이에 도달하는지 확인하세요.

관련 문서:

- [게이트웨이 설정](/gateway/configuration)
- [보안](/gateway/security)
- [반응](/tools/reactions)

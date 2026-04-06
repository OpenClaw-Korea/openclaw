---
summary: "Feishu 봇 지원 상태, 기능 및 설정"
read_when:
  - Feishu/Lark 봇을 연결하려는 경우
  - Feishu 채널을 설정하는 경우
title: Feishu
---

# Feishu 봇

상태: 프로덕션 준비 완료, 봇 DM 및 그룹 채팅을 지원합니다. WebSocket 롱 커넥션 모드를 사용하여 이벤트를 수신합니다.

---

## 플러그인 필요

Feishu 플러그인을 설치하세요:

```bash
openclaw plugins install @openclaw/feishu
```

로컬 체크아웃 (git 저장소에서 실행 시):

```bash
openclaw plugins install ./extensions/feishu
```

---

## 빠른 시작

Feishu 채널을 추가하는 두 가지 방법:

### 방법 1: 온보딩 마법사 (권장)

OpenClaw을 방금 설치한 경우 마법사를 실행하세요:

```bash
openclaw onboard
```

마법사가 다음을 안내합니다:

1. Feishu 앱 생성 및 자격 증명 수집
2. OpenClaw에서 앱 자격 증명 설정
3. 게이트웨이 시작

✅ **설정 후** 게이트웨이 상태 확인:

- `openclaw gateway status`
- `openclaw logs --follow`

### 방법 2: CLI 설정

초기 설치를 이미 완료한 경우 CLI를 통해 채널 추가:

```bash
openclaw channels add
```

**Feishu**를 선택한 다음 App ID 및 App Secret을 입력하세요.

✅ **설정 후** 게이트웨이 관리:

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## 1단계: Feishu 앱 생성

### 1. Feishu 오픈 플랫폼 열기

[Feishu 오픈 플랫폼](https://open.feishu.cn/app)을 방문하여 로그인하세요.

Lark (글로벌) 테넌트는 https://open.larksuite.com/app을 사용하고 Feishu 설정에서 `domain: "lark"`를 설정해야 합니다.

### 2. 앱 생성

1. **기업 앱 만들기** 클릭
2. 앱 이름 + 설명 입력
3. 앱 아이콘 선택

![기업 앱 만들기](../images/feishu-step2-create-app.png)

### 3. 자격 증명 복사

**자격 증명 및 기본 정보**에서 복사:

- **App ID** (형식: `cli_xxx`)
- **App Secret**

❗ **중요:** App Secret을 비공개로 유지하세요.

![자격 증명 가져오기](../images/feishu-step3-credentials.png)

### 4. 권한 설정

**권한**에서 **일괄 가져오기**를 클릭하고 붙여넣기:

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

![권한 설정](../images/feishu-step4-permissions.png)

### 5. 봇 기능 활성화

**앱 기능** > **봇**에서:

1. 봇 기능 활성화
2. 봇 이름 설정

![봇 기능 활성화](../images/feishu-step5-bot-capability.png)

### 6. 이벤트 구독 설정

⚠️ **중요:** 이벤트 구독을 설정하기 전에 다음을 확인하세요:

1. Feishu용 `openclaw channels add`를 이미 실행했습니다
2. 게이트웨이가 실행 중입니다 (`openclaw gateway status`)

**이벤트 구독**에서:

1. **롱 커넥션을 사용하여 이벤트 수신** 선택 (WebSocket)
2. 이벤트 추가: `im.message.receive_v1`

⚠️ 게이트웨이가 실행 중이 아니면 롱 커넥션 설정 저장이 실패할 수 있습니다.

![이벤트 구독 설정](../images/feishu-step6-event-subscription.png)

### 7. 앱 게시

1. **버전 관리 및 릴리스**에서 버전 생성
2. 검토 제출 및 게시
3. 관리자 승인 대기 (기업 앱은 일반적으로 자동 승인됨)

---

## 2단계: OpenClaw 설정

### 마법사로 설정 (권장)

```bash
openclaw channels add
```

**Feishu**를 선택하고 App ID + App Secret을 붙여넣으세요.

### 설정 파일을 통해 설정

`~/.openclaw/openclaw.json` 편집:

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "My AI assistant",
        },
      },
    },
  },
}
```

### 환경 변수를 통해 설정

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Lark (글로벌) 도메인

테넌트가 Lark (국제)인 경우 도메인을 `lark` (또는 전체 도메인 문자열)로 설정하세요. `channels.feishu.domain` 또는 계정별 (`channels.feishu.accounts.<id>.domain`)로 설정할 수 있습니다.

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

---

## 3단계: 시작 + 테스트

### 1. 게이트웨이 시작

```bash
openclaw gateway
```

### 2. 테스트 메시지 전송

Feishu에서 봇을 찾아 메시지를 보내세요.

### 3. 페어링 승인

기본적으로 봇은 페어링 코드로 답장합니다. 승인:

```bash
openclaw pairing approve feishu <CODE>
```

승인 후 정상적으로 채팅할 수 있습니다.

---

## 개요

- **Feishu 봇 채널**: 게이트웨이가 관리하는 Feishu 봇
- **결정론적 라우팅**: 답장은 항상 Feishu로 돌아갑니다
- **세션 격리**: DM은 메인 세션 공유; 그룹은 격리됨
- **WebSocket 연결**: Feishu SDK를 통한 롱 커넥션, 공개 URL 불필요

---

## 접근 제어

### 직접 메시지

- **기본값**: `dmPolicy: "pairing"` (알 수 없는 사용자는 페어링 코드를 받음)
- **페어링 승인**:
  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```
- **허용목록 모드**: 허용된 Open ID로 `channels.feishu.allowFrom` 설정

### 그룹 채팅

**1. 그룹 정책** (`channels.feishu.groupPolicy`):

- `"open"` = 그룹에서 모든 사람 허용 (기본값)
- `"allowlist"` = `groupAllowFrom`만 허용
- `"disabled"` = 그룹 메시지 비활성화

**2. 멘션 요구 사항** (`channels.feishu.groups.<chat_id>.requireMention`):

- `true` = @멘션 필요 (기본값)
- `false` = 멘션 없이 응답

---

## 그룹 설정 예시

### 모든 그룹 허용, @멘션 필요 (기본값)

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      // 기본 requireMention: true
    },
  },
}
```

### 모든 그룹 허용, @멘션 불필요

```json5
{
  channels: {
    feishu: {
      groups: {
        oc_xxx: { requireMention: false },
      },
    },
  },
}
```

### 그룹에서 특정 사용자만 허용

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["ou_xxx", "ou_yyy"],
    },
  },
}
```

---

## 그룹/사용자 ID 가져오기

### 그룹 ID (chat_id)

그룹 ID는 `oc_xxx`와 같습니다.

**방법 1 (권장)**

1. 게이트웨이를 시작하고 그룹에서 봇을 @멘션하세요
2. `openclaw logs --follow`를 실행하고 `chat_id`를 찾으세요

**방법 2**

Feishu API 디버거를 사용하여 그룹 채팅 목록 조회.

### 사용자 ID (open_id)

사용자 ID는 `ou_xxx`와 같습니다.

**방법 1 (권장)**

1. 게이트웨이를 시작하고 봇에게 DM을 보내세요
2. `openclaw logs --follow`를 실행하고 `open_id`를 찾으세요

**방법 2**

사용자 Open ID에 대한 페어링 요청 확인:

```bash
openclaw pairing list feishu
```

---

## 일반 명령

| 명령      | 설명           |
| --------- | -------------- |
| `/status` | 봇 상태 표시   |
| `/reset`  | 세션 재설정    |
| `/model`  | 모델 표시/전환 |

> 참고: Feishu는 아직 네이티브 명령 메뉴를 지원하지 않으므로 명령은 텍스트로 전송해야 합니다.

## 게이트웨이 관리 명령

| 명령                       | 설명                        |
| -------------------------- | --------------------------- |
| `openclaw gateway status`  | 게이트웨이 상태 표시        |
| `openclaw gateway install` | 게이트웨이 서비스 설치/시작 |
| `openclaw gateway stop`    | 게이트웨이 서비스 중지      |
| `openclaw gateway restart` | 게이트웨이 서비스 재시작    |
| `openclaw logs --follow`   | 게이트웨이 로그 추적        |

---

## 문제 해결

### 봇이 그룹 채팅에서 응답하지 않음

1. 봇이 그룹에 추가되었는지 확인
2. 봇을 @멘션했는지 확인 (기본 동작)
3. `groupPolicy`가 `"disabled"`로 설정되지 않았는지 확인
4. 로그 확인: `openclaw logs --follow`

### 봇이 메시지를 수신하지 않음

1. 앱이 게시되고 승인되었는지 확인
2. 이벤트 구독에 `im.message.receive_v1`이 포함되어 있는지 확인
3. **롱 커넥션**이 활성화되어 있는지 확인
4. 앱 권한이 완전한지 확인
5. 게이트웨이가 실행 중인지 확인: `openclaw gateway status`
6. 로그 확인: `openclaw logs --follow`

### App Secret 유출

1. Feishu 오픈 플랫폼에서 App Secret 재설정
2. 설정에서 App Secret 업데이트
3. 게이트웨이 재시작

### 메시지 전송 실패

1. 앱에 `im:message:send_as_bot` 권한이 있는지 확인
2. 앱이 게시되었는지 확인
3. 자세한 오류는 로그 확인

---

## 고급 설정

### 다중 계정

```json5
{
  channels: {
    feishu: {
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "Primary bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          botName: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

### 메시지 제한

- `textChunkLimit`: 아웃바운드 텍스트 청크 크기 (기본값: 2000자)
- `mediaMaxMb`: 미디어 업로드/다운로드 한도 (기본값: 30MB)

### 스트리밍

Feishu는 메시지 편집을 지원하지 않으므로 블록 스트리밍이 기본적으로 활성화됩니다 (`blockStreaming: true`). 봇은 전체 답장을 기다린 후 전송합니다.

---

## 설정 참조

전체 설정: [게이트웨이 설정](/gateway/configuration)

주요 옵션:

| 설정                                              | 설명                              | 기본값    |
| ------------------------------------------------- | --------------------------------- | --------- |
| `channels.feishu.enabled`                         | 채널 활성화/비활성화              | `true`    |
| `channels.feishu.domain`                          | API 도메인 (`feishu` 또는 `lark`) | `feishu`  |
| `channels.feishu.accounts.<id>.appId`             | App ID                            | -         |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                        | -         |
| `channels.feishu.accounts.<id>.domain`            | 계정별 API 도메인 재정의          | `feishu`  |
| `channels.feishu.dmPolicy`                        | DM 정책                           | `pairing` |
| `channels.feishu.allowFrom`                       | DM 허용목록 (open_id 목록)        | -         |
| `channels.feishu.groupPolicy`                     | 그룹 정책                         | `open`    |
| `channels.feishu.groupAllowFrom`                  | 그룹 허용목록                     | -         |
| `channels.feishu.groups.<chat_id>.requireMention` | @멘션 필요                        | `true`    |
| `channels.feishu.groups.<chat_id>.enabled`        | 그룹 활성화                       | `true`    |
| `channels.feishu.textChunkLimit`                  | 메시지 청크 크기                  | `2000`    |
| `channels.feishu.mediaMaxMb`                      | 미디어 크기 한도                  | `30`      |
| `channels.feishu.blockStreaming`                  | 스트리밍 비활성화                 | `true`    |

---

## dmPolicy 참조

| 값            | 동작                                                          |
| ------------- | ------------------------------------------------------------- |
| `"pairing"`   | **기본값.** 알 수 없는 사용자는 페어링 코드를 받음; 승인 필요 |
| `"allowlist"` | `allowFrom`의 사용자만 채팅 가능                              |
| `"open"`      | 모든 사용자 허용 (allowFrom에 `"*"` 필요)                     |
| `"disabled"`  | DM 비활성화                                                   |

---

## 지원되는 메시지 유형

### 수신

- ✅ 텍스트
- ✅ 이미지
- ✅ 파일
- ✅ 오디오
- ✅ 비디오
- ✅ 스티커

### 전송

- ✅ 텍스트
- ✅ 이미지
- ✅ 파일
- ✅ 오디오
- ⚠️ 리치 텍스트 (부분 지원)

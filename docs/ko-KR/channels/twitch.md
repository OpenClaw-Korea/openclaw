---
summary: "Twitch 채팅 봇 구성 및 설정"
read_when:
  - OpenClaw를 위한 Twitch 채팅 통합 설정 시
title: "Twitch"
---

# Twitch (플러그인)

IRC 연결을 통한 Twitch 채팅 지원. OpenClaw는 Twitch 사용자(봇 계정)로 연결하여 채널에서 메시지를 수신하고 전송합니다.

## 플러그인 필요

Twitch는 플러그인으로 제공되며 코어 설치에 포함되지 않습니다.

CLI를 통한 설치 (npm 레지스트리):

```bash
openclaw plugins install @openclaw/twitch
```

로컬 체크아웃 (git 저장소에서 실행 시):

```bash
openclaw plugins install ./extensions/twitch
```

세부 정보: [플러그인](/plugin)

## 빠른 설정 (초보자용)

1. 봇을 위한 전용 Twitch 계정을 생성하세요 (또는 기존 계정 사용).
2. 자격 증명 생성: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - **Bot Token** 선택
   - `chat:read` 및 `chat:write` 스코프가 선택되었는지 확인
   - **Client ID** 및 **Access Token** 복사
3. Twitch 사용자 ID 찾기: https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
4. 토큰 구성:
   - 환경 변수: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (기본 계정 전용)
   - 또는 설정: `channels.twitch.accessToken`
   - 둘 다 설정된 경우 설정이 우선합니다 (환경 변수 대체는 기본 계정 전용).
5. 게이트웨이를 시작하세요.

**⚠️ 중요:** 무단 사용자가 봇을 트리거하는 것을 방지하기 위해 접근 제어(`allowFrom` 또는 `allowedRoles`)를 추가하세요. `requireMention`은 기본적으로 `true`입니다.

최소 설정:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // 봇의 Twitch 계정
      accessToken: "oauth:abc123...", // OAuth Access Token (또는 OPENCLAW_TWITCH_ACCESS_TOKEN 환경 변수 사용)
      clientId: "xyz789...", // Token Generator의 Client ID
      channel: "vevisk", // 참여할 Twitch 채널의 채팅 (필수)
      allowFrom: ["123456789"], // (권장) 본인의 Twitch 사용자 ID만 - https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/에서 확인
    },
  },
}
```

## 정의

- 게이트웨이가 소유하는 Twitch 채널.
- 결정론적 라우팅: 답장은 항상 Twitch로 돌아갑니다.
- 각 계정은 격리된 세션 키 `agent:<agentId>:twitch:<accountName>`에 매핑됩니다.
- `username`은 봇의 계정(인증하는 사용자)이고, `channel`은 참여할 채팅방입니다.

## 설정 (상세)

### 자격 증명 생성

[Twitch Token Generator](https://twitchtokengenerator.com/) 사용:

- **Bot Token** 선택
- `chat:read` 및 `chat:write` 스코프가 선택되었는지 확인
- **Client ID** 및 **Access Token** 복사

수동 앱 등록이 필요하지 않습니다. 토큰은 몇 시간 후 만료됩니다.

### 봇 구성

**환경 변수 (기본 계정 전용):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**또는 설정:**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

환경 변수와 설정이 모두 설정된 경우 설정이 우선합니다.

### 접근 제어 (권장)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (권장) 본인의 Twitch 사용자 ID만
    },
  },
}
```

엄격한 허용목록을 위해 `allowFrom`을 선호하세요. 역할 기반 접근을 원하는 경우 대신 `allowedRoles`를 사용하세요.

**사용 가능한 역할:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**사용자 ID를 사용하는 이유?** 사용자 이름은 변경될 수 있어 사칭이 가능합니다. 사용자 ID는 영구적입니다.

Twitch 사용자 ID 찾기: https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/ (Twitch 사용자 이름을 ID로 변환)

## 토큰 갱신 (선택사항)

[Twitch Token Generator](https://twitchtokengenerator.com/)의 토큰은 자동으로 갱신할 수 없습니다 - 만료 시 재생성하세요.

자동 토큰 갱신을 위해서는 [Twitch Developer Console](https://dev.twitch.tv/console)에서 자체 Twitch 애플리케이션을 생성하고 설정에 추가하세요:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

봇은 만료 전에 자동으로 토큰을 갱신하고 갱신 이벤트를 기록합니다.

## 다중 계정 지원

계정별 토큰과 함께 `channels.twitch.accounts`를 사용하세요. 공유 패턴은 [`gateway/configuration`](/gateway/configuration)을 참조하세요.

예시 (두 채널에서 하나의 봇 계정):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**참고:** 각 계정은 자체 토큰이 필요합니다 (채널당 하나의 토큰).

## 접근 제어

### 역할 기반 제한

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### 사용자 ID로 허용목록 (가장 안전)

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### 역할 기반 접근 (대체)

`allowFrom`은 엄격한 허용목록입니다. 설정 시 해당 사용자 ID만 허용됩니다.
역할 기반 접근을 원하는 경우 `allowFrom`을 설정하지 않고 대신 `allowedRoles`를 구성하세요:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### @멘션 요구사항 비활성화

기본적으로 `requireMention`은 `true`입니다. 비활성화하고 모든 메시지에 응답하려면:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## 문제 해결

먼저 진단 명령을 실행하세요:

```bash
openclaw doctor
openclaw channels status --probe
```

### 봇이 메시지에 응답하지 않음

**접근 제어 확인:** 사용자 ID가 `allowFrom`에 있는지 확인하거나, 임시로
`allowFrom`을 제거하고 `allowedRoles: ["all"]`을 설정하여 테스트하세요.

**봇이 채널에 있는지 확인:** 봇은 `channel`에 지정된 채널에 참여해야 합니다.

### 토큰 문제

**"연결 실패" 또는 인증 오류:**

- `accessToken`이 OAuth access token 값인지 확인하세요 (일반적으로 `oauth:` 접두사로 시작)
- 토큰이 `chat:read` 및 `chat:write` 스코프를 가지고 있는지 확인
- 토큰 갱신을 사용하는 경우 `clientSecret` 및 `refreshToken`이 설정되었는지 확인

### 토큰 갱신이 작동하지 않음

**로그에서 갱신 이벤트 확인:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

"token refresh disabled (no refresh token)"이 표시되면:

- `clientSecret`이 제공되었는지 확인
- `refreshToken`이 제공되었는지 확인

## 설정

**계정 설정:**

- `username` - 봇 사용자 이름
- `accessToken` - `chat:read` 및 `chat:write`가 있는 OAuth access token
- `clientId` - Twitch Client ID (Token Generator 또는 앱에서)
- `channel` - 참여할 채널 (필수)
- `enabled` - 이 계정 활성화 (기본값: `true`)
- `clientSecret` - 선택사항: 자동 토큰 갱신용
- `refreshToken` - 선택사항: 자동 토큰 갱신용
- `expiresIn` - 토큰 만료 시간(초)
- `obtainmentTimestamp` - 토큰 획득 타임스탬프
- `allowFrom` - 사용자 ID 허용목록
- `allowedRoles` - 역할 기반 접근 제어 (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - @멘션 요구 (기본값: `true`)

**프로바이더 옵션:**

- `channels.twitch.enabled` - 채널 시작 활성화/비활성화
- `channels.twitch.username` - 봇 사용자 이름 (단순화된 단일 계정 설정)
- `channels.twitch.accessToken` - OAuth access token (단순화된 단일 계정 설정)
- `channels.twitch.clientId` - Twitch Client ID (단순화된 단일 계정 설정)
- `channels.twitch.channel` - 참여할 채널 (단순화된 단일 계정 설정)
- `channels.twitch.accounts.<accountName>` - 다중 계정 설정 (위의 모든 계정 필드)

전체 예시:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## 도구 액션

에이전트는 다음 액션과 함께 `twitch`를 호출할 수 있습니다:

- `send` - 채널에 메시지 전송

예시:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## 보안 및 운영

- **토큰을 비밀번호처럼 취급** - 토큰을 git에 커밋하지 마세요
- **자동 토큰 갱신 사용** - 장기 실행 봇의 경우
- **사용자 ID 허용목록 사용** - 접근 제어를 위해 사용자 이름 대신
- **로그 모니터링** - 토큰 갱신 이벤트 및 연결 상태
- **최소 스코프 토큰** - `chat:read` 및 `chat:write`만 요청
- **막힌 경우**: 다른 프로세스가 세션을 소유하지 않는지 확인한 후 게이트웨이를 재시작

## 제한

- 메시지당 **500자** (단어 경계에서 자동 청크됨)
- 청킹 전에 마크다운이 제거됨
- 속도 제한 없음 (Twitch의 내장 속도 제한 사용)

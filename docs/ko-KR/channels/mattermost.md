---
summary: "Mattermost 봇 설정 및 OpenClaw 설정"
read_when:
  - Mattermost 설정 시
  - Mattermost 라우팅 디버깅 시
title: "Mattermost"
---

# Mattermost (플러그인)

상태: 플러그인을 통해 지원됨 (봇 토큰 + WebSocket 이벤트). 채널, 그룹 및 DM이 지원됩니다.
Mattermost는 자체 호스팅 가능한 팀 메시징 플랫폼입니다. 제품 세부 정보 및 다운로드는 공식 사이트
[mattermost.com](https://mattermost.com)을 참조하세요.

## 플러그인 필요

Mattermost는 플러그인으로 제공되며 코어 설치에 포함되지 않습니다.

CLI를 통해 설치 (npm 레지스트리):

```bash
openclaw plugins install @openclaw/mattermost
```

로컬 체크아웃 (git 저장소에서 실행 시):

```bash
openclaw plugins install ./extensions/mattermost
```

설정/온보딩 중 Mattermost를 선택하고 git 체크아웃이 감지되면,
OpenClaw이 자동으로 로컬 설치 경로를 제공합니다.

세부 정보: [플러그인](/plugin)

## 빠른 설정

1. Mattermost 플러그인을 설치하세요.
2. Mattermost 봇 계정을 생성하고 **봇 토큰**을 복사하세요.
3. Mattermost **베이스 URL**을 복사하세요 (예: `https://chat.example.com`).
4. OpenClaw을 설정하고 게이트웨이를 시작하세요.

최소 설정:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## 환경 변수 (기본 계정)

환경 변수를 선호하는 경우 게이트웨이 호스트에 설정하세요:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

환경 변수는 **기본** 계정 (`default`)에만 적용됩니다. 다른 계정은 설정 값을 사용해야 합니다.

## 채팅 모드

Mattermost는 DM에 자동으로 응답합니다. 채널 동작은 `chatmode`로 제어됩니다:

- `oncall` (기본값): 채널에서 @멘션될 때만 응답.
- `onmessage`: 모든 채널 메시지에 응답.
- `onchar`: 메시지가 트리거 접두사로 시작할 때 응답.

설정 예시:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

참고:

- `onchar`는 여전히 명시적 @멘션에 응답합니다.
- `channels.mattermost.requireMention`은 레거시 설정에 대해 존중되지만 `chatmode`가 선호됩니다.

## 접근 제어 (DM)

- 기본값: `channels.mattermost.dmPolicy = "pairing"` (알 수 없는 발신자는 페어링 코드를 받음).
- 승인 방법:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 공개 DM: `channels.mattermost.dmPolicy="open"` 및 `channels.mattermost.allowFrom=["*"]`.

## 채널 (그룹)

- 기본값: `channels.mattermost.groupPolicy = "allowlist"` (멘션 게이팅).
- `channels.mattermost.groupAllowFrom`으로 발신자 허용목록 (사용자 ID 또는 `@username`).
- 공개 채널: `channels.mattermost.groupPolicy="open"` (멘션 게이팅).

## 아웃바운드 전달 대상

`openclaw message send` 또는 cron/웹훅과 함께 다음 대상 형식을 사용하세요:

- `channel:<id>` 채널용
- `user:<id>` DM용
- `@username` DM용 (Mattermost API를 통해 확인됨)

단순 ID는 채널로 처리됩니다.

## 다중 계정

Mattermost는 `channels.mattermost.accounts` 아래에서 여러 계정을 지원합니다:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## 문제 해결

- 채널에서 답장 없음: 봇이 채널에 있고 멘션되었는지 확인 (oncall), 트리거 접두사 사용 (onchar), 또는 `chatmode: "onmessage"` 설정.
- 인증 오류: 봇 토큰, 베이스 URL 및 계정이 활성화되었는지 확인.
- 다중 계정 문제: 환경 변수는 `default` 계정에만 적용됩니다.

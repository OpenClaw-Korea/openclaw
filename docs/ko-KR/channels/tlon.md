---
summary: "Tlon/Urbit 지원 상태, 기능 및 설정"
read_when:
  - Tlon/Urbit 채널 기능 작업 시
title: "Tlon"
---

# Tlon (플러그인)

Tlon은 Urbit을 기반으로 구축된 탈중앙화 메신저입니다. OpenClaw은 Urbit ship에 연결하여
DM과 그룹 채팅 메시지에 응답할 수 있습니다. 그룹 답장은 기본적으로 @ 멘션이 필요하며
허용목록을 통해 추가로 제한할 수 있습니다.

상태: 플러그인을 통해 지원됩니다. DM, 그룹 멘션, 스레드 답장, 텍스트 전용 미디어 폴백
(캡션에 URL 추가)이 지원됩니다. 반응, 투표, 네이티브 미디어 업로드는 지원되지 않습니다.

## 플러그인 필요

Tlon은 플러그인으로 제공되며 코어 설치에 번들로 포함되지 않습니다.

CLI를 통해 설치 (npm 레지스트리):

```bash
openclaw plugins install @openclaw/tlon
```

로컬 체크아웃 (git 저장소에서 실행 시):

```bash
openclaw plugins install ./extensions/tlon
```

자세한 내용: [플러그인](/plugin)

## 설정

1. Tlon 플러그인을 설치하세요.
2. ship URL과 로그인 코드를 수집하세요.
3. `channels.tlon`을 설정하세요.
4. 게이트웨이를 재시작하세요.
5. 봇에게 DM을 보내거나 그룹 채널에서 멘션하세요.

최소 설정 (단일 계정):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
    },
  },
}
```

## 그룹 채널

자동 디스커버리가 기본적으로 활성화되어 있습니다. 채널을 수동으로 고정할 수도 있습니다:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

자동 디스커버리 비활성화:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## 접근 제어

DM 허용목록 (비어 있음 = 모두 허용):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

그룹 권한 (기본적으로 제한됨):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## 전달 대상 (CLI/cron)

`openclaw message send` 또는 cron 전달과 함께 사용하세요:

- DM: `~sampel-palnet` 또는 `dm/~sampel-palnet`
- 그룹: `chat/~host-ship/channel` 또는 `group:~host-ship/channel`

## 참고사항

- 그룹 답장은 멘션 (예: `~your-bot-ship`)이 필요합니다.
- 스레드 답장: 인바운드 메시지가 스레드에 있으면 OpenClaw은 스레드 내에서 답장합니다.
- 미디어: `sendMedia`는 텍스트 + URL로 폴백합니다 (네이티브 업로드 없음).

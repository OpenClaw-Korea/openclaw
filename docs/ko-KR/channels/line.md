---
summary: "LINE Messaging API 플러그인 설정, 설정 및 사용"
read_when:
  - OpenClaw을 LINE에 연결하려는 경우
  - LINE 웹훅 + 자격 증명 설정이 필요한 경우
  - LINE 전용 메시지 옵션이 필요한 경우
title: LINE
---

# LINE (플러그인)

LINE은 LINE Messaging API를 통해 OpenClaw에 연결됩니다. 플러그인은 게이트웨이에서 웹훅
수신기로 실행되며 인증을 위해 채널 액세스 토큰 + 채널 시크릿을 사용합니다.

상태: 플러그인을 통해 지원됨. 직접 메시지, 그룹 채팅, 미디어, 위치, Flex
메시지, 템플릿 메시지 및 빠른 답장이 지원됩니다. 반응 및 스레드는
지원되지 않습니다.

## 플러그인 필요

LINE 플러그인을 설치하세요:

```bash
openclaw plugins install @openclaw/line
```

로컬 체크아웃 (git 저장소에서 실행 시):

```bash
openclaw plugins install ./extensions/line
```

## 설정

1. LINE Developers 계정을 생성하고 콘솔을 여세요:
   https://developers.line.biz/console/
2. 프로바이더를 생성 (또는 선택)하고 **Messaging API** 채널을 추가하세요.
3. 채널 설정에서 **채널 액세스 토큰** 및 **채널 시크릿**을 복사하세요.
4. Messaging API 설정에서 **웹훅 사용**을 활성화하세요.
5. 웹훅 URL을 게이트웨이 엔드포인트로 설정하세요 (HTTPS 필요):

```
https://gateway-host/line/webhook
```

게이트웨이는 LINE의 웹훅 확인 (GET) 및 인바운드 이벤트 (POST)에 응답합니다.
커스텀 경로가 필요한 경우 `channels.line.webhookPath` 또는
`channels.line.accounts.<id>.webhookPath`를 설정하고 URL을 업데이트하세요.

## 설정

최소 설정:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

환경 변수 (기본 계정만):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

토큰/시크릿 파일:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

다중 계정:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## 접근 제어

직접 메시지는 기본적으로 페어링입니다. 알 수 없는 발신자는 페어링 코드를 받으며
승인될 때까지 메시지가 무시됩니다.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

허용목록 및 정책:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM용 허용목록 LINE 사용자 ID
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: 그룹용 허용목록 LINE 사용자 ID
- 그룹별 재정의: `channels.line.groups.<groupId>.allowFrom`

LINE ID는 대소문자를 구분합니다. 유효한 ID는 다음과 같습니다:

- 사용자: `U` + 32자 16진수
- 그룹: `C` + 32자 16진수
- 룸: `R` + 32자 16진수

## 메시지 동작

- 텍스트는 5000자에서 청킹됩니다.
- 마크다운 포맷팅은 제거됩니다. 코드 블록과 테이블은 가능한 경우 Flex
  카드로 변환됩니다.
- 스트리밍 응답은 버퍼링됩니다. LINE은 에이전트가 작업하는 동안 로딩
  애니메이션과 함께 전체 청크를 받습니다.
- 미디어 다운로드는 `channels.line.mediaMaxMb`로 제한됩니다 (기본값 10).

## 채널 데이터 (리치 메시지)

`channelData.line`을 사용하여 빠른 답장, 위치, Flex 카드 또는 템플릿
메시지를 전송하세요.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex 페이로드 */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE 플러그인은 Flex 메시지 프리셋을 위한 `/card` 명령도 제공합니다:

```
/card info "Welcome" "Thanks for joining!"
```

## 문제 해결

- **웹훅 확인 실패:** 웹훅 URL이 HTTPS인지 확인하고
  `channelSecret`이 LINE 콘솔과 일치하는지 확인하세요.
- **인바운드 이벤트 없음:** 웹훅 경로가 `channels.line.webhookPath`와 일치하는지
  확인하고 게이트웨이가 LINE에서 접근 가능한지 확인하세요.
- **미디어 다운로드 오류:** 미디어가 기본 한도를 초과하는 경우
  `channels.line.mediaMaxMb`를 높이세요.

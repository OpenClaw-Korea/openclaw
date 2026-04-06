---
summary: "signal-cli (JSON-RPC + SSE), 설정 및 번호 모델을 통한 Signal 지원"
read_when:
  - Signal 지원 설정 시
  - Signal 송수신 디버깅 시
title: "Signal"
---

# Signal (signal-cli)

상태: 외부 CLI 통합. 게이트웨이는 HTTP JSON-RPC + SSE를 통해 `signal-cli`와 통신합니다.

## 빠른 설정 (초보자용)

1. 봇에 **별도의 Signal 번호**를 사용하세요 (권장).
2. `signal-cli`를 설치하세요 (Java 필요).
3. 봇 기기를 연결하고 데몬을 시작하세요:
   - `signal-cli link -n "OpenClaw"`
4. OpenClaw을 구성하고 게이트웨이를 시작하세요.

최소 설정:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

## 정의

- `signal-cli`를 통한 Signal 채널 (임베디드 libsignal 아님).
- 결정론적 라우팅: 답장은 항상 Signal로 돌아갑니다.
- DM은 에이전트의 메인 세션을 공유하고, 그룹은 격리됩니다 (`agent:<agentId>:signal:group:<groupId>`).

## 설정 쓰기

기본적으로 Signal은 `/config set|unset`으로 트리거된 설정 업데이트 쓰기가 허용됩니다 (`commands.config: true` 필요).

비활성화하려면:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 번호 모델 (중요)

- 게이트웨이는 **Signal 기기** (`signal-cli` 계정)에 연결됩니다.
- **개인 Signal 계정**에서 봇을 실행하는 경우 자신의 메시지를 무시합니다 (루프 방지).
- "봇에게 텍스트를 보내고 답장을 받으려면" **별도의 봇 번호**를 사용하세요.

## 설정 (빠른 경로)

1. `signal-cli`를 설치하세요 (Java 필요).
2. 봇 계정을 연결하세요:
   - `signal-cli link -n "OpenClaw"`를 실행한 다음 Signal에서 QR을 스캔하세요.
3. Signal을 구성하고 게이트웨이를 시작하세요.

예시:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

다중 계정 지원: `channels.signal.accounts`를 계정별 설정 및 선택사항 `name`과 함께 사용하세요. 공유 패턴은 [`gateway/configuration`](/ko-KR/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts)을 참조하세요.

## 외부 데몬 모드 (httpUrl)

`signal-cli`를 직접 관리하려는 경우 (느린 JVM 콜드 스타트, 컨테이너 초기화 또는 공유 CPU), 데몬을 별도로 실행하고 OpenClaw이 가리키도록 하세요:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

이것은 OpenClaw 내부의 자동 생성 및 시작 대기를 건너뜁니다. 자동 생성 시 느린 시작의 경우 `channels.signal.startupTimeoutMs`를 설정하세요.

## 접근 제어 (DM + 그룹)

DM:

- 기본값: `channels.signal.dmPolicy = "pairing"`.
- 알 수 없는 발신자는 페어링 코드를 받으며, 승인될 때까지 메시지는 무시됩니다 (코드는 1시간 후 만료).
- 승인 방법:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- 페어링은 Signal DM의 기본 토큰 교환입니다. 세부 정보: [페어링](/ko-KR/start/pairing)
- UUID 전용 발신자 (`sourceUuid`에서)는 `channels.signal.allowFrom`에 `uuid:<id>`로 저장됩니다.

그룹:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom`은 `allowlist`가 설정된 경우 그룹에서 트리거할 수 있는 사람을 제어합니다.

## 작동 방식 (동작)

- `signal-cli`는 데몬으로 실행됩니다. 게이트웨이는 SSE를 통해 이벤트를 읽습니다.
- 인바운드 메시지는 공유 채널 봉투로 정규화됩니다.
- 답장은 항상 같은 번호 또는 그룹으로 라우팅됩니다.

## 미디어 + 제한

- 아웃바운드 텍스트는 `channels.signal.textChunkLimit`로 청크됩니다 (기본값 4000).
- 선택적 줄바꿈 청킹: `channels.signal.chunkMode="newline"`을 설정하여 길이 청킹 전에 빈 줄 (단락 경계)에서 분할합니다.
- 첨부 파일 지원 (`signal-cli`에서 base64로 가져옴).
- 기본 미디어 한도: `channels.signal.mediaMaxMb` (기본값 8).
- `channels.signal.ignoreAttachments`를 사용하여 미디어 다운로드를 건너뜁니다.
- 그룹 히스토리 컨텍스트는 `channels.signal.historyLimit` (또는 `channels.signal.accounts.*.historyLimit`)를 사용하며, `messages.groupChat.historyLimit`로 대체됩니다. 비활성화하려면 `0`으로 설정하세요 (기본값 50).

## 타이핑 + 읽음 확인

- **타이핑 표시기**: OpenClaw은 `signal-cli sendTyping`을 통해 타이핑 신호를 보내고 답장이 실행되는 동안 새로 고칩니다.
- **읽음 확인**: `channels.signal.sendReadReceipts`가 true인 경우 OpenClaw은 허용된 DM에 대한 읽음 확인을 전달합니다.
- Signal-cli는 그룹에 대한 읽음 확인을 노출하지 않습니다.

## 반응 (메시지 도구)

- `channel=signal`과 함께 `message action=react`를 사용하세요.
- 대상: 발신자 E.164 또는 UUID (페어링 출력에서 `uuid:<id>` 사용; 순수 UUID도 작동).
- `messageId`는 반응하는 메시지의 Signal 타임스탬프입니다.
- 그룹 반응에는 `targetAuthor` 또는 `targetAuthorUuid`가 필요합니다.

예시:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

설정:

- `channels.signal.actions.reactions`: 반응 액션 활성화/비활성화 (기본값 true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack`는 에이전트 반응을 비활성화합니다 (메시지 도구 `react`가 오류).
  - `minimal`/`extensive`는 에이전트 반응을 활성화하고 가이드 수준을 설정합니다.
- 계정별 재정의: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## 전달 대상 (CLI/cron)

- DM: `signal:+15551234567` (또는 순수 E.164).
- UUID DM: `uuid:<id>` (또는 순수 UUID).
- 그룹: `signal:group:<groupId>`.
- 사용자 이름: `username:<name>` (Signal 계정이 지원하는 경우).

## 설정 참조 (Signal)

전체 설정: [설정](/ko-KR/gateway/configuration)

프로바이더 옵션:

- `channels.signal.enabled`: 채널 시작 활성화/비활성화.
- `channels.signal.account`: 봇 계정의 E.164.
- `channels.signal.cliPath`: `signal-cli` 경로.
- `channels.signal.httpUrl`: 전체 데몬 URL (호스트/포트 재정의).
- `channels.signal.httpHost`, `channels.signal.httpPort`: 데몬 바인드 (기본값 127.0.0.1:8080).
- `channels.signal.autoStart`: 데몬 자동 생성 (`httpUrl`이 설정되지 않은 경우 기본값 true).
- `channels.signal.startupTimeoutMs`: 시작 대기 시간 제한 (ms) (최대 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: 첨부 파일 다운로드 건너뛰기.
- `channels.signal.ignoreStories`: 데몬의 스토리 무시.
- `channels.signal.sendReadReceipts`: 읽음 확인 전달.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (기본값: pairing).
- `channels.signal.allowFrom`: DM 허용목록 (E.164 또는 `uuid:<id>`). `open`은 `"*"`가 필요합니다. Signal에는 사용자 이름이 없습니다. 전화/UUID id를 사용하세요.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (기본값: allowlist).
- `channels.signal.groupAllowFrom`: 그룹 발신자 허용목록.
- `channels.signal.historyLimit`: 컨텍스트로 포함할 최대 그룹 메시지 (0은 비활성화).
- `channels.signal.dmHistoryLimit`: 사용자 턴의 DM 히스토리 제한. 사용자별 재정의: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: 아웃바운드 청크 크기 (문자).
- `channels.signal.chunkMode`: `length` (기본값) 또는 `newline`로 길이 청킹 전에 빈 줄 (단락 경계)에서 분할.
- `channels.signal.mediaMaxMb`: 인바운드/아웃바운드 미디어 한도 (MB).

관련 전역 옵션:

- `agents.list[].groupChat.mentionPatterns` (Signal은 네이티브 멘션을 지원하지 않음).
- `messages.groupChat.mentionPatterns` (전역 대체).
- `messages.responsePrefix`.

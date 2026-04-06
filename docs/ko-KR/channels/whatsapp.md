---
summary: "WhatsApp (웹 채널) 통합: 로그인, 받은편지함, 답장, 미디어 및 운영"
read_when:
  - WhatsApp/웹 채널 동작 또는 받은편지함 라우팅 작업 시
title: "WhatsApp"
---

# WhatsApp (웹 채널)

상태: Baileys를 통한 WhatsApp Web만 지원. 게이트웨이가 세션을 소유합니다.

## 빠른 설정 (초보자용)

1. 가능하면 **별도 전화번호**를 사용하세요 (권장).
2. `~/.openclaw/openclaw.json`에서 WhatsApp을 구성하세요.
3. `openclaw channels login`을 실행하여 QR 코드를 스캔하세요 (연결된 기기).
4. 게이트웨이를 시작하세요.

최소 설정:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

## 목표

- 하나의 게이트웨이 프로세스에서 여러 WhatsApp 계정 (다중 계정).
- 결정론적 라우팅: 답장은 WhatsApp으로 돌아가며, 모델 라우팅 없음.
- 모델이 인용된 답장을 이해할 수 있을 만큼 충분한 컨텍스트를 봅니다.

## 설정 쓰기

기본적으로 WhatsApp은 `/config set|unset`으로 트리거된 설정 업데이트 쓰기가 허용됩니다 (`commands.config: true` 필요).

비활성화하려면:

```json5
{
  channels: { whatsapp: { configWrites: false } },
}
```

## 아키텍처 (소유권)

- **게이트웨이**가 Baileys 소켓과 받은편지함 루프를 소유합니다.
- **CLI / macOS 앱**은 게이트웨이와 통신하며, Baileys를 직접 사용하지 않습니다.
- **활성 리스너**가 아웃바운드 전송에 필요하며, 없으면 전송이 빠르게 실패합니다.

## 전화번호 받기 (두 가지 모드)

WhatsApp은 인증을 위해 실제 휴대전화 번호가 필요합니다. VoIP와 가상 번호는 보통 차단됩니다. OpenClaw을 WhatsApp에서 실행하는 두 가지 지원 방법이 있습니다:

### 전용 번호 (권장)

OpenClaw용으로 **별도 전화번호**를 사용하세요. 최고의 UX, 깔끔한 라우팅, 셀프 채팅 문제 없음. 이상적인 설정: **여분/오래된 Android 폰 + eSIM**. Wi-Fi와 전원에 연결한 채로 두고 QR로 연결하세요.

**WhatsApp Business:** 같은 기기에서 다른 번호로 WhatsApp Business를 사용할 수 있습니다. 개인 WhatsApp을 분리하기에 좋습니다 — WhatsApp Business를 설치하고 OpenClaw 번호를 등록하세요.

**샘플 설정 (전용 번호, 단일 사용자 허용목록):**

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

**페어링 모드 (선택사항):**
허용목록 대신 페어링을 원하면 `channels.whatsapp.dmPolicy`를 `pairing`으로 설정하세요. 알 수 없는 발신자는 페어링 코드를 받게 됩니다. 승인하려면:
`openclaw pairing approve whatsapp <code>`

### 개인 번호 (대체)

빠른 대체 방법: **자신의 번호**에서 OpenClaw을 실행하세요. 연락처에게 스팸을 보내지 않도록 자신에게 메시지를 보내세요 (WhatsApp "나에게 메시지 보내기") 테스트용으로. 설정 및 실험 중에 주요 전화에서 인증 코드를 읽어야 합니다. **셀프 채팅 모드를 활성화해야 합니다.**
마법사가 개인 WhatsApp 번호를 요청할 때, 메시지를 보낼 전화 (소유자/발신자)를 입력하세요. 어시스턴트 번호가 아닙니다.

**샘플 설정 (개인 번호, 셀프 채팅):**

```json
{
  "whatsapp": {
    "selfChatMode": true,
    "dmPolicy": "allowlist",
    "allowFrom": ["+15551234567"]
  }
}
```

셀프 채팅 답장은 `messages.responsePrefix`가 설정되지 않은 경우 설정 시 `[{identity.name}]`로 기본 설정됩니다 (그렇지 않으면 `[openclaw]`).
접두사를 맞춤 설정하거나 비활성화하려면 명시적으로 설정하세요 (제거하려면 `""`를 사용).

### 번호 확보 팁

- **로컬 eSIM** 자국 이동통신사에서 (가장 안정적)
  - 오스트리아: [hot.at](https://www.hot.at)
  - 영국: [giffgaff](https://www.giffgaff.com) — 무료 SIM, 계약 없음
- **선불 SIM** — 저렴하며, 인증을 위해 SMS 한 번만 수신하면 됨

**피해야 할 것:** TextNow, Google Voice, 대부분의 "무료 SMS" 서비스 — WhatsApp이 이들을 공격적으로 차단합니다.

**팁:** 번호는 인증 SMS를 한 번만 받으면 됩니다. 그 후 WhatsApp Web 세션은 `creds.json`을 통해 유지됩니다.

## Twilio를 사용하지 않는 이유?

- 초기 OpenClaw 빌드는 Twilio의 WhatsApp Business 통합을 지원했습니다.
- WhatsApp Business 번호는 개인 어시스턴트에 적합하지 않습니다.
- Meta는 24시간 답장 창을 강제합니다. 지난 24시간 동안 응답하지 않았다면 비즈니스 번호는 새 메시지를 시작할 수 없습니다.
- 대량 또는 "수다스러운" 사용은 공격적인 차단을 유발합니다. 비즈니스 계정은 수십 개의 개인 어시스턴트 메시지를 보내도록 설계되지 않았기 때문입니다.
- 결과: 불안정한 전달 및 빈번한 차단으로 지원이 제거되었습니다.

## 로그인 + 자격 증명

- 로그인 명령: `openclaw channels login` (연결된 기기를 통한 QR).
- 다중 계정 로그인: `openclaw channels login --account <id>` (`<id>` = `accountId`).
- 기본 계정 (`--account`가 생략된 경우): `default`가 있으면 사용, 그렇지 않으면 첫 번째 구성된 계정 id (정렬됨).
- 자격 증명은 `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`에 저장됩니다.
- 손상 시 복원되는 백업 복사본 `creds.json.bak`.
- 레거시 호환성: 이전 설치는 Baileys 파일을 `~/.openclaw/credentials/`에 직접 저장했습니다.
- 로그아웃: `openclaw channels logout` (또는 `--account <id>`)은 WhatsApp 인증 상태를 삭제합니다 (하지만 공유 `oauth.json`은 유지).
- 로그아웃된 소켓 => 재연결 지시 오류.

## 인바운드 흐름 (DM + 그룹)

- WhatsApp 이벤트는 `messages.upsert` (Baileys)에서 옵니다.
- 받은편지함 리스너는 테스트/재시작 시 이벤트 핸들러가 누적되지 않도록 종료 시 분리됩니다.
- 상태/방송 채팅은 무시됩니다.
- 직접 채팅은 E.164를 사용하고, 그룹은 그룹 JID를 사용합니다.
- **DM 정책**: `channels.whatsapp.dmPolicy`는 직접 채팅 접근을 제어합니다 (기본값: `pairing`).
  - 페어링: 알 수 없는 발신자는 페어링 코드를 받습니다 (`openclaw pairing approve whatsapp <code>`로 승인; 코드는 1시간 후 만료).
  - Open: `channels.whatsapp.allowFrom`에 `"*"`를 포함해야 합니다.
  - 연결된 WhatsApp 번호는 암묵적으로 신뢰되므로, 자신의 메시지는 `channels.whatsapp.dmPolicy` 및 `channels.whatsapp.allowFrom` 검사를 건너뜁니다.

### 개인 번호 모드 (대체)

**개인 WhatsApp 번호**에서 OpenClaw을 실행하는 경우 `channels.whatsapp.selfChatMode`를 활성화하세요 (위의 샘플 참조).

동작:

- 아웃바운드 DM은 페어링 답장을 트리거하지 않습니다 (연락처에게 스팸 방지).
- 인바운드 알 수 없는 발신자는 여전히 `channels.whatsapp.dmPolicy`를 따릅니다.
- 셀프 채팅 모드 (allowFrom에 자신의 번호 포함)는 자동 읽음 확인을 피하고 멘션 JID를 무시합니다.
- 비셀프 채팅 DM에 대해 읽음 확인이 전송됩니다.

## 읽음 확인

기본적으로 게이트웨이는 수락된 인바운드 WhatsApp 메시지를 읽음으로 표시합니다 (파란 체크).

전역 비활성화:

```json5
{
  channels: { whatsapp: { sendReadReceipts: false } },
}
```

계정별 비활성화:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        personal: { sendReadReceipts: false },
      },
    },
  },
}
```

참고:

- 셀프 채팅 모드는 항상 읽음 확인을 건너뜁니다.

## WhatsApp FAQ: 메시지 전송 + 페어링

**WhatsApp을 연결하면 OpenClaw이 무작위 연락처에게 메시지를 보낼까요?**
아니요. 기본 DM 정책은 **페어링**이므로, 알 수 없는 발신자는 페어링 코드만 받고 메시지는 **처리되지 않습니다**. OpenClaw은 수신한 채팅이나 명시적으로 트리거한 전송 (에이전트/CLI)에만 답장합니다.

**WhatsApp에서 페어링은 어떻게 작동하나요?**
페어링은 알 수 없는 발신자를 위한 DM 게이트입니다:

- 새 발신자의 첫 DM은 짧은 코드를 반환합니다 (메시지는 처리되지 않음).
- 승인: `openclaw pairing approve whatsapp <code>` (목록: `openclaw pairing list whatsapp`).
- 코드는 1시간 후 만료되며, 대기 중인 요청은 채널당 3개로 제한됩니다.

**하나의 WhatsApp 번호에서 여러 사람이 다른 OpenClaw 인스턴스를 사용할 수 있나요?**
예, `bindings`를 통해 각 발신자를 다른 에이전트로 라우팅할 수 있습니다 (피어 `kind: "dm"`, 발신자 E.164 예: `+15551234567`). 답장은 여전히 **같은 WhatsApp 계정**에서 오며, 직접 채팅은 각 에이전트의 메인 세션으로 축소되므로 **사람당 하나의 에이전트**를 사용하세요. DM 접근 제어 (`dmPolicy`/`allowFrom`)는 WhatsApp 계정당 전역입니다. [멀티 에이전트 라우팅](/ko-KR/concepts/multi-agent)을 참조하세요.

**마법사에서 전화번호를 묻는 이유는?**
마법사는 자신의 DM이 허용되도록 **허용목록/소유자**를 설정하는 데 사용합니다. 자동 전송에는 사용되지 않습니다. 개인 WhatsApp 번호에서 실행하는 경우 같은 번호를 사용하고 `channels.whatsapp.selfChatMode`를 활성화하세요.

## 메시지 정규화 (모델이 보는 것)

- `Body`는 봉투가 있는 현재 메시지 본문입니다.
- 인용된 답장 컨텍스트는 **항상 추가됩니다**:
  ```
  [Replying to +1555 id:ABC123]
  <quoted text or <media:...>>
  [/Replying]
  ```
- 답장 메타데이터도 설정됩니다:
  - `ReplyToId` = stanzaId
  - `ReplyToBody` = 인용된 본문 또는 미디어 플레이스홀더
  - `ReplyToSender` = 알려진 경우 E.164
- 미디어 전용 인바운드 메시지는 플레이스홀더를 사용합니다:
  - `<media:image|video|audio|document|sticker>`

## 그룹

- 그룹은 `agent:<agentId>:whatsapp:group:<jid>` 세션에 매핑됩니다.
- 그룹 정책: `channels.whatsapp.groupPolicy = open|disabled|allowlist` (기본값 `allowlist`).
- 활성화 모드:
  - `mention` (기본값): @멘션 또는 정규식 일치가 필요합니다.
  - `always`: 항상 트리거됩니다.
- `/activation mention|always`는 소유자 전용이며 독립 메시지로 전송해야 합니다.
- 소유자 = `channels.whatsapp.allowFrom` (또는 설정되지 않은 경우 자신의 E.164).
- **히스토리 주입** (대기 중만):
  - 최근 _미처리_ 메시지 (기본값 50)가 다음과 같이 삽입됩니다:
    `[Chat messages since your last reply - for context]` (세션에 이미 있는 메시지는 재주입되지 않음)
  - 현재 메시지:
    `[Current message - respond to this]`
  - 발신자 접미사 추가: `[from: Name (+E164)]`
- 그룹 메타데이터는 5분 캐시됩니다 (제목 + 참가자).

## 답장 전달 (스레딩)

- WhatsApp Web은 표준 메시지를 전송합니다 (현재 게이트웨이에서 인용된 답장 스레딩 없음).
- 답장 태그는 이 채널에서 무시됩니다.

## 확인 반응 (수신 시 자동 반응)

WhatsApp은 봇이 답장을 생성하기 전에 수신 즉시 들어오는 메시지에 이모지 반응을 자동으로 전송할 수 있습니다. 이는 메시지가 수신되었다는 즉각적인 피드백을 사용자에게 제공합니다.

**설정:**

```json
{
  "whatsapp": {
    "ackReaction": {
      "emoji": "👀",
      "direct": true,
      "group": "mentions"
    }
  }
}
```

**옵션:**

- `emoji` (문자열): 확인에 사용할 이모지 (예: "👀", "✅", "📨"). 비어 있거나 생략 = 기능 비활성화.
- `direct` (불린, 기본값: `true`): 직접/DM 채팅에서 반응 전송.
- `group` (문자열, 기본값: `"mentions"`): 그룹 채팅 동작:
  - `"always"`: 모든 그룹 메시지에 반응 (@멘션 없이도)
  - `"mentions"`: 봇이 @멘션된 경우에만 반응
  - `"never"`: 그룹에서 반응 안 함

**계정별 재정의:**

```json
{
  "whatsapp": {
    "accounts": {
      "work": {
        "ackReaction": {
          "emoji": "✅",
          "direct": false,
          "group": "always"
        }
      }
    }
  }
}
```

**동작 참고:**

- 반응은 타이핑 표시기나 봇 답장 전에 메시지 수신 **즉시** 전송됩니다.
- `requireMention: false` (활성화: 항상)인 그룹에서 `group: "mentions"`는 모든 메시지에 반응합니다 (@멘션뿐만 아니라).
- Fire-and-forget: 반응 실패는 기록되지만 봇의 답장을 방해하지 않습니다.
- 참가자 JID는 그룹 반응에 자동으로 포함됩니다.
- WhatsApp은 `messages.ackReaction`을 무시합니다. 대신 `channels.whatsapp.ackReaction`을 사용하세요.

## 에이전트 도구 (반응)

- 도구: `whatsapp`의 `react` 액션 (`chatJid`, `messageId`, `emoji`, 선택사항 `remove`).
- 선택사항: `participant` (그룹 발신자), `fromMe` (자신의 메시지에 반응), `accountId` (다중 계정).
- 반응 제거 의미: [/tools/reactions](/ko-KR/tools/reactions) 참조.
- 도구 게이팅: `channels.whatsapp.actions.reactions` (기본값: 활성화).

## 제한

- 아웃바운드 텍스트는 `channels.whatsapp.textChunkLimit`로 청크됩니다 (기본값 4000).
- 선택적 줄바꿈 청킹: `channels.whatsapp.chunkMode="newline"`을 설정하여 길이 청킹 전에 빈 줄 (단락 경계)에서 분할합니다.
- 인바운드 미디어 저장은 `channels.whatsapp.mediaMaxMb`로 제한됩니다 (기본값 50 MB).
- 아웃바운드 미디어 항목은 `agents.defaults.mediaMaxMb`로 제한됩니다 (기본값 5 MB).

## 아웃바운드 전송 (텍스트 + 미디어)

- 활성 웹 리스너를 사용합니다. 게이트웨이가 실행되지 않으면 오류.
- 텍스트 청킹: 메시지당 최대 4k (`channels.whatsapp.textChunkLimit`로 구성 가능, 선택사항 `channels.whatsapp.chunkMode`).
- 미디어:
  - 이미지/비디오/오디오/문서 지원.
  - 오디오는 PTT로 전송됩니다. `audio/ogg` => `audio/ogg; codecs=opus`.
  - 캡션은 첫 번째 미디어 항목에만 있습니다.
  - 미디어 가져오기는 HTTP(S) 및 로컬 경로를 지원합니다.
  - 애니메이션 GIF: WhatsApp은 인라인 루핑을 위해 `gifPlayback: true`가 있는 MP4를 기대합니다.
    - CLI: `openclaw message send --media <mp4> --gif-playback`
    - 게이트웨이: `send` 매개변수에 `gifPlayback: true` 포함

## 음성 노트 (PTT 오디오)

WhatsApp은 오디오를 **음성 노트** (PTT 버블)로 전송합니다.

- 최상의 결과: OGG/Opus. OpenClaw은 `audio/ogg`를 `audio/ogg; codecs=opus`로 다시 씁니다.
- `[[audio_as_voice]]`는 WhatsApp에서 무시됩니다 (오디오가 이미 음성 노트로 전송됨).

## 미디어 제한 + 최적화

- 기본 아웃바운드 한도: 5 MB (미디어 항목당).
- 재정의: `agents.defaults.mediaMaxMb`.
- 이미지는 한도 내에서 JPEG로 자동 최적화됩니다 (크기 조정 + 품질 스윕).
- 초과 크기 미디어 => 오류; 미디어 답장은 텍스트 경고로 대체됩니다.

## 하트비트

- **게이트웨이 하트비트**는 연결 상태를 기록합니다 (`web.heartbeatSeconds`, 기본값 60초).
- **에이전트 하트비트**는 에이전트별로 (`agents.list[].heartbeat`) 또는 전역으로
  `agents.defaults.heartbeat`를 통해 구성할 수 있습니다 (에이전트별 항목이 설정되지 않은 경우 대체).
  - 구성된 하트비트 프롬프트 (기본값: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`) + `HEARTBEAT_OK` 건너뛰기 동작을 사용합니다.
  - 전달은 기본적으로 마지막으로 사용한 채널 (또는 구성된 대상)로 이동합니다.

## 재연결 동작

- 백오프 정책: `web.reconnect`:
  - `initialMs`, `maxMs`, `factor`, `jitter`, `maxAttempts`.
- maxAttempts에 도달하면 웹 모니터링이 중지됩니다 (성능 저하).
- 로그아웃 => 중지하고 재연결 필요.

## 설정 빠른 맵

- `channels.whatsapp.dmPolicy` (DM 정책: pairing/allowlist/open/disabled).
- `channels.whatsapp.selfChatMode` (같은 전화 설정; 봇이 개인 WhatsApp 번호 사용).
- `channels.whatsapp.allowFrom` (DM 허용목록). WhatsApp은 E.164 전화번호를 사용합니다 (사용자 이름 없음).
- `channels.whatsapp.mediaMaxMb` (인바운드 미디어 저장 한도).
- `channels.whatsapp.ackReaction` (메시지 수신 시 자동 반응: `{emoji, direct, group}`).
- `channels.whatsapp.accounts.<accountId>.*` (계정별 설정 + 선택사항 `authDir`).
- `channels.whatsapp.accounts.<accountId>.mediaMaxMb` (계정별 인바운드 미디어 한도).
- `channels.whatsapp.accounts.<accountId>.ackReaction` (계정별 확인 반응 재정의).
- `channels.whatsapp.groupAllowFrom` (그룹 발신자 허용목록).
- `channels.whatsapp.groupPolicy` (그룹 정책).
- `channels.whatsapp.historyLimit` / `channels.whatsapp.accounts.<accountId>.historyLimit` (그룹 히스토리 컨텍스트; `0`은 비활성화).
- `channels.whatsapp.dmHistoryLimit` (사용자 턴의 DM 히스토리 제한). 사용자별 재정의: `channels.whatsapp.dms["<phone>"].historyLimit`.
- `channels.whatsapp.groups` (그룹 허용목록 + 멘션 게이팅 기본값; 모두 허용하려면 `"*"` 사용)
- `channels.whatsapp.actions.reactions` (WhatsApp 도구 반응 게이트).
- `agents.list[].groupChat.mentionPatterns` (또는 `messages.groupChat.mentionPatterns`)
- `messages.groupChat.historyLimit`
- `channels.whatsapp.messagePrefix` (인바운드 접두사; 계정별: `channels.whatsapp.accounts.<accountId>.messagePrefix`; 더 이상 사용되지 않음: `messages.messagePrefix`)
- `messages.responsePrefix` (아웃바운드 접두사)
- `agents.defaults.mediaMaxMb`
- `agents.defaults.heartbeat.every`
- `agents.defaults.heartbeat.model` (선택사항 재정의)
- `agents.defaults.heartbeat.target`
- `agents.defaults.heartbeat.to`
- `agents.defaults.heartbeat.session`
- `agents.list[].heartbeat.*` (에이전트별 재정의)
- `session.*` (범위, 유휴, 저장소, mainKey)
- `web.enabled` (false일 때 채널 시작 비활성화)
- `web.heartbeatSeconds`
- `web.reconnect.*`

## 로그 + 문제 해결

- 서브시스템: `whatsapp/inbound`, `whatsapp/outbound`, `web-heartbeat`, `web-reconnect`.
- 로그 파일: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (구성 가능).
- 문제 해결 가이드: [게이트웨이 문제 해결](/ko-KR/gateway/troubleshooting).

## 문제 해결 (빠른)

**연결되지 않음 / QR 로그인 필요**

- 증상: `channels status`가 `linked: false`를 표시하거나 "Not linked" 경고.
- 수정: 게이트웨이 호스트에서 `openclaw channels login`을 실행하고 QR을 스캔하세요 (WhatsApp → 설정 → 연결된 기기).

**연결되었지만 연결 끊김 / 재연결 루프**

- 증상: `channels status`가 `running, disconnected`를 표시하거나 "Linked but disconnected" 경고.
- 수정: `openclaw doctor` (또는 게이트웨이 재시작). 지속되면 `channels login`으로 재연결하고 `openclaw logs --follow`를 확인하세요.

**Bun 런타임**

- Bun은 **권장되지 않습니다**. WhatsApp (Baileys)과 Telegram은 Bun에서 불안정합니다.
  **Node**로 게이트웨이를 실행하세요. (시작하기 런타임 노트 참조.)

---
summary: "WhatsApp 그룹 메시지 처리를 위한 동작 및 설정 (mentionPatterns은 여러 표면에서 공유됨)"
read_when:
  - 그룹 메시지 규칙 또는 멘션 변경 시
title: "그룹 메시지"
---

# 그룹 메시지 (WhatsApp 웹 채널)

목표: Clawd가 WhatsApp 그룹에 참여하고, 핑될 때만 깨어나며, 해당 스레드를 개인 DM 세션과 별도로 유지하도록 합니다.

참고: `agents.list[].groupChat.mentionPatterns`는 이제 Telegram/Discord/Slack/iMessage에서도 사용됩니다; 이 문서는 WhatsApp 고유 동작에 중점을 둡니다. 다중 에이전트 설정의 경우, 에이전트별로 `agents.list[].groupChat.mentionPatterns`를 설정하세요(또는 전역 폴백으로 `messages.groupChat.mentionPatterns` 사용).

## 구현된 내용 (2025-12-03)

- 활성화 모드: `mention` (기본값) 또는 `always`. `mention`은 핑이 필요합니다(실제 WhatsApp @-멘션은 `mentionedJids`를 통해, 정규식 패턴 또는 봇의 E.164가 텍스트 어디에나 있어야 함). `always`는 모든 메시지에서 에이전트를 깨우지만 의미 있는 가치를 추가할 수 있을 때만 응답해야 하며, 그렇지 않으면 무음 토큰 `NO_REPLY`를 반환합니다. 기본값은 설정(`channels.whatsapp.groups`)에서 설정하고 `/activation`을 통해 그룹별로 재정의할 수 있습니다. `channels.whatsapp.groups`가 설정되면 그룹 허용 목록으로도 작동합니다(`"*"`를 포함하여 모두 허용).
- 그룹 정책: `channels.whatsapp.groupPolicy`는 그룹 메시지를 수락할지 여부를 제어합니다(`open|disabled|allowlist`). `allowlist`는 `channels.whatsapp.groupAllowFrom`을 사용합니다(폴백: 명시적 `channels.whatsapp.allowFrom`). 기본값은 `allowlist`(발신자를 추가할 때까지 차단됨)입니다.
- 그룹별 세션: 세션 키는 `agent:<agentId>:whatsapp:group:<jid>`처럼 보이므로 `/verbose on` 또는 `/think high`와 같은 명령(독립 실행형 메시지로 전송)은 해당 그룹에만 범위가 지정됩니다; 개인 DM 상태는 영향을 받지 않습니다. 하트비트는 그룹 스레드에서는 건너뜁니다.
- 컨텍스트 주입: 실행을 트리거하지 **않은** **보류 중인** 그룹 메시지(기본값 50개)는 `[Chat messages since your last reply - for context]` 아래에 접두사가 붙으며, 트리거 라인은 `[Current message - respond to this]` 아래에 있습니다. 세션에 이미 있는 메시지는 다시 주입되지 않습니다.
- 발신자 표시: 모든 그룹 배치는 이제 `[from: Sender Name (+E164)]`로 끝나므로 Pi는 누가 말하는지 알 수 있습니다.
- 임시/일회성 보기: 텍스트/멘션을 추출하기 전에 래핑을 해제하므로 그 안의 핑은 여전히 트리거됩니다.
- 그룹 시스템 프롬프트: 그룹 세션의 첫 번째 턴(및 `/activation`이 모드를 변경할 때마다)에서 시스템 프롬프트에 짧은 설명을 주입합니다. 예: `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` 메타데이터를 사용할 수 없는 경우에도 에이전트에게 그룹 채팅임을 알립니다.

## 설정 예시 (WhatsApp)

`~/.openclaw/openclaw.json`에 `groupChat` 블록을 추가하여 WhatsApp이 텍스트 본문에서 시각적 `@`를 제거하더라도 표시 이름 핑이 작동하도록 합니다:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

참고:

- 정규식은 대소문자를 구분하지 않습니다; `@openclaw`와 같은 표시 이름 핑 및 `+`/공백이 있거나 없는 원시 번호를 포함합니다.
- 누군가 연락처를 탭하면 WhatsApp은 여전히 `mentionedJids`를 통해 정식 멘션을 보내므로 번호 폴백은 거의 필요하지 않지만 유용한 안전망입니다.

### 활성화 명령 (소유자 전용)

그룹 채팅 명령을 사용하세요:

- `/activation mention`
- `/activation always`

소유자 번호(`channels.whatsapp.allowFrom` 또는 설정되지 않은 경우 봇 자체의 E.164)만 이를 변경할 수 있습니다. 그룹에서 독립 실행형 메시지로 `/status`를 보내 현재 활성화 모드를 확인하세요.

## 사용 방법

1. OpenClaw를 실행하는 WhatsApp 계정을 그룹에 추가하세요.
2. `@openclaw …`라고 말하거나(또는 번호를 포함). `groupPolicy: "open"`을 설정하지 않는 한 허용 목록에 있는 발신자만 트리거할 수 있습니다.
3. 에이전트 프롬프트에는 최근 그룹 컨텍스트와 후행 `[from: …]` 마커가 포함되어 올바른 사람에게 응답할 수 있습니다.
4. 세션 수준 지시문(`/verbose on`, `/think high`, `/new` 또는 `/reset`, `/compact`)은 해당 그룹의 세션에만 적용됩니다; 독립 실행형 메시지로 보내 등록되도록 하세요. 개인 DM 세션은 독립적으로 유지됩니다.

## 테스트 / 검증

- 수동 스모크:
  - 그룹에서 `@openclaw` 핑을 보내고 발신자 이름을 참조하는 답장을 확인하세요.
  - 두 번째 핑을 보내고 히스토리 블록이 포함된 다음 다음 턴에서 지워지는지 확인하세요.
- 게이트웨이 로그 확인(`--verbose`로 실행): `from: <groupJid>` 및 `[from: …]` 접미사를 보여주는 `inbound web message` 항목을 확인하세요.

## 알려진 고려 사항

- 하트비트는 시끄러운 브로드캐스트를 피하기 위해 그룹에서 의도적으로 건너뜁니다.
- 에코 억제는 결합된 배치 문자열을 사용합니다; 멘션 없이 동일한 텍스트를 두 번 보내면 첫 번째 텍스트만 응답을 받습니다.
- 세션 저장소 항목은 `agent:<agentId>:whatsapp:group:<jid>`로 나타납니다(기본값 `~/.openclaw/agents/<agentId>/sessions/sessions.json`); 누락된 항목은 그룹이 아직 실행을 트리거하지 않았음을 의미합니다.
- 그룹의 타이핑 표시기는 `agents.defaults.typingMode`를 따릅니다(기본값: 멘션되지 않은 경우 `message`).

---
summary: "게이트웨이 + CLI를 통한 투표 전송"
read_when:
  - 투표 지원 추가 또는 수정
  - CLI 또는 게이트웨이에서 투표 전송 디버깅
title: "투표"
---

# 투표

## 지원되는 채널

- WhatsApp (웹 채널)
- Discord
- MS Teams (적응형 카드)

## CLI

```bash
# WhatsApp
openclaw message poll --target +15555550123 \
  --poll-question "Lunch today?" --poll-option "Yes" --poll-option "No" --poll-option "Maybe"
openclaw message poll --target 123456789@g.us \
  --poll-question "Meeting time?" --poll-option "10am" --poll-option "2pm" --poll-option "4pm" --poll-multi

# Discord
openclaw message poll --channel discord --target channel:123456789 \
  --poll-question "Snack?" --poll-option "Pizza" --poll-option "Sushi"
openclaw message poll --channel discord --target channel:123456789 \
  --poll-question "Plan?" --poll-option "A" --poll-option "B" --poll-duration-hours 48

# MS Teams
openclaw message poll --channel msteams --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" --poll-option "Pizza" --poll-option "Sushi"
```

옵션:

- `--channel`: `whatsapp` (기본값), `discord`, 또는 `msteams`
- `--poll-multi`: 여러 옵션 선택 허용
- `--poll-duration-hours`: Discord 전용 (생략 시 기본값 24)

## 게이트웨이 RPC

메서드: `poll`

파라미터:

- `to` (문자열, 필수)
- `question` (문자열, 필수)
- `options` (문자열[], 필수)
- `maxSelections` (숫자, 선택 사항)
- `durationHours` (숫자, 선택 사항)
- `channel` (문자열, 선택 사항, 기본값: `whatsapp`)
- `idempotencyKey` (문자열, 필수)

## 채널 차이점

- WhatsApp: 2-12개 옵션, `maxSelections`는 옵션 개수 내에 있어야 함, `durationHours`를 무시합니다.
- Discord: 2-10개 옵션, `durationHours`는 1-768시간으로 제한 (기본값 24). `maxSelections > 1`은 다중 선택을 활성화합니다; Discord는 엄격한 선택 개수를 지원하지 않습니다.
- MS Teams: 적응형 카드 투표 (OpenClaw 관리). 네이티브 투표 API가 없음; `durationHours`는 무시됩니다.

## 에이전트 도구 (메시지)

`poll` 작업과 함께 `message` 도구를 사용하세요 (`to`, `pollQuestion`, `pollOption`, 선택 사항 `pollMulti`, `pollDurationHours`, `channel`).

참고: Discord에는 "정확히 N개 선택" 모드가 없습니다; `pollMulti`는 다중 선택에 매핑됩니다.
Teams 투표는 적응형 카드로 렌더링되며 게이트웨이가 온라인 상태를 유지하여 `~/.openclaw/msteams-polls.json`에 투표를 기록해야 합니다.

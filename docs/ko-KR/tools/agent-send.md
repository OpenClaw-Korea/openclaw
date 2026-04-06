---
summary: "직접 `openclaw agent` CLI 실행 (선택적 전달 포함)"
read_when:
  - 에이전트 CLI 진입점 추가 또는 수정 시
title: "에이전트 전송"
---

# `openclaw agent` (직접 에이전트 실행)

`openclaw agent`는 인바운드 채팅 메시지 없이 단일 에이전트 턴을 실행합니다.
기본적으로 **게이트웨이를 통해** 진행되며, `--local`을 추가하여 현재 머신의 임베드된
런타임을 강제할 수 있습니다.

## 동작

- 필수: `--message <text>`
- 세션 선택:
  - `--to <dest>`는 세션 키를 파생시킵니다 (그룹/채널 대상은 격리를 유지하고, DM은 `main`으로 축소됨), **또는**
  - `--session-id <id>`는 기존 세션을 ID로 재사용하고, **또는**
  - `--agent <id>`는 설정된 에이전트를 직접 대상으로 하며 (해당 에이전트의 `main` 세션 키 사용)
- 일반 인바운드 회신과 동일한 임베드된 에이전트 런타임을 실행합니다.
- 생각/상세 플래그는 세션 저장소에 지속됩니다.
- 출력:
  - 기본값: 회신 텍스트를 출력합니다 (더하기 `MEDIA:<url>` 줄)
  - `--json`: 구조화된 페이로드 + 메타데이터를 출력합니다
- `--deliver` + `--channel`으로 채널에 다시 전달할 수 있습니다 (대상 형식은 `openclaw message --target`과 일치함).
- `--reply-channel`/`--reply-to`/`--reply-account`를 사용하여 세션을 변경하지 않고 전달을 재정의합니다.

게이트웨이에 연결할 수 없으면 CLI는 **임베드된 로컬 실행으로 폴백**합니다.

## 예제

```bash
openclaw agent --to +15555550123 --message "status update"
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --to +15555550123 --message "Summon reply" --deliver
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```

## 플래그

- `--local`: 로컬에서 실행합니다 (셸에 모델 프로바이더 API 키 필요)
- `--deliver`: 선택한 채널로 회신을 전송합니다
- `--channel`: 전달 채널 (`whatsapp|telegram|discord|googlechat|slack|signal|imessage`, 기본값: `whatsapp`)
- `--reply-to`: 전달 대상 재정의
- `--reply-channel`: 전달 채널 재정의
- `--reply-account`: 전달 계정 ID 재정의
- `--thinking <off|minimal|low|medium|high|xhigh>`: 생각 수준을 유지합니다 (GPT-5.2 + Codex 모델만 해당)
- `--verbose <on|full|off>`: 상세 수준을 유지합니다
- `--timeout <seconds>`: 에이전트 타임아웃을 재정의합니다
- `--json`: 구조화된 JSON으로 출력합니다

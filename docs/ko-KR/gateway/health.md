---
summary: "채널 연결을 위한 상태 점검 단계"
read_when:
  - WhatsApp 채널 상태 진단 시
title: "상태 점검"
---

# 상태 점검 (CLI)

추측 없이 채널 연결을 확인하는 짧은 가이드입니다.

## 빠른 점검

- `openclaw status` — 로컬 요약: 게이트웨이 접근성/모드, 업데이트 힌트, 연결된 채널 인증 수명, 세션 + 최근 활동.
- `openclaw status --all` — 전체 로컬 진단 (읽기 전용, 색상, 디버깅용으로 붙여넣기 가능).
- `openclaw status --deep` — 실행 중인 게이트웨이도 프로브 (지원되는 경우 채널별 프로브).
- `openclaw health --json` — 실행 중인 게이트웨이에 전체 상태 스냅샷 요청 (WS 전용; 직접 Baileys 소켓 없음).
- WhatsApp/WebChat에서 `/status`를 독립 메시지로 전송하면 에이전트를 호출하지 않고 상태 응답을 받습니다.
- 로그: `/tmp/openclaw/openclaw-*.log`를 tail하고 `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`로 필터링.

## 심층 진단

- 디스크의 자격 증명: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime이 최근이어야 함).
- 세션 저장소: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (경로는 설정에서 재정의 가능). 카운트와 최근 수신자는 `status`를 통해 표시됨.
- 재연결 흐름: 로그에 상태 코드 409–515 또는 `loggedOut`가 나타나면 `openclaw channels logout && openclaw channels login --verbose`. (참고: QR 로그인 흐름은 페어링 후 상태 515에 대해 한 번 자동 재시작됨.)

## 문제 발생 시

- `logged out` 또는 상태 409–515 → `openclaw channels logout` 후 `openclaw channels login`으로 재연결.
- 게이트웨이 접근 불가 → 시작: `openclaw gateway --port 18789` (포트가 사용 중이면 `--force` 사용).
- 인바운드 메시지 없음 → 연결된 전화가 온라인이고 발신자가 허용되었는지 확인 (`channels.whatsapp.allowFrom`); 그룹 채팅의 경우 허용 목록 + 멘션 규칙이 일치하는지 확인 (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## 전용 "health" 명령

`openclaw health --json`은 실행 중인 게이트웨이에 상태 스냅샷을 요청합니다(CLI에서 직접 채널 소켓 없음). 사용 가능한 경우 연결된 자격 증명/인증 수명, 채널별 프로브 요약, 세션 저장소 요약 및 프로브 기간을 보고합니다. 게이트웨이에 접근할 수 없거나 프로브가 실패/타임아웃되면 0이 아닌 값으로 종료됩니다. `--timeout <ms>`를 사용하여 10초 기본값을 재정의합니다.

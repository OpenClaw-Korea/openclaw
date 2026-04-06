---
summary: "외부 CLI(signal-cli, imsg) 및 게이트웨이 패턴을 위한 RPC 어댑터"
read_when:
  - 외부 CLI 통합을 추가하거나 변경할 때
  - RPC 어댑터(signal-cli, imsg) 디버깅 시
title: "RPC 어댑터"
---

# RPC 어댑터

OpenClaw는 JSON-RPC를 통해 외부 CLI를 통합합니다. 현재 두 가지 패턴이 사용됩니다.

## 패턴 A: HTTP 데몬(signal-cli)

- `signal-cli`는 JSON-RPC over HTTP로 데몬으로 실행됩니다.
- 이벤트 스트림은 SSE(`/api/v1/events`)입니다.
- 상태 확인: `/api/v1/check`.
- `channels.signal.autoStart=true`일 때 OpenClaw가 생명주기를 관리합니다.

설정 및 엔드포인트는 [Signal](/channels/signal)을 참조하세요.

## 패턴 B: 표준 입출력 자식 프로세스(imsg)

- OpenClaw는 `imsg rpc`를 자식 프로세스로 생성합니다.
- JSON-RPC는 stdin/stdout 위에 줄 구분(한 줄에 하나의 JSON 객체)입니다.
- TCP 포트나 데몬이 필요하지 않습니다.

사용되는 핵심 메서드:

- `watch.subscribe` → 알림(`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (프로브/진단)

설정 및 주소 지정(`chat_id` 선호)은 [iMessage](/channels/imessage)를 참조하세요.

## 어댑터 지침

- 게이트웨이는 프로세스를 관리합니다(시작/중지는 프로바이더 생명주기에 연결됨).
- RPC 클라이언트를 탄력적으로 유지하세요: 타임아웃, 종료 시 재시작.
- 디스플레이 문자열보다 안정적인 ID(예: `chat_id`)를 선호합니다.

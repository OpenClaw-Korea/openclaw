---
summary: "아웃바운드 프로바이더 호출에 대한 재시도 정책"
read_when:
  - 프로바이더 재시도 동작 또는 기본값 업데이트 시
  - 프로바이더 전송 오류 또는 속도 제한 디버깅 시
title: "재시도 정책"
---

# 재시도 정책

## 목표

- 다단계 플로우가 아닌 HTTP 요청별로 재시도.
- 현재 단계만 재시도하여 순서 유지.
- 멱등성이 없는 작업 중복 방지.

## 기본값

- 시도 횟수: 3
- 최대 지연 상한: 30000 ms
- 지터: 0.1 (10 퍼센트)
- 프로바이더 기본값:
  - Telegram 최소 지연: 400 ms
  - Discord 최소 지연: 500 ms

## 동작

### Discord

- 속도 제한 오류(HTTP 429)에서만 재시도.
- 가능한 경우 Discord `retry_after`를 사용하고, 그렇지 않으면 지수 백오프.

### Telegram

- 일시적 오류(429, timeout, connect/reset/closed, temporarily unavailable)에서 재시도.
- 가능한 경우 `retry_after`를 사용하고, 그렇지 않으면 지수 백오프.
- Markdown 파싱 오류는 재시도하지 않으며, 일반 텍스트로 폴백.

## 설정

`~/.openclaw/openclaw.json`에서 프로바이더별로 재시도 정책 설정:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## 참고사항

- 재시도는 요청별로 적용됩니다(메시지 전송, 미디어 업로드, 반응, 투표, 스티커).
- 복합 플로우는 완료된 단계를 재시도하지 않습니다.

---
summary: "SOUL Evil 훅 (SOUL.md를 SOUL_EVIL.md로 교체)"
read_when:
  - SOUL Evil 훅을 활성화하거나 조정하려는 경우
  - 정화 윈도우 또는 무작위 페르소나 교체를 원하는 경우
title: "SOUL Evil 훅"
---

# SOUL Evil 훅

SOUL Evil 훅은 정화 윈도우 중이거나 무작위 확률에 따라 **주입된** `SOUL.md` 콘텐츠를 `SOUL_EVIL.md`로 교체합니다.
디스크의 파일을 수정하지는 **않습니다**.

## 작동 방식

`agent:bootstrap`이 실행될 때, 훅은 시스템 프롬프트가 조립되기 전에 메모리의 `SOUL.md` 콘텐츠를 교체할 수 있습니다. `SOUL_EVIL.md`가 없거나 비어 있으면 OpenClaw는 경고를 기록하고 일반 `SOUL.md`를 유지합니다.

서브-에이전트 실행에는 부트스트랩 파일에 `SOUL.md`가 포함되지 않으므로 이 훅은 서브-에이전트에 영향을 주지 않습니다.

## 활성화

```bash
openclaw hooks enable soul-evil
```

그다음 설정을 입력합니다:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "soul-evil": {
          "enabled": true,
          "file": "SOUL_EVIL.md",
          "chance": 0.1,
          "purge": { "at": "21:00", "duration": "15m" }
        }
      }
    }
  }
}
```

에이전트 워크스페이스 루트(`SOUL.md`와 같은 위치)에 `SOUL_EVIL.md`를 생성합니다.

## 옵션

- `file` (문자열): 대체 SOUL 파일명 (기본값: `SOUL_EVIL.md`)
- `chance` (숫자 0–1): 실행당 `SOUL_EVIL.md`를 사용할 무작위 확률
- `purge.at` (HH:mm): 일일 정화 시작 시간 (24시간 형식)
- `purge.duration` (기간): 윈도우 길이 (예: `30s`, `10m`, `1h`)

**우선순위:** 정화 윈도우가 확률을 우선합니다.

**시간대:** `agents.defaults.userTimezone`이 설정되어 있으면 사용하고, 그렇지 않으면 호스트 시간대를 사용합니다.

## 참고

- 디스크에서 파일이 작성되거나 수정되지 않습니다.
- `SOUL.md`가 부트스트랩 목록에 없으면 훅은 작동하지 않습니다.

## 관련 항목

- [훅](/hooks)

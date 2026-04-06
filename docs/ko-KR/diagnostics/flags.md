---
summary: "대상 디버그 로그를 위한 진단 플래그"
read_when:
  - 전역 로깅 레벨을 높이지 않고 대상 디버그 로그가 필요한 경우
  - 지원을 위해 서브시스템 특정 로그를 캡처해야 하는 경우
title: "진단 플래그"
---

# 진단 플래그

진단 플래그를 사용하면 전역에서 자세한 로깅을 활성화하지 않고도 대상 디버그 로그를 활성화할 수 있습니다. 플래그는 선택 사항이며 서브시스템이 확인하지 않으면 영향이 없습니다.

## 작동 원리

- 플래그는 문자열입니다(대소문자 구분 안 함).
- 설정에서 또는 환경 변수 재정의를 통해 플래그를 활성화할 수 있습니다.
- 와일드카드를 지원합니다:
  - `telegram.*`는 `telegram.http`와 일치합니다
  - `*`는 모든 플래그를 활성화합니다

## 설정을 통해 활성화

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

여러 플래그:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

플래그를 변경한 후 게이트웨이를 다시 시작하세요.

## 환경 변수 재정의(일회성)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

모든 플래그 비활성화:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## 로그 위치

플래그는 표준 진단 로그 파일로 로그를 내보냅니다. 기본값:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file`을 설정하면 해당 경로를 대신 사용합니다. 로그는 JSONL입니다(줄당 하나의 JSON 객체). `logging.redactSensitive`를 기반으로 편집이 계속 적용됩니다.

## 로그 추출

최신 로그 파일 선택:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP 진단 필터링:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

또는 재현 중에 추적:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

원격 게이트웨이의 경우 `openclaw logs --follow`를 사용할 수도 있습니다([/cli/logs](/cli/logs) 참조).

## 참고사항

- `logging.level`이 `warn`보다 높게 설정되면 이러한 로그가 억제될 수 있습니다. 기본값 `info`는 괜찮습니다.
- 플래그는 안전하게 활성화된 상태로 둘 수 있습니다. 특정 서브시스템의 로그 볼륨에만 영향을 미칩니다.
- [/logging](/logging)을 사용하여 로그 대상, 레벨 및 편집을 변경하세요.

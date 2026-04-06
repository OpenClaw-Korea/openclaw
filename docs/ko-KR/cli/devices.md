---
summary: "`openclaw devices` CLI 참조 (디바이스 페어링 + 토큰 회전/폐기)"
read_when:
  - 디바이스 페어링 요청을 승인하고 있을 때
  - 디바이스 토큰을 회전 또는 폐기해야 할 때
title: "devices"
---

# `openclaw devices`

디바이스 페어링 요청 및 디바이스 범위 토큰을 관리합니다.

## 명령어

### `openclaw devices list`

대기 중인 페어링 요청 및 페어링된 디바이스를 나열합니다.

```
openclaw devices list
openclaw devices list --json
```

### `openclaw devices approve <requestId>`

대기 중인 디바이스 페어링 요청을 승인합니다.

```
openclaw devices approve <requestId>
```

### `openclaw devices reject <requestId>`

대기 중인 디바이스 페어링 요청을 거부합니다.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

특정 역할에 대한 디바이스 토큰을 회전합니다(선택적으로 범위 업데이트).

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

### `openclaw devices revoke --device <id> --role <role>`

특정 역할에 대한 디바이스 토큰을 폐기합니다.

```
openclaw devices revoke --device <deviceId> --role node
```

## 공통 옵션

- `--url <url>`: 게이트웨이 WebSocket URL (설정되어 있을 때 `gateway.remote.url`로 기본 설정됨).
- `--token <token>`: 게이트웨이 토큰 (필요한 경우).
- `--password <password>`: 게이트웨이 암호 (암호 인증).
- `--timeout <ms>`: RPC 타임아웃.
- `--json`: JSON 출력 (스크립트 작성에 권장).

## 참고사항

- 토큰 회전은 새 토큰을 반환합니다(민감한 정보). 이를 암호처럼 취급하세요.
- 이 명령어들은 `operator.pairing` (또는 `operator.admin`) 범위가 필요합니다.

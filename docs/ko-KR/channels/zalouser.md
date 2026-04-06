---
summary: "zca-cli를 통한 Zalo 개인 계정 지원 (QR 로그인), 기능 및 구성"
read_when:
  - OpenClaw를 위한 Zalo Personal 설정 시
  - Zalo Personal 로그인 또는 메시지 흐름 디버깅 시
title: "Zalo Personal"
---

# Zalo Personal (비공식)

상태: 실험 기능. 이 통합은 `zca-cli`를 통해 **개인 Zalo 계정**을 자동화합니다.

> **경고:** 이것은 비공식 통합이며 계정 정지/차단을 초래할 수 있습니다. 본인의 책임 하에 사용하세요.

## 플러그인 필요

Zalo Personal은 플러그인으로 제공되며 코어 설치에 포함되지 않습니다.

- CLI를 통한 설치: `openclaw plugins install @openclaw/zalouser`
- 또는 소스 체크아웃에서: `openclaw plugins install ./extensions/zalouser`
- 세부 정보: [플러그인](/plugin)

## 전제 조건: zca-cli

게이트웨이 머신에 `zca` 바이너리가 `PATH`에 있어야 합니다.

- 확인: `zca --version`
- 누락된 경우 zca-cli를 설치하세요 (`extensions/zalouser/README.md` 또는 업스트림 zca-cli 문서 참조).

## 빠른 설정 (초보자용)

1. 플러그인 설치 (위 참조).
2. 로그인 (QR, 게이트웨이 머신에서):
   - `openclaw channels login --channel zalouser`
   - 터미널의 QR 코드를 Zalo 모바일 앱으로 스캔하세요.
3. 채널 활성화:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. 게이트웨이를 재시작하세요 (또는 온보딩 완료).
5. DM 접근은 기본적으로 페어링입니다; 첫 연락 시 페어링 코드를 승인하세요.

## 정의

- `zca listen`을 사용하여 인바운드 메시지를 수신합니다.
- `zca msg ...`를 사용하여 답장을 전송합니다 (텍스트/미디어/링크).
- Zalo Bot API를 사용할 수 없는 "개인 계정" 사용 사례를 위해 설계되었습니다.

## 이름 지정

채널 id는 `zalouser`로, 이것이 **개인 Zalo 사용자 계정** (비공식)을 자동화한다는 것을 명확히 합니다. 잠재적인 미래 공식 Zalo API 통합을 위해 `zalo`를 예약합니다.

## ID 찾기 (디렉토리)

디렉토리 CLI를 사용하여 피어/그룹 및 해당 ID를 검색하세요:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 제한

- 아웃바운드 텍스트는 약 2000자로 청크됩니다 (Zalo 클라이언트 제한).
- 스트리밍은 기본적으로 차단됩니다.

## 접근 제어 (DM)

`channels.zalouser.dmPolicy`는 다음을 지원합니다: `pairing | allowlist | open | disabled` (기본값: `pairing`).
`channels.zalouser.allowFrom`은 사용자 ID 또는 이름을 허용합니다. 마법사는 가능한 경우 `zca friend find`를 통해 이름을 ID로 확인합니다.

승인 방법:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 그룹 접근 (선택사항)

- 기본값: `channels.zalouser.groupPolicy = "open"` (그룹 허용). 설정되지 않은 경우 기본값을 재정의하려면 `channels.defaults.groupPolicy`를 사용하세요.
- 허용목록으로 제한:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (키는 그룹 ID 또는 이름)
- 모든 그룹 차단: `channels.zalouser.groupPolicy = "disabled"`.
- 구성 마법사는 그룹 허용목록을 요청할 수 있습니다.
- 시작 시 OpenClaw는 허용목록의 그룹/사용자 이름을 ID로 확인하고 매핑을 기록합니다; 확인되지 않은 항목은 입력한 대로 유지됩니다.

예시:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

## 다중 계정

계정은 zca 프로필에 매핑됩니다. 예시:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## 문제 해결

**`zca`를 찾을 수 없음:**

- zca-cli를 설치하고 게이트웨이 프로세스의 `PATH`에 있는지 확인하세요.

**로그인이 유지되지 않음:**

- `openclaw channels status --probe`
- 재로그인: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

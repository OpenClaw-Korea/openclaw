---
summary: "Zalo 개인 플러그인: zca-cli를 통한 QR 로그인 및 메시징 (플러그인 설치 + 채널 설정 + CLI + 도구)"
read_when:
  - OpenClaw에서 Zalo 개인 계정 지원을 원할 때
  - zalouser 플러그인을 설정 또는 개발할 때
title: "Zalo 개인 플러그인"
---

# Zalo 개인 (플러그인)

`zca-cli`를 사용하여 OpenClaw에서 Zalo 개인 계정을 자동화하는 플러그인을 통한 Zalo 개인 계정 지원입니다.

> **주의:** 비공식 자동화는 계정 정지/차단으로 이어질 수 있습니다. 자신의 책임 하에 사용하세요.

## 네이밍

채널 ID는 `zalouser`입니다. 이는 **개인 Zalo 사용자 계정**을 자동화한다는 점을 명확히 하기 위함입니다(비공식). 향후 공식 Zalo API 통합을 위해 `zalo`는 예약해 두고 있습니다.

## 실행 위치

이 플러그인은 **게이트웨이 프로세스 내부에서** 실행됩니다.

원격 게이트웨이를 사용하는 경우, **게이트웨이를 실행 중인 머신**에서 설치/설정한 후 게이트웨이를 다시 시작하세요.

## 설치

### 옵션 A: npm에서 설치

```bash
openclaw plugins install @openclaw/zalouser
```

그 후 게이트웨이를 다시 시작합니다.

### 옵션 B: 로컬 폴더에서 설치 (개발)

```bash
openclaw plugins install ./extensions/zalouser
cd ./extensions/zalouser && pnpm install
```

그 후 게이트웨이를 다시 시작합니다.

## 전제 조건: zca-cli

게이트웨이 머신의 `PATH`에 `zca`가 있어야 합니다:

```bash
zca --version
```

## 설정

채널 설정은 `channels.zalouser` 아래에 있습니다 (`plugins.entries.*` 아님):

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

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## 에이전트 도구

도구 이름: `zalouser`

작업: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

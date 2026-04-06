---
summary: "설정 가이드: 최신 상태를 유지하면서 OpenClaw 설정을 맞춤화하세요"
read_when:
  - 새 머신 설정 시
  - 개인 설정을 유지하면서 "최신 + 최고"를 원할 때
title: "설정"
---

# 설정

마지막 업데이트: 2026-01-01

## TL;DR

- **맞춤화는 레포 외부에:** `~/.openclaw/workspace` (워크스페이스) + `~/.openclaw/openclaw.json` (설정).
- **안정 워크플로우:** macOS 앱 설치; 번들된 게이트웨이를 실행하게 둠.
- **최신 개발 워크플로우:** `pnpm gateway:watch`로 게이트웨이를 직접 실행, 그런 다음 macOS 앱을 로컬 모드로 연결.

## 사전 요구사항 (소스에서)

- Node `>=22`
- `pnpm`
- Docker (선택사항; 컨테이너화된 설정/e2e용 — [Docker](/ko-KR/install/docker) 참조)

## 맞춤화 전략 (업데이트가 아프지 않도록)

"나에게 100% 맞춤화"_와_ 쉬운 업데이트를 원한다면, 사용자 정의를 다음에 유지하세요:

- **설정:** `~/.openclaw/openclaw.json` (JSON/JSON5 형식)
- **워크스페이스:** `~/.openclaw/workspace` (스킬, 프롬프트, 메모리; 비공개 git 레포로 만드세요)

한 번 부트스트랩:

```bash
openclaw setup
```

이 레포 내에서 로컬 CLI 진입점 사용:

```bash
openclaw setup
```

전역 설치가 없다면 `pnpm openclaw setup`으로 실행하세요.

## 안정 워크플로우 (macOS 앱 우선)

1. **OpenClaw.app** 설치 + 실행 (메뉴 바).
2. 온보딩/권한 체크리스트 완료 (TCC 프롬프트).
3. 게이트웨이가 **로컬**이고 실행 중인지 확인 (앱이 관리).
4. 서피스 연결 (예: WhatsApp):

```bash
openclaw channels login
```

5. 정상 확인:

```bash
openclaw health
```

빌드에서 온보딩을 사용할 수 없는 경우:

- `openclaw setup`을 실행한 다음 `openclaw channels login`, 그런 다음 게이트웨이를 수동으로 시작 (`openclaw gateway`).

## 최신 개발 워크플로우 (터미널에서 게이트웨이)

목표: TypeScript 게이트웨이 작업, 핫 리로드, macOS 앱 UI 연결 유지.

### 0) (선택사항) macOS 앱도 소스에서 실행

macOS 앱도 최신으로 원한다면:

```bash
./scripts/restart-mac.sh
```

### 1) 개발 게이트웨이 시작

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch`는 게이트웨이를 워치 모드로 실행하고 TypeScript 변경 시 리로드합니다.

### 2) macOS 앱을 실행 중인 게이트웨이에 연결

**OpenClaw.app**에서:

- 연결 모드: **로컬**
  앱이 설정된 포트에서 실행 중인 게이트웨이에 연결합니다.

### 3) 확인

- 앱 내 게이트웨이 상태가 **"Using existing gateway …"**로 표시되어야 함
- 또는 CLI로:

```bash
openclaw health
```

### 일반적인 실수

- **잘못된 포트:** 게이트웨이 WS 기본값은 `ws://127.0.0.1:18789`; 앱 + CLI를 같은 포트로 유지.
- **상태 저장 위치:**
  - 자격 증명: `~/.openclaw/credentials/`
  - 세션: `~/.openclaw/agents/<agentId>/sessions/`
  - 로그: `/tmp/openclaw/`

## 자격 증명 저장 맵

인증 디버깅 또는 백업할 항목 결정 시 사용:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 봇 토큰**: config/env 또는 `channels.telegram.tokenFile`
- **Discord 봇 토큰**: config/env (토큰 파일 아직 지원되지 않음)
- **Slack 토큰**: config/env (`channels.slack.*`)
- **페어링 허용목록**: `~/.openclaw/credentials/<channel>-allowFrom.json`
- **모델 인증 프로필**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **레거시 OAuth 임포트**: `~/.openclaw/credentials/oauth.json`
  자세한 내용: [보안](/ko-KR/gateway/security#credential-storage-map)

## 업데이트 (설정 망가뜨리지 않고)

- `~/.openclaw/workspace`와 `~/.openclaw/`를 "내 것"으로 유지; 개인 프롬프트/설정을 `openclaw` 레포에 넣지 마세요.
- 소스 업데이트: `git pull` + `pnpm install` (lockfile 변경 시) + `pnpm gateway:watch` 계속 사용.

## Linux (systemd 사용자 서비스)

Linux 설치는 systemd **사용자** 서비스를 사용합니다. 기본적으로 systemd는 로그아웃/유휴 시 사용자 서비스를 중지하여 게이트웨이를 종료합니다. 온보딩이 링거링을 활성화하려고 시도합니다 (sudo 프롬프트 가능). 여전히 꺼져 있다면:

```bash
sudo loginctl enable-linger $USER
```

항상 켜짐 또는 다중 사용자 서버의 경우 사용자 서비스 대신 **시스템** 서비스를 고려하세요 (링거링 필요 없음). systemd 참고사항은 [게이트웨이 런북](/ko-KR/gateway)을 참조하세요.

## 관련 문서

- [게이트웨이 런북](/ko-KR/gateway) (플래그, 감독, 포트)
- [게이트웨이 설정](/ko-KR/gateway/configuration) (설정 스키마 + 예제)
- [Discord](/ko-KR/channels/discord) 및 [Telegram](/ko-KR/channels/telegram) (답장 태그 + replyToMode 설정)
- [OpenClaw 어시스턴트 설정](/ko-KR/start/openclaw)
- [macOS 앱](/ko-KR/platforms/macos) (게이트웨이 라이프사이클)

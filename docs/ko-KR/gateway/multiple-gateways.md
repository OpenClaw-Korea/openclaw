---
summary: "한 호스트에서 여러 OpenClaw 게이트웨이 실행 (격리, 포트, 프로파일)"
read_when:
  - 동일한 머신에서 둘 이상의 게이트웨이 실행
  - 게이트웨이별로 격리된 설정/상태/포트가 필요한 경우
title: "다중 게이트웨이"
---

# 다중 게이트웨이 (동일 호스트)

대부분의 설정에서는 하나의 게이트웨이를 사용해야 합니다. 단일 게이트웨이가 여러 메시징 연결과 에이전트를 처리할 수 있기 때문입니다. 더 강력한 격리 또는 중복성 (예: 구조 봇)이 필요한 경우, 격리된 프로파일/포트로 별도의 게이트웨이를 실행하세요.

## 격리 체크리스트 (필수)

- `OPENCLAW_CONFIG_PATH` — 인스턴스별 설정 파일
- `OPENCLAW_STATE_DIR` — 인스턴스별 세션, 자격 증명, 캐시
- `agents.defaults.workspace` — 인스턴스별 워크스페이스 루트
- `gateway.port` (또는 `--port`) — 인스턴스별로 고유
- 파생 포트 (브라우저/캔버스)는 겹치지 않아야 함

이들이 공유되면 설정 경쟁 및 포트 충돌이 발생합니다.

## 권장 사항: 프로파일 (`--profile`)

프로파일은 `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH`를 자동으로 범위 지정하고 서비스 이름에 접미사를 붙입니다.

```bash
# main
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

프로파일별 서비스:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## 구조 봇 가이드

동일한 호스트에서 다음을 가진 두 번째 게이트웨이를 실행하세요:

- 프로파일/설정
- 상태 디렉토리
- 워크스페이스
- 기본 포트 (+ 파생 포트)

이렇게 하면 구조 봇이 메인 봇과 격리되어 주 봇이 다운된 경우 디버그하거나 설정 변경을 적용할 수 있습니다.

포트 간격: 기본 포트 사이에 최소 20개의 포트를 남겨 파생된 브라우저/캔버스/CDP 포트가 충돌하지 않도록 하세요.

### 설치 방법 (구조 봇)

```bash
# 메인 봇 (기존 또는 새로운, --profile 파라미터 없음)
# 포트 18789 + Chrome CDC/Canvas/... 포트에서 실행
openclaw onboard
openclaw gateway install

# 구조 봇 (격리된 프로파일 + 포트)
openclaw --profile rescue onboard
# 참고:
# - 워크스페이스 이름은 기본적으로 -rescue 접미사가 붙음
# - 포트는 최소 18789 + 20 포트여야 함,
#   완전히 다른 기본 포트 (예: 19789)를 선택하는 것이 좋음
# - 나머지 온보딩은 일반과 동일

# 서비스 설치 (온보딩 중 자동으로 발생하지 않은 경우)
openclaw --profile rescue gateway install
```

## 포트 매핑 (파생)

기본 포트 = `gateway.port` (또는 `OPENCLAW_GATEWAY_PORT` / `--port`).

- 브라우저 제어 서비스 포트 = 기본 + 2 (루프백 전용)
- `canvasHost.port = 기본 + 4`
- 브라우저 프로파일 CDP 포트는 `browser.controlPort + 9 .. + 108`에서 자동 할당

설정 또는 환경 변수에서 이들 중 하나를 재정의하는 경우, 인스턴스별로 고유하게 유지해야 합니다.

## 브라우저/CDP 참고 사항 (일반적인 실수)

- 여러 인스턴스에서 `browser.cdpUrl`을 동일한 값으로 고정하지 **마세요**.
- 각 인스턴스에는 자체 브라우저 제어 포트와 CDP 범위가 필요합니다 (게이트웨이 포트에서 파생).
- 명시적 CDP 포트가 필요한 경우, 인스턴스별로 `browser.profiles.<name>.cdpPort`를 설정하세요.
- 원격 Chrome: 인스턴스별, 프로파일별로 `browser.profiles.<name>.cdpUrl`을 사용하세요.

## 수동 환경 변수 예제

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## 빠른 확인

```bash
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

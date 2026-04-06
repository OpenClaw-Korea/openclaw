---
summary: "문제 해결 허브: 증상 → 점검 → 수정"
read_when:
  - 오류가 표시되고 수정 방법을 원하는 경우
  - 설치 프로그램이 "성공"이라고 하지만 CLI가 작동하지 않는 경우
title: "문제 해결"
---

# 문제 해결

## 처음 60초

다음을 순서대로 실행하세요.

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw logs --follow
openclaw doctor
```

게이트웨이에 연결 가능한 경우 심층 프로브:

```bash
openclaw status --deep
```

## 일반적인 "문제 발생" 사례

### `openclaw: command not found`

거의 항상 Node/npm PATH 문제입니다. 여기서 시작하세요.

- [설치 (Node/npm PATH 검증)](/install#nodejs--npm-path-sanity)

### 설치 프로그램 실패 (또는 전체 로그가 필요한 경우)

전체 추적 및 npm 출력을 보려면 자세한 모드에서 설치 프로그램을 다시 실행하세요.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
```

베타 설치의 경우:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
```

플래그 대신 `OPENCLAW_VERBOSE=1`을 설정할 수도 있습니다.

### 게이트웨이 "unauthorized", 연결할 수 없음 또는 계속 재연결

- [게이트웨이 문제 해결](/gateway/troubleshooting)
- [게이트웨이 인증](/gateway/authentication)

### HTTP에서 Control UI 실패 (장치 아이덴티티 필요)

- [게이트웨이 문제 해결](/gateway/troubleshooting)
- [Control UI](/web/control-ui#insecure-http)

### `docs.openclaw.ai`에 SSL 오류 표시 (Comcast/Xfinity)

일부 Comcast/Xfinity 연결은 Xfinity Advanced Security를 통해 `docs.openclaw.ai`를 차단합니다.
Advanced Security를 비활성화하거나 `docs.openclaw.ai`를 허용 목록에 추가한 후 다시 시도하세요.

- Xfinity Advanced Security 도움말: https://www.xfinity.com/support/articles/using-xfinity-xfi-advanced-security
- 빠른 확인: 모바일 핫스팟 또는 VPN을 시도하여 ISP 수준 필터링인지 확인

### 서비스가 실행 중이라고 하지만 RPC 프로브 실패

- [게이트웨이 문제 해결](/gateway/troubleshooting)
- [백그라운드 프로세스 / 서비스](/gateway/background-process)

### 모델/인증 실패 (요금 한도, 청구, "모든 모델 실패")

- [모델](/cli/models)
- [OAuth / 인증 개념](/concepts/oauth)

### `/model`이 `model not allowed`라고 표시

이는 일반적으로 `agents.defaults.models`가 허용 목록으로 설정되어 있음을 의미합니다. 비어 있지 않으면 해당 프로바이더/모델 키만 선택할 수 있습니다.

- 허용 목록 확인: `openclaw config get agents.defaults.models`
- 원하는 모델을 추가하거나 (또는 허용 목록 지우기) `/model`을 다시 시도하세요
- `/models`를 사용하여 허용된 프로바이더/모델을 탐색하세요

### 문제 제기 시

안전한 보고서 붙여넣기:

```bash
openclaw status --all
```

가능하면 `openclaw logs --follow`에서 관련 로그 테일을 포함하세요.

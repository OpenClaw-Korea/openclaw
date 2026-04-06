---
title: "Pi 개발 워크플로우"
---

# Pi 개발 워크플로우

이 가이드는 OpenClaw에서 pi 통합을 작업할 때 효율적인 워크플로우를 요약합니다.

## 타입 확인 및 린팅

- 타입 확인 및 빌드: `pnpm build`
- 린팅: `pnpm lint`
- 포맷 확인: `pnpm format`
- 푸시 전 전체 게이트: `pnpm lint && pnpm build && pnpm test`

## Pi 테스트 실행

pi 통합 테스트 세트를 위한 전용 스크립트를 사용합니다:

```bash
scripts/pi/run-tests.sh
```

실제 프로바이더 동작을 포함하는 라이브 테스트를 추가하려면:

```bash
scripts/pi/run-tests.sh --live
```

이 스크립트는 다음 글로브 패턴을 통해 모든 pi 관련 단위 테스트를 실행합니다:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-extensions/*.test.ts`

## 수동 테스트

권장하는 워크플로우입니다:

- 게이트웨이를 개발 모드로 실행합니다:
  - `pnpm gateway:dev`
- 에이전트를 직접 트리거합니다:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 대화형 디버깅을 위해 TUI를 사용합니다:
  - `pnpm tui`

도구 호출 동작의 경우, 도구 스트리밍 및 페이로드 처리를 확인할 수 있도록 `read` 또는 `exec` 동작을 프롬프트에 포함합니다.

## 깔끔한 초기화

상태는 OpenClaw 상태 디렉토리 아래에 저장됩니다. 기본값은 `~/.openclaw`입니다. `OPENCLAW_STATE_DIR`이 설정되어 있으면 해당 디렉토리를 대신 사용합니다.

모든 것을 초기화하려면:

- `openclaw.json` (설정)
- `credentials/` (인증 프로필 및 토큰)
- `agents/<agentId>/sessions/` (에이전트 세션 기록)
- `agents/<agentId>/sessions.json` (세션 인덱스)
- `sessions/` (레거시 경로가 존재하는 경우)
- `workspace/` (빈 작업공간을 원하는 경우)

세션만 초기화하려면, 해당 에이전트의 `agents/<agentId>/sessions/` 및 `agents/<agentId>/sessions.json`을 삭제합니다. 재인증을 원하지 않으면 `credentials/`는 유지합니다.

## 참조

- https://docs.openclaw.ai/testing
- https://docs.openclaw.ai/start/getting-started

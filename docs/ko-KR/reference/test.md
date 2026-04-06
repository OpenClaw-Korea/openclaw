---
summary: "로컬에서 테스트를 실행하는 방법(vitest) 및 force/coverage 모드 사용 시점"
read_when:
  - 테스트 실행 또는 수정 중
title: "테스트"
---

# 테스트

- 전체 테스트 키트(스위트, 라이브, Docker): [테스트](/testing)

- `pnpm test:force`: 기본 제어 포트를 점유하고 있는 게이트웨이 프로세스를 강제 종료한 후, 격리된 게이트웨이 포트로 전체 Vitest 스위트를 실행하여 서버 테스트가 실행 중인 인스턴스와 충돌하지 않도록 합니다. 이전 게이트웨이 실행이 포트 18789를 점유한 경우 이 명령을 사용합니다.
- `pnpm test:coverage`: V8 커버리지를 사용하여 Vitest를 실행합니다. 전역 임계값은 라인/브랜치/함수/명령문 70%입니다. 커버리지는 통합이 많은 진입점(CLI 배선, 게이트웨이/Telegram 브리지, webchat 정적 서버)을 제외하여 단위 테스트 가능한 로직에 집중합니다.
- `pnpm test:e2e`: 게이트웨이 엔드-투-엔드 스모크 테스트(다중 인스턴스 WS/HTTP/노드 페어링)를 실행합니다.
- `pnpm test:live`: 프로바이더 라이브 테스트(minimax/zai)를 실행합니다. API 키와 `LIVE=1`(또는 프로바이더별 `*_LIVE_TEST=1`)이 필요합니다.

## 모델 레이턴시 벤치마크(로컬 키)

스크립트: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

사용 방법:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 선택 사항 환경 변수: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- 기본 프롬프트: "Reply with a single word: ok. No punctuation or extra text."

마지막 실행(2025-12-31, 20회):

- minimax 중앙값 1279ms(최소 1114, 최대 2431)
- opus 중앙값 2454ms(최소 1224, 최대 3170)

## 온보딩 E2E(Docker)

Docker는 선택 사항입니다. 이는 컨테이너화된 온보딩 스모크 테스트에만 필요합니다.

깨끗한 Linux 컨테이너에서 전체 콜드 스타트 흐름:

```bash
scripts/e2e/onboard-docker.sh
```

이 스크립트는 의사 TTY를 통해 대화형 마법사를 진행하고, 설정/작업 공간/세션 파일을 확인한 후, 게이트웨이를 시작하고 `openclaw health`를 실행합니다.

## QR 가져오기 스모크(Docker)

Node 22+ 에서 Docker에서 `qrcode-terminal`이 로드되는지 확인합니다:

```bash
pnpm test:docker:qr
```

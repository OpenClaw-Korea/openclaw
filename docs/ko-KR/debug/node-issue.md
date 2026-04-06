---
summary: Node + tsx "__name is not a function" 충돌 문제 및 해결 방법
read_when:
  - Node 전용 개발 스크립트 또는 감시 모드 오류 디버깅 시
  - OpenClaw의 tsx/esbuild 로더 충돌 조사 시
title: "Node + tsx 충돌 문제"
---

# Node + tsx "\_\_name is not a function" 충돌 문제

## 요약

OpenClaw를 `tsx`와 함께 Node로 실행하면 시작 시 다음 오류로 인해 실패합니다.

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

이 문제는 개발 스크립트를 Bun에서 `tsx`로 변경한 후에 나타났습니다(커밋 `2871657e`, 2026-01-06). 동일한 런타임 경로는 Bun에서는 정상적으로 작동했습니다.

## 환경

- Node: v25.x (v25.3.0에서 확인됨)
- tsx: 4.21.0
- OS: macOS (다른 플랫폼에서도 Node 25를 실행하는 경우 재현 가능)

## 재현 (Node 전용)

```bash
# 저장소 루트에서
node --version
pnpm install
node --import tsx src/entry.ts status
```

## 저장소의 최소 재현 예제

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node 버전 확인

- Node 25.3.0: 실패
- Node 22.22.0 (Homebrew `node@22`): 실패
- Node 24: 아직 설치되지 않았으며 검증 필요

## 참고 사항 / 가설

- `tsx`는 esbuild를 사용하여 TS/ESM을 변환합니다. esbuild의 `keepNames` 옵션은 `__name` 헬퍼를 생성하고 함수 정의를 `__name(...)`로 래핑합니다.
- 충돌은 `__name`이 존재하지만 런타임에 함수가 아님을 나타내므로, 이는 Node 25 로더 경로에서 헬퍼가 누락되었거나 덮어씌워졌음을 의미합니다.
- 유사한 `__name` 헬퍼 문제는 다른 esbuild 사용자에게서도 헬퍼가 누락되었거나 다시 작성된 경우에 보고되었습니다.

## 회귀 이력

- `2871657e` (2026-01-06): 스크립트를 Bun에서 tsx로 변경하여 Bun을 선택 사항으로 만들었습니다.
- 그 이전 (Bun 경로)에는 `openclaw status`와 `gateway:watch`가 정상 작동했습니다.

## 해결 방법

- 개발 스크립트에 Bun 사용 (현재 임시 되돌리기).
- Node + tsc 감시를 사용한 다음 컴파일된 결과물 실행:
  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```
- 로컬에서 확인됨: `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status`가 Node 25에서 작동합니다.
- TS 로더에서 esbuild keepNames 비활성화 (필요한 경우) (`__name` 헬퍼 삽입 방지); tsx는 현재 이를 노출하지 않습니다.
- Node LTS (22/24)와 `tsx`를 테스트하여 문제가 Node 25 특정인지 확인합니다.

## 참조

- https://opennext.js.org/cloudflare/howtos/keep_names
- https://esbuild.github.io/api/#keep-names
- https://github.com/evanw/esbuild/issues/1031

## 다음 단계

- Node 22/24에서 재현하여 Node 25 회귀 여부를 확인합니다.
- `tsx` 야간 빌드를 테스트하거나 알려진 회귀 존재 시 이전 버전으로 고정합니다.
- Node LTS에서 재현되면 `__name` 스택 추적과 함께 최소 재현 예제를 업스트림에 등록합니다.

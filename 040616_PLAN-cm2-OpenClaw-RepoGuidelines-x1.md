---
title: OpenClaw Repository Guidelines — Plan
created_date: 2026-04-06 16:00
AI_Model_Name: Claude Opus 4.6
사용자_요청사항: AGENTS.md 기반 cm1 cm2 CPSC 문서 생성
내용_요약: OpenClaw 아키텍처 경계 6종의 구현 구조, 빌드/테스트/린트 파이프라인, 개발 워크플로우 실행 계획
---

# OpenClaw Repository Guidelines — Plan

Ref: [[040616_CONCP-cm1-OpenClaw-RepoGuidelines-x0]]
#status/planning #architecture #guidelines

## TL;DR

6개 아키텍처 경계를 Plugin SDK 계약, 린트 규칙, contract test로 집행하며, tsdown → oxlint → vitest → prek 파이프라인으로 검증한다.

## 아키텍처

### 전체 플로우

```
┌─────────────────────────────────────────────────────┐
│  Core (src/)                                        │
│  ├── plugin-sdk/*  ← 유일한 공개 계약               │
│  ├── channels/*    ← 코어 채널 구현 (내부)           │
│  ├── plugins/*     ← 레지스트리/로더/검증             │
│  └── gateway/protocol/* ← typed wire protocol       │
├─────────────────────────────────────────────────────┤
│  Extensions (extensions/)  49개 번들 플러그인        │
│  → openclaw/plugin-sdk/* + local api.ts만 import    │
│  → 서드파티도 동일 계약 준수                         │
├─────────────────────────────────────────────────────┤
│  Apps (apps/)  electron-node, macos, ios, android   │
│  → 각각 독립 빌드/tsconfig, root oxlint 제외        │
├─────────────────────────────────────────────────────┤
│  Skills (skills/)  55+ Python, pytest               │
│  → npm 배포 미포함, 독립 실행                        │
└─────────────────────────────────────────────────────┘
```

### 핵심 설계

- **Plugin SDK 단일 진입점**: `openclaw/plugin-sdk/*`가 extension↔core 유일 계약
- **Progressive Disclosure**: 각 모듈에 로컬 `AGENTS.md`로 경계 규칙 분산
- **레지스트리 기반**: hardcoded id 리스트 대신 manifest/capability/registry 패턴

## Phase 1: 아키텍처 경계 집행

### 목표

6개 경계를 린트 + contract test로 자동 검증

### 구현

**경계별 집행 수단:**

| 경계             | 린트 규칙                                   | Contract Test                 | 로컬 가이드                      |
| ---------------- | ------------------------------------------- | ----------------------------- | -------------------------------- |
| Plugin/Extension | `lint:extensions:no-src-outside-plugin-sdk` | `test:contracts`              | `extensions/AGENTS.md`           |
| Channel          | `lint:plugins:no-extension-imports`         | channel contract tests        | `src/channels/AGENTS.md`         |
| Provider/Model   | plugin-sdk provider-entry types             | provider registration tests   | Provider docs                    |
| Gateway Protocol | schema.ts typed definitions                 | protocol versioning           | `src/gateway/protocol/AGENTS.md` |
| Config           | zod schema + baseline drift                 | `config:schema:gen` / `check` | Config docs                      |
| Extension Test   | test boundary lint                          | extension-scoped tests        | `src/plugins/AGENTS.md`          |

**워크플로우:**

1. 코드 작성 시 `openclaw/plugin-sdk/*`만 import
2. `pnpm check` → oxlint + 경계 린트 자동 실행
3. `pnpm test:contracts` → 계약 위반 검출
4. CI `check-additional` → 아키텍처 policy guard 집행

### 완료 기준

- [ ] 모든 extension이 plugin-sdk 계약만 사용
- [ ] core에 extension-specific hardcoded id 없음
- [ ] contract test 전체 통과

## Phase 2: 빌드/테스트/린트 파이프라인

### 목표

로컬 개발 → CI → 릴리스까지 일관된 검증 체인

### 구현

**Gate 체계:**

| Gate        | 명령어                                                   | 용도                     |
| ----------- | -------------------------------------------------------- | ------------------------ |
| Local dev   | `pnpm check`                                             | 편집 루프 기본           |
| Formatting  | `pnpm format`                                            | pre-commit hook 선행     |
| Landing     | `pnpm check` + `pnpm test` + (빌드 영향 시) `pnpm build` | main push 전             |
| CI          | `check` + `check-additional` + `build-smoke`             | PR/push 자동             |
| Fast commit | `FAST_COMMIT=1 git commit`                               | hook 스킵 (수동 검증 시) |

**Vitest 구성 (7종):**

- Unit: `vitest.config.ts` (기본)
- Channels: `vitest.channels.config.ts`
- Bundled: `vitest.bundled.config.ts`
- Contracts: `vitest.contracts.config.ts`
- E2E: Playwright
- Docker: `test:docker:*` 시리즈
- Live: `OPENCLAW_LIVE_TEST=1` / `LIVE=1`

**성능 가드레일:**

- `vi.resetModules()` + `await import(...)` 반복 금지 → `beforeAll` 1회 import
- broad barrel partial-mock 금지 → narrow `*.runtime.ts` seam mock
- worker 16 초과 금지
- pool: 기본 threads, gateway/agents/commands는 forks

### 완료 기준

- [ ] `pnpm check` + `pnpm test` 그린
- [ ] `pnpm build` 빌드 영향 변경 시 통과
- [ ] `[INEFFECTIVE_DYNAMIC_IMPORT]` 경고 없음

## Phase 3: 코딩 스타일 & 안전 규칙

### 목표

TypeScript ESM strict 기반 일관된 코딩 표준

### 구현

**핵심 규칙:**

- `any` 금지 → `unknown` 또는 narrow adapter
- `@ts-nocheck` 금지, inline suppress 기본 금지
- external boundary에 `zod` 검증 (config, webhook, CLI output, 3rd-party API)
- discriminated union 선호 (파라미터 shape 분기)
- `Result<T, E>` 스타일 + closed error-code union
- freeform string branching 금지 → closed code union
- dynamic import: `*.runtime.ts` 경계 분리, static/dynamic 혼용 금지
- prototype mutation 금지 → explicit inheritance/composition
- 파일 ~700 LOC 이하 가이드라인

**Prompt Cache 안정성:**

- map/set/registry → 결정론적 정렬 후 request 조립
- transcript prefix 바이트 보존, tail부터 truncation

### 완료 기준

- [ ] `no-explicit-any` error 레벨 유지
- [ ] 새 코드에 freeform string branching 없음

## Phase 4: 개발 워크플로우 & 멀티에이전트 안전

### 목표

다수 에이전트/커미터가 동시 작업 시 충돌 방지

### 구현

**커밋 규칙:**

- `scripts/committer "<msg>" <file...>` 사용 (수동 git add/commit 지양)
- 관련 변경 그룹화, 비관련 리팩터 번들 금지
- rebase only (merge commit on main 금지)

**멀티에이전트 안전:**

- `git stash` 생성/적용/삭제 금지 (명시 요청 제외)
- `git worktree` 생성/삭제 금지 (명시 요청 제외)
- 브랜치 전환 금지 (명시 요청 제외)
- "push" → `git pull --rebase` 허용, 타 에이전트 작업 보존
- "commit" → 본인 변경만 스코프
- 미식별 파일 발견 시 → 무시하고 계속 진행

**린트/포맷 자동화:**

- 포맷팅 전용 diff → 질문 없이 자동 해결
- 커밋/푸시 요청 시 → 포맷팅 후속 자동 포함
- 시맨틱 변경만 확인 요청

### 완료 기준

- [ ] `scripts/committer` 사용
- [ ] stash/worktree/branch 무단 변경 없음
- [ ] 포맷팅 diff 자동 해결

## 배포 전략

### 환경 분리

- Local: `pnpm check` + scoped test
- CI: GitHub Actions preflight routing (docs-only, node, macos, android 분기)
- Release: `$openclaw-release-maintainer` 스킬, 별도 private maintainers 레포 런북

### 배포 단계

**1단계: 로컬 검증**

- [ ] `pnpm check` 통과
- [ ] 영향 범위 scoped test 통과
- [ ] 빌드 영향 시 `pnpm build` 통과

**2단계: CI 검증**

- [ ] preflight → 해당 lane job 통과
- [ ] `check-additional` 아키텍처 guard 통과

## 데이터 검증

- Config schema drift: `pnpm config:docs:gen` / `pnpm config:docs:check`
- Plugin SDK API drift: `pnpm plugin-sdk:api:gen` / `pnpm plugin-sdk:api:check`
- Baseline drift: `docs/.generated/*.sha256` 해시 파일 커밋
- 변경 시 gen 명령 실행 → 업데이트된 `.sha256` 커밋

## 롤백 계획

### Trigger 조건

- `pnpm check` 또는 `pnpm test` 실패
- `[INEFFECTIVE_DYNAMIC_IMPORT]` 경고 발생
- contract test 경계 위반 감지
- 서드파티 플러그인 호환성 파괴

### 롤백 절차

1. 해당 커밋 revert (merge commit 아닌 rebase 기반)
2. `pnpm check` + `pnpm test` 그린 확인
3. 빌드 영향 시 `pnpm build` 재검증
4. 레거시 설정 영향 시 `openclaw doctor --fix` 확인

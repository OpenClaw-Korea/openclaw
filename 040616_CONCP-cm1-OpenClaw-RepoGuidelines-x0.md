---
title: OpenClaw Repository Guidelines — Concept
created_date: 2026-04-06 16:00
AI_Model_Name: Claude Opus 4.6
사용자_요청사항: AGENTS.md 기반 cm1 cm2 CPSC 문서 생성
내용_요약: OpenClaw 레포지토리의 아키텍처 경계, 플러그인 시스템, 코딩 규칙의 존재 이유와 범위 정리
---

# OpenClaw Repository Guidelines — Concept

Ref: [[040616_PLAN-cm2-OpenClaw-RepoGuidelines-x1]]
#status/planning #architecture #guidelines

## TL;DR

OpenClaw은 멀티채널 AI 게이트웨이로, 49개 번들 플러그인 + 서드파티 플러그인 생태계를 위해 엄격한 아키텍처 경계와 계약(contract) 기반 설계를 채택한다.

## 왜 필요한가?

### 현재 구조

OpenClaw은 단일 모노레포에 코어(`src/`), 49개 번들 플러그인(`extensions/`), 네이티브 앱 4종(`apps/`), Python 스킬 55개(`skills/`), Next.js UI(`ui/`), Mintlify 문서(`docs/`)를 포함하는 대규모 프로젝트다.

### 핵심 문제

- 코어와 플러그인이 경계 없이 섞이면, 플러그인 추가 시 코어 수정이 필요해지고 서드파티 플러그인이 깨진다
- 프로토콜 변경이 무분별하면 클라이언트 호환성이 파괴된다
- 레거시 설정 마이그레이션이 런타임에 퍼지면 예측 불가능한 부작용이 생긴다

**해결 원칙:**

- 코어는 extension-agnostic 유지
- 플러그인은 `openclaw/plugin-sdk/*`만 통해 코어 접근
- 프로토콜 변경은 additive evolution 우선
- 레거시 설정은 `openclaw doctor --fix`로 격리

## 무엇을 하는가?

### 범위

**포함:**

- 6개 아키텍처 경계 (Plugin, Channel, Provider, Gateway Protocol, Config, Extension Test)
- Plugin SDK 계약 (`openclaw/plugin-sdk/*`)
- 빌드/테스트/린트 파이프라인 (tsdown, oxlint, vitest 7종, prek)
- 코딩 스타일 (TypeScript ESM, strict, no-any, zod boundary validation)
- 커밋/PR 워크플로우 (scripts/committer, PR template)
- 멀티에이전트 안전 규칙 (stash 금지, 브랜치 전환 금지)
- Prompt cache 안정성 가드레일

**제외:**

- 개별 플러그인 내부 구현 상세
- 릴리스 실행 런북 (별도 private maintainers 레포)
- 인프라/배포 구성 상세

## 기대 효과

1. **플러그인 생태계 안정**: 서드파티 플러그인이 코어 변경에 깨지지 않음
2. **개발 속도**: 경계가 명확하여 독립적 작업 가능, CI preflight로 변경 범위만 검증
3. **코드 품질**: oxlint + 경계 린트 + contract test로 자동 위반 감지
4. **안전한 협업**: 멀티에이전트/멀티커미터 환경에서 충돌 최소화

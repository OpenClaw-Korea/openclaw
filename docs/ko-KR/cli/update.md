---
summary: "`openclaw update` CLI 참조 (안전한 소스 업데이트 + 게이트웨이 자동 재시작)"
read_when:
  - 소스 체크아웃을 안전하게 업데이트하고 싶을 때
  - `--update` 단축 명령어 동작을 이해해야 할 때
title: "update"
---

# `openclaw update`

OpenClaw를 안전하게 업데이트하고 stable/beta/dev 채널 간 전환합니다.

**npm/pnpm**으로 설치한 경우 (전역 설치, git 메타데이터 없음), 업데이트는 [업데이트](/install/updating)의 패키지 매니저 플로우를 통해 이루어집니다.

## 사용법

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --no-restart
openclaw update --json
openclaw --update
```

## 옵션

- `--no-restart`: 업데이트 성공 후 게이트웨이 서비스 재시작을 건너뜁니다.
- `--channel <stable|beta|dev>`: 업데이트 채널을 설정합니다 (git + npm; 설정에 저장됨).
- `--tag <dist-tag|version>`: 이번 업데이트에만 npm dist-tag 또는 버전을 재정의합니다.
- `--json`: 기계 판독 가능한 `UpdateRunResult` JSON을 출력합니다.
- `--timeout <seconds>`: 단계별 타임아웃 (기본값은 1200초).

참고: 다운그레이드는 구버전이 설정을 손상시킬 수 있으므로 확인이 필요합니다.

## `update status`

활성 업데이트 채널 + git 태그/브랜치/SHA (소스 체크아웃의 경우)와 업데이트 가용성을 표시합니다.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

옵션:

- `--json`: 기계 판독 가능한 상태 JSON을 출력합니다.
- `--timeout <seconds>`: 확인 타임아웃 (기본값은 3초).

## `update wizard`

업데이트 채널을 선택하고 업데이트 후 게이트웨이 재시작 여부를 확인하는 대화형 플로우입니다 (기본값은 재시작). git 체크아웃 없이 `dev`를 선택하면 생성을 제안합니다.

## 동작 방식

채널을 명시적으로 전환할 때 (`--channel ...`), OpenClaw는 설치 방법도 함께 맞춥니다:

- `dev` → git 체크아웃 확보 (기본값: `~/openclaw`, `OPENCLAW_GIT_DIR`로 재정의 가능),
  업데이트 후, 해당 체크아웃에서 전역 CLI를 설치합니다.
- `stable`/`beta` → 일치하는 dist-tag를 사용하여 npm에서 설치합니다.

## Git 체크아웃 플로우

채널:

- `stable`: 최신 비베타 태그를 체크아웃한 후 빌드 + doctor 실행.
- `beta`: 최신 `-beta` 태그를 체크아웃한 후 빌드 + doctor 실행.
- `dev`: `main`을 체크아웃한 후 fetch + rebase.

상위 수준:

1. 깨끗한 워크트리 필요 (커밋되지 않은 변경사항 없음).
2. 선택한 채널로 전환 (태그 또는 브랜치).
3. 업스트림 fetch (dev만 해당).
4. Dev만 해당: 임시 워크트리에서 프리플라이트 린트 + TypeScript 빌드; 최신 커밋이 실패하면 최대 10개 커밋을 되돌아가며 최신의 깨끗한 빌드를 찾습니다.
5. 선택한 커밋으로 rebase (dev만 해당).
6. 의존성 설치 (pnpm 우선; npm 폴백).
7. 빌드 + Control UI 빌드.
8. 최종 "안전 업데이트" 확인으로 `openclaw doctor` 실행.
9. 플러그인을 활성 채널에 동기화 (dev는 번들 익스텐션 사용; stable/beta는 npm 사용)하고 npm으로 설치된 플러그인을 업데이트합니다.

## `--update` 단축 명령어

`openclaw --update`는 `openclaw update`로 재작성됩니다 (셸 및 런처 스크립트에 유용).

## 참조

- `openclaw doctor` (git 체크아웃에서 업데이트를 먼저 실행할 것을 제안)
- [개발 채널](/install/development-channels)
- [업데이트](/install/updating)
- [CLI 참조](/cli)

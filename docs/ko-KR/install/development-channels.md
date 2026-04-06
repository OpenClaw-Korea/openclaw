---
summary: "Stable, beta, dev 채널: 의미, 전환, 태깅"
read_when:
  - stable/beta/dev 간 전환하려는 경우
  - 프리릴리스 태깅 또는 게시하는 경우
title: "개발 채널"
---

# 개발 채널

마지막 업데이트: 2026-01-21

OpenClaw는 세 가지 업데이트 채널을 제공합니다:

- **stable**: npm dist-tag `latest`.
- **beta**: npm dist-tag `beta` (테스트 중인 빌드).
- **dev**: `main`의 이동하는 헤드 (git). npm dist-tag: `dev` (게시 시).

**beta**에 빌드를 배포하고 테스트한 다음, **검증된 빌드를 `latest`로 승격**합니다
버전 번호 변경 없이 — dist-tag가 npm 설치의 진실의 원천입니다.

## 채널 전환

Git 체크아웃:

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

- `stable`/`beta`는 최신 일치 태그를 체크아웃합니다 (종종 동일한 태그).
- `dev`는 `main`으로 전환하고 업스트림에서 리베이스합니다.

npm/pnpm 글로벌 설치:

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

해당 npm dist-tag (`latest`, `beta`, `dev`)를 통해 업데이트합니다.

`--channel`로 **명시적으로** 채널을 전환하면 OpenClaw는 설치 방법도 정렬합니다:

- `dev`는 git 체크아웃 보장 (기본값 `~/openclaw`, `OPENCLAW_GIT_DIR`로 재정의),
  업데이트하고 해당 체크아웃에서 글로벌 CLI 설치.
- `stable`/`beta`는 일치하는 dist-tag를 사용하여 npm에서 설치.

팁: stable + dev를 병렬로 사용하려면 두 개의 클론을 유지하고 게이트웨이를 stable 클론에 연결하세요.

## 플러그인과 채널

`openclaw update`로 채널을 전환하면 OpenClaw는 플러그인 소스도 동기화합니다:

- `dev`는 git 체크아웃에서 번들된 플러그인 선호.
- `stable`과 `beta`는 npm 설치 플러그인 패키지 복원.

## 태깅 모범 사례

- git 체크아웃이 도달하려는 릴리스 태그 (`vYYYY.M.D` 또는 `vYYYY.M.D-<patch>`).
- 태그를 불변으로 유지: 태그를 이동하거나 재사용하지 마세요.
- npm dist-tag는 npm 설치의 진실의 원천으로 남습니다:
  - `latest` → stable
  - `beta` → 후보 빌드
  - `dev` → main 스냅샷 (선택 사항)

## macOS 앱 가용성

Beta 및 dev 빌드에는 macOS 앱 릴리스가 **포함되지 않을 수** 있습니다. 괜찮습니다:

- git 태그와 npm dist-tag는 여전히 게시될 수 있습니다.
- 릴리스 노트 또는 체인지로그에 "이 베타에는 macOS 빌드 없음"을 명시하세요.

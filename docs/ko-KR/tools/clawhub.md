---
summary: "ClawHub 가이드: 공개 스킬 레지스트리 + CLI 워크플로우"
read_when:
  - ClawHub을 새로운 사용자에게 소개할 때
  - 스킬을 설치, 검색 또는 게시할 때
  - ClawHub CLI 플래그 및 동기화 동작을 설명할 때
title: "ClawHub"
---

# ClawHub

ClawHub은 **OpenClaw를 위한 공개 스킬 레지스트리입니다**. 무료 서비스이며, 모든 스킬은 공개되어 있고 누구나 공유 및 재사용할 수 있습니다. 스킬은 `SKILL.md` 파일과 함께 지원 파일을 포함한 폴더일 뿐입니다. 웹 앱에서 스킬을 검색하거나 CLI를 사용하여 스킬을 검색, 설치, 업데이트 및 게시할 수 있습니다.

사이트: [clawhub.ai](https://clawhub.ai)

## ClawHub이란

- OpenClaw 스킬을 위한 공개 레지스트리입니다.
- 스킬 번들 및 메타데이터의 버전 관리 저장소입니다.
- 검색, 태그 및 사용 신호에 대한 검색 기능입니다.

## 작동 방식

1. 사용자가 스킬 번들(파일 + 메타데이터)을 게시합니다.
2. ClawHub이 번들을 저장하고, 메타데이터를 분석하며, 버전을 할당합니다.
3. 레지스트리가 검색 및 검색을 위해 스킬을 인덱싱합니다.
4. 사용자가 OpenClaw에서 스킬을 검색, 다운로드 및 설치합니다.

## 할 수 있는 것

- 새로운 스킬과 기존 스킬의 새 버전을 게시합니다.
- 이름, 태그 또는 검색으로 스킬을 검색합니다.
- 스킬 번들을 다운로드하고 파일을 검사합니다.
- 학대 또는 부적절한 스킬을 신고합니다.
- 중재자인 경우 스킬을 숨기거나, 숨김 해제하거나, 삭제하거나, 사용자를 차단할 수 있습니다.

## 이용 대상 (초보자 친화적)

OpenClaw 에이전트에 새로운 기능을 추가하고 싶다면, ClawHub은 스킬을 찾고 설치하는 가장 쉬운 방법입니다. 백엔드 작동 방식을 알 필요가 없습니다. 다음을 수행할 수 있습니다.

- 일반 언어로 스킬을 검색합니다.
- 스킬을 워크스페이스에 설치합니다.
- 나중에 한 명령으로 스킬을 업데이트합니다.
- 자신의 스킬을 게시하여 백업합니다.

## 빠른 시작 (비기술적)

1. CLI를 설치합니다(다음 섹션 참조).
2. 필요한 것을 검색합니다.
   - `clawhub search "calendar"`
3. 스킬을 설치합니다.
   - `clawhub install <skill-slug>`
4. 새 OpenClaw 세션을 시작하여 새로운 스킬을 반영합니다.

## CLI 설치

다음 중 하나를 선택합니다.

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## OpenClaw에 적합한 방식

기본적으로 CLI는 현재 작업 디렉터리 아래 `./skills`에 스킬을 설치합니다. OpenClaw 워크스페이스가 구성된 경우, `--workdir`(또는 `CLAWHUB_WORKDIR`)를 재정의하지 않으면 `clawhub`이 해당 워크스페이스로 돌아갑니다. OpenClaw는 `<workspace>/skills`에서 워크스페이스 스킬을 로드하며 **다음** 세션에서 이를 선택합니다. `~/.openclaw/skills` 또는 번들된 스킬을 이미 사용하는 경우, 워크스페이스 스킬이 우선순위를 갖습니다.

스킬이 로드, 공유 및 제어되는 방식에 대한 자세한 내용은 [스킬](/tools/skills)을 참조하세요.

## 스킬 시스템 개요

스킬은 OpenClaw에 특정 작업을 수행하는 방법을 알려주는 파일의 버전 관리 번들입니다. 각 게시는 새로운 버전을 생성하며, 레지스트리는 사용자가 변경 사항을 감사할 수 있도록 버전 기록을 유지합니다.

일반적인 스킬에는 다음이 포함됩니다.

- 기본 설명 및 사용법이 있는 `SKILL.md` 파일입니다.
- 스킬에서 사용하는 선택적 설정, 스크립트 또는 지원 파일입니다.
- 태그, 요약 및 설치 요구사항과 같은 메타데이터입니다.

ClawHub은 메타데이터를 사용하여 검색을 강화하고 스킬 기능을 안전하게 노출합니다. 레지스트리는 또한 순위 및 가시성을 개선하기 위해 사용 신호(예: 별과 다운로드)를 추적합니다.

## 서비스가 제공하는 기능

- 스킬 및 해당 `SKILL.md` 콘텐츠의 **공개 검색**.
- 키워드가 아닌 임베딩(벡터 검색)으로 구동되는 **검색**.
- **버전 관리** - semver, 변경 로그 및 태그(`latest` 포함).
- 버전당 **다운로드** - zip으로 제공.
- 커뮤니티 피드백을 위한 **별 및 댓글**.
- 승인 및 감사를 위한 **중재** 훅입니다.
- 자동화 및 스크립팅을 위한 **CLI 친화적 API**.

## 보안 및 중재

ClawHub은 기본적으로 개방되어 있습니다. 누구나 스킬을 업로드할 수 있지만, 게시하려면 GitHub 계정이 최소 1주일 된 계정이어야 합니다. 이것은 정당한 기여자를 차단하지 않으면서 악용을 늦추는 데 도움이 됩니다.

신고 및 중재:

- 로그인한 사용자는 누구나 스킬을 신고할 수 있습니다.
- 신고 이유는 필수이며 기록됩니다.
- 각 사용자는 최대 20개의 활성 신고를 할 수 있습니다.
- 3개 이상의 고유한 신고가 있는 스킬은 기본적으로 자동으로 숨겨집니다.
- 중재자는 숨겨진 스킬을 보거나, 숨김 해제하거나, 삭제하거나, 사용자를 차단할 수 있습니다.
- 신고 기능 악용은 계정 금지로 이어질 수 있습니다.

중재자가 되는 데 관심이 있으신가요? OpenClaw Discord에서 중재자 또는 관리자에게 문의하세요.

## CLI 명령 및 매개변수

전역 옵션(모든 명령에 적용):

- `--workdir <dir>`: 작업 디렉터리(기본값: 현재 디렉터리; OpenClaw 워크스페이스로 돌아감).
- `--dir <dir>`: workdir에 상대적인 스킬 디렉터리(기본값: `skills`).
- `--site <url>`: 사이트 기본 URL(브라우저 로그인).
- `--registry <url>`: 레지스트리 API 기본 URL입니다.
- `--no-input`: 프롬프트 비활성화(비대화형).
- `-V, --cli-version`: CLI 버전을 출력합니다.

인증:

- `clawhub login`(브라우저 흐름) 또는 `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

옵션:

- `--token <token>`: API 토큰을 붙여넣습니다.
- `--label <label>`: 브라우저 로그인 토큰에 저장된 레이블(기본값: `CLI token`).
- `--no-browser`: 브라우저를 열지 않습니다(`--token` 필수).

검색:

- `clawhub search "query"`
- `--limit <n>`: 최대 결과 수입니다.

설치:

- `clawhub install <slug>`
- `--version <version>`: 특정 버전을 설치합니다.
- `--force`: 폴더가 이미 존재하면 덮어씁니다.

업데이트:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: 특정 버전으로 업데이트합니다(단일 슬러그만).
- `--force`: 로컬 파일이 게시된 버전과 일치하지 않으면 덮어씁니다.

목록:

- `clawhub list`(`.clawhub/lock.json` 읽기)

게시:

- `clawhub publish <path>`
- `--slug <slug>`: 스킬 슬러그입니다.
- `--name <name>`: 표시 이름입니다.
- `--version <version>`: Semver 버전입니다.
- `--changelog <text>`: 변경 로그 텍스트(비워둘 수 있음).
- `--tags <tags>`: 쉼표로 구분된 태그(기본값: `latest`).

삭제/삭제 취소(소유자/관리자만):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

동기화(로컬 스킬 검사 + 새로운/업데이트된 스킬 게시):

- `clawhub sync`
- `--root <dir...>`: 추가 스캔 루트입니다.
- `--all`: 프롬프트 없이 모든 항목을 업로드합니다.
- `--dry-run`: 업로드될 항목을 표시합니다.
- `--bump <type>`: 업데이트의 경우 `patch|minor|major`(기본값: `patch`).
- `--changelog <text>`: 비대화형 업데이트를 위한 변경 로그입니다.
- `--tags <tags>`: 쉼표로 구분된 태그(기본값: `latest`).
- `--concurrency <n>`: 레지스트리 확인(기본값: 4).

## 에이전트를 위한 일반적인 워크플로우

### 스킬 검색

```bash
clawhub search "postgres backups"
```

### 새로운 스킬 다운로드

```bash
clawhub install my-skill-pack
```

### 설치된 스킬 업데이트

```bash
clawhub update --all
```

### 스킬 백업(게시 또는 동기화)

단일 스킬 폴더의 경우:

```bash
clawhub publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

한 번에 많은 스킬을 검사하고 백업합니다.

```bash
clawhub sync --all
```

## 고급 세부사항(기술적)

### 버전 관리 및 태그

- 각 게시는 새로운 **semver** `SkillVersion`을 만듭니다.
- 태그(예: `latest`)는 버전을 가리킵니다. 태그를 이동하면 롤백할 수 있습니다.
- 변경 로그는 버전당 첨부되며 동기화 또는 업데이트 게시 시 비워둘 수 있습니다.

### 로컬 변경사항 대 레지스트리 버전

업데이트는 콘텐츠 해시를 사용하여 로컬 스킬 콘텐츠를 레지스트리 버전과 비교합니다. 로컬 파일이 게시된 버전과 일치하지 않으면, CLI가 덮어쓰기 전에 확인합니다(비대화형 실행에서는 `--force` 필요).

### 동기화 스캔 및 대체 루트

`clawhub sync`는 먼저 현재 workdir을 스캔합니다. 스킬을 찾을 수 없으면 알려진 레거시 위치(예: `~/openclaw/skills` 및 `~/.openclaw/skills`)로 돌아갑니다. 이것은 추가 플래그 없이 오래된 스킬 설치를 찾도록 설계되었습니다.

### 저장소 및 잠금 파일

- 설치된 스킬은 workdir의 `.clawhub/lock.json`에 기록됩니다.
- 인증 토큰은 ClawHub CLI 설정 파일에 저장됩니다(`CLAWHUB_CONFIG_PATH`로 재정의 가능).

### 원격 측정(설치 횟수)

로그인한 상태에서 `clawhub sync`를 실행하면, CLI는 최소 스냅샷을 전송하여 설치 횟수를 계산합니다. 이를 완전히 비활성화할 수 있습니다.

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## 환경 변수

- `CLAWHUB_SITE`: 사이트 URL 재정의합니다.
- `CLAWHUB_REGISTRY`: 레지스트리 API URL을 재정의합니다.
- `CLAWHUB_CONFIG_PATH`: CLI가 토큰/설정을 저장하는 위치를 재정의합니다.
- `CLAWHUB_WORKDIR`: 기본 workdir을 재정의합니다.
- `CLAWHUB_DISABLE_TELEMETRY=1`: `sync`의 원격 측정을 비활성화합니다.

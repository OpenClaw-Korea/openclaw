---
summary: "`openclaw hooks` CLI 참조 (에이전트 훅)"
read_when:
  - 에이전트 훅을 관리하고 싶을 때
  - 훅을 설치하거나 업데이트하고 싶을 때
title: "hooks"
---

# `openclaw hooks`

에이전트 훅(이벤트 기반 자동화, `/new`, `/reset` 및 게이트웨이 시작 같은 명령용)을 관리합니다.

관련 문서:

- 훅: [Hooks](/hooks)
- 플러그인 훅: [Plugins](/plugin#plugin-hooks)

## 모든 훅 나열

```bash
openclaw hooks list
```

워크스페이스, 관리형 및 번들 디렉토리에서 발견된 모든 훅을 나열합니다.

**옵션:**

- `--eligible`: 적격 훅만 표시 (요구사항 충족)
- `--json`: JSON으로 출력
- `-v, --verbose`: 누락된 요구사항을 포함한 상세 정보 표시

**출력 예시:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new command is issued
  😈 soul-evil ✓ - Swap injected SOUL content during a purge window or by random chance
```

**예시 (verbose):**

```bash
openclaw hooks list --verbose
```

적격하지 않은 훅의 누락된 요구사항을 표시합니다.

**예시 (JSON):**

```bash
openclaw hooks list --json
```

프로그래밍 방식 사용을 위한 구조화된 JSON을 반환합니다.

## 훅 정보 가져오기

```bash
openclaw hooks info <name>
```

특정 훅에 대한 상세 정보를 표시합니다.

**인수:**

- `<name>`: 훅 이름 (예: `session-memory`)

**옵션:**

- `--json`: JSON으로 출력

**예시:**

```bash
openclaw hooks info session-memory
```

**출력:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/hooks#session-memory
  Events: command:new

Requirements:
  Config: ✓ workspace.dir
```

## 훅 적격성 확인

```bash
openclaw hooks check
```

훅 적격성 상태 요약(준비됨 vs. 준비 안 됨)을 표시합니다.

**옵션:**

- `--json`: JSON으로 출력

**출력 예시:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## 훅 활성화

```bash
openclaw hooks enable <name>
```

설정(`~/.openclaw/config.json`)에 추가하여 특정 훅을 활성화합니다.

**참고:** 플러그인이 관리하는 훅은 `openclaw hooks list`에서 `plugin:<id>`로 표시되며
여기에서 활성화/비활성화할 수 없습니다. 대신 플러그인을 활성화/비활성화하세요.

**인수:**

- `<name>`: 훅 이름 (예: `session-memory`)

**예시:**

```bash
openclaw hooks enable session-memory
```

**출력:**

```
✓ Enabled hook: 💾 session-memory
```

**수행 내용:**

- 훅이 존재하고 적격한지 확인
- 설정에서 `hooks.internal.entries.<name>.enabled = true`로 업데이트
- 디스크에 설정 저장

**활성화 후:**

- 훅이 다시 로드되도록 게이트웨이를 재시작합니다(macOS에서 메뉴바 앱 재시작, 또는 개발 환경에서 게이트웨이 프로세스 재시작).

## 훅 비활성화

```bash
openclaw hooks disable <name>
```

설정을 업데이트하여 특정 훅을 비활성화합니다.

**인수:**

- `<name>`: 훅 이름 (예: `command-logger`)

**예시:**

```bash
openclaw hooks disable command-logger
```

**출력:**

```
⏸ Disabled hook: 📝 command-logger
```

**비활성화 후:**

- 훅이 다시 로드되도록 게이트웨이를 재시작합니다

## 훅 설치

```bash
openclaw hooks install <path-or-spec>
```

로컬 폴더/아카이브 또는 npm에서 훅 팩을 설치합니다.

**수행 내용:**

- 훅 팩을 `~/.openclaw/hooks/<id>`에 복사
- `hooks.internal.entries.*`에서 설치된 훅을 활성화
- `hooks.internal.installs`에 설치 기록

**옵션:**

- `-l, --link`: 복사 대신 로컬 디렉토리 링크 (`hooks.internal.load.extraDirs`에 추가)

**지원되는 아카이브:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**예시:**

```bash
# 로컬 디렉토리
openclaw hooks install ./my-hook-pack

# 로컬 아카이브
openclaw hooks install ./my-hook-pack.zip

# NPM 패키지
openclaw hooks install @openclaw/my-hook-pack

# 복사하지 않고 로컬 디렉토리 링크
openclaw hooks install -l ./my-hook-pack
```

## 훅 업데이트

```bash
openclaw hooks update <id>
openclaw hooks update --all
```

설치된 훅 팩을 업데이트합니다(npm 설치만 해당).

**옵션:**

- `--all`: 모든 추적된 훅 팩 업데이트
- `--dry-run`: 쓰기 없이 변경 내용 표시

## 번들 훅

### session-memory

`/new`를 실행할 때 세션 컨텍스트를 메모리에 저장합니다.

**활성화:**

```bash
openclaw hooks enable session-memory
```

**출력:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**참조:** [session-memory documentation](/hooks#session-memory)

### command-logger

모든 명령 이벤트를 중앙 집중식 감사 파일에 기록합니다.

**활성화:**

```bash
openclaw hooks enable command-logger
```

**출력:** `~/.openclaw/logs/commands.log`

**로그 보기:**

```bash
# 최근 명령
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# 액션별 필터링
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**참조:** [command-logger documentation](/hooks#command-logger)

### soul-evil

퍼지 윈도우 중 또는 무작위로 주입된 `SOUL.md` 콘텐츠를 `SOUL_EVIL.md`로 바꿉니다.

**활성화:**

```bash
openclaw hooks enable soul-evil
```

**참조:** [SOUL Evil Hook](/hooks/soul-evil)

### boot-md

게이트웨이가 시작될 때(채널 시작 후) `BOOT.md`를 실행합니다.

**이벤트**: `gateway:startup`

**활성화**:

```bash
openclaw hooks enable boot-md
```

**참조:** [boot-md documentation](/hooks#boot-md)

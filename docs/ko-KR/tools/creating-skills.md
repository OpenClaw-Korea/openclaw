---
title: "스킬 생성"
---

# 사용자 정의 스킬 생성하기

OpenClaw는 쉽게 확장할 수 있도록 설계되었습니다. "스킬"은 어시스턴트에 새로운 기능을 추가하는 주요 방법입니다.

## 스킬이란 무엇인가요?

스킬은 `SKILL.md` 파일 (LLM에 지침 및 도구 정의 제공)과 선택적으로 일부 스크립트 또는 리소스를 포함하는 디렉토리입니다.

## 단계별: 첫 번째 스킬

### 1. 디렉토리 생성

스킬은 워크스페이스, 일반적으로 `~/.openclaw/workspace/skills/`에 위치합니다. 스킬을 위한 새 폴더를 만드세요:

```bash
mkdir -p ~/.openclaw/workspace/skills/hello-world
```

### 2. `SKILL.md` 정의

해당 디렉토리에 `SKILL.md` 파일을 만드세요. 이 파일은 메타데이터를 위해 YAML 프론트매터를, 지침을 위해 마크다운을 사용합니다.

```markdown
---
name: hello_world
description: A simple skill that says hello.
---

# Hello World Skill

When the user asks for a greeting, use the `echo` tool to say "Hello from your custom skill!".
```

### 3. 도구 추가 (선택사항)

프론트매터에 사용자 정의 도구를 정의하거나 기존 시스템 도구 (`bash` 또는 `browser` 등)를 사용하도록 에이전트에 지시할 수 있습니다.

### 4. OpenClaw 새로 고침

에이전트에게 "refresh skills"를 요청하거나 게이트웨이를 재시작하세요. OpenClaw가 새 디렉토리를 발견하고 `SKILL.md`를 인덱싱합니다.

## 모범 사례

- **간결하게**: 모델에 AI가 되는 방법이 아니라 _무엇을_ 해야 하는지 지시하세요.
- **안전 우선**: 스킬이 `bash`를 사용하는 경우, 프롬프트가 신뢰할 수 없는 사용자 입력으로부터 임의 명령 주입을 허용하지 않도록 하세요.
- **로컬에서 테스트**: `openclaw agent --message "use my new skill"`을 사용하여 테스트하세요.

## 공유 스킬

[ClawHub](https://clawhub.com)에서 스킬을 탐색하고 기여할 수도 있습니다.

---
summary: "`openclaw plugins` CLI 참조 (list, install, enable/disable, doctor)"
read_when:
  - 인프로세스 게이트웨이 플러그인을 설치하거나 관리하고 싶을 때
  - 플러그인 로드 실패를 디버깅하고 싶을 때
title: "plugins"
---

# `openclaw plugins`

게이트웨이 플러그인/확장 프로그램(인프로세스로 로드됨)을 관리합니다.

관련 문서:

- 플러그인 시스템: [Plugins](/plugin)
- 플러그인 매니페스트 + 스키마: [Plugin manifest](/plugins/manifest)
- 보안 강화: [Security](/gateway/security)

## 명령어

```bash
openclaw plugins list
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins doctor
openclaw plugins update <id>
openclaw plugins update --all
```

번들 플러그인은 OpenClaw와 함께 제공되지만 비활성화된 상태로 시작합니다.
`plugins enable`을 사용하여 활성화하세요.

모든 플러그인은 인라인 JSON Schema(`configSchema`, 비어 있어도 됨)가 포함된
`openclaw.plugin.json` 파일을 제공해야 합니다. 매니페스트나 스키마가 누락되었거나
유효하지 않으면 플러그인이 로드되지 않고 설정 검증이 실패합니다.

### 설치

```bash
openclaw plugins install <path-or-spec>
```

보안 참고사항: 플러그인 설치는 코드 실행과 동일하게 취급하세요. 고정된 버전을 선호합니다.

지원되는 아카이브: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

`--link`를 사용하여 로컬 디렉토리 복사를 피합니다(`plugins.load.paths`에 추가):

```bash
openclaw plugins install -l ./my-plugin
```

### 업데이트

```bash
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update <id> --dry-run
```

업데이트는 npm에서 설치된 플러그인(`plugins.installs`에서 추적)에만 적용됩니다.

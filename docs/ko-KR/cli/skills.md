---
summary: "`openclaw skills` CLI 참조 (list/info/check) 및 스킬 적격성"
read_when:
  - 사용 가능하고 실행 준비된 스킬을 확인하려는 경우
  - 스킬의 누락된 바이너리/환경 변수/설정을 디버깅하려는 경우
title: "skills"
---

# `openclaw skills`

스킬(번들 + 워크스페이스 + 관리형 오버라이드)을 검사하고 적격한 항목과 요구 사항이 누락된 항목을 확인합니다.

관련 문서:

- 스킬 시스템: [스킬](/ko-KR/tools/skills)
- 스킬 설정: [스킬 설정](/ko-KR/tools/skills-config)
- ClawHub 설치: [ClawHub](/ko-KR/tools/clawhub)

## 명령

```bash
openclaw skills list
openclaw skills list --eligible
openclaw skills info <name>
openclaw skills check
```

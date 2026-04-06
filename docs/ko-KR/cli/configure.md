---
summary: "`openclaw configure` 명령어 참조 (대화형 설정 프롬프트)"
read_when:
  - 자격 증명, 기기 또는 에이전트 기본값을 대화형으로 수정하고 싶을 때
title: "configure"
---

# `openclaw configure`

자격 증명, 기기 및 에이전트 기본값을 설정하기 위한 대화형 프롬프트입니다.

참고: **모델** 섹션에 이제 `agents.defaults.models` 허용 목록에 대한 다중 선택 옵션이 포함되어 있습니다 (`/model` 및 모델 선택기에 표시되는 항목).

팁: 서브명령어 없이 `openclaw config`를 실행하면 동일한 마법사가 열립니다. 비대화형 편집을 위해서는 `openclaw config get|set|unset`을 사용하세요.

관련 문서:

- 게이트웨이 설정 참조: [설정](/gateway/configuration)
- 설정 CLI: [설정](/cli/config)

참고사항:

- 게이트웨이 실행 위치를 선택하면 항상 `gateway.mode`가 업데이트됩니다. 이것이 필요한 전부라면 다른 섹션 없이 "계속"을 선택할 수 있습니다.
- 채널 지향 서비스(Slack/Discord/Matrix/Microsoft Teams)는 설정 중에 채널/룸 허용 목록을 요청합니다. 이름 또는 ID를 입력할 수 있으며, 마법사는 가능한 경우 이름을 ID로 변환합니다.

## 예시

```bash
openclaw configure
openclaw configure --section models --section channels
```

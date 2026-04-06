---
summary: "OpenClaw에서 OpenCode Zen(큐레이션된 모델)을 사용합니다"
read_when:
  - OpenCode Zen을 사용하려고 할 때
  - 코딩 친화적인 모델의 큐레이션된 목록이 필요할 때
title: "OpenCode Zen"
---

# OpenCode Zen

OpenCode Zen은 코딩 에이전트를 위해 OpenCode 팀에서 권장하는 **큐레이션된 모델 목록**입니다.
API 키를 사용하고 `opencode` 프로바이더를 활용하는 선택적 호스팅 모델 접근 경로입니다.
Zen은 현재 베타 버전입니다.

## CLI 설정

```bash
openclaw onboard --auth-choice opencode-zen
# 또는 비대화형
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

## 설정 스니펫

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-5" } } },
}
```

## 참고사항

- `OPENCODE_ZEN_API_KEY`도 지원됩니다.
- Zen에 로그인하고, 결제 정보를 추가한 후 API 키를 복사합니다.
- OpenCode Zen은 요청별로 요금을 청구합니다. 자세한 내용은 OpenCode 대시보드를 확인하세요.

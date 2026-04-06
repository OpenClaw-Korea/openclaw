---
summary: "`openclaw onboard` CLI 참조 (대화형 온보딩 마법사)"
read_when:
  - 게이트웨이, 작업 공간, 인증, 채널 및 스킬에 대한 안내 설정을 원할 때
title: "onboard"
---

# `openclaw onboard`

대화형 온보딩 마법사 (로컬 또는 원격 게이트웨이 설정).

관련:

- 마법사 가이드: [온보딩](/start/onboarding)

## 예제

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url ws://gateway-host:18789
```

플로우 참고사항:

- `quickstart`: 최소 프롬프트, 게이트웨이 토큰 자동 생성.
- `manual`: 포트/바인드/인증에 대한 전체 프롬프트 (`advanced`의 별칭).
- 가장 빠른 첫 채팅: `openclaw dashboard` (Control UI, 채널 설정 불필요).

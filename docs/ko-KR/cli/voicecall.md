---
summary: "`openclaw voicecall` (음성 통화 플러그인 명령어 표면)에 대한 CLI 참조"
read_when:
  - 음성 통화 플러그인을 사용하고 CLI 진입점을 알고 싶을 때
  - "`voicecall call|continue|status|tail|expose`의 빠른 예제를 원할 때"
title: "voicecall"
---

# `openclaw voicecall`

`voicecall`은 플러그인에서 제공하는 명령어입니다. 음성 통화 플러그인이 설치되어 있고 활성화되어 있을 때만 나타납니다.

주요 문서:

- 음성 통화 플러그인: [Voice Call](/plugins/voice-call)

## 일반 명령어

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## 웹훅 노출 (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall unexpose
```

보안 주의: 웹훅 엔드포인트는 신뢰하는 네트워크에만 노출하세요. 가능하면 Tailscale Funnel보다 Tailscale Serve를 선호합니다.

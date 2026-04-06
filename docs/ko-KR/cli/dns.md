---
summary: "`openclaw dns` CLI 참조 (광역 디스커버리 헬퍼)"
read_when:
  - Tailscale + CoreDNS를 사용하여 광역 디스커버리(DNS-SD)를 원하는 경우
  - 커스텀 디스커버리 도메인에 대해 스플릿 DNS를 설정하는 경우(예: openclaw.internal)
title: "dns"
---

# `openclaw dns`

광역 디스커버리(Tailscale + CoreDNS)를 위한 DNS 헬퍼입니다. 현재 macOS + Homebrew CoreDNS에 중점을 두고 있습니다.

관련 문서:

- 게이트웨이 디스커버리: [Discovery](/gateway/discovery)
- 광역 디스커버리 설정: [Configuration](/gateway/configuration)

## 설정

```bash
openclaw dns setup
openclaw dns setup --apply
```

---
summary: "`openclaw security` CLI 참조 (일반적인 보안 문제 감사 및 수정)"
read_when:
  - 설정/상태에 대한 빠른 보안 감사를 실행하려는 경우
  - 안전한 "수정" 제안을 적용하려는 경우 (chmod, 기본값 강화)
title: "security"
---

# `openclaw security`

보안 도구 (감사 + 선택적 수정).

관련 문서:

- 보안 가이드: [보안](/ko-KR/gateway/security)

## 감사

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
```

감사는 여러 DM 발신자가 메인 세션을 공유할 때 경고하고 공유 받은편지함에 대해 `session.dmScope="per-channel-peer"`(또는 다중 계정 채널의 경우 `per-account-channel-peer`)를 권장합니다.
또한 작은 모델(`<=300B`)이 샌드박싱 없이 웹/브라우저 도구가 활성화된 상태로 사용될 때 경고합니다.

---
summary: "브라우저 자동화 및 X/Twitter 포스팅을 위한 수동 로그인"
read_when:
  - 브라우저 자동화를 위해 사이트에 로그인해야 할 때
  - X/Twitter에 업데이트를 포스팅하고 싶을 때
title: "브라우저 로그인"
---

# 브라우저 로그인 + X/Twitter 포스팅

## 수동 로그인 (권장)

사이트에서 로그인이 필요할 때는 **호스트** 브라우저 프로필(OpenClaw 브라우저)에서 **직접 로그인**합니다.

모델에 자격 증명을 제공하지 마세요. 자동화된 로그인은 봇 방지 메커니즘을 트리거할 수 있으며 계정이 잠길 수 있습니다.

메인 브라우저 문서로 돌아가기: [Browser](/tools/browser)

## 어떤 Chrome 프로필이 사용됩니까?

OpenClaw는 **전용 Chrome 프로필** (이름 `openclaw`, 주황색 UI)을 제어합니다. 이는 일상적인 브라우저 프로필과 별개입니다.

접근하는 두 가지 간단한 방법:

1. **에이전트에게 브라우저를 열도록 요청**한 후 직접 로그인합니다.
2. **CLI를 통해 열기**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

여러 프로필이 있는 경우 `--browser-profile <name>`을 전달합니다(기본값은 `openclaw`입니다).

## X/Twitter: 권장 절차

- **읽기/검색/스레드**: **bird** CLI 스킬을 사용합니다 (브라우저 없음, 안정적).
  - 저장소: https://github.com/steipete/bird
- **업데이트 포스팅**: **호스트** 브라우저를 사용합니다 (수동 로그인).

## 샌드박싱 + 호스트 브라우저 접근

샌드박스 격리 브라우저 세션은 **봇 탐지를 트리거할 가능성이 더 높습니다**. X/Twitter(및 기타 엄격한 사이트)의 경우 **호스트** 브라우저를 선택합니다.

에이전트가 샌드박스 격리되어 있으면 브라우저 도구는 기본적으로 샌드박스를 사용합니다. 호스트 제어를 허용하려면:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

그 다음 호스트 브라우저를 대상으로 합니다:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

또는 업데이트를 포스팅하는 에이전트의 샌드박싱을 비활성화합니다.

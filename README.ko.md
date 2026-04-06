# 🦞 OpenClaw — 나만의 AI 비서

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/openclaw/openclaw/main/docs/assets/openclaw-logo-text-dark.png">
        <img src="https://raw.githubusercontent.com/openclaw/openclaw/main/docs/assets/openclaw-logo-text.png" alt="OpenClaw" width="500">
    </picture>
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.ko.md"><strong>한국어</strong></a>
</p>

**OpenClaw**은 내 기기에서 직접 실행하는 개인 AI 비서입니다.

이미 사용 중인 메신저(WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, WebChat)에서 바로 대화할 수 있고, BlueBubbles, Matrix, Zalo 등 확장 채널도 지원합니다. macOS/iOS/Android에서 음성 대화가 가능하며, 실시간 Canvas를 제어할 수 있습니다.

로컬에서 빠르고 항상 켜져 있는 개인 비서를 원한다면, 바로 이겁니다.

## 빠른 시작

**요구 사항:** Node ≥22

```bash
# 설치
npm install -g openclaw@latest

# 온보딩 위저드 실행 (권장)
openclaw onboard --install-daemon

# Gateway 실행
openclaw gateway --port 18789 --verbose

# 메시지 보내기
openclaw message send --to +821012345678 --message "안녕하세요!"

# AI 비서와 대화
openclaw agent --message "오늘 할 일 정리해줘" --thinking high
```

## 지원 채널

| 채널            | 상태                  |
| --------------- | --------------------- |
| WhatsApp        | ✅ 지원               |
| Telegram        | ✅ 지원               |
| Slack           | ✅ 지원               |
| Discord         | ✅ 지원               |
| Google Chat     | ✅ 지원               |
| Signal          | ✅ 지원               |
| iMessage        | ✅ 지원 (BlueBubbles) |
| Microsoft Teams | ✅ 지원               |
| Matrix          | ✅ 확장               |
| WebChat         | ✅ 내장               |

## 지원 모델

어떤 모델이든 사용 가능하지만, **Anthropic Pro/Max + Opus 4.5**를 권장합니다.

- [Anthropic](https://www.anthropic.com/) (Claude Pro/Max)
- [OpenAI](https://openai.com/) (ChatGPT/Codex)

## 설치

```bash
npm install -g openclaw@latest
# 또는
pnpm add -g openclaw@latest
```

온보딩 위저드가 Gateway, 워크스페이스, 채널, 스킬을 자동 설정합니다:

```bash
openclaw onboard --install-daemon
```

macOS, Linux, Windows(WSL2 권장) 모두 지원합니다.

## 링크

- [공식 웹사이트](https://openclaw.ai)
- [문서](https://docs.openclaw.ai)
- [시작 가이드](https://docs.openclaw.ai/start/getting-started)
- [FAQ](https://docs.openclaw.ai/start/faq)
- [Discord](https://discord.gg/clawd)
- [GitHub Discussions](https://github.com/openclaw-korea/openclaw/discussions)

## 기여하기

기여를 환영합니다! [Contributing Guide](https://github.com/openclaw-korea/.github/blob/main/CONTRIBUTING.md)를 확인해주세요.

## 라이선스

MIT

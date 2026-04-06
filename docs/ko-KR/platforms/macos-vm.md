---
summary: "격리된 macOS VM(로컬 또는 호스팅)에서 OpenClaw를 실행합니다(격리 또는 iMessage가 필요한 경우)"
read_when:
  - OpenClaw를 메인 macOS 환경에서 격리하고 싶을 때
  - 샌드박스에서 iMessage 통합(BlueBubbles)을 원할 때
  - 복제할 수 있는 재설정 가능한 macOS 환경을 원할 때
  - 로컬 vs 호스팅 macOS VM 옵션을 비교하고 싶을 때
title: "macOS VM"
---

# macOS VM의 OpenClaw (샌드박싱)

## 권장되는 기본 설정 (대부분의 사용자)

- **소규모 Linux VPS**: 항상 켜져 있는 게이트웨이와 저렴한 비용. [VPS 호스팅](/vps)을 참고하세요.
- **전용 하드웨어**(Mac mini 또는 Linux 박스): 완전한 제어와 브라우저 자동화를 위한 **주거용 IP**가 필요한 경우. 많은 사이트가 데이터 센터 IP를 차단하므로 로컬 브라우징이 더 잘 작동합니다.
- **하이브리드**: 게이트웨이를 저비용 VPS에 유지하고, 브라우저/UI 자동화가 필요할 때 Mac을 **노드**로 연결합니다. [노드](/nodes)와 [게이트웨이 원격](/gateway/remote)을 참고하세요.

macOS 전용 기능(iMessage/BlueBubbles)이 필요하거나 일상용 Mac과 엄격하게 격리하려는 경우 macOS VM을 사용하세요.

## macOS VM 옵션

### Apple Silicon Mac의 로컬 VM (Lume)

[Lume](https://cua.ai/docs/lume)을 사용하여 기존 Apple Silicon Mac에서 샌드박스 격리된 macOS VM의 OpenClaw를 실행합니다.

이것은 다음을 제공합니다:

- 격리된 완전한 macOS 환경 (호스트는 깨끗하게 유지)
- iMessage 지원(BlueBubbles 사용) (Linux/Windows에서는 불가능)
- VM 복제를 통한 즉각적인 재설정
- 추가 하드웨어 또는 클라우드 비용 없음

### 호스팅 Mac 프로바이더 (클라우드)

클라우드에서 macOS를 원하면 호스팅 Mac 프로바이더도 작동합니다:

- [MacStadium](https://www.macstadium.com/) (호스팅 Mac)
- 다른 호스팅 Mac 업체도 작동합니다. 해당 VM + SSH 문서를 따르세요.

macOS VM에 SSH 액세스가 있으면 아래 단계 6으로 진행하세요.

---

## 빠른 경로 (Lume, 경험 있는 사용자)

1. Lume 설치
2. `lume create openclaw --os macos --ipsw latest`
3. 설정 도우미를 완료하고 원격 로그인(SSH) 활성화
4. `lume run openclaw --no-display`
5. SSH 접속, OpenClaw 설치, 채널 설정
6. 완료

---

## 필요한 사항 (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- 호스트의 macOS Sequoia 이상
- VM당 약 60GB의 여유 디스크 공간
- 약 20분

---

## 1) Lume 설치

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

`~/.local/bin`이 PATH에 없는 경우:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

확인:

```bash
lume --version
```

문서: [Lume 설치](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) macOS VM 만들기

```bash
lume create openclaw --os macos --ipsw latest
```

이것은 macOS를 다운로드하고 VM을 만듭니다. VNC 창이 자동으로 열립니다.

참고: 연결 속도에 따라 다운로드가 걸릴 수 있습니다.

---

## 3) 설정 도우미 완료

VNC 창에서:

1. 언어 및 지역 선택
2. Apple ID 건너뛰기 (또는 나중에 iMessage를 원하면 로그인)
3. 사용자 계정 만들기 (사용자 이름과 비밀번호 기억)
4. 모든 선택적 기능 건너뛰기

설정이 완료된 후 SSH를 활성화합니다:

1. 시스템 설정 → 일반 → 공유 열기
2. "원격 로그인" 활성화

---

## 4) VM의 IP 주소 얻기

```bash
lume get openclaw
```

IP 주소(일반적으로 `192.168.64.x`)를 찾으세요.

---

## 5) VM에 SSH 접속

```bash
ssh youruser@192.168.64.X
```

`youruser`를 생성한 계정으로, IP를 VM의 IP로 바꾸세요.

---

## 6) OpenClaw 설치

VM 내부에서:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

온보딩 프롬프트를 따라 모델 프로바이더(Anthropic, OpenAI 등)를 설정합니다.

---

## 7) 채널 설정

설정 파일을 편집합니다:

```bash
nano ~/.openclaw/openclaw.json
```

채널을 추가합니다:

```json
{
  "channels": {
    "whatsapp": {
      "dmPolicy": "allowlist",
      "allowFrom": ["+15551234567"]
    },
    "telegram": {
      "botToken": "YOUR_BOT_TOKEN"
    }
  }
}
```

그런 다음 WhatsApp에 로그인합니다 (QR 스캔):

```bash
openclaw channels login
```

---

## 8) VM을 헤드리스로 실행

VM을 중지하고 디스플레이 없이 다시 시작합니다:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM은 백그라운드에서 실행됩니다. OpenClaw의 데몬이 게이트웨이를 계속 실행합니다.

상태를 확인하려면:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## 보너스: iMessage 통합

이것은 macOS에서 실행하는 가장 주요 기능입니다. [BlueBubbles](https://bluebubbles.app)를 사용하여 OpenClaw에 iMessage를 추가합니다.

VM 내부에서:

1. bluebubbles.app에서 BlueBubbles 다운로드
2. Apple ID로 로그인
3. Web API를 활성화하고 비밀번호 설정
4. BlueBubbles 웹훅을 게이트웨이로 지정합니다 (예: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

OpenClaw 설정에 추가합니다:

```json
{
  "channels": {
    "bluebubbles": {
      "serverUrl": "http://localhost:1234",
      "password": "your-api-password",
      "webhookPath": "/bluebubbles-webhook"
    }
  }
}
```

게이트웨이를 다시 시작합니다. 이제 에이전트가 iMessage를 보내고 받을 수 있습니다.

전체 설정 세부 사항: [BlueBubbles 채널](/channels/bluebubbles)

---

## 골든 이미지 저장

추가로 사용자 정의하기 전에 깨끗한 상태를 스냅샷합니다:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

언제든지 재설정합니다:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 24시간 운영

VM을 계속 실행하려면:

- Mac을 꽂혀 있는 상태로 유지
- 시스템 설정 → 에너지 절약에서 절전 비활성화
- 필요한 경우 `caffeinate` 사용

정말 항상 켜져 있으려면 전용 Mac mini 또는 소규모 VPS를 고려하세요. [VPS 호스팅](/vps)을 참고하세요.

---

## 문제 해결

| 문제                   | 해결 방법                                                                  |
| ---------------------- | -------------------------------------------------------------------------- |
| VM에 SSH 접속 불가     | VM의 시스템 설정에서 "원격 로그인"이 활성화되어 있는지 확인                |
| VM IP 표시 안 됨       | VM이 완전히 부팅될 때까지 기다린 후 `lume get openclaw`를 다시 실행        |
| Lume 명령 찾을 수 없음 | `~/.local/bin`을 PATH에 추가                                               |
| WhatsApp QR 스캔 안 됨 | `openclaw channels login`을 실행할 때 호스트가 아닌 VM에 로그인했는지 확인 |

---

## 관련 문서

- [VPS 호스팅](/vps)
- [노드](/nodes)
- [게이트웨이 원격](/gateway/remote)
- [BlueBubbles 채널](/channels/bluebubbles)
- [Lume 빠른 시작](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI 참조](https://cua.ai/docs/lume/reference/cli-reference)
- [무인 VM 설정](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (고급)
- [Docker 샌드박싱](/install/docker) (대체 격리 방법)

---
summary: "Raspberry Pi에서 OpenClaw 실행 (저렴한 자체 호스팅 설정)"
read_when:
  - Raspberry Pi에 OpenClaw 설정하기
  - ARM 장치에서 OpenClaw 실행하기
  - 저렴한 상시 가동 개인 AI 구축하기
title: "Raspberry Pi"
---

# Raspberry Pi에서 OpenClaw 실행

## 목표

**~$35-80**의 일회성 비용(월별 요금 없음)으로 Raspberry Pi에서 지속적이고 상시 가동되는 OpenClaw 게이트웨이를 실행합니다.

다음과 같은 용도에 적합합니다:

- 24/7 개인 AI 비서
- 홈 자동화 허브
- 저전력, 상시 사용 가능한 Telegram/WhatsApp 봇

## 하드웨어 요구사항

| Pi 모델         | RAM     | 작동 여부 | 참고사항                     |
| --------------- | ------- | --------- | ---------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ 최상   | 가장 빠름, 권장              |
| **Pi 4**        | 4GB     | ✅ 좋음   | 대부분의 사용자에게 최적     |
| **Pi 4**        | 2GB     | ✅ 괜찮음 | 작동함, 스왑 추가 필요       |
| **Pi 4**        | 1GB     | ⚠️ 빠듯함 | 스왑 사용 시 가능, 최소 설정 |
| **Pi 3B+**      | 1GB     | ⚠️ 느림   | 작동하지만 느림              |
| **Pi Zero 2 W** | 512MB   | ❌        | 권장하지 않음                |

**최소 사양:** 1GB RAM, 1코어, 500MB 디스크
**권장 사양:** 2GB+ RAM, 64비트 OS, 16GB+ SD 카드 (또는 USB SSD)

## 필요한 것

- Raspberry Pi 4 또는 5 (2GB+ 권장)
- MicroSD 카드 (16GB+) 또는 USB SSD (더 나은 성능)
- 전원 공급 장치 (공식 Pi PSU 권장)
- 네트워크 연결 (이더넷 또는 WiFi)
- ~30분

## 1) OS 플래싱

**Raspberry Pi OS Lite (64비트)**를 사용합니다 — 헤드리스 서버에는 데스크톱이 필요 없습니다.

1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/)를 다운로드합니다
2. OS 선택: **Raspberry Pi OS Lite (64비트)**
3. 톱니바퀴 아이콘(⚙️)을 클릭하여 사전 설정을 합니다:
   - 호스트명 설정: `gateway-host`
   - SSH 활성화
   - 사용자명/비밀번호 설정
   - WiFi 설정 (이더넷을 사용하지 않는 경우)
4. SD 카드 / USB 드라이브에 플래싱합니다
5. 삽입하고 Pi를 부팅합니다

## 2) SSH로 연결

```bash
ssh user@gateway-host
# 또는 IP 주소를 사용합니다
ssh user@192.168.x.x
```

## 3) 시스템 설정

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y git curl build-essential

# 시간대 설정 (cron/알림에 중요)
sudo timedatectl set-timezone America/Chicago  # 해당 시간대로 변경하세요
```

## 4) Node.js 22 설치 (ARM64)

```bash
# NodeSource를 통해 Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 확인
node --version  # v22.x.x가 표시되어야 합니다
npm --version
```

## 5) 스왑 추가 (2GB 이하에서 중요)

스왑은 메모리 부족 충돌을 방지합니다:

```bash
# 2GB 스왑 파일 생성
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 적용
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 낮은 RAM에 최적화 (swappiness 감소)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) OpenClaw 설치

### 옵션 A: 표준 설치 (권장)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### 옵션 B: 해킹 가능한 설치 (실험용)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

해킹 가능한 설치는 로그와 코드에 직접 접근할 수 있어 ARM 관련 문제 디버깅에 유용합니다.

## 7) 온보딩 실행

```bash
openclaw onboard --install-daemon
```

마법사를 따라합니다:

1. **게이트웨이 모드:** Local
2. **인증:** API 키 권장 (OAuth는 헤드리스 Pi에서 까다로울 수 있음)
3. **채널:** Telegram이 시작하기 가장 쉬움
4. **데몬:** Yes (systemd)

## 8) 설치 확인

```bash
# 상태 확인
openclaw status

# 서비스 확인
sudo systemctl status openclaw

# 로그 확인
journalctl -u openclaw -f
```

## 9) 대시보드 접근

Pi가 헤드리스이므로 SSH 터널을 사용합니다:

```bash
# 노트북/데스크톱에서
ssh -L 18789:localhost:18789 user@gateway-host

# 그런 다음 브라우저에서 열기
open http://localhost:18789
```

또는 상시 접근을 위해 Tailscale을 사용합니다:

```bash
# Pi에서
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# 설정 업데이트
openclaw config set gateway.bind tailnet
sudo systemctl restart openclaw
```

---

## 성능 최적화

### USB SSD 사용 (큰 개선)

SD 카드는 느리고 수명이 짧습니다. USB SSD는 성능을 크게 향상시킵니다:

```bash
# USB에서 부팅하는지 확인
lsblk
```

설정 방법은 [Pi USB 부팅 가이드](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)를 참조하세요.

### 메모리 사용량 감소

```bash
# GPU 메모리 할당 비활성화 (헤드리스)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# 필요하지 않으면 블루투스 비활성화
sudo systemctl disable bluetooth
```

### 리소스 모니터링

```bash
# 메모리 확인
free -h

# CPU 온도 확인
vcgencmd measure_temp

# 실시간 모니터링
htop
```

---

## ARM 관련 참고사항

### 바이너리 호환성

대부분의 OpenClaw 기능은 ARM64에서 작동하지만, 일부 외부 바이너리는 ARM 빌드가 필요할 수 있습니다:

| 도구               | ARM64 상태 | 참고사항                            |
| ------------------ | ---------- | ----------------------------------- |
| Node.js            | ✅         | 잘 작동함                           |
| WhatsApp (Baileys) | ✅         | 순수 JS, 문제 없음                  |
| Telegram           | ✅         | 순수 JS, 문제 없음                  |
| gog (Gmail CLI)    | ⚠️         | ARM 릴리스 확인                     |
| Chromium (browser) | ✅         | `sudo apt install chromium-browser` |

스킬이 실패하면 해당 바이너리에 ARM 빌드가 있는지 확인하세요. 많은 Go/Rust 도구는 있지만, 일부는 없습니다.

### 32비트 vs 64비트

**항상 64비트 OS를 사용하세요.** Node.js와 많은 최신 도구가 이를 요구합니다. 다음으로 확인하세요:

```bash
uname -m
# aarch64 (64비트)가 표시되어야 합니다. armv7l (32비트)가 아님
```

---

## 권장 모델 설정

Pi는 게이트웨이일 뿐이므로 (모델은 클라우드에서 실행됨), API 기반 모델을 사용합니다:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-20250514",
        "fallbacks": ["openai/gpt-4o-mini"]
      }
    }
  }
}
```

**Pi에서 로컬 LLM을 실행하려고 하지 마세요** — 작은 모델도 너무 느립니다. 무거운 작업은 Claude/GPT에 맡기세요.

---

## 부팅 시 자동 시작

온보딩 마법사가 이를 설정하지만, 확인하려면:

```bash
# 서비스가 활성화되어 있는지 확인
sudo systemctl is-enabled openclaw

# 그렇지 않으면 활성화
sudo systemctl enable openclaw

# 부팅 시 시작
sudo systemctl start openclaw
```

---

## 문제 해결

### 메모리 부족 (OOM)

```bash
# 메모리 확인
free -h

# 더 많은 스왑 추가 (5단계 참조)
# 또는 Pi에서 실행 중인 서비스 줄이기
```

### 느린 성능

- SD 카드 대신 USB SSD 사용
- 사용하지 않는 서비스 비활성화: `sudo systemctl disable cups bluetooth avahi-daemon`
- CPU 스로틀링 확인: `vcgencmd get_throttled` (`0x0`이 표시되어야 함)

### 서비스가 시작되지 않음

```bash
# 로그 확인
journalctl -u openclaw --no-pager -n 100

# 일반적인 수정: 재빌드
cd ~/openclaw  # 해킹 가능한 설치를 사용하는 경우
npm run build
sudo systemctl restart openclaw
```

### ARM 바이너리 문제

스킬이 "exec format error"로 실패하는 경우:

1. 바이너리에 ARM64 빌드가 있는지 확인
2. 소스에서 빌드 시도
3. 또는 ARM 지원이 있는 Docker 컨테이너 사용

### WiFi 연결 끊김

헤드리스 Pi를 WiFi로 사용하는 경우:

```bash
# WiFi 전원 관리 비활성화
sudo iwconfig wlan0 power off

# 영구 적용
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## 비용 비교

| 설정           | 일회성 비용 | 월별 비용 | 참고사항                  |
| -------------- | ----------- | --------- | ------------------------- |
| **Pi 4 (2GB)** | ~$45        | $0        | + 전기료 (~$5/년)         |
| **Pi 4 (4GB)** | ~$55        | $0        | 권장                      |
| **Pi 5 (4GB)** | ~$60        | $0        | 최고 성능                 |
| **Pi 5 (8GB)** | ~$80        | $0        | 과한 편이지만 미래 지향적 |
| DigitalOcean   | $0          | $6/mo     | $72/년                    |
| Hetzner        | $0          | €3.79/mo  | ~$50/년                   |

**손익분기점:** Pi는 클라우드 VPS 대비 약 6~12개월이면 원가 회수됩니다.

---

## 참조

- [Linux 가이드](/platforms/linux) — 일반 Linux 설정
- [DigitalOcean 가이드](/platforms/digitalocean) — 클라우드 대안
- [Hetzner 가이드](/platforms/hetzner) — Docker 설정
- [Tailscale](/gateway/tailscale) — 원격 접근
- [Nodes](/nodes) — Pi 게이트웨이와 노트북/전화기 페어링

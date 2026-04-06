---
title: OpenClaw Node Lite — 테스트 & 운영 가이드
created_date: 2026-02-14 17:21
AI Model Name: claude-opus-4-6
사용자 요청사항: Electron 기반 경량 Headless Node 구현 후 hands-off 테스트 가이드
내용 요약: 개발/빌드/테스트/배포 전 과정을 담은 self-contained 가이드
---

# OpenClaw Node Lite — 테스트 & 운영 가이드
Ref. : [[PLAN.md]]
#status/active #electron #node-host #gateway

## TL;DR

Electron 기반 경량 Headless Node. 인스톨러 하나로 설치, 트레이 상주, Gateway WebSocket 연결 → 셸 실행 → 결과 반환.

---

## 1. 사전 준비

```bash
cd apps/electron-node
pnpm install
pnpm approve-builds        # electron postinstall 허용 (최초 1회)
```

## 2. 개발 모드 실행

```bash
pnpm dev                   # tsc && electron dist/main/index.js
```

**확인사항:**
- [ ] macOS 상단바(또는 Win 트레이)에 아이콘 표시
- [ ] 아이콘 클릭 → 설정 창 열림
- [ ] 트레이 우클릭 → 컨텍스트 메뉴 (상태, 설정, 자동실행, 종료)

## 3. Gateway 연결 테스트

### 3-1. 설정 UI에서 연결

| 필드 | 값 |
|------|-----|
| Gateway 주소 | `127.0.0.1` (또는 원격 Gateway IP) |
| 포트 | `18789` |
| TLS | 필요시 체크 |

"저장 및 연결" 클릭

### 3-2. 연결 상태 확인

| 상태 | 의미 |
|------|------|
| 🔴 연결 끊김 | Gateway 미실행 또는 네트워크 문제 |
| 🟡 연결 중 / 페어링 대기 | WebSocket 연결됨, 인증 진행 중 |
| 🟢 연결됨 | 정상 동작 |

### 3-3. CLI로 확인

```bash
# 노드 목록 확인
openclaw nodes list

# nodeId 확인
cat ~/.openclaw-node-lite/node.json

# 셸 실행 테스트
openclaw nodes run --node <nodeId> -- echo hello
openclaw nodes run --node <nodeId> -- uname -a
openclaw nodes run --node <nodeId> -- ls /tmp
```

### 3-4. 재연결 테스트

1. Gateway 프로세스 종료
2. 콘솔에서 `[gateway] ...closed...` 로그 확인
3. Gateway 재시작
4. 자동 재연결 확인 (exponential backoff: 1s → 2s → 4s → ... → 30s max)

## 4. 파일 구조

```
apps/electron-node/
├── package.json
├── electron-builder.yml
├── tsconfig.json
├── assets/icon.png, icon.ico
├── src/
│   ├── main/
│   │   ├── index.ts           # 진입점 (트레이 + 클라이언트)
│   │   ├── tray.ts            # 시스템 트레이
│   │   ├── auto-launch.ts     # OS 자동 실행
│   │   └── ipc-handlers.ts    # Renderer ↔ Main IPC
│   ├── node-client/
│   │   ├── gateway-client.ts  # ★ WebSocket 클라이언트 (프로토콜 v3)
│   │   ├── device-identity.ts # ED25519 키 생성/서명
│   │   ├── shell-executor.ts  # child_process.spawn
│   │   └── config-store.ts    # 설정 저장
│   └── renderer/
│       ├── index.html         # 설정 UI
│       └── app.ts             # UI 로직
└── dist/                      # tsc 빌드 출력
```

## 5. 설정 파일 위치

| 파일 | 경로 |
|------|------|
| 노드 설정 | `~/.openclaw-node-lite/node.json` |
| 디바이스 키 | `~/.openclaw-node-lite/identity/device.json` |
| 인증 토큰 | `~/.openclaw-node-lite/identity/device-auth.json` |

## 6. 인스톨러 빌드

```bash
pnpm build:mac             # → dist-electron/*.dmg
pnpm build:win             # → dist-electron/*.exe (Windows에서)
pnpm build:all             # 둘 다
```

## 7. 트러블슈팅

| 증상 | 해결 |
|------|------|
| 트레이 안 보임 | `pnpm approve-builds` 후 재실행 |
| 계속 재연결 | Gateway 실행 여부 확인, 포트/주소 확인 |
| 페어링 멈춤 | Gateway 콘솔에서 페어링 승인 필요 |
| TLS 에러 | fingerprint 값 확인 또는 TLS 체크 해제 |
| 키 재생성 필요 | `rm -rf ~/.openclaw-node-lite/identity/` 후 재시작 |

## 8. 프로토콜 요약

```
WS 연결 → connect.challenge(nonce) → connect(ED25519 서명)
→ hello-ok(deviceToken) → tick keepalive
→ node.invoke.request → system.run/which → node.invoke.result
```

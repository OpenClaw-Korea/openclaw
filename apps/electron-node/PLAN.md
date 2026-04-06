# Plan: OpenClaw Node Lite — Electron 기반 경량 Headless Node

## Context

현재 Headless Node를 사용하려면 대상 PC에 Node.js + openclaw 전체 패키지(200MB+)를 설치해야 합니다.
실제로 Headless Node가 하는 일은 Gateway WebSocket 연결 → `system.run` 명령 수신 → 셸 실행 → 결과 반환뿐입니다.

Electron으로 패키징하면:
- Windows/macOS 사용자가 **인스톨러 하나로 설치** 가능 (Node.js 사전 설치 불필요)
- 시스템 트레이 앱으로 **백그라운드 상주**
- 간단한 설정 UI로 Gateway 연결 관리

## 아키텍처

```
apps/electron-node/
├── package.json              # Electron + electron-builder
├── electron-builder.yml      # Windows(NSIS)/macOS(DMG) 빌드 설정
├── tsconfig.json
├── src/
│   ├── main/                 # Electron Main Process
│   │   ├── index.ts          # 앱 진입점, 트레이 생성
│   │   ├── tray.ts           # 시스템 트레이 아이콘 + 메뉴
│   │   ├── auto-launch.ts    # OS 시작 시 자동 실행
│   │   └── ipc-handlers.ts   # Renderer ↔ Main IPC
│   ├── node-client/          # 경량 Gateway 클라이언트 (핵심)
│   │   ├── gateway-client.ts # WebSocket 연결, 프레임 파싱, 재연결
│   │   ├── device-identity.ts# ED25519 키 생성/서명
│   │   ├── shell-executor.ts # child_process.spawn 래퍼
│   │   └── config-store.ts   # nodeId, token, gateway 설정 저장
│   └── renderer/             # 설정 UI (최소한)
│       ├── index.html
│       └── app.ts            # Gateway 주소 입력, 연결 상태 표시
└── assets/
    ├── icon.png              # 트레이 아이콘
    └── icon.ico              # Windows 트레이 아이콘
```

## 핵심 구현

### 1. `node-client/gateway-client.ts` — 경량 WebSocket 클라이언트

기존 `src/gateway/client.ts`(전체 openclaw 의존)를 참고하여 **독립 구현**.
의존성: `ws` 라이브러리 + Node.js 내장 모듈만 사용.

**프로토콜 최소 구현:**
```
1. WebSocket 연결
2. connect.challenge 수신 → nonce 추출
3. connect 요청 전송 (device identity + caps:["system"] + commands:["system.run","system.which"])
4. hello-ok 수신 → token 저장
5. node.invoke.request 이벤트 대기
6. system.run → child_process.spawn → node.invoke.result 반환
7. tick 이벤트로 keepalive 모니터링
8. 연결 끊김 시 exponential backoff 재연결
```

### 2. `node-client/device-identity.ts` — ED25519 인증

기존 `src/infra/device-identity.ts` 로직을 경량 복사:
- `crypto.generateKeyPairSync("ed25519")` 로 키쌍 생성
- deviceId = SHA256(raw public key)
- 서명: `crypto.sign(null, payload, privateKey)` → base64url 인코딩
- 저장: `~/.openclaw-node-lite/identity/device.json`

### 3. `node-client/shell-executor.ts` — 셸 실행

기존 `src/node-host/runner.ts`의 system.run 로직을 경량 추출:
- `child_process.spawn(argv[0], argv.slice(1), { stdio, cwd, env, windowsHide })`
- stdout/stderr 수집 (200KB cap)
- 타임아웃 처리 (SIGKILL)
- 위험 환경변수 필터링 (NODE_OPTIONS, DYLD_*, LD_*)

### 4. `src/renderer/` — 설정 UI

Electron BrowserWindow (작은 창, 트레이 클릭 시 표시):
- Gateway 주소/포트 입력
- TLS 설정
- 연결 상태 표시 (연결됨/페어링 대기/연결 끊김)
- 자동 시작 On/Off

### 5. `src/main/tray.ts` — 시스템 트레이

```
트레이 메뉴:
├── 상태: 연결됨 (gateway.local:18789)
├── ──────────
├── 설정 열기
├── 시작 시 자동 실행 ✓
├── ──────────
└── 종료
```

## 의존성 (최소)

```json
{
  "dependencies": {
    "ws": "^8.19.0"
  },
  "devDependencies": {
    "electron": "^33.0.0",
    "electron-builder": "^25.0.0",
    "typescript": "^5.9.0"
  }
}
```

**전체 패키지 크기 예상: Electron ~150MB (런타임 포함) + 앱 코드 ~50KB**
vs 현재: Node.js ~50MB + openclaw ~200MB+ = ~250MB

## 빌드 & 배포

### electron-builder.yml
```yaml
appId: ai.openclaw.node-lite
productName: OpenClaw Node
directories:
  output: dist-electron

mac:
  category: public.app-category.utilities
  target: [dmg]

win:
  target: [nsis]

nsis:
  oneClick: true
  perMachine: false
```

### 빌드 명령
```bash
# 개발
cd apps/electron-node && pnpm dev

# Windows 빌드 (Windows에서)
pnpm build:win

# macOS 빌드 (macOS에서)
pnpm build:mac
```

## 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `apps/electron-node/package.json` | 새 패키지 생성 |
| `apps/electron-node/electron-builder.yml` | 빌드 설정 |
| `apps/electron-node/tsconfig.json` | TS 설정 |
| `apps/electron-node/src/main/index.ts` | Electron 진입점 |
| `apps/electron-node/src/main/tray.ts` | 트레이 아이콘 |
| `apps/electron-node/src/main/auto-launch.ts` | 자동 실행 |
| `apps/electron-node/src/main/ipc-handlers.ts` | IPC |
| `apps/electron-node/src/node-client/gateway-client.ts` | WebSocket 클라이언트 |
| `apps/electron-node/src/node-client/device-identity.ts` | ED25519 인증 |
| `apps/electron-node/src/node-client/shell-executor.ts` | 셸 실행 |
| `apps/electron-node/src/node-client/config-store.ts` | 설정 저장 |
| `apps/electron-node/src/renderer/index.html` | 설정 UI HTML |
| `apps/electron-node/src/renderer/app.ts` | 설정 UI 로직 |
| `pnpm-workspace.yaml` | workspace에 추가 |

## 참고 소스 (경량 복사 대상)

| 기존 파일 | 추출 대상 |
|-----------|-----------|
| `src/gateway/client.ts` | WebSocket 프레임 파싱, 재연결 로직 |
| `src/infra/device-identity.ts` | ED25519 키 생성/서명 |
| `src/node-host/runner.ts` | system.run 실행 로직 (spawn, timeout, env 필터링) |
| `src/node-host/config.ts` | 설정 저장 구조 |

## 검증

1. `cd apps/electron-node && pnpm dev` 로 Electron 앱 실행
2. 트레이 아이콘 표시 확인
3. 설정 UI에서 Gateway 주소 입력
4. Gateway 콘솔에서 페어링 승인
5. `openclaw nodes list` 로 노드 연결 확인
6. `openclaw nodes run --node <id> -- echo hello` 로 셸 실행 확인
7. 연결 끊김 → 자동 재연결 확인
8. `pnpm build:mac` / `pnpm build:win` 으로 인스톨러 생성 확인

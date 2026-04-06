---
summary: "Doctor 명령: 상태 점검, 설정 마이그레이션 및 복구 단계"
read_when:
  - doctor 마이그레이션 추가 또는 수정 시
  - 호환성을 깨는 설정 변경 도입 시
title: "Doctor"
---

# Doctor

`openclaw doctor`는 OpenClaw의 복구 + 마이그레이션 도구입니다. 오래된 설정/상태를 수정하고, 상태를 점검하고, 실행 가능한 복구 단계를 제공합니다.

## 빠른 시작

```bash
openclaw doctor
```

### 헤드리스 / 자동화

```bash
openclaw doctor --yes
```

프롬프트 없이 기본값 수락 (해당되는 경우 재시작/서비스/샌드박스 복구 단계 포함).

```bash
openclaw doctor --repair
```

프롬프트 없이 권장 복구 적용 (안전한 경우 복구 + 재시작).

```bash
openclaw doctor --repair --force
```

공격적인 복구도 적용 (커스텀 슈퍼바이저 설정 덮어쓰기).

```bash
openclaw doctor --non-interactive
```

프롬프트 없이 실행하고 안전한 마이그레이션만 적용 (설정 정규화 + 디스크상 상태 이동). 사람의 확인이 필요한 재시작/서비스/샌드박스 작업 건너뜀.
레거시 상태 마이그레이션은 감지 시 자동으로 실행됨.

```bash
openclaw doctor --deep
```

추가 게이트웨이 설치에 대해 시스템 서비스 스캔 (launchd/systemd/schtasks).

변경 사항을 작성하기 전에 검토하려면 먼저 설정 파일을 엽니다:

```bash
cat ~/.openclaw/openclaw.json
```

## 기능 (요약)

- git 설치에 대한 선택적 사전 비행 업데이트 (대화형 전용).
- UI 프로토콜 신선도 확인 (프로토콜 스키마가 새로우면 Control UI 재빌드).
- 상태 점검 + 재시작 프롬프트.
- 스킬 상태 요약 (적격/누락/차단됨).
- 레거시 값에 대한 설정 정규화.
- OpenCode Zen 프로바이더 재정의 경고 (`models.providers.opencode`).
- 레거시 디스크상 상태 마이그레이션 (세션/에이전트 디렉토리/WhatsApp 인증).
- 상태 무결성 및 권한 점검 (세션, 트랜스크립트, 상태 디렉토리).
- 로컬 실행 시 설정 파일 권한 점검 (chmod 600).
- 모델 인증 상태: OAuth 만료 확인, 만료 중인 토큰 새로고침 가능, 인증 프로필 쿨다운/비활성화 상태 보고.
- 추가 워크스페이스 디렉토리 감지 (`~/openclaw`).
- 샌드박싱 활성화 시 샌드박스 이미지 복구.
- 레거시 서비스 마이그레이션 및 추가 게이트웨이 감지.
- 게이트웨이 런타임 점검 (서비스 설치됨 but 실행 안 됨; 캐시된 launchd 레이블).
- 채널 상태 경고 (실행 중인 게이트웨이에서 프로브됨).
- 슈퍼바이저 설정 감사 (launchd/systemd/schtasks) 및 선택적 복구.
- 게이트웨이 런타임 모범 사례 점검 (Node vs Bun, 버전 관리자 경로).
- 게이트웨이 포트 충돌 진단 (기본값 `18789`).
- 열린 DM 정책에 대한 보안 경고.
- `gateway.auth.token`이 설정되지 않은 경우 게이트웨이 인증 경고 (로컬 모드; 토큰 생성 제안).
- Linux에서 systemd linger 점검.
- 소스 설치 점검 (pnpm 워크스페이스 불일치, 누락된 UI 에셋, 누락된 tsx 바이너리).
- 업데이트된 설정 + 마법사 메타데이터 작성.

## 상세 동작 및 근거

### 0) 선택적 업데이트 (git 설치)

git 체크아웃이고 doctor가 대화형으로 실행 중이면, doctor를 실행하기 전에 업데이트(fetch/rebase/build)를 제안합니다.

### 1) 설정 정규화

설정에 레거시 값 형태가 포함된 경우(예: 채널별 재정의 없이 `messages.ackReaction`) doctor가 현재 스키마로 정규화합니다.

### 2) 레거시 설정 키 마이그레이션

설정에 더 이상 사용되지 않는 키가 포함된 경우, 다른 명령은 실행을 거부하고 `openclaw doctor`를 실행하도록 요청합니다.

Doctor는:

- 어떤 레거시 키가 발견되었는지 설명합니다.
- 적용된 마이그레이션을 표시합니다.
- 업데이트된 스키마로 `~/.openclaw/openclaw.json`을 다시 작성합니다.

게이트웨이도 레거시 설정 형식을 감지하면 시작 시 doctor 마이그레이션을 자동 실행하므로, 오래된 설정은 수동 doctor 실행 없이 복구됩니다.

현재 마이그레이션:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.queue` → `messages.queue`
- `routing.bindings` → 최상위 `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `agent.*` → `agents.defaults` + `tools.*`

### 3) 레거시 상태 마이그레이션 (디스크 레이아웃)

Doctor는 오래된 디스크상 레이아웃을 현재 구조로 마이그레이션할 수 있습니다:

- 세션 저장소 + 트랜스크립트:
  - `~/.openclaw/sessions/`에서 `~/.openclaw/agents/<agentId>/sessions/`로
- 에이전트 디렉토리:
  - `~/.openclaw/agent/`에서 `~/.openclaw/agents/<agentId>/agent/`로
- WhatsApp 인증 상태 (Baileys):
  - 레거시 `~/.openclaw/credentials/*.json`에서 (`oauth.json` 제외)
  - `~/.openclaw/credentials/whatsapp/<accountId>/...`로 (기본 계정 id: `default`)

이러한 마이그레이션은 최선의 노력이며 멱등입니다; doctor는 레거시 폴더를 백업으로 남길 때 경고를 발행합니다.

### 4) 상태 무결성 점검

상태 디렉토리는 운영 핵심입니다. 사라지면 세션, 자격 증명, 로그 및 설정을 잃습니다(다른 곳에 백업이 없는 한).

Doctor 점검:

- **상태 디렉토리 누락**: 치명적 상태 손실에 대해 경고하고, 디렉토리 재생성을 프롬프트하고, 누락된 데이터를 복구할 수 없음을 상기시킵니다.
- **상태 디렉토리 권한**: 쓰기 가능성 검증; 권한 복구 제안.
- **세션 디렉토리 누락**: `sessions/` 및 세션 저장소 디렉토리는 기록을 유지하고 `ENOENT` 충돌을 방지하는 데 필요합니다.
- **트랜스크립트 불일치**: 최근 세션 항목에 트랜스크립트 파일이 누락된 경우 경고.
- **원격 모드 알림**: `gateway.mode=remote`인 경우 원격 호스트에서 doctor를 실행하도록 상기시킵니다(상태가 거기에 있음).
- **설정 파일 권한**: `~/.openclaw/openclaw.json`이 그룹/월드 읽기 가능한 경우 경고하고 `600`으로 강화 제안.

### 5) 모델 인증 상태 (OAuth 만료)

Doctor는 인증 저장소의 OAuth 프로필을 검사하고, 토큰이 만료 중/만료됨일 때 경고하고, 안전할 때 새로고침할 수 있습니다. Anthropic Claude Code 프로필이 오래된 경우 `claude setup-token` 실행을 제안합니다.
새로고침 프롬프트는 대화형(TTY) 실행 시에만 나타납니다; `--non-interactive`는 새로고침 시도를 건너뜁니다.

Doctor는 다음으로 인해 일시적으로 사용 불가능한 인증 프로필도 보고합니다:

- 짧은 쿨다운 (속도 제한/타임아웃/인증 실패)
- 긴 비활성화 (청구/크레딧 실패)

### 6) 샌드박스 이미지 복구

샌드박싱이 활성화된 경우, doctor는 Docker 이미지를 확인하고 현재 이미지가 누락된 경우 빌드하거나 레거시 이름으로 전환을 제안합니다.

### 7) 게이트웨이 서비스 마이그레이션 및 정리 힌트

Doctor는 레거시 게이트웨이 서비스(launchd/systemd/schtasks)를 감지하고 제거한 후 현재 게이트웨이 포트를 사용하여 OpenClaw 서비스를 설치할 것을 제안합니다. 추가 게이트웨이 유사 서비스를 스캔하고 정리 힌트를 출력할 수도 있습니다.

### 8) 보안 경고

Doctor는 허용 목록 없이 프로바이더가 DM에 열려 있거나 정책이 위험하게 설정된 경우 경고를 발행합니다.

### 9) systemd linger (Linux)

systemd 사용자 서비스로 실행하는 경우, doctor는 게이트웨이가 로그아웃 후에도 활성 상태를 유지하도록 lingering이 활성화되어 있는지 확인합니다.

### 10) 스킬 상태

Doctor는 현재 워크스페이스에 대한 적격/누락/차단된 스킬의 빠른 요약을 출력합니다.

### 11) 게이트웨이 인증 점검 (로컬 토큰)

Doctor는 로컬 게이트웨이에서 `gateway.auth`가 누락된 경우 경고하고 토큰 생성을 제안합니다. 자동화에서 토큰 생성을 강제하려면 `openclaw doctor --generate-gateway-token`을 사용합니다.

### 12) 게이트웨이 상태 점검 + 재시작

Doctor는 상태 점검을 실행하고 비정상으로 보일 때 게이트웨이 재시작을 제안합니다.

### 13) 채널 상태 경고

게이트웨이가 정상이면 doctor는 채널 상태 프로브를 실행하고 수정 제안과 함께 경고를 보고합니다.

### 14) 슈퍼바이저 설정 감사 + 복구

Doctor는 설치된 슈퍼바이저 설정(launchd/systemd/schtasks)에서 누락되거나 오래된 기본값(예: systemd network-online 종속성 및 재시작 지연)을 확인합니다. 불일치를 발견하면 업데이트를 권장하고 서비스 파일/작업을 현재 기본값으로 다시 작성할 수 있습니다.

참고:

- `openclaw doctor`는 슈퍼바이저 설정을 다시 작성하기 전에 프롬프트합니다.
- `openclaw doctor --yes`는 기본 복구 프롬프트를 수락합니다.
- `openclaw doctor --repair`는 프롬프트 없이 권장 수정을 적용합니다.
- `openclaw doctor --repair --force`는 커스텀 슈퍼바이저 설정을 덮어씁니다.
- `openclaw gateway install --force`를 통해 언제든지 전체 다시 작성을 강제할 수 있습니다.

### 15) 게이트웨이 런타임 + 포트 진단

Doctor는 서비스 런타임(PID, 마지막 종료 상태)을 검사하고 서비스가 설치되었지만 실제로 실행되지 않을 때 경고합니다. 게이트웨이 포트(기본값 `18789`)의 포트 충돌도 확인하고 가능한 원인을 보고합니다(게이트웨이 이미 실행 중, SSH 터널).

### 16) 게이트웨이 런타임 모범 사례

Doctor는 게이트웨이 서비스가 Bun 또는 버전 관리 Node 경로(`nvm`, `fnm`, `volta`, `asdf` 등)에서 실행될 때 경고합니다. WhatsApp + Telegram 채널은 Node가 필요하고, 버전 관리자 경로는 서비스가 셸 init을 로드하지 않기 때문에 업그레이드 후 깨질 수 있습니다. Doctor는 사용 가능한 경우 시스템 Node 설치(Homebrew/apt/choco)로 마이그레이션을 제안합니다.

### 17) 설정 작성 + 마법사 메타데이터

Doctor는 모든 설정 변경을 유지하고 doctor 실행을 기록하기 위해 마법사 메타데이터를 스탬프합니다.

### 18) 워크스페이스 팁 (백업 + 메모리 시스템)

Doctor는 누락된 경우 워크스페이스 메모리 시스템을 제안하고 워크스페이스가 아직 git 아래에 없으면 백업 팁을 출력합니다.

워크스페이스 구조 및 git 백업(권장 비공개 GitHub 또는 GitLab)에 대한 전체 가이드는 [/concepts/agent-workspace](/concepts/agent-workspace)를 참조하세요.

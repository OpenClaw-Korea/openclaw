---
summary: "npm 및 macOS 앱 릴리스 체크리스트 단계별 안내"
read_when:
  - npm 새 릴리스를 진행할 때
  - macOS 앱 새 릴리스를 진행할 때
  - 발행 전 메타데이터를 확인할 때
---

# 릴리스 체크리스트 (npm + macOS)

저장소 루트에서 `pnpm` (Node 22+)을 사용합니다. 태그/발행 전에 작업 트리를 깨끗하게 유지합니다.

## 운영자 트리거

운영자가 "release"라고 말하면 즉시 다음 사전 점검을 수행합니다(차단되지 않으면 추가 질문 없음):

- 이 문서와 `docs/platforms/mac/release.md`를 읽습니다.
- `~/.profile`에서 환경을 로드하고 `SPARKLE_PRIVATE_KEY_FILE` 및 App Store Connect 변수가 설정되어 있는지 확인합니다 (SPARKLE_PRIVATE_KEY_FILE은 `~/.profile`에 있어야 함).
- 필요한 경우 `~/Library/CloudStorage/Dropbox/Backup/Sparkle`에서 Sparkle 키를 사용합니다.

1. **버전 및 메타데이터**

- [ ] `package.json` 버전 업데이트 (예: `2026.1.29`).
- [ ] `pnpm plugins:sync`를 실행하여 확장 프로그램 패키지 버전 + 변경 로그를 정렬합니다.
- [ ] CLI/버전 문자열 업데이트: [`src/cli/program.ts`](https://github.com/openclaw/openclaw/blob/main/src/cli/program.ts) 및 [`src/provider-web.ts`](https://github.com/openclaw/openclaw/blob/main/src/provider-web.ts)의 Baileys 사용자 에이전트.
- [ ] 패키지 메타데이터 (이름, 설명, 저장소, 키워드, 라이선스) 확인 및 `bin` 맵이 `openclaw`에 대해 [`openclaw.mjs`](https://github.com/openclaw/openclaw/blob/main/openclaw.mjs)를 가리키는지 확인합니다.
- [ ] 의존성이 변경된 경우 `pnpm install`을 실행하여 `pnpm-lock.yaml`을 최신 상태로 유지합니다.

2. **빌드 및 아티팩트**

- [ ] A2UI 입력이 변경된 경우 `pnpm canvas:a2ui:bundle`을 실행하고 업데이트된 [`src/canvas-host/a2ui/a2ui.bundle.js`](https://github.com/openclaw/openclaw/blob/main/src/canvas-host/a2ui/a2ui.bundle.js)를 커밋합니다.
- [ ] `pnpm run build` (dist/ 재생성).
- [ ] npm 패키지 `files`에 모든 필수 `dist/*` 폴더가 포함되어 있는지 확인합니다 (특히 헤드리스 노드 및 ACP CLI의 경우 `dist/node-host/**` 및 `dist/acp/**`).
- [ ] `dist/build-info.json`이 존재하고 예상된 `commit` 해시를 포함하는지 확인합니다 (CLI 배너는 npm 설치에 이를 사용함).
- [ ] 선택사항: 빌드 후 `npm pack --pack-destination /tmp`; 타르볼 내용을 검사하고 GitHub 릴리스에 첨부할 수 있도록 준비합니다 (**커밋하지 마세요**).

3. **변경 로그 및 문서**

- [ ] `CHANGELOG.md`를 사용자 대면 하이라이트로 업데이트합니다 (필요한 경우 파일 생성); 항목을 버전별로 엄격하게 내림차순으로 유지합니다.
- [ ] README 예시/플래그가 현재 CLI 동작과 일치하는지 확인합니다 (특히 새 명령 또는 옵션).

4. **검증**

- [ ] `pnpm build`
- [ ] `pnpm check`
- [ ] `pnpm test` (또는 커버리지 출력이 필요한 경우 `pnpm test:coverage`)
- [ ] `pnpm release:check` (npm 팩 내용 확인)
- [ ] `OPENCLAW_INSTALL_SMOKE_SKIP_NONROOT=1 pnpm test:install:smoke` (Docker 설치 스모크 테스트, 빠른 경로; 릴리스 전 필수)
  - 이전 npm 릴리스가 알려진 손상된 경우 `OPENCLAW_INSTALL_SMOKE_PREVIOUS=<last-good-version>` 또는 `OPENCLAW_INSTALL_SMOKE_SKIP_PREVIOUS=1`을 설정하여 사전 설치 단계를 건너뜁니다.
- [ ] (선택사항) 전체 설치 프로그램 스모크 (논루트 + CLI 커버리지 추가): `pnpm test:install:smoke`
- [ ] (선택사항) 설치 프로그램 E2E (Docker, `curl -fsSL https://openclaw.ai/install.sh | bash` 실행, 온보딩 후 실제 도구 호출 실행):
  - `pnpm test:install:e2e:openai` (`OPENAI_API_KEY` 필요)
  - `pnpm test:install:e2e:anthropic` (`ANTHROPIC_API_KEY` 필요)
  - `pnpm test:install:e2e` (두 키 모두 필요; 두 프로바이더 모두 실행)
- [ ] (선택사항) 변경사항이 송수신 경로에 영향을 주는 경우 웹 게이트웨이 스팟 체크.

5. **macOS 앱 (Sparkle)**

- [ ] macOS 앱을 빌드 + 서명한 후 배포용으로 압축합니다.
- [ ] Sparkle 앱캐스트를 생성합니다 (HTML 노트는 [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)를 통해) 그리고 `appcast.xml`을 업데이트합니다.
- [ ] 앱 zip (및 선택사항 dSYM zip)을 GitHub 릴리스에 첨부할 준비를 합니다.
- [ ] [macOS 릴리스](/platforms/mac/release)에서 정확한 명령과 필수 환경 변수를 따릅니다.
  - `APP_BUILD`는 숫자 + 단조증가해야 합니다 (no `-beta`). Sparkle이 버전을 올바르게 비교합니다.
  - 공증하는 경우 App Store Connect API 환경 변수에서 생성된 `openclaw-notary` 키체인 프로필을 사용합니다 ([macOS 릴리스](/platforms/mac/release) 참고).

6. **발행 (npm)**

- [ ] git 상태가 깨끗한지 확인합니다. 필요에 따라 커밋하고 푸시합니다.
- [ ] 필요한 경우 `npm login` (2FA 확인).
- [ ] `npm publish --access public` (사전 릴리스의 경우 `--tag beta` 사용).
- [ ] 레지스트리 확인: `npm view openclaw version`, `npm view openclaw dist-tags`, 그리고 `npx -y openclaw@X.Y.Z --version` (또는 `--help`).

### 문제 해결 (2.0.0-beta2 릴리스 노트)

- **npm pack/publish가 중단되거나 큰 타르볼 생성**: `dist/OpenClaw.app`의 macOS 앱 번들 (및 릴리스 zip)이 패키지로 스윕됩니다. `package.json` `files`를 통해 발행 내용을 화이트리스팅하여 수정합니다 (dist 서브디렉토리, 문서, 스킬 포함; 앱 번들 제외). `npm pack --dry-run`으로 `dist/OpenClaw.app`이 나열되지 않았는지 확인합니다.
- **npm dist-tags의 인증 웹 루프**: 레거시 인증을 사용하여 OTP 프롬프트를 받습니다:
  - `NPM_CONFIG_AUTH_TYPE=legacy npm dist-tag add openclaw@X.Y.Z latest`
- **`npx` 검증 실패: `ECOMPROMISED: Lock compromised`**: 신선한 캐시로 다시 시도합니다:
  - `NPM_CONFIG_CACHE=/tmp/npm-cache-$(date +%s) npx -y openclaw@X.Y.Z --version`
- **늦은 수정 후 태그를 다시 지정해야 함**: 태그를 강제 업데이트하고 푸시한 후 GitHub 릴리스 자산이 여전히 일치하는지 확인합니다:
  - `git tag -f vX.Y.Z && git push -f origin vX.Y.Z`

7. **GitHub 릴리스 + 앱캐스트**

- [ ] 태그 및 푸시: `git tag vX.Y.Z && git push origin vX.Y.Z` (또는 `git push --tags`).
- [ ] `vX.Y.Z`에 대한 GitHub 릴리스를 생성/새로고침하고 제목은 **`openclaw X.Y.Z`** (단순한 태그 아님); 본문에는 해당 버전의 **전체** 변경 로그 섹션 (하이라이트 + 변경사항 + 수정)이 포함되어야 하며, 인라인이어야 합니다 (맨 링크 없음), 그리고 **본문 내에서 제목을 반복하면 안 됩니다**.
- [ ] 아티팩트 첨부: `npm pack` 타르볼 (선택사항), `OpenClaw-X.Y.Z.zip`, 및 `OpenClaw-X.Y.Z.dSYM.zip` (생성된 경우).
- [ ] 업데이트된 `appcast.xml`을 커밋하고 푸시합니다 (Sparkle은 main에서 피드).
- [ ] 깨끗한 임시 디렉토리에서 (`package.json` 없음) `npx -y openclaw@X.Y.Z send --help`를 실행하여 설치/CLI 진입점이 작동하는지 확인합니다.
- [ ] 릴리스 노트를 공지/공유합니다.

## 플러그인 발행 범위 (npm)

`@openclaw/*` 범위 아래에서 **npm에 이미 있는 플러그인만** 발행합니다. npm에 없는 번들 플러그인은 **디스크 트리만 유지**합니다 (여전히 `extensions/**`에 배포됨).

목록을 유도하는 프로세스:

1. `npm search @openclaw --json`을 실행하고 패키지 이름을 캡처합니다.
2. `extensions/*/package.json` 이름과 비교합니다.
3. **교집합만 발행**합니다 (이미 npm에 있음).

현재 npm 플러그인 목록 (필요에 따라 업데이트):

- @openclaw/bluebubbles
- @openclaw/diagnostics-otel
- @openclaw/discord
- @openclaw/lobster
- @openclaw/matrix
- @openclaw/msteams
- @openclaw/nextcloud-talk
- @openclaw/nostr
- @openclaw/voice-call
- @openclaw/zalo
- @openclaw/zalouser

릴리스 노트는 **기본값으로 설정되지 않은 새로운 선택사항 번들 플러그인도** 호출해야 합니다 (예: `tlon`).

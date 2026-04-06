---
summary: "Matrix 지원 상태, 기능 및 설정"
read_when:
  - Matrix 채널 기능 작업 시
title: "Matrix"
---

# Matrix (플러그인)

Matrix는 개방형 분산 메시징 프로토콜입니다. OpenClaw은 모든 홈서버에서 Matrix **사용자**로
연결되므로 봇용 Matrix 계정이 필요합니다. 로그인하면 봇에게 직접 DM을 보내거나
룸 (Matrix "그룹")에 초대할 수 있습니다. Beeper도 유효한 클라이언트 옵션이지만
E2EE가 활성화되어야 합니다.

상태: 플러그인을 통해 지원됨 (@vector-im/matrix-bot-sdk). 직접 메시지, 룸, 스레드, 미디어, 반응,
투표 (전송 + poll-start를 텍스트로), 위치 및 E2EE (암호화 지원 포함).

## 플러그인 필요

Matrix는 플러그인으로 제공되며 코어 설치에 포함되지 않습니다.

CLI를 통해 설치 (npm 레지스트리):

```bash
openclaw plugins install @openclaw/matrix
```

로컬 체크아웃 (git 저장소에서 실행 시):

```bash
openclaw plugins install ./extensions/matrix
```

설정/온보딩 중 Matrix를 선택하고 git 체크아웃이 감지되면,
OpenClaw이 자동으로 로컬 설치 경로를 제공합니다.

세부 정보: [플러그인](/plugin)

## 설정

1. Matrix 플러그인을 설치하세요:
   - npm에서: `openclaw plugins install @openclaw/matrix`
   - 로컬 체크아웃에서: `openclaw plugins install ./extensions/matrix`
2. 홈서버에서 Matrix 계정을 생성하세요:
   - 호스팅 옵션은 [https://matrix.org/ecosystem/hosting/](https://matrix.org/ecosystem/hosting/)을 참조하세요
   - 또는 직접 호스팅하세요.
3. 봇 계정의 액세스 토큰을 가져오세요:
   - 홈서버에서 Matrix 로그인 API를 `curl`로 사용하세요:

   ```bash
   curl --request POST \
     --url https://matrix.example.org/_matrix/client/v3/login \
     --header 'Content-Type: application/json' \
     --data '{
     "type": "m.login.password",
     "identifier": {
       "type": "m.id.user",
       "user": "your-user-name"
     },
     "password": "your-password"
   }'
   ```

   - `matrix.example.org`를 홈서버 URL로 바꾸세요.
   - 또는 `channels.matrix.userId` + `channels.matrix.password`를 설정하세요: OpenClaw이 같은
     로그인 엔드포인트를 호출하고, 액세스 토큰을 `~/.openclaw/credentials/matrix/credentials.json`에 저장하고,
     다음 시작 시 재사용합니다.

4. 자격 증명을 설정하세요:
   - 환경 변수: `MATRIX_HOMESERVER`, `MATRIX_ACCESS_TOKEN` (또는 `MATRIX_USER_ID` + `MATRIX_PASSWORD`)
   - 또는 설정: `channels.matrix.*`
   - 둘 다 설정된 경우 설정이 우선합니다.
   - 액세스 토큰 사용 시: 사용자 ID는 `/whoami`를 통해 자동으로 가져옵니다.
   - 설정 시 `channels.matrix.userId`는 전체 Matrix ID여야 합니다 (예: `@bot:example.org`).
5. 게이트웨이를 재시작하세요 (또는 온보딩을 완료하세요).
6. 봇과 DM을 시작하거나 모든 Matrix 클라이언트에서 룸에 초대하세요
   (Element, Beeper 등; https://matrix.org/ecosystem/clients/ 참조). Beeper는 E2EE가 필요하므로
   `channels.matrix.encryption: true`를 설정하고 장치를 확인하세요.

최소 설정 (액세스 토큰, 사용자 ID 자동 가져오기):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_***",
      dm: { policy: "pairing" },
    },
  },
}
```

E2EE 설정 (엔드투엔드 암호화 활성화):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_***",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

## 암호화 (E2EE)

엔드투엔드 암호화는 Rust 암호화 SDK를 통해 **지원됩니다**.

`channels.matrix.encryption: true`로 활성화:

- 암호화 모듈이 로드되면 암호화된 룸이 자동으로 복호화됩니다.
- 암호화된 룸으로 전송 시 아웃바운드 미디어가 암호화됩니다.
- 첫 연결 시 OpenClaw은 다른 세션에서 장치 확인을 요청합니다.
- 키 공유를 활성화하려면 다른 Matrix 클라이언트 (Element 등)에서 장치를 확인하세요.
- 암호화 모듈을 로드할 수 없으면 E2EE가 비활성화되고 암호화된 룸은 복호화되지 않습니다.
  OpenClaw은 경고를 기록합니다.
- 암호화 모듈 누락 오류가 표시되면 (예: `@matrix-org/matrix-sdk-crypto-nodejs-*`),
  `@matrix-org/matrix-sdk-crypto-nodejs`에 대한 빌드 스크립트를 허용하고
  `pnpm rebuild @matrix-org/matrix-sdk-crypto-nodejs`를 실행하거나
  `node node_modules/@matrix-org/matrix-sdk-crypto-nodejs/download-lib.js`로 바이너리를 가져오세요.

암호화 상태는 계정 + 액세스 토큰당
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/crypto/`에
저장됩니다 (SQLite 데이터베이스). 동기화 상태는 `bot-storage.json`에 있습니다.
액세스 토큰 (장치)이 변경되면 새 저장소가 생성되고 봇은
암호화된 룸에 대해 재확인되어야 합니다.

**장치 확인:**
E2EE가 활성화되면 봇은 시작 시 다른 세션에서 확인을 요청합니다.
Element (또는 다른 클라이언트)를 열고 확인 요청을 승인하여 신뢰를 설정하세요.
확인되면 봇이 암호화된 룸의 메시지를 복호화할 수 있습니다.

## 라우팅 모델

- 답장은 항상 Matrix로 돌아갑니다.
- DM은 에이전트의 메인 세션을 공유합니다. 룸은 그룹 세션에 매핑됩니다.

## 접근 제어 (DM)

- 기본값: `channels.matrix.dm.policy = "pairing"`. 알 수 없는 발신자는 페어링 코드를 받습니다.
- 승인 방법:
  - `openclaw pairing list matrix`
  - `openclaw pairing approve matrix <CODE>`
- 공개 DM: `channels.matrix.dm.policy="open"` 및 `channels.matrix.dm.allowFrom=["*"]`.
- `channels.matrix.dm.allowFrom`은 전체 Matrix 사용자 ID를 허용합니다 (예: `@user:server`). 마법사는 디렉토리 검색에서 정확히 일치하는 항목을 찾으면 표시 이름을 사용자 ID로 확인합니다.

## 룸 (그룹)

- 기본값: `channels.matrix.groupPolicy = "allowlist"` (멘션 게이팅). 설정되지 않은 경우 기본값을 재정의하려면 `channels.defaults.groupPolicy`를 사용하세요.
- `channels.matrix.groups`로 룸 허용목록 (룸 ID 또는 별칭; 이름은 디렉토리 검색에서 정확히 일치하는 항목을 찾으면 ID로 확인됨):

```json5
{
  channels: {
    matrix: {
      groupPolicy: "allowlist",
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
      groupAllowFrom: ["@owner:example.org"],
    },
  },
}
```

- `requireMention: false`는 해당 룸에서 자동 답장을 활성화합니다.
- `groups."*"`은 룸 전체에 걸쳐 멘션 게이팅에 대한 기본값을 설정할 수 있습니다.
- `groupAllowFrom`은 룸에서 봇을 트리거할 수 있는 발신자를 제한합니다 (전체 Matrix 사용자 ID).
- 룸별 `users` 허용목록은 특정 룸 내에서 발신자를 추가로 제한할 수 있습니다 (전체 Matrix 사용자 ID 사용).
- 설정 마법사는 룸 허용목록 (룸 ID, 별칭 또는 이름)을 묻고 정확하고 고유한 일치 항목에서만 이름을 확인합니다.
- 시작 시 OpenClaw은 허용목록의 룸/사용자 이름을 ID로 확인하고 매핑을 기록합니다. 확인되지 않은 항목은 허용목록 일치에 대해 무시됩니다.
- 초대는 기본적으로 자동 가입됩니다. `channels.matrix.autoJoin` 및 `channels.matrix.autoJoinAllowlist`로 제어하세요.
- **룸을 허용하지 않으려면** `channels.matrix.groupPolicy: "disabled"`를 설정하세요 (또는 빈 허용목록 유지).
- 레거시 키: `channels.matrix.rooms` (`groups`와 같은 형태).

## 스레드

- 답장 스레딩이 지원됩니다.
- `channels.matrix.threadReplies`는 답장이 스레드에 유지되는지 제어합니다:
  - `off`, `inbound` (기본값), `always`
- `channels.matrix.replyToMode`는 스레드에 답장하지 않을 때 답장 메타데이터를 제어합니다:
  - `off` (기본값), `first`, `all`

## 기능

| 기능          | 상태                                                                    |
| ------------- | ----------------------------------------------------------------------- |
| 직접 메시지   | ✅ 지원됨                                                               |
| 룸            | ✅ 지원됨                                                               |
| 스레드        | ✅ 지원됨                                                               |
| 미디어        | ✅ 지원됨                                                               |
| E2EE          | ✅ 지원됨 (암호화 모듈 필요)                                            |
| 반응          | ✅ 지원됨 (도구를 통한 전송/읽기)                                       |
| 투표          | ✅ 전송 지원됨; 인바운드 투표 시작은 텍스트로 변환됨 (응답/종료 무시됨) |
| 위치          | ✅ 지원됨 (geo URI; 고도 무시됨)                                        |
| 네이티브 명령 | ✅ 지원됨                                                               |

## 설정 참조 (Matrix)

전체 설정: [설정](/gateway/configuration)

프로바이더 옵션:

- `channels.matrix.enabled`: 채널 시작 활성화/비활성화.
- `channels.matrix.homeserver`: 홈서버 URL.
- `channels.matrix.userId`: Matrix 사용자 ID (액세스 토큰 사용 시 선택사항).
- `channels.matrix.accessToken`: 액세스 토큰.
- `channels.matrix.password`: 로그인 비밀번호 (토큰 저장됨).
- `channels.matrix.deviceName`: 장치 표시 이름.
- `channels.matrix.encryption`: E2EE 활성화 (기본값: false).
- `channels.matrix.initialSyncLimit`: 초기 동기화 한도.
- `channels.matrix.threadReplies`: `off | inbound | always` (기본값: inbound).
- `channels.matrix.textChunkLimit`: 아웃바운드 텍스트 청크 크기 (문자).
- `channels.matrix.chunkMode`: `length` (기본값) 또는 `newline`으로 길이 청킹 전에 빈 줄 (단락 경계)에서 분할.
- `channels.matrix.dm.policy`: `pairing | allowlist | open | disabled` (기본값: pairing).
- `channels.matrix.dm.allowFrom`: DM 허용목록 (전체 Matrix 사용자 ID). `open`은 `"*"`가 필요합니다. 마법사는 가능한 경우 이름을 ID로 확인합니다.
- `channels.matrix.groupPolicy`: `allowlist | open | disabled` (기본값: allowlist).
- `channels.matrix.groupAllowFrom`: 그룹 메시지에 대한 허용목록 발신자 (전체 Matrix 사용자 ID).
- `channels.matrix.allowlistOnly`: DM + 룸에 대한 허용목록 규칙 강제.
- `channels.matrix.groups`: 그룹 허용목록 + 룸별 설정 맵.
- `channels.matrix.rooms`: 레거시 그룹 허용목록/설정.
- `channels.matrix.replyToMode`: 스레드/태그에 대한 답장 모드.
- `channels.matrix.mediaMaxMb`: 인바운드/아웃바운드 미디어 한도 (MB).
- `channels.matrix.autoJoin`: 초대 처리 (`always | allowlist | off`, 기본값: always).
- `channels.matrix.autoJoinAllowlist`: 자동 가입에 대한 허용된 룸 ID/별칭.
- `channels.matrix.actions`: 액션별 도구 게이팅 (reactions/messages/pins/memberInfo/channelInfo).

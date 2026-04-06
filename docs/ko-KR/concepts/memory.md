---
summary: "OpenClaw 메모리 작동 방식 (워크스페이스 파일 + 자동 메모리 플러시)"
read_when:
  - 메모리 파일 레이아웃 및 워크플로우 필요 시
  - 자동 사전 압축 메모리 플러시 조정 시
---

# 메모리

OpenClaw 메모리는 **에이전트 워크스페이스의 일반 Markdown**입니다. 파일이 진실의 원천입니다; 모델은 디스크에 기록된 것만 "기억"합니다.

메모리 검색 도구는 활성 메모리 플러그인(기본값: `memory-core`)에서 제공됩니다. `plugins.slots.memory = "none"`으로 메모리 플러그인을 비활성화하세요.

## 메모리 파일 (Markdown)

기본 워크스페이스 레이아웃은 두 개의 메모리 레이어를 사용합니다:

- `memory/YYYY-MM-DD.md`
  - 일일 로그(추가 전용).
  - 세션 시작 시 오늘 + 어제 파일을 읽습니다.
- `MEMORY.md` (선택 사항)
  - 큐레이션된 장기 메모리.
  - **메인, 비공개 세션에서만 로드**(그룹 컨텍스트에서는 절대 안 됨).

이 파일들은 워크스페이스(`agents.defaults.workspace`, 기본값 `~/clawd`) 아래에 있습니다. 전체 레이아웃은 [에이전트 워크스페이스](/concepts/agent-workspace)를 참조하세요.

## 메모리 작성 시기

- 결정, 선호도 및 영구 사실은 `MEMORY.md`에 기록합니다.
- 일상적인 노트와 진행 중인 컨텍스트는 `memory/YYYY-MM-DD.md`에 기록합니다.
- 누군가 "이것을 기억해"라고 말하면 기록하세요(RAM에 보관하지 마세요).
- 이 영역은 여전히 진화하고 있습니다. 모델에게 메모리를 저장하도록 상기시키는 것이 도움이 됩니다; 모델은 무엇을 해야 할지 알 것입니다.
- 무언가를 고수하고 싶다면 **봇에게 메모리에 기록하도록 요청**하세요.

## 자동 메모리 플러시 (사전 압축 핑)

세션이 **자동 압축에 가까워지면** OpenClaw는 컨텍스트가 압축되기 **전에** 모델에게 영구 메모리를 작성하도록 상기시키는 **무음, 에이전트 턴**을 트리거합니다. 기본 프롬프트는 모델이 *응답할 수 있다*고 명시적으로 말하지만, 일반적으로 `NO_REPLY`가 올바른 응답이므로 사용자는 이 턴을 보지 못합니다.

이는 `agents.defaults.compaction.memoryFlush`로 제어됩니다:

```json5
{
  agents: {
    defaults: {
      compaction: {
        reserveTokensFloor: 20000,
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 4000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

세부 사항:

- **소프트 임계값**: 세션 토큰 추정치가 `contextWindow - reserveTokensFloor - softThresholdTokens`를 초과하면 플러시가 트리거됩니다.
- **기본적으로 무음**: 프롬프트에 `NO_REPLY`가 포함되어 있어 아무것도 전달되지 않습니다.
- **두 개의 프롬프트**: 사용자 프롬프트와 시스템 프롬프트가 리마인더를 추가합니다.
- **압축 주기당 한 번의 플러시**(`sessions.json`에서 추적).
- **워크스페이스는 쓰기 가능해야 함**: 세션이 `workspaceAccess: "ro"` 또는 `"none"`으로 샌드박스에서 실행되는 경우 플러시가 건너뜁니다.

전체 압축 수명 주기는 [세션 관리 + 압축](/reference/session-management-compaction)을 참조하세요.

## 벡터 메모리 검색

OpenClaw는 `MEMORY.md` 및 `memory/*.md`에 대한 작은 벡터 인덱스를 구축하여 의미론적 쿼리가 표현이 다르더라도 관련 노트를 찾을 수 있도록 합니다.

기본값:

- 기본적으로 활성화됩니다.
- 메모리 파일의 변경 사항을 감시합니다(디바운스).
- 기본적으로 원격 임베딩을 사용합니다. `memorySearch.provider`가 설정되지 않은 경우 OpenClaw가 자동 선택합니다:
  1. `memorySearch.local.modelPath`가 설정되어 있고 파일이 존재하면 `local`.
  2. OpenAI 키를 해석할 수 있으면 `openai`.
  3. Gemini 키를 해석할 수 있으면 `gemini`.
  4. 그렇지 않으면 설정될 때까지 메모리 검색이 비활성화됩니다.
- 로컬 모드는 node-llama-cpp를 사용하며 `pnpm approve-builds`가 필요할 수 있습니다.
- 사용 가능한 경우 sqlite-vec를 사용하여 SQLite 내부의 벡터 검색을 가속화합니다.

원격 임베딩은 임베딩 프로바이더에 대한 API 키가 **필요**합니다. OpenClaw는 인증 프로필, `models.providers.*.apiKey` 또는 환경 변수에서 키를 해석합니다. Codex OAuth는 채팅/완성만 다루며 메모리 검색을 위한 임베딩을 만족시키지 **않습니다**. Gemini의 경우 `GEMINI_API_KEY` 또는 `models.providers.google.apiKey`를 사용하세요. 사용자 정의 OpenAI 호환 엔드포인트를 사용할 때는 `memorySearch.remote.apiKey`(및 선택적 `memorySearch.remote.headers`)를 설정하세요.

### QMD 백엔드 (실험적)

`memory.backend = "qmd"`로 설정하여 내장 SQLite 인덱서를 [QMD](https://github.com/tobi/qmd)로 교체하세요: BM25 + 벡터 + 재랭킹을 결합한 로컬 우선 검색 사이드카입니다. Markdown은 진실의 원천으로 유지됩니다; OpenClaw는 검색을 위해 QMD에 셸 아웃합니다. 주요 포인트:

**전제 조건**

- 기본적으로 비활성화됩니다. 설정별로 선택(`memory.backend = "qmd"`).
- QMD CLI를 별도로 설치하세요(`bun install -g github.com/tobi/qmd` 또는 릴리스 받기) 그리고 `qmd` 바이너리가 게이트웨이의 `PATH`에 있는지 확인하세요.
- QMD는 확장을 허용하는 SQLite 빌드가 필요합니다(macOS에서 `brew install sqlite`).
- QMD는 Bun + `node-llama-cpp`를 통해 완전히 로컬로 실행되며 첫 사용 시 HuggingFace에서 GGUF 모델을 자동 다운로드합니다(별도의 Ollama 데몬 필요 없음).
- 게이트웨이는 `~/.openclaw/agents/<agentId>/qmd/` 아래의 자체 포함 XDG 홈에서 QMD를 실행하며 `XDG_CONFIG_HOME` 및 `XDG_CACHE_HOME`을 설정합니다.
- OS 지원: Bun + SQLite가 설치되면 macOS 및 Linux가 즉시 작동합니다. Windows는 WSL2를 통해 가장 잘 지원됩니다.

**사이드카 실행 방법**

- 게이트웨이는 `~/.openclaw/agents/<agentId>/qmd/` 아래에 자체 포함 QMD 홈을 작성합니다(설정 + 캐시 + sqlite DB).
- 컬렉션은 `memory.qmd.paths`(및 기본 워크스페이스 메모리 파일)에서 `index.yml`로 다시 작성되며, 부팅 시 및 설정 가능한 간격(`memory.qmd.update.interval`, 기본값 5분)으로 `qmd update` + `qmd embed`가 실행됩니다.
- 검색은 `qmd query --json`을 통해 실행됩니다. QMD가 실패하거나 바이너리가 누락된 경우 OpenClaw는 자동으로 내장 SQLite 관리자로 폴백하여 메모리 도구가 계속 작동하도록 합니다.
- **첫 번째 검색이 느릴 수 있습니다**: QMD가 첫 번째 `qmd query` 실행 시 로컬 GGUF 모델(재랭커/쿼리 확장)을 다운로드할 수 있습니다.
  - OpenClaw는 QMD를 실행할 때 자동으로 `XDG_CONFIG_HOME`/`XDG_CACHE_HOME`을 설정합니다.
  - 수동으로 모델을 사전 다운로드하고(OpenClaw가 사용하는 동일한 인덱스를 예열하려면) 에이전트의 XDG 디렉토리로 일회성 쿼리를 실행하세요.

    OpenClaw의 QMD 상태는 **상태 디렉토리** 아래에 있습니다(기본값 `~/.openclaw`).
    동일한 XDG 변수를 내보내어 `qmd`를 정확히 동일한 인덱스로 지정할 수 있습니다:

    ```bash
    # OpenClaw가 사용하는 동일한 상태 디렉토리 선택
    STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
    if [ -d "$HOME/.moltbot" ] && [ ! -d "$HOME/.openclaw" ] \
      && [ -z "${OPENCLAW_STATE_DIR:-}" ]; then
      STATE_DIR="$HOME/.moltbot"
    fi

    export XDG_CONFIG_HOME="$STATE_DIR/agents/main/qmd/xdg-config"
    export XDG_CACHE_HOME="$STATE_DIR/agents/main/qmd/xdg-cache"

    # (선택 사항) 인덱스 새로 고침 + 임베딩 강제 실행
    qmd update
    qmd embed

    # 예열 / 첫 번째 모델 다운로드 트리거
    qmd query "test" -c memory-root --json >/dev/null 2>&1
    ```

**설정 표면 (`memory.qmd.*`)**

- `command` (기본값 `qmd`): 실행 파일 경로 재정의.
- `includeDefaultMemory` (기본값 `true`): `MEMORY.md` + `memory/**/*.md` 자동 인덱싱.
- `paths[]`: 추가 디렉토리/파일 추가(`path`, 선택적 `pattern`, 선택적 안정 `name`).
- `sessions`: 세션 JSONL 인덱싱 선택(`enabled`, `retentionDays`, `exportDir`).
- `update`: 새로 고침 케이던스 제어(`interval`, `debounceMs`, `onBoot`, `embedInterval`).
- `limits`: 리콜 페이로드 제한(`maxResults`, `maxSnippetChars`, `maxInjectedChars`, `timeoutMs`).
- `scope`: [`session.sendPolicy`](/gateway/configuration#session)와 동일한 스키마.
  기본값은 DM 전용(`deny` 모두, `allow` 다이렉트 채팅); 그룹/채널에서 QMD 히트를 표시하려면 완화하세요.
- 워크스페이스 외부에서 소스된 스니펫은 `memory_search` 결과에서 `qmd/<collection>/<relative-path>`로 표시됩니다; `memory_get`은 해당 접두사를 이해하고 설정된 QMD 컬렉션 루트에서 읽습니다.
- `memory.qmd.sessions.enabled = true`인 경우 OpenClaw는 정제된 세션 트랜스크립트(사용자/어시스턴트 턴)를 `~/.openclaw/agents/<id>/qmd/sessions/` 아래의 전용 QMD 컬렉션으로 내보내므로 `memory_search`가 내장 SQLite 인덱스를 건드리지 않고 최근 대화를 회상할 수 있습니다.
- `memory_search` 스니펫은 이제 `memory.citations`가 `auto`/`on`일 때 `Source: <path#line>` 바닥글을 포함합니다; `memory.citations = "off"`로 설정하여 경로 메타데이터를 내부적으로 유지하세요(에이전트는 여전히 `memory_get`에 대한 경로를 받지만 스니펫 텍스트는 바닥글을 생략하고 시스템 프롬프트는 에이전트에게 인용하지 말라고 경고합니다).

**예시**

```json5
memory: {
  backend: "qmd",
  citations: "auto",
  qmd: {
    includeDefaultMemory: true,
    update: { interval: "5m", debounceMs: 15000 },
    limits: { maxResults: 6, timeoutMs: 4000 },
    scope: {
      default: "deny",
      rules: [{ action: "allow", match: { chatType: "direct" } }]
    },
    paths: [
      { name: "docs", path: "~/notes", pattern: "**/*.md" }
    ]
  }
}
```

**인용 및 폴백**

- `memory.citations`는 백엔드에 관계없이 적용됩니다(`auto`/`on`/`off`).
- `qmd`가 실행되면 `status().backend = "qmd"`로 태그를 지정하여 진단이 어떤 엔진이 결과를 제공했는지 보여줍니다. QMD 서브프로세스가 종료되거나 JSON 출력을 파싱할 수 없는 경우 검색 관리자는 경고를 기록하고 QMD가 복구될 때까지 내장 프로바이더(기존 Markdown 임베딩)를 반환합니다.

### 추가 메모리 경로

기본 워크스페이스 레이아웃 외부의 Markdown 파일을 인덱싱하려면 명시적 경로를 추가하세요:

```json5
agents: {
  defaults: {
    memorySearch: {
      extraPaths: ["../team-docs", "/srv/shared-notes/overview.md"]
    }
  }
}
```

참고:

- 경로는 절대 경로 또는 워크스페이스 상대 경로일 수 있습니다.
- 디렉토리는 `.md` 파일에 대해 재귀적으로 스캔됩니다.
- Markdown 파일만 인덱싱됩니다.
- 심볼릭 링크는 무시됩니다(파일 또는 디렉토리).

### Gemini 임베딩 (네이티브)

Gemini 임베딩 API를 직접 사용하려면 프로바이더를 `gemini`로 설정하세요:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-001",
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

참고:

- `remote.baseUrl`은 선택 사항입니다(기본값은 Gemini API 기본 URL).
- `remote.headers`를 사용하면 필요한 경우 추가 헤더를 추가할 수 있습니다.
- 기본 모델: `gemini-embedding-001`.

**사용자 정의 OpenAI 호환 엔드포인트**(OpenRouter, vLLM 또는 프록시)를 사용하려면 OpenAI 프로바이더와 함께 `remote` 설정을 사용할 수 있습니다:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_OPENAI_COMPAT_API_KEY",
        headers: { "X-Custom-Header": "value" }
      }
    }
  }
}
```

API 키를 설정하지 않으려면 `memorySearch.provider = "local"`을 사용하거나 `memorySearch.fallback = "none"`으로 설정하세요.

폴백:

- `memorySearch.fallback`은 `openai`, `gemini`, `local` 또는 `none`일 수 있습니다.
- 폴백 프로바이더는 기본 임베딩 프로바이더가 실패할 때만 사용됩니다.

배치 인덱싱(OpenAI + Gemini):

- OpenAI 및 Gemini 임베딩에 대해 기본적으로 활성화됩니다. 비활성화하려면 `agents.defaults.memorySearch.remote.batch.enabled = false`로 설정하세요.
- 기본 동작은 배치 완료를 기다립니다; 필요한 경우 `remote.batch.wait`, `remote.batch.pollIntervalMs` 및 `remote.batch.timeoutMinutes`를 조정하세요.
- `remote.batch.concurrency`를 설정하여 병렬로 제출하는 배치 작업 수를 제어하세요(기본값: 2).
- 배치 모드는 `memorySearch.provider = "openai"` 또는 `"gemini"`일 때 적용되며 해당 API 키를 사용합니다.
- Gemini 배치 작업은 비동기 임베딩 배치 엔드포인트를 사용하며 Gemini Batch API 가용성이 필요합니다.

OpenAI 배치가 빠르고 저렴한 이유:

- 대규모 백필의 경우 OpenAI는 일반적으로 우리가 지원하는 가장 빠른 옵션입니다. 단일 배치 작업에 많은 임베딩 요청을 제출하고 OpenAI가 비동기적으로 처리하도록 할 수 있기 때문입니다.
- OpenAI는 Batch API 워크로드에 대해 할인된 가격을 제공하므로 대규모 인덱싱 실행은 일반적으로 동일한 요청을 동기적으로 보내는 것보다 저렴합니다.
- 자세한 내용은 OpenAI Batch API 문서 및 가격을 참조하세요:
  - https://platform.openai.com/docs/api-reference/batch
  - https://platform.openai.com/pricing

설정 예시:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      fallback: "openai",
      remote: {
        batch: { enabled: true, concurrency: 2 }
      },
      sync: { watch: true }
    }
  }
}
```

도구:

- `memory_search` — 파일 + 라인 범위와 함께 스니펫을 반환합니다.
- `memory_get` — 경로로 메모리 파일 콘텐츠를 읽습니다.

로컬 모드:

- `agents.defaults.memorySearch.provider = "local"`로 설정하세요.
- `agents.defaults.memorySearch.local.modelPath` 제공(GGUF 또는 `hf:` URI).
- 선택 사항: `agents.defaults.memorySearch.fallback = "none"`으로 설정하여 원격 폴백을 피하세요.

### 메모리 도구 작동 방식

- `memory_search`는 `MEMORY.md` + `memory/**/*.md`의 Markdown 청크(~400 토큰 목표, 80 토큰 오버랩)를 의미론적으로 검색합니다. 스니펫 텍스트(~700자 제한), 파일 경로, 라인 범위, 점수, 프로바이더/모델 및 로컬 → 원격 임베딩에서 폴백했는지 여부를 반환합니다. 전체 파일 페이로드는 반환되지 않습니다.
- `memory_get`은 특정 메모리 Markdown 파일(워크스페이스 상대)을 읽으며, 선택적으로 시작 라인과 N 라인에서 읽습니다. `MEMORY.md` / `memory/` 외부의 경로는 거부됩니다.
- 두 도구는 에이전트에 대해 `memorySearch.enabled`가 true로 해석될 때만 활성화됩니다.

### 인덱싱되는 것(및 시기)

- 파일 유형: Markdown만(`MEMORY.md`, `memory/**/*.md`).
- 인덱스 저장소: 에이전트별 SQLite `~/.openclaw/memory/<agentId>.sqlite` (`agents.defaults.memorySearch.store.path`로 설정 가능, `{agentId}` 토큰 지원).
- 최신성: `MEMORY.md` + `memory/`의 감시자가 인덱스를 더티로 표시합니다(디바운스 1.5초). 동기화는 세션 시작 시, 검색 시 또는 간격으로 예약되고 비동기적으로 실행됩니다. 세션 트랜스크립트는 델타 임계값을 사용하여 백그라운드 동기화를 트리거합니다.
- 재인덱싱 트리거: 인덱스는 임베딩 **프로바이더/모델 + 엔드포인트 지문 + 청킹 매개변수**를 저장합니다. 이 중 하나라도 변경되면 OpenClaw는 자동으로 재설정하고 전체 저장소를 재인덱싱합니다.

### 하이브리드 검색 (BM25 + 벡터)

활성화된 경우 OpenClaw는 다음을 결합합니다:

- **벡터 유사성** (의미론적 매치, 표현이 다를 수 있음)
- **BM25 키워드 관련성** (ID, 환경 변수, 코드 심볼과 같은 정확한 토큰)

전체 텍스트 검색을 플랫폼에서 사용할 수 없는 경우 OpenClaw는 벡터 전용 검색으로 폴백합니다.

#### 하이브리드 이유는?

벡터 검색은 "이것은 같은 의미"에 뛰어납니다:

- "Mac Studio 게이트웨이 호스트" vs "게이트웨이를 실행하는 머신"
- "파일 업데이트 디바운스" vs "모든 쓰기마다 인덱싱 피하기"

그러나 정확하고 신호가 높은 토큰에서는 약할 수 있습니다:

- ID(`a828e60`, `b3b9895a…`)
- 코드 심볼(`memorySearch.query.hybrid`)
- 오류 문자열("sqlite-vec unavailable")

BM25(전체 텍스트)는 반대입니다: 정확한 토큰에 강하고 패러프레이즈에 약합니다.
하이브리드 검색은 실용적인 중간 지점입니다: **두 검색 신호를 모두 사용**하여 "자연어" 쿼리와 "건초 더미에서 바늘" 쿼리 모두에 대해 좋은 결과를 얻을 수 있습니다.

#### 결과 병합 방법(현재 설계)

구현 스케치:

1. 양쪽에서 후보 풀 검색:

- **벡터**: 코사인 유사성으로 상위 `maxResults * candidateMultiplier`.
- **BM25**: FTS5 BM25 순위로 상위 `maxResults * candidateMultiplier` (낮을수록 좋음).

2. BM25 순위를 0..1 점수로 변환:

- `textScore = 1 / (1 + max(0, bm25Rank))`

3. 청크 ID별로 후보를 통합하고 가중 점수 계산:

- `finalScore = vectorWeight * vectorScore + textWeight * textScore`

참고:

- `vectorWeight` + `textWeight`는 설정 해석에서 1.0으로 정규화되므로 가중치는 백분율로 작동합니다.
- 임베딩을 사용할 수 없는 경우(또는 프로바이더가 제로 벡터를 반환하는 경우) BM25를 여전히 실행하고 키워드 매치를 반환합니다.
- FTS5를 생성할 수 없는 경우 벡터 전용 검색을 유지합니다(하드 실패 없음).

이것은 "IR 이론 완벽"이 아니지만 간단하고 빠르며 실제 노트에서 리콜/정밀도를 향상시키는 경향이 있습니다.
나중에 더 정교하게 하려면 일반적인 다음 단계는 Reciprocal Rank Fusion(RRF) 또는 점수 정규화(min/max 또는 z-score)를 혼합하기 전에 수행하는 것입니다.

설정:

```json5
agents: {
  defaults: {
    memorySearch: {
      query: {
        hybrid: {
          enabled: true,
          vectorWeight: 0.7,
          textWeight: 0.3,
          candidateMultiplier: 4
        }
      }
    }
  }
}
```

### 임베딩 캐시

OpenClaw는 **청크 임베딩**을 SQLite에 캐시하여 재인덱싱 및 빈번한 업데이트(특히 세션 트랜스크립트)가 변경되지 않은 텍스트를 다시 임베딩하지 않도록 할 수 있습니다.

설정:

```json5
agents: {
  defaults: {
    memorySearch: {
      cache: {
        enabled: true,
        maxEntries: 50000
      }
    }
  }
}
```

### 세션 메모리 검색 (실험적)

선택적으로 **세션 트랜스크립트**를 인덱싱하고 `memory_search`를 통해 표시할 수 있습니다.
이것은 실험적 플래그 뒤에 게이트됩니다.

```json5
agents: {
  defaults: {
    memorySearch: {
      experimental: { sessionMemory: true },
      sources: ["memory", "sessions"]
    }
  }
}
```

참고:

- 세션 인덱싱은 **선택 사항**입니다(기본적으로 꺼짐).
- 세션 업데이트는 디바운스되고 델타 임계값을 초과하면 **비동기적으로 인덱싱**됩니다(최선의 노력).
- `memory_search`는 인덱싱을 차단하지 않습니다; 백그라운드 동기화가 완료될 때까지 결과가 약간 오래될 수 있습니다.
- 결과에는 여전히 스니펫만 포함됩니다; `memory_get`은 메모리 파일로 제한됩니다.
- 세션 인덱싱은 에이전트별로 격리됩니다(해당 에이전트의 세션 로그만 인덱싱됨).
- 세션 로그는 디스크(`~/.openclaw/agents/<agentId>/sessions/*.jsonl`)에 있습니다. 파일 시스템 액세스 권한이 있는 프로세스/사용자는 읽을 수 있으므로 디스크 액세스를 신뢰 경계로 취급하세요. 더 엄격한 격리를 위해 별도의 OS 사용자 또는 호스트에서 에이전트를 실행하세요.

델타 임계값(기본값 표시):

```json5
agents: {
  defaults: {
    memorySearch: {
      sync: {
        sessions: {
          deltaBytes: 100000,   // ~100 KB
          deltaMessages: 50     // JSONL 라인
        }
      }
    }
  }
}
```

### SQLite 벡터 가속 (sqlite-vec)

sqlite-vec 확장을 사용할 수 있는 경우 OpenClaw는 임베딩을 SQLite 가상 테이블(`vec0`)에 저장하고 데이터베이스에서 벡터 거리 쿼리를 수행합니다. 이렇게 하면 모든 임베딩을 JS로 로드하지 않고도 검색이 빠릅니다.

설정(선택 사항):

```json5
agents: {
  defaults: {
    memorySearch: {
      store: {
        vector: {
          enabled: true,
          extensionPath: "/path/to/sqlite-vec"
        }
      }
    }
  }
}
```

참고:

- `enabled`는 기본적으로 true입니다; 비활성화되면 저장된 임베딩에 대한 인프로세스 코사인 유사성으로 폴백합니다.
- sqlite-vec 확장이 누락되거나 로드에 실패하면 OpenClaw는 오류를 기록하고 JS 폴백으로 계속합니다(벡터 테이블 없음).
- `extensionPath`는 번들 sqlite-vec 경로를 재정의합니다(사용자 정의 빌드 또는 비표준 설치 위치에 유용).

### 로컬 임베딩 자동 다운로드

- 기본 로컬 임베딩 모델: `hf:ggml-org/embeddinggemma-300M-GGUF/embeddinggemma-300M-Q8_0.gguf` (~0.6 GB).
- `memorySearch.provider = "local"`일 때 `node-llama-cpp`가 `modelPath`를 해석합니다; GGUF가 누락된 경우 캐시(또는 설정된 경우 `local.modelCacheDir`)로 **자동 다운로드**한 다음 로드합니다. 재시도 시 다운로드가 재개됩니다.
- 네이티브 빌드 요구 사항: `pnpm approve-builds`를 실행하고 `node-llama-cpp`를 선택한 다음 `pnpm rebuild node-llama-cpp`를 실행하세요.
- 폴백: 로컬 설정이 실패하고 `memorySearch.fallback = "openai"`인 경우 자동으로 원격 임베딩(`openai/text-embedding-3-small`, 재정의하지 않는 한)으로 전환하고 이유를 기록합니다.

### 사용자 정의 OpenAI 호환 엔드포인트 예시

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_REMOTE_API_KEY",
        headers: {
          "X-Organization": "org-id",
          "X-Project": "project-id"
        }
      }
    }
  }
}
```

참고:

- `remote.*`는 `models.providers.openai.*`보다 우선합니다.
- `remote.headers`는 OpenAI 헤더와 병합됩니다; 키 충돌 시 원격이 우선합니다. OpenAI 기본값을 사용하려면 `remote.headers`를 생략하세요.

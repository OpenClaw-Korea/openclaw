---
summary: "Ollama(로컬 LLM 런타임)로 OpenClaw 실행"
read_when:
  - Ollama를 통해 로컬 모델로 OpenClaw를 실행하려는 경우
  - Ollama 설정 및 구성 가이드가 필요한 경우
title: "Ollama"
---

# Ollama

Ollama는 머신에서 오픈소스 모델을 쉽게 실행할 수 있게 해주는 로컬 LLM 런타임입니다. OpenClaw는 Ollama의 OpenAI 호환 API와 통합되며, `OLLAMA_API_KEY`(또는 인증 프로필)로 옵트인하고 명시적인 `models.providers.ollama` 항목을 정의하지 않은 경우 **도구 지원 모델을 자동으로 발견**할 수 있습니다.

## 빠른 시작

1. Ollama 설치: https://ollama.ai

2. 모델 다운로드:

```bash
ollama pull llama3.3
# 또는
ollama pull qwen2.5-coder:32b
# 또는
ollama pull deepseek-r1:32b
```

3. OpenClaw용 Ollama 활성화 (임의의 값 사용 가능; Ollama는 실제 키가 필요하지 않음):

```bash
# 환경 변수 설정
export OLLAMA_API_KEY="ollama-local"

# 또는 설정 파일에서 구성
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

4. Ollama 모델 사용:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/llama3.3" },
    },
  },
}
```

## 모델 디스커버리 (암시적 프로바이더)

`OLLAMA_API_KEY`(또는 인증 프로필)를 설정하고 `models.providers.ollama`를 정의하지 **않으면** OpenClaw는 `http://127.0.0.1:11434`의 로컬 Ollama 인스턴스에서 모델을 발견합니다:

- `/api/tags` 및 `/api/show`를 쿼리
- `tools` 기능을 보고하는 모델만 유지
- 모델이 `thinking`을 보고하면 `reasoning`으로 표시
- 사용 가능한 경우 `model_info["<arch>.context_length"]`에서 `contextWindow`를 읽음
- `maxTokens`를 컨텍스트 윈도우의 10배로 설정
- 모든 비용을 `0`으로 설정

이를 통해 수동 모델 항목 없이도 카탈로그를 Ollama의 기능에 맞게 유지할 수 있습니다.

사용 가능한 모델 확인:

```bash
ollama list
openclaw models list
```

새 모델을 추가하려면 Ollama로 다운로드하세요:

```bash
ollama pull mistral
```

새 모델이 자동으로 발견되어 사용할 수 있게 됩니다.

`models.providers.ollama`를 명시적으로 설정하면 자동 발견이 건너뛰어지고 모델을 수동으로 정의해야 합니다(아래 참조).

## 설정

### 기본 설정 (암시적 디스커버리)

Ollama를 활성화하는 가장 간단한 방법은 환경 변수를 사용하는 것입니다:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### 명시적 설정 (수동 모델)

다음과 같은 경우 명시적 설정을 사용하세요:

- Ollama가 다른 호스트/포트에서 실행되는 경우.
- 특정 컨텍스트 윈도우 또는 모델 목록을 강제하려는 경우.
- 도구 지원을 보고하지 않는 모델을 포함하려는 경우.

```json5
{
  models: {
    providers: {
      ollama: {
        // OpenAI 호환 API를 위해 /v1을 포함하는 호스트 사용
        baseUrl: "http://ollama-host:11434/v1",
        apiKey: "ollama-local",
        api: "openai-completions",
        models: [
          {
            id: "llama3.3",
            name: "Llama 3.3",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

`OLLAMA_API_KEY`가 설정되어 있으면 프로바이더 항목에서 `apiKey`를 생략할 수 있으며 OpenClaw는 가용성 확인을 위해 이를 채웁니다.

### 사용자 정의 base URL (명시적 설정)

Ollama가 다른 호스트 또는 포트에서 실행되는 경우(명시적 설정은 자동 발견을 비활성화하므로 모델을 수동으로 정의):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434/v1",
      },
    },
  },
}
```

### 모델 선택

설정이 완료되면 모든 Ollama 모델을 사용할 수 있습니다:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/llama3.3",
        fallback: ["ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## 고급

### 추론 모델

Ollama가 `/api/show`에서 `thinking`을 보고하면 OpenClaw는 모델을 추론 가능으로 표시합니다:

```bash
ollama pull deepseek-r1:32b
```

### 모델 비용

Ollama는 무료이며 로컬에서 실행되므로 모든 모델 비용은 $0로 설정됩니다.

### 컨텍스트 윈도우

자동 발견된 모델의 경우 OpenClaw는 사용 가능한 경우 Ollama가 보고하는 컨텍스트 윈도우를 사용하고, 그렇지 않으면 기본값 `8192`를 사용합니다. 명시적 프로바이더 설정에서 `contextWindow` 및 `maxTokens`를 재정의할 수 있습니다.

## 문제 해결

### Ollama가 감지되지 않음

Ollama가 실행 중이고 `OLLAMA_API_KEY`(또는 인증 프로필)를 설정했는지, 그리고 명시적인 `models.providers.ollama` 항목을 정의하지 **않았는지** 확인하세요:

```bash
ollama serve
```

그리고 API에 액세스할 수 있는지 확인하세요:

```bash
curl http://localhost:11434/api/tags
```

### 사용 가능한 모델 없음

OpenClaw는 도구 지원을 보고하는 모델만 자동으로 발견합니다. 모델이 목록에 없으면 다음 중 하나를 수행하세요:

- 도구 지원 모델을 다운로드하거나,
- `models.providers.ollama`에서 모델을 명시적으로 정의하세요.

모델 추가:

```bash
ollama list  # 설치된 항목 확인
ollama pull llama3.3  # 모델 다운로드
```

### Connection refused

Ollama가 올바른 포트에서 실행 중인지 확인하세요:

```bash
# Ollama가 실행 중인지 확인
ps aux | grep ollama

# 또는 Ollama 재시작
ollama serve
```

## 참고

- [모델 프로바이더](/concepts/model-providers) - 모든 프로바이더 개요
- [모델 선택](/concepts/models) - 모델 선택 방법
- [설정](/gateway/configuration) - 전체 설정 참조

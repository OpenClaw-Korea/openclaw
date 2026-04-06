---
summary: "사용량 추적 표면 및 자격 증명 요구사항"
read_when:
  - 프로바이더 사용량/할당량 표면을 연결하고 있습니다
  - 사용량 추적 동작 또는 인증 요구사항을 설명할 필요가 있습니다
title: "사용량 추적"
---

# 사용량 추적

## 정의

- 프로바이더의 사용량/할당량 엔드포인트에서 직접 사용량을 가져옵니다.
- 예상 비용이 아닌 프로바이더가 보고한 시간 윈도우만 표시합니다.

## 표시 위치

- 채팅의 `/status`: 세션 토큰 + 예상 비용이 포함된 이모지 기반 상태 카드 (API 키만 해당). 프로바이더 사용량은 사용 가능한 경우 **현재 모델 프로바이더** 에 대해 표시됩니다.
- 채팅의 `/usage off|tokens|full`: 응답별 사용량 바닥글 (OAuth는 토큰만 표시).
- 채팅의 `/usage cost`: OpenClaw 세션 로그에서 수집한 로컬 비용 요약.
- CLI: `openclaw status --usage`는 프로바이더별 전체 분석 결과를 출력합니다.
- CLI: `openclaw channels list`는 프로바이더 설정과 함께 동일한 사용량 스냅샷을 출력합니다 (스킵하려면 `--no-usage` 사용).
- macOS 메뉴 바: 컨텍스트 아래의 "Usage" 섹션 (사용 가능한 경우만).

## 프로바이더 + 자격 증명

- **Anthropic (Claude)**: 인증 프로필의 OAuth 토큰.
- **GitHub Copilot**: 인증 프로필의 OAuth 토큰.
- **Gemini CLI**: 인증 프로필의 OAuth 토큰.
- **Antigravity**: 인증 프로필의 OAuth 토큰.
- **OpenAI Codex**: 인증 프로필의 OAuth 토큰 (accountId가 있는 경우 사용).
- **MiniMax**: API 키 (코딩 플랜 키; `MINIMAX_CODE_PLAN_KEY` 또는 `MINIMAX_API_KEY`); 5시간 코딩 플랜 시간 윈도우를 사용합니다.
- **z.ai**: 환경 변수/설정/인증 저장소를 통한 API 키.

일치하는 OAuth/API 자격 증명이 없으면 사용량이 숨겨집니다.

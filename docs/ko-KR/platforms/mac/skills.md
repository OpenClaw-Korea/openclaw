---
summary: "macOS 스킬 설정 UI 및 게이트웨이 기반 상태"
read_when:
  - macOS 스킬 설정 UI 업데이트 시
  - 스킬 제어 또는 설치 동작 변경 시
title: "스킬"
---

# 스킬 (macOS)

macOS 앱은 게이트웨이를 통해 OpenClaw 스킬을 표시하며, 로컬에서 스킬을 파싱하지 않습니다.

## 데이터 소스

- `skills.status` (게이트웨이)는 모든 스킬과 적격성 및 누락된 요구사항(번들 스킬에 대한 허용 목록 차단 포함)을 반환합니다.
- 요구사항은 각 `SKILL.md`의 `metadata.openclaw.requires`에서 파생됩니다.

## 설치 작업

- `metadata.openclaw.install`은 설치 옵션(brew/node/go/uv)을 정의합니다.
- 앱은 `skills.install`을 호출하여 게이트웨이 호스트에서 설치 프로그램을 실행합니다.
- 게이트웨이는 여러 개가 제공될 때 하나의 선호 설치 프로그램만 표시합니다(사용 가능한 경우 brew, 그렇지 않으면 `skills.install`의 노드 관리자, 기본값은 npm).

## 환경 변수/API 키

- 앱은 `~/.openclaw/openclaw.json`의 `skills.entries.<skillKey>` 아래에 키를 저장합니다.
- `skills.update`는 `enabled`, `apiKey` 및 `env`를 패치합니다.

## 원격 모드

- 설치 및 설정 업데이트는 게이트웨이 호스트에서 발생합니다(로컬 Mac이 아님).

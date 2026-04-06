---
summary: "인바운드 채널 위치 파싱 (Telegram + WhatsApp) 및 컨텍스트 필드"
read_when:
  - 채널 위치 파싱 추가 또는 수정 시
  - 에이전트 프롬프트 또는 도구에서 위치 컨텍스트 필드 사용 시
title: "채널 위치 파싱"
---

# 채널 위치 파싱

OpenClaw는 채팅 채널의 공유 위치를 다음으로 정규화합니다:

- 인바운드 본문에 추가된 사람이 읽을 수 있는 텍스트, 그리고
- 자동 답장 컨텍스트 페이로드의 구조화된 필드.

현재 지원됨:

- **Telegram** (위치 핀 + 장소 + 실시간 위치)
- **WhatsApp** (locationMessage + liveLocationMessage)
- **Matrix** (`geo_uri`가 있는 `m.location`)

## 텍스트 형식

위치는 괄호 없이 친숙한 줄로 렌더링됩니다:

- 핀:
  - `📍 48.858844, 2.294351 ±12m`
- 명명된 장소:
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- 실시간 공유:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

채널에 캡션/댓글이 포함된 경우 다음 줄에 추가됩니다:

```
📍 48.858844, 2.294351 ±12m
Meet here
```

## 컨텍스트 필드

위치가 있을 때 `ctx`에 다음 필드가 추가됩니다:

- `LocationLat` (숫자)
- `LocationLon` (숫자)
- `LocationAccuracy` (숫자, 미터; 선택사항)
- `LocationName` (문자열; 선택사항)
- `LocationAddress` (문자열; 선택사항)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (불리언)

## 채널 참고사항

- **Telegram**: 장소는 `LocationName/LocationAddress`에 매핑됩니다; 실시간 위치는 `live_period`를 사용합니다.
- **WhatsApp**: `locationMessage.comment` 및 `liveLocationMessage.caption`이 캡션 줄로 추가됩니다.
- **Matrix**: `geo_uri`는 핀 위치로 파싱됩니다; 고도는 무시되고 `LocationIsLive`는 항상 false입니다.

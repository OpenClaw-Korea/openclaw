---
summary: "OpenClaw 로깅: 롤링 진단 파일 로그 + unified log 프라이버시 플래그"
read_when:
  - macOS 로그 캡처 또는 프라이빗 데이터 로깅 조사 시
  - 음성 웨이크/세션 라이프사이클 이슈 디버깅 시
title: "macOS 로깅"
---

# 로깅 (macOS)

## 롤링 진단 파일 로그 (Debug 패널)

OpenClaw는 macOS 앱 로그를 swift-log(기본적으로 unified 로깅)를 통해 라우팅하며,
지속 가능한 캡처가 필요할 때 로컬 롤링 파일 로그를 디스크에 쓸 수 있습니다.

- 상세도: **Debug 패널 → Logs → App logging → Verbosity**
- 활성화: **Debug 패널 → Logs → App logging → "Write rolling diagnostics log (JSONL)"**
- 위치: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (자동으로 회전; 오래된 파일은 `.1`, `.2`, … 접미사가 붙음)
- 지우기: **Debug 패널 → Logs → App logging → "Clear"**

참고:

- 이것은 **기본적으로 꺼져 있습니다**. 적극적으로 디버깅할 때만 활성화하세요.
- 파일을 민감한 것으로 취급하세요; 검토 없이 공유하지 마세요.

## macOS의 Unified 로깅 프라이빗 데이터

Unified 로깅은 서브시스템이 `privacy -off`를 선택하지 않는 한 대부분의 페이로드를 삭제합니다. Peter의 macOS [로깅 프라이버시 문제](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) 글에 따르면 이것은 서브시스템 이름으로 키가 지정된 `/Library/Preferences/Logging/Subsystems/`의 plist에 의해 제어됩니다. 새 로그 항목만 플래그를 적용하므로 이슈를 재현하기 전에 활성화하세요.

## OpenClaw(`bot.molt`)에 대해 활성화

- 먼저 plist를 임시 파일에 작성한 다음, root로 원자적으로 설치합니다:

```bash
cat <<'EOF' >/tmp/bot.molt.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/bot.molt.plist /Library/Preferences/Logging/Subsystems/bot.molt.plist
```

- 재부팅은 필요하지 않습니다; logd가 파일을 빠르게 감지하지만, 새 로그 라인만 프라이빗 페이로드를 포함합니다.
- 기존 헬퍼로 풍부한 출력을 봅니다, 예: `./scripts/clawlog.sh --category WebChat --last 5m`.

## 디버깅 후 비활성화

- 재정의 제거: `sudo rm /Library/Preferences/Logging/Subsystems/bot.molt.plist`.
- 선택적으로 `sudo log config --reload`를 실행하여 logd가 즉시 재정의를 삭제하도록 합니다.
- 이 표면은 전화번호 및 메시지 본문을 포함할 수 있습니다; 추가 세부 정보가 적극적으로 필요한 동안에만 plist를 유지하세요.

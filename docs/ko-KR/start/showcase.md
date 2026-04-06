---
title: "쇼케이스"
description: "커뮤니티의 실제 OpenClaw 프로젝트"
summary: "OpenClaw로 구축한 커뮤니티 프로젝트 및 통합"
---

# 쇼케이스

커뮤니티의 실제 프로젝트입니다. OpenClaw로 구축하고 있는 다양한 프로젝트들을 확인해 보세요.

<Info>
**소개되고 싶으신가요?** [Discord의 #showcase 채널](https://discord.gg/clawd)에서 프로젝트를 공유하거나 [X에서 @openclaw를 언급](https://x.com/openclaw)해 주세요.
</Info>

## 🎥 OpenClaw 실전 가이드

VelvetShark가 제작한 완전한 설정 안내 영상입니다 (28분).

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
    title="OpenClaw: The self-hosted AI that Siri should have been (Full setup)"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[YouTube에서 보기](https://www.youtube.com/watch?v=SaWSPZoPX34)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
    title="OpenClaw showcase video"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[YouTube에서 보기](https://www.youtube.com/watch?v=mMSKQvlmFuQ)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
    title="OpenClaw community showcase"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[YouTube에서 보기](https://www.youtube.com/watch?v=5kkIJNUGFho)

## 🆕 Discord에서 최근 공유된 프로젝트

<CardGroup cols={2}>

<Card title="PR 검토 → Telegram 피드백" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode가 변경사항을 완료하고 PR을 올리면 OpenClaw가 diff를 검토하고 Telegram에서 "간단한 제안" 및 명확한 병합 지시사항(먼저 적용할 중요한 수정사항 포함)을 회신합니다.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR 검토 피드백이 Telegram에 전달됨" />
</Card>

<Card title="몇 분 안에 와인 셀러 스킬 만들기" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

"Robby"(@openclaw)에게 로컬 와인 셀러 스킬을 요청했고, 샘플 CSV 내보내기와 저장 위치를 물어본 후 빠르게 스킬을 구축하고 테스트합니다 (예시에서는 962개 병).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw가 CSV에서 로컬 와인 셀러 스킬을 구축함" />
</Card>

<Card title="Tesco 쇼핑 자동화" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

주간 식단 계획 → 정기 물품 → 배송 시간 예약 → 주문 확인. API 없이 브라우저 제어만 사용합니다.

  <img src="/assets/showcase/tesco-shop.jpg" alt="채팅을 통한 Tesco 쇼핑 자동화" />
</Card>

<Card title="SNAG 스크린샷-마크다운 변환" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

화면 영역을 단축키로 캡처 → Gemini 비전 처리 → 클립보드에 즉시 마크다운 생성.

  <img src="/assets/showcase/snag.png" alt="SNAG 스크린샷-마크다운 변환 도구" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents, Claude, Codex, OpenClaw 전체에서 스킬과 명령어를 관리하는 데스크톱 앱입니다.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI 앱" />
</Card>

<Card title="Telegram 음성 노트 (papla.media)" icon="microphone" href="https://papla.media/docs">
  **커뮤니티** • `voice` `tts` `telegram`

papla.media TTS를 래핑하고 결과를 Telegram 음성 노트로 전송합니다 (성가신 자동 재생 없음).

  <img src="/assets/showcase/papla-tts.jpg" alt="TTS에서 생성한 Telegram 음성 노트 출력" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.com/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Homebrew로 설치하는 도우미로, 로컬 OpenAI Codex 세션을 나열/검사/모니터링합니다 (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub의 CodexMonitor" />
</Card>

<Card title="Bambu 3D 프린터 제어" icon="print" href="https://clawhub.com/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab 프린터를 제어하고 문제를 해결합니다: 상태, 작업, 카메라, AMS, 캘리브레이션 등.

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub의 Bambu CLI 스킬" />
</Card>

<Card title="비엔나 대중교통 (Wiener Linien)" icon="train" href="https://clawhub.com/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

실시간 출발 시간, 운행 차질, 엘리베이터 상태, 비엔나 대중교통 경로 검색 기능입니다.

  <img src="/assets/showcase/wienerlinien.png" alt="ClawHub의 Wiener Linien 스킬" />
</Card>

<Card title="ParentPay 학교급식" icon="utensils" href="#">
  **@George5562** • `automation` `browser` `parenting`

ParentPay를 통한 영국 학교급식 자동 예약. 신뢰할 수 있는 표 셀 클릭을 위해 마우스 좌표를 사용합니다.
</Card>

<Card title="R2 업로드 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.com/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3에 업로드하고 안전한 서명된 다운로드 링크를 생성합니다. 원격 OpenClaw 인스턴스에 최적입니다.
</Card>

<Card title="Telegram을 통한 iOS 앱 개발" icon="mobile" href="#">
  **@coard** • `ios` `xcode` `testflight`

지도와 음성 녹음 기능이 있는 완전한 iOS 앱을 구축하고 Telegram 채팅만으로 TestFlight에 배포했습니다.

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight의 iOS 앱" />
</Card>

<Card title="Oura Ring 건강 어시스턴트" icon="heart-pulse" href="#">
  **@AS** • `health` `oura` `calendar`

Oura 링 데이터를 캘린더, 약속, 헬스장 일정과 통합하는 개인 AI 건강 어시스턴트입니다.

  <img src="/assets/showcase/oura-health.png" alt="Oura 링 건강 어시스턴트" />
</Card>
<Card title="Kev의 드림팀 (14+ 에이전트)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

Opus 4.5 오케스트레이터가 Codex 워커에게 위임하는 하나의 게이트웨이 아래 14개 이상의 에이전트. 드림팀 명단, 모델 선택, 샌드박싱, 웹훅, 하트비트, 위임 흐름을 다루는 포괄적인 [기술 문서](https://github.com/adam91holt/orchestrated-ai-articles)입니다. 에이전트 샌드박싱을 위한 [Clawdspace](https://github.com/adam91holt/clawdspace)입니다. [블로그 글](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

에이전티 워크플로우(Claude Code, OpenClaw)와 통합되는 Linear용 CLI입니다. 터미널에서 이슈, 프로젝트, 워크플로우를 관리합니다. 첫 외부 PR이 병합되었습니다!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Beeper Desktop을 통해 메시지를 읽고, 전송하고, 보관합니다. Beeper 로컬 MCP API를 사용하므로 에이전트가 한곳에서 모든 채팅(iMessage, WhatsApp 등)을 관리할 수 있습니다.
</Card>

</CardGroup>

## 🤖 자동화 및 워크플로우

<CardGroup cols={2}>

<Card title="Winix 공기청정기 제어" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code가 공기청정기 제어를 발견하고 확인한 후, OpenClaw가 실내 공기 질을 관리합니다.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="OpenClaw를 통한 Winix 공기청정기 제어" />
</Card>

<Card title="멋진 하늘 카메라 촬영" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

지붕 카메라로 트리거: 하늘이 멋져 보일 때마다 OpenClaw에 사진을 찍으라고 요청하면 스킬을 설계하고 촬영합니다.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw가 캡처한 지붕 카메라 하늘 스냅샷" />
</Card>

<Card title="시각적 아침 브리핑 장면" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

예약된 프롬프트가 OpenClaw 페르소나를 통해 매일 아침 단일 "장면" 이미지를 생성합니다 (날씨, 작업, 날짜, 선호하는 게시물/인용).
</Card>

<Card title="패들 코트 예약" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic 가능 시간 확인 + 예약 CLI. 빈 코트를 절대 놓치지 마세요.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli 스크린샷" />
</Card>

<Card title="회계 접수" icon="file-invoice-dollar">
  **커뮤니티** • `automation` `email` `pdf`

이메일에서 PDF를 수집하고 세무사 서류를 준비합니다. 월간 회계를 자동화합니다.
</Card>

<Card title="쇼파감자 개발 모드" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Netflix를 보면서 Telegram으로 전체 개인 웹사이트를 재구축했습니다 — Notion → Astro, 18개 게시물 마이그레이션, DNS를 Cloudflare로 변경. 노트북을 열지 않았습니다.
</Card>

<Card title="채용공고 에이전트" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

채용공고를 검색하고, CV 키워드와 비교하며, 링크가 있는 관련 기회를 반환합니다. JSearch API를 사용하여 30분 안에 구축했습니다.
</Card>

<Card title="Jira 스킬 빌더" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw가 Jira에 연결된 후, 즉시 새로운 스킬을 생성했습니다 (ClawHub에 존재하기 전).
</Card>

<Card title="Todoist Telegram 스킬" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Todoist 작업을 자동화하고 OpenClaw가 Telegram 채팅에서 직접 스킬을 생성하게 했습니다.
</Card>

<Card title="TradingView 분석" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

브라우저 자동화를 통해 TradingView에 로그인하고, 차트를 스크린샷하고, 온디맨드로 기술 분석을 수행합니다. API가 필요 없습니다 — 브라우저 제어만 사용합니다.
</Card>

<Card title="Slack 자동 지원" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

회사 Slack 채널을 감시하고, 도움이 되는 응답을 하며, 알림을 Telegram으로 전달합니다. 요청하지 않아도 배포된 앱의 프로덕션 버그를 자동으로 수정했습니다.
</Card>

</CardGroup>

## 🧠 지식 및 메모리

<CardGroup cols={2}>

<Card title="xuezh 중국어 학습" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

OpenClaw를 통한 발음 피드백 및 학습 흐름을 포함한 중국어 학습 엔진입니다.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 발음 피드백" />
</Card>

<Card title="WhatsApp 메모리 보관소" icon="vault">
  **커뮤니티** • `memory` `transcription` `indexing`

전체 WhatsApp 내보내기를 수집하고, 1000개 이상의 음성 노트를 필사하며, git 로그와 교차 검증하고, 링크된 마크다운 보고서를 생성합니다.
</Card>

<Card title="Karakeep 시맨틱 검색" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Qdrant + OpenAI/Ollama 임베딩을 사용하여 Karakeep 북마크에 벡터 검색을 추가합니다.
</Card>

<Card title="Inside-Out-2 메모리" icon="brain">
  **커뮤니티** • `memory` `beliefs` `self-model`

세션 파일을 메모리로 변환하고 메모리를 신념으로, 진화하는 자기 모델로 변환하는 별도의 메모리 관리자입니다.
</Card>

</CardGroup>

## 🎙️ 음성 및 전화

<CardGroup cols={2}>

<Card title="Clawdia 전화 브릿지" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi 음성 어시스턴트 ↔ OpenClaw HTTP 브릿지. 에이전트와의 거의 실시간 전화 통화.
</Card>

<Card title="OpenRouter 필사" icon="microphone" href="https://clawhub.com/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter를 통한 다국어 오디오 필사 (Gemini 등). ClawHub에서 사용 가능합니다.
</Card>

</CardGroup>

## 🏗️ 인프라 및 배포

<CardGroup cols={2}>

<Card title="Home Assistant 애드온" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Home Assistant OS에서 실행되는 OpenClaw 게이트웨이로, SSH 터널 지원 및 지속적 상태 관리 기능이 있습니다.
</Card>

<Card title="Home Assistant 스킬" icon="toggle-on" href="https://clawhub.com/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

자연어를 통해 Home Assistant 기기를 제어하고 자동화합니다.
</Card>

<Card title="Nix 패키징" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

재현 가능한 배포를 위한 완전한 nixified OpenClaw 설정입니다.
</Card>

<Card title="CalDAV 캘린더" icon="calendar" href="https://clawhub.com/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

khal/vdirsyncer를 사용하는 캘린더 스킬입니다. 자체 호스팅 캘린더 통합입니다.
</Card>

</CardGroup>

## 🏠 집 및 하드웨어

<CardGroup cols={2}>

<Card title="GoHome 자동화" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

OpenClaw를 인터페이스로 하는 Nix 네이티브 홈 자동화와 아름다운 Grafana 대시보드입니다.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana 대시보드" />
</Card>

<Card title="Roborock 로봇청소기" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

자연스러운 대화를 통해 Roborock 로봇청소기를 제어합니다.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock 상태" />
</Card>

</CardGroup>

## 🌟 커뮤니티 프로젝트

<CardGroup cols={2}>

<Card title="StarSwap 마켓플레이스" icon="star" href="https://star-swap.com/">
  **커뮤니티** • `marketplace` `astronomy` `webapp`

완전한 천문학 장비 마켓플레이스입니다. OpenClaw 생태계로 구축했거나 그 주변에 구축했습니다.
</Card>

</CardGroup>

---

## 프로젝트 제출하기

공유할 내용이 있나요? 꼭 소개되고 싶습니다!

<Steps>
  <Step title="공유하세요">
    [Discord의 #showcase 채널](https://discord.gg/clawd)에 게시하거나 [@openclaw를 트윗](https://x.com/openclaw)해 주세요
  </Step>
  <Step title="세부 정보를 포함하세요">
    어떤 기능인지, 저장소/데모 링크, 스크린샷이 있으면 공유해 주세요
  </Step>
  <Step title="소개되세요">
    우리는 돋보이는 프로젝트를 이 페이지에 추가합니다
  </Step>
</Steps>

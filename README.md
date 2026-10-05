# 원문 — 성경 원어 검색

사이트: https://lingard09.github.io/bible-original/

성경 66권 원문·발음, 책/장/절 탐색, 장 전체/구절 범위와 성경 전체 원어 용례 검색을 제공합니다. 한국어 기초 사전은 25개 표제어, 검토한 자체 의미 풀이는 시편 57편 전체를 포함한 38개 구절입니다. 그 외 구절은 Cloudflare Workers와 OpenAI를 연결해 자동 의미 풀이를 생성합니다.

배포 순서와 API 키 설정: [Cloudflare 배포 안내](CLOUDFLARE-배포안내.md)

- GitHub Pages: 루트 HTML/CSS/JS. 빌드 없이 `main` 브랜치 루트를 배포합니다.
- Cloudflare Workers: `worker/index.mjs`, `wrangler.jsonc`. 성경 데이터를 1,189개 장 단위 정적 자산으로 생성합니다.
- API 주소: `ai-config.js`의 `MEANING_API_URL`. 비밀 키는 Workers Secret에만 저장합니다.
- 로컬 사이트: `python -m http.server 8000`
- 검증: `npm run worker:build` 다음 `npm test`

시편은 OSHB VerseMap의 WLC↔KJV 절 대응을 사용하고 원문 WLC 번호도 표시합니다. 다른 구약 책은 WLC 절 번호 기준으로 한국어 성경과 일부 다를 수 있습니다. 원어 문자 검색은 악센트·모음 부호를 제외한 부분 문자열 검색으로 모든 굴절형을 합치는 표제어 검색이 아닙니다. 히브리어는 H Strong 번호 용례 검색을 지원합니다.

발음은 학습용 전사/한글 근사치입니다. 잠언 16:9과 요한복음 3:16은 검토한 표기, 나머지는 자동 전사입니다. AI 풀이에는 검토 전 표시가 붙으며 문법·해석에 오류가 있을 수 있습니다.

## 자료와 라이선스

- [OSHB](https://github.com/openscriptures/morphhb): Daniel Owens, David Troidl 및 기여자. WLC 본문 공개 영역, OSHB 형태 분석·주석·VerseMap CC BY 4.0.
- [SBLGNT](https://github.com/LogosBible/SBLGNT): Michael W. Holmes 편집. © 2010 Society of Biblical Literature & Logos Bible Software. CC BY 4.0.
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · [전문](data/SBLGNT-LICENSE.txt)

원문은 JSON으로 변환하고 히브리어 형태소 구분 기호와 편집 주석을 생략했습니다. 한국어 풀이는 자체 작성 또는 AI 생성 학습용 설명이며 특정 한국어 성경 번역본을 인용하지 않습니다.

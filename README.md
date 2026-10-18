# 원문 — 성경 원어 검색

사이트: https://lingard09.github.io/bible-original/

성경 66권 원문·발음, 책/장/절 탐색, 장 전체/구절 범위와 성경 전체 원어 용례 검색을 제공합니다. 한국어 기초 사전은 307개 표제어, 검토한 자체 의미 풀이는 시편 57편 전체를 포함한 38개 구절입니다. 그 외 구절은 Cloudflare Workers와 OpenAI를 연결해 자동 의미 풀이를 생성합니다.

배포 순서와 API 키 설정: [Cloudflare 배포 안내](CLOUDFLARE-배포안내.md)

- GitHub Pages: 루트 HTML/CSS/JS. 빌드 없이 `main` 브랜치 루트를 배포합니다.
- Cloudflare Workers: `worker/index.mjs`, `wrangler.jsonc`. 성경 데이터를 1,189개 장 단위 정적 자산으로 생성합니다.
- API 주소: `ai-config.js`의 `MEANING_API_URL`. 비밀 키는 Workers Secret에만 저장합니다.
- 로컬 사이트: `python -m http.server 8000`
- 검증: `npm run worker:build` 다음 `npm test`

시편은 OSHB VerseMap의 WLC↔KJV 절 대응을 사용하고 원문 WLC 번호도 표시합니다. 다른 구약 책은 WLC 절 번호 기준으로 한국어 성경과 일부 다를 수 있습니다. 원어 문자 검색은 악센트·모음 부호를 제외한 부분 문자열 검색으로 모든 굴절형을 합치는 표제어 검색이 아닙니다. 히브리어는 H Strong 번호 용례 검색을 지원합니다.

단어 학습(`vocab.html`): 성경에 10회 이상 나오는 표제어(히브리어 1,922개, 헬라어 1,059개, 고유명사 제외)를 빈도순으로 카드 학습합니다. 간격 반복(라이트너 상자: 1·3·7·16·35일)으로 복습하고, 익힌 단어가 본문 단어의 몇 %인지 보여 줍니다. 카드마다 그 단어가 나오는 짧은 구절을 예문으로 보여 줍니다. 진도와 "뜻이 이상해요" 표시는 브라우저 localStorage에만 저장되며, 표시한 단어 목록은 복사해 검토에 쓸 수 있습니다. 데이터 생성 기준: 히브리어는 주 Strong 번호(접두어 제외), 헬라어는 MorphGNT 표제어.

구절 화면과 단어 학습 연결: 단어 학습을 시작하면 구절 화면에 "이 구절의 학습 단어 N개 중 M개를 압니다"가 나오고, 학습 목록에 있지만 아직 익히지 않은 단어를 노란 배경으로 표시합니다(끄기 가능). 단어 상세에서 학습 순위·상태를 보고 "오늘 학습에 추가"로 그날 복습 카드에 넣을 수 있습니다. 순위 색인은 `data/vocab-index.json`(약 20KB).

형태 퀴즈(`quiz.html`): 실제 구절에서 강조한 단어의 형태를 단계별로 맞힙니다. 히브리어 동사는 어간 → 활용형 → 인칭·성·수(분사는 성·수, 상태), 명사는 성 → 수 → 상태. 헬라어 동사는 시제 → 태 → 법 → 인칭·수(분사는 격·수), 명사는 격 → 수 → 성. 정답은 OSHB·MorphGNT 분석이고, 보기는 데이터에 실제로 나오는 값에서 고릅니다. 문제는 빈도 상위 500개 표제어의 서로 다른 형태(동사 최대 6개, 명사 3개)를 4~16단어 구절에서 골랐습니다(`data/quiz-he.json` 1,740문항, `data/quiz-gr.json` 1,491문항). 품사·단어 범위 필터, 단어 학습에서 익힌 단어만 풀기, 자주 틀리는 항목 통계(localStorage)를 지원합니다.

원어 입문(`learn.html`, 상단 "원어 입문" 링크): 히브리어 자음 22자·끝 글자·헷갈리는 글자·모음 부호·다게쉬, 헬라어 24자·이중모음·숨표와 악센트, 실제 성경 단어로 읽기 연습과 글자 퀴즈. 예시 단어는 `data/alphabet.json`에 미리 뽑아 두었으며, 본문에서 그 글자(또는 모음)로 시작하는 가장 흔한 형태를 고르고 처음 나오는 구절로 연결합니다. 발음은 사이트 전사 기준(히브리어 학습용 표기, 헬라어 에라스뮈스식)을 따릅니다.

단어를 누르면 형태 코드를 한국어로 풀어 보여 줍니다(예: `HC/Vqw3ms` → 접속사 + 동사 칼 · 연속 미완료(와이크톨) · 3인칭 · 남성 · 단수). 히브리어는 OSHB 코드표, 헬라어는 MorphGNT 코드표를 그대로 옮긴 것이며, 주요 일곱 어간에는 문법서의 일반적인 기능 요약을 덧붙였습니다.

단어별 보기에서 모든 단어 아래에 뜻 라벨을 표시합니다. 초록색은 이 구절의 문맥 뜻(핵심 단어 풀이), 회색은 사전 기본 뜻(자동 번역)입니다. 기본 뜻은 표제어의 대표 뜻이라 문맥 속 의미와 다를 수 있습니다.

발음은 학습용 전사/한글 근사치입니다. 잠언 16:9과 요한복음 3:16은 검토한 표기, 나머지는 자동 전사입니다. AI 풀이에는 검토 전 표시가 붙으며 문법·해석에 오류가 있을 수 있습니다.

## 기본 뜻 검토

`review/기본뜻-검토목록.xlsx`: 단어 학습 목록(10회 이상, 고유명사 제외)의 기본 뜻을 사람이 확인하기 위한 표입니다. 히브리어 1,922개·헬라어 1,059개를 빈도순으로 담았고, 각 단어에 발음, 출현 횟수, Strong 영어 정의와 KJV 번역어, 예문 구절, 자동 점검 표시가 있습니다. 노란 칸(검토 결과: 확인/수정/보류, 수정한 뜻, 메모)만 채우면 됩니다. 안내 시트에서 진행 현황을 볼 수 있습니다.

반영: `python tools/apply_gloss_review.py review/기본뜻-검토목록.xlsx` (먼저 `--dry-run`으로 확인 가능, openpyxl 필요). 수정한 뜻은 `data/glosses-*.json`, `data/vocab-*.json`, `data/quiz-*.json`, `data/alphabet.json`에 반영되고, 확인·수정한 단어는 `data/gloss-review.json`에 기록되어 단어 카드와 구절 화면 단어 상세에서 "검토 전" 대신 "검토한 기본 뜻"으로 표시됩니다.

## 자료와 라이선스

- [OSHB](https://github.com/openscriptures/morphhb): Daniel Owens, David Troidl 및 기여자. WLC 본문 공개 영역, OSHB 형태 분석·주석·VerseMap CC BY 4.0.
- [SBLGNT](https://github.com/LogosBible/SBLGNT): Michael W. Holmes 편집. © 2010 Society of Biblical Literature & Logos Bible Software. CC BY 4.0.
- [MorphGNT SBLGNT](https://github.com/morphgnt/sblgnt): 헬라어 단어별 표제어(lemma)와 품사·형태 분석. CC BY-SA 3.0. 신약 데이터의 `l` 배열(표제어 번호)과 `p` 배열(`data/morph-gr.json`의 형태 코드 번호)이 이 자료에서 왔습니다.
- [Open Scriptures Strong's Dictionary](https://github.com/openscriptures/strongs): 단어 학습의 히브리어 표제어 형태(`data/vocab-he.json`의 `w`). JSON 판 CC BY-SA.
- Strong's Hebrew/Greek Dictionary (James Strong, 1890): 공개 영역. `data/glosses-he.json`(Strong 번호별)과 `data/glosses-gr.json`(표제어별)의 한국어 기본 뜻은 이 영어 정의를 바탕으로 AI가 짧게 옮긴 자동 번역이며 검토 전입니다.
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · [전문](data/SBLGNT-LICENSE.txt)

원문은 JSON으로 변환하고 히브리어 형태소 구분 기호와 편집 주석을 생략했습니다. 한국어 풀이는 자체 작성 또는 AI 생성 학습용 설명이며 특정 한국어 성경 번역본을 인용하지 않습니다.

사전 확장: 총 307개 표제어. 한국어 동의어·접두 검색, 부호를 생략한 원어 표제어 검색, 언어 필터, 24개씩 목록 보기. “사전”으로 전체 목록을 탐색합니다. 뜻은 자체 작성한 기초 설명이며 전문 사전 전체를 대체하지 않습니다. 새 발음은 자동 전사입니다.

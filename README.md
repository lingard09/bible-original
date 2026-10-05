# 원문 — 성경 원어 검색

한국어로 성경 구절과 단어를 검색하는 정적 웹사이트입니다.

## 접속

https://lingard09.github.io/bible-original/

## 기능

- 성경 66권 / 31,152절 원문 검색: `잠언 16:9`, `요한복음 3장 16절`, `요 3:16`
- 구약: OSHB의 Westminster Leningrad Codex(WLC), 히브리어 및 일부 아람어
- 신약: SBL Greek New Testament(SBLGNT), 헬라어
- 한국어 기초 사전 25개 표제어: 기름·사랑·평안·믿음 등
- 원문 전체 및 핵심 단어의 한글·로마자 발음
- 27개 구절의 자체 학습용 한국어 풀이·문맥 설명·핵심 원어 해설
- 이전/다음 구절, 구약 단어의 Strong 번호·형태 코드, 원문 복사

## 실행 및 배포

빌드와 API 키가 필요 없습니다. 저장소 루트에서 다음 명령으로 실행합니다.

```sh
python -m http.server 8000
```

GitHub Pages는 `main` 브랜치의 루트(`/`)를 배포합니다. `main`에 변경을 push하면 사이트가 갱신됩니다.

## 범위와 표기

원문 조회는 66권을 지원합니다. 한국어 단어 사전은 전체 번역 대응 사전이 아닙니다. 의미 풀이 미수록 구절에는 그 상태를 표시합니다.

한글 발음은 학습용 근사 표기입니다. 잠언 16:9과 요한복음 3:16은 검토한 표기를 제공하며, 그 외 구절은 자동 전사입니다. 강세·음장과 시대·전통에 따른 발음 차이를 모두 재현하지 않습니다. יהוה는 전통적인 대독어 Adonai로 표시합니다.

구약의 장·절 구분은 WLC 기준으로 한국어 성경과 일부 차이가 있습니다.

## 자료 출처 및 라이선스

- [Open Scriptures Hebrew Bible](https://github.com/openscriptures/morphhb): Daniel Owens, David Troidl 및 기여자. WLC 본문은 공개 영역이며 OSHB 형태 분석·주석은 CC BY 4.0.
- [SBL Greek New Testament](https://github.com/LogosBible/SBLGNT): Michael W. Holmes 편집. © 2010 Society of Biblical Literature & Logos Bible Software. CC BY 4.0.
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · [라이선스 전문](data/SBLGNT-LICENSE.txt)

원문을 JSON으로 변환하고 히브리어 형태소 구분 기호와 편집 주석을 생략했습니다. 한국어 의미 풀이는 자체 작성한 학습용 설명이며 특정 한국어 성경 번역본을 인용하지 않습니다.

## 전체 성경 탐색과 용례 검색

- 책·장·절 선택으로 66권 전체 탐색
- 책 이름만 입력: `창세기` → 첫 장
- 장 전체: `창세기 1장`, `요한복음 3`
- 구절 범위: `요한복음 3:16-18`
- 히브리어 Strong 용례: `H8081` → 모든 구약에서 해당 표제어 검색
- 원어 문자 용례: `שמן`, `λόγος` → 전체 성경 또는 구약·신약 선택 검색
- 원어 검색은 모음·악센트 부호를 제외한 부분 문자열 검색입니다. 모든 굴절형을 합치는 표제어 검색은 아닙니다. 헬라어 Strong 번호 검색은 현재 지원하지 않습니다.
- 결과는 성경 순서대로 표시하고 30개씩 넘겨볼 수 있습니다. 첫 용례 검색 시 전체 본문을 내려받고 이후에는 메모리에 재사용합니다.

검증: `node tests/explorer.test.cjs`

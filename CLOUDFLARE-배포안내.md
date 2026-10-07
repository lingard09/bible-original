# Cloudflare Workers 배포 안내

기존 GitHub Pages 화면은 유지하고 AI 의미 풀이 API만 Cloudflare Workers에 배포합니다. 이 압축 파일에는 원문 데이터·화면·시편 번호 수정·Workers 서버가 모두 포함돼 있습니다.

## 1. GitHub에 덮어쓰기

압축을 풀어 나온 **파일과 폴더 자체**를 기존 `lingard09/bible-original` 저장소 최상위에 올리세요. 압축 이름의 폴더를 통째로 한 단계 안쪽에 넣으면 안 됩니다. 저장소 최상위에 `index.html`, `package.json`, `wrangler.jsonc`, `worker/`, `data/`가 있어야 합니다.

기존 파일은 덮어쓰세요. 이전 Render 버전의 `render.yaml`과 `server/`는 삭제해도 됩니다. 이 파일들은 Workers 배포에 사용되지 않으며 새 압축에는 포함하지 않았습니다.

## 2. Cloudflare와 GitHub 연결

Cloudflare Dashboard → Workers & Pages → Create application → GitHub 저장소 연결에서 `bible-original`을 선택합니다. **Workers 프로젝트**를 만드세요. Pages 프로젝트는 아닙니다.

- 프로젝트 이름: `bible-original-meaning-api`
- 브랜치: `main`
- 루트 디렉터리: 저장소 최상위 (기본값)
- 빌드 명령: 비워 두어도 됩니다. Wrangler의 build 설정이 데이터를 생성합니다.
- 배포 명령: `npx wrangler deploy`

`package.json`의 개발 의존성 Wrangler가 설치돼야 합니다. 플랫폼이 의존성을 자동 설치하지 않으면 빌드 명령을 `npm install`로 지정하세요. 배포 명령은 그대로 `npx wrangler deploy`입니다.

PR·다른 브랜치에는 Workers Builds가 `npx wrangler preview`로 미리보기를 만듭니다. 미리보기 변수는 `wrangler.jsonc`의 `previews` 블록(하루 생성 한도 10회, `localhost:8000` 허용)을 사용합니다. 미리보기 Secret은 운영과 따로 관리되므로(`wrangler preview secret`) 미리보기에서도 AI 풀이를 쓰려면 `npx wrangler preview secret put OPENAI_API_KEY`로 따로 등록하세요. 등록하지 않으면 미리보기에서는 AI 풀이만 동작하지 않습니다.

Workers Builds의 빌드 시간·사용량에도 별도 제한이 있습니다. Git 연결 방식 대신 아래 CLI 배포를 사용해도 같은 Workers가 만들어집니다.

## 3. API 키 설정

배포된 Worker → Settings → Variables and Secrets에서 다음을 추가합니다.

- 이름: `OPENAI_API_KEY`
- 종류: **Secret**
- 값: 본인의 OpenAI API 키

비밀 설정을 저장/배포하세요. 키를 GitHub, `ai-config.js`, `wrangler.jsonc`에 넣지 마세요. 모델과 허용 출처는 `wrangler.jsonc`에 설정돼 있습니다.

Worker 주소 뒤 `/health`를 열었을 때 다음이 나오면 연결 준비가 됐습니다.

```json
{"status":"ok","aiConfigured":true}
```

## 4. GitHub Pages와 연결

GitHub의 `ai-config.js`를 편집해 **실제로 발급된 Worker URL**을 입력하세요.

```js
const MEANING_API_URL = 'https://bible-original-meaning-api.실제계정.workers.dev';
```

끝에 `/api/meaning`을 붙이지 않습니다. 저장하면 GitHub Pages가 갱신됩니다. 기존 검토 풀이가 없는 구절을 열면 원문과 주변 구절을 바탕으로 AI 풀이를 생성합니다. 시편 57편은 저장된 자체 풀이를 보여주므로 API 연결 테스트에는 다른 미수록 구절을 사용하세요.

## Mac에서 CLI로 배포하기

Node.js 22 이상을 설치한 뒤 압축을 푼 폴더에서 실행합니다.

```sh
npm install
npx wrangler login
npx wrangler deploy
npx wrangler secret put OPENAI_API_KEY
```

마지막 명령의 입력창에 키를 붙여넣습니다. 명령어 자체에 키를 적지 않습니다. 그다음 위 4단계대로 `ai-config.js`에 Worker 주소를 넣고 GitHub에 저장하세요.

## 로컬 검증

```sh
npm run worker:build
npm test
```

Cloudflare Wrangler의 실제 번들/배포 검증은 `npx wrangler deploy --dry-run`으로 할 수 있습니다.

무료 플랜의 요청 수·CPU·빌드 제한은 Cloudflare의 현재 정책을 따릅니다. OpenAI API 요금은 별도입니다. 앱의 캐시·분당 제한·일별 생성 제한은 Worker 인스턴스 메모리 기준이며 전 세계 계정의 총 비용 상한을 보장하지 않습니다. 인스턴스가 재시작하면 초기화됩니다. OpenAI 계정에서도 사용량을 관리하세요.

# 개발자 프롬프트 생성기

Claude Skill 아이디어와 조건을 폼에 입력하면, SKILL.md 설계를 요청하는 프롬프트를 실시간으로 조립해 줍니다. 복사해서 Claude 채팅에 붙여넣으면 됩니다. 페이지가 AI를 직접 부르지는 않습니다.

## 실행

- VS Code의 Live Server 확장으로 `index.html`을 열거나,
- 프로젝트 폴더에서 `python -m http.server 8000`을 실행한 뒤 http://localhost:8000 에 접속합니다.

`index.html`을 더블클릭해서(`file://`) 열면 동작하지 않습니다. 브라우저가 파일 주소에서는 ES 모듈을 불러오지 않기 때문입니다.

## 배포 (Netlify)

GitHub 저장소를 Netlify에 연결하면 `main`에 push할 때마다 배포됩니다. 빌드 명령은 비워두고, 배포 폴더는 루트(`.`)입니다. 설정은 `netlify.toml`에 있고, 개발 문서(`docs/`, `tests/`, `CLAUDE.md`, `.claude/`, `package.json`)는 배포된 사이트에서 404로 숨깁니다.

## 테스트

```bash
npm test
```

Node 내장 테스트 러너(`node --test`)를 씁니다. 설치할 의존성은 없습니다.

## 기능 추가하는 법

1. `features/<기능명>/index.js`를 만들고 `export function init(ctx)` 하나만 내보냅니다. `ctx`는 `{ store, root, rules, defaults, example }`입니다.
2. 스타일이 필요하면 같은 폴더에 `style.css`를 둡니다.
3. `features/registry.js`에 한 줄을 등록합니다.
   ```js
   { name: '<기능명>', load: () => import('./<기능명>/index.js'), css: true },
   ```

기능끼리 서로 import하지 않고, 정보는 `store`로만 주고받습니다. 화면과 무관한 로직은 순수 함수 파일로 분리하고 `tests/`에 테스트를 둡니다.

## 브라우저 확인 목록

- [ ] 예시로 채우기 → 미리보기 완성
- [ ] 대상 전환 시 칸 비활성화와 값 복원
- [ ] 복사 버튼 동작
- [ ] 새로고침 후 자동 저장 값 복원
- [ ] [예시로 채우기]·[초기화] 후 [되돌리기]로 복원
- [ ] 시작 시 섹션 1만 펼침, 접힌 섹션의 "N개 입력됨" 표시
- [ ] 버튼을 누르는 순간 반응(손 떼기 전)
- [ ] 좁은 화면에서 한 열 배치와 하단 복사 바
- [ ] 다크 모드, 움직임 줄이기, 투명도 줄이기 설정에서의 모습

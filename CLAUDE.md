# 개발자 프롬프트 생성기 — 프로젝트 규칙

- 설계 스펙: `docs/superpowers/specs/2026-10-26-skill-prompt-generator-design.md`
- 구현 계획: `docs/superpowers/plans/2026-10-26-skill-prompt-generator.md`

## 규칙

- 외부 라이브러리와 빌드 도구를 쓰지 않는다. HTML·CSS·JS는 파일로 나누고, JS는 ES 모듈로 쓴다.
- 새 기능은 `features/<기능명>/` 폴더 하나로 만든다. `index.js`는 `init(ctx)` 하나만 내보내고, `features/registry.js`에 1줄을 등록한다.
- 기능끼리 직접 import하지 않는다. 정보는 `store`로만 주고받는다. 공통 도구는 `js/lib/`, 공통 데이터는 `js/data/`에 둔다.
- 화면과 무관한 로직은 순수 함수 파일로 분리하고 `tests/`에 테스트를 둔다. 변경 후 `npm test`를 실행한다.
- 공식 문서 기반 규칙 문구는 `js/data/rules.js`에만 둔다. 확인되지 않은 규칙은 추가하지 않는다.
- 사용자 입력은 화면에 `textContent`로 넣는다.
- 실행 확인은 로컬 서버로 한다(`python -m http.server 8000` → http://localhost:8000).
- 화면·인터랙션 작업은 `.claude/skills/apple-design` 스킬을 참고하되, 적용 범위와 수치는 스펙 §3-2·§3-3을 따른다. 외부 애니메이션 라이브러리와 제스처 기법은 쓰지 않는다.
- 사용자에게 보이는 글은 한국어로 쓴다.

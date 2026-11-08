# 다락방 서재에 놀러 온 동물들

좋아하는 분야와 읽은 책, 읽는 습관으로 독서 성향을 4개의 축(이야기/지식, 몰입/탐험, 감성/논리, 고전/신간)으로 나누어 16마리 책 읽는 동물 중 하나로 알려 주는 독서 성향 테스트입니다. 문헌정보학과 바이브 코딩 공모전 출품작입니다.

- 서비스: `/` (`index.html`)
- 발표 슬라이드: `/slides/` (방향키 또는 클릭으로 넘김, `f` 전체 화면)

## 구성
- `index.html`: 서비스 한 장짜리 웹. 그림은 페이지 안에 들어 있습니다. Claude 안에서 열면 Claude 사서가 어떤 책이든 분석하고, 그 밖에서는 내장 도서 71권으로 분석합니다.
- `img/`: Google Flow로 그린 동물 16마리와 다락방 그림
- `flow-prompts.md`: 그림을 만든 Google Flow 프롬프트
- `slides/`: 발표 슬라이드
  - `PLAN.md`: 슬라이드 계획
  - `deck.js`, `deck.css`: 슬라이드 동작(anime.js 애니메이션, `?check` 자동 점검 모드)
  - `build/charts.py`: matplotlib 그래프, `build/scenes.py`: manim 애니메이션
  - `data/model.json`: 서비스 코드에서 뽑은 점수 가중치와 시뮬레이션 결과

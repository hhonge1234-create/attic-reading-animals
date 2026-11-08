# 다락방 서재에 놀러 온 동물들: Google Flow 프롬프트

## 그림체 목표
가는 갈색 연필 선, 묽은 수채 채색, 점 두 개로 된 눈, 아주 단순한 얼굴, 복슬복슬한 털 질감, 흰 종이 배경. 소품은 작은 책 한두 권 정도로만 둡니다.

## 사용법
1. Google Flow(labs.google/flow)에서 이미지 생성을 고르고, 비율은 **1:1 정사각형**으로 맞춥니다.
2. **동물 프롬프트 + 공통 스타일**을 이어 붙여 넣습니다. 공통 스타일은 16장 모두 똑같이 써야 그림체가 맞습니다.
3. Flow에 참고 이미지를 넣는 기능이 있으면, 마음에 드는 그림 1장을 기준으로 넣고 나머지를 만들면 그림체가 더 잘 맞습니다.
4. 마음에 드는 그림을 PNG로 받아 `img` 폴더에 **코드 이름**으로 저장합니다. 예: `img/SDEC.png`
5. 다 넣으면 Claude에게 "이미지 넣었어"라고 말해 주세요.

## 공통 스타일 (모든 프롬프트 끝에 붙이기)
```
delicate hand-drawn illustration, thin sketchy warm brown colored-pencil outline, soft pale watercolor wash with light uneven texture, muted gentle colors, fluffy fur drawn with fine short strokes, tiny dot eyes and a small dot nose, very simple minimal face, no mouth or a tiny mouth, soft and cozy mood, single character centered with generous white space, plain off-white watercolor paper background, no shadow, no frame, no text, no letters
```

## 16마리

| 코드 | 동물 | 프롬프트 (앞부분) |
|---|---|---|
| SDEC | 깊은 바다의 고래 | a small round baby whale, pale blue-gray, lying on its belly with a thick old book open in front of it, eyes softly closed as if moved by the story |
| SDEN | 밤의 고양이 | a fluffy cream-and-gray long-haired cat curled up beside a small paperback book, peeking at the page with sleepy dot eyes, a tiny crescent moon drawn faintly above |
| SDLC | 서재의 올빼미 | a round fluffy brown owl sitting on top of two stacked old books, holding a tiny magnifying glass with one wing, head slightly tilted |
| SDLN | 설계하는 여우 | a small fluffy orange fox sitting upright reading a book held close to its face, its big tail curled around a stack of books, ears perked up with focus |
| SWEC | 숲길의 사슴 | a tiny pale beige fawn with soft white spots, walking with a small book held in its mouth, a little sprig of wildflowers on its head |
| SWEN | 물결 타는 수달 | a small brown otter floating on its back holding an open book on its tummy, relaxed and happy |
| SWLC | 호기심 많은 너구리 | a fluffy gray raccoon with a striped tail, carrying a tiny backpack with books sticking out, holding a small folded map |
| SWLN | 소식 빠른 앵무새 | a small round pastel green parrot standing on a short stack of new books, holding a tiny pencil in its foot as if writing a note |
| KDEC | 사색하는 곰 | a chubby fluffy light brown bear cub sitting with legs stretched out, a thick book open on its lap, gazing down thoughtfully |
| KDEN | 마음을 돌보는 판다 | a fluffy little panda wrapped in a small knitted blanket, hugging a thin book to its chest, calm and peaceful |
| KDLC | 느긋한 거북이 | a small turtle with a soft green-brown shell, wearing tiny round glasses, slowly reading a big book lying flat on the ground |
| KDLN | 집 짓는 비버 | a fluffy brown beaver stacking small books like bricks, holding one more book in its paws, busy and focused |
| KWEC | 기억하는 코끼리 | a small round pale gray baby elephant holding a little art book open with its trunk, a tiny soft scarf around its neck |
| KWEN | 산책하는 강아지 | a fluffy cream puppy trotting along with a small tote bag of books, one ear flopping, tail up and happy |
| KWLC | 영리한 돌고래 | a small soft blue-gray dolphin leaping in a gentle arc over an open book, a few tiny droplets around it |
| KWLN | 모아 두는 다람쥐 | a fluffy reddish-brown squirrel hugging a pile of small books like acorns, big curled tail, cheeks slightly puffed |

## 사이트 배경: 다락방 서재

동물 그림과 같은 그림체로 그린 다락방입니다. 사이트 맨 위 큰 배경으로 씁니다. 왼쪽에는 제목 글자가 올라가므로 **왼쪽 3분의 1은 비교적 비워 두도록** 했습니다. 동물은 따로 올리니 배경에는 넣지 않습니다.

### 컴퓨터용 (비율 16:9) → `img/attic-wide.png`
```
a cozy attic library room seen from the front, wooden sloped roof with exposed rafters meeting at the top, a round window on the right side with soft sunlight streaming in as a gentle diagonal beam of light, a red curtain tied to one side of the window, a string of small fairy lights and a clothesline with little paper notes pinned along the top, a tall wooden bookshelf full of books on the far right, a small wooden desk with an open book, a globe and a little desk lamp, a brass telescope on a tripod near the window, stacks of books on the floor, a patterned rug on wooden floorboards, a few dust motes floating in the sunbeam, the left third of the picture kept calm and mostly empty with just the sloped wooden wall and soft shadow, no people, no animals,
delicate hand-drawn illustration, thin sketchy warm brown colored-pencil outline, soft pale watercolor wash with light uneven paper texture, muted warm colors of honey, cream, faded red and soft brown, gentle and nostalgic mood, storybook feel, plain off-white watercolor paper showing through, no text, no letters, no frame, wide 16:9 composition
```

### 휴대폰용 (비율 9:16) → `img/attic-tall.png`
```
a cozy attic library room, tall vertical view, wooden sloped roof with exposed rafters at the top, a round window in the upper right with soft sunlight streaming down in a diagonal beam, a red curtain beside it, a string of fairy lights and a clothesline with little paper notes across the top, a bookshelf full of books and stacks of books along the bottom, a small desk with an open book and a globe at the lower right, a patterned rug on wooden floorboards, the middle-left area kept calm and mostly empty for text, no people, no animals,
delicate hand-drawn illustration, thin sketchy warm brown colored-pencil outline, soft pale watercolor wash with light uneven paper texture, muted warm colors of honey, cream, faded red and soft brown, gentle and nostalgic mood, storybook feel, plain off-white watercolor paper showing through, no text, no letters, no frame, tall 9:16 composition
```

### 배경 고를 때
- 왼쪽(휴대폰용은 가운데 왼쪽)이 너무 복잡하면 다시 만드세요. 그 위에 제목이 올라갑니다.
- 동물 그림과 나란히 놓았을 때 선 굵기와 색 농도가 비슷한 것을 고르세요.
- 휴대폰용을 만들기 어려우면 컴퓨터용 한 장만 있어도 됩니다.

## 그림을 고를 때
- 선이 굵거나 색이 진하면 다시 만드세요. 묽고 연한 쪽이 참고 그림에 가깝습니다.
- 책 표지에 글자가 생기면 다시 만드세요.
- 16장 모두 배경이 흰 종이 느낌인지 확인하세요. 페이지의 액자와 폴라로이드 안에 그대로 들어갑니다.

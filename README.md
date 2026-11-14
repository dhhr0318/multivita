# 아이 종합비타민 완.벽.선택가이드

약사아빠(yak.filter)의 아이 종합비타민 19종 비교 사이트입니다.

## 자주 고치는 곳 (전부 `data.js`)

| 하고 싶은 것 | 고칠 곳 |
|---|---|
| 카카오톡 단체방 링크 넣기 | `CONFIG.kakaoGroup` 따옴표 안에 링크 붙여넣기 (비워두면 버튼 숨김) |
| 공동구매 기간/링크 바꾸기 | `CONFIG.groupBuyStart`, `groupBuyEnd`, `groupBuyLink`, `groupBuyRound` |
| 제품 추가 | `PRODUCTS` 목록에 기존 제품 하나 복사해서 내용 바꾸기, 사진은 `img/` 폴더에 |
| 상황별 추천 수정 | `SITUATIONS` |
| 성분표 원본 교체 | `img/table.png`, `img/table.pdf` 덮어쓰기 |

`data.js`, `app.js`, `style.css`를 고쳤다면 `index.html` 아래쪽의 `?v=날짜` 숫자도 바꿔주세요. 그래야 방문자 휴대폰에 예전 파일이 남아 있지 않아요.

GitHub 웹사이트에서 파일을 열고 연필 아이콘(Edit)으로 고친 뒤 Commit 하면 1~2분 뒤 사이트에 반영돼요.

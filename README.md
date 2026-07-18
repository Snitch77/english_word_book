# Context Words

예문 중심 영단어 암기 웹 앱. 엑셀/CSV로 단어를 올리고, 간격 반복(Spaced Repetition)으로 복습합니다.

- **Frontend:** Next.js (App Router) + Tailwind CSS
- **Backend / Sync:** Firebase Auth (익명) + Firestore realtime  
  → 환경 변수가 없으면 **로컬(localStorage) 데모 모드**로 동작
- **Deploy:** Vercel 권장

---

## 빠른 시작

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인합니다.

Firebase 없이 바로 써 볼 수 있습니다. 샘플 파일: `public/sample-words.csv`

### Firebase 연동 (실시간 동기화)

1. Firebase 콘솔에서 프로젝트 생성
2. Authentication → **Anonymous** 로그인 활성화
3. Firestore Database 생성 후 `firestore.rules` 배포
4. `.env.local.example`을 복사해 `.env.local`에 웹 앱 설정값 입력

```bash
cp .env.local.example .env.local
```

---

## 프로젝트 구조

```text
src/
  app/
    page.tsx              # 홈 · Due queue 대시보드
    study/page.tsx        # 학습 세션
    upload/page.tsx       # 엑셀/CSV 업로드
  components/
    upload/ExcelUploader.tsx
    study/StudyCard.tsx
    study/ExampleSentence.tsx
    study/IntervalPicker.tsx
    queue/DueQueue.tsx
  lib/
    parse/excel.ts        # 엑셀/CSV 파싱
    srs/intervals.ts      # 30m/1h/1d/3d/7d 정의
    srs/scheduler.ts      # 큐 정렬 · 스케줄 갱신
    firebase/             # Auth + Firestore
    storage/local-store.ts
  hooks/
    useAuth.tsx
    useWords.ts           # 실시간 구독 + import/schedule API
  types/word.ts
```

---

## 엑셀 업로드 형식

| 영단어 | 단어 뜻 | 예문 | 예문 해석 |
| --- | --- | --- | --- |

영문 헤더(`word`, `meaning`, `example`, `example meaning`)도 인식합니다.

파싱 후 각 행은 `WordCard`로 저장되며 `nextReviewAt = now`로 두어 **즉시 학습 큐에 노출**됩니다.

---

## 간격 반복(SRS) 설계 — 상세 제안

### 1. 왜 “수동 간격 버튼”인가

명세서 요구는 Anki식 SM-2 자동 계산이 아니라,

> 학습 완료 후 **30분 / 1시간 / 1일 / 3일 / 7일** 중 선택 → 해당 시각에 큐 재노출

입니다. 이 모델의 장점:

| 항목 | 설명 |
| --- | --- |
| 학습자 통제 | “지금 헷갈림 / 거의 앎”을 시간으로 직접 표현 |
| 동기화 단순 | Firestore에 `nextReviewAt` 하나만 있으면 큐 재구성 가능 |
| UX 명확 | 추상적인 Again/Good 대신 구체적 시각 |

핵심 필드는 다음 하나입니다.

```ts
nextReviewAt: number  // Unix ms. 이 시각 이하면 Due
```

### 2. 큐 알고리즘 (구현: `src/lib/srs/scheduler.ts`)

```text
due = cards.filter(c => c.nextReviewAt <= now)
due.sort(by nextReviewAt asc)   // 오래된 연체 카드 우선
```

- 학습 화면은 `due[0]`만 보여 줍니다.
- 간격 선택 시:

```ts
card.nextReviewAt = now + INTERVAL[id]
card.status      = statusAfterInterval(id)  // learning | review | mastered
card.reviewCount += 1
```

- 클라이언트는 30초마다 `now`를 갱신해 **30분/1시간** 같은 짧은 간격도 새로고침 없이 다시 뜹니다.
- Firebase 모드에서는 `onSnapshot`으로 다른 기기의 스케줄 변경이 실시간 반영됩니다.

### 3. 상태 머신

```text
new ──(첫 학습)──► learning ──(1d/3d)──► review ──(7d)──► mastered
                     ▲                      │
                     └────(다시 짧게 선택)───┘
```

- `30m` / `1h` → `learning` (단기 작업 기억 구간)
- `1d` / `3d` → `review` (장기 복습)
- `7d` → `mastered` (라벨일 뿐, 7일 뒤 다시 due 가능)

`mastered`는 “졸업”이 아니라 **긴 간격에 들어간 상태**입니다. 다시 틀리면 학습자가 `30m`을 고르면 됩니다.

### 4. 데이터 모델 (Firestore)

```text
users/{uid}/words/{wordId}
  word, meaning, example, exampleMeaning
  setId, setName
  status, nextReviewAt, lastIntervalId, reviewCount
  createdAt, updatedAt

users/{uid}/wordSets/{setId}
  name, wordCount, createdAt
```

보안 규칙: 본인 `uid` 하위만 read/write (`firestore.rules`).

### 5. 실시간 동기화 흐름

```text
기기 A에서 간격 선택
  → Firestore update(nextReviewAt)
  → onSnapshot (기기 B)
  → dueWords 재계산
  → B의 학습 큐에서 해당 카드 즉시 제외/재포함
```

로컬 모드는 `localStorage` + 커스텀 이벤트로 동일 API(`useWords`)를 유지합니다.

### 6. (선택) SM-2 하이브리드로 확장하는 법

지금은 버튼을 **학습자가 직접** 고릅니다. 나중에 난이도 버튼을 붙이려면 `suggestIntervalId(card, grade)`를 쓰면 됩니다.

| grade | 의미 | 추천 간격 |
| --- | --- | --- |
| 0 | 잊음 | 30분 (리셋) |
| 1 | 어려움 | 1시간 |
| 2 | 보통 | 사다리 +1칸 |
| 3 | 쉬움 | 사다리 +2칸 |

사다리: `30m → 1h → 1d → 3d → 7d`

본격 SM-2를 넣을 때는 카드에 `easeFactor`, `repetitions`, `intervalDays`를 추가하고, 버튼은 `Again / Hard / Good / Easy`로 바꾸면 됩니다.  
**현재 명세와 UI는 수동 시간 선택**을 1차 목표로 유지하는 것을 권장합니다.

### 7. 예문 강조 / 빈칸

`splitExampleByWord`가 예문에서 표제어(+ 간단 활용형 `-s/-ed/-ing`)를 찾아:

- **빈칸 모드:** 답보기 전 밑줄 처리
- **강조 모드:** `<mark>` 하이라이트

매칭 실패 시 `(word)`를 끝에 붙여 학습 대상이 항상 보이게 합니다.

---

## 스크립트

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run start    # 빌드 결과 실행
npm run lint
```

---

## 다음 단계 제안

1. 이메일/Google 로그인으로 익명 계정 업그레이드
2. 단어 세트별 필터 · 삭제
3. `suggestIntervalId`를 UI의 “추천” 뱃지로 노출
4. Cloud Function으로 due 알림(푸시/이메일)
5. Vercel 배포 + Firebase 환경 변수 등록

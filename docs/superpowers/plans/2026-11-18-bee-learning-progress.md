# Bee Learning Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task; use superpowers:subagent-driven-development only if the user chooses delegated execution. Steps use checkbox (`- [ ]`) syntax for tracking. User approved implementation on 2026-11-18 with “Triển khai đi”, then authorized merging to master and pushing. Product implementation is complete; Git history records integration status.

**Goal:** Lưu tiến trình của Bee bền vững và thống nhất điểm, EXP, thưởng, thành tựu, lịch học và bảng hạng bằng dữ liệu thật.

**Architecture:** Giữ học liệu JSON và giao diện Next.js hiện có; thêm catalog có ID ổn định, service học tập chạy trên server và database SQLite có transaction/unique constraints. Mỗi thao tác ghi được xác thực theo session và có receipt chống xử lý trùng. Giao diện chỉ hiển thị kết quả thưởng đã được server xác nhận.

**Tech Stack:** Next.js 16.4.6, React 19.3.0, TypeScript, CSS Modules; Node 26.8.2 với `node:sqlite`; `node:test` cho domain/storage/HTTP. Không thêm DB package trong phương án một server có ổ đĩa bền vững.

**Spec:** [Phân tích logic học tập, tiến trình và phần thưởng của Bee](../specs/2026-11-18-bee-learning-logic-design.md). Đọc cả spec và plan; phần hiện trạng trong spec có căn cứ code, phần thiết kế mới đã được chủ dự án cho triển khai ngày 18/11/2026.

## Global Constraints

- Giữ Next.js **16.4.6**, React **19.3.0**, TypeScript, CSS Modules; không nâng framework trong đợt làm tiến trình.
- Timestamps dùng giờ server UTC; ngày học tính ở `Asia/Ho_Chi_Minh`, không theo clock trình duyệt.
- Tài khoản `bee` ánh xạ tới `userId=usr_bee`; username hiện có dùng để tra user, không lấy từ request body để xác định chủ sở hữu.
- Với `cacheComponents: true`, đặt phần đọc cookie/database cá nhân trong Server Component nằm sau `Suspense`; giữ shell tĩnh và không bọc dữ liệu Bee vào cache dùng chung.
- Client gửi ID hành động/đáp án, không gửi tổng điểm, buff, userId hoặc số dư làm nguồn tin cậy.
- Không tạo dữ liệu lịch sử giả để khớp số demo.
- DB dùng Node runtime. Không gọi network hoặc await công việc khác bên trong transaction SQLite đồng bộ; không mở DB khi import module trong lúc build. Các test dùng file DB tạm riêng.
- Logout xóa phiên và dữ liệu cá nhân đang giữ trong UI; không xóa database. Người khác đăng nhập không kế thừa state Bee. Khách được học thử nhưng không ghi điểm/thưởng; MVP không nhập lịch sử khách vào Bee.
- Thực hiện toàn bộ ghi dữ liệu trước khi trả UI đã nhận thưởng; lỗi mạng không được hiển thị claim thành công.

## Review Focus

1. Hai tab dùng requestId khác nhau cùng giải một câu/claim một reward: chỉ cấp một thưởng; cùng requestId khác payload phải conflict. Test ở Task 2, 5, 6.
2. Phiên hết hạn hoặc đổi tài khoản giữa lúc chơi: không ghi nhầm dữ liệu, không lộ snapshot cũ. Test ở Task 1, 6, 7.
3. Hoạt động sát 00:00 Việt Nam và thứ Hai đầu tuần: ngày học/streak/kỳ hạng thống nhất. Test ở Task 4, 9.
4. Sai rồi đúng, có hint/reveal, quiz chồng nội dung và reload sau lỗi mạng: khôi phục đúng state, không farm sao/EXP hoặc tạo perfect giả. Test ở Task 3, 5, 7.
5. Snapshot cũ, transaction thất bại và popup bị đóng/xem lại: không giảm tiến trình, lệch số dư hoặc tự nhận thưởng. Test ở Task 2, 5, 8.

---

## 0. Trình tự, điểm dừng và điều kiện bắt đầu

**Đã triển khai 10 nhóm việc; xem kết quả kiểm chứng ở cuối file. Các bước commit riêng từng task được gộp thành một commit tích hợp theo yêu cầu merge vào master và push của người dùng.**

Người dùng đã cho triển khai các mặc định ở spec phần 15.3, theo phương án một server Node có ổ đĩa bền vững. Nếu môi trường là serverless/multi-instance/đĩa tạm, thay phần SQLite ở Task 2 bằng adapter database dùng chung, cập nhật spec/plan trước khi viết code. Migration và kiểm thử trong lần triển khai này chỉ tác động database thử riêng; không triển khai ra máy chủ production.

| Giai đoạn | Task | Kết quả có thể nghiệm thu |
| --- | --- | --- |
| P0 — nền tảng | 1–2 | Phiên trả được userId, dữ liệu lưu/đọc được qua lần mở DB khác, không lẫn tài khoản |
| P0 — nghiệp vụ | 3–6 | Catalog, scoring, ngày học, thưởng và API có transaction/receipt |
| P1 — đưa vào sử dụng | 7–8 | Bee tiếp tục học sau reload, game/thành tựu/thưởng đều có dữ liệu thật |
| P2 — đánh giá và bảng hạng | 9 | Bài thi chuẩn 26 câu và thứ hạng thật của Bee |
| Chốt chất lượng | 10 | Kiểm thử luồng đầy đủ, hướng dẫn vận hành và đối soát |

Task 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10. Không mở Level 2–5 chỉ vì account lên cấp; các level đó chưa có học liệu.

## 1. Bản đồ file dự kiến

Đường dẫn dưới đây tính từ repo root. File chưa tồn tại được ghi **Create** trong từng task.

| Khu vực | File | Trách nhiệm |
| --- | --- | --- |
| Auth | `app/login/session.ts` | Trả định danh account chuẩn, giữ API tên hiển thị cũ |
| Hợp đồng | `app/learning/types.ts` | Input/DTO, mã lỗi và kiểu result chung |
| Học liệu | `app/learning/catalog.ts` | ID ổn định và định nghĩa hoạt động/đáp án chuẩn |
| Dữ liệu game | `app/learning/game-content.ts` | Chuyển hai mảng game đang nằm trong component sang nguồn dùng chung |
| Lưu trữ | `app/learning/db.ts`, `schema.sql`, `repository.ts` | Kết nối lazy, migration, SQL có tham số, transaction |
| Domain | `app/learning/scoring.ts`, `rewards.ts`, `achievements.ts`, `study-calendar.ts` | Rule thuần không phụ thuộc request/JSX |
| Nghiệp vụ | `app/learning/service.ts`, `queries.ts` | Command nguyên tử và snapshot từ account |
| HTTP | `app/learning/http.ts`, `app/api/learning/route.ts` | Dispatcher whitelist, session/origin, lỗi và no-store |
| Client | `app/learning/use-learner.ts`, `save-status.tsx` | Gọi API, giữ requestId khi retry, hiển thị tình trạng lưu |
| UI học/game | Các page/component hiện có | Nhận snapshot và gửi hành động, bỏ nền demo |
| UI thành tựu | `app/achivement/*` | DTO thật và thưởng pending/claimed |
| Assessment | `app/oxford-phonics-world/level-1/assessment/*` | Bài thi tổng hợp 26 câu |
| Ranking | `app/learning/leaderboard.ts`, `app/bangxephang/*` | Kết quả tốt nhất mỗi người/kỳ |
| Test | `tests/learning-*.test.mjs`, `tests/helpers/load-learning.mjs` | Kiểm thử domain, DB và HTTP qua loader theo pattern test hiện có |
| Vận hành | `scripts/learning-db.mjs`, `docs/learning-data-operations.md` | Migrate/backup/reconcile dữ liệu khi app đã triển khai |

Không tạo “framework repository” tổng quát hoặc thay hệ thống xác thực chỉ để phục vụ tính năng này.

## 2. Hợp đồng dùng xuyên suốt các task

Khai báo ở `app/learning/types.ts` trong Task 1; phần ranking được bổ sung ở Task 9.

```ts
type Learner = { id: string; username: string; displayName: string };
type LearningErrorCode =
  | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND'
  | 'INVALID_INPUT' | 'CONFLICT' | 'BUSY' | 'UNAVAILABLE';
type Mutation<T> = { requestId: string; input: T };
type ActivityKind = 'flashcard' | 'quiz' | 'scramble' | 'box' | 'assessment';
type AttemptDto = {
  id: string; activityId: string; kind: ActivityKind;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: string; completedAt: string | null;
  questions: Array<{
    id: string; solved: boolean; answered: boolean;
    firstAnswerCorrect: boolean | null; hintCount: number; revealed: boolean;
  }>;
  gameScore: number; correctFirst: number; questionCount: number;
};
type RewardDto = {
  id: string; kind: 'mastery' | 'level_up'; status: 'pending' | 'claimed';
  xp: number; stars: number; level: number | null;
  celebrationSeen: boolean;
};
type LearnerSnapshot = {
  revision: number;
  learner: Learner;
  profile: { totalXp: number; stars: number; level: number;
    xpWithinLevel: number; xpToNext: number; bonusBps: number };
  learnedWordIds: string[]; reviewedTodayWordIds: string[];
  seenLetterIds: string[]; completedLetterIds: string[];
  resume: { letterId: string; wordId: string } | null;
  counts: { sessions: number; perfect: number; studyDays: number;
    currentStreak: number; longestStreak: number };
  badges: Array<{ id: string; unlockedAt: string | null }>;
  rewards: RewardDto[];
};
type MutationResult = {
  snapshot: LearnerSnapshot; attempt: AttemptDto | null;
  feedback: 'correct' | 'retry' | 'recorded' | null;
  assistance: { kind: 'hint' | 'reveal'; text: string } | null;
};
```

DTO câu hỏi công khai lấy từ catalog client-safe; đáp án chuẩn và target dùng để chấm nằm trong catalog server. Không gửi password/hash/token trong bất kỳ DTO nào. `MutationResult` của retry cùng requestId trả lại bản receipt cũ; client bỏ qua snapshot có revision thấp hơn state hiện tại rồi GET đồng bộ lại khi cần.

### Task 1: Định danh người học và hợp đồng dữ liệu

**Files:** Modify `app/login/session.ts`; Create `app/learning/types.ts`, `tests/auth-session.test.mjs`, `tests/helpers/load-learning.mjs`.

**Interfaces:** Produces `getSessionAccount(): Promise<{ username: string; displayName: string } | null>`; giữ nguyên `getDisplayName(): Promise<string | null>`. `Learner.id` được resolve ở repository của Task 2, không nhận từ browser.

- [x] Viết test cho phiên Bee hợp lệ, token sửa chữ ký, hết hạn, thời hạn không phải số hữu hạn, username không tồn tại và không có cookie; assert các trường hợp lỗi trả null. Loader transpile TS và mock `server-only`/`next/headers` theo pattern hiện có.
- [x] Chạy `node --test tests/auth-session.test.mjs`, xác nhận test mới FAIL vì chưa có `getSessionAccount`.
- [x] Tách phần xác minh token dùng chung; kiểm tra expiry hữu hạn, vẫn giữ HMAC/scrypt/cookie options hiện tại; thêm kiểu DTO của phần 2. Không ghi credential ra log.
- [x] Chạy `node --test tests/auth-actions.test.mjs tests/auth-session.test.mjs`: tất cả PASS; đăng nhập/đăng xuất không đổi hành vi cũ.
- [ ] Review diff và tạo commit riêng cho định danh/hợp đồng khi thực thi được cho phép.

### Task 2: Database, migration và cách ly account

**Files:** Create `app/learning/db.ts`, `app/learning/schema.sql`, `app/learning/repository.ts`, `scripts/learning-db.mjs`, `tests/learning-storage.test.mjs`; Modify `.gitignore`, `package.json`, `package-lock.json`, `yarn.lock` nếu Yarn tiếp tục được dự án duy trì.

**Interfaces:** Consumes Task 1. Produces `openLearningDb(filePath: string): DatabaseSync`, `migrateLearningDb(db: DatabaseSync): void`, `withTransaction<T>(db: DatabaseSync, work: () => T): T`, `ensureLearner(account: { username: string; displayName: string }): Learner`. Đường dẫn lấy từ `BEE_DATABASE_PATH`; không fallback âm thầm sang DB tạm ở production.

- [x] Viết test migrate hai lần không nhân bản; seed `bee → usr_bee`; account khác không dùng chung profile; đóng/mở file vẫn giữ dữ liệu; FK/unique từ spec phần 10.2 hoạt động.
- [x] Viết test rollback khi lỗi sau ghi ledger nhưng trước cập nhật profile, cùng requestId khác payload conflict, hai connection đua unique sourceKey. Assert số dư vẫn bằng tổng claimed ledger.
- [x] Chạy `node --test tests/learning-storage.test.mjs`, xác nhận FAIL trước khi có storage.
- [x] Cập nhật `@types/node` từ bản 20.19.43 hiện có sang bản có khai báo `node:sqlite` tương thích runtime 26.8.2; xác minh bản được resolve khi thực thi và pin trong lockfile, không tự khai báo module thành `any`. Giữ nguyên phiên bản framework.
- [x] Tạo schema bằng version migration, các bảng/ràng buộc trong spec, bao gồm `word_reviews`; bật foreign keys và busy timeout; ghi bằng `BEGIN IMMEDIATE`, tham số SQL; lazy-open DB. Thêm `.data/`, `*.sqlite-wal`, `*.sqlite-shm` vào ignore và lệnh migration explicit.
- [x] Chạy lại test storage, assert PASS cả reopen và rollback; không đụng DB thật của người học.
- [ ] Review schema/transaction và commit riêng. Nếu deploy không thỏa giả định một server, dừng task này để thay adapter theo mục 0.

### Task 3: Catalog và chấm điểm thuần

**Files:** Create `app/learning/catalog.ts`, `app/learning/game-content.ts`, `app/learning/scoring.ts`, `app/learning/rewards.ts`, `tests/learning-scoring.test.mjs`; Modify `app/gheptu/word-game.tsx`, `app/mohop/mystery-box.tsx` chỉ để lấy dữ liệu từ module chung.

**Interfaces:** Produces `getActivity(activityId: string): ActivityDefinition`, `gradeAnswer(activityId: string, questionId: string, selectedId: string): boolean`, `scoreAttempt(input: AttemptScoreInput): { gameScore: number; correctFirst: number; perfect: boolean; eligible: boolean }`, `calculateXp(baseXp: number, bonusBps: number): number`, `levelForXp(totalXp: number): { level: number; xpWithinLevel: number; xpToNext: number }`. Khai báo `ActivityDefinition` và `AttemptScoreInput` ở `types.ts`; chúng phải mô tả danh sách questionId, trọng số, firstAnswerCorrect/solved/hintCount/revealed và mode practice/assessment như spec.

- [x] Viết assertions: 26 chữ/101 từ; X chỉ 1 từ; quiz Z có Z/A/B; quiz A và B dùng cùng canonical ID cho câu B; 8 từ ghép/12 hộp giữ nội dung cũ, ID không phụ thuộc locale/index.
- [x] Viết assertions: quiz tối đa 30, scramble 160, box 120; trạng thái ban đầu 0; sai rồi đúng không perfect; hint không perfect; reveal có điểm/thưởng 0; assessment sai vẫn được hoàn tất và chỉ đúng lần đầu có 1 điểm.
- [x] Viết assertions: `calculateXp(20, 500) === 21`, `calculateXp(10, 950) === 10`; `levelForXp(99).level === 1`, 100 → 2, 300 → 3. Reject giá trị âm, không hữu hạn hoặc ID không thuộc activity.
- [x] Chạy `node --test tests/learning-scoring.test.mjs` để thấy FAIL; triển khai các hàm thuần, giữ mapping stable/version=1, rồi chạy lại để PASS.
- [ ] Chạy `npm run lint`; review và commit catalog/rule. Không đồng thời đổi style/game flow ở task này.

### Task 4: Ngày học, streak và mở huy hiệu

**Files:** Create `app/learning/study-calendar.ts`, `app/learning/achievements.ts`, `tests/learning-calendar.test.mjs`, `tests/learning-achievements.test.mjs`.

**Interfaces:** Produces `toStudyDate(now: Date): string`, `summarizeStudyDays(dates: string[], now: Date): { total: number; currentStreak: number; longestStreak: number }`, `evaluateAchievements(counts: { sessions: number; perfect: number; studyDays: number }, unlockedIds: string[]): { newBadgeIds: string[]; totalBonusBps: number }`. Ngày là `YYYY-MM-DD`, timezone cố định Việt Nam.

- [x] Viết test timestamp `2026-11-18T16:59:59Z` → ngày 18, `17:00:00Z` → ngày 19; ngày trùng chỉ tính một; qua tháng/năm/năm nhuận; chưa học hôm nay giữ streak đến hôm qua, bỏ qua hôm qua thì current=0, longest không giảm.
- [x] Viết test tại sessions=128/perfect=8/days=45 tạo 9 badge và 950 bps; mở hết là 18 badge/3150 bps; rerun không có badge mới; từng ngưỡng nhỏ hơn 1/đúng ngưỡng và vượt nhiều mốc.
- [x] Chạy `node --test tests/learning-calendar.test.mjs tests/learning-achievements.test.mjs`, xác nhận FAIL; triển khai các hàm và bảng rule từ spec phần 6/11/12; chạy lại PASS.
- [ ] Review và commit riêng. Không dùng ngày demo hoặc `new Date()` rải rác trong domain; truyền `now` để test xác định.

### Task 5: Service lưu tiến trình, attempt và sổ thưởng nguyên tử

**Files:** Create `app/learning/service.ts`, `app/learning/queries.ts`, `tests/learning-service.test.mjs`, `tests/learning-rewards.test.mjs`; Modify `app/learning/repository.ts`, `app/learning/types.ts`.

**Interfaces:** Consumes Task 2–4. Các hàm dưới đây chạy server-only, truyền `Learner` đã xác thực, trả `MutationResult`; `now` được dependency-inject trong test, lấy clock server khi vận hành.

```ts
markWord(learner: Learner, command: Mutation<{
  wordId: string; state: 'seen' | 'learned'
}>): MutationResult;
saveResume(learner: Learner, command: Mutation<{
  letterId: string; wordId: string
}>): MutationResult;
startAttempt(learner: Learner, command: Mutation<{
  activityId: string
}>): MutationResult;
answerQuestion(learner: Learner, command: Mutation<{
  attemptId: string; questionId: string; selectedId: string
}>): MutationResult;
useAssistance(learner: Learner, command: Mutation<{
  attemptId: string; questionId: string; kind: 'hint' | 'reveal'
}>): MutationResult;
abandonAttempt(learner: Learner, command: Mutation<{
  attemptId: string
}>): MutationResult;
claimReward(learner: Learner, command: Mutation<{
  rewardId: string
}>): MutationResult;
acknowledgeCelebration(learner: Learner, command: Mutation<{
  rewardId: string
}>): MutationResult;
getSnapshot(learner: Learner, now: Date): LearnerSnapshot;
```

- [x] Viết test `markWord` không tự learned khi mở trang; không hạ learned → seen; X hoàn tất sau 1 từ, A sau 4; completion reward một chữ cấp 10 EXP/0 sao một lần; resume từ không thuộc chữ bị reject. Lần đầu hoàn thành chữ qua nhiều ngày vẫn ghi một completion ngày hoàn thành; ngày ôn sau phải đánh dấu lại đủ mọi từ mới tăng lượt, không cộng lại EXP.
- [x] Viết test start cùng activity trả attempt in_progress đang có; sai rồi đúng giữ firstAnswerCorrect=false; answer lại câu solved không tăng thưởng; quay lại game phục hồi câu đã làm. Completed/abandoned không nhận mutation trả lời mới.
- [x] Viết test quiz A/B chồng câu chỉ cấp một mastery cho câu chung; replay không tăng sao/EXP cũ; hai requestId khác nhau cùng giải/claim chỉ có một delta. Retry cùng requestId trả receipt cũ; payload khác conflict. Unknown/foreign attempt/question/reward bị reject.
- [x] Viết test dùng hint/reveal trước khi lộ nội dung; ghép từ hint tối đa 2/câu; revealed không thưởng, không perfect và không daily completion. Hint không reveal vẫn tính lượt/ngày khi hoàn tất.
- [x] Viết test cùng activity/ngày chỉ một lượt; replay perfect nâng cờ false → true; ngày mới có thể tăng lượt/perfect. Flashcard không tăng perfect; GET/sự kiện âm thanh không tăng ngày.
- [x] Viết test snapshot buff không tăng trong chính attempt vừa mở badge; ngưỡng EXP và nhiều level tạo reward pending riêng; claim 50 sao không tăng EXP; đóng/ack/xem lại không cộng sao; pending chưa vào balance.
- [x] Chạy `node --test tests/learning-service.test.mjs tests/learning-rewards.test.mjs` để thấy FAIL; triển khai từng command trong một transaction bao gồm receipt, ledger, profile, badge và completion; chạy lại PASS.
- [ ] Review số dư/unique/concurrency bằng hai connection DB rồi commit riêng.

### Task 6: HTTP API và snapshot cá nhân

**Files:** Create `app/api/learning/route.ts`, `app/learning/http.ts`, `tests/learning-http.test.mjs`; Modify `app/learning/queries.ts`.

**Interfaces:** `GET /api/learning?view=snapshot|attempt|calendar` và `POST /api/learning` với envelope `{ operation, requestId, input }`. Operation whitelist đúng 8 command Task 5; GET attempt cần attemptId, calendar cần year/month và trả `{ year, month, studyDates: string[] }`. POST không cho trường ngoài schema; không có endpoint nhận tổng điểm.

- [x] Viết test dispatcher: thiếu/hết hạn cookie → 401, tài nguyên account khác → 403, không tồn tại → 404, input sai → 400, request conflict → 409, DB busy → 503 có retry. Unknown operation → 400; Origin không đúng/thiếu hoặc Content-Type không phải JSON → từ chối; payload quá 16 KiB → 413.
- [x] Viết test POST giả `userId`, `totalXp`, `bonusBps`, `stars` bị reject; GET không tạo completion/claim; response không có hash/secret/đáp án server; mọi response cá nhân dùng `private, no-store`.
- [x] Chạy `node --test tests/learning-http.test.mjs` để FAIL; triển khai whitelist validation, mapping lỗi và resolve `getSessionAccount → ensureLearner`. Route dùng Node runtime và không bọc cookie/query vào shared cache.
- [x] Chạy lại HTTP dispatcher test PASS; chạy production HTTP integration với `BEE_DATABASE_PATH` trỏ DB tạm riêng để kiểm tra Next route thực sự trả cùng status/header.
- [ ] Review và commit API. Tận dụng secret test ngẫu nhiên như `auth-http.test.mjs`, không ghi mật khẩu Bee vào test.

### Task 7: Tích hợp bài học và ba game với dữ liệu Bee

**Files:** Create `app/learning/use-learner.ts`, `app/learning/save-status.tsx`, `tests/learning-client.test.mjs`; Modify `app/oxford-phonics-world/level-1/page.tsx`, `level-detail.tsx`, `game-chooser.tsx`, `app/minigame/page.tsx`, `mini-game.tsx`, `app/gheptu/page.tsx`, `word-game.tsx`, `app/mohop/page.tsx`, `mystery-box.tsx`, `app/oxford-phonics-world/level-selection.tsx`, các CSS Module tương ứng khi cần.

**Interfaces:** `useLearner(initial: LearnerSnapshot | null): { snapshot: LearnerSnapshot | null; status: 'idle' | 'saving' | 'error'; send(operation: string, input: unknown): Promise<MutationResult>; retry(): Promise<MutationResult | null> }`. Client phải dùng operation union/typed input từ Task 6 khi triển khai, không cho gửi chuỗi tùy ý. `SaveStatus` hiển thị lưu/đã lưu/lỗi và nút retry; guest có nhắc đăng nhập để lưu.

- [x] Viết test reducer/request coordinator: giữ cùng requestId khi retry; snapshot revision thấp bị bỏ; 401 xóa snapshot account và dừng ghi; đổi user reset attempt/query cache; request in-flight của account cũ không được áp dụng sau logout/login khác.
- [x] Chạy `node --test tests/learning-client.test.mjs` → FAIL; triển khai hook/client coordinator dùng API. Hạn chế mutation pending trên cùng câu, nhưng vẫn dựa vào server để chống trùng.
- [x] Bọc server loader cá nhân sau `Suspense`, truyền initial snapshot/attempt vào client. Word picker gửi seen/resume, nút “Đã học từ này” hoặc “Ôn lại từ này” gửi learned; dùng `reviewedTodayWordIds` cho tiến trình ôn hôm nay, không xóa trạng thái learned cũ. Game restore từ attempt; link quay lại dùng resume. Không gửi seen tự động cho A chỉ vì SSR/render.
- [x] Bỏ `120`, `round+3`, `seconds=102`, `7+solvedCount` và `opened=[2]` trong flow thật; thời gian từ server startedAt, các câu bắt đầu 1/N; bỏ tự thưởng trước response. Dùng canonical ID cho câu quiz chồng chữ.
- [x] Đưa hint/reveal qua API trước khi hiện giúp; quiz hoàn tất 3 câu có tổng kết, chơi lại tạo attempt mới; game thực hiện abandon trước restart. Guest dùng logic luyện thử cục bộ nhưng không ghi/hiện là thưởng tài khoản.
- [x] Chạy lại test client PASS, `npm run lint`, `npm run build`; kiểm tra trình duyệt Bee: học A một phần → reload → học tiếp, quiz sai/đúng, ghép từ hint/reveal, mở hộp → reload → số đã giải còn đúng. Kiểm tra 390px và VI/EN.
- [ ] Kiểm tra khách/tài khoản khác không thấy dữ liệu Bee; mô phỏng lỗi request và retry cùng ID; review rồi commit tích hợp UI.

### Task 8: Thành tựu, lịch, buff, EXP và popup thưởng thật

**Files:** Modify `app/achivement/page.tsx`, `achievements.tsx`, `level-up-modal.tsx`, `achievements.module.css`; Create `tests/learning-achievement-view.test.mjs`.

**Interfaces:** `Achievements({ initialSnapshot }: { initialSnapshot: LearnerSnapshot | null })`; `LevelUpModal` nhận `RewardDto` thực và callback claim/ack, thay API chỉ mở animation mẫu. Calendar lấy month query Task 6, không đọc mảng studyDays demo.

- [x] Viết test view model: Bee mới có 0/18 badge, EXP=0, level=1, không tự mở Level 6; counts thực tạo đúng tiến độ/buff; tháng không có ngày thì rỗng; reward pending vẫn còn khi đóng modal; claimed không có nút nhận lại.
- [x] Viết test pending ở nhiều cấp hiển thị từng reward; automatic celebration chỉ cho reward chưa ack; replay hiệu ứng không gọi claim; claim thất bại không tăng sao hoặc gắn đã nhận.
- [x] Chạy `node --test tests/learning-achievement-view.test.mjs` để FAIL; thay toàn bộ counts, level, EXP, ngày và streak mẫu bằng snapshot/queries. Bỏ timer auto preview 1 giây trong flow thật và các copy “100 bài/+500 EXP” không thuộc rule.
- [x] Thêm khu thưởng chưa nhận, nút nhận dùng pending/error/claimed rõ ràng; cập nhật số dư chỉ sau receipt server. Giữ focus/escape/scroll lock và reduced-motion của dialog hiện có.
- [x] Chạy lại test view model PASS; kiểm tra hai tab cùng claim chỉ một lần, reload vẫn giữ badge/balance, tắt mạng khi claim, đóng/xem lại popup; `npm run lint` và production build.
- [ ] Review rằng không còn số mẫu gán cho người học rồi commit thành tựu/thưởng.

### Task 9: Assessment Level 1 và bảng xếp hạng từ dữ liệu thật

**Files:** Create `app/oxford-phonics-world/level-1/assessment/page.tsx`, `assessment.tsx`, `assessment.module.css`, `app/learning/leaderboard.ts`, `tests/learning-leaderboard.test.mjs`; Modify `app/learning/catalog.ts`, `service.ts`, `types.ts`, `app/api/learning/route.ts`, `app/bangxephang/page.tsx`, `leaderboard.tsx`, `app/oxford-phonics-world/level-1/game-chooser.tsx`.

**Interfaces:** Bổ sung GET `view=leaderboard&period=today|week|all&level=1`. `getLeaderboard(input: { period: 'today' | 'week' | 'all'; level: number; now: Date; viewerId: string | null }): { rows: Array<{ userId: string; displayName: string; score: number; total: number; durationMs: number; rank: number }>; own: { rank: number; score: number; durationMs: number } | null }`. Chỉ GET DTO công khai tối thiểu, không lộ username/private progress.

- [x] Viết test assessment: 26 câu, sai vẫn sang câu tiếp, mỗi câu chỉ một answer, 26/26 mới perfect; không hint/reveal và không mastery reward; thời lượng do server tính, abandon không vào bảng.
- [x] Viết test best **trong kỳ**/user, score → duration → completedAt → userId; thứ Hai 00:00 Việt Nam, kết quả sát ranh giới ngày/tuần; bảng 0/1/2 người và Bee chưa có kết quả; own rank ngoài top vẫn đúng.
- [x] Chạy `node --test tests/learning-leaderboard.test.mjs` để FAIL; triển khai query kỳ `[start,end)` và comparator của spec phần 13, thêm mode assessment vào service. Kiểm tra answer nhanh/chậm không được gửi duration hoặc score từ client.
- [x] Tạo page assessment bằng các control hiện có; thay learners, player count, own rank, score/time demo bằng response. Level 2–5 hiện chưa có bài thi; thêm đường vào assessment/bảng hạng từ Level 1.
- [x] Chạy test ranking/service PASS, `npm run lint`, `npm run build`; thi xong bằng Bee → bảng hạng cập nhật → thi lại tốt hơn → chỉ kết quả tốt nhất trong kỳ xuất hiện. Dưới ba người hoặc điểm trần không gợi ý điểm vượt vô lý.
- [ ] Review và commit assessment/ranking. Không nhập mảng học viên demo vào database.

### Task 10: Kiểm chứng toàn luồng và vận hành dữ liệu

**Files:** Create `docs/learning-data-operations.md`, `tests/learning-journey-http.test.mjs`; Modify `README.md`, `scripts/learning-db.mjs`.

**Interfaces:** Script CLI có subcommand `migrate`, `backup --output <path>`, `reconcile`; backup dùng cơ chế backup database phù hợp WAL, không copy riêng file chính khi đang ghi. Reconcile mặc định read-only và báo lệch số dư/unique/foreign-key; không tự sửa lịch sử.

- [x] Viết journey test dùng DB tạm và server production: phiên Bee → học/hoàn tất chữ → giải game → mở badge/cấp → claim → restart server với cùng DB/secret → còn nguyên dữ liệu; guest và account khác không truy cập được dữ liệu đó.
- [x] Thêm tình huống fault-injection rollback, retry request bị mất response và concurrent claim qua hai client. Mỗi test tự dọn file DB/server do nó tạo, không xóa nội dung người dùng.
- [x] Chạy `npm run lint`, `npm run build`, `node --test tests/*.test.mjs`, `git diff --check`: mọi lệnh exit 0. `auth-http.test.mjs` và test HTTP mới chạy sau build, không dựa vào `.next` cũ.
- [x] Chạy đối soát trên DB test: `profile == sum(claimed reward deltas)`, không duplicate sourceKey, FK hợp lệ; backup → restore vào đường dẫn test khác → số liệu không đổi.
- [x] Kiểm tra trình duyệt desktop/390px: auth, resume, save status, toàn bộ game, pending/claim, calendar/streak, assessment/ranking; audio lỗi không được tự tính learned/perfect. Ghi kết quả thực tế, phân biệt test tự động và thao tác thủ công.
- [x] Viết hướng dẫn Node/runtime, `BEE_DATABASE_PATH`, `BEE_SESSION_SECRET`, migration, backup/restore, điều kiện SQLite và giới hạn offline. Không đưa DB/secret/password hoặc dữ liệu demo vào Git.
- [x] Review diff cuối và kiểm tra mọi tiêu chí spec phần 15.1; thực hiện reporting pass Next.js theo `AGENTS.md` nếu có friction đủ điều kiện. Chỉ báo hoàn tất tính năng khi có bằng chứng lệnh và kiểm tra flow.

## 3. Tự kiểm tra plan và trạng thái bàn giao

| Yêu cầu | Nơi triển khai/kiểm chứng |
| --- | --- |
| Account Bee, cách ly dữ liệu | Task 1, 2, 6, 7, 10 |
| Tiến trình từng từ/chữ, resume, nhiều thiết bị | Task 2, 5, 7 |
| Ba game, sai/gợi ý/reveal, chấm điểm | Task 3, 5, 7 |
| Chống thưởng trùng, retry, concurrency, rollback | Task 2, 5, 6, 10 |
| EXP/buff, cấp tài khoản, pending/claim | Task 3, 4, 5, 8 |
| Lượt học, perfect, lịch/ngày/streak | Task 4, 5, 8 |
| Assessment và bảng hạng thật | Task 9 |
| Cache Components, không lộ dữ liệu | Task 1, 6, 7, 10 |
| Không nhập demo, backup/đối soát | Task 2, 8, 9, 10 |

**Đã triển khai:** tiến trình Bee, ba game, EXP/sao, huy hiệu, ngày học/streak, reward pending/claim, assessment và bảng xếp hạng thật. Công việc được thực hiện trên nhánh `codex/bee-learning-progress`; người dùng đã yêu cầu commit, merge vào `master` và push lên `origin/master`. Không deploy ứng dụng trong phạm vi này.

## 4. Kết quả triển khai ngày 18/11/2026

- `npm run lint`: exit 0, không có lỗi/cảnh báo ESLint.
- `npm run build`: exit 0 với Next.js 16.4.6, Cache Components và Partial Prefetching; API learning và assessment mới được build thành công.
- `npm test`: **25/25 test PASS**, gồm auth, storage reopen/FK/rollback, scoring, badge/streak, ownership/Origin, retry và đổi phiên, concurrent answer/claim qua production HTTP, restart server giữ dữ liệu, assessment/ranking, WAL backup và đối soát.
- Fault injection bằng SQLite trigger đã xác minh lỗi sau ghi ledger rollback cả answer/claim, receipt và số dư. Truy vấn ranking được kiểm tra hòa điểm/thời gian và sát nửa đêm thứ Hai Việt Nam.
- Trình duyệt trên DB thử: đăng nhập; popup cấp 2; đóng vẫn pending và 0 sao; nhận thưởng thành 50 sao; chọn X, đánh dấu Fox, reload vẫn giữ vị trí/từ đã học; mini game trả lời sai rồi đúng, reload tiếp tục câu 2; ghép từ dùng hint và đáp án mẫu, xác nhận vẫn 0 điểm; mở hộp từ 0/12 lên 1/12; assessment 26/26 rồi bảng hạng hiện Bee hạng 1.
- Bài học và bảng hạng ở viewport 390px không tràn ngang; kiểm tra popup ở desktop. Sau logout ở tab khác, request đồng bộ bảng hạng xóa dữ liệu cá nhân và hiển thị phiên đã thay đổi.
- Không giả lập mất mạng trong browser; trường hợp mất phản hồi/retry/late response được kiểm tra bằng fetch điều khiển trong test client. Không kiểm tra lại dịch vụ TTS bên ngoài; các control và luồng audio hiện có được giữ nguyên.
- File tracing đã chứa `app/learning/schema.sql` cho API và các page. Database thử/server thử đã được dừng; không thay dữ liệu học tập thật của Bee trong quá trình QA.
- Reporting pass Next.js: không còn candidate đủ điều kiện. Lỗi runtime export đã được xử lý theo tài liệu cài sẵn; EPERM khi build là giới hạn sandbox. Các lỗi DTO/client là lỗi ứng dụng và đã được sửa.

### Điều chỉnh kỹ thuật so với plan ban đầu

1. Dùng checkout hiện tại trên feature branch, không tạo worktree mới; để thay đổi chưa commit. Nếu cần tích hợp, người dùng có thể review diff rồi commit/merge riêng.
2. Theo dõi tiến độ bằng ledger PowerShell trên Windows thay vì script POSIX của skill; không ảnh hưởng sản phẩm.
3. Giữ SQLite một server có ổ đĩa bền vững; production bắt buộc cấu hình `BEE_DATABASE_PATH` và `BEE_SESSION_SECRET`. Mô hình deploy khác cần adapter DB dùng chung, không được dùng ổ tạm.
4. Repository/service nhận `DatabaseSync` tường minh để test trên DB riêng; lớp HTTP/SSR resolve DB và account. Không dùng database thật trong test.
5. Chuẩn hóa mọi SQLite row thành plain object tại repository để DTO qua được ranh giới Server/Client Component và receipt retry nhất quán.
6. Thêm header actor `X-Bee-Learner` ở request cá nhân, kiểm tra cùng session để tab cũ không ghi dữ liệu vào tài khoản vừa đăng nhập; phát hiện đổi phiên tăng generation và bỏ mọi phản hồi cũ.
7. Bỏ `runtime='nodejs'` trong route vì Cache Components cấm export này và đã yêu cầu Node mặc định; không chuyển sang Edge.
8. Kiểm tra Origin với Host nhận từ request, vì Next có thể tạo URL nội bộ localhost; vẫn chặn Origin khác host/port hoặc sai định dạng.
9. `markWord` đồng thời lưu resume trong một transaction để tránh hai request rời nhau; `saveResume` vẫn có. Snapshot thêm ngày học tính từ server để lịch không phụ thuộc clock browser.
10. Chỉ nâng `@types/node` lên 26.6.6 và undici-types liên quan, giữ graph Yarn còn lại. Thêm engine Node `>=26.8.2 <27`; không đổi Next/React.
11. Kết quả trợ giúp có continuation gắn với request, nên retry vẫn hiển thị hint/reveal; sidebar không công bố gợi ý được chấm trước khi ghi trợ giúp. Calendar/ranking làm mới theo dữ liệu hoặc khi quay lại tab.
12. Bỏ copy thưởng mật ong +150 và “Level 1–5 Ready” để giao diện không hứa nghiệp vụ/nội dung chưa có; mini game nói rõ thưởng mastery chỉ nhận lần đầu.

### Review độc lập

Review tìm thấy một lỗi P1 về late response sau đổi phiên và bốn lỗi P2 về hint retry, sidebar hint, ranking sau logout và lịch chưa refresh. Các lỗi đã được sửa trong một lượt; test regression cho client/ranking đều đã thấy FAIL trước sửa và PASS sau sửa. Bổ sung kiểm tra rollback giao dịch thật và ranking nhiều người. Không có minor được hoãn hoặc hành vi quan trọng bị bỏ qua do ngoài spec.

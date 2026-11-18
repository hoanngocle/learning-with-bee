# Phân tích logic học tập, tiến trình và phần thưởng của Bee

Ngày rà soát: **18/11/2026**. Mã nguồn tham chiếu: **`efc535d`**, cộng nội dung working tree tại thời điểm đọc. Phạm vi: repo `learning-with-bee`, 9 page và 1 API route hiện có.

**Trạng thái cập nhật:** người dùng đã cho triển khai ngày 18/11/2026. Phần 1–8 giữ lại bản phân tích **trước triển khai**, không mô tả code mới sau thay đổi. Phần 9–15 là thiết kế đã thực hiện; xem kết quả kiểm chứng và các điều chỉnh trong plan đi kèm. Các con số demo trong phần hiện trạng không được nhập thành lịch sử thật cho tài khoản `bee`.

Kế hoạch triển khai: [Bee Learning Progress Implementation Plan](../plans/2026-11-18-bee-learning-progress.md).

## 1. Kết luận chính

- Đã có đăng nhập/đăng xuất, xác thực mật khẩu và cookie phiên của Bee.
- Chưa có kho lưu tiến trình theo tài khoản: không có database client, API ghi tiến trình, `localStorage`, `sessionStorage` hay IndexedDB trong code ứng dụng được rà soát.
- Bài học A–Z, mini game, ghép từ và mở hộp có tương tác thật, nhưng state học/điểm chỉ tồn tại trong từng component. Tải lại hoặc component bị unmount sẽ khởi tạo lại.
- `/achivement` và `/bangxephang` có giao diện, bộ lọc và hiệu ứng hoạt động, nhưng số liệu là dữ liệu mẫu.
- Chưa có sổ điểm chung, EXP thật, điều kiện mở khóa thật, lịch sử nhận thưởng hay kiểm tra quyền sở hữu dữ liệu học tập.
- Vì vậy không thể suy ra Bee đã học bao nhiêu bài, có bao nhiêu điểm hoặc đã nhận thưởng gì từ các số đang hiển thị.

## 2. Bản đồ page và các luồng điều hướng

| URL | Chức năng hiện tại | Logic/state thật | Lưu theo Bee? |
| --- | --- | --- | --- |
| `/` | Giới thiệu hai giáo trình, chọn Oxford/Let's Go | Nội dung tĩnh; Oxford dẫn sang chọn level; Let's Go chỉ tới anchor trên trang | Không |
| `/login` | Form đăng nhập | Server Action kiểm tra tài khoản, tạo cookie; đã đăng nhập thì về `/` | Có phiên đăng nhập, không có tiến trình |
| `/oxford-phonics-world` | Danh sách Level 1–5 | Level 1 luôn là đang học; Level 2–5 hiển thị khóa bằng điều kiện cứng | Không |
| `/oxford-phonics-world/level-1` | Chọn chữ, học từ, nghe và chọn game | `letterIndex`, `wordIndex`, tập `explored` trong React | Không |
| `/minigame?letter=A` | Nghe/nhìn từ và chọn một trong ba hình | 3 câu theo chữ bắt đầu, chọn đúng mới sang câu tiếp | Không |
| `/gheptu` | Ghép các chữ thành từ chủ đề bữa sáng | 8 từ, điểm, gợi ý, bộ đếm thời gian trong React | Không |
| `/mohop` | Chọn hình đúng để giải hộp | 12 hộp, số hộp giải, số lần sai trong React | Không |
| `/achivement` | EXP, huy hiệu, lịch học, streak, popup lên cấp | Lọc huy hiệu và chuyển tháng thật; dữ liệu tiến trình mẫu | Không |
| `/bangxephang` | Chọn level/kỳ, podium và bảng thứ hạng | Lọc/sắp xếp mảng người học mẫu | Không |

API duy nhất hiện có là `GET /api/tts?text=...`, phục vụ âm thanh; không ghi kết quả học.

Luồng chính:

```text
Trang chủ → Oxford → Level 1 → Chọn chữ/từ
                                  ↓
                          Hộp chọn trò chơi
                        ↙         ↓         ↘
                  Mini game     Ghép từ     Mở hộp
                  ?letter=...   độc lập     độc lập

Header → Thành tích → Popup mô phỏng lên cấp
Mở trực tiếp /bangxephang → Bảng dữ liệu minh họa
```

Chỉ mini game nhận chữ đang chọn từ hộp chọn trò chơi. Ghép từ và mở hộp không nhận ngữ cảnh chữ/từ. Link quay lại Level 1 không khôi phục chữ đang học. Header hiện không có link tới bảng xếp hạng.

Nguồn: [SiteShell](../../../app/site-shell.tsx), [Home](../../../app/page.tsx), [GameChooser](../../../app/oxford-phonics-world/level-1/game-chooser.tsx), [game-paths](../../../app/oxford-phonics-world/level-1/game-paths.ts).

## 3. Tài khoản Bee và cơ chế phiên

Nguồn chính: [session.ts](../../../app/login/session.ts), hàm `authenticate` dòng 27, `startSession` dòng 35, `getDisplayName` dòng 44; [actions.ts](../../../app/login/actions.ts), `logIn` dòng 11 và `logOut` dòng 30.

### 3.1 Đăng nhập

1. Tên đăng nhập được trim; mật khẩu giữ nguyên.
2. Thiếu trường: trả lỗi `required`. Tên dài hơn 64 hoặc mật khẩu dài hơn 128 ký tự: `invalid`.
3. Tìm tài khoản trong `app/login/accounts.json`, so tên không phân biệt hoa/thường.
4. Tính scrypt với salt của tài khoản; so hash bằng `timingSafeEqual` khi cùng độ dài.
5. Đúng thì tạo phiên với tên đăng nhập chuẩn từ dữ liệu tài khoản, chuyển về `/`.

Tài liệu này không sao chép mật khẩu, salt hay hash tài khoản.

### 3.2 Cookie phiên

- Tên cookie: `bee_session`; thời hạn 7 ngày.
- Payload chứa username mã hóa base64url và mốc hết hạn, được ký HMAC SHA-256. Đây là chữ ký chống sửa token, không phải mã hóa bí mật nội dung token.
- `HttpOnly`, `SameSite=lax`, `path=/`; `Secure` khi production.
- Secret lấy từ `BEE_SESSION_SECRET`; nếu thiếu thì sinh ngẫu nhiên trong tiến trình server. Khởi động lại hoặc nhiều instance có secret khác nhau sẽ làm xác minh phiên không nhất quán.
- `getDisplayName()` xác minh chữ ký/hạn rồi trả tên hiển thị; chưa có API trả định danh người học cho lớp lưu dữ liệu.
- Đăng xuất hết hạn cookie, chuyển về `/login`; không có tiến trình để xóa hoặc lưu kèm.

### 3.3 Quyền truy cập hiện tại

Các page học/game/thành tích/bảng xếp hạng không yêu cầu phiên để mở. Header chỉ thay nút đăng nhập/đăng xuất. Có cookie đăng nhập không tự tạo hồ sơ học tập và không làm các game chia sẻ state.

Khoảng trống cần xử lý khi bổ sung backend: định danh ổn định, kiểm tra phiên tại mọi mutation, kiểm tra chủ sở hữu attempt/reward, chặn dữ liệu của tài khoản này xuất hiện cho tài khoản khác. Không dùng `displayName` làm khóa lưu.

## 4. Giáo trình, bài học và lưu tiến trình hiện tại

### 4.1 Chọn giáo trình/level

- Trang chủ giới thiệu Oxford Phonics 5 level và Let's Go Starter–6; mới có route nội dung Level 1 Oxford.
- `LevelCard` dùng `level.number === 1`, không đọc kết quả học để mở level.
- Nút Level 2–5 có `aria-disabled`, không có handler mở khóa và không có route bài học tương ứng.
- Chuỗi “8 bài học” và số flashcard 32/35/38/40/42 là metadata tĩnh, chưa phản ánh dữ liệu A–Z. Không dùng chúng làm mẫu số tính tiến trình.
- Chưa có flow luyện viết hoặc bài thi tổng hợp dù một số nội dung thành tích/xếp hạng có nhắc tới.

Nguồn: [level-content.ts](../../../app/oxford-phonics-world/level-content.ts), [level-selection.tsx](../../../app/oxford-phonics-world/level-selection.tsx).

### 4.2 Bài học A–Z

Nguồn: [alphabet.json](../../../app/oxford-phonics-world/level-1/alphabet.json), [lesson-content.ts](../../../app/oxford-phonics-world/level-1/lesson-content.ts), [LevelDetail](../../../app/oxford-phonics-world/level-1/level-detail.tsx).

- Hiện có **26 chữ, 101 từ**: 25 chữ có 4 từ/chữ; riêng X có 1 từ và dùng emoji thay ảnh. Không dùng số 92 trong plan cũ làm số liệu hiện tại.
- `alphabet` lấy từ đầu tiên làm `word/emoji/...` đại diện, đồng thời giữ toàn bộ `words` để học trên flashcard.
- Mở trang: `letterIndex=0`, `wordIndex=0`, `explored=new Set([0])`; giao diện đã hiển thị khám phá 1/26 dù chưa tương tác.
- Chọn chữ: thêm index vào tập `explored`, đưa từ về index 0, dừng âm thanh cũ. Bấm trước/sau cũng thêm chữ vào tập này.
- Chọn từ: đổi từ đang hiển thị và phát âm; không lưu từ đã xem/nghe.
- Chọn chữ trên lưới phát “chữ, từ đại diện”; các nút nghe/đọc chậm đọc từ hiện tại. Đọc chậm dùng tốc độ 0,55.
- Không có định nghĩa “đã hoàn thành chữ”, “đã thuộc từ”, “đã hoàn thành bài”, hay thao tác ghi kết quả lên server.
- Đổi ngôn ngữ là state của `SiteShell`, chưa lưu thành tùy chọn tài khoản.

Phải phân biệt: **đã mở chữ** ≠ **đã xem hết từ** ≠ **hoàn thành hoạt động** ≠ **đạt điểm tuyệt đối**.

### 4.3 Âm thanh không phải tiến trình

[useEnglishSpeech](../../../app/use-english-speech.ts) và [API TTS](../../../app/api/tts/route.ts) dùng MP3 Edge TTS cho bài học/mini game; ghép từ/mở hộp dùng [speechSynthesis](../../../app/speak-english.ts) của trình duyệt.

TTS chỉ chấp nhận các câu trong allowlist từ bài học; cache tối đa 100 mục trong bộ nhớ, gộp request cùng câu, tối đa 4 tác vụ sinh âm thanh đang chờ. Cache âm thanh không phải cache tiến trình người học. Request audio thành công cũng chưa chứng minh bé nghe xong hoặc hiểu bài.

## 5. Logic chấm điểm và thưởng trong từng game

### 5.1 Mini game chữ cái

Nguồn: [page.tsx](../../../app/minigame/page.tsx), `GameForLetter` dòng 14; [mini-game.tsx](../../../app/minigame/mini-game.tsx), `AlphabetMiniGame` dòng 18; [getQuestion](../../../app/oxford-phonics-world/level-1/lesson-content.ts), dòng 17.

- Query `letter` được đổi sang chữ hoa; thiếu, sai hoặc là mảng thì về A. Component có key theo chữ bắt đầu nên đổi chữ sẽ reset lượt.
- Mỗi lượt 3 câu. Chữ mục tiêu câu thứ `round` là `(letterIndex + round) % 26`; bắt đầu Z sẽ hỏi Z, A, B.
- Mỗi câu dùng **từ đầu tiên** của chữ mục tiêu, không bao phủ cả 101 từ. Ba lựa chọn được tạo xác định; câu A có distractor Banana riêng.
- Chọn sai: ghi lựa chọn hiện tại, hiện nhắc thử lại; không đếm số lần sai hoặc trừ điểm.
- Chọn đúng: khóa thay đổi đáp án qua guard, hiện lời khen và cho sang câu tiếp.
- Câu cuối chuyển về câu đầu; “Chơi lại” cũng về câu đầu. Không có bản tổng kết, số câu đúng lần đầu hay đánh dấu hoàn tất attempt.
- `+10 Điểm Sao` là nội dung hiển thị; lời khen còn nhắc “1 ngôi sao”. **Không có biến tổng điểm hay lệnh cộng thưởng**, nên chưa thể kết luận +10 áp dụng cho một câu hay một lượt.

### 5.2 Ghép từ

Nguồn: [word-game.tsx](../../../app/gheptu/word-game.tsx), state dòng 25–40, `checkAnswer` dòng 66, `nextRound` dòng 91.

- 8 từ cố định: BREAKFAST, PANCAKE, MILK, EGG, TOAST, APPLE, JUICE, BANANA; độc lập với chữ vừa học.
- Ban đầu `round=0`, `solvedCount=0`, `hints=2`, `seconds=102`.
- Số câu hiển thị `round + 3`, nên lượt đầu là câu 3/10 và lượt cuối 10/10 dù dữ liệu chỉ có 8 câu.
- Điểm hiển thị: `120 + solvedCount * 20`; bắt đầu 120, giải hết 8 từ lên 280. Đây không phải số dư tài khoản.
- Thiếu chữ hoặc ghép sai chỉ hiện feedback; đúng cả từ thì tăng `solvedCount` tới ít nhất `round+1`.
- `earnedPoints = solvedCount <= round` chống nhận lại +20 khi xếp lại cùng từ trong vòng đang chơi. Reset hết vòng hoặc reload mất dấu đã thưởng.
- Gợi ý sửa vị trí sai đầu tiên, mỗi từ có 2 lần; hiện không giảm điểm.
- Nút “Thử ghép đúng ngay” điền đáp án hoàn chỉnh; kiểm tra sau đó vẫn nhận +20 như tự giải.
- Đồng hồ tăng mỗi giây khi chưa đúng, tạm dừng khi đúng, tính tiếp khi xếp lại; hết vòng reset về 102 giây. Không phải thời gian thi đo từ 0.
- Thanh huy hiệu tính `min(10, 7 + solvedCount)`: ban đầu 7/10, không phải thống kê số từ trong ngày.

### 5.3 Mở hộp bí mật

Nguồn: [mystery-box.tsx](../../../app/mohop/mystery-box.tsx), dữ liệu dòng 13–33, state dòng 39–54, `choosePicture` dòng 62, `resetGame` dòng 72.

- 12 câu cố định, xoay quanh Milk, Water, Egg, Juice; chọn hộp tùy ý, không phải xổ thưởng ngẫu nhiên.
- Ban đầu chọn index 6 (hộp 7), `opened=[2]` (hộp 3 đã giải mẫu), `mistakes=0`.
- Điểm: `opened.length * 10`; ngay khi vào có 10 điểm, 1/12 hộp và accuracy 100%.
- Đúng: thêm hộp vào `opened`; hộp đã giải không cho trả lời lại trong cùng state. Sai: cộng một `mistakes`, cho thử lại.
- Tỉ lệ đúng: `round(opened.length / (opened.length + mistakes) * 100)`; có tính hộp giải mẫu. Ban đầu chọn sai một lần sẽ thành 50% dù chưa tự giải hộp nào.
- Gợi ý chỉ bật/tắt nội dung; không giới hạn, không giảm điểm. Có thể đổi hộp khi chưa giải xong.
- Giải đủ hộp có nút chơi lại; reset vẫn giữ hộp 3 đã giải sẵn. Không lưu số hộp, sai số, điểm hoặc thưởng lên tài khoản.

### 5.4 Bảng đối chiếu các loại “điểm” đang thấy

| Nơi hiển thị | Công thức hoặc giá trị | Bản chất |
| --- | --- | --- |
| Trang chủ | “+150 Giọt Mật Học” | Copy quảng bá |
| Mini game | “+10 Điểm Sao”, lời khen 1 sao | Copy thưởng, chưa tính số dư |
| Ghép từ | `120 + 20 × solvedCount` | Điểm cục bộ có nền mẫu |
| Mở hộp | `10 × opened.length` | Điểm cục bộ có hộp mẫu |
| Thành tích | 12.850 EXP, Level 5; 1.450/2.000 | Dữ liệu mẫu, chưa có công thức level |
| Popup lên cấp | +500 EXP, +50 sao | Minh họa, chưa ghi thưởng |
| Xếp hạng | Số câu đúng / mẫu số từng level | Mảng demo, không lấy từ game |

Hiện chưa có quy đổi giữa mật ong, sao, điểm game và EXP.

## 6. Thành tựu, buff EXP, lịch học và nhận thưởng hiện tại

Nguồn: [achievements.tsx](../../../app/achivement/achievements.tsx), `categories` dòng 11, các phép reduce dòng 19–22; [LevelUpModal](../../../app/achivement/level-up-modal.tsx).

### 6.1 Các nhóm huy hiệu

| Nhóm | Số mẫu hiện tại | Các mốc |
| --- | --- | --- |
| Lượt học tích lũy | 128 | 1, 10, 50, 100, 250, 500 |
| Bài đạt 100% | 8 | 1, 3, 5, 10, 25, 50 |
| Tổng ngày học | 45 | 7, 30, 60, 100, 180, 365 |

- Mỗi nhóm có 6 huy hiệu; tổng 18.
- Huy hiệu “đã đạt” khi `current >= target`; với số mẫu là **9/18** huy hiệu.
- Buff từng bậc theo index: 0,5%; 1%; 1,5%; 2%; 2,5%; 3%.
- Cộng tất cả huy hiệu đạt: nhóm lượt học 5% + bài 100% 3% + ngày học 1,5% = **9,5% EXP**.
- Nếu mở hết 18 huy hiệu thì tổng bảng hiện tại là 31,5%. Dòng copy nói không giới hạn tổng, nhưng chưa có engine áp buff vào EXP thật.
- Giao diện nói buff huy hiệu mới có hiệu lực từ bài sau và huy hiệu giữ vĩnh viễn; code chưa có dữ liệu ngày mở khóa hay cơ chế lưu lời hứa này.
- Mô tả lượt học nhắc flashcard, luyện viết, nộp mini game; chưa có event chung cho các thao tác đó và chưa có luyện viết.

### 6.2 Lịch và streak

Lịch khởi tạo tháng 11/2026, tô ngày 4–18, đánh dấu ngày 18 là hôm nay mẫu. Chuyển tháng tính lưới ngày đúng nhưng tháng khác không có hoạt động. Streak 15 ngày, kỷ lục 28 ngày, tổng 45 ngày đều được viết cứng; chưa có quy tắc cắt ngày hay tính chuỗi.

### 6.3 Popup lên cấp và nút nhận thưởng

- `LevelUpModal` tự mở preview sau 1 giây khi mount, không chờ đủ EXP.
- Có thể mở lại bằng nút mô phỏng, phát confetti/âm thanh và xem lại hiệu ứng.
- Nội dung luôn là Level 6, danh hiệu mẫu và phần thưởng +500 EXP/+50 sao.
- Nút “bé nhận thưởng ngay” chỉ gọi `close()`; không có request, giao dịch, số dư mới hoặc đánh dấu đã nhận.
- Bảng mốc perfect tối đa 50 nhưng popup ghi “100 bài học 100%”; buff +2% trong popup cũng không xuất phát từ bảng mốc đó. Cần thay bằng nội dung sinh từ rule, không chuyển copy này thành nghiệp vụ mặc định.

## 7. Bảng xếp hạng hiện tại

Nguồn: [leaderboard.tsx](../../../app/bangxephang/leaderboard.tsx), `levelDetails` dòng 12, `learners` dòng 23, phép lọc/sort dòng 46–50.

- Có 6 học viên mẫu và 2 học viên bổ sung ở kỳ “Tất cả”.
- “Hôm nay” lọc cờ boolean `today`; “Tuần này” giữ 6 dòng; chưa lọc timestamp hoặc tuần lịch thật.
- Sort điểm giảm dần, bằng điểm thì chuỗi thời gian `mm:ss` tăng dần. Chuỗi hiện tại có định dạng đồng nhất nên so sánh được; không dùng cách này cho thời lượng thực không cố định độ dài.
- Điểm tối đa theo level là 17, 20, 20, 24, 25; không trùng số câu mini game là 3 hoặc 26 chữ bài học.
- “Vị trí của bạn” cố định hạng 12, tên Bé Ong Vàng, thời gian 04:12, điểm 12/15/13/16/18 theo level; không tìm người đang đăng nhập trong kết quả.
- `max(0, điểm_hạng_3 - điểm_mẫu_của_mình + 1)` chỉ gợi ý vượt bằng điểm; chưa xét có thể vượt nhờ thời gian, điểm trần hoặc bảng dưới 3 người.
- Chưa có bài thi tổng hợp sinh ra kết quả đủ điều kiện xếp hạng; số người chơi là metadata mẫu.

## 8. Các khoảng trống cần ưu tiên

| Ưu tiên | Khoảng trống | Hệ quả hiện tại |
| --- | --- | --- |
| P0 | Chưa có định danh học viên và lưu trữ bền vững | Đăng nhập rồi vẫn mất tiến trình khi trang khởi tạo lại |
| P0 | Chưa có engine chấm điểm và sổ thưởng server | Không thể thống nhất điểm/EXP hay chống thưởng trùng nhiều tab |
| P0 | Chưa có attempt và lịch sử từng câu | Không tính được 100%, thời gian thật, lần sai/gợi ý |
| P1 | Nền điểm/câu/hộp mẫu trong các game | Người mới được hiển thị thành tích chưa thực hiện |
| P1 | Thành tựu, lịch, streak và level là demo | Không phản ánh dữ liệu Bee |
| P1 | Reward chưa có trạng thái chưa nhận/đã nhận | Đóng popup không có nghĩa là đã nhận thưởng |
| P2 | Thiếu bài thi chuẩn và nguồn kết quả bảng hạng | Điểm các hoạt động khác nhau chưa so sánh công bằng |
| P2 | Chưa có bài Level 2–5 và Let's Go | Không được mở khóa bằng thay đổi một cờ giao diện |

## 9. Hướng triển khai đề xuất và phạm vi

Các mặc định bên dưới được chủ dự án cho triển khai sau khi đọc plan; giới hạn một server và chính sách thưởng lần đầu được giữ trong bản thực hiện.

| Phương án | Ưu điểm | Đánh đổi |
| --- | --- | --- |
| Lưu trình duyệt theo username | Nhanh để thử riêng một máy | Không đồng bộ thiết bị; người dùng sửa được điểm; không phù hợp thưởng/bảng hạng thật |
| Database trên server + giao dịch + sổ thưởng | Nguồn dữ liệu chung, chống nhận trùng, dùng được từ nhiều thiết bị | Cần migration, backup, xác thực mọi thao tác ghi |

**Đề xuất chọn phương án database trên server.** Lộ trình trong plan dùng SQLite qua `node:sqlite` trên Node **26.8.2**, đã kiểm tra có trong môi trường này; không thêm thư viện DB cho MVP. `@types/node` hiện là 20.19.43 và chưa có khai báo `node:sqlite`, nên cần cập nhật dependency kiểu Node tương thích khi thực thi, cùng lockfile. Điều kiện: **một server Node có ổ đĩa bền vững**, file DB nằm ngoài Git và được backup. Không giả định môi trường deploy hiện tại thỏa điều kiện này. Nếu chạy serverless, nhiều replica hoặc ổ đĩa tạm, phải đổi adapter sang database dùng chung trước khi triển khai; không chia sẻ file SQLite qua ổ mạng.

Phạm vi MVP: giữ giáo trình tĩnh, giữ thông tin đăng nhập hiện có, thêm hồ sơ Bee và tiến trình/điểm/thưởng thật cho nội dung đã tồn tại. Không tạo dữ liệu lịch sử giả để khớp số demo. Không triển khai bài Level 2–5, Let's Go, luyện viết, cửa hàng hoặc quy đổi mật ong ở đợt này.

## 10. Định nghĩa dữ liệu và trạng thái đề xuất

### 10.1 Định danh và đơn vị học

- Tài khoản `bee` ánh xạ tới `userId=usr_bee`; username hiện có dùng để tra user, không lấy từ request body để xác định chủ sở hữu.
- ID học liệu độc lập với index: `opw.l1.letter.a`, `opw.l1.word.a.apple`; từ có khoảng trắng dùng slug, không dùng nhãn dịch làm ID.
- Hoạt động: `opw.l1.flashcard.a` (một chữ), `opw.l1.quiz.a` (3 câu bắt đầu A), `opw.l1.scramble.breakfast` (8 từ), `opw.l1.box.breakfast` (12 hộp), `opw.l1.assessment` (26 câu, giai đoạn P2).
- Lưu `contentVersion=1` và `ruleVersion=1`; thay copy không reset tiến trình. Sửa nội dung/chấm điểm cần migration có chủ đích; tăng version không tự cho nhận thưởng lại.
- Giai đoạn đầu cho chọn mọi chữ Level 1. Level 2–5 là `unavailable` vì chưa có nội dung, không phải đã sẵn sàng nhưng bị khóa theo EXP.
- Level tài khoản tính bằng EXP tách biệt cấp độ giáo trình Oxford.

### 10.2 Các bảng và ràng buộc

| Bảng | Nội dung tối thiểu | Unique/ràng buộc quan trọng |
| --- | --- | --- |
| `users` | id, username chuẩn, displayName, createdAt | username duy nhất; không sao chép mật khẩu vào tiến trình |
| `learner_profiles` | userId, totalXp, stars, revision | 1/user; số nguyên không âm |
| `word_progress` | userId, wordId, seenAt, learnedAt | (userId, wordId); learned chỉ tiến lên |
| `word_reviews` | userId, wordId, localDate, reviewedAt | (userId, wordId, localDate); đánh dấu ôn từ trong ngày |
| `resume_positions` | userId, courseId, letterId, wordId, updatedAt | (userId, courseId); server xác thực word thuộc chữ |
| `attempts` | id, userId, activityId, contentVersion, ruleVersion, status, startedAt, completedAt, bonusBpsSnapshot, result | Tối đa 1 `in_progress`/(userId, activityId); kết quả completed bất biến |
| `attempt_questions` | attemptId, questionId, ordinal, targetId, firstAnswerCorrect, solvedAt, hintCount, revealed | (attemptId, questionId); lần trả lời đầu không ghi đè |
| `answer_events` | id, attemptId, questionId, requestId, payloadHash, selectedId, correct, createdAt, responseJson | (userId qua attempt, requestId) duy nhất ở lớp request ledger; lưu mỗi lần thử |
| `mutation_receipts` | userId, requestId, operation, payloadHash, responseJson | (userId, requestId); cùng ID khác payload → conflict |
| `reward_ledger` | id, userId, sourceKey, baseXp, bonusBps, xpDelta, starsDelta, status, createdAt, claimedAt | (userId, sourceKey); pending/claimed; tự động cộng chỉ một lần |
| `user_achievements` | userId, badgeId, unlockedAt, localDate | (userId, badgeId); mở vĩnh viễn |
| `study_days` | userId, localDate | (userId, localDate), múi giờ Asia/Ho_Chi_Minh |
| `daily_completions` | userId, activityId, localDate, perfect | (userId, activityId, localDate); perfect có thể nâng false → true |

Không cần bảng thứ hạng riêng cho MVP: truy vấn kết quả assessment đã hoàn thành, sau đó chọn kết quả tốt nhất từng người. Các giá trị thống kê có thể tính từ bảng gốc; số dư profile được cập nhật cùng giao dịch ledger và có lệnh đối soát.

### 10.3 State và khôi phục

- Word: `unseen → seen → learned`. `seen` khi người dùng chọn flashcard; `learned` khi bấm **Đã học từ này**. Chỉ mở trang không tự hoàn thành A.
- Một chữ hoàn thành khi tất cả wordId thuộc chữ được đánh dấu learned. Báo riêng số chữ đã mở, số từ đã học và số chữ đã hoàn thành.
- Mỗi lần chủ động đánh dấu learned cũng ghi `word_reviews` của ngày hiện tại. Lần đầu hoàn thành chữ ghi một completion của ngày vừa hoàn thành, kể cả các từ được học rải qua nhiều ngày. Ở ngày sau, để tính một lượt ôn chữ, bé phải xác nhận lại toàn bộ từ của chữ trong ngày đó; chỉ mở chữ đã học không tính lượt. `learned` vẫn giữ vĩnh viễn, còn ôn lại không cấp lại thưởng mastery.
- Attempt: `in_progress → completed` hoặc `abandoned`. Tải lại khôi phục attempt đang làm từ server. Bấm bắt đầu lại phải bỏ attempt cũ rồi tạo mới; không xóa lịch sử/reward.
- Một câu chỉ chuyển sang solved một lần; sai vẫn cho thử lại. Hoàn thành game khi tất cả câu của attempt solved.
- Lưu mỗi hành động bền vững bằng request có ID. Chỉ hiện **Đã lưu** khi server xác nhận; lỗi mạng giữ trạng thái chờ và nút thử lại cùng requestId. Không hứa tự đồng bộ offline sau khi đóng trang.
- Resume là vị trí được server nhận cập nhật sau cùng; completed/learned dùng merge tiến lên, không để snapshot cũ làm mất dữ liệu. Nhiều thiết bị vẫn giữ tiến trình đúng dù vị trí resume có thể đổi.
- Logout xóa phiên và dữ liệu cá nhân đang giữ trong UI; không xóa database. Người khác đăng nhập không kế thừa state Bee. Khách được học thử nhưng không ghi điểm/thưởng; MVP không nhập lịch sử khách vào Bee.

## 11. Chấm điểm, EXP và tính ngày học đề xuất

### 11.1 Điểm game và số dư sao

| Hành động đạt điều kiện | Điểm game theo lần đầu tự giải | Sao thưởng lần đầu theo nội dung | EXP cơ bản |
| --- | --- | --- | --- |
| Hoàn thành flashcard một chữ | Không có điểm thi | 0 | 10 |
| Giải đúng một câu quiz | 10 | 10 | 10 |
| Ghép đúng một từ | 20 | 20 | 20 |
| Giải đúng một hộp | 10 | 10 | 10 |
| Hoàn thành assessment | 1/câu đúng lần đầu, tối đa 26 | 0 | 0 |

Các mức trên là **đề xuất v1**: quiz tối đa 30 điểm/lượt, ghép từ 160, mở hộp 120; bỏ điểm nền 120, câu nền 3, tiến trình huy hiệu nền 7 và hộp đã giải sẵn. Sai không trừ sao, vẫn có thể giải lại; điểm game cho câu tự giải thành công, còn độ chính xác lần đầu được lưu riêng.

Phân biệt:

- Điểm lượt chơi được tính lại cho mỗi attempt, không phải số dư để tiêu.
- Sao/EXP của câu chỉ cấp lần đầu tài khoản giải **nội dung đó**, qua `sourceKey=mastery:<canonical-question-id>`; quiz chồng chữ không thưởng lại cùng câu. Flashcard dùng `mastery:<letter-activity-id>`.
- Chơi lại vẫn có phản hồi, kết quả và ngày học, nhưng không farm sao/EXP từ cùng nội dung.
- Giới hạn của chính sách đã triển khai: nội dung hiện có chỉ tạo tối đa **800 EXP cơ bản** và **540 sao mastery** trước buff/thưởng cấp. Ôn lại tăng lượt/ngày/perfect theo chính sách nhưng không tạo EXP mastery mới; không có tiến trình lên cấp vô hạn với học liệu hữu hạn. Nếu muốn thưởng EXP khi ôn mỗi ngày, phải thiết kế quota/rule riêng trước khi đổi chính sách này.
- Dùng gợi ý thông thường vẫn có thể nhận thưởng nội dung; không còn đạt perfect hoặc đủ điều kiện xếp hạng. Nút điền đáp án mẫu đặt `revealed=true`: câu đó 0 điểm game, 0 sao, 0 EXP; lượt khác tự giải vẫn có thể nhận lần đầu.
- Gợi ý ghép từ tối đa 2/câu; các game còn lại ghi nhận hint flag khi có tính năng gợi ý. Mọi hint/reveal phải ghi trên server trước khi trả nội dung trợ giúp.
- “Perfect” khi tất cả câu đúng ngay lần đầu, không hint, không reveal. Trả lời sai rồi sửa đúng không trở thành perfect.

### 11.2 EXP và cấp tài khoản

- Dùng số nguyên basis point: 0,5% = 50 bps. `awardedXp = floor(baseXp × (10000 + bonusBpsSnapshot) / 10000)` cho mỗi nguồn thưởng; không làm tròn nhiều lần ở client.
- Snapshot buff tại lúc bắt đầu attempt; flashcard lấy buff trước giao dịch hoàn thành chữ. Huy hiệu vừa mở không tăng thưởng của chính hoạt động làm nó mở khóa.
- Đề xuất `xpToNext(L) = 100 × L`; tổng EXP tối thiểu cấp L là `50 × L × (L−1)`. Level 1: 0; Level 2: 100; Level 3: 300. EXP chỉ tăng, không reset khi lên cấp.
- Một lần vượt nhiều cấp tạo reward riêng cho từng cấp, không lặp hoặc bỏ cấp.
- Mỗi cấp mới có **50 sao chờ nhận**, không tặng thêm EXP để tránh dây chuyền lên cấp bằng thưởng lên cấp. Bỏ gói +500 EXP minh họa khỏi flow thật.

### 11.3 Lượt học, ngày học và streak

- Một lượt học hợp lệ là hoàn thành một hoạt động flashcard một chữ hoặc toàn bộ game/assessment; không tính mỗi click, audio hoặc câu sai là một lượt.
- Flashcard lần đầu tính khi hoàn thành chữ; các lần ôn ở ngày sau chỉ tính khi đã xác nhận lại mọi từ trong chữ ngày đó, theo phần 10.3. Không lấy `learnedAt` cũ làm bằng chứng hoạt động mới.
- Cùng user + activity + ngày chỉ tăng lượt học một lần. Nếu sau đó làm lại perfect trong cùng ngày, nâng cờ perfect mà không tăng lượt học lần nữa.
- Tổng perfect đếm các `daily_completions.perfect=true` của game/assessment; flashcard không có bài chấm điểm nên không tính perfect. Cùng bài perfect ở ngày khác được tính thêm một bài theo chính sách đề xuất này.
- Hoạt động có reveal không tăng lượt học, ngày học hoặc perfect. Hoạt động có hint nhưng không reveal vẫn tính lượt/ngày.
- Timestamps dùng giờ server UTC; ngày học tính ở `Asia/Ho_Chi_Minh`, không theo clock trình duyệt.
- Tổng ngày học = số ngày riêng biệt có completion hợp lệ. Nhiều bài cùng ngày không cộng thêm ngày.
- Current streak là chuỗi liên tiếp kết thúc hôm nay; nếu chưa học hôm nay nhưng đã học hôm qua thì giữ chuỗi đến hôm qua. Nếu lần học cuối trước hôm qua thì current streak = 0.
- Longest streak là chuỗi dài nhất trong tập ngày học, không giảm khi đứt chuỗi. Lịch lấy đúng các ngày có dữ liệu của tháng yêu cầu.

## 12. Huy hiệu và giao dịch nhận thưởng đề xuất

Giữ 3 nhóm và 18 mốc đang có, mỗi bậc buff `50 × (index+1)` bps. Các mốc lượt học/ngày/perfect được tính theo phần 11; không gắn với dữ liệu demo 128/8/45.

```text
Hành động người học
  → kiểm tra phiên, chủ attempt, nội dung và requestId
  → BEGIN IMMEDIATE
  → ghi answer/progress; nếu trùng thì trả kết quả đã lưu
  → cấp thưởng mastery chưa có; cập nhật profile
  → nếu hoạt động hoàn thành: ghi daily completion và study day
  → mở huy hiệu mới, tạo reward lên cấp nếu có
  → ghi receipt và revision
  → COMMIT → trả snapshot mới
```

- Thưởng mastery tự cộng trong giao dịch trả lời/hoàn thành; không bắt bé bấm nhận từng câu.
- Reward lên cấp có `pending → claimed`. Bấm **Nhận thưởng** gửi rewardId; server tự xác định user và số sao, không nhận số tiền từ client.
- Claim phải kiểm tra chủ sở hữu; unique ledger + giao dịch bảo đảm bấm đôi, reload, timeout rồi retry hoặc hai tab cùng nhận vẫn chỉ cộng một lần.
- Đóng popup không claim và không mất pending reward. Có danh sách thưởng chưa nhận để mở lại.
- Xem lại hiệu ứng không tạo reward. Popup tự mở chỉ khi có sự kiện mới chưa xem; lưu receipt `celebration:<rewardId>` tách với claim. GET/render không thay đổi trạng thái thưởng.
- Mở huy hiệu là tự động, buff không phụ thuộc việc xem popup. Một huy hiệu không được tự cấp nhiều lần khi tải lại.
- Profile, ledger, completion, badge và receipt commit cùng nhau; lỗi giữa chừng rollback tất cả. Đối soát số dư: tổng delta của ledger `claimed` bằng profile; pending chưa vào số dư.

Giới hạn: server chấm theo đáp án chuẩn và dữ liệu đã nhận; điều đó không chứng minh người học không tra cứu câu trả lời vốn có trong học liệu công khai. MVP chống sửa tổng điểm/nhận thưởng trùng, không tuyên bố chống mọi hình thức gian lận thi cử.

## 13. Assessment và bảng xếp hạng thật đề xuất — P2

- Thêm assessment Level 1 riêng, 26 câu theo từ đại diện A–Z, version 1; không dùng điểm sao/EXP tích lũy để xếp hạng.
- Mỗi câu chỉ trả lời một lần; đúng được 1, sai được 0, vẫn sang câu tiếp. Hoàn tất đủ 26 câu thì đóng attempt; không cần sửa mọi câu sai thành đúng như mode luyện tập.
- Không hint/reveal, không thưởng mastery trong assessment; vẫn tính một lượt/ngày và perfect khi 26/26.
- Đo `durationMs=completedAt−startedAt` từ server, bắt đầu 0; rời trang vẫn tính thời gian. Không tin `duration` client gửi.
- Hôm nay theo ngày Việt Nam; tuần bắt đầu thứ Hai 00:00 Việt Nam; khoảng `[start, end)`, lọc theo `completedAt`. Mỗi kỳ chọn kết quả tốt nhất của từng user **trong kỳ**, không lấy best all-time rồi lọc sau.
- Thứ tự: score giảm, durationMs tăng, completedAt tăng, userId tăng để ổn định khi hòa hoàn toàn. Hạng thứ tự 1, 2, 3… theo comparator này.
- Chỉ hiện Level 1 có assessment; Level 2–5 hiện chưa có dữ liệu/bài thi, không mượn kết quả Level 1.
- Vị trí Bee lấy từ cùng truy vấn, không ghi cứng; không có kết quả thì hiển thị chưa tham gia.
- Xử lý bảng có 0/1/2 người. Không hiện số điểm cần vượt hạng ba nếu không đủ người; nếu bằng điểm thì chỉ gợi ý cải thiện thời gian, nếu đã đạt điểm trần thì không gợi ý điểm vượt trần.

## 14. Ràng buộc Next.js và ranh giới triển khai

Đã đọc tài liệu trong bản Next.js được cài cùng repo, thay vì giả định API theo phiên bản khác:

- `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`.
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.
- `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`.
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md`.

Yêu cầu cho plan:

- Giữ Next.js **16.4.6**, React **19.3.0**, TypeScript, CSS Modules; không nâng framework trong đợt làm tiến trình.
- Với `cacheComponents: true`, đặt phần đọc cookie/database cá nhân trong Server Component nằm sau `Suspense`; giữ shell tĩnh và không bọc dữ liệu Bee vào cache dùng chung.
- `cookies()` là async. Kiểm tra xác thực/quyền tại lớp service và mọi mutation; header đăng nhập không phải cơ chế bảo vệ.
- Client gửi ID hành động/đáp án, không gửi tổng điểm, buff, userId hoặc số dư làm nguồn tin cậy.
- Các mutation dùng Route Handler POST cùng origin, JSON, kiểm tra Origin và session. GET là read-only, phản hồi dữ liệu cá nhân `Cache-Control: private, no-store`.
- DB dùng Node runtime. Không gọi network hoặc await công việc khác bên trong transaction SQLite đồng bộ; không mở DB khi import module trong lúc build. Các test dùng file DB tạm riêng.
- Thực hiện toàn bộ ghi dữ liệu trước khi trả UI đã nhận thưởng; lỗi mạng không được hiển thị claim thành công.

## 15. Tiêu chí nghiệm thu và giới hạn lần rà soát

### 15.1 Các tình huống phải đạt khi triển khai

1. Bee học một phần rồi reload/đăng nhập lại/đổi thiết bị: khôi phục các từ đã học, vị trí và attempt; logout không mất dữ liệu.
2. Tài khoản khác và khách không đọc/ghi được tiến trình hoặc claim reward của Bee.
3. Hai request đồng thời giải cùng câu hoặc claim cùng reward chỉ có một delta thưởng; cùng requestId khác payload bị từ chối.
4. Sai rồi đúng vẫn hoàn thành luyện tập nhưng không perfect; hint/reveal có hiệu lực đúng chính sách; điểm ban đầu là 0.
5. Các lượt quiz chồng chữ A/B không cấp lại mastery của câu B; chơi lại không tạo thêm sao/EXP cùng nội dung.
6. Ngày học, streak và kỳ bảng hạng đúng ở 23:59/00:00 Việt Nam và ranh giới tuần/tháng/năm.
7. Tăng buff áp dụng từ attempt kế tiếp; vượt nhiều cấp tạo đủ pending reward; đóng/xem lại popup không cộng sao.
8. Badge, calendar, EXP, điểm game, bảng hạng và profile lấy từ cùng dữ liệu; không còn gán số demo cho Bee.
9. Tắt/mất mạng giữa lưu/claim phải retry được, không nhân đôi dữ liệu; rollback không để lệch profile và ledger.
10. Production build qua với Cache Components; nội dung 26 chữ/101 từ, audio và chuyển ngôn ngữ vẫn dùng được.

### 15.2 Bằng chứng ở lần phân tích ban đầu

- Liệt kê 9 `page.tsx`, 1 `route.ts`; đọc toàn bộ các module có logic học/game/auth/thành tích/xếp hạng.
- Chạy module `getQuestion` hiện có qua TypeScript transpilation trong bộ nhớ: 78 tổ hợp 26 chữ × 3 câu đều có 3 lựa chọn khác nhau và đúng một target; Z đi qua Z/A/B.
- Đếm trực tiếp JSON hiện tại: 26 chữ, 101 từ; tính lại công thức badge mẫu: 9/18 và 9,5%.
- `node --test tests/auth-actions.test.mjs`: 4/4 test qua. Các test này mock session, không chứng minh mọi khía cạnh bảo mật cookie.
- Kiểm tra Node v26.8.2 nạp được `node:sqlite` và truy vấn database in-memory; chưa tạo database tiến trình thật.
- Review độc lập đã phát hiện khoảng trống về cách tính lượt ôn flashcard ngày sau; thiết kế đã bổ sung `word_reviews` và điều kiện xác nhận lại đủ từ, tách khỏi thưởng mastery.
- Chưa chạy phiên học tương tác trong trình duyệt, chưa chạy HTTP auth test cần production build, chưa kiểm chứng dữ liệu deploy. Nhận xét hành vi UI dựa trên code, không phải báo cáo E2E.

### 15.3 Những lựa chọn được dùng khi thực thi plan

- Mô hình deploy có phù hợp một server Node/ổ đĩa bền vững hay cần adapter database dùng chung.
- Chính sách sao/EXP lần đầu theo nội dung; các mức 10/20, đường cong cấp `100 × L`, thưởng 50 sao/cấp.
- Cách tính lượt/perfect theo hoạt động trong ngày; hoàn thành flashcard bằng đánh dấu chủ động; học thử không nhập lịch sử vào Bee.
- Assessment 26 câu chỉ là phiên bản đầu cho bảng hạng; mở rộng học liệu để quiz kiểm tra toàn bộ 101 từ là đợt sau.

Người dùng đã cho triển khai các mặc định trên. Kết quả thực hiện, kiểm thử và giới hạn vận hành được ghi ở cuối plan đi kèm; dữ liệu QA được giữ tách biệt với database thật.

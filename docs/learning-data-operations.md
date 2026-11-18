# Vận hành dữ liệu học tập Bee

Triển khai này dành cho **một server Node có ổ đĩa bền vững**, dùng SQLite qua `node:sqlite`. Runtime được kiểm chứng: Node 26.8.2. Không dùng file DB trên ổ mạng, serverless có đĩa tạm hoặc nhiều replica; cần adapter database dùng chung trước khi chạy các mô hình đó.

## Chạy local

`npm run dev` dùng `.data/learning.sqlite` nếu không đặt `BEE_DATABASE_PATH`. Lần truy cập có xác thực đầu tiên sẽ khởi tạo schema/profile; không tạo điểm hoặc lịch sử mẫu. Dữ liệu và file WAL/SHM đã nằm trong `.gitignore`.

Đặt `BEE_SESSION_SECRET` trong môi trường local nếu cần giữ phiên qua lần khởi động lại. Không đặt secret vào source code hoặc gửi nó trong chat/log. Khi không đặt, phiên dùng secret tạm như trước; tiến trình học vẫn nằm trong DB sau khi đăng nhập lại.

## Production

Trước `npm start`, đặt:

- `BEE_DATABASE_PATH`: đường dẫn tuyệt đối trên ổ bền vững, ví dụ ổ dữ liệu của server; tài khoản chạy app có quyền đọc/ghi cả thư mục để SQLite tạo WAL/SHM.
- `BEE_SESSION_SECRET`: secret ngẫu nhiên riêng, giữ cố định qua restart, nạp từ secret manager hoặc môi trường được bảo vệ.
- Các biến TTS/Python theo README nếu cần phát MP3 bài học.

Ứng dụng từ chối mở kho tiến trình production khi thiếu hai biến đầu, không tự chuyển sang kho tạm. Build không cần mở DB. Có thể chạy `npm run db:migrate` với đường dẫn đã cấu hình trước khi bật server; migration hiện tại là schema version 1, chạy lại không xóa dữ liệu. `app/learning/schema.sql` được đưa vào file tracing của Next.

Không sửa `learner_profiles` bằng tay để tặng sao/EXP; số dư phải khớp tổng `reward_ledger` có trạng thái `claimed`. Auth vẫn dùng tài khoản sẵn có trong `app/login/accounts.json`; đây không phải flow đăng ký mới.

## Backup và phục hồi

1. Đặt `BEE_DATABASE_PATH` trỏ đúng database cần sao lưu.
2. Chạy `npm run db:backup -- --output <đường-dẫn-file-mới.sqlite>`.
3. Lệnh dùng SQLite backup API, bao gồm dữ liệu WAL đang hoạt động; không copy riêng file `.sqlite` trong lúc app đang ghi. Lệnh từ chối ghi đè file backup đã tồn tại.
4. Chạy `db:reconcile` trên bản backup bằng cách trỏ biến đường dẫn sang file backup; giữ nguyên secret/session server hiện tại.

Để phục hồi: dừng app, giữ bản DB hiện tại làm bản dự phòng, trỏ `BEE_DATABASE_PATH` sang file đã khôi phục, chạy reconcile rồi mở server. Không chép file chính đè lên database có WAL/SHM đang mở. Thử phục hồi trong một thư mục tách biệt trước khi thay dữ liệu thật.

Tần suất backup tùy mức mất dữ liệu chấp nhận được; bắt buộc backup trước migration tương lai hoặc thao tác quản trị. File chứa lịch sử học, chỉ người vận hành được phép truy cập.

## Đối soát

`npm run db:reconcile` là lệnh **chỉ đọc**. Kết quả `ok=true` nghĩa là:

- Tổng EXP/sao của profile bằng tổng delta ledger đã claim; reward pending chưa vào số dư.
- Không có vi phạm foreign key và SQLite integrity check thành công.

Nếu có lệch, lệnh trả exit code 1 và thông tin ID/giá trị cần kiểm tra; không tự sửa/xóa lịch sử. Giữ bản backup và tìm giao dịch gây lệch trước khi xử lý.

## Hành vi cần biết

- Mỗi câu/nội dung chỉ cấp thưởng mastery một lần; chơi lại có thể tính lượt/ngày/perfect nhưng không farm sao/EXP. EXP hữu hạn theo học liệu hiện có.
- Cấp tài khoản tách khỏi cấp giáo trình. Level 2–5 Oxford chưa có bài học, không được mở bằng EXP.
- Buff huy hiệu snapshot lúc bắt đầu attempt; huy hiệu mới tác động từ attempt tiếp theo. EXP làm tròn xuống mỗi nguồn thưởng.
- Lần đầu hoàn thành flashcard có thể qua nhiều ngày; ôn chữ ngày sau phải xác nhận lại mọi từ mới tính thêm lượt. Nghe/xem riêng không tự tính ngày học.
- Ngày học và kỳ bảng hạng dùng Asia/Ho_Chi_Minh; assessment tính thời gian cả lúc rời trang.
- Đóng popup không nhận thưởng, reward lên cấp pending vẫn còn trong trang thành tựu. Bấm nhận/retry nhiều lần chỉ cộng một lần.
- Retry lỗi mạng chỉ được giữ trong tab đang mở, không có hàng đợi offline bền vững. Sau reload, đọc tiến trình/attempt từ server để biết thao tác đã commit hay chưa.
- Khách học thử không lưu dữ liệu hoặc nhập lịch sử vào tài khoản khi đăng nhập.
- Các request ghi có Origin/session/actor header và receipt. Nội dung học công khai; hệ thống không chứng minh bé không tra cứu đáp án.

## Kiểm tra sau thay đổi

```powershell
npm run lint
npm run build
npm test
git diff --check
```

Các test HTTP tự mở production server ở port ngẫu nhiên, dùng secret và DB tạm riêng; không dùng mật khẩu hay database thật của Bee. Chạy build trước test HTTP. Không chạy hai build đồng thời vào cùng `.next`.

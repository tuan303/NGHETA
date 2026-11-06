# Nâng Cấp Cơ Chế Lưu Trữ & Chống Mất Dữ Liệu File Nghe (NSHM)

Kế hoạch này giải quyết triệt để tình trạng link file nghe bị mất sau khi lưu, tải lại trang hoặc bị trắng toàn bộ dữ liệu sau một thời gian sử dụng, đồng thời bổ sung hệ thống cảnh báo thay đổi chưa lưu và lịch sử sao lưu dự phòng tự động.

## User Review & Critical Decisions

> [!IMPORTANT]
> Dưới đây là các quyết định thiết kế đã được xác nhận dựa trên phản hồi của bạn:

- **Chặn tuyệt đối việc tự động reset về dữ liệu trắng mặc định**: Loại bỏ hoàn toàn lệnh tự động ghi đè `DEFAULT_GRADES` lên Firebase khi `onSnapshot` không tìm thấy tài liệu hoặc khi đọc từ bộ nhớ đệm lúc mạng yếu. Chỉ khởi tạo mặc định trên giao diện tạm thời nếu hoàn toàn chưa có dữ liệu từ cả máy chủ lẫn bộ nhớ máy.
- **Đảm bảo đồng bộ thực tế lên máy chủ (Server-Verified Save)**: Khi bấm **Lưu thay đổi**, hệ thống sẽ ghi trực tiếp lên Firebase trước và xác nhận máy chủ đã nhận thành công rồi mới cập nhật trạng thái đã lưu. Không cập nhật `localStorage` trước khi máy chủ xác nhận để tránh hiện tượng "báo lưu thành công ảo trên máy hiện tại nhưng tải lại trang hoặc sang máy khác thì mất".
- **Giữ nút Lưu thay đổi kèm cảnh báo khi thoát**: Theo dõi mọi thay đổi trong trang Quản trị; nếu người dùng bấm **Quay lại** hoặc đóng/tải lại trình duyệt khi chưa bấm **Lưu thay đổi**, hệ thống sẽ hiển thị hộp thoại xác nhận rõ ràng.
- **Tự động sao lưu dự phòng & Khôi phục phiên bản cũ**: Mỗi lần lưu thành công (hoặc trước khi ghi đè thay đổi mới), hệ thống tự động lưu lại bản chụp (snapshot) vào lịch sử dự phòng (trên cả Firebase và máy cục bộ), cho phép quản trị viên xem lại và khôi phục bất kỳ bản lưu trước đó chỉ với 1 cú nhấp chuột.

---

## 1. Overview & Core Concept

- **Mục tiêu cốt lõi**: Đảm bảo mọi đường dẫn (link) âm thanh do quản trị viên nhập vào đều được lưu trữ an toàn, nhất quán giữa mọi thiết bị và không bao giờ bị hệ thống tự động xóa trắng do sự cố mạng hoặc xung đột trạng thái.
- **Đối tượng sử dụng**: Giáo viên và cán bộ quản trị hệ thống nghe Tiếng Anh trực tuyến NSHM (Tiểu học, THCS, THPT).
- **Giá trị mang lại**:
  - Xóa bỏ rủi ro mất trắng dữ liệu toàn bộ 12 khối khi mạng chập chờn.
  - Phát hiện và thông báo chính xác nếu kết nối Firebase hoặc quyền ghi (Rules) gặp sự cố thay vì âm thầm mất dữ liệu khi tải lại trang.
  - Có thể khôi phục ngay lập tức danh sách link cũ nếu lỡ tay xóa nhầm hoặc ghi đè nhầm.

---

## 2. User Experience & Visual Design

- **Luồng trải nghiệm chính (Key User Flows)**:
  1. **Nhập & Chỉnh sửa Link**: Khi quản trị viên thêm/sửa/xóa tiêu đề hoặc link file nghe, thanh công cụ phía trên hiển thị trạng thái **"Có thay đổi chưa lưu"** cùng nút **Lưu thay đổi** nổi bật.
  2. **Lưu & Xác thực Máy chủ**: Khi bấm **Lưu thay đổi**, hệ thống đồng bộ dữ liệu đã làm sạch (loại bỏ khoảng trắng thừa ở đầu/cuối link, đồng bộ trường dữ liệu) lên Firebase và tự động tạo 1 bản sao lưu dự phòng. Khi hoàn tất, thông báo xác nhận đã lưu lên máy chủ xuất hiện.
  3. **Bảo vệ khi thoát (Unsaved Changes Guard)**: Nếu quản trị viên có thay đổi chưa lưu mà bấm nút **Quay lại** (hoặc đóng tab trình duyệt), một hộp thoại cảnh báo sẽ xuất hiện với 3 lựa chọn: **Lưu và Thoát**, **Thoát không lưu**, hoặc **Ở lại chỉnh sửa**.
  4. **Khôi phục bản sao lưu (Backup & Restore)**: Quản trị viên có thể bấm nút **Lịch sử sao lưu** ngay trên thanh tiêu đề Quản trị để xem danh sách các phiên bản đã lưu trước đó (kèm thời gian và số lượng link có sẵn) và bấm **Khôi phục** khi cần.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Giữ nguyên bản sắc giao diện trường Ngôi Sao Hoàng Mai hiện có ở trang học sinh/giáo viên, đồng thời tinh chỉnh trang Quản trị theo phong cách bảng điều khiển hiện đại, rõ ràng, dễ kiểm soát trạng thái.
  - *Color Palette & Mood*: Nền trung tính sáng (`#F8FAFC`), bề mặt thẻ trắng (`#FFFFFF`) với đường viền mảnh (`#E2E8F0`). Nhấn màu xanh dương (`#2563EB`) cho thao tác lưu chính, màu cam hổ phách (`#D97706`) cho cảnh báo thay đổi chưa lưu, màu xanh lá (`#16A34A`) cho trạng thái đã đồng bộ máy chủ, và màu đỏ (`#DC2626`) cho cảnh báo lỗi/xóa.
  - *Typography & Hierarchy*: Phân cấp rõ ràng giữa tiêu đề cấp học, tên khối và các ô nhập liệu; sử dụng kiểu số đồng nhất (`tabular-nums`) cho thời gian bản sao lưu và số lượng file nghe.
- **Interactive Feedback & Motion**:
  - Hiển thị rõ số lượng link hợp lệ đang có trong từng khối để quản trị viên dễ dàng kiểm tra nhanh.
  - Thay thế hộp thoại `window.alert` mặc định của trình duyệt bằng hộp thoại thông báo trực quan ngay trong giao diện (tương thích hoàn hảo khi chạy trên cả tên miền riêng lẫn khung nhúng).

---

## 3. Key Product Decisions & Trade-Offs

- **Quyết định 1: Loại bỏ lệnh tự động ghi `DEFAULT_GRADES` trong `onSnapshot`**
  - *Giải pháp chọn*: Khi `docSnap.exists()` trả về `false` hoặc khi dữ liệu đang đọc từ bộ nhớ đệm离线 (`fromCache`), hệ thống tuyệt đối **không** gọi `setDoc(DEFAULT_GRADES)`. Thay vào đó, hệ thống kiểm tra dữ liệu dự phòng hoặc giữ nguyên dữ liệu hiện có, chỉ ghi lên Firebase khi quản trị viên chủ động bấm **Lưu thay đổi**.
  - *Lý do*: Đây là thủ phạm chính khiến sau một thời gian sử dụng, chỉ cần một trình duyệt bất kỳ mở trang lúc mạng chập chờn là toàn bộ cơ sở dữ liệu bị ghi đè thành danh sách rỗng mặc định.
- **Quyết định 2: Đồng bộ hóa cấu trúc dữ liệu (`audios` và trường tương thích ngược)**
  - *Giải pháp chọn*: Khi lưu, hệ thống chuẩn hóa mảng `audios` (tự động cắt khoảng trắng thừa `.trim()` ở link audio) và cập nhật luôn `title` / `audioUrl` của khối theo phần tử đầu tiên trong `audios`. Khi đọc dữ liệu về, ưu tiên tuyệt đối mảng `audios` đã lưu.
  - *Lý do*: Tránh trường hợp dữ liệu cũ (`audioUrl: ""`) ghi đè ngược lại làm mất link mới.
- **Quyết định 3: Cơ chế Sao lưu Kép (Firebase + Local Backup History)**
  - *Giải pháp chọn*: Lưu tối đa 15 bản sao lưu gần nhất có chứa link hợp lệ vào cả tài liệu dự phòng trên Firebase lẫn bộ nhớ trình duyệt (`localStorage`), kèm chức năng xuất/nhập nhanh hoặc khôi phục trực tiếp trên giao diện.
  - *Lý do*: Đảm bảo dù có sự cố thao tác nhầm từ người dùng khác hoặc lỗi mạng, quản trị viên luôn lấy lại được danh sách link đã nhập chỉ trong vài giây.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        KẾT NỐI DỮ LIỆU (FIRESTORE)                      │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐  │
│  │ Tài liệu chính:               │   │ Tài liệu sao lưu tự động:     │  │
│  │ settings / grades             │   │ settings / grades_backups     │  │
│  └───────────────┬───────────────┘   └───────────────▲───────────────┘  │
└──────────────────┼───────────────────────────────────┼──────────────────┘
                   │ Đồng bộ thời gian thực            │ Lưu bản chụp
                   ▼ (Chặn tự động ghi đè rỗng)        │ mỗi khi cập nhật
┌──────────────────────────────────────────────────────┴──────────────────┐
│                         TRẠNG THÁI ỨNG DỤNG CHÍNH                       │
│  - Kiểm tra kết nối máy chủ thực tế (Server Sync Verification)          │
│  - Chuẩn hóa dữ liệu 12 khối & lưu lịch sử dự phòng cục bộ              │
└──────────────────┬───────────────────────────────────┬──────────────────┘
                   │                                   │
                   ▼                                   ▼
┌──────────────────────────────────┐ ┌────────────────────────────────────┐
│        GIAO DIỆN HỌC SINH        │ │        GIAO DIỆN QUẢN TRỊ          │
│  - Chọn cấp học (Tiểu học/THCS/  │ │  - Theo dõi thay đổi chưa lưu      │
│    THPT) & chọn Khối             │ │  - Cảnh báo khi bấm Quay lại/Đóng  │
│  - Phát trực tiếp danh sách      │ │  - Hộp thoại Lịch sử & Khôi phục   │
│    file nghe hợp lệ của khối     │ │  - Thông báo lỗi/thành công rõ ràng│
└──────────────────────────────────┘ └────────────────────────────────────┘
```

### Data Model & State

- **`Grade` & `AudioItem`**:
  - Mỗi khối (`id: 1..12`) chứa danh sách `audios: AudioItem[]` (`id`, `title`, `url`) và trường `updatedAt` để nhận biết thời điểm cập nhật mới nhất.
  - Khi lưu, nếu một khối có tất cả các dòng bị xóa trắng, hệ thống giữ lại 1 dòng trống mặc định để hiển thị ô nhập nhưng không bao giờ lấy lại dữ liệu rác cũ.
- **`BackupEntry` (Bản sao lưu dự phòng)**:
  - `id`: Mã định danh bản sao lưu.
  - `timestamp`: Thời gian tạo bản sao lưu (hiển thị định dạng Ngày/Tháng/Năm Giờ:Phút:Giây).
  - `totalLinks`: Tổng số link file nghe có trong bản sao lưu đó.
  - `grades`: Toàn bộ dữ liệu 12 khối tại thời điểm sao lưu.

### Interactive Component & State Mapping

- **Bảo vệ dữ liệu khi khởi động & lắng nghe (`onSnapshot`)**:
  - Phân biệt dữ liệu từ máy chủ và dữ liệu tạm từ cache.
  - Nếu tài liệu trên Firebase chứa danh sách có link hợp lệ, tự động lưu một bản vào lịch sử dự phòng an toàn (`english_audio_backups`) để không bao giờ mất dấu các link đã từng hoạt động.
- **Theo dõi thay đổi trong Quản trị (`isDirty` state)**:
  - So sánh dữ liệu đang chỉnh sửa trên màn hình Quản trị với dữ liệu gốc từ máy chủ.
  - Khi `isDirty = true`:
    - Hiển thị nhãn nhắc nhở **"Chưa lưu thay đổi"** cạnh nút Lưu.
    - Kích hoạt sự kiện `beforeunload` của trình duyệt để ngăn đóng/tải lại trang vô tình.
    - Chặn nút **Quay lại** và mở hộp thoại xác nhận (**Lưu và thoát** / **Bỏ thay đổi** / **Hủy**).
- **Quy trình Lưu an toàn (`handleSave`)**:
  - Bước 1: Chuẩn hóa dữ liệu (`.trim()` toàn bộ URL và tiêu đề).
  - Bước 2: Ghi dữ liệu lên Firestore (`settings/grades`) và kiểm tra phản hồi thực tế từ máy chủ.
  - Bước 3: Lưu thêm bản chụp vào danh sách lịch sử sao lưu (`settings/grades_backups` và `localStorage`).
  - Bước 4: Đánh dấu `isDirty = false` và hiển thị thông báo thành công. Nếu ghi lên máy chủ thất bại (do mất mạng hoặc chặn quyền), giữ nguyên trạng thái `isDirty = true` và hiển thị hộp thoại báo lỗi chi tiết ngay trên màn hình để người dùng không bị lầm tưởng là đã lưu.

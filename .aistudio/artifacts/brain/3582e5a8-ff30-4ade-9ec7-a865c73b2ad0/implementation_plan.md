# Nâng Cấp Hiển Thị Tiêu Đề Bài Nghe Nổi Bật (NSHM)

Cập nhật giao diện dòng tiêu đề bài nghe (ví dụ: `26.27 – 10IE - ĐGNL`) trên màn hình chọn bài nghe của giáo viên/học sinh để chữ to rõ, sắc nét và có độ tương phản cao trên nền kính mờ.

## User Review & Critical Decisions

> [!IMPORTANT]
> Các lựa chọn thiết kế đã được xác nhận theo yêu cầu của bạn:

- **Phong cách hiển thị tương phản cao**: Sử dụng **chữ đỏ đậm (`#DC2626`) đặt trên nền khung trắng (`#FFFFFF`) bo góc** kèm viền tinh tế và đổ bóng nổi khối, giúp tách biệt hoàn toàn khỏi lớp nền ảnh trường học phía sau.
- **Cỡ chữ & Độ đậm**: Tăng kích thước chữ lên mức **24px trên thiết bị di động (`text-2xl`) và 28px trên máy tính (`md:text-[28px]`)**, kết hợp kiểu chữ **in đậm (`font-extrabold`)** cân đối hài hòa với nút chọn khối (`KHỐI 10`).

---

## 1. Overview & Core Concept

- **Mục tiêu**: Giải quyết tình trạng chữ tiêu đề màu đỏ nằm trực tiếp trên nền kính mờ xanh/xám khiến chữ bị chìm và khó đọc từ khoảng cách xa (đặc biệt khi trình chiếu trên màn hình tương tác hoặc máy chiếu trên lớp).
- **Đối tượng sử dụng**: Giáo viên coi thi / giảng dạy thao tác chọn bài nghe trên lớp học.
- **Giá trị mang lại**: Giúp giáo viên nhận diện chính xác tên đề nghe / mã bài nghe ngay lập tức, tránh nhầm lẫn giữa các ca thi hoặc các chương trình học.

---

## 2. User Experience & Visual Design

- **Visual Identity & Theme**:
  - *Màu sắc & Nền*: Khung nền trắng sáng (`bg-white/95`) với viền đỏ nhạt/vàng kim tinh tế (`border-2 border-red-100`) và bóng đổ (`shadow-md`), bên trong là chữ đỏ tươi đậm (`text-red-600`).
  - *Typography & Hierarchy*:
    - Cỡ chữ: `text-2xl md:text-[28px]` (`24px` – `28px`), độ dày `font-extrabold`, giãn chữ nhẹ (`tracking-wide`) và chiều cao dòng thoáng (`leading-snug`).
    - Căn giữa toàn bộ nội dung trong khung tiêu đề với khoảng đệm rộng rãi (`px-6 py-2.5 rounded-xl`), đồng bộ chiều rộng và nhịp điệu thị giác với khung trình phát âm thanh màu cam bên dưới.
- **Interactive Feedback & Motion**:
  - Giữ hiệu ứng chuyển cảnh mượt mà khi chuyển đổi giữa các khối lớp và danh sách bài nghe.

---

## 3. Key Product Decisions & Trade-Offs

- **Quyết định: Đặt tiêu đề bài nghe trong khung trắng bo góc (`rounded-xl`) đồng bộ với khung máy phát nhạc**
  - *Giải pháp chọn*: Thay vì chỉ tăng cỡ chữ đỏ trên nền trong suốt, việc bổ sung lớp nền trắng `bg-white/95` bo góc giúp tỷ lệ tương phản đạt chuẩn cao nhất (trên 7:1) bất kể ảnh nền phía sau là vùng cây xanh tối hay bầu trời sáng.
  - *Lý do*: Đảm bảo khả năng quan sát rõ ràng từ xa trên màn hình tivi/máy chiếu tại phòng học.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     KHUNG CHỌN KHỐI & BÀI NGHE                  │
│                                                                 │
│              ┌───────────────────────────────────┐              │
│              │        KHỐI 10  (Dropdown)        │              │
│              └───────────────────────────────────┘              │
│                                │                                │
│                                ▼                                │
│       ┌─────────────────────────────────────────────────┐       │
│       │  Khung nền trắng bo góc (bg-white/95 shadow-md) │       │
│       │       26.27 – 10IE - ĐGNL (Chữ đỏ đậm 28px)     │       │
│       └─────────────────────────────────────────────────┘       │
│                                │                                │
│                                ▼                                │
│       ┌─────────────────────────────────────────────────┐       │
│       │   [ ▶  0:00 / 27:37  ───────────────  🔊  ⋮ ]   │       │
│       └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- Giữ nguyên cấu trúc dữ liệu `Grade` và `AudioItem` hiện có, chỉ nâng cấp phần trình bày hiển thị (`<h3>` container) của từng mục âm thanh trong giao diện người dùng.

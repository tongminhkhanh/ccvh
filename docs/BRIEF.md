# 💡 BRIEF: Hệ thống Quản lý Tiền ăn & Điểm danh (Mở rộng)

**Ngày tạo:** 2026-03-15
**Brainstorm cùng:** Người dùng (Giáo viên)

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT
Giáo viên gặp khó khăn trong việc tính toán số tiền thực thu hàng tháng khi học sinh có ngày nghỉ. Hiện tại việc trừ tiền và cộng dồn số dư sang tháng sau đang làm thủ công, dễ nhầm lẫn.

## 2. GIẢI PHÁP ĐỀ XUẤT
Mở rộng module thanh toán (Payments) để hỗ trợ:
- Thu tiền trước 1 tháng.
- Tự động tính toán số tiền dư dựa trên số ngày nghỉ trong tháng.
- Khấu trừ số dư đó vào hóa đơn của tháng tiếp theo.

## 3. ĐỐI TƯỢNG SỬ DỤNG
- **Primary:** Giáo viên (Người điểm danh và thu tiền).
- **Secondary:** Quản lý/Kế toán (Xem báo cáo tổng hợp).

## 4. TÍNH NĂNG CHI TIẾT

### 🚀 MVP (Bắt buộc có):
- [ ] **Thiết lập cấu trúc phí (Trong phần Cài đặt):**
    - Phí trông trưa: 2.000 VNĐ / ngày (Khấu trừ nếu nghỉ).
    - Tiền ăn (vật tư thực phẩm): Tùy chỉnh trong Cài đặt (Khấu trừ nếu nghỉ).
    - Phí nấu ăn (công phục vụ): 60.000 VNĐ / tháng (Cố định, không trừ).
- [ ] **Tính toán Số dư (Balance Carry-over):**
    - Nếu nghỉ: Số tiền (2.000 + Tiền ăn 1 bữa) của ngày đó được chuyển thành "Số tiền dư".
    - Cuối tháng: Tổng số tiền dư = (Số ngày nghỉ) * (2.000 + Tiền ăn 1 bữa).
- [ ] **Hóa đơn tháng tiếp theo:**
    - Tiền phải nộp = (Tiền cố định 60k) + (Dự tính Tiền trông trưa + Tiền ăn tháng mới) - (Số tiền dư của tháng trước).
- [ ] **Quản lý trạng thái đóng tiền:** Đã đóng / Chưa đóng / Đóng thiếu.

### 📊 Báo cáo Excel (Đề xuất dual-sheet):
Để giữ nguyên thói quen cũ và thêm tính minh bạch, file Excel sẽ có **2 Sheets**:
1.  **Sheet 1 (Hiện tại):** Giữ nguyên mẫu cũ anh đang dùng.
2.  **Sheet 2 (Mới - Khấu trừ phí):** Chia làm các cụm cột minh bạch:
    - **Thông tin cơ bản:** STT, Họ tên, Lớp.
    - **Khấu trừ tháng cũ:** Số ngày vắng, Số tiền hoàn lại (Ngày vắng x [Tiền ăn + 2k]).
    - **Phải nộp tháng mới:** Tiền nấu ăn (60k), Tiền ăn + Trông trưa dự tính (Số ngày học x [Tiền ăn + 2k]).
    - **TỔNG THỰC THU:** (Tiền tháng mới) - (Tiền khấu trừ tháng cũ).

## 5. ƯỚC TÍNH SƠ BỘ
- **Độ phức tạp:** Trung bình (Cần thay đổi cấu trúc Database để lưu trữ số dư và lịch sử giao dịch).
- **Rủi ro:** Cần đảm bảo tính chính xác tuyệt đối của logic trừ tiền để tránh khiếu nại từ phụ huynh.

---

## 6. CÁC QUY TẮC CỐ ĐỊNH (XÁC NHẬN)
- **Tiền nấu ăn:** 60.000 VNĐ/tháng (Cố định, không hoàn lại/không trừ theo ngày nghỉ).
- **Tiền trông trưa:** 2.000 VNĐ/ngày (Trừ thẳng vào số dư nếu giáo viên tích "Vắng").
- **Báo cáo:** Hệ thống báo cáo Excel sẽ cập nhật theo logic khấu trừ này.

## 7. BƯỚC TIẾP THEO
→ Chạy `/plan` để lên thiết kế kỹ thuật chi tiết.

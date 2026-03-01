# 🎨 DESIGN: Tính Năng "Chấm Ăn Tất Cả" (Mark All Present)

Ngày tạo: 01/03/2026
Dựa trên: Yêu cầu Thêm nút chấm tất cả học sinh

---

## 1. Cách Lưu Thông Tin (Database)

Vì việc bấm liên tục để gọi API cho mỗi học sinh có thể làm chậm ứng dụng, chúng ta sẽ thêm một API Batch mới:

**Mới:** `POST /api/attendance/batch`
- **Mục đích:** Gửi một mảng danh sách các học sinh (cùng ID và trạng thái) để server lưu vào CSDL (SQLite) trong 1 lần duy nhất, thay vì phải lưu từng bé.
- **Dữ liệu gửi lên:** `[ { student_id: 1, date: '2026-03-01', status: 'present' }, ... ]`

## 2. Giao diện (UI) trên Màn hình Chấm Công

| Vị trí | Thiết kế | Chức năng | 
|---|---|---|
| Cột thẻ (Action) | Nút mờ/ẩn phía trên cùng danh sách | Nút `✅ Chọn tất cả` được gắn kèm ở góc hoặc ngay trên danh sách điểm danh hàng ngày. |
| Dòng Học sinh | Nút tick/bỏ tick | Các nút vẫn giữ nguyên màu xanh/ám đỏ như cũ nhưng sẽ tự động cập nhật nếu bấm `Chọn tất cả`. |

## 3. Luồng Hoạt Động Của Giáo Viên

**Hành trình tiêu chuẩn để chấm ăn nhanh:**
1. Mở app, vào tab **Chấm công**. (Mặc định là ngày hôm nay).
2. Giáo viên nhấn nút **"✅ Chọn tất cả"**. Toàn bộ học sinh trong bảng sẽ được tự động đổi sang trạng thái `Có ăn` (Màu xanh).
3. Hệ thống sẽ **gọi 1 API duy nhất** để cập nhật trạng thái của tất cả trẻ nhỏ xuống server. Cực nhanh và mượt mà.
4. Đối với bé nào **Không ăn** hoặc **Nghỉ phép**, giáo viên kéo chuột xuống và bấm vào nút trạng thái của bé đó để đổi (như cũ).

## 4. Checklist Kiểm Tra (Acceptance Criteria)

### Tính năng: Chọn tất cả (Chấm ăn hàng loạt)
- [ ] Bấm "Chọn tất cả" -> Trạng thái hiển thị của toàn lớp chuyển sang "Có ăn".
- [ ] Ứng dụng không bị giật/đơ (lag) khi chấm cho lớp đông.
- [ ] Tắt/mở lại tab hoặc load lại trang, tất cả học sinh vẫn hiển thị đúng là đã được "Có ăn".
- [ ] Nút chỉ hiển thị / hoạt động ở Tab "Chấm công".
- [ ] Có thể dễ dàng đổi trạng thái của 1 vài học sinh thành "Không ăn" ngay sau đó.

---

*Tạo bởi AWF 4.0 - Design Phase*

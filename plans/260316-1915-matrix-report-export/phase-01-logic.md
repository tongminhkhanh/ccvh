# Phase 01: Logic Data Transformation
Status: ⬜ Pending
Dependencies: None

## Objective
Xây dựng hàm xử lý dữ liệu để biến đổi từ danh sách điểm danh chi tiết sang cấu trúc ma trận có thể nạp vào Excel.

## Implementation Steps
1. [ ] Tạo hàm `processMatrixData(students, attendanceRecords, startDate, endDate)`.
2. [ ] Tạo danh sách các ngày trong khoảng từ `startDate` đến `endDate`.
3. [ ] Duyệt qua từng học sinh, tìm bản ghi điểm danh tương ứng với từng ngày.
4. [ ] Trả về mảng các đối tượng chứa: STT, Tên, Lớp, Các cột ngày (X hoặc trống), Tổng số ngày ăn, Số ngày nghỉ.

## Files to Create/Modify
- `src/utils/reportUtils.ts` (NEW) - Tách logic xử lý file ra khỏi Hook.
- `src/hooks/useAppData.ts` (MODIFY) - Import và gọi hàm xử lý.

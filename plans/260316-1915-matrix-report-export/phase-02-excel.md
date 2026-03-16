# Phase 02: Excel Styling & Merge Logic
Status: ⬜ Pending
Dependencies: Phase 01

## Objective
Sử dụng thư viện `xlsx` để tạo file Excel có cấu trúc phức tạp (Merge cells hàng tiêu đề).

## Implementation Steps
1. [ ] Thiết kế Header rows (2 hàng đầu cho Tiêu đề báo cáo và thông tin chung).
2. [ ] Thiết kế Table headers (Hàng 4-5 có merge cell cho cột "Ngày" giống mẫu ảnh).
3. [ ] Điền dữ liệu ma trận từ Phase 01.
4. [ ] Thêm hàng "Tổng cộng" ở cuối.
5. [ ] Cài đặt độ rộng cột (Column widths) để báo cáo dễ đọc.

## Files to Create/Modify
- `src/utils/reportUtils.ts` (MODIFY) - Triển khai logic `xlsx`.

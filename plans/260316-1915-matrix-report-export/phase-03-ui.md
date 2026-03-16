# Phase 03: UI Update (Reports Tab)
Status: ⬜ Pending
Dependencies: Phase 02

## Objective
Bổ sung nút bấm vào giao diện để người dùng có thể kích hoạt tính năng xuất báo cáo mới.

## Implementation Steps
1. [ ] Cập nhật Interface `ReportsProps` trong `Reports.tsx`.
2. [ ] Thêm nút **"Xuất mẫu ma trận"** cạnh nút xuất báo cáo cũ.
3. [ ] Truyền hàm `handleExportMatrixReport` từ `useAppData.ts` xuống `Reports.tsx`.

## Files to Create/Modify
- `src/components/reports/Reports.tsx` (MODIFY)
- `src/hooks/useAppData.ts` (MODIFY)

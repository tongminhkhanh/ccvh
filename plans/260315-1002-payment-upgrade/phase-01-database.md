# Phase 01: Database Schema Setup
Status: ⬜ Pending
Dependencies: None

## Objective
Thiết lập các bảng và cột cần thiết trong SQLite để lưu trữ cấu hình phí, số dư học sinh và lịch sử thanh toán.

## Requirements
### Functional
- [ ] Bảng `settings` lưu 3 key: `mealPrice`, `supervisionFee`, `cookingFee`.
- [ ] Bảng `students` có thêm cột `balance` (số thực, mặc định 0).
- [ ] Bảng `payment_logs` lưu vết chốt tiền hàng tháng (tháng, năm, học sinh, số tiền nộp, số dư đã trừ).

## Implementation Steps
1. [ ] Thêm câu lệnh SQL `CREATE TABLE IF NOT EXISTS settings` vào hàm `initDB`.
2. [ ] Thêm câu lệnh SQL `ALTER TABLE students ADD COLUMN balance REAL DEFAULT 0` (cần handle lỗi nếu cột đã tồn tại).
3. [ ] Thêm câu lệnh SQL `CREATE TABLE IF NOT EXISTS payment_logs`.
4. [ ] Khởi tạo dữ liệu mặc định cho bảng `settings` (35k, 2k, 60k).

## Files to Create/Modify
- `server.ts` - Hàm `initDB` và các API liên quan.

## Test Criteria
- [ ] Kiểm tra DB bằng SQLite browser hoặc query: Bảng và cột mới phải xuất hiện.
- [ ] Restart server không làm mất dữ liệu hoặc gây lỗi crash SQL.

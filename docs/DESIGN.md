# 🎨 DESIGN: LunchPop PWA (Progressive Web App)

Ngày tạo: 2026-03-01
Dựa trên: Workflow /design

---

## 1. Cách Lưu Thông Tin (PWA Architecture)

Để biến web thành App, chúng ta không cần đổi cơ sở dữ liệu. Chúng ta chỉ cần cung cấp cho điện thoại 2 file "căn cước công dân" của ứng dụng:

┌─────────────────────────────────────────────────────────────┐
│  📄 Chọn Tên & Màu Sắc (manifest.json)                      │
│  ├── Tên hiển thị trên màn hình: LunchPop                   │
│  ├── Màu nền lúc mở app (Splash Screen): #3A86FF            │
│  └── Biểu tượng (Icon): Bộ logo kích thước 192px/512px      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  🤖 Người Hỗ Trợ Đứng Sau (Service Worker)                  │
│  ├── Nhiệm vụ 1: Báo cho ĐT biết "Tôi là App cài đặt được"    │
│  └── Nhiệm vụ 2: Lưu sẵn file CSS/JS để mở App cực nhanh    │
└─────────────────────────────────────────────────────────────┘

## 2. Luồng Hoạt Động Cài Đặt (User Journey)

Đây là 'hành trình' cài App của 1 Giáo viên:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 HÀNH TRÌNH: Thêm App vào màn hình chính
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Giáo viên mở Safari (iPhone) hoặc Chrome (Android) và vào link `ccvh.vercel.app`
2️⃣ Điện thoại tự động nhận diện đây là PWA.
3️⃣ Trình duyệt hiện popup gợi ý (nếu Android) hoặc ấn nút Share -> "Thêm vào màn hình chính" (nếu iOS).
4️⃣ Sau khi ấn đồng ý, Icon App sẽ tải thẳng ra màn hình hiển thị điện thoại cùng các app khác.
5️⃣ Lần sau chỉ cần bấm Icon là dùng luôn, giao diện Full Screen mượt mà (Không còn dính thanh URL của trình duyệt).

## 3. Checklist Kiểm Tra Kỹ Thuật

### Tính năng: PWA Setup

- [ ] Chuẩn bị và Tạo folder `public/icons` chứa các bản Image Icon (192x192, 512x512).
- [ ] Cài đặt Plugin vite `vite-plugin-pwa` để cấu hình PWA Injection tự động.
- [ ] Chỉnh sửa `vite.config.ts` để tiêm Script sinh (manifest + sw) khi build chạy.
- [ ] Render thử trên Localhost, mở Chrome DevTools (Tab Application > Manifest) xem Trình duyệt có hiện nút `Install App` hợp lệ không.

---

*Tạo bởi AWF 2.1 - Design Phase*

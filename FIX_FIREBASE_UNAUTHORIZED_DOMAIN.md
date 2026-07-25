# Hướng Dẫn Sửa Lỗi Firebase: auth/unauthorized-domain

## 🔍 Nguyên Nhân

Lỗi `Firebase: Error (auth/unauthorized-domain)` xảy ra khi domain/IP của bạn chưa được thêm vào **Authorized domains** trong Firebase Console.

Firebase chỉ cho phép authentication từ các domains đã được authorize để bảo mật.

## ✅ Giải Pháp

### Bước 1: Truy Cập Firebase Console

1. Mở trình duyệt và truy cập: https://console.firebase.google.com/
2. Đăng nhập với tài khoản Google của bạn
3. Chọn project: **ielts-learning-d80dc** (hoặc project ID của bạn)

### Bước 2: Vào Authentication Settings

1. Trong menu bên trái, chọn **Authentication** (Xác thực)
2. Chọn tab **Settings** (Cài đặt)
3. Cuộn xuống phần **Authorized domains** (Các miền được ủy quyền)

### Bước 3: Thêm Domain/IP

1. Click nút **Add domain** (Thêm miền)
2. Thêm các domain/IP sau:

**Bắt buộc:**
- `27.71.28.47` (IP server của bạn)
- `27.71.28.47:8081` (IP với port, nếu cần)

**Khuyến nghị (nếu có domain):**
- `your-domain.com` (nếu bạn có domain)
- `www.your-domain.com` (nếu có www subdomain)

**Lưu ý:**
- Firebase **KHÔNG hỗ trợ port** trong authorized domains
- Nếu dùng IP với port, chỉ thêm IP: `27.71.28.47`
- Nếu dùng domain, thêm cả domain và www subdomain

### Bước 4: Lưu và Đợi

1. Click **Add** để lưu
2. Đợi vài phút để Firebase cập nhật (thường là ngay lập tức, nhưng có thể mất vài phút)

### Bước 5: Test Lại

1. Refresh trang frontend
2. Thử đăng nhập lại với Google
3. Kiểm tra console không còn lỗi `unauthorized-domain`

## 📝 Ví Dụ Cụ Thể

### Scenario 1: Chỉ Dùng IP

**Thêm vào Firebase:**
```
27.71.28.47
```

**Lưu ý:** Firebase không hỗ trợ port, nên chỉ thêm IP, không thêm `:8081`

### Scenario 2: Có Domain

**Thêm vào Firebase:**
```
youpasscopy.com
www.youpasscopy.com
27.71.28.47
```

### Scenario 3: Development và Production

**Thêm tất cả:**
```
localhost
127.0.0.1
27.71.28.47
youpasscopy.com
www.youpasscopy.com
```

## ⚠️ Lưu Ý Quan Trọng

1. **Firebase không hỗ trợ port trong authorized domains:**
   - ✅ Đúng: `27.71.28.47`
   - ❌ Sai: `27.71.28.47:8081`

2. **Cần thêm cả IP và domain (nếu có):**
   - Nếu truy cập qua IP → thêm IP
   - Nếu truy cập qua domain → thêm domain
   - Nếu cả hai → thêm cả hai

3. **Thay đổi có hiệu lực ngay:**
   - Thường là ngay lập tức
   - Có thể mất vài phút trong một số trường hợp
   - Nếu vẫn lỗi sau 5 phút, kiểm tra lại domain/IP đã đúng chưa

4. **Kiểm tra domain/IP hiện tại:**
   - Mở browser console khi đang ở trang frontend
   - Xem URL trong address bar
   - Domain/IP đó phải có trong Firebase authorized domains

## 🔍 Kiểm Tra Domain/IP Hiện Tại

### Cách 1: Xem URL trong Browser

Khi mở frontend, xem URL trong address bar:
- `http://27.71.28.47:8081` → Domain là `27.71.28.47`
- `https://youpasscopy.com` → Domain là `youpasscopy.com`

### Cách 2: Xem trong Browser Console

Mở DevTools (F12) → Console, gõ:
```javascript
window.location.hostname
// Sẽ trả về: "27.71.28.47" hoặc "youpasscopy.com"
```

Domain/IP này **PHẢI** có trong Firebase authorized domains.

## 🚨 Nếu Vẫn Bị Lỗi Sau Khi Thêm Domain

### Kiểm tra 1: Domain/IP đã đúng chưa?

1. Xem URL hiện tại trong browser
2. So sánh với danh sách authorized domains trong Firebase
3. Đảm bảo khớp chính xác (không có port, không có http://)

### Kiểm tra 2: Đã đợi đủ lâu chưa?

- Đợi 2-5 phút sau khi thêm domain
- Refresh lại trang
- Clear browser cache (Ctrl+Shift+Delete)

### Kiểm tra 3: Firebase Project đúng chưa?

1. Kiểm tra `projectId` trong `app.config.prod.ts`
2. Đảm bảo đang thêm domain vào đúng Firebase project

### Kiểm tra 4: Có dùng HTTPS không?

- Nếu dùng HTTPS, domain phải match chính xác
- Nếu dùng HTTP với IP, chỉ cần thêm IP (không có port)

## 📸 Hướng Dẫn Bằng Hình Ảnh

### Bước 1: Vào Firebase Console
```
Firebase Console → Project → Authentication → Settings
```

### Bước 2: Tìm Authorized Domains
```
Settings → Scroll down → Authorized domains section
```

### Bước 3: Add Domain
```
Click "Add domain" → Enter domain/IP → Click "Add"
```

## 🔄 Sau Khi Sửa

1. ✅ Domain/IP đã được thêm vào Firebase Console
2. ✅ Đợi vài phút để Firebase cập nhật
3. ✅ Refresh frontend
4. ✅ Test đăng nhập lại với Google
5. ✅ Không còn lỗi `unauthorized-domain`

## 📞 Nếu Vẫn Gặp Vấn Đề

Gửi thông tin sau:

1. **Domain/IP bạn đang truy cập:**
   - URL trong browser address bar

2. **Danh sách authorized domains trong Firebase:**
   - Screenshot hoặc list các domains đã thêm

3. **Lỗi chi tiết từ browser console:**
   - Mở DevTools → Console
   - Copy toàn bộ error message










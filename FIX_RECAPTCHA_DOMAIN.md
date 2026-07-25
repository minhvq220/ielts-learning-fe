# Hướng Dẫn Khắc Phục Lỗi reCAPTCHA "Invalid domain for site key"

## 🔍 Nguyên Nhân

Lỗi `"Invalid domain for site key"` xảy ra khi domain `app.essayrater-test.online` chưa được đăng ký trong Google reCAPTCHA Admin Console cho site key `6LffgQ8sAAAAANIzqmkPZ1p7oK_91cCL9bw4o0c-`.

## ✅ Giải Pháp: Thêm Domain Vào reCAPTCHA Admin Console

### Bước 1: Truy Cập Google reCAPTCHA Admin Console

1. Mở trình duyệt và truy cập: [https://www.google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)
2. Đăng nhập bằng tài khoản Google của bạn (tài khoản đã tạo site key này)

### Bước 2: Tìm Site Key Của Bạn

1. Trong danh sách các site, tìm site key: `6LffgQ8sAAAAANIzqmkPZ1p7oK_91cCL9bw4o0c-`
2. Click vào site key đó để mở cấu hình

### Bước 3: Thêm Domain Mới

1. Trong trang cấu hình site key, tìm phần **"Domains"** hoặc **"Domain settings"**
2. Bạn sẽ thấy danh sách các domain đã được đăng ký (thường có `localhost` cho development)
3. Click nút **"Add"** hoặc **"+"** hoặc **"Add domain"**
4. Nhập domain mới: `app.essayrater-test.online`
   - **Lưu ý:** Chỉ nhập domain, không cần `https://` hoặc `http://`
   - Ví dụ: `app.essayrater-test.online` ✅
   - Không: `https://app.essayrater-test.online` ❌
5. Click **"Save"** hoặc **"Submit"**

### Bước 4: Xác Nhận Domain Đã Được Thêm

Sau khi thêm, bạn sẽ thấy domain `app.essayrater-test.online` trong danh sách domains.

**Danh sách domains nên có:**
- ✅ `localhost` (cho development)
- ✅ `app.essayrater-test.online` (cho test environment)
- ✅ Domain production của bạn (nếu có)

### Bước 5: Đợi Cấu Hình Có Hiệu Lực

- Thường mất **vài phút** (1-5 phút) để cấu hình có hiệu lực
- Refresh browser và thử lại

## 🧪 Test Sau Khi Cấu Hình

### Cách 1: Test Từ Browser Console

1. Mở frontend trên domain `https://app.essayrater-test.online`
2. Mở Browser DevTools (F12) → Console tab
3. Kiểm tra không có lỗi reCAPTCHA
4. Thử đăng nhập Google để trigger reCAPTCHA

### Cách 2: Test Trực Tiếp

1. Mở frontend trên domain `https://app.essayrater-test.online`
2. Thử đăng nhập Google
3. Kiểm tra không còn lỗi "Invalid domain for site key"

## 📋 Checklist

- [ ] Đã truy cập Google reCAPTCHA Admin Console
- [ ] Đã tìm thấy site key `6LffgQ8sAAAAANIzqmkPZ1p7oK_91cCL9bw4o0c-`
- [ ] Đã thêm domain `app.essayrater-test.online` vào danh sách domains
- [ ] Đã save cấu hình
- [ ] Đã đợi vài phút để cấu hình có hiệu lực
- [ ] Đã test lại và không còn lỗi

## 🔍 Troubleshooting

### Vấn đề: Không tìm thấy site key trong danh sách

**Nguyên nhân:** Bạn đang đăng nhập bằng tài khoản Google khác với tài khoản đã tạo site key

**Giải pháp:**
1. Đăng xuất và đăng nhập lại bằng tài khoản đúng
2. Hoặc yêu cầu người tạo site key thêm domain cho bạn

### Vấn đề: Không thấy nút "Add domain"

**Nguyên nhân:** Giao diện có thể khác tùy theo phiên bản

**Giải pháp:**
1. Tìm phần "Domains" hoặc "Domain settings"
2. Tìm biểu tượng "+" hoặc "Add"
3. Nếu không thấy, thử click vào site key để xem chi tiết cấu hình

### Vấn đề: Vẫn còn lỗi sau khi thêm domain

**Nguyên nhân:** 
- Cấu hình chưa có hiệu lực (cần đợi vài phút)
- Domain nhập sai (có `https://` hoặc `http://`)
- Browser cache

**Giải pháp:**
1. Đợi thêm 2-3 phút
2. Kiểm tra lại domain đã nhập đúng chưa (chỉ domain, không có protocol)
3. Clear browser cache và hard refresh (Ctrl+Shift+R hoặc Cmd+Shift+R)
4. Thử browser khác hoặc incognito mode

### Vấn đề: Cần thêm nhiều domain

**Giải pháp:**
- Bạn có thể thêm nhiều domain vào cùng một site key
- Mỗi domain trên một dòng hoặc cách nhau bằng dấu phẩy (tùy giao diện)
- Hoặc thêm từng domain một

## 📝 Lưu Ý Quan Trọng

1. **Domain phải khớp chính xác:**
   - ✅ `app.essayrater-test.online` - Đúng
   - ❌ `https://app.essayrater-test.online` - Sai (có protocol)
   - ❌ `www.app.essayrater-test.online` - Sai (có www)
   - ❌ `essayrater-test.online` - Sai (thiếu subdomain)

2. **reCAPTCHA v3 vs v2:**
   - Site key `6LffgQ8sAAAAANIzqmkPZ1p7oK_91cCL9bw4o0c-` là reCAPTCHA v3
   - reCAPTCHA v3 không hiển thị checkbox, chỉ có badge nhỏ ở góc

3. **Wildcard domains:**
   - Nếu có nhiều subdomain, có thể dùng wildcard: `*.essayrater-test.online`
   - Nhưng cần kiểm tra xem site key có hỗ trợ wildcard không

## 🔗 Tài Liệu Tham Khảo

- [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [reCAPTCHA Domain Validation](https://developers.google.com/recaptcha/docs/domain_validation)
- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)

## 📞 Nếu Vẫn Gặp Vấn Đề

Nếu sau khi thêm domain và đợi vài phút vẫn còn lỗi, kiểm tra:

1. Domain đã được thêm đúng chưa (xem lại trong Admin Console)
2. Browser console có lỗi gì khác không
3. Site key có đúng không: `6LffgQ8sAAAAANIzqmkPZ1p7oK_91cCL9bw4o0c-`
4. Frontend đã được rebuild với production config chưa



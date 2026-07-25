# Hướng Dẫn Cấu Hình Domain Cho Frontend

## 📋 Tổng Quan

Frontend sử dụng file cấu hình khác nhau cho từng môi trường:
- **Development**: `src/app/config/app.config.ts`
- **Production**: `src/app/config/app.config.prod.ts`

Khi build với `--configuration=production`, Angular sẽ tự động thay thế `app.config.ts` bằng `app.config.prod.ts`.

---

## 🔧 Cấu Hình API URL

### Development (Local)

File: `src/app/config/app.config.ts`

```typescript
api: {
  baseUrl: 'http://localhost:8081',
}
```

### Test/Production

File: `src/app/config/app.config.prod.ts`

```typescript
api: {
  // Với Cloudflare Tunnel (HTTPS)
  baseUrl: 'https://app.essayrater-test.online',
  
  // Hoặc trực tiếp qua IP (HTTP)
  // baseUrl: 'http://27.71.28.47:8081',
}
```

**Lưu ý**: 
- Nếu dùng Cloudflare Tunnel, sử dụng domain HTTPS
- Nếu truy cập trực tiếp qua IP, sử dụng HTTP với port

---

## 🔥 Cấu Hình Firebase

Firebase configuration đã được cấu hình trong cả hai file config. Domain mới cần được thêm vào Firebase Console.

### Thêm Domain vào Firebase

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Chọn project: `ielts-learning-d80dc`
3. Vào **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain** và thêm: `app.essayrater-test.online`

Xem chi tiết trong file `CONFIGURE_DOMAIN.md` ở backend.

---

## 🤖 Cấu Hình reCAPTCHA

reCAPTCHA site key đã được cấu hình. Domain mới cần được thêm vào Google reCAPTCHA Admin.

### Thêm Domain vào reCAPTCHA

1. Truy cập [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Chọn site key: `6LffgQ8sAAAAANIzqmkPZ1p7oK_91cCL9bw4o0c-`
3. Vào tab **Settings** → **Domains**
4. Thêm domain: `app.essayrater-test.online`

Xem chi tiết trong file `CONFIGURE_DOMAIN.md` ở backend.

---

## 🏗️ Build Frontend

### Development Build

```bash
ng build
# hoặc
ng build --configuration=development
```

Sử dụng `app.config.ts` (localhost)

### Production Build

```bash
ng build --configuration=production
```

Sử dụng `app.config.prod.ts` (domain production)

---

## ✅ Checklist Triển Khai

Khi triển khai lên môi trường mới:

- [ ] Đã cập nhật `app.config.prod.ts` với API URL mới
- [ ] Đã thêm domain vào Firebase Authorized Domains
- [ ] Đã thêm domain vào reCAPTCHA Domain Settings
- [ ] Đã build frontend với `--configuration=production`
- [ ] Đã test API connection từ domain mới
- [ ] Đã test Firebase authentication từ domain mới
- [ ] Đã test reCAPTCHA từ domain mới

---

## 🔗 Tài Liệu Tham Khảo

- Backend CORS Configuration: `../Java/EssayRaterBE/CONFIGURE_DOMAIN.md`
- Cloudflare Tunnel (GoDaddy + domain): `../Java/EssayRaterBE/deploy-guide/13-cloudflare-tunnel.md`
- Angular Configuration: [Angular Configuration Guide](https://angular.io/guide/build#configuring-application-environments)



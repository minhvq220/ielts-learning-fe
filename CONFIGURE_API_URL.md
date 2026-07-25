# Hướng Dẫn Cấu Hình API URL Cho Production Build

## 📋 Tổng Quan

Frontend đã được cấu hình để tự động sử dụng API URL khác nhau cho development và production:

- **Development**: `http://localhost:8081` (trong `app.config.ts`)
- **Production**: `https://app.essayrater-test.online` (trong `app.config.prod.ts`) - với Cloudflare Tunnel

## ⚙️ Cấu Hình

### File Cấu Hình

1. **Development Config**: `src/app/config/app.config.ts`
   - Dùng khi chạy `ng serve` hoặc build development
   - API URL: `http://localhost:8081`

2. **Production Config**: `src/app/config/app.config.prod.ts`
   - Dùng khi build production (`npm run build`)
   - API URL: `https://app.essayrater-test.online` (với Cloudflare Tunnel)
   - Hoặc: `http://27.71.28.47:8081` (truy cập trực tiếp qua IP)

### Cách Hoạt Động

Khi build production, Angular sẽ tự động thay thế `app.config.ts` bằng `app.config.prod.ts` nhờ cấu hình trong `angular.json`:

```json
"fileReplacements": [
  {
    "replace": "src/app/config/app.config.ts",
    "with": "src/app/config/app.config.prod.ts"
  }
]
```

## 🔧 Thay Đổi API URL

### Cách 1: Sửa Trực Tiếp File Production Config

1. Mở file: `src/app/config/app.config.prod.ts`

2. Tìm dòng:
   ```typescript
   api: {
     baseUrl: 'http://27.71.28.47:8081',
   },
   ```

3. Thay đổi thành IP/domain của bạn:
   ```typescript
   api: {
     // Với Cloudflare Tunnel (HTTPS)
     baseUrl: 'https://app.essayrater-test.online',
     
     // Hoặc truy cập trực tiếp qua IP (HTTP)
     // baseUrl: 'http://27.71.28.47:8081',
     
     // Hoặc domain production khác
     // baseUrl: 'https://your-production-domain.com',
   },
   ```

### Cách 2: Sử Dụng Environment Variables (Nâng Cao)

Nếu muốn dùng environment variables, có thể cập nhật build script trong `package.json`:

```json
"scripts": {
  "build": "ng build",
  "build:prod": "ng build --configuration=production"
}
```

Và sử dụng biến môi trường trong code (cần cấu hình thêm).

## 🚀 Build Production

### Cách 1: Build Bình Thường

```bash
npm run build
```

Angular sẽ tự động:
- Sử dụng `app.config.prod.ts` thay vì `app.config.ts`
- Build với production configuration
- Output: `dist/YouPassCopy/browser/`

### Cách 2: Build Với Script

```bash
# Windows
build-for-deploy.bat

# Linux/Mac
./build-for-deploy.sh
```

## ✅ Kiểm Tra Sau Khi Build

### Cách 1: Kiểm Tra Trong Code Build

1. Mở file build: `dist/YouPassCopy/browser/main-*.js`
2. Tìm kiếm: `baseUrl` hoặc `27.71.28.47`
3. Xác nhận API URL đã được thay đổi

### Cách 2: Test Từ Browser

1. Deploy frontend build lên server
2. Mở browser DevTools (F12) → Network tab
3. Thực hiện một action gọi API
4. Xem request URL → Phải là `https://app.essayrater-test.online/api/...` (hoặc domain/IP bạn đã cấu hình)

### Cách 3: Kiểm Tra Console

1. Mở browser console
2. Gõ: `AppConfig` (nếu có expose)
3. Hoặc xem network requests để xác nhận API URL

## 📝 Ví Dụ Cấu Hình

### Scenario 1: Server IP Thay Đổi

**Trước:**
```typescript
baseUrl: 'https://app.essayrater-test.online',
```

**Sau:**
```typescript
baseUrl: 'http://192.168.1.100:8081',  // Hoặc IP mới
```

**Sau đó rebuild:**
```bash
npm run build
```

### Scenario 2: Dùng Domain Thay Vì IP

**Trước:**
```typescript
baseUrl: 'http://27.71.28.47:8081',
```

**Sau:**
```typescript
baseUrl: 'https://app.essayrater-test.online',  // Với Cloudflare Tunnel
// hoặc
baseUrl: 'https://api.youpasscopy.com',  // Domain production
```

**Lưu ý**: 
- Đảm bảo backend CORS đã được cấu hình cho domain này!
- Nếu dùng Cloudflare Tunnel, domain phải được cấu hình trong Cloudflare

### Scenario 3: Dùng HTTPS

**Trước:**
```typescript
baseUrl: 'http://27.71.28.47:8081',
```

**Sau:**
```typescript
baseUrl: 'https://27.71.28.47:8081',
```

**Lưu ý**: Backend phải hỗ trợ HTTPS!

## ⚠️ Lưu Ý Quan Trọng

1. **Sau khi thay đổi API URL, PHẢI rebuild:**
   ```bash
   npm run build
   ```

2. **Đảm bảo Backend CORS đã được cấu hình:**
   - API URL trong frontend phải khớp với allowed-origins trong backend
   - Ví dụ: Nếu frontend chạy trên `http://27.71.28.47:8081`, backend phải có origin này trong `app.cors.allowed-origins`

3. **Protocol phải khớp:**
   - Nếu frontend dùng `http://`, backend cũng phải là `http://`
   - Nếu frontend dùng `https://`, backend cũng phải là `https://`

4. **Port phải khớp:**
   - Frontend API URL: `http://27.71.28.47:8081`
   - Backend phải chạy trên port `8081`

## 🔄 Quy Trình Deploy

1. **Cập nhật API URL** trong `app.config.prod.ts` (nếu cần)

2. **Build frontend:**
   ```bash
   npm run build
   ```

3. **Copy build output** lên server:
   ```bash
   # Copy dist/YouPassCopy/browser/* lên server
   ```

4. **Kiểm tra:**
   - Frontend có gọi đúng API URL không?
   - Backend có nhận được requests không?
   - CORS có hoạt động đúng không?

## 📞 Troubleshooting

### Vấn đề: Frontend vẫn gọi localhost

**Nguyên nhân**: Chưa rebuild sau khi thay đổi config

**Giải pháp**: 
```bash
npm run build
```

### Vấn đề: CORS Error

**Nguyên nhân**: Backend chưa cấu hình CORS cho origin mới

**Giải pháp**: Cập nhật `app.cors.allowed-origins` trong backend `application.properties`

### Vấn đề: API không kết nối được

**Nguyên nhân**: 
- IP/domain không đúng
- Port không đúng
- Backend chưa chạy

**Giải pháp**: Kiểm tra lại API URL và đảm bảo backend đang chạy


# Hướng dẫn cấu hình Authentication

## Tổng quan

Hệ thống sử dụng Google Login + Firebase Authentication + reCAPTCHA v3 + Backend JWT để xác thực người dùng.

## Luồng xác thực

1. **Frontend**: Người dùng click "Đăng nhập với Google"
2. **Firebase**: Xác thực với Google qua Firebase
3. **Frontend**: Lấy Firebase ID Token + reCAPTCHA token
4. **Backend**: Verify Firebase token + reCAPTCHA token
5. **Backend**: Tạo/find user trong database
6. **Backend**: Generate JWT token
7. **Frontend**: Lưu JWT token và sử dụng cho các API requests

## Cấu hình Frontend

### 1. Cấu hình Firebase

Mở file `src/app/config/app.config.ts` và điền các thông tin Firebase:

```typescript
export const AppConfig = {
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'YOUR_FIREBASE_AUTH_DOMAIN',
    projectId: 'YOUR_FIREBASE_PROJECT_ID',
    storageBucket: 'YOUR_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_FIREBASE_MESSAGING_SENDER_ID',
    appId: 'YOUR_FIREBASE_APP_ID',
  },
  // ...
};
```

**Cách lấy Firebase config:**
1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào Project Settings > General
4. Scroll xuống phần "Your apps" > Web app
5. Copy các giá trị config

### 2. Cấu hình reCAPTCHA

Trong cùng file `app.config.ts`:

```typescript
recaptcha: {
  siteKey: 'YOUR_RECAPTCHA_SITE_KEY',
},
```

**Cách lấy reCAPTCHA Site Key:**
1. Vào [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Tạo site mới (chọn reCAPTCHA v3)
3. Thêm domain của bạn (ví dụ: `localhost` cho development)
4. Copy Site Key

### 3. Cấu hình API Base URL

```typescript
api: {
  baseUrl: 'http://localhost:8081', // Thay đổi theo môi trường của bạn
},
```

## Cấu hình Backend

### 1. Cấu hình Firebase Admin SDK

Có 2 cách:

#### Cách 1: Sử dụng Service Account JSON file (Khuyến nghị)

1. Vào Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download file JSON
4. Đặt file vào thư mục an toàn (ví dụ: `src/main/resources/firebase-credentials.json`)
5. Cấu hình trong `application.properties`:

```properties
app.security.firebase.project-id=YOUR_FIREBASE_PROJECT_ID
app.security.firebase.credentials-path=src/main/resources/firebase-credentials.json
```

#### Cách 2: Sử dụng Environment Variable

1. Set environment variable `GOOGLE_APPLICATION_CREDENTIALS` trỏ đến file JSON
2. Chỉ cần set project-id:

```properties
app.security.firebase.project-id=YOUR_FIREBASE_PROJECT_ID
```

### 2. Cấu hình reCAPTCHA Secret Key

Trong `application.properties`:

```properties
app.security.recaptcha.secret-key=YOUR_RECAPTCHA_SECRET_KEY
```

**Lấy Secret Key:**
- Vào [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
- Chọn site đã tạo
- Copy Secret Key

### 3. Cấu hình JWT Secret

```properties
app.security.jwt.secret=YOUR_JWT_SECRET_KEY_MINIMUM_32_CHARACTERS
app.security.jwt.access-token-ttl=PT4H
```

**Tạo JWT Secret:**
- Sử dụng một chuỗi ngẫu nhiên ít nhất 32 ký tự
- Có thể dùng: `openssl rand -base64 32`

### 4. Cấu hình Database

Migration `V11__Create_users_table.sql` sẽ tự động tạo bảng `users` khi khởi động ứng dụng.

## Kiểm tra cấu hình

### Frontend

Khi khởi động ứng dụng, kiểm tra console:
- ✅ Nếu thấy: "✅ Firebase initialized successfully" → Firebase OK
- ✅ Nếu thấy: "✅ reCAPTCHA loaded successfully" → reCAPTCHA OK
- ⚠️ Nếu thấy: "⚠️ Missing configuration keys: ..." → Cần điền các keys còn thiếu

### Backend

Khi khởi động ứng dụng, kiểm tra logs:
- ✅ "✅ Firebase Admin SDK initialized successfully" → Firebase OK
- ✅ "✅ JWT Service initialized" → JWT OK
- ⚠️ Nếu thấy warnings về missing keys → Cần cấu hình

## Testing

1. Khởi động backend: `./gradlew bootRun` hoặc chạy từ IDE
2. Khởi động frontend: `npm start`
3. Truy cập: `http://localhost:4200/login`
4. Click "Đăng nhập với Google"
5. Chọn tài khoản Google
6. Kiểm tra:
   - Header hiển thị tên user
   - Có nút "Đăng xuất"
   - Các API requests tự động có JWT token trong header

## Troubleshooting

### Firebase không khởi tạo
- Kiểm tra Firebase config trong `app.config.ts`
- Kiểm tra console có lỗi gì không
- Đảm bảo Firebase project đã enable Authentication > Sign-in method > Google

### reCAPTCHA không hoạt động
- Kiểm tra Site Key trong `app.config.ts`
- Kiểm tra domain đã được thêm vào reCAPTCHA admin
- Kiểm tra console có lỗi load script không

### Backend không verify được Firebase token
- Kiểm tra Firebase Admin SDK đã được khởi tạo
- Kiểm tra credentials file path đúng
- Kiểm tra project-id đúng

### JWT không được tạo
- Kiểm tra JWT secret đã được set (ít nhất 32 ký tự)
- Kiểm tra logs có lỗi gì không

## Security Notes

- **KHÔNG** commit các file chứa keys vào Git
- Sử dụng environment variables cho production
- JWT secret phải đủ mạnh (ít nhất 32 ký tự)
- reCAPTCHA secret key phải được bảo mật
- Firebase credentials file phải được bảo mật


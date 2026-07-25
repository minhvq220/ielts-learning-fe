# Cơ chế hoạt động của các Keys - Tại sao có thể Expose?

## Tổng quan

Tài liệu này giải thích chi tiết cơ chế hoạt động của các keys trong frontend và tại sao chúng được thiết kế để expose ra client-side mà vẫn an toàn.

---

## 1. Firebase API Key

### 🔑 Cơ chế hoạt động:

#### 1.1. Firebase API Key là gì?
- Firebase API Key là **public identifier** (định danh công khai)
- Nó giống như một "địa chỉ" để Firebase biết bạn đang sử dụng project nào
- **KHÔNG phải là secret key** - không thể dùng để truy cập dữ liệu trực tiếp

#### 1.2. Cách hoạt động:

```
┌─────────────┐                    ┌──────────────┐
│  Frontend   │                    │   Firebase   │
│  (Browser)  │                    │   Backend    │
└──────┬──────┘                    └──────┬───────┘
       │                                    │
       │ 1. Gửi API Key + Request          │
       │──────────────────────────────────>│
       │                                    │
       │ 2. Firebase kiểm tra:              │
       │    - API Key có hợp lệ?           │
       │    - Domain có được phép?          │
       │    - API restrictions?             │
       │                                    │
       │ 3. Kiểm tra Security Rules        │
       │    (quan trọng nhất!)              │
       │                                    │
       │ 4. Trả về kết quả                 │
       │<──────────────────────────────────│
       │                                    │
```

#### 1.3. Bảo mật thực sự nằm ở đâu?

**1. Firebase Security Rules** (Quan trọng nhất!)
```javascript
// Ví dụ Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chỉ cho phép authenticated users đọc/write
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public data - ai cũng đọc được
    match /public/{document=**} {
      allow read: if true;
      allow write: if false; // Không ai được write
    }
  }
}
```

**2. API Restrictions trong Firebase Console:**
- Giới hạn domains được phép sử dụng API Key
- Giới hạn APIs được phép gọi
- Chống abuse

**3. Authentication:**
- User phải đăng nhập (Firebase Auth)
- Mỗi request phải có ID Token hợp lệ
- Token được verify bởi Firebase backend

#### 1.4. Ví dụ thực tế:

```typescript
// Frontend code (expose ra browser)
const firebaseConfig = {
  apiKey: "AIzaSyCgB0iZjQ8HFcKHXYmUjgnnHgnAqyPDoeo", // Public key
  authDomain: "ielts-learning-d80dc.firebaseapp.com",
  projectId: "ielts-learning-d80dc",
};

// Khi user đăng nhập
const user = await signInWithEmailAndPassword(auth, email, password);
// → Firebase backend verify email/password
// → Trả về ID Token (secret, chỉ user đó có)

// Khi đọc dữ liệu
const doc = await getDoc(doc(db, 'users', userId));
// → Request gửi kèm:
//    - API Key (public)
//    - ID Token (secret, từ authentication)
// → Firebase kiểm tra:
//    1. API Key hợp lệ? ✅
//    2. ID Token hợp lệ? ✅
//    3. Security Rules cho phép? ✅
// → Nếu tất cả OK → trả về dữ liệu
```

**Kẻ tấn công có API Key nhưng:**
- ❌ Không có ID Token hợp lệ → Không đọc được dữ liệu
- ❌ Security Rules chặn → Không truy cập được
- ❌ Domain không được phép → Request bị từ chối

---

## 2. Google OAuth Client ID

### 🔑 Cơ chế hoạt động:

#### 2.1. OAuth 2.0 Flow:

```
┌─────────────┐                    ┌──────────────┐                    ┌──────────────┐
│  Frontend   │                    │   Google     │                    │   Backend     │
│  (Browser)  │                    │   OAuth      │                    │   (Your API)  │
└──────┬──────┘                    └──────┬───────┘                    └──────┬───────┘
       │                                    │                                    │
       │ 1. Redirect với Client ID         │                                    │
       │──────────────────────────────────>│                                    │
       │    (Client ID: public)            │                                    │
       │                                    │                                    │
       │ 2. User đăng nhập Google          │                                    │
       │    (trên Google server)            │                                    │
       │                                    │                                    │
       │ 3. Google trả về Authorization    │                                    │
       │    Code (temporary)                │                                    │
       │<──────────────────────────────────│                                    │
       │                                    │                                    │
       │ 4. Gửi Authorization Code +      │                                    │
       │    Client ID + Client Secret       │                                    │
       │──────────────────────────────────────────────────────────────────────>│
       │                                    │                                    │
       │                                    │ 5. Backend verify với Google        │
       │                                    │    (Client Secret chỉ backend có)  │
       │                                    │                                    │
       │                                    │ 6. Google trả về Access Token      │
       │                                    │<────────────────────────────────────│
       │                                    │                                    │
       │ 7. Backend trả về JWT Token        │                                    │
       │<──────────────────────────────────────────────────────────────────────│
       │                                    │                                    │
```

#### 2.2. Tại sao Client ID có thể expose?

**Client ID:**
- ✅ **Public** - Có thể expose ra frontend
- ✅ Chỉ là "địa chỉ" để Google biết bạn là ai
- ❌ **KHÔNG thể** dùng để lấy Access Token một mình

**Client Secret:**
- ❌ **Secret** - CHỈ có ở backend
- ✅ Dùng để đổi Authorization Code → Access Token
- ✅ Kẻ tấn công không có Client Secret → Không thể lấy Access Token

#### 2.3. Ví dụ thực tế:

```typescript
// Frontend (expose ra browser)
const clientId = "248911999918-09lg2liv7f0t4o1av081ubtr39bqsq5q.apps.googleusercontent.com";

// 1. User click "Đăng nhập với Google"
window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?
  client_id=${clientId}&  // ← Public, có thể expose
  redirect_uri=http://localhost:4200/callback&
  response_type=code&
  scope=email profile`;

// 2. User đăng nhập trên Google
// → Google trả về Authorization Code (temporary, chỉ dùng 1 lần)
// → Redirect về: http://localhost:4200/callback?code=ABC123

// 3. Frontend gửi code lên backend
fetch('/api/auth/google', {
  method: 'POST',
  body: JSON.stringify({ code: 'ABC123' })
});

// 4. Backend (có Client Secret)
const response = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  body: JSON.stringify({
    code: 'ABC123',
    client_id: '248911999918-...',      // Public
    client_secret: 'GOCSPX-...',        // ← SECRET! Chỉ backend có
    redirect_uri: 'http://localhost:4200/callback',
    grant_type: 'authorization_code'
  })
});
// → Google verify Client Secret
// → Trả về Access Token

// 5. Backend tạo JWT Token cho user
// → Trả về cho frontend
```

**Kẻ tấn công có Client ID nhưng:**
- ❌ Không có Client Secret → Không thể đổi Authorization Code thành Access Token
- ❌ Authorization Code chỉ dùng 1 lần và expire nhanh
- ❌ Redirect URI phải match với cấu hình trong Google Console

---

## 3. reCAPTCHA Site Key

### 🔑 Cơ chế hoạt động:

#### 3.1. reCAPTCHA v3 Flow:

```
┌─────────────┐                    ┌──────────────┐                    ┌──────────────┐
│  Frontend   │                    │   Google     │                    │   Backend     │
│  (Browser)  │                    │  reCAPTCHA    │                    │   (Your API)  │
└──────┬──────┘                    └──────┬───────┘                    └──────┬───────┘
       │                                    │                                    │
       │ 1. Load reCAPTCHA script           │                                    │
       │    với Site Key (public)            │                                    │
       │──────────────────────────────────>│                                    │
       │                                    │                                    │
       │ 2. Execute reCAPTCHA               │                                    │
       │    (chạy ngầm, không hiện popup)    │                                    │
       │──────────────────────────────────>│                                    │
       │                                    │                                    │
       │ 3. Google phân tích user behavior  │                                    │
       │    - Mouse movements                │                                    │
       │    - Click patterns                 │                                    │
       │    - Browser fingerprint            │                                    │
       │                                    │                                    │
       │ 4. Trả về Token (temporary)        │                                    │
       │<──────────────────────────────────│                                    │
       │                                    │                                    │
       │ 5. Gửi Token lên backend           │                                    │
       │──────────────────────────────────────────────────────────────────────>│
       │                                    │                                    │
       │                                    │ 6. Backend verify với Google        │
       │                                    │    (dùng Secret Key)                │
       │                                    │──────────────────────────────────>│
       │                                    │                                    │
       │                                    │ 7. Google trả về score (0.0-1.0)   │
       │                                    │<──────────────────────────────────│
       │                                    │                                    │
       │ 8. Backend quyết định:             │                                    │
       │    - Score > 0.5 → Human ✅        │                                    │
       │    - Score < 0.5 → Bot ❌          │                                    │
       │                                    │                                    │
```

#### 3.2. Tại sao Site Key có thể expose?

**Site Key:**
- ✅ **Public** - Có thể expose ra frontend
- ✅ Chỉ dùng để generate token
- ❌ **KHÔNG thể** dùng để verify token

**Secret Key:**
- ❌ **Secret** - CHỈ có ở backend
- ✅ Dùng để verify token với Google
- ✅ Kẻ tấn công không có Secret Key → Không thể verify token

#### 3.3. Ví dụ thực tế:

```typescript
// Frontend (expose ra browser)
const siteKey = "6LffgQ8sAAAAANIzqmkPZ1p7oK_91cCL9bw4o0c-";

// 1. Load reCAPTCHA script
const script = document.createElement('script');
script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
document.head.appendChild(script);

// 2. Execute reCAPTCHA (chạy ngầm)
const token = await grecaptcha.execute(siteKey, { action: 'login' });
// → Google phân tích user behavior
// → Trả về token: "03AGdBq24..." (temporary, chỉ dùng 1 lần)

// 3. Gửi token lên backend
fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    recaptchaToken: token  // ← Token từ reCAPTCHA
  })
});

// 4. Backend (có Secret Key)
const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
  method: 'POST',
  body: new URLSearchParams({
    secret: '6LffgQ8sAAAAALfBSsmCsSIrk09xRxRZiyxeV0gj',  // ← SECRET! Chỉ backend có
    response: token,
    remoteip: userIp
  })
});

const result = await response.json();
// {
//   "success": true,
//   "score": 0.9,  // ← Score từ 0.0 (bot) đến 1.0 (human)
//   "action": "login"
// }

// 5. Backend quyết định
if (result.success && result.score > 0.5) {
  // Human ✅ - Cho phép đăng nhập
} else {
  // Bot ❌ - Từ chối
}
```

**Kẻ tấn công có Site Key nhưng:**
- ❌ Không có Secret Key → Không thể verify token
- ❌ Token chỉ dùng 1 lần và expire nhanh
- ❌ Google phân tích behavior → Bot sẽ có score thấp

---

## 4. So sánh: Public Key vs Secret Key

### 4.1. Public Keys (Có thể expose):

| Key | Mục đích | Bảo mật |
|-----|----------|---------|
| Firebase API Key | Định danh project | Security Rules + Authentication |
| Google Client ID | Định danh OAuth app | Client Secret (ở backend) |
| reCAPTCHA Site Key | Generate token | Secret Key (ở backend) |

**Đặc điểm:**
- ✅ Có thể expose ra frontend
- ✅ Chỉ là "địa chỉ" hoặc "identifier"
- ❌ Không thể dùng một mình để truy cập dữ liệu

### 4.2. Secret Keys (KHÔNG được expose):

| Key | Mục đích | Vị trí |
|-----|----------|--------|
| Firebase Service Account | Truy cập admin | Backend only |
| Google Client Secret | Đổi code → token | Backend only |
| reCAPTCHA Secret Key | Verify token | Backend only |
| JWT Secret | Sign/verify JWT | Backend only |

**Đặc điểm:**
- ❌ **KHÔNG BAO GIỜ** expose ra frontend
- ✅ Chỉ có ở backend
- ✅ Dùng để verify/authenticate

---

## 5. Tại sao thiết kế như vậy?

### 5.1. Lý do kỹ thuật:

1. **Frontend cần biết thông tin để kết nối:**
   - Frontend cần biết Firebase project nào để kết nối
   - Frontend cần biết Google OAuth app nào để đăng nhập
   - Frontend cần biết reCAPTCHA site nào để verify

2. **Bảo mật thực sự ở server-side:**
   - Server-side có thể verify và validate
   - Server-side có thể kiểm tra permissions
   - Server-side có thể rate limit và chặn abuse

3. **Separation of Concerns:**
   - Public keys = "Who are you?" (Bạn là ai?)
   - Secret keys = "Prove it!" (Chứng minh đi!)

### 5.2. Ví dụ thực tế:

**Giống như:**
- **Public Key** = Địa chỉ nhà của bạn (mọi người biết)
- **Secret Key** = Chìa khóa nhà (chỉ bạn có)

Mọi người biết địa chỉ nhà bạn, nhưng không vào được vì:
- Cửa khóa (Security Rules)
- Cần chìa khóa (Secret Key)
- Có camera an ninh (Monitoring)

---

## 6. Best Practices

### ✅ Nên làm:

1. **Expose Public Keys:**
   - Firebase API Key ✅
   - Google Client ID ✅
   - reCAPTCHA Site Key ✅

2. **Cấu hình Restrictions:**
   - Firebase API restrictions
   - Google OAuth authorized domains
   - reCAPTCHA domain restrictions

3. **Sử dụng Security Rules:**
   - Firebase Security Rules
   - Backend validation
   - Rate limiting

### ❌ Không nên làm:

1. **Expose Secret Keys:**
   - Firebase Service Account ❌
   - Google Client Secret ❌
   - reCAPTCHA Secret Key ❌
   - JWT Secret ❌

2. **Hardcode Production URLs:**
   - Sử dụng environment variables
   - Sử dụng file replacement

---

## 7. Kết luận

### Tóm tắt:

1. **Public Keys (Firebase, Google Client ID, reCAPTCHA Site Key):**
   - ✅ Được thiết kế để expose
   - ✅ Chỉ là "địa chỉ" hoặc "identifier"
   - ✅ Bảo mật thực sự nằm ở server-side

2. **Secret Keys:**
   - ❌ KHÔNG BAO GIỜ expose
   - ✅ Chỉ có ở backend
   - ✅ Dùng để verify/authenticate

3. **Bảo mật đa lớp:**
   - Public Key (frontend) + Secret Key (backend)
   - Security Rules
   - Authentication/Authorization
   - Rate limiting
   - Monitoring

### Lưu ý quan trọng:

- **KHÔNG THỂ** ẩn hoàn toàn public keys trong frontend
- Đây là **thiết kế đúng** của các service này
- Bảo mật thực sự nằm ở **server-side validation** và **security rules**

---

## 8. Tài liệu tham khảo

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [OAuth 2.0 Security Best Practices](https://oauth.net/2/oauth-best-practice/)
- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)











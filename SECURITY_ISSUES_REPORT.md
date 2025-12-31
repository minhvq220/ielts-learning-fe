# BÁO CÁO CÁC VẤN ĐỀ BẢO MẬT

## 🔴 VẤN ĐỀ NGHIÊM TRỌNG (CRITICAL)

### 1. **Hardcoded Secrets và API Keys trong Code**

#### Frontend:
- **File**: `src/app/config/app.config.ts`
  - ❌ Firebase API Key hardcoded: `AIzaSyCgB0iZjQ8HFcKHXYmUjgnnHgnAqyPDoeo`
  - ❌ Google Client ID hardcoded: `248911999918-09lg2liv7f0t4o1av081ubtr39bqsq5q.apps.googleusercontent.com`
  - ❌ reCAPTCHA Site Key hardcoded: `6LffgQ8sAAAAANIzqmkPZ1p7oK_91cCL9bw4o0c-`
  - ❌ Hardcoded API URLs: `http://localhost:8081`

#### Backend:
- **File**: `src/main/resources/application.properties`
  - ❌ Database password hardcoded: `youpasscopy123`
  - ❌ JWT Secret hardcoded: `Yp9s8K3fWq2Z7vB4nX0cR6mT1uL8hVq3`
  - ❌ reCAPTCHA Secret Key hardcoded: `6LffgQ8sAAAAALfBSsmCsSIrk09xRxRZiyxeV0gj`
  - ❌ Gemini API Key hardcoded: `AIzaSyBcjGNy4spvKhyL-A6izm-u469vTBSxC5A`

**⚠️ Rủi ro**: Tất cả secrets đều bị lộ trong source code, có thể bị commit lên git public.

**✅ Giải pháp**: 
- Di chuyển tất cả secrets ra environment variables
- Thêm `.env` vào `.gitignore`
- Sử dụng Spring Boot profiles cho các môi trường khác nhau
- Frontend: Đọc từ environment variables tại build time

---

### 2. **XSS (Cross-Site Scripting) Vulnerabilities**

#### Frontend:
- **File**: `src/app/pages/writing/writing.component.ts`
  - ❌ Line 285: `[innerHTML]="selectedTask()!.writingGuide"` - Không sanitize
  - ❌ Line 512: `[innerHTML]="selectedTask()!.sampleAnswer"` - Không sanitize

- **File**: `src/app/components/writing-history-detail/writing-history-detail.component.ts`
  - ❌ Line 246: `[innerHTML]="getTaskInstruction()"` - Không sanitize
  - ❌ Line 293: `[innerHTML]="getWritingGuide()"` - Không sanitize

- **File**: `src/app/components/writing-history/writing-history.component.ts`
  - ❌ Line 139: `[innerHTML]="getTaskInstruction(item)"` - Không sanitize
  - ❌ Line 144: `[innerHTML]="getAnswerPreview(item.answer)"` - Không sanitize

- **File**: `src/app/directives/translate-selection.directive.ts`
  - ❌ Nhiều chỗ sử dụng `innerHTML` trực tiếp không sanitize

**⚠️ Rủi ro**: Attacker có thể inject malicious JavaScript vào content, thực thi code trên trình duyệt người dùng.

**✅ Giải pháp**:
- Sử dụng Angular `DomSanitizer` để sanitize HTML
- Hoặc sử dụng text binding `{{ }}` thay vì `[innerHTML]` nếu không cần HTML formatting
- Validate và sanitize tất cả user input ở backend

---

### 3. **CSRF Protection Disabled**

#### Backend:
- **File**: `src/main/java/org/example/youpasscopy/config/SecurityConfig.java`
  - ❌ Line 30: `.csrf(csrf -> csrf.disable())` - CSRF protection bị tắt hoàn toàn

**⚠️ Rủi ro**: Application dễ bị tấn công CSRF nếu sử dụng cookie-based authentication.

**✅ Giải pháp**: 
- Vì đang dùng JWT (stateless), có thể giữ CSRF disabled, NHƯNG cần đảm bảo:
  - JWT được lưu trong localStorage (không phải cookie) ✅ (đã đúng)
  - CORS được cấu hình chặt chẽ
  - Không có cookie-based authentication nào khác

---

## 🟠 VẤN ĐỀ QUAN TRỌNG (HIGH)

### 4. **SQL Injection Potential trong Native Query**

#### Backend:
- **File**: `src/main/java/org/example/youpasscopy/repository/WritingHistoryRepository.java`
  - ⚠️ Line 87-123: Native query sử dụng `CAST(:search AS varchar)` với LIKE
  - Query đã sử dụng parameterized queries (`@Param`) nên an toàn, NHƯNG cần review kỹ

**✅ Giải pháp**: 
- Đảm bảo tất cả user input đều được bind qua parameters
- Thêm input validation và sanitization

---

### 5. **CORS Configuration Quá Rộng**

#### Backend:
- **File**: `src/main/resources/application.properties`
  - ⚠️ Line 26: `spring.web.cors.allowed-origins=http://localhost:4200,http://localhost:8081`
  - ⚠️ Line 28: `spring.web.cors.allowed-headers=*` - Cho phép tất cả headers
  - ⚠️ Line 29: `spring.web.cors.allow-credentials=true` - Kết hợp với wildcard headers có thể nguy hiểm

**⚠️ Rủi ro**: Trong production, cần giới hạn chặt chẽ allowed origins.

**✅ Giải pháp**:
- Chỉ allow specific origins trong production
- Giới hạn allowed headers cụ thể thay vì `*`
- Sử dụng environment variables cho CORS config

---

### 6. **Hardcoded Localhost URLs trong Frontend**

#### Frontend:
- **File**: `src/app/services/writing-history-api.service.ts`
  - ❌ Line 157: `'http://localhost:8081/api/writing-history'`
  - ❌ Line 158: `'http://localhost:8081/api/ai-scoring'`

- **File**: `src/app/pages/admin/admin-users.component.ts`
  - ❌ Line 501: `'http://localhost:8081/api/admin/users'`

- **File**: `src/app/pages/writing-self-check/writing-self-check.component.ts`
  - ❌ Line 398, 522: Hardcoded localhost URLs

**⚠️ Rủi ro**: Không thể deploy lên production với URLs khác.

**✅ Giải pháp**:
- Sử dụng `AppConfig.api.baseUrl` đã có sẵn
- Hoặc environment variables

---

### 7. **Weak Default JWT Secret**

#### Backend:
- **File**: `src/main/resources/application.properties`
  - ⚠️ Line 45: JWT Secret default: `Yp9s8K3fWq2Z7vB4nX0cR6mT1uL8hVq3` (32 characters, nhưng hardcoded)
  - File `JwtService.java` đã validate secret length >= 32, nhưng secret này nên random và strong hơn

**✅ Giải pháp**:
- Luôn require environment variable cho JWT secret
- Không có default value hoặc fail fast nếu không có
- Generate strong random secret cho production

---

## 🟡 VẤN ĐỀ TRUNG BÌNH (MEDIUM)

### 8. **Sensitive Data Exposure - Database Password trong Config**

#### Backend:
- **File**: `src/main/resources/application.properties`
  - ⚠️ Line 8: Database password visible: `youpasscopy123`
  - ⚠️ File `application-dev.properties` cũng có password hardcoded

**✅ Giải pháp**:
- Sử dụng environment variables: `spring.datasource.password=${DB_PASSWORD}`
- Không commit file có credentials vào git

---

### 9. **Missing Input Validation**

Cần kiểm tra các endpoint có validate input đầy đủ:
- String length limits
- Email format validation
- SQL injection prevention
- XSS prevention

---

### 10. **Logging Sensitive Information**

Kiểm tra xem có log sensitive data không (passwords, tokens, etc.)

---

## 📋 KHUYẾN NGHỊ TỔNG THỂ

1. **Immediate Actions (Ngay lập tức)**:
   - ✅ Di chuyển tất cả secrets ra environment variables
   - ✅ Sanitize tất cả `[innerHTML]` bindings
   - ✅ Thay hardcoded URLs bằng config

2. **Short-term (Ngắn hạn)**:
   - ✅ Cấu hình CORS chặt chẽ cho production
   - ✅ Thêm input validation
   - ✅ Review và test SQL injection prevention

3. **Long-term (Dài hạn)**:
   - ✅ Implement Content Security Policy (CSP)
   - ✅ Regular security audits
   - ✅ Penetration testing
   - ✅ Security headers (HSTS, X-Frame-Options, etc.)

---

## ✅ ĐIỂM TÍCH CỰC

1. ✅ Sử dụng JWT authentication (stateless)
2. ✅ Sử dụng parameterized queries trong JPA (an toàn với SQL injection)
3. ✅ Có @PreAuthorize annotations để kiểm soát authorization
4. ✅ Có reCAPTCHA để chống bot
5. ✅ Có rate limiting cho AI scoring
6. ✅ CSRF disabled hợp lý vì dùng JWT (không dùng cookies)


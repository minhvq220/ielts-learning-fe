# YouPassCopy - IELTS Practice Platform

## Mô tả
Website luyện thi IELTS với 4 kỹ năng: Reading, Listening, Writing, Speaking. Sử dụng Angular 20.2.0 với AI chấm bài thông minh.

## Tính năng chính

### 📖 Reading
- Giao diện chia đôi màn hình (bài đọc + câu hỏi)
- Timer đếm ngược 60 phút
- Chế độ tra từ với giải thích context
- Đa dạng bài đọc từ Cambridge 10-20
- Chấm bài tự động với đáp án chi tiết

### 🎧 Listening  
- Audio player chất lượng cao
- Giao diện tương tự Reading
- Timer 40 phút
- Chế độ phát lại audio
- Điều chỉnh âm lượng

### ✍️ Writing
- Task 1 & Task 2 với thời gian riêng biệt
- AI chấm bài theo 4 tiêu chí IELTS
- Gợi ý cải thiện chi tiết
- Sample answers chất lượng
- Đếm từ tự động

### 🎤 Speaking
- AI chấm phát âm chi tiết
- Thanh note-taking thông minh
- Recording với timer
- Gợi ý từ vựng nâng cao
- Câu trả lời mẫu

## Công nghệ sử dụng
- Angular 20.2.0
- TypeScript
- CSS3 với responsive design
- Bootstrap 5.3.0
- Chart.js cho biểu đồ thống kê

## Cài đặt và chạy

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm start

# Build cho production
npm run build
```

## Cấu trúc dự án
```
src/
├── app/
│   ├── components/
│   │   ├── header/
│   │   └── sidebar/
│   ├── pages/
│   │   ├── home/
│   │   ├── reading/
│   │   ├── listening/
│   │   ├── writing/
│   │   └── speaking/
│   ├── services/
│   └── models/
├── assets/
└── styles/
```

## Roadmap
- [ ] Tích hợp AI services thực tế
- [ ] Hệ thống đăng nhập/đăng ký
- [ ] Lưu trữ tiến độ học tập
- [ ] Thêm nhiều bài test
- [ ] Mobile app với Ionic
- [ ] Hệ thống báo cáo chi tiết

## Đóng góp
Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## License
MIT License
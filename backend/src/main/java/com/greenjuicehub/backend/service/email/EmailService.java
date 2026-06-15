package com.greenjuicehub.backend.service.email;

import com.greenjuicehub.backend.dto.contact.request.CreateContactRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.shop-email}")
    private String shopEmail;

    @Async
    public void sendContactNotification(CreateContactRequest req) {
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(shopEmail);
            mail.setSubject("[Green Juice Hub] Liên hệ mới: " + req.getSubject());
            mail.setText("""
                    Bạn có một liên hệ mới từ khách hàng:
                    
                    Họ tên : %s
                    Email  : %s
                    SĐT    : %s
                    Chủ đề : %s
                    
                    Nội dung:
                    %s
                    """.formatted(
                    req.getFullName(),
                    req.getEmail(),
                    req.getPhone() != null ? req.getPhone() : "Không có",
                    req.getSubject(),
                    req.getMessage()
            ));
            mailSender.send(mail);
        } catch (Exception e) {
            // Không throw — lỗi mail không ảnh hưởng việc lưu contact
        }
    }
}
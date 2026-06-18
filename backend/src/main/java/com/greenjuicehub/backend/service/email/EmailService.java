package com.greenjuicehub.backend.service.email;

import com.greenjuicehub.backend.dto.contact.request.CreateContactRequest;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.shop-email}")
    private String shopEmail;

    // ── Helper gửi HTML ───────────────────────────────────────────────────────
    private void sendHtml(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setFrom(shopEmail, "Green Juice Hub");
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (Exception e) {
            // không throw — lỗi mail không ảnh hưởng API
        }
    }

    // ── Gửi thông báo liên hệ mới tới shop ───────────────────────────────────
    @Async
    public void sendContactNotification(CreateContactRequest req) {
        Context ctx = new Context();
        ctx.setVariable("fullName", req.getFullName());
        ctx.setVariable("email",    req.getEmail());
        ctx.setVariable("phone",    req.getPhone() != null ? req.getPhone() : "Không có");
        ctx.setVariable("subject",  req.getSubject());
        ctx.setVariable("message",  req.getMessage());

        String html = templateEngine.process("email/contact-notification", ctx);
        sendHtml(shopEmail, "[Green Juice Hub] Liên hệ mới: " + req.getSubject(), html);
    }

    // ── Gửi phản hồi tới khách hàng ──────────────────────────────────────────
    @Async
    public void sendContactReply(String toEmail, String customerName,
                                 String subject, String replyContent) {
        Context ctx = new Context();
        ctx.setVariable("customerName",  customerName);
        ctx.setVariable("subject",       subject);
        ctx.setVariable("replyContent",  replyContent);

        String html = templateEngine.process("email/contact-reply", ctx);
        sendHtml(toEmail, "[Green Juice Hub] Phản hồi: " + subject, html);
    }
}
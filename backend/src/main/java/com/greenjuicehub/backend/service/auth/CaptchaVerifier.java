package com.greenjuicehub.backend.service.auth;

import com.greenjuicehub.backend.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CaptchaVerifier {

    @Value("${google.recaptcha-secret}")
    private String recaptchaSecret;

    private static final String VERIFY_URL =
            "https://www.google.com/recaptcha/api/siteverify";

    public void verify(String captchaToken) {
        if (captchaToken == null || captchaToken.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Vui lòng xác minh captcha");
        }

        RestTemplate restTemplate = new RestTemplate();
        String url = VERIFY_URL + "?secret=" + recaptchaSecret + "&response=" + captchaToken;

        Map response = restTemplate.postForObject(url, null, Map.class);

        if (response == null || !Boolean.TRUE.equals(response.get("success"))) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Xác minh captcha thất bại, vui lòng thử lại");
        }
    }
}
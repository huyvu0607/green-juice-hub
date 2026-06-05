package com.greenjuicehub.backend.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
@RequiredArgsConstructor
public class JwtUtil {

    private final JwtProperties jwtProperties;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes());
    }

    public String generateAccessToken(Long userId, String role) {
        return Jwts.builder()
                .subject(userId.toString())           // ← setSubject() → subject()
                .claim("role", role)
                .claim("type", "access")
                .issuedAt(new Date())                 // ← setIssuedAt() → issuedAt()
                .expiration(new Date(System.currentTimeMillis()
                        + jwtProperties.getAccessTokenExpiration()))  // ← setExpiration() → expiration()
                .signWith(getSigningKey())             // ← bỏ SignatureAlgorithm, tự detect
                .compact();
    }

    public String generateRefreshToken(Long userId) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("type", "refresh")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()
                        + jwtProperties.getRefreshTokenExpiration()))
                .signWith(getSigningKey())
                .compact();
    }
    public long getRemainingSeconds(String token) {
        Date expiration = getClaims(token).getExpiration();
        long remaining = (expiration.getTime() - System.currentTimeMillis()) / 1000;
        return Math.max(remaining, 0);
    }

    public Long extractUserId(String token) {
        return Long.parseLong(getClaims(token).getSubject());
    }

    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public String extractType(String token) {
        return getClaims(token).get("type", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            return false; // hết hạn → false, filter sẽ trả 401
        } catch (JwtException | IllegalArgumentException e) {
            return false; // token giả/lỗi → false
        }
    }

    // Thêm method mới để check riêng expired
    public boolean isTokenExpired(String token) {
        try {
            getClaims(token);
            return false;
        } catch (ExpiredJwtException e) {
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()                          // ← parserBuilder() → parser()
                .verifyWith(getSigningKey())           // ← setSigningKey() → verifyWith()
                .build()
                .parseSignedClaims(token)             // ← parseClaimsJws() → parseSignedClaims()
                .getPayload();                        // ← getBody() → getPayload()
    }
}
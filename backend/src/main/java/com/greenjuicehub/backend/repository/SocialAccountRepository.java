package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.SocialAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SocialAccountRepository extends JpaRepository<SocialAccount, Long> {
    Optional<SocialAccount> findByProviderAndProviderId(
                SocialAccount.Provider provider, String providerId);
}
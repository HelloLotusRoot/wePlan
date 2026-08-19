package com.example.weplan.controller;

import com.example.weplan.model.RegisteredUser;
import com.example.weplan.repository.RegisteredUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class KakaoAuthController {

    @Autowired
    private RegisteredUserRepository registeredUserRepository;

    @Value("${kakao.rest-api-key}")
    private String kakaoRestApiKey;

    @Value("${kakao.client-secret:}")
    private String kakaoClientSecret;

    private String getClientSecret() {
        if (kakaoClientSecret != null && !kakaoClientSecret.trim().isEmpty()) {
            return kakaoClientSecret.trim();
        }
        String envSecret = System.getenv("KAKAO_CLIENT_SECRET");
        if (envSecret != null && !envSecret.trim().isEmpty()) {
            return envSecret.trim();
        }
        envSecret = System.getenv("VITE_KAKAO_CLIENT_SECRET");
        if (envSecret != null && !envSecret.trim().isEmpty()) {
            return envSecret.trim();
        }
        try {
            java.io.File envFile = new java.io.File("frontend/.env");
            if (envFile.exists()) {
                java.util.List<String> lines = java.nio.file.Files.readAllLines(envFile.toPath());
                for (String line : lines) {
                    line = line.trim();
                    if (line.startsWith("KAKAO_CLIENT_SECRET=") || line.startsWith("VITE_KAKAO_CLIENT_SECRET=")) {
                        String[] parts = line.split("=", 2);
                        if (parts.length > 1 && !parts[1].trim().isEmpty()) {
                            return parts[1].trim();
                        }
                    }
                }
            }
        } catch (Exception e) {
            // ignore
        }
        return null;
    }

    @GetMapping("/kakao")
    public ResponseEntity<?> loginWithKakao(@RequestParam("code") String code, @RequestParam("redirectUri") String redirectUri) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            // 1. Exchange authorization code for access token
            String tokenUrl = "https://kauth.kakao.com/oauth/token";
            HttpHeaders tokenHeaders = new HttpHeaders();
            tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            String cleanApiKey = kakaoRestApiKey != null ? kakaoRestApiKey.trim() : "";
            String secret = getClientSecret();

            MultiValueMap<String, String> tokenParams = new LinkedMultiValueMap<>();
            tokenParams.add("grant_type", "authorization_code");
            tokenParams.add("client_id", cleanApiKey);
            tokenParams.add("redirect_uri", redirectUri);
            tokenParams.add("code", code);
            
            if (secret != null && !secret.isEmpty()) {
                tokenParams.add("client_secret", secret);
            }

            System.out.println("==================== [KakaoAuth Debug] ====================");
            System.out.println("client_id: " + cleanApiKey);
            System.out.println("client_secret: " + (secret != null ? secret : "(NONE)"));
            System.out.println("redirect_uri: " + redirectUri);
            System.out.println("code: " + code);
            System.out.println("===========================================================");

            ResponseEntity<Map> tokenResponse;
            try {
                HttpEntity<MultiValueMap<String, String>> tokenRequest = new HttpEntity<>(tokenParams, tokenHeaders);
                tokenResponse = restTemplate.postForEntity(tokenUrl, tokenRequest, Map.class);
            } catch (HttpClientErrorException e) {
                String errorBody = e.getResponseBodyAsString(StandardCharsets.UTF_8);
                System.err.println("[KakaoAuth] Token exchange failed! Status: " + e.getStatusCode() + ", ErrorBody: " + errorBody);
                
                Map<String, Object> errResult = new HashMap<>();
                errResult.put("error", "token_exchange_failed");
                errResult.put("status", e.getStatusCode().value());
                errResult.put("detail", errorBody != null && !errorBody.isEmpty() ? errorBody : ("HTTP " + e.getStatusCode().value() + " " + e.getStatusText()));
                return ResponseEntity.status(e.getStatusCode()).body(errResult);
            }

            if (tokenResponse.getStatusCode() != HttpStatus.OK || tokenResponse.getBody() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Failed to exchange authorization code with Kakao.");
            }

            String accessToken = (String) tokenResponse.getBody().get("access_token");
            System.out.println("[KakaoAuth] Access token obtained successfully");

            // 2. Fetch user information using access token
            String userInfoUrl = "https://kapi.kakao.com/v2/user/me";
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.set("Authorization", "Bearer " + accessToken);
            userHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<Void> userRequest = new HttpEntity<>(userHeaders);
            ResponseEntity<Map> userResponse = restTemplate.exchange(userInfoUrl, HttpMethod.GET, userRequest, Map.class);

            if (userResponse.getStatusCode() != HttpStatus.OK || userResponse.getBody() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Failed to retrieve user info from Kakao.");
            }

            Map<String, Object> body = userResponse.getBody();
            Object idObj = body.get("id");
            String kakaoId = idObj != null ? idObj.toString() : "";

            Map<String, Object> properties = (Map<String, Object>) body.get("properties");
            Map<String, Object> kakaoAccount = (Map<String, Object>) body.get("kakao_account");
            String nickname = "";
            String profileImage = "";

            if (properties != null) {
                nickname = properties.get("nickname") != null ? (String) properties.get("nickname") : "";
                profileImage = properties.get("profile_image") != null ? (String) properties.get("profile_image") : "";
            }
            if ((nickname == null || nickname.isEmpty()) && kakaoAccount != null) {
                Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
                if (profile != null && profile.get("nickname") != null) {
                    nickname = (String) profile.get("nickname");
                }
                if ((profileImage == null || profileImage.isEmpty()) && profile != null && profile.get("profile_image_url") != null) {
                    profileImage = (String) profile.get("profile_image_url");
                }
            }

            System.out.println("[KakaoAuth] Login success for kakaoId=" + kakaoId + ", nickname=" + nickname);

            Map<String, Object> result = new HashMap<>();
            result.put("id", kakaoId);
            result.put("nickname", nickname);
            result.put("profileImage", profileImage);

            registeredUserRepository.save(RegisteredUser.builder()
                    .id(kakaoId)
                    .nickname(nickname == null || nickname.isBlank() ? kakaoId : nickname)
                    .profileImage(profileImage)
                    .build());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Kakao login failed: " + e.getMessage());
        }
    }
}

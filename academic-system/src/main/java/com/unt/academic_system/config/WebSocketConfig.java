package com.unt.academic_system.config;

import com.unt.academic_system.service.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Collections;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);
    private final JwtService jwtService;

    public WebSocketConfig(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
        logger.info("✅ Message broker configured");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        logger.info("✅ STOMP endpoint registered at /ws");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    logger.info("🔌 WebSocket CONNECT attempt");

                    // Get token from headers
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    String userEmailHeader = accessor.getFirstNativeHeader("X-User-Email");

                    String email = null;
                    String token = null;

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        token = authHeader.substring(7);

                        try {
                            // Essayer d'extraire l'email même si le token est expiré
                            email = jwtService.extractEmail(token);
                            logger.info("✅ Email extracted from token: {}", email);

                        } catch (Exception e) {
                            logger.warn("⚠️ Token validation failed, trying with email header: {}", e.getMessage());

                            // Fallback: utiliser l'email du header si disponible
                            if (userEmailHeader != null && !userEmailHeader.trim().isEmpty()) {
                                email = userEmailHeader.trim();
                                logger.info("✅ Using email from header: {}", email);
                            }
                        }
                    } else if (userEmailHeader != null && !userEmailHeader.trim().isEmpty()) {
                        // Pas de token, mais email dans header
                        email = userEmailHeader.trim();
                        logger.info("✅ Using email from header (no token): {}", email);
                    }

                    if (email != null && !email.isEmpty()) {
                        // Créer l'authentification
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        email,
                                        null,
                                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                                );

                        // Définir l'utilisateur dans accessor
                        accessor.setUser(authentication);

                        logger.info("✅ WebSocket authentication successful for: {}", email);

                        // Envoyer un message de bienvenue
                        sendWelcomeMessage(email);
                    } else {
                        logger.warn("⚠️ Could not authenticate WebSocket connection");

                        // Créer une authentification anonyme (pour éviter Principal null)
                        UsernamePasswordAuthenticationToken anonymousAuth =
                                new UsernamePasswordAuthenticationToken(
                                        "anonymous",
                                        null,
                                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_GUEST"))
                                );
                        accessor.setUser(anonymousAuth);
                        logger.warn("⚠️ Created anonymous authentication to avoid null Principal");
                    }
                }

                return message;
            }

            @Override
            public void postSend(Message<?> message, MessageChannel channel, boolean sent) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.DISCONNECT.equals(accessor.getCommand())) {
                    if (accessor.getUser() != null) {
                        logger.info("👋 WebSocket disconnected: {}", accessor.getUser().getName());
                    }
                }
            }

            private void sendWelcomeMessage(String email) {
                try {
                    // Vous pouvez envoyer un message de bienvenue ici
                    logger.info("👋 Welcome message sent to: {}", email);
                } catch (Exception e) {
                    logger.error("Error sending welcome message", e);
                }
            }
        });
    }
}
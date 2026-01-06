package com.unt.academic_system.config;


import com.unt.academic_system.service.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public WebSocketAuthInterceptor(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                try {
                    // Vérifier si le token est valide
                    if (jwtService.isTokenValid(token)) {
                        // Extraire l'email du token
                        String email = jwtService.extractEmail(token);

                        if (email != null && !email.isEmpty()) {
                            try {
                                // Charger les détails de l'utilisateur
                                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                                // Valider le token avec les détails de l'utilisateur
                                if (jwtService.validateToken(token, userDetails)) {
                                    // Créer l'authentification
                                    UsernamePasswordAuthenticationToken authentication =
                                            new UsernamePasswordAuthenticationToken(
                                                    userDetails,
                                                    null,
                                                    userDetails.getAuthorities()
                                            );

                                    accessor.setUser(authentication);
                                    logger.debug("WebSocket authentication successful for user: {}", email);
                                } else {
                                    logger.warn("Token validation failed for user: {}", email);
                                }
                            } catch (Exception e) {
                                logger.error("Error loading user details for email {}: {}", email, e.getMessage());
                            }
                        } else {
                            logger.warn("Email extracted from token is null or empty");
                        }
                    } else {
                        logger.warn("Invalid or expired token");
                    }
                } catch (Exception e) {
                    logger.error("Error during WebSocket authentication: {}", e.getMessage());
                }
            } else {
                logger.debug("No Authorization header found or invalid format");
            }
        }

        return message;
    }

    @Override
    public void postSend(Message<?> message, MessageChannel channel, boolean sent) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.DISCONNECT.equals(accessor.getCommand())) {
            if (accessor.getUser() != null) {
                logger.debug("WebSocket disconnected for user: {}", accessor.getUser().getName());
            }
        }
    }

    @Override
    public boolean preReceive(MessageChannel channel) {
        return true;
    }

    @Override
    public Message<?> postReceive(Message<?> message, MessageChannel channel) {
        return message;
    }

    @Override
    public void afterReceiveCompletion(Message<?> message, MessageChannel channel, Exception ex) {
        if (ex != null) {
            logger.error("Error after receiving WebSocket message: {}", ex.getMessage());
        }
    }
}
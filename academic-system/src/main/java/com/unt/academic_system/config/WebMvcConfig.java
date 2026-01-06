package com.unt.academic_system.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebMvcConfig.class);

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        try {
            // Configuration pour /videos/** - depuis src/main/resources/static/videos/
            configureVideosDirectory(registry);

            // Configuration pour /uploads/**
            configureUploadDirectory(registry);

        } catch (Exception e) {
            logger.error("Error configuring resource handlers: {}", e.getMessage(), e);
        }
    }

    private void configureVideosDirectory(ResourceHandlerRegistry registry) {
        try {
            // Spring Boot sert automatiquement les fichiers depuis classpath:/static/
            // Donc les vidéos dans src/main/resources/static/videos/ sont automatiquement accessibles
            // via /videos/** sans configuration supplémentaire

            logger.info("Videos are served automatically from classpath:/static/videos/");

            // Cependant, on peut ajouter une configuration explicite pour améliorer les performances
            registry.addResourceHandler("/videos/**")
                    .addResourceLocations("classpath:/static/videos/")
                    .setCachePeriod(3600)
                    .resourceChain(true);

            logger.info("Videos resource handler configured successfully");
            logger.info("Videos location: classpath:/static/videos/");

        } catch (Exception e) {
            logger.error("Error configuring videos directory: {}", e.getMessage(), e);
        }
    }

    private void configureUploadDirectory(ResourceHandlerRegistry registry) {
        try {
            String projectRoot = System.getProperty("user.dir");
            File uploadDir = new File(projectRoot, "uploads");

            if (!uploadDir.exists()) {
                boolean created = uploadDir.mkdirs();
                if (created) {
                    logger.info("Upload directory created at: {}", uploadDir.getAbsolutePath());
                }
            }

            if (uploadDir.exists() && uploadDir.isDirectory()) {
                String uploadLocation = "file:" + uploadDir.getAbsolutePath() + File.separator;

                registry.addResourceHandler("/uploads/**")
                        .addResourceLocations(uploadLocation)
                        .setCachePeriod(3600)
                        .resourceChain(true);

                logger.info("Uploads resource handler configured successfully");
                logger.info("Uploads location: {}", uploadLocation);
            }

        } catch (Exception e) {
            logger.error("Error configuring upload directory: {}", e.getMessage(), e);
        }
    }
}
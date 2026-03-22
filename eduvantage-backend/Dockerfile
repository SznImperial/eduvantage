FROM php:8.4-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . /var/www/html/

# Install composer dependencies
# Using --no-dev for production, and optimize the autoloader.
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN if [ -f "composer.json" ]; then composer install --no-interaction --no-dev --optimize-autoloader; fi

# Set Apache document root to Laravel's public folder
RUN sed -i 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf

# Use production PHP settings (disables display_errors completely so warnings don't break JSON)
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Explicitly disable deprecation warnings and display_errors to protect JSON payloads
RUN echo "display_errors = Off" >> $PHP_INI_DIR/conf.d/disable_warnings.ini \
    && echo "error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT" >> $PHP_INI_DIR/conf.d/disable_warnings.ini

# Set permissions for Laravel
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Cache configuration for performance
# Note: In production, config caching is recommended, but when using Render environment variables, 
# you should only cache if the environment variables are available during build, which they often aren't.
# We will just expose the port, and let Laravel route on the fly or you can cache on a post-deploy script.
EXPOSE 80
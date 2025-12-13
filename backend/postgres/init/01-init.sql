-- Создаем отдельного пользователя для приложения (best practice)
CREATE USER travelshield_app WITH PASSWORD '12345';

-- Даем права
GRANT CONNECT ON DATABASE travelshield TO travelshield_app;
GRANT USAGE ON SCHEMA public TO travelshield_app;
GRANT CREATE ON SCHEMA public TO travelshield_app;

-- Создаем расширение для UUID (если нужно)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
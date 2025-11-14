-- Crear tabla para códigos de verificación (EJECUTAR EN SUPABASE)
CREATE TABLE IF NOT EXISTS codigos_verificacion (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    expira_en TIMESTAMPTZ NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_codigos_email ON codigos_verificacion(email);
CREATE INDEX IF NOT EXISTS idx_codigos_codigo ON codigos_verificacion(codigo);
CREATE INDEX IF NOT EXISTS idx_codigos_expira ON codigos_verificacion(expira_en);

-- Limpiar códigos expirados automáticamente (opcional)
-- Se puede ejecutar periódicamente o con un cron job
-- DELETE FROM codigos_verificacion 
-- WHERE expira_en < NOW() OR usado = TRUE;
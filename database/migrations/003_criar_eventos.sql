-- Agenda de atividades: cultos, visitas, ações sociais e reuniões.
CREATE TABLE eventos (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo        VARCHAR(120) NOT NULL,
  descricao     TEXT         NULL,
  tipo          ENUM('culto', 'visita', 'acao_social', 'reuniao', 'outro') NOT NULL DEFAULT 'outro',
  data_inicio   DATETIME     NOT NULL,
  data_fim      DATETIME     NULL,
  local         VARCHAR(200) NULL,
  igreja_id     INT UNSIGNED NULL,
  criado_por    INT UNSIGNED NOT NULL,
  criado_em     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_eventos_data_inicio (data_inicio),
  CONSTRAINT fk_eventos_igreja FOREIGN KEY (igreja_id) REFERENCES igrejas (id) ON DELETE SET NULL,
  CONSTRAINT fk_eventos_criado_por FOREIGN KEY (criado_por) REFERENCES usuarios (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

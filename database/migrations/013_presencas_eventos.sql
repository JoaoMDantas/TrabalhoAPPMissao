-- Confirmação de presença nos eventos da agenda ("Vou participar").
-- Cada pessoa confirma uma única vez por evento (a chave primária impede repetir).
-- Ao excluir o evento ou a conta, as confirmações também são excluídas.
CREATE TABLE eventos_presencas (
  evento_id  INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  criado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (evento_id, usuario_id),
  KEY idx_eventos_presencas_usuario (usuario_id),
  CONSTRAINT fk_eventos_presencas_evento FOREIGN KEY (evento_id) REFERENCES eventos (id) ON DELETE CASCADE,
  CONSTRAINT fk_eventos_presencas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

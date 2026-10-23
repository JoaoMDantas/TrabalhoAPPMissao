-- Fotos das mensagens do mural (até 4 por mensagem). O app reduz cada foto no celular antes de enviar.
-- Ao excluir a mensagem, as fotos dela também são excluídas.
CREATE TABLE mensagens_fotos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mensagem_id INT UNSIGNED     NOT NULL,
  ordem       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  tipo_mime   VARCHAR(20)      NOT NULL,
  tamanho     INT UNSIGNED     NOT NULL,
  conteudo    MEDIUMBLOB       NOT NULL,
  criado_em   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_fotos_mensagem (mensagem_id, ordem),
  CONSTRAINT fk_fotos_mensagem FOREIGN KEY (mensagem_id) REFERENCES mensagens (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

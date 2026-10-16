-- Mural de comunicação entre missionários e igrejas.
-- igreja_id é opcional: NULL significa mensagem para todos.
CREATE TABLE mensagens (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conteudo  VARCHAR(1000) NOT NULL,
  tipo      ENUM('mensagem', 'aviso') NOT NULL DEFAULT 'mensagem',
  autor_id  INT UNSIGNED  NOT NULL,
  igreja_id INT UNSIGNED  NULL,
  criado_em DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mensagens_tipo (tipo),
  CONSTRAINT fk_mensagens_autor FOREIGN KEY (autor_id) REFERENCES usuarios (id),
  CONSTRAINT fk_mensagens_igreja FOREIGN KEY (igreja_id) REFERENCES igrejas (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

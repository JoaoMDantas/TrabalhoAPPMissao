-- Curtidas e comentários nas mensagens do mural e nos eventos da agenda.
-- Cada pessoa curte um item uma única vez (a chave primária impede repetir).
-- Ao excluir a mensagem ou o evento, as curtidas e os comentários dele também são excluídos.
CREATE TABLE mensagens_curtidas (
  mensagem_id INT UNSIGNED NOT NULL,
  usuario_id  INT UNSIGNED NOT NULL,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (mensagem_id, usuario_id),
  KEY idx_mensagens_curtidas_usuario (usuario_id),
  CONSTRAINT fk_mensagens_curtidas_mensagem FOREIGN KEY (mensagem_id) REFERENCES mensagens (id) ON DELETE CASCADE,
  CONSTRAINT fk_mensagens_curtidas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE mensagens_comentarios (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mensagem_id INT UNSIGNED NOT NULL,
  autor_id    INT UNSIGNED NOT NULL,
  conteudo    VARCHAR(500) NOT NULL,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mensagens_comentarios (mensagem_id, criado_em),
  CONSTRAINT fk_mensagens_comentarios_mensagem FOREIGN KEY (mensagem_id) REFERENCES mensagens (id) ON DELETE CASCADE,
  CONSTRAINT fk_mensagens_comentarios_autor FOREIGN KEY (autor_id) REFERENCES usuarios (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE eventos_curtidas (
  evento_id  INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  criado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (evento_id, usuario_id),
  KEY idx_eventos_curtidas_usuario (usuario_id),
  CONSTRAINT fk_eventos_curtidas_evento FOREIGN KEY (evento_id) REFERENCES eventos (id) ON DELETE CASCADE,
  CONSTRAINT fk_eventos_curtidas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE eventos_comentarios (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  evento_id INT UNSIGNED NOT NULL,
  autor_id  INT UNSIGNED NOT NULL,
  conteudo  VARCHAR(500) NOT NULL,
  criado_em DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_eventos_comentarios (evento_id, criado_em),
  CONSTRAINT fk_eventos_comentarios_evento FOREIGN KEY (evento_id) REFERENCES eventos (id) ON DELETE CASCADE,
  CONSTRAINT fk_eventos_comentarios_autor FOREIGN KEY (autor_id) REFERENCES usuarios (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

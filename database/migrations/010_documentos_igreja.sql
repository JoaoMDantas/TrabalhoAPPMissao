-- Documentos que a liderança disponibiliza só para quem faz parte da igreja (PDF, Office ou imagem, até 10 MB).
-- O arquivo fica no próprio banco: o disco do servidor na nuvem é apagado a cada publicação.
CREATE TABLE documentos_igreja (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  igreja_id    INT UNSIGNED NOT NULL,
  titulo       VARCHAR(150) NOT NULL,
  descricao    VARCHAR(500) NULL,
  nome_arquivo VARCHAR(200) NOT NULL,
  tipo_mime    VARCHAR(120) NOT NULL,
  grupo        VARCHAR(20)  NOT NULL,
  tamanho      INT UNSIGNED NOT NULL,
  conteudo     LONGBLOB     NOT NULL,
  criado_por   INT UNSIGNED NOT NULL,
  criado_em    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_documentos_igreja (igreja_id, criado_em),
  CONSTRAINT fk_documentos_igreja FOREIGN KEY (igreja_id) REFERENCES igrejas (id) ON DELETE CASCADE,
  CONSTRAINT fk_documentos_criado_por FOREIGN KEY (criado_por) REFERENCES usuarios (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

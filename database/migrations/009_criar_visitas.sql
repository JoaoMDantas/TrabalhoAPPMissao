-- Visitas e ações de evangelismo marcadas no mapa (objetivo 3: mapeamento das áreas visitadas).
-- Por privacidade, não há campos para nome, telefone ou foto dos moradores: só o local, o tipo, a situação
-- da visita, a data, quantas pessoas foram alcançadas e observações gerais.
CREATE TABLE visitas (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo               ENUM('evangelismo', 'acompanhamento', 'oracao', 'acao_social', 'outro') NOT NULL DEFAULT 'evangelismo',
  situacao           ENUM('realizada', 'retornar', 'ausente') NOT NULL DEFAULT 'realizada',
  data_visita        DATE              NOT NULL,
  latitude           DECIMAL(9, 6)     NOT NULL,
  longitude          DECIMAL(9, 6)     NOT NULL,
  pessoas_alcancadas SMALLINT UNSIGNED NULL,
  observacoes        VARCHAR(500)      NULL,
  igreja_id          INT UNSIGNED      NULL,
  criado_por         INT UNSIGNED      NOT NULL,
  criado_em          DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_visitas_data (data_visita),
  KEY idx_visitas_situacao (situacao),
  CONSTRAINT fk_visitas_igreja FOREIGN KEY (igreja_id) REFERENCES igrejas (id) ON DELETE SET NULL,
  CONSTRAINT fk_visitas_criado_por FOREIGN KEY (criado_por) REFERENCES usuarios (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

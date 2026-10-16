-- Igrejas locais atendidas pelo projeto.
CREATE TABLE igrejas (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(120) NOT NULL,
  cidade        VARCHAR(80)  NOT NULL,
  bairro        VARCHAR(80)  NOT NULL,
  endereco      VARCHAR(200) NULL,
  telefone      VARCHAR(20)  NULL,
  email         VARCHAR(120) NULL,
  criado_por    INT UNSIGNED NULL,
  criado_em     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_igrejas_bairro (bairro),
  CONSTRAINT fk_igrejas_criado_por FOREIGN KEY (criado_por) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Igreja de origem do usuário. Se a igreja for excluída, o usuário continua existindo sem vínculo.
ALTER TABLE usuarios
  ADD CONSTRAINT fk_usuarios_igreja FOREIGN KEY (igreja_id) REFERENCES igrejas (id) ON DELETE SET NULL;

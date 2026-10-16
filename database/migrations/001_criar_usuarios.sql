-- Usuários do aplicativo: missionários, líderes de igreja e administradores.
-- A chave estrangeira para igrejas é criada na migration 002 (a tabela ainda não existe aqui).
CREATE TABLE usuarios (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome           VARCHAR(120) NOT NULL,
  email          VARCHAR(120) NOT NULL,
  senha_hash     VARCHAR(100) NOT NULL,
  telefone       VARCHAR(20)  NULL,
  papel          ENUM('admin', 'lider', 'missionario') NOT NULL DEFAULT 'missionario',
  igreja_id      INT UNSIGNED NULL,
  bairro_atuacao VARCHAR(80)  NULL,
  sobre          VARCHAR(500) NULL,
  ativo          TINYINT(1)   NOT NULL DEFAULT 1,
  criado_em      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_usuarios_email (email),
  KEY idx_usuarios_papel (papel),
  KEY idx_usuarios_bairro (bairro_atuacao)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

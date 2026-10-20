-- Registro do momento em que a pessoa aceitou o aviso de privacidade no cadastro (LGPD).
ALTER TABLE usuarios
  ADD COLUMN aceitou_termos_em DATETIME NULL AFTER ativo;

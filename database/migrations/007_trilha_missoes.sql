-- Trilha focada em missões e evangelismo: saem as cartilhas de segurança digital (CERT.br) da curadoria inicial
-- e entram PDFs oficiais da Junta de Missões Nacionais (links conferidos em outubro de 2026).
-- Só altera materiais da curadoria (criado_por nulo); o que os líderes adicionaram é preservado.
DELETE FROM materiais
WHERE criado_por IS NULL
  AND (url LIKE 'https://cartilha.cert.br/%' OR url = 'https://www.youtube.com/watch?v=5QZRsH7vg5g');

UPDATE materiais SET etapa = '2. Missões e evangelismo'
WHERE criado_por IS NULL AND etapa = '3. Missões e evangelismo';

UPDATE materiais SET ordem = 5 WHERE criado_por IS NULL AND url = 'https://www.youtube.com/watch?v=0aRd2ipJ568';
UPDATE materiais SET ordem = 6 WHERE criado_por IS NULL AND url = 'https://missoesnacionais.org.br/evangelizacao/';
UPDATE materiais SET ordem = 7 WHERE criado_por IS NULL AND url = 'https://unimissoes.missoesnacionais.org.br/';

INSERT INTO materiais (titulo, descricao, tipo, url, etapa, ordem) VALUES
  ('Revista de evangelização',
   'Revista da Junta de Missões Nacionais com orientações para compartilhar o evangelho no dia a dia.',
   'pdf', 'https://missoesnacionais.org.br/wp-content/uploads/2022/06/Revista-Evangelizacao01.pdf',
   '2. Missões e evangelismo', 2),
  ('Cartão alvo de oração',
   'Cartão para anotar as pessoas por quem orar e com quem compartilhar o evangelho.',
   'pdf', 'https://missoesnacionais.org.br/wp-content/uploads/2022/08/Cartao-Alvo-de-Oracao-em-PDF.pdf',
   '2. Missões e evangelismo', 3),
  ('A Seleção de Jesus',
   'Revista evangelística da Junta de Missões Nacionais para entregar nas visitas.',
   'pdf', 'https://missoesnacionais.org.br/wp-content/uploads/2022/09/A-SELECAO-DE-JESUS-Revista-2022-final-v7-1.pdf',
   '2. Missões e evangelismo', 4),
  ('Revista da Campanha de Missões Nacionais 2026',
   'Revista completa da campanha "Para que todo o Brasil ouça".',
   'pdf', 'https://drive.google.com/file/d/1qNj2aMNBZSEXUzJea8M7OWiWbRIC9z_X/view',
   '3. Campanha de Missões Nacionais 2026', 1),
  ('21 dias de oração',
   'Roteiro de oração da Campanha de Missões Nacionais 2026.',
   'pdf', 'https://drive.google.com/file/d/14V8TlAYL3wONVsayB9QIReTNJyc1Nenr/view',
   '3. Campanha de Missões Nacionais 2026', 2),
  ('Sermões e roteiros de pequenos grupos',
   'Sermões e roteiros de PGM da Campanha de Missões Nacionais 2026.',
   'pdf', 'https://drive.google.com/file/d/1yKtnQj0ixy_brURmWlBx3B443RBGiyNl/view',
   '3. Campanha de Missões Nacionais 2026', 3),
  ('Esboço de sermão: Para que todo o Brasil ouça',
   'Esboço de sermão em Romanos 10.13-14, da Campanha de Missões Nacionais 2026.',
   'pdf', 'https://drive.google.com/file/d/1KdyJxkJlR_pSPbiE3QDbrwjiPWyIArr9/view',
   '3. Campanha de Missões Nacionais 2026', 4);

-- Localização das igrejas no mapa, em graus decimais (6 casas: precisão de cerca de 10 cm).
ALTER TABLE igrejas
  ADD COLUMN latitude  DECIMAL(9, 6) NULL AFTER endereco,
  ADD COLUMN longitude DECIMAL(9, 6) NULL AFTER latitude;

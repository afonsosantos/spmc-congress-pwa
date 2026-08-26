-- Placeholder content. Replace with real congress information before launch.
INSERT INTO content_pages (slug, title, body) VALUES
  ('about', 'Sobre o Congresso', '[Conteúdo placeholder] O II Congresso Internacional de Medicina Chinesa reúne profissionais e estudantes para partilhar conhecimento e boas práticas.'),
  ('venue', 'Local', '[Conteúdo placeholder] O congresso decorrerá num local a anunciar.'),
  ('directions', 'Como Chegar', '[Conteúdo placeholder] Informação sobre acessos, transportes públicos e estacionamento será disponibilizada brevemente.'),
  ('parking', 'Estacionamento', '[Conteúdo placeholder] Informação sobre estacionamento será disponibilizada brevemente.'),
  ('accommodation', 'Alojamento', '[Conteúdo placeholder] Sugestões de alojamento próximo do local do congresso serão disponibilizadas brevemente.'),
  ('food', 'Alimentação', '[Conteúdo placeholder] Informação sobre refeições e pausas para café será disponibilizada brevemente.'),
  ('sponsors', 'Patrocinadores', '[Conteúdo placeholder] Lista de patrocinadores a anunciar.'),
  ('committee', 'Comissão Organizadora', '[Conteúdo placeholder] Lista da comissão organizadora a anunciar.'),
  ('contacts', 'Contactos', '[Conteúdo placeholder] Email: geral@congresso-spmc.com'),
  ('privacy', 'Política de Privacidade',
   '[Conteúdo placeholder] Esta aplicação processa dados pessoais dos participantes exclusivamente para fins de identificação e personalização do programa do congresso. Os dados de inscrição são geridos pela SPMC através da plataforma Pretix. Pode solicitar o apagamento dos seus dados a qualquer momento contactando geral@congresso-spmc.com.'),
  ('terms', 'Termos e Condições', '[Conteúdo placeholder] Termos e condições de utilização da aplicação a definir.')
ON CONFLICT (slug) DO NOTHING;

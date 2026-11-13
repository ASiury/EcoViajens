# Doce Afeto — compotas e geleias regionais

Loja demonstrativa responsiva para venda de compotas e geleias caseiras feitas com frutas regionais, como cupuaçu, buriti e taperebá. Feita em HTML, CSS e JavaScript sem build ou dependências obrigatórias.

## Apresentação do negócio

- **Marca:** Doce Afeto.
- **Segmento:** alimentos artesanais, compotas e geleias de frutas regionais.
- **Público-alvo:** pessoas em Rio Branco e região que procuram sabores amazônicos, produtos caseiros e presentes com identidade regional.
- **Proposta de valor:** compotas e geleias caseiras em pequenos lotes, valorizando frutas regionais e receitas de família.
- **Tipologia:** vitrine de e-commerce B2C com catálogo, carrinho e checkout demonstrativo.


## Funcionalidades implementadas

- Catálogo responsivo de geleias, compotas e kits, com busca, filtros por categoria e faixa de preço, além de ordenação por preço.
- Carrinho persistido no navegador, ajuste de quantidades, remoção de produtos, cupom demonstrativo `AFETO10` e resumo em tempo real de subtotal, descontos e frete estimado.
- Consulta demonstrativa de frete por CEP: R$ 12 na zona urbana de Rio Branco, R$ 20 na zona rural e R$ 30 em Bujari, Senador Guiomard, Porto Acre, Plácido de Castro, Sena Madureira e Capixaba. O cliente seleciona a zona urbana ou rural em Rio Branco; o checkout valida CEPs do Acre (faixa 699) e não permite entregas em outros estados ou cidades fora da área atendida.
- Checkout em etapas, disponível somente com uma conta demonstrativa autenticada: endereço/CEP, frete por região, Pix/cartão/carteira simulados, revisão de itens e valores, aceite e confirmação com número de pedido. Pix mostra um QR e um código textual fictícios, com opção de copiar o texto; nenhum deles é pagável. Frete grátis a partir de R$ 180; cupom `AFETO10` dá 10% e Pix mais 5% (ambos ilustrativos). Nenhuma cobrança, pagamento ou e-mail é processado; não informar dados de pagamento reais.
- Após a confirmação, é exibida uma prévia local de NF-e de produtos e um exemplo separado de NFS-e, ambos sem validade fiscal e sem transmissão à SEFAZ ou prefeitura.
- Criação de conta e login, edição de nome/e-mail, alteração de senha e edição do endereço completo (CEP, rua, número, complemento, cidade/UF e zona urbana/rural) neste navegador, além do histórico de pedidos. A senha é armazenada com hash PBKDF2 e salt no armazenamento local; a conta não tem servidor nem sincroniza entre dispositivos.
- História da marca, seção de dicas, banner de indicação demonstrativo, FAQ, atendimento e políticas no rodapé.
- Widget de atendimento automático com respostas predefinidas sobre frete, pagamentos, cupons, conta e pedidos. A conversa funciona apenas na página, não é salva nem enviada a um atendente.
- Links para compartilhar a página pelo WhatsApp, Facebook e X; imagens abaixo da primeira dobra carregam sob demanda.
- CTA de criação de conta na oferta; CNPJ e contatos comerciais são fictícios e identificados como tal na página.
- Aviso de consentimento: analytics só é carregado depois do aceite; recusar mantém o carrinho e recursos essenciais.

## Marketing digital e 4Ps

- **Atração/SEO:** título, descrição, imagens Open Graph/Twitter Card, URL canonical, links de compartilhamento, `robots.txt`, `sitemap.xml`, conteúdo textual indexável, navegação por seções, dicas e catálogo. Campanhas de e-mail, redes sociais e mídia paga são canais planejados, não integrações de envio ativas.
- **Produto:** catálogo com descrição, categoria, peso do pote e campos preparados para suas imagens.
- **Preço:** preço por pote/kit e desconto ilustrativo de 5% no Pix.
- **Praça:** site responsivo previsto para acesso 24/7 em celular e desktop; operação comercial depende de hospedagem e logística reais.
- **Promoção:** cupom de primeira compra, CTA de cadastro e banner de indicação apresentados como demonstrações; nenhuma campanha ou programa de indicação está ativo.

## Estratégia e operação

Modelo B2C direto ao consumidor, com produção sob encomenda e foco local. Parceiros planejados: provedor de hospedagem, gateway de pagamento (por exemplo, Mercado Pago em sandbox), transportadora/entregador local, plataforma de e-mail e sistema fiscal. Não há integração ativa com esses parceiros nesta versão.

O fluxo financeiro previsto é criar uma preferência de pagamento no gateway e confirmar o status por retorno/webhook seguro. Pix, cartões e carteiras digitais são apenas opções simuladas na interface; não inserir dados bancários. Após a confirmação, o backend de produção integraria o pedido ao emissor fiscal para emitir NF-e/NFS-e e enviar o documento ao cliente.

O e-CRM inclui conta demonstrativa, dados de perfil, endereço e histórico de pedidos guardados localmente, além de canais de contato e formulário de captação. Cadastro, sessão e pedidos só existem neste navegador; não há recuperação de senha, autenticação de servidor, sincronização, atendimento humano ou e-mails de confirmação/pós-venda. O chat automatizado responde apenas a perguntas frequentes predefinidas, sem serviço externo. Para uma loja real, mover identidade e dados para backend seguro e integrar provedores de identidade e comunicação.

Frete nesta versão é uma estimativa fixa ilustrativa. Em produção, integrar API de cotação/rastreamento e validar CEP/endereço. A política exibida informa o direito de arrependimento de 7 dias para compras online, conforme legislação aplicável; implementar atendimento e processo real antes de vender.

## Google Analytics 4 e métricas

- **Measurement ID presente no código:** `G-BMBTCY4ZDR` (herdado da configuração anterior do projeto; confirme que a propriedade GA4 pertence ao responsável pela entrega antes de publicar).
- O script do GA4 só é inserido após aceite de cookies analíticos.
- Eventos enviados quando há consentimento: `page_view` (configuração GA4), `view_item_list`, `add_to_cart`, `view_cart`, `coupon_applied`, `calculate_shipping`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `purchase` (pedido simulado) e `generate_lead`.
- Relatórios de páginas, usuários, tempo médio de engajamento e canais ficam disponíveis no GA4 depois que houver tráfego consentido. Os dados podem levar algum tempo para aparecer; usar DebugView/Realtime para conferir a propriedade.
- Este repositório não contém capturas de tela nem evidência de tráfego: precisam ser geradas na conta GA4 após publicação. UTMs em campanhas ajudam a separar tráfego pago, social e e-mail; busca orgânica e tráfego direto são classificados pelo GA4.

## Privacidade, conformidade e limites

O site exibe política de privacidade/cookies, canal de atendimento, informação de entrega, política de trocas/devoluções e referência ao direito de arrependimento. CNPJ e contatos comerciais são fictícios; links de compartilhamento, Google Fonts e Google Analytics (após consentimento) apontam para serviços externos reais. Antes de uma operação real, substitua os dados fictícios, publique uma política revisada pelo responsável, implemente controles LGPD, segurança de backend, confirmação de pedido, pagamento seguro, emissão fiscal e logística. Consentimento analítico é guardado no armazenamento local do navegador.

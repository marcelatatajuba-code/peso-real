/* ============================================================================
   data.js — Base de dados da réplica acadêmica do Barilife.
   Estrutura e nomes de seções seguem o aplicativo real; o conteúdo é fictício.
   Profissionais, estabelecimentos, hospitais e o CPF de exemplo são inventados.
   ========================================================================== */
window.DB = {

  /* ---- Perfil de demonstração -------------------------------------------
     Pessoa fictícia, para quem quiser só espiar o aplicativo antes de criar
     a própria conta. O CPF tem dígitos verificadores válidos, mas não
     pertence a ninguém. Quem se cadastra preenche os próprios dados e a
     própria foto, que ficam salvos apenas no aparelho.                      */
  perfilDemo: {
    nome: 'Ana Paula Ribeiro Costa',
    email: 'ana.paula@exemplo.com.br',
    cpf: '111.444.777-35',
    nascimento: '1994-07-21',
    sexo: 'Feminino',
    telefone: '(11) 98765-4321',
    cidade: 'São Paulo',
    uf: 'SP',
    foto: null,

    jaFezCirurgia: true,
    peso: 78,
    altura: 158,
    pesoInicial: 125,
    cirurgia: 'Bypass / Gastroplastia em "Y de Roux"',
    mesCirurgia: '11/2019',
    hospital: 'Hospital e Maternidade Vitória',
    hospitalCidade: 'São Paulo – SP',
    cirurgiao: 'Dra. Helena Marques Vidal',
    crm: 'CRM-SP 118342',

    status: 'validada',
    validadaEm: '2019-12-05'
  },

  tiposCirurgia: [
    'Bypass / Gastroplastia em "Y de Roux"',
    'Sleeve / Gastrectomia Vertical',
    'Banda Gástrica Ajustável',
    'Switch Duodenal',
    'Cirurgia Revisional',
    'Balão Intragástrico'
  ],

  sexos: ['Feminino', 'Masculino', 'Outro', 'Prefiro não informar'],

  ufs: ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'DF', 'GO', 'ES', 'PA', 'AM'],

  /* ---- Documentos enviados (tela "Visualizar documentos enviados") ------ */
  documentos: [
    { id: 'd1', nome: 'Relatório cirúrgico', arquivo: 'relatorio-cirurgico.pdf', data: '2019-11-28', status: 'aprovado' },
    { id: 'd2', nome: 'Documento com foto',  arquivo: 'rg-frente-verso.pdf',    data: '2019-11-28', status: 'aprovado' },
    { id: 'd3', nome: 'Comprovante de endereço', arquivo: 'conta-luz.pdf',      data: '2019-11-30', status: 'aprovado' }
  ],

  /* ---- Rede Amiga (rede de descontos) ----------------------------------- */
  categorias: [
    { id: 'todos',       rotulo: 'Todos',        icone: '◍' },
    { id: 'restaurante', rotulo: 'Restaurantes', icone: '🍽️' },
    { id: 'academia',    rotulo: 'Academias',    icone: '🏋️' },
    { id: 'farmacia',    rotulo: 'Farmácias',    icone: '💊' },
    { id: 'suplemento',  rotulo: 'Suplementos',  icone: '🥤' },
    { id: 'roupa',       rotulo: 'Roupas',       icone: '👗' },
    { id: 'clinica',     rotulo: 'Clínicas',     icone: '🩺' }
  ],

  parceiros: [
    { id: 'p1', nome: 'Cantina Nova Fase', categoria: 'restaurante', desconto: 50,
      regra: 'Meia porção pelo preço de meia — pratos à la carte e rodízio.',
      bairro: 'Pinheiros', cidade: 'São Paulo', uf: 'SP', km: 1.2, nota: 4.8,
      cupom: 'BARI50NF', detalhe: 'Apresente a carteirinha digital antes de fechar a conta. Válido para o paciente e 1 acompanhante, de segunda a sexta.' },
    { id: 'p2', nome: 'Rodízio Terra Boa', categoria: 'restaurante', desconto: 40,
      regra: 'Porção bariátrica com 40% de desconto no rodízio.',
      bairro: 'Moema', cidade: 'São Paulo', uf: 'SP', km: 3.4, nota: 4.6,
      cupom: 'BARITB40', detalhe: 'Desconto aplicado apenas sobre o valor do rodízio. Bebidas não inclusas.' },
    { id: 'p3', nome: 'Studio Corpo Ativo', categoria: 'academia', desconto: 35,
      regra: '35% off na mensalidade + avaliação física gratuita.',
      bairro: 'Vila Mariana', cidade: 'São Paulo', uf: 'SP', km: 2.1, nota: 4.9,
      cupom: 'BARIATIVO', detalhe: 'Desconto válido em planos trimestrais ou superiores. Avaliação com educador físico especializado em pós-bariátrico.' },
    { id: 'p4', nome: 'Academia Movimento 24h', categoria: 'academia', desconto: 25,
      regra: 'Isenção de matrícula e 25% na mensalidade.',
      bairro: 'Tatuapé', cidade: 'São Paulo', uf: 'SP', km: 6.8, nota: 4.4,
      cupom: 'BARIMOV25', detalhe: 'Acesso a todas as unidades da rede. Necessário apresentar a carteirinha na recepção.' },
    { id: 'p5', nome: 'Drogaria Bem Viver', categoria: 'farmacia', desconto: 30,
      regra: '30% em vitaminas e suplementos de linha bariátrica.',
      bairro: 'Perdizes', cidade: 'São Paulo', uf: 'SP', km: 4.0, nota: 4.7,
      cupom: 'BARIBV30', detalhe: 'Desconto não cumulativo com outras promoções. Válido também no site com o mesmo cupom.' },
    { id: 'p6', nome: 'Farmácia Fórmula Viva', categoria: 'farmacia', desconto: 20,
      regra: '20% em fórmulas manipuladas com receita.',
      bairro: 'Santana', cidade: 'São Paulo', uf: 'SP', km: 8.3, nota: 4.5,
      cupom: 'BARIFV20', detalhe: 'Necessária prescrição do cirurgião ou nutricionista cadastrado.' },
    { id: 'p7', nome: 'Proteína & Cia', categoria: 'suplemento', desconto: 45,
      regra: '45% na primeira compra de whey e colágeno.',
      bairro: 'Itaim Bibi', cidade: 'São Paulo', uf: 'SP', km: 5.2, nota: 4.8,
      cupom: 'BARIPC45', detalhe: 'Primeira compra por CPF. Frete grátis acima de R$ 150 para a região metropolitana.' },
    { id: 'p8', nome: 'NutriBari Store', categoria: 'suplemento', desconto: 30,
      regra: '30% em toda a linha de multivitamínicos bariátricos.',
      bairro: 'Online', cidade: 'Entrega nacional', uf: '—', km: 0, nota: 4.6,
      cupom: 'BARINB30', detalhe: 'Cupom aplicável no checkout do site parceiro. Um uso por mês.' },
    { id: 'p9', nome: 'Ateliê Novo Manequim', categoria: 'roupa', desconto: 40,
      regra: '40% em ajustes e reformas de roupas.',
      bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP', km: 2.9, nota: 5.0,
      cupom: 'BARIAJUSTE', detalhe: 'Pensado para quem está mudando de manequim durante o pós-operatório. Até 5 peças por visita.' },
    { id: 'p10', nome: 'Loja Recomeço Moda', categoria: 'roupa', desconto: 25,
      regra: '25% na coleção completa.',
      bairro: 'Santo Amaro', cidade: 'São Paulo', uf: 'SP', km: 9.6, nota: 4.3,
      cupom: 'BARIREC25', detalhe: 'Desconto não válido sobre itens já em liquidação.' },
    { id: 'p11', nome: 'Clínica Nutrir Bariátrica', categoria: 'clinica', desconto: 35,
      regra: '35% nas consultas de nutrição e acompanhamento.',
      bairro: 'Jardins', cidade: 'São Paulo', uf: 'SP', km: 3.7, nota: 4.9,
      cupom: 'BARINUT35', detalhe: 'Consultas presenciais ou por telemedicina. Agendamento pelo próprio aplicativo.' },
    { id: 'p12', nome: 'Espaço Psico Bari', categoria: 'clinica', desconto: 30,
      regra: '30% em terapia individual e grupos de apoio.',
      bairro: 'Higienópolis', cidade: 'São Paulo', uf: 'SP', km: 3.1, nota: 4.8,
      cupom: 'BARIPSI30', detalhe: 'Grupo de apoio gratuito para portadores da carteirinha, toda quarta-feira às 19h.' },
    { id: 'p13', nome: 'Laboratório Exame Certo', categoria: 'clinica', desconto: 20,
      regra: '20% no painel completo de exames pós-bariátricos.',
      bairro: 'Consolação', cidade: 'São Paulo', uf: 'SP', km: 2.4, nota: 4.5,
      cupom: 'BARIEXAME', detalhe: 'Inclui hemograma, ferritina, B12, vitamina D e PTH. Resultado em até 48h.' },
    { id: 'p14', nome: 'Bistrô Porção Certa', categoria: 'restaurante', desconto: 30,
      regra: '30% no menu executivo em porções reduzidas.',
      bairro: 'Copacabana', cidade: 'Rio de Janeiro', uf: 'RJ', km: 0, nota: 4.7,
      cupom: 'BARIPC30', detalhe: 'Cardápio elaborado com nutricionista. Válido no almoço, de terça a domingo.' },
    { id: 'p15', nome: 'Vida Leve Academia', categoria: 'academia', desconto: 30,
      regra: '30% off + aula experimental de hidroginástica.',
      bairro: 'Savassi', cidade: 'Belo Horizonte', uf: 'MG', km: 0, nota: 4.6,
      cupom: 'BARIVL30', detalhe: 'Modalidades de baixo impacto recomendadas para os primeiros meses de pós-operatório.' }
  ],

  /* ---- Locais e profissionais (aba "Locais" / "Perto de você") ----------- */
  locais: [
    { id: 'm1', nome: 'Dra. Helena Marques Vidal', esp: 'Cirurgia Bariátrica e Metabólica', tipo: 'medico',
      crm: 'CRM-SP 118342', cidade: 'São Paulo', uf: 'SP', local: 'Hospital e Maternidade Vitória',
      km: 4.2, nota: 4.9, avaliacoes: 312, titulo: 'Membro titular · Sua cirurgiã',
      atende: ['Presencial', 'Telemedicina'], meu: true },
    { id: 'm2', nome: 'Dr. Ricardo Sampaio Leão', esp: 'Cirurgia Bariátrica e Metabólica', tipo: 'medico',
      crm: 'CRM-SP 92004', cidade: 'São Paulo', uf: 'SP', local: 'Instituto Metabólico Paulista',
      km: 6.9, nota: 4.8, avaliacoes: 244, titulo: 'Membro titular', atende: ['Presencial'] },
    { id: 'm3', nome: 'Dra. Ana Beatriz Nogueira', esp: 'Nutrição Bariátrica', tipo: 'equipe',
      crm: 'CRN-3 27811', cidade: 'São Paulo', uf: 'SP', local: 'Clínica Nutrir Bariátrica',
      km: 3.7, nota: 5.0, avaliacoes: 189, titulo: 'Nutricionista credenciada', atende: ['Presencial', 'Telemedicina'] },
    { id: 'm4', nome: 'Dr. Paulo Henrique Freitas', esp: 'Endocrinologia', tipo: 'equipe',
      crm: 'CRM-SP 74522', cidade: 'Campinas', uf: 'SP', local: 'Centro Endócrino Campinas',
      km: 92.0, nota: 4.7, avaliacoes: 156, titulo: 'Endocrinologista credenciado', atende: ['Presencial'] },
    { id: 'm5', nome: 'Dra. Luiza Kondo Ferraz', esp: 'Psicologia Bariátrica', tipo: 'equipe',
      crm: 'CRP-06 145322', cidade: 'São Paulo', uf: 'SP', local: 'Espaço Psico Bari',
      km: 3.1, nota: 4.9, avaliacoes: 203, titulo: 'Psicóloga credenciada', atende: ['Telemedicina'] },
    { id: 'm6', nome: 'Hospital e Maternidade Vitória', esp: 'Hospital credenciado', tipo: 'hospital',
      crm: '', cidade: 'São Paulo', uf: 'SP', local: 'Centro cirúrgico bariátrico',
      km: 4.2, nota: 4.6, avaliacoes: 890, titulo: 'Hospital do seu procedimento', atende: ['Presencial'] },
    { id: 'm7', nome: 'Dr. Marcelo Andrade Pinto', esp: 'Cirurgia Bariátrica e Metabólica', tipo: 'medico',
      crm: 'CRM-RJ 52310', cidade: 'Rio de Janeiro', uf: 'RJ', local: 'Hospital Baía Azul',
      km: 0, nota: 4.8, avaliacoes: 278, titulo: 'Membro titular', atende: ['Presencial', 'Telemedicina'] },
    { id: 'm8', nome: 'Dra. Cristina Vasques Rocha', esp: 'Cirurgia Bariátrica e Metabólica', tipo: 'medico',
      crm: 'CRM-MG 41022', cidade: 'Belo Horizonte', uf: 'MG', local: 'Clínica Vida Metabólica',
      km: 0, nota: 4.7, avaliacoes: 131, titulo: 'Membro titular', atende: ['Presencial'] },
    { id: 'm9', nome: 'Dra. Sofia Bianchi Alencar', esp: 'Nutrição Bariátrica', tipo: 'equipe',
      crm: 'CRN-2 8921', cidade: 'Porto Alegre', uf: 'RS', local: 'Núcleo Nutri Sul',
      km: 0, nota: 4.9, avaliacoes: 142, titulo: 'Nutricionista credenciada', atende: ['Telemedicina'] },
    { id: 'm10', nome: 'Laboratório Exame Certo', esp: 'Laboratório credenciado', tipo: 'hospital',
      crm: '', cidade: 'São Paulo', uf: 'SP', local: 'Painel de exames pós-bariátricos',
      km: 2.4, nota: 4.5, avaliacoes: 76, titulo: 'Parceiro da Rede Amiga', atende: ['Presencial'] }
  ],

  /* ---- COESAS — equipe multidisciplinar do paciente --------------------- */
  coesas: ['m1', 'm3', 'm5', 'm4'],

  /* ---- Mídias (dicas, receitas, artigos, vídeos) ------------------------ */
  midias: [
    { id: 'c1', tipo: 'dica', titulo: 'A regra dos 30 minutos para líquidos',
      resumo: 'Por que não beber água durante as refeições muda tudo no pós-operatório.',
      tempo: '3 min', emoji: '💧', cor: '#2F80D8',
      texto: 'Depois da cirurgia, o estômago tem capacidade muito reduzida. Beber líquido junto com a comida ocupa o espaço que deveria ser da proteína e ainda acelera o esvaziamento gástrico, o que faz a fome voltar mais cedo.\n\nA orientação da maioria das equipes é simples: pare de beber 30 minutos antes de comer e só volte a beber 30 minutos depois de terminar a refeição.\n\nNo resto do dia, beba em pequenos goles e de forma constante. Tomar 200 ml de uma vez costuma causar desconforto nos primeiros meses.\n\nSinais de que você está bebendo pouco: urina escura, dor de cabeça no fim da tarde, boca seca e cansaço sem motivo.' },
    { id: 'c2', tipo: 'dica', titulo: 'Proteína primeiro, sempre',
      resumo: 'Como montar o prato para bater a meta diária com um estômago pequeno.',
      tempo: '4 min', emoji: '🍗', cor: '#C4703A',
      texto: 'A meta de proteína no pós-bariátrico costuma ficar entre 60 g e 90 g por dia, definida pela sua equipe. Com pouco espaço no estômago, a ordem em que você come importa.\n\nComece sempre pela proteína. Só depois vá para os legumes e, por último, o carboidrato — se ainda houver espaço.\n\nFontes que costumam ser bem toleradas: ovo, frango desfiado, peixe, queijo branco, iogurte natural e whey isolado.\n\nMastigue até a comida virar quase um purê. A regra prática é de 20 a 30 mastigadas por garfada.' },
    { id: 'c3', tipo: 'receita', patrocinado: true, titulo: 'Creme de abóbora com frango desfiado',
      resumo: '18 g de proteína por porção, textura macia, ideal para a fase pastosa.',
      tempo: '25 min', emoji: '🥣', cor: '#D98324',
      texto: 'Rende 4 porções · 18 g de proteína por porção\n\nIngredientes\n• 400 g de abóbora cabotiá em cubos\n• 200 g de peito de frango cozido e desfiado\n• 1/2 cebola pequena\n• 1 dente de alho\n• 300 ml de caldo de legumes sem sal adicionado\n• Sal, cúrcuma e pimenta-do-reino a gosto\n\nModo de preparo\n1. Refogue a cebola e o alho em um fio de azeite.\n2. Junte a abóbora e o caldo. Cozinhe por 15 minutos, até desmanchar.\n3. Bata no liquidificador até ficar bem liso.\n4. Volte à panela, acrescente o frango desfiado e ajuste os temperos.\n\nDica: congele em porções de 150 ml. Na fase pastosa, essa é a medida que costuma caber confortavelmente.' },
    { id: 'c4', tipo: 'receita', titulo: 'Panqueca proteica de 3 ingredientes',
      resumo: 'Café da manhã rápido com 22 g de proteína e sem farinha.',
      tempo: '10 min', emoji: '🥞', cor: '#B5573F',
      texto: 'Rende 1 porção · 22 g de proteína\n\nIngredientes\n• 1 ovo inteiro + 1 clara\n• 1 scoop de whey isolado sem sabor ou baunilha\n• 2 colheres de sopa de iogurte natural desnatado\n\nModo de preparo\n1. Misture tudo com um garfo até ficar homogêneo.\n2. Aqueça uma frigideira antiaderente em fogo baixo.\n3. Despeje a massa e tampe por 2 minutos. Vire e deixe mais 1 minuto.\n\nSirva com uma colher de pasta de amendoim integral ou frutas vermelhas. Evite mel e geleias açucaradas nos primeiros meses — risco de síndrome de dumping.' },
    { id: 'c5', tipo: 'artigo', titulo: 'Síndrome de dumping: o que é e como evitar',
      resumo: 'Enjoo, suor frio e taquicardia depois de comer doce têm explicação.',
      tempo: '6 min', emoji: '⚠️', cor: '#B4453C',
      texto: 'A síndrome de dumping acontece quando o alimento — em especial açúcar e gordura — chega rápido demais ao intestino delgado. É mais comum após o bypass gástrico, mas também pode ocorrer no sleeve.\n\nDumping precoce (10 a 30 minutos após comer): náusea, cólica, diarreia, suor frio, coração acelerado e vontade forte de deitar.\n\nDumping tardio (1 a 3 horas depois): tremor, tontura, fome súbita e confusão — é uma queda de glicose provocada pelo pico de insulina.\n\nComo reduzir o risco\n• Evite açúcar simples, refrigerante e sucos concentrados.\n• Coma devagar e em pequenas quantidades.\n• Separe líquidos das refeições.\n• Aumente proteína e fibra no prato.\n\nSe os episódios forem frequentes, registre o que comeu antes de cada crise e leve o registro à consulta. Esse diário costuma resolver o caso mais rápido do que qualquer exame.' },
    { id: 'c6', tipo: 'artigo', titulo: 'Reganho de peso: os sinais que aparecem antes',
      resumo: 'O reganho raramente começa na balança — começa na rotina.',
      tempo: '7 min', emoji: '📈', cor: '#3B6EA5',
      texto: 'Um certo reganho é esperado: a maior parte das pessoas recupera entre 5% e 10% do peso perdido a partir do segundo ano. O que preocupa é o reganho progressivo e silencioso.\n\nSinais que costumam vir antes da balança subir\n• Voltar a beliscar entre as refeições.\n• Retomar líquidos junto com a comida.\n• Trocar proteína por carboidrato por ser mais fácil de engolir.\n• Parar de tomar as vitaminas.\n• Abandonar o acompanhamento com a equipe.\n\nO que fazer\nVoltar ao básico costuma ser suficiente: proteína primeiro, líquidos separados, três refeições estruturadas e retomada da atividade física. Se o padrão alimentar tiver componente emocional, o acompanhamento psicológico é parte do tratamento, não um extra.\n\nProcure sua equipe antes de o reganho passar de 15%. Quanto mais cedo, mais simples é a correção.' },
    { id: 'c7', tipo: 'artigo', patrocinado: true, titulo: 'Vitaminas para a vida toda: o que e por quê',
      resumo: 'B12, ferro, cálcio e vitamina D não são opcionais depois da cirurgia.',
      tempo: '5 min', emoji: '💊', cor: '#6B4E9E',
      texto: 'A cirurgia bariátrica reduz a superfície de absorção e a acidez do estômago. Isso significa que a suplementação passa a ser permanente, mesmo com uma alimentação impecável.\n\nO essencial\n• Multivitamínico bariátrico: base de tudo, uso diário.\n• Vitamina B12: absorção depende do fator intrínseco produzido pelo estômago. Reposição costuma ser sublingual ou injetável.\n• Ferro: deficiência é a carência mais comum, especialmente em mulheres que menstruam. Tome longe do cálcio e do café.\n• Cálcio (citrato): melhor absorvido que o carbonato em pH baixo. Divida a dose ao longo do dia.\n• Vitamina D: quase sempre baixa antes mesmo da cirurgia.\n\nExames de controle a cada 6 meses no primeiro ano e anualmente depois. Não ajuste dose por conta própria com base em bula ou relato de outro paciente.' },
    { id: 'c8', tipo: 'video', titulo: 'Exercícios seguros nos 3 primeiros meses',
      resumo: 'Sequência de baixo impacto para retomar o movimento sem risco.',
      tempo: '12 min', emoji: '🎬', cor: '#2E7D6B',
      texto: 'Vídeo demonstrativo com um educador físico especializado em pós-bariátrico.\n\nO que a sequência cobre\n1. Caminhada progressiva: da primeira semana ao terceiro mês.\n2. Mobilidade de ombro e quadril sem carga.\n3. Fortalecimento com peso do corpo, sem impacto abdominal.\n4. Respiração diafragmática para recuperação da parede abdominal.\n\nRegra de ouro: nada de abdominais ou carga sobre a cicatriz antes da liberação do cirurgião, normalmente entre 60 e 90 dias.\n\n(Nesta réplica acadêmica o player de vídeo é apenas ilustrativo.)' },
    { id: 'c9', tipo: 'video', titulo: 'Como montar a marmita da semana',
      resumo: 'Porções, congelamento e a ordem certa de montar o pote.',
      tempo: '9 min', emoji: '🎬', cor: '#8A6D3B',
      texto: 'Roteiro do vídeo\n\n• Escolha dos potes: 250 ml a 350 ml resolvem a maior parte das refeições no pós-operatório.\n• Proteína pronta em lote: frango desfiado, patinho moído e ovo cozido.\n• Legumes cozidos no vapor, guardados separados para não amolecerem.\n• Congelar em porções individuais e etiquetar com a data.\n\nMontagem do prato: metade proteína, um terço legumes, o restante carboidrato — nessa ordem de prioridade.\n\n(Nesta réplica acadêmica o player de vídeo é apenas ilustrativo.)' },
    { id: 'c10', tipo: 'dica', titulo: 'Queda de cabelo entre o 3º e o 6º mês',
      resumo: 'É esperada, tem prazo para acabar e existe o que fazer.',
      tempo: '3 min', emoji: '💇', cor: '#7A5C8E',
      texto: 'A queda costuma começar por volta do terceiro mês e se estabilizar entre o sexto e o oitavo. Ela é reflexo da perda rápida de peso e do baixo aporte de proteína, ferro e zinco — não é falha da cirurgia.\n\nO que ajuda de verdade\n• Bater a meta diária de proteína, sem exceção.\n• Manter o multivitamínico e checar ferritina e zinco nos exames.\n• Evitar dietas ainda mais restritivas por conta própria.\n\nO que não resolve sozinho: shampoo, ampola e suplemento de colágeno vendido como solução. O cabelo volta quando a nutrição estabiliza.' }
  ],

  /* ---- Novidades -------------------------------------------------------- */
  novidades: [
    { id: 'n1', data: '2026-08-20', titulo: 'Rede Amiga chega a 1.200 estabelecimentos',
      resumo: 'Novos parceiros em cinco capitais, com destaque para academias e farmácias.',
      texto: 'A Rede Amiga passou de mil estabelecimentos credenciados. Nos últimos três meses entraram academias, farmácias de manipulação e lojas de suplemento em São Paulo, Rio de Janeiro, Belo Horizonte, Recife e Porto Alegre.\n\nPara usar, basta apresentar a carteirinha digital no estabelecimento. O desconto e as regras de cada parceiro aparecem na ficha dentro do aplicativo.' },
    { id: 'n2', data: '2026-08-04', titulo: 'Campanha de exames semestrais',
      resumo: 'Laboratórios parceiros com condição especial no painel pós-bariátrico.',
      texto: 'Durante todo o mês, laboratórios da Rede Amiga oferecem condição especial no painel de exames recomendado para o acompanhamento pós-operatório: hemograma, ferritina, vitamina B12, vitamina D, cálcio e PTH.\n\nLeve o pedido do seu cirurgião ou nutricionista e a carteirinha digital.' },
    { id: 'n3', data: '2026-07-15', titulo: 'Agenda agora aceita lembretes recorrentes',
      resumo: 'Dá para programar retornos que se repetem a cada 3, 6 ou 12 meses.',
      texto: 'A tela de Agenda passou a aceitar alertas recorrentes. Programe uma vez o retorno semestral com a sua equipe e o aplicativo avisa a cada ciclo.\n\nO sistema de alertas de dieta continua separado, no menu, porque tem uma lógica de horários própria ao longo do dia.' }
  ],

  /* ---- Enquetes --------------------------------------------------------- */
  enquetes: [
    { id: 'e1', pergunta: 'Quanto tempo depois da cirurgia você voltou a se exercitar?',
      opcoes: [
        { id: 'a', texto: 'Menos de 1 mês', votos: 412 },
        { id: 'b', texto: 'Entre 1 e 3 meses', votos: 1876 },
        { id: 'c', texto: 'Entre 3 e 6 meses', votos: 934 },
        { id: 'd', texto: 'Ainda não voltei', votos: 288 }
      ] },
    { id: 'e2', pergunta: 'Qual é a sua maior dificuldade hoje no pós-operatório?',
      opcoes: [
        { id: 'a', texto: 'Bater a meta de proteína', votos: 1520 },
        { id: 'b', texto: 'Beber água suficiente', votos: 2104 },
        { id: 'c', texto: 'Lembrar das vitaminas', votos: 1187 },
        { id: 'd', texto: 'Lidar com a fome emocional', votos: 1663 }
      ] }
  ],

  /* ---- Chat com a equipe ------------------------------------------------ */
  chat: [
    { de: 'equipe', autor: 'Dra. Ana Beatriz · Nutrição', hora: '09:12',
      texto: 'Bom dia, Marcela! Vi seu registro de peso da semana. Está tudo dentro do esperado.' },
    { de: 'equipe', autor: 'Dra. Ana Beatriz · Nutrição', hora: '09:13',
      texto: 'Só reforçando: mantenha os líquidos fora das refeições e priorize a proteína no início do prato.' },
    { de: 'eu', autor: 'Você', hora: '09:40',
      texto: 'Bom dia! Consegui manter, mas na sexta senti enjoo depois do almoço.' },
    { de: 'equipe', autor: 'Dra. Ana Beatriz · Nutrição', hora: '10:02',
      texto: 'Anote o que comeu antes do episódio e traga na próxima consulta. Se repetir mais de duas vezes na semana, me avise por aqui.' }
  ],

  /* ---- Alerta de dieta (hidratação + lembretes) ------------------------- */
  lembretesPadrao: [
    { id: 'l1', titulo: 'Multivitamínico bariátrico', tipo: 'vitamina', hora: '08:00', ativo: true, repete: 'Todos os dias' },
    { id: 'l2', titulo: 'Vitamina B12 sublingual',     tipo: 'vitamina', hora: '08:05', ativo: true, repete: 'Todos os dias' },
    { id: 'l3', titulo: 'Ferro (longe do cálcio)',     tipo: 'vitamina', hora: '15:00', ativo: true, repete: 'Todos os dias' },
    { id: 'l4', titulo: 'Cálcio citrato — 2ª dose',    tipo: 'vitamina', hora: '20:00', ativo: false, repete: 'Todos os dias' },
    { id: 'l5', titulo: 'Lanche proteico da tarde',    tipo: 'refeicao', hora: '16:00', ativo: true, repete: 'Dias úteis' }
  ],

  /* ---- Agenda (consultas, retornos e exames) ---------------------------- */
  agendaPadrao: [
    { id: 'a1', titulo: 'Retorno com a Dra. Helena', tipo: 'consulta', data: '2026-09-18', hora: '14:30' },
    { id: 'a2', titulo: 'Coleta de exames semestrais', tipo: 'exame',  data: '2026-10-02', hora: '07:00' }
  ],

  tiposLembrete: {
    vitamina: { rotulo: 'Vitamina',  emoji: '💊', cor: '#6B4E9E' },
    refeicao: { rotulo: 'Refeição',  emoji: '🍽️', cor: '#C4703A' },
    agua:     { rotulo: 'Hidratação',emoji: '💧', cor: '#2F80D8' },
    outro:    { rotulo: 'Outro',     emoji: '🔔', cor: '#8A6D3B' }
  },

  tiposAgenda: {
    consulta: { rotulo: 'Consulta', emoji: '🩺', cor: '#2F80D8' },
    retorno:  { rotulo: 'Retorno',  emoji: '🔁', cor: '#3D74C1' },
    exame:    { rotulo: 'Exame',    emoji: '🧪', cor: '#6B4E9E' },
    cirurgia: { rotulo: 'Cirurgia', emoji: '🏥', cor: '#B4453C' }
  },

  /* ---- FAQ -------------------------------------------------------------- */
  faq: [
    { p: 'Por que o QR Code da carteirinha expira em 10 minutos?',
      r: 'O código é gerado na hora e vale por pouco tempo justamente para não poder ser impresso, fotografado ou repassado. Quem valida precisa ler o código direto da sua tela, o que garante que a carteirinha é sua e está ativa.' },
    { p: 'Quem libera a minha carteirinha?',
      r: 'O cirurgião que realizou o seu procedimento. Ele recebe o seu cadastro, confere os dados e os documentos enviados e libera o acesso. Só pacientes operados por cirurgiões associados à SBCBM têm direito à carteirinha.' },
    { p: 'Como uso os descontos da Rede Amiga?',
      r: 'Abra a carteirinha digital no estabelecimento parceiro e apresente o QR Code antes de fechar a conta. Cada parceiro tem regras próprias, descritas na ficha dele dentro do aplicativo.' },
    { p: 'Perdi o acesso ao meu e-mail. E agora?',
      r: 'Use a opção Trocar senha no menu. Se o e-mail cadastrado não estiver mais acessível, é preciso pedir ao seu cirurgião que atualize o cadastro.' },
    { p: 'O que é o COESAS?',
      r: 'É a comissão de especialidades associadas da SBCBM: nutrição, psicologia, endocrinologia, educação física e enfermagem. No aplicativo, é onde fica a sua equipe multidisciplinar.' },
    { p: 'A diferença entre Agenda e Alerta de dieta',
      r: 'A Agenda guarda compromissos com data marcada — consultas, retornos e exames. O Alerta de dieta cuida da rotina do dia: água, vitaminas e refeições, com horários que se repetem.' }
  ]
};

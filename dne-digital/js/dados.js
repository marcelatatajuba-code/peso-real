/*
 * dados.js — conteúdo fictício usado pela réplica.
 * Nenhuma informação aqui corresponde a pessoas ou contratos reais.
 */
window.DADOS = {

  /* Estudante de demonstração --------------------------------------------- */
  estudanteDemo: {
    nome: 'Ana Beatriz Souza Lima',
    cpf: '123.456.789-09',
    nascimento: '2004-05-12',
    email: 'ana.lima@exemplo.edu.br',
    matricula: '2023104558',
    instituicao: 'Universidade Federal do Paraná',
    curso: 'Ciência da Computação',
    nivel: 'Ensino Superior',
    entidade: 'UNE',
    emissao: '2026-03-14',
    validade: '2027-03-31',
    numero: '4172 9083 5514 2260',
    foto: null,
    creditoTransporte: 42.50
  },

  niveis: ['Ensino Médio', 'Ensino Técnico', 'Ensino Superior', 'Pós-Graduação'],

  entidades: {
    'Ensino Médio': 'UBES',
    'Ensino Técnico': 'UBES',
    'Ensino Superior': 'UNE',
    'Pós-Graduação': 'ANPG'
  },

  instituicoes: [
    'Universidade Federal do Paraná',
    'Universidade de São Paulo',
    'Universidade Estadual de Campinas',
    'Universidade Federal de Minas Gerais',
    'Universidade Federal do Rio de Janeiro',
    'Universidade Federal da Bahia',
    'Universidade Federal de Pernambuco',
    'Universidade de Brasília',
    'Instituto Federal de Santa Catarina',
    'Pontifícia Universidade Católica de São Paulo',
    'Centro Universitário Exemplo',
    'Colégio Estadual Dom Pedro II'
  ],

  cursos: [
    'Administração', 'Arquitetura e Urbanismo', 'Biomedicina', 'Ciência da Computação',
    'Ciências Contábeis', 'Ciências Econômicas', 'Design Gráfico', 'Direito',
    'Enfermagem', 'Engenharia Civil', 'Engenharia de Software', 'Engenharia Elétrica',
    'Farmácia', 'Fisioterapia', 'Jornalismo', 'Letras', 'Medicina', 'Medicina Veterinária',
    'Nutrição', 'Odontologia', 'Pedagogia', 'Psicologia', 'Publicidade e Propaganda',
    'Sistemas de Informação', 'Ensino Médio Regular'
  ],

  categorias: ['Todos', 'Cinema', 'Shows', 'Teatro', 'Esporte', 'Cultura', 'Educação', 'Transporte'],

  /* Parceiros e descontos -------------------------------------------------- */
  beneficios: [
    { id: 'cine-1', nome: 'Cine Aurora', categoria: 'Cinema', desconto: '50%',
      cor: '#e11d48', resumo: 'Meia-entrada em todas as sessões',
      detalhe: 'Meia-entrada garantida por lei em todas as salas da rede, inclusive em salas especiais e pré-estreias. Apresente o QR Code na bilheteria ou no totem de autoatendimento.',
      regras: ['Válido para até 40% dos ingressos de cada sessão', 'Um ingresso por CPF', 'Não cumulativo com outras promoções'] },
    { id: 'cine-2', nome: 'Multiplex Cinemas', categoria: 'Cinema', desconto: '50%',
      cor: '#7c3aed', resumo: 'Meia-entrada + combo estudante',
      detalhe: 'Além da meia-entrada, o combo pipoca + refrigerante sai com 20% de desconto de segunda a quinta.',
      regras: ['Combo válido de segunda a quinta', 'Necessário apresentar o documento digital'] },
    { id: 'show-1', nome: 'Festival Sonora', categoria: 'Shows', desconto: '50%',
      cor: '#0891b2', resumo: 'Meia-entrada no lote estudante',
      detalhe: 'Lote exclusivo com meia-entrada para portadores do documento do estudante, sujeito à cota legal de 40%.',
      regras: ['Sujeito à disponibilidade da cota', 'Conferência do documento na entrada'] },
    { id: 'show-2', nome: 'Casa de Shows Miradouro', categoria: 'Shows', desconto: '50%',
      cor: '#db2777', resumo: 'Meia-entrada na bilheteria oficial',
      detalhe: 'Desconto aplicado na bilheteria física e no site oficial, mediante validação do QR Code.',
      regras: ['Somente na bilheteria oficial', 'Documento com foto pode ser exigido'] },
    { id: 'teatro-1', nome: 'Teatro Municipal Aurora', categoria: 'Teatro', desconto: '50%',
      cor: '#b45309', resumo: 'Meia-entrada em toda a temporada',
      detalhe: 'Todas as peças da temporada regular com meia-entrada para estudantes.',
      regras: ['Retirada na bilheteria até 30 min antes', 'Um ingresso por documento'] },
    { id: 'esp-1', nome: 'Arena Estudantil', categoria: 'Esporte', desconto: '50%',
      cor: '#15803d', resumo: 'Meia-entrada em jogos e eventos',
      detalhe: 'Meia-entrada em partidas do campeonato estadual e eventos esportivos da arena.',
      regras: ['Exceto finais e clássicos', 'Setores específicos'] },
    { id: 'cult-1', nome: 'Museu de Arte Contemporânea', categoria: 'Cultura', desconto: '100%',
      cor: '#4f46e5', resumo: 'Entrada gratuita para estudantes',
      detalhe: 'Gratuidade em todas as exposições permanentes; exposições itinerantes têm 50% de desconto.',
      regras: ['Gratuidade nas exposições permanentes', 'Itinerantes com meia-entrada'] },
    { id: 'cult-2', nome: 'Biblioteca Cultural Aurora', categoria: 'Cultura', desconto: '100%',
      cor: '#0d9488', resumo: 'Associação anual gratuita',
      detalhe: 'Carteira de leitor sem custo e acesso ao acervo digital enquanto o documento estiver válido.',
      regras: ['Renovação anual', 'Acervo digital por login próprio'] },
    { id: 'edu-1', nome: 'Plataforma EstudaMais', categoria: 'Educação', desconto: '30%',
      cor: '#2563eb', resumo: '30% em cursos livres e idiomas',
      detalhe: 'Desconto aplicado na assinatura anual de cursos livres, idiomas e preparatórios.',
      regras: ['Válido na assinatura anual', 'Cupom gerado no app'] },
    { id: 'edu-2', nome: 'Livraria Página Aberta', categoria: 'Educação', desconto: '15%',
      cor: '#ca8a04', resumo: '15% em livros didáticos',
      detalhe: 'Desconto em livros didáticos, técnicos e materiais de papelaria nas lojas físicas.',
      regras: ['Somente lojas físicas', 'Não válido para lançamentos'] },
    { id: 'tr-1', nome: 'Bilhete Único Estudante', categoria: 'Transporte', desconto: '50%',
      cor: '#1d4ed8', resumo: 'Tarifa reduzida no transporte público',
      detalhe: 'Tarifa de estudante nos ônibus, metrô e trens metropolitanos, com recarga pelo próprio aplicativo.',
      regras: ['Limite diário de viagens', 'Uso pessoal e intransferível'] },
    { id: 'tr-2', nome: 'Rodoviária Interestadual', categoria: 'Transporte', desconto: '20%',
      cor: '#0f766e', resumo: '20% em passagens interestaduais',
      detalhe: 'Desconto em passagens rodoviárias interestaduais nas empresas conveniadas.',
      regras: ['Compra antecipada de 48h', 'Assentos limitados por viagem'] }
  ],

  /* Movimentações do crédito de transporte (fictícias) ---------------------- */
  extratoTransporte: [
    { data: '2026-08-26', desc: 'Ônibus — linha 021 Centro', valor: -2.35 },
    { data: '2026-08-26', desc: 'Metrô — Estação Universidade', valor: -2.35 },
    { data: '2026-08-24', desc: 'Recarga pelo aplicativo', valor: 30.00 },
    { data: '2026-08-23', desc: 'Ônibus — linha 512 Campus', valor: -2.35 },
    { data: '2026-08-22', desc: 'Ônibus — linha 512 Campus', valor: -2.35 }
  ],

  valoresRecarga: [10, 20, 30, 50, 100],

  /* Passos do fluxo de emissão --------------------------------------------- */
  passosSolicitacao: ['Dados pessoais', 'Instituição e curso', 'Foto e comprovante', 'Pagamento', 'Conclusão']
};

# Barilife — réplica acadêmica (PWA)

Réplica do aplicativo **Barilife**, a carteirinha digital do paciente bariátrico
da SBCBM, desenvolvida como **trabalho de curso**.

A interface foi reconstruída a partir de capturas do aplicativo real: paleta,
tipografia arredondada, arquitetura de navegação e o desenho do crachá seguem o
original. As cores foram amostradas pixel a pixel das capturas.

> **Aviso.** Exercício acadêmico de estudo de interface e de desenvolvimento web.
> Não tem vínculo com a Sociedade Brasileira de Cirurgia Bariátrica e Metabólica
> (SBCBM), responsável pelo aplicativo original, e não deve ser usado como
> carteirinha real. Profissionais, hospitais e estabelecimentos são fictícios,
> assim como o CPF do perfil de demonstração.

---

## Navegação

Cinco abas, com o botão de início elevado no centro, como no aplicativo real:

**Mídias · Locais · (Início) · Agenda · Menu**

## Telas

| Tela | O que faz |
|---|---|
| **Início** | Cabeçalho azul com a marca e o sino de notificações, cartão-resumo da carteirinha (foto, nome, CPF e *ver carteirinha completa*) sobre a faixa SBCBM, e a grade de atalhos: Meu peso, Chat, Novidades, Rede Amiga, Perto de você, Enquetes e COESAS. |
| **Carteirinha digital** | O crachá com furo de cordão, logo, foto, nome e CPF, e o **QR Code com validade de 10 minutos** — com contagem regressiva e regeneração ao expirar. O aviso "Não imprima a carteirinha" reproduz o do original. |
| **Mídias** | Feed de cards com banner, selo do tipo encaixado no canto e faixa de *conteúdo patrocinado*, além de busca, filtro e leitor de artigo. Traz também o botão flutuante do BariCast. |
| **Locais** | Alternador **Mapa / Lista**. O mapa mostra os parceiros ao redor da sua localização, com arraste, zoom, botão de recentralizar e ficha ao tocar num marcador. A lista traz busca, filtro por tipo, distância e agendamento. |
| **Agenda** | Alertas de consultas, retornos e exames. Reproduz o estado vazio do original, inclusive o aviso de que os alertas de dieta ficam em outro lugar. |
| **Menu** | Cartão do perfil e as três seções do original: Minha saúde, Minha conta e Ajuda & sobre. |
| **Meus dados** | Foto, documentos enviados e os blocos do original — *Já fez a cirurgia bariátrica?*, Medidas, Cirurgia, Hospital, Cirurgião e Contato — em pílulas com glifos. |
| **Meu peso** | Registro de peso com gráfico de evolução, variação entre pesagens e IMC. |
| **Rede Amiga** | Rede de descontos com busca, filtro por categoria, ficha do parceiro, cupom copiável e favoritos. |
| **Outras** | Chat com a equipe, Novidades, Enquetes com resultado, COESAS, Alerta de dieta (hidratação e vitaminas), Notificações e Permissões, Trocar senha, FAQ e Sobre. |

### Cadastro e validação pelo cirurgião

O cadastro tem três etapas: dados pessoais (nome, e-mail, nascimento, CPF, sexo,
telefone, cidade e UF), dados da cirurgia (tipo, mês, altura, pesos, cirurgião e
CRM) e a foto do paciente, com prévia circular antes de confirmar.

No Barilife, o cirurgião **recebe o cadastro, confere os dados e libera a
carteirinha**. A réplica reproduz o ciclo: o cadastro nasce com status
`pendente`, o crachá mostra o QR bloqueado por um cadeado, e um botão simula a
liberação que, no app real, acontece do lado do médico.

---

## Como executar

Projeto estático — sem dependências, sem build, sem nada para instalar.

```bash
cd barilife
python3 -m http.server 8000
```

Abra <http://localhost:8000>. Também funciona abrindo `index.html` direto, mas
sem o modo offline (o navegador bloqueia Service Worker em `file://`).

## Encaminhando para outra pessoa

Basta mandar o link. Quem abrir cai direto no cadastro e preenche os próprios
dados — nome, e-mail, nascimento, CPF, telefone, cidade, dados da cirurgia e a
**própria foto**, escolhida da galeria ou tirada na hora. Tudo fica salvo apenas
no aparelho de quem preencheu, no `localStorage` do navegador: nada é enviado
para servidores e ninguém vê os dados de ninguém.

Quem quiser só espiar antes de se cadastrar pode tocar em *Ver uma demonstração
com dados fictícios*, que carrega um perfil de exemplo.

## Como instalar no iPhone

O app é uma **PWA**: instala pela tela de início, sem App Store e sem custo.

1. Publique a pasta em HTTPS (o iOS exige HTTPS para instalar).
2. Abra o endereço **no Safari** — não funciona pelo Chrome no iOS.
3. Toque em **Compartilhar** → **Adicionar à Tela de Início**.

### Publicando de graça com GitHub Pages

Em **Settings → Pages**, escolha *Deploy from a branch*, a branch desejada e a
pasta **/ (root)**. O app fica em
`https://<usuário>.github.io/peso-real/barilife/`.

---

## Estrutura

```
barilife/
├── index.html              telas e ícones SVG
├── manifest.webmanifest    metadados da PWA
├── sw.js                   Service Worker — cache para uso offline
├── assets/
│   ├── css/app.css         tokens, componentes e telas
│   ├── img/sbcbm.png       logotipo da SBCBM, recortado com transparência
│   └── js/
│       ├── qr.js           gerador de QR Code próprio
│       ├── mapa.js         mapa vetorial em SVG, sem serviço de tiles
│       ├── data.js         base de dados fictícia
│       └── app.js          store, navegação e todas as telas
└── icons/                  ícones do app
```

## Decisões técnicas

**HTML, CSS e JavaScript puros.** Sem framework, sem CDN, sem dependência
externa — o que também é o que permite o funcionamento offline completo.

**Mapa desenhado em SVG** (`assets/js/mapa.js`). O aplicativo original usa um
mapa nativo. Como esta réplica não pode depender de rede — precisa abrir offline
e sem CDN —, a malha viária é gerada aqui de forma determinística (mesmo desenho
a cada abertura) e desenhada em SVG: quadras, avenidas com o nome acompanhando a
curva, rodovia, parques, rio e nomes de bairro. Os marcadores são posicionados ao
redor do usuário conforme a distância de cada parceiro, e o mapa responde a
arraste e zoom recalculando a janela do `viewBox`. Espessuras e corpo de texto são
proporcionais ao zoom, então permanecem constantes na tela.

**Banners gerados em SVG.** As artes dos cards de Mídias também são desenhadas em
tempo de execução a partir do título, do tipo e da cor de cada conteúdo — nenhuma
imagem externa é carregada.

**Gerador de QR Code próprio** (`assets/js/qr.js`), implementado do zero
seguindo a **ISO/IEC 18004**: aritmética em GF(256), correção de erro
Reed–Solomon (nível M, versões 1 a 10), posicionamento em zigue-zague,
informação de formato e versão com BCH, e escolha da máscara pelas quatro regras
de penalidade do padrão.

Validado de duas formas: comparação **módulo a módulo** com a biblioteca de
referência `qrcode` do Python (86 de 86 casos idênticos com máscara fixa) e
**decodificação** dos QR gerados pelo app com o leitor do OpenCV, incluindo
conteúdo acentuado em UTF-8.

**QR com validade de 10 minutos.** Como no original, o código carrega um token
gerado na hora, exibe contagem regressiva e é regenerado ao expirar — é o que
impede que a carteirinha seja impressa ou repassada.

**Validação de dados.** CPF conferido pelos dois dígitos verificadores (não só
pelo formato), telefone com 10 ou 11 dígitos, idade mínima de 16 anos e
coerência entre as datas. CPF e telefone têm máscara que preserva a posição do
cursor.

**Armazenamento local.** Perfil, favoritos, agenda, pesos, votos e alertas ficam
em `localStorage`. Nada é enviado para servidores. O contador de água zera
sozinho quando vira o dia e a foto do perfil é redimensionada para 384 px antes
de ser guardada.

**Marca e logotipos.** A marca do Barilife foi vetorizada a partir do ícone
oficial do aplicativo: os contornos brancos são isolados, aproximados e
convertidos em curvas de Bézier por interpolação Catmull–Rom, e a caixa
resultante é normalizada, virando um único `<symbol>` SVG que serve tanto à
interface quanto aos ícones do app. A cor de fundo (`#3472D0`) e as margens do
ícone (21,2% nas laterais, 24,9% no topo, marca ocupando 57,3% da largura) foram
medidas no ícone original. O logotipo
da SBCBM, que é colorido, foi recortado com extração de matte — o fundo é
estimado linha a linha e removido da mistura, o que preserva o degradê das letras
e o amarelo da estrela sem deixar franja azul nas bordas.

**Tema claro e escuro** automáticos e respeito às áreas seguras do iPhone.

---

Feito com HTML, CSS e JavaScript. Sem dependências.

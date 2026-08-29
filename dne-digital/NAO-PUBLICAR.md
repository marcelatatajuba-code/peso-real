# Não publicar

Este projeto é uma **reprodução acadêmica** do aplicativo DNE Digital, feita como
trabalho de curso. Ele é de **uso interno**: não deve ser hospedado em endereço
público nem distribuído abertamente.

## Por quê

O aplicativo monta um documento de estudante com a foto e os dados de quem o abre,
usando a identidade visual do documento oficial, e nada na interface indica que a
peça é uma reprodução — a identificação está apenas no código. Num endereço aberto,
qualquer pessoa poderia gerar uma carteirinha convincente, e a meia-entrada é
justamente o benefício que esse documento controla.

Enquanto o projeto seguir sem identificação visível, o lugar dele é:

- no repositório, em branch de trabalho;
- aberto localmente, pelo arquivo único ou por um servidor local;
- apresentado ao vivo, com quem apresenta explicando o que é.

## Antes de qualquer publicação

Se um dia o projeto for para um endereço público, coloque antes uma identificação
**visível** de reprodução acadêmica — pelo menos na tela de abertura e na tela do
documento. Sem isso, não publique.

## Onde está a identificação hoje

| Onde | O quê |
|---|---|
| `index.html`, topo | bloco de comentário explicando o que a peça é e o que ela não é |
| `index.html`, `<head>` | `<meta name="replica">`, `<meta name="validade-legal">`, `<meta name="uso">` e `noindex` |
| elementos das carteirinhas | `data-replica="academica"` e `data-validade-legal="nenhuma"` |
| conteúdo dos QR Codes | prefixo `REPLICA-ACADEMICA-SEM-VALIDADE` antes de qualquer dado |
| `js/app.js` | constantes `AVISO_REPLICA` e `USO`, registradas no console ao abrir |
| `robots.txt` | `Disallow: /` para todos os robôs |
| este arquivo | o aviso que você está lendo |

## Marcas

O logotipo `dne` e os selos das entidades usados aqui são desenhos tipográficos
próprios, feitos no mesmo estilo do original. Não são os arquivos de marca da UNE,
da UBES nem da ANPG, e não devem ser substituídos por eles.

# Teoria da Computação e Compiladores - Atividade 1

# Tradutor de #hashtags e @menções

**Tutorial prático de RegEx em JavaScript** — passo a passo com HTML e JavaScript, usando `match` e `replace`.

## O que vamos construir

Você vai criar uma página web em que a pessoa digita um texto de rede social e, ao clicar em **Traduzir**, o programa:

- **troca cada @menção** pelo nome completo da pessoa, consultando uma lista de pessoas;
- **troca cada #categoria:valor** por um emoji, consultando uma lista de emojis;
- **avisa os erros:** hashtag sem categoria (como `#festa`), hashtag que não está na lista e menção que não está na lista.

| Entrada | Saída |
|---|---|
| Hoje @joao trouxe #frutas:banana e @maria levou #comidas:pizza! | Hoje João da Silva trouxe 🍌 e Maria Oliveira levou 🍕! |
| Vai ter #festa amanhã e @zeca vem | Vai ter #festa amanhã e @zeca vem (com `#festa` e `@zeca` destacados em vermelho e listados como erros) |

**Tempo estimado:** 60 a 90 minutos.
**Você vai precisar de:** um editor de texto (VS Code ou Bloco de Notas) e um navegador (Chrome, Edge ou Firefox). Não é preciso instalar nada.

> **Dica:** salve sempre o arquivo com codificação **UTF-8**, senão os acentos e os emojis aparecem quebrados.

## Antes de começar: as ferramentas de RegEx que vamos usar

Você não precisa decorar a tabela abaixo. Volte a ela quando aparecer algo novo nos passos.

| Elemento | O que significa | Exemplo |
|---|---|---|
| `\w` | uma letra sem acento, um dígito ou `_` | `\w+` casa com `joao` |
| `[\wÀ-ÿ]` | o mesmo, mais letras acentuadas | casa com `maçã` e `josé` |
| `+` | uma ou mais vezes | `[a-z]+` casa com `abc` |
| `?` | torna o item anterior opcional | `colou?r` casa com `cor` e `colour` |
| `( )` | grupo de captura: guarda o pedaço encontrado | `@(\w+)` guarda o nome depois do `@` |
| `(?: )` | grupo sem captura: só agrupa, não guarda | `(?::(\w+))?` agrupa o `:valor` |
| flag `g` | procura todas as ocorrências, não só a primeira | `/#\w+/g` |
| `texto.match(regex)` | devolve a lista de ocorrências (com `g`) ou `null` se não achar nada | `"a#b #c".match(/#\w/g)` |
| `texto.replace(regex, função)` | troca cada ocorrência pelo valor que a função devolve | veremos nos passos 5 e 6 |

---

## Passo 1 — Criar a página (HTML)

Crie uma pasta chamada `tradutor` e, dentro dela, um arquivo `index.html`. Cole o código abaixo. Ele monta a tela: uma caixa de texto, um botão e duas áreas para o resultado e os erros. O JavaScript ainda vai ficar vazio.

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>Tradutor de #hashtags e @menções</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 700px;
      margin: 30px auto;
    }
    textarea {
      width: 100%;
      height: 120px;
      font-size: 16px;
    }
    button {
      margin: 10px 0;
      padding: 8px 16px;
      font-size: 16px;
    }
    #saida {
      border: 1px solid #ccc;
      padding: 10px;
      min-height: 40px;
      white-space: pre-wrap;
    }
    .erro {
      background: #fdd;
      color: #900;
    }
  </style>
</head>
<body>
  <h1>Tradutor de #hashtags e @menções</h1>

  <textarea id="entrada" placeholder="Digite seu texto aqui"></textarea>
  <br>
  <button id="botao">Traduzir</button>

  <h3>Resultado</h3>
  <div id="saida"></div>

  <h3>Erros encontrados</h3>
  <ul id="erros"></ul>

  <script>
    // O JavaScript vai aqui
  </script>
</body>
</html>
```

> **Teste agora:** abra o arquivo com duplo clique. Você deve ver o título, uma caixa de texto, o botão **Traduzir** e os títulos **Resultado** e **Erros encontrados**. Ao clicar no botão, nada acontece ainda.

## Passo 2 — Criar as duas listas (dicionários)

Dentro da tag `<script>`, no lugar do comentário, crie as listas de consulta. Em JavaScript, um **objeto** guarda pares chave → valor. Vamos usar um objeto para os emojis e outro para as pessoas.

```js
    const emojis = {
      "frutas:banana": "🍌",
      "frutas:uva": "🍇",
      "frutas:maçã": "🍎",
      "animais:gato": "🐱",
      "animais:cachorro": "🐶",
      "comidas:pizza": "🍕",
      "comidas:hamburguer": "🍔"
    };

    const pessoas = {
      "joao": "João da Silva",
      "maria": "Maria Oliveira",
      "ana": "Ana Souza",
      "pedro": "Pedro Santos"
    };
```

- Nos emojis, a chave é `categoria:valor` em minúsculas, exatamente como a hashtag será escrita (sem o `#`).
- Nas pessoas, a chave é o nome de usuário em minúsculas, sem o `@`.

**Acrescente pelo menos mais 3 itens em cada lista** (por exemplo, `"frutas:laranja"` e outra pessoa do seu grupo).

> **Teste agora:** salve, atualize a página, aperte **F12** e abra a aba **Console**. Digite `pessoas["joao"]` e tecle Enter. Deve aparecer `João da Silva`.

## Passo 3 — Ligar o botão

Agora o botão precisa fazer alguma coisa. Depois das listas, acrescente a função `traduzir` e ligue-a ao clique do botão. Por enquanto ela só copia o texto da caixa para a área de resultado.

```js
    function traduzir() {
      const texto = document.getElementById("entrada").value;
      document.getElementById("saida").textContent = texto;
    }

    document.getElementById("botao").addEventListener("click", traduzir);
```

- `document.getElementById("entrada")` encontra na página o elemento com `id="entrada"` (a caixa de texto).
- `.value` lê o que foi digitado. `.textContent` escreve texto puro dentro de um elemento.
- `addEventListener("click", traduzir)` diz: quando o botão for clicado, execute a função `traduzir`.

> **Teste agora:** digite qualquer texto e clique em **Traduzir**. O mesmo texto deve aparecer em **Resultado**.

## Passo 4 — Descobrir hashtags e menções com `match`

Antes de trocar qualquer coisa, vamos só *achar* o que existe no texto. Substitua a função `traduzir` por esta versão (o `addEventListener` continua igual).

```js
    function traduzir() {
      const texto = document.getElementById("entrada").value;

      const hashtags = texto.match(/#[\wÀ-ÿ:]+/g) || [];
      const mencoes = texto.match(/@[\wÀ-ÿ]+/g) || [];

      console.log("Hashtags:", hashtags);
      console.log("Menções:", mencoes);

      document.getElementById("saida").textContent = texto;
    }
```

Como ler as duas expressões regulares:

| Parte | Significado |
|---|---|
| `/ ... /g` | os limites da regex; `g` = procurar todas as ocorrências |
| `#` | o caractere `#` (ou `@`, na segunda regex) |
| `[ ... ]` | qualquer um dos caracteres listados dentro dos colchetes |
| `\w` | letras sem acento, dígitos e `_` |
| `À-ÿ` | todas as letras acentuadas |
| `:` | o dois-pontos (só na regex das hashtags) |
| `+` | uma ou mais vezes: a hashtag continua até acabar os caracteres permitidos |

> **Atenção:** `match` com a flag `g` devolve **`null`** quando não acha nada, e não uma lista vazia. Por isso escrevemos `|| []`: se vier `null`, usamos uma lista vazia e o programa não quebra.

> **Teste agora:** digite `Hoje @joao trouxe #frutas:banana e @maria levou #comidas:pizza!`, clique em **Traduzir** e olhe o Console (F12). Deve aparecer `Hashtags: ['#frutas:banana', '#comidas:pizza']` e `Menções: ['@joao', '@maria']`. Repare que o `!` ficou de fora.

## Passo 5 — Trocar as menções com `replace`

`match` só encontra. Para **trocar**, usamos `replace` com uma **função**: para cada pedaço encontrado, o JavaScript chama a função e usa o valor que ela devolver no lugar do pedaço.

Primeiro, uma função auxiliar que deixa um trecho em vermelho (a classe `erro` já está no CSS do Passo 1):

```js
    function marcarErro(trecho) {
      return '<span class="erro">' + trecho + "</span>";
    }
```

Agora a função que troca as menções:

```js
    function substituirMencoes(texto, erros) {
      const padrao = /@([\wÀ-ÿ]+)/g;

      return texto.replace(padrao, function (trecho, usuario) {
        const chave = usuario.toLowerCase();

        if (!Object.hasOwn(pessoas, chave)) {
          erros.push("Menção desconhecida: " + trecho);
          return marcarErro(trecho);
        }

        return pessoas[chave];
      });
    }
```

- `/@([\wÀ-ÿ]+)/g`: o parêntese cria um **grupo de captura** com o nome depois do `@`.
- A função recebe `trecho` (o texto inteiro achado, como `@joao`) e `usuario` (só o grupo, `joao`).
- `toLowerCase()` faz `@Joao` e `@JOAO` funcionarem também.
- `Object.hasOwn(pessoas, chave)` pergunta se a chave existe na lista. Se não existir, guardamos uma mensagem em `erros` e devolvemos o trecho marcado em vermelho.

Por fim, atualize a função `traduzir` para usar a nova função. Repare que a saída agora usa `innerHTML`, porque o resultado pode ter o `<span>` do erro:

```js
    function traduzir() {
      const erros = [];
      let texto = document.getElementById("entrada").value;

      texto = substituirMencoes(texto, erros);

      document.getElementById("saida").innerHTML = texto;
      console.log("Erros:", erros);
    }

    document.getElementById("botao").addEventListener("click", traduzir);
```

> **Atenção:** `innerHTML` interpreta o texto como HTML. Do jeito que está, se alguém digitar `<b>oi</b>`, o navegador vai mostrar negrito. No Passo 7 vamos proteger isso.

> **Teste agora:** digite `Hoje @joao e @zeca`. O resultado deve ser `Hoje João da Silva e ` seguido de `@zeca` em vermelho. No Console, `Erros:` deve listar a menção desconhecida.

## Passo 6 — Trocar as hashtags

As hashtags têm duas partes, `categoria` e `valor`, separadas por dois-pontos. Vamos capturar as duas em grupos separados. Acrescente esta função (antes de `traduzir`):

```js
    function substituirHashtags(texto, erros) {
      const padrao = /#([\wÀ-ÿ]+)(?::([\wÀ-ÿ]+))?/g;

      return texto.replace(padrao, function (trecho, categoria, valor) {
        if (valor === undefined) {
          erros.push(
            "Hashtag em formato inválido: " + trecho + " (use #categoria:valor)"
          );
          return marcarErro(trecho);
        }

        const chave = (categoria + ":" + valor).toLowerCase();

        if (!Object.hasOwn(emojis, chave)) {
          erros.push("Hashtag desconhecida: " + trecho);
          return marcarErro(trecho);
        }

        return emojis[chave];
      });
    }
```

Como ler a regex:

| Parte | Significado |
|---|---|
| `#` | o caractere `#` |
| `([\wÀ-ÿ]+)` | grupo 1: a categoria (letras, dígitos, acentos) |
| `(?: ... )?` | um trecho opcional: o `?` no final significa "zero ou uma vez", e `(?:` só agrupa, sem criar grupo numerado |
| `:([\wÀ-ÿ]+)` | dentro do trecho opcional: o dois-pontos e o grupo 2, o valor |

**O truque para detectar hashtag sem categoria:** como o trecho `:valor` é opcional, em `#festa` ele não aparece e o grupo 2 fica `undefined`. É esse `undefined` que a função testa primeiro.

A função só devolve o emoji se passar pelos dois testes: formato correto e chave existente na lista. Atualize a `traduzir` para chamar as duas funções:

```js
    function traduzir() {
      const erros = [];
      let texto = document.getElementById("entrada").value;

      texto = substituirMencoes(texto, erros);
      texto = substituirHashtags(texto, erros);

      document.getElementById("saida").innerHTML = texto;
      console.log("Erros:", erros);
    }

    document.getElementById("botao").addEventListener("click", traduzir);
```

> **Teste agora:** digite `Hoje @joao trouxe #frutas:banana e @maria levou #comidas:pizza!`. O resultado deve ser `Hoje João da Silva trouxe 🍌 e Maria Oliveira levou 🍕!`. Agora tente `#festa` e `#frutas:kiwi` e veja os dois ficarem em vermelho.

## Passo 7 — Mostrar os erros na tela e proteger o HTML

Falta mostrar a lista de erros na página e evitar que o texto digitado seja interpretado como HTML. Acrescente esta função:

```js
    function escaparHtml(texto) {
      return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
```

Ela troca os caracteres especiais do HTML por versões seguras (`<` vira `&lt;`). Chamamos essa função **antes** das trocas, assim só o nosso `<span>` chega ao navegador como HTML de verdade.

Agora substitua a `traduzir` pela versão final:

```js
    function traduzir() {
      const erros = [];
      let texto = escaparHtml(document.getElementById("entrada").value);

      texto = substituirMencoes(texto, erros);
      texto = substituirHashtags(texto, erros);

      document.getElementById("saida").innerHTML = texto;

      const lista = document.getElementById("erros");
      lista.innerHTML = "";

      if (erros.length === 0) {
        lista.innerHTML = "<li>Nenhum erro encontrado.</li>";
      }

      for (const mensagem of erros) {
        const item = document.createElement("li");
        item.className = "erro";
        item.textContent = mensagem;
        lista.appendChild(item);
      }
    }

    document.getElementById("botao").addEventListener("click", traduzir);
```

- O texto digitado passa por `escaparHtml`, depois pelas duas trocas, e vai para a área de resultado.
- A lista de erros é limpa a cada clique. Se ficou vazia, mostramos "Nenhum erro encontrado."; senão criamos um item `<li>` por mensagem.

> **Curiosidade:** por que `escaparHtml` troca só `&`, `<` e `>`? Outras versões usam códigos como `&#39;`, que contêm um `#39`. Nossa regex de hashtag confundiria isso com uma hashtag!

## Passo 8 — Testar tudo

Digite cada entrada abaixo e compare com o resultado esperado. Se algo diferir, releia o passo correspondente.

| # | Entrada | Resultado esperado | Erros listados |
|---|---|---|---|
| 1 | `Hoje @joao trouxe #frutas:banana e @maria levou #comidas:pizza!` | Hoje João da Silva trouxe 🍌 e Maria Oliveira levou 🍕! | Nenhum erro encontrado. |
| 2 | `Vai ter #festa amanhã` | Vai ter #festa amanhã (`#festa` em vermelho) | Hashtag em formato inválido: #festa (use #categoria:valor) |
| 3 | `Oi @zeca, #frutas:kiwi é bom` | Oi @zeca, #frutas:kiwi é bom (os dois em vermelho) | Menção desconhecida: @zeca; Hashtag desconhecida: #frutas:kiwi |
| 4 | `@Maria adora #Animais:Gato` | Maria Oliveira adora 🐱 | Nenhum erro encontrado. |
| 5 | `Comi #frutas:maçã!` | Comi 🍎! | Nenhum erro encontrado. |
| 6 | `<b>@ana</b>` | `<b>Ana Souza</b>` (mostrado como texto, sem negrito) | Nenhum erro encontrado. |

**Por que o caso 4 funciona?** Por causa do `toLowerCase()`. E o caso 5? Por causa do `À-ÿ` na regex: sem ele, o `ç` e o `ã` cortariam a hashtag no meio.


## Desafios extras (opcional)

1. **Contador.** Mostre abaixo do resultado quantas menções e quantas hashtags foram traduzidas com sucesso. Dica: crie duas variáveis contadoras e some 1 nos `return` que dão certo.
2. **E-mails.** Hoje `ana@site.com` gera o erro "Menção desconhecida: @site". Faça a regex ignorar um `@` colado em uma letra ou dígito. Dica: pesquise por *lookbehind*, `(?<![\w.])`.
3. **Nomes com ponto.** Faça `@maria.silva` funcionar sem estragar `Vou com @maria.` (o ponto final da frase não faz parte do nome). Dica: o ponto só entra no nome se vier uma letra depois dele.

## Para pensar: o que isso tem a ver com compiladores?

Sua página faz, em miniatura, o que um compilador faz em duas fases:

| No tradutor | Na compilação |
|---|---|
| A regex reconhece `#categoria:valor` e `@usuario` dentro do texto | Análise léxica: reconhecer os tokens usando expressões regulares |
| `#festa` é rejeitada por não ter o formato `categoria:valor` | Erro léxico/sintático: a cadeia não segue o formato definido |
| `#frutas:kiwi` tem formato correto, mas não existe na lista | Erro semântico: forma válida, mas sem significado (como usar uma variável nunca declarada) |

**Discussão:** a regex `#([\wÀ-ÿ]+)(?::([\wÀ-ÿ]+))?` usa só concatenação, escolha (classe de caracteres) e repetição (`+` e `?`). Ela é uma expressão regular no sentido formal do curso? Poderíamos escrever um AFD equivalente para ela? E se quiséssemos exigir que a categoria aparecesse repetida no final (`#frutas:banana#frutas`), ainda seria possível só com o que aprendemos de ER formal?
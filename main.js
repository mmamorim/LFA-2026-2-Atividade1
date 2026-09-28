import { emojis, pessoas } from "./dados.js";

console.log("oi gente");
console.log(emojis);
console.log(pessoas);

function marcarErro(trecho) {
    return '<span class="erro">' + trecho + "</span>";
}

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

function escaparHtml(texto) {
    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

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


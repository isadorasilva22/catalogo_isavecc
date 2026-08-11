import { db, auth } from "./firebase.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

import { uploadImagem } from "./cloudinary.js";
import { removerFundo } from "./remover-fundo.js";

const colecao = collection(db, "bichinhosisavecc");
const colecaoCategorias = collection(db, "categorias");

const form = document.getElementById("formCadastro");
const inputTitulo = document.getElementById("titulo");
const inputCategoria = document.getElementById("categoria");
const inputCor = document.getElementById("cor");
const inputImagem = document.getElementById("imagem");
const preview = document.getElementById("preview");
const status = document.getElementById("statusForm");
const tituloForm = document.getElementById("tituloForm");
const botaoSalvar = document.getElementById("btnSalvar");
const botaoCancelarEdicao = document.getElementById("btnCancelarEdicao");
const listaBichinhos = document.getElementById("listaBichinhos");
const nomeArquivo = document.getElementById("nomeArquivo");

const formCategoria = document.getElementById("formCategoria");
const inputNovaCategoria = document.getElementById("novaCategoria");
const listaCategorias = document.getElementById("listaCategorias");

const modalConfirmacao = document.getElementById("modalConfirmacao");
const modalConfirmacaoTexto = document.getElementById("modalConfirmacaoTexto");
const btnCancelarConfirmacao = document.getElementById("btnCancelarConfirmacao");
const btnConfirmarExclusao = document.getElementById("btnConfirmarExclusao");

const modalCategorias = document.getElementById("modalCategorias");
const listaCategoriasModal = document.getElementById("listaCategoriasModal");
const btnFecharModalCategorias = document.getElementById("btnFecharModalCategorias");

let itemEditando = null;
let itensAtuais = [];
let categoriasAtuais = [];
let uploadPendente = null;

function confirmarAcao(mensagem) {

    return new Promise((resolve) => {

        modalConfirmacaoTexto.textContent = mensagem;
        modalConfirmacao.style.display = "flex";

        function limpar(resultado) {
            modalConfirmacao.style.display = "none";
            btnConfirmarExclusao.removeEventListener("click", aoConfirmar);
            btnCancelarConfirmacao.removeEventListener("click", aoCancelar);
            modalConfirmacao.removeEventListener("click", aoClicarFora);
            document.removeEventListener("keydown", aoTeclar);
            resolve(resultado);
        }

        function aoConfirmar() { limpar(true); }
        function aoCancelar() { limpar(false); }
        function aoClicarFora(evento) {
            if (evento.target === modalConfirmacao) limpar(false);
        }
        function aoTeclar(evento) {
            if (evento.key === "Escape") limpar(false);
        }

        btnConfirmarExclusao.addEventListener("click", aoConfirmar);
        btnCancelarConfirmacao.addEventListener("click", aoCancelar);
        modalConfirmacao.addEventListener("click", aoClicarFora);
        document.addEventListener("keydown", aoTeclar);

    });

}

function mensagemErro(erro, acao) {

    if (!navigator.onLine) {
        return "Sem conexão com a internet. Verifique sua rede e tente novamente.";
    }

    if (erro?.message?.includes("Cloudinary")) {
        return "Não foi possível enviar a imagem. Verifique o arquivo e tente novamente.";
    }

    switch (erro?.code) {
        case "permission-denied":
            return "Você não tem permissão para essa ação. Faça login novamente.";
        case "unavailable":
            return "Não foi possível conectar ao banco de dados. Tente novamente em alguns instantes.";
        case "not-found":
            return "Este item não foi encontrado — ele pode já ter sido excluído.";
    }

    return `Erro ao ${acao}. Tente novamente.`;

}

inputImagem.addEventListener("change", async () => {

    const arquivo = inputImagem.files[0];
    uploadPendente = null;

    if (!arquivo) {
        if (!itemEditando) {
            preview.style.display = "none";
            nomeArquivo.textContent = "Nenhum arquivo selecionado";
        }
        return;
    }

    nomeArquivo.textContent = arquivo.name;
    preview.src = URL.createObjectURL(arquivo);
    preview.style.display = "block";
    status.textContent = "Enviando imagem e removendo fundo...";
    botaoSalvar.disabled = true;

    try {

        const resultadoUpload = await uploadImagem(arquivo);

        uploadPendente = {
            imagem: removerFundo(resultadoUpload.secure_url),
            imagemOriginal: resultadoUpload.secure_url,
            publicId: resultadoUpload.public_id
        };

        preview.src = uploadPendente.imagem;
        status.textContent = "Pré-visualização atualizada. Confira o resultado antes de salvar.";

    } catch (erro) {
        console.error(erro);
        status.textContent = mensagemErro(erro, "enviar a imagem");
        uploadPendente = null;
    } finally {
        botaoSalvar.disabled = false;
    }

});

function resetFormParaNovo() {
    itemEditando = null;
    uploadPendente = null;
    form.reset();
    inputImagem.required = true;
    preview.style.display = "none";
    nomeArquivo.textContent = "Nenhum arquivo selecionado";
    tituloForm.textContent = "Novo Bichinho";
    botaoSalvar.textContent = "Salvar";
    botaoCancelarEdicao.classList.add("oculto");
}

function iniciarEdicao(item) {
    itemEditando = item;
    uploadPendente = null;
    inputTitulo.value = item.titulo;
    inputCategoria.value = item.categoria;
    inputCor.value = item.cor;
    inputImagem.value = "";
    inputImagem.required = false;
    nomeArquivo.textContent = "Imagem atual mantida (escolha uma nova para substituir)";
    preview.src = item.imagem;
    preview.style.display = "block";
    tituloForm.textContent = "Editar Bichinho";
    botaoSalvar.textContent = "Atualizar";
    botaoCancelarEdicao.classList.remove("oculto");
    status.textContent = "";
    form.scrollIntoView({ behavior: "smooth" });
}

botaoCancelarEdicao.addEventListener("click", () => {
    resetFormParaNovo();
    status.textContent = "";
});

async function excluirBichinho(id) {

    const confirmado = await confirmarAcao("Excluir este bichinho? Essa ação não pode ser desfeita.");
    if (!confirmado) return;

    try {

        await deleteDoc(doc(db, "bichinhosisavecc", id));

        if (itemEditando?.id === id) {
            resetFormParaNovo();
        }

    } catch (erro) {
        console.error(erro);
        alert(mensagemErro(erro, "excluir o bichinho"));
    }

}

async function alternarFavorito(id) {

    const item = itensAtuais.find((i) => i.id === id);
    if (!item) return;

    await updateDoc(doc(db, "bichinhosisavecc", id), { favorito: !item.favorito });

}

function renderLista(itens) {

    if (itens.length === 0) {
        listaBichinhos.innerHTML = '<p class="vazioLista">Nenhum bichinho cadastrado ainda.</p>';
        return;
    }

    listaBichinhos.innerHTML = itens.map((item) => `
        <div class="itemLista">
            <img src="${item.imagem}">
            <div class="infoItem">
                <strong>${item.titulo}</strong>
                <span>${item.categoria} · ${item.cor}</span>
            </div>
            <div class="acoesItem">
                <button type="button" class="btnFavorito${item.favorito ? " ativo" : ""}" data-id="${item.id}" title="${item.favorito ? "Remover dos favoritos" : "Marcar como favorito"}">
                    <i class="fa-${item.favorito ? "solid" : "regular"} fa-star"></i>
                </button>
                <button type="button" class="btnEditar" data-id="${item.id}" title="Editar">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" class="btnExcluir" data-id="${item.id}" title="Excluir">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join("");

}

function sincronizarCategoriaAtual() {

    if (inputCategoria.value && !categoriasAtuais.some((c) => c.nome === inputCategoria.value)) {
        inputCategoria.value = "";
    }

}

function renderListaCategoriasModal() {

    if (categoriasAtuais.length === 0) {
        listaCategoriasModal.innerHTML = '<p class="vazioLista">Nenhuma categoria cadastrada ainda.</p>';
        return;
    }

    listaCategoriasModal.innerHTML = categoriasAtuais.map((c) => `
        <button type="button" class="itemCategoriaModal${c.nome === inputCategoria.value ? " ativo" : ""}" data-nome="${c.nome}">
            ${c.nome}
            ${c.nome === inputCategoria.value ? '<i class="fa-solid fa-check"></i>' : ""}
        </button>
    `).join("");

}

function abrirModalCategorias() {
    renderListaCategoriasModal();
    modalCategorias.style.display = "flex";
}

function fecharModalCategorias() {
    modalCategorias.style.display = "none";
}

inputCategoria.addEventListener("focus", () => inputCategoria.blur());

inputCategoria.addEventListener("click", abrirModalCategorias);

inputCategoria.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        abrirModalCategorias();
    }
});

btnFecharModalCategorias.addEventListener("click", fecharModalCategorias);

modalCategorias.addEventListener("click", (evento) => {
    if (evento.target === modalCategorias) fecharModalCategorias();
});

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && modalCategorias.style.display === "flex") {
        fecharModalCategorias();
    }
});

listaCategoriasModal.addEventListener("click", (evento) => {

    const botao = evento.target.closest(".itemCategoriaModal");
    if (!botao) return;

    inputCategoria.value = botao.dataset.nome;
    fecharModalCategorias();

});

function renderListaCategorias() {

    if (categoriasAtuais.length === 0) {
        listaCategorias.innerHTML = '<p class="vazioLista">Nenhuma categoria cadastrada ainda.</p>';
        return;
    }

    listaCategorias.innerHTML = categoriasAtuais.map((c) => `
        <span class="categoriaPill">
            ${c.nome}
            <button type="button" class="btnExcluirCategoria" data-id="${c.id}" title="Excluir categoria">&times;</button>
        </span>
    `).join("");

}

formCategoria.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    const nome = inputNovaCategoria.value.trim();

    if (!nome || categoriasAtuais.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) {
        formCategoria.reset();
        return;
    }

    await addDoc(colecaoCategorias, { nome, criadoEm: serverTimestamp() });
    formCategoria.reset();

});

listaCategorias.addEventListener("click", async (evento) => {

    const botao = evento.target.closest(".btnExcluirCategoria");
    if (!botao) return;

    const confirmado = await confirmarAcao("Excluir esta categoria? Bichinhos já cadastrados com ela não serão apagados.");
    if (!confirmado) return;

    try {
        await deleteDoc(doc(db, "categorias", botao.dataset.id));
    } catch (erro) {
        console.error(erro);
        alert(mensagemErro(erro, "excluir a categoria"));
    }

});

onSnapshot(
    query(colecaoCategorias, orderBy("nome")),
    (snapshot) => {
        categoriasAtuais = snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
        sincronizarCategoriaAtual();
        renderListaCategorias();
        if (modalCategorias.style.display === "flex") {
            renderListaCategoriasModal();
        }
    },
    (erro) => {
        console.error(erro);
        listaCategorias.innerHTML = '<p class="erro">Erro ao carregar categorias.</p>';
    }
);

onSnapshot(
    query(colecao, orderBy("criadoEm", "desc")),
    (snapshot) => {
        itensAtuais = snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
        renderLista(itensAtuais);
    },
    (erro) => {
        console.error(erro);
        listaBichinhos.innerHTML = '<p class="erro">Erro ao carregar bichinhos.</p>';
    }
);

listaBichinhos.addEventListener("click", (evento) => {

    const botaoEditar = evento.target.closest(".btnEditar");
    const botaoExcluir = evento.target.closest(".btnExcluir");
    const botaoFavorito = evento.target.closest(".btnFavorito");

    if (botaoEditar) {
        const item = itensAtuais.find((i) => i.id === botaoEditar.dataset.id);
        if (item) iniciarEdicao(item);
    }

    if (botaoExcluir) {
        excluirBichinho(botaoExcluir.dataset.id);
    }

    if (botaoFavorito) {
        alternarFavorito(botaoFavorito.dataset.id);
    }

});

form.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    if (!auth.currentUser) {
        return;
    }

    const arquivo = inputImagem.files[0];

    if (!arquivo && !itemEditando) {
        return;
    }

    if (arquivo && !uploadPendente) {
        status.textContent = "Aguarde o envio da imagem terminar antes de salvar.";
        return;
    }

    botaoSalvar.disabled = true;
    status.textContent = itemEditando ? "Atualizando..." : "Salvando...";

    try {

        const dados = {
            titulo: inputTitulo.value,
            categoria: inputCategoria.value,
            cor: inputCor.value
        };

        if (uploadPendente) {
            dados.imagem = uploadPendente.imagem;
            dados.imagemOriginal = uploadPendente.imagemOriginal;
            dados.publicId = uploadPendente.publicId;
        }

        if (itemEditando) {
            await updateDoc(doc(db, "bichinhosisavecc", itemEditando.id), dados);
            resetFormParaNovo();
            status.textContent = "Bichinho atualizado com sucesso!";
        } else {
            dados.criadoEm = serverTimestamp();
            await addDoc(colecao, dados);
            resetFormParaNovo();
            status.textContent = "Bichinho salvo com sucesso!";
        }

    } catch (erro) {
        console.error(erro);
        status.textContent = mensagemErro(erro, itemEditando ? "atualizar o bichinho" : "salvar o bichinho");
    } finally {
        botaoSalvar.disabled = false;
    }

});

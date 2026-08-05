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

let itemEditando = null;
let itensAtuais = [];
let categoriasAtuais = [];

inputImagem.addEventListener("change", () => {

    const arquivo = inputImagem.files[0];

    if (!arquivo) {
        if (!itemEditando) {
            preview.style.display = "none";
            nomeArquivo.textContent = "Nenhum arquivo selecionado";
        }
        return;
    }

    preview.src = URL.createObjectURL(arquivo);
    preview.style.display = "block";
    nomeArquivo.textContent = arquivo.name;

});

function resetFormParaNovo() {
    itemEditando = null;
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

    if (!confirm("Excluir este bichinho? Essa ação não pode ser desfeita.")) {
        return;
    }

    await deleteDoc(doc(db, "bichinhosisavecc", id));

    if (itemEditando?.id === id) {
        resetFormParaNovo();
    }

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

function renderSelectCategorias() {

    const valorAtual = inputCategoria.value;

    inputCategoria.innerHTML = '<option value="" disabled>Selecione...</option>' +
        categoriasAtuais.map((c) => `<option value="${c.nome}">${c.nome}</option>`).join("");

    if (categoriasAtuais.some((c) => c.nome === valorAtual)) {
        inputCategoria.value = valorAtual;
    } else {
        inputCategoria.value = "";
    }

}

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

    if (!confirm("Excluir esta categoria? Bichinhos já cadastrados com ela não serão apagados.")) {
        return;
    }

    await deleteDoc(doc(db, "categorias", botao.dataset.id));

});

onSnapshot(
    query(colecaoCategorias, orderBy("nome")),
    (snapshot) => {
        categoriasAtuais = snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
        renderSelectCategorias();
        renderListaCategorias();
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

    if (botaoEditar) {
        const item = itensAtuais.find((i) => i.id === botaoEditar.dataset.id);
        if (item) iniciarEdicao(item);
    }

    if (botaoExcluir) {
        excluirBichinho(botaoExcluir.dataset.id);
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

    botaoSalvar.disabled = true;
    status.textContent = itemEditando ? "Atualizando..." : "Enviando imagem...";

    try {

        const dados = {
            titulo: inputTitulo.value,
            categoria: inputCategoria.value,
            cor: inputCor.value
        };

        if (arquivo) {
            const resultadoUpload = await uploadImagem(arquivo);
            dados.imagem = removerFundo(resultadoUpload.secure_url);
            dados.imagemOriginal = resultadoUpload.secure_url;
            dados.publicId = resultadoUpload.public_id;
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
        status.textContent = "Erro ao salvar. Tente novamente.";
    } finally {
        botaoSalvar.disabled = false;
    }

});

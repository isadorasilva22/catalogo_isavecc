import { db } from "./firebase.js";

import {
    collection,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const cards = document.getElementById("cards");
const contador = document.getElementById("contador");
const inputPesquisa = document.getElementById("pesquisa");
const sidebar = document.querySelector(".sidebar");
const listaCategoriasFiltro = document.getElementById("listaCategoriasFiltro");
const btnFiltroFavoritos = document.getElementById("btnFiltroFavoritos");

const modal = document.getElementById("modal");
const fechar = document.getElementById("fechar");
const modalImagem = document.getElementById("modalImagem");
const modalNome = document.getElementById("modalNome");
const modalCategoria = document.getElementById("modalCategoria");
const modalFavorito = document.getElementById("modalFavorito");
const modalCor = document.getElementById("modalCor");

let todosBichinhos = [];
let categoriaAtiva = "Todos";
let apenasFavoritos = false;
let termoPesquisa = "";

const removerAcentos = new RegExp("[" + String.fromCharCode(0x300) + "-" + String.fromCharCode(0x36f) + "]", "g");

function normalizar(texto) {
    return texto.toLowerCase().normalize("NFD").replace(removerAcentos, "");
}

function renderCards(lista) {

    contador.textContent = `${lista.length} bichinho${lista.length === 1 ? "" : "s"}`;

    if (lista.length === 0) {
        cards.innerHTML = '<p class="vazio">Nenhum bichinho encontrado.</p>';
        return;
    }

    cards.innerHTML = lista.map((b) => `
        <div class="card" data-id="${b.id}">
            <img src="${b.imagem}" alt="${b.titulo}">
            <h3>${b.titulo}</h3>
            <span>${b.categoria}</span>
            ${b.favorito ? '<span class="favoritoTag"><i class="fa-solid fa-star"></i> Favorito</span>' : ""}
        </div>
    `).join("");

}

function aplicarFiltros() {

    let filtrados = todosBichinhos;

    if (categoriaAtiva !== "Todos") {
        filtrados = filtrados.filter((b) => b.categoria === categoriaAtiva);
    }

    if (apenasFavoritos) {
        filtrados = filtrados.filter((b) => b.favorito);
    }

    if (termoPesquisa) {
        filtrados = filtrados.filter((b) => normalizar(b.titulo).includes(termoPesquisa));
    }

    renderCards(filtrados);

}

function renderBotoesCategoria(categorias) {

    listaCategoriasFiltro.innerHTML = categorias.map((nome) => `
        <button data-categoria="${nome}" class="${nome === categoriaAtiva ? "ativo" : ""}">
            ${nome}
        </button>
    `).join("");

}

function abrirModal(bichinho) {
    modalImagem.src = bichinho.imagem;
    modalImagem.alt = bichinho.titulo;
    modalNome.textContent = bichinho.titulo;
    modalCategoria.textContent = bichinho.categoria;
    modalFavorito.style.display = bichinho.favorito ? "flex" : "none";
    modalCor.textContent = bichinho.cor;
    modal.style.display = "flex";
}

function fecharModal() {
    modal.style.display = "none";
}

cards.addEventListener("click", (evento) => {
    const card = evento.target.closest(".card");
    if (!card) return;

    const bichinho = todosBichinhos.find((b) => b.id === card.dataset.id);
    if (bichinho) abrirModal(bichinho);
});

fechar.addEventListener("click", fecharModal);

modal.addEventListener("click", (evento) => {
    if (evento.target === modal) fecharModal();
});

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") fecharModal();
});

sidebar.addEventListener("click", (evento) => {
    const botao = evento.target.closest("button[data-categoria]");
    if (!botao) return;

    sidebar.querySelectorAll("button[data-categoria]").forEach((b) => b.classList.remove("ativo"));
    botao.classList.add("ativo");
    categoriaAtiva = botao.dataset.categoria;
    aplicarFiltros();
});

btnFiltroFavoritos.addEventListener("click", () => {
    apenasFavoritos = !apenasFavoritos;
    btnFiltroFavoritos.classList.toggle("ativo", apenasFavoritos);
    aplicarFiltros();
});

inputPesquisa.addEventListener("input", () => {
    termoPesquisa = normalizar(inputPesquisa.value.trim());
    aplicarFiltros();
});

cards.innerHTML = Array.from({ length: 6 }, () => '<div class="skeleton-card"></div>').join("");

onSnapshot(
    query(collection(db, "categorias"), orderBy("nome")),
    (snapshot) => {
        const categorias = snapshot.docs.map((documento) => documento.data().nome);
        renderBotoesCategoria(categorias);
    },
    (erro) => console.error(erro)
);

onSnapshot(
    query(collection(db, "bichinhosisavecc"), orderBy("criadoEm", "desc")),
    (snapshot) => {
        todosBichinhos = snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
        aplicarFiltros();
    },
    (erro) => {
        console.error(erro);
        cards.innerHTML = '<p class="vazio">Erro ao carregar o inventário.</p>';
    }
);

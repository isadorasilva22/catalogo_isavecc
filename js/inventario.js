let bichinhos = [];

const cards = document.getElementById("cards");
const pesquisa = document.getElementById("pesquisa");

async function carregarBichinhos(){

    cards.innerHTML="";

    for(let i=0;i<8;i++){

    cards.innerHTML+=`
    
    <div class="skeleton-card"></div>
    `;
    }
    
    const resposta = await fetch("data/bichinhos.json");

    bichinhos = await resposta.json();

    renderizar(bichinhos);

}

function renderizar(lista){

    cards.innerHTML = "";

    document.getElementById("contador").innerText =
    `${lista.length} bichinhos`;
    
    lista.forEach(b => {

        cards.innerHTML += `

        <div class="card" onclick="abrirModal(${b.id})">

            <img src="${b.imagem}">

            <h3>${b.nome}</h3>

            <span>${b.categoria}</span>

        </div>

        `;

    });

}

const modal = document.getElementById("modal");

function abrirModal(id){

    const b = bichinhos.find(item => item.id === id);

    document.getElementById("modalImagem").src = b.imagem;
    document.getElementById("modalNome").innerText = b.nome;
    document.getElementById("modalCategoria").innerText = b.categoria;
    document.getElementById("modalDescricao").innerText = b.descricao;
    document.getElementById("modalArquivo").innerText = b.arquivo;
    document.getElementById("modalFormato").innerText = b.formato;
    document.getElementById("modalData").innerText = b.dataCadastro;

    const tags = document.getElementById("modalTags");

    tags.innerHTML = "";

    b.tags.forEach(tag => {

        tags.innerHTML += `<span class="tag">${tag}</span>`;

    });

    modal.style.display = "flex";

}

document.getElementById("fechar").onclick = () => {

    modal.style.display = "none";

};

window.onclick = (e) => {

    if(e.target === modal){

        modal.style.display = "none";

    }

};

pesquisa.addEventListener("input",()=>{

    const texto=pesquisa.value.toLowerCase();

    const lista=bichinhos.filter(b=>

        b.nome.toLowerCase().includes(texto)

    );

    renderizar(lista);

});

carregarBichinhos();
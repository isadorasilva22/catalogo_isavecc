import { db } from "./firebase.js";

import {

    collection,

    getDocs

} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const cards = document.getElementById("cards");

async function carregarBichinhos(){

    cards.innerHTML = "<h2>Carregando...</h2>";

    const querySnapshot = await getDocs(
        collection(db,"bichinhosisavecc")
    );

    cards.innerHTML = "";

    querySnapshot.forEach((doc)=>{

        const b = doc.data();

        cards.innerHTML += `

        <div class="card">

            <img src="${b.imagem}">

            <h3>${b.titulo}</h3>

            <span>${b.categoria}</span>

        </div>

        `;

    });

}

carregarBichinhos();
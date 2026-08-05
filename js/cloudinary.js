const CLOUD_NAME = "jgrpoeqb";
const UPLOAD_PRESET = "catalogo_bichinhos";

export async function uploadImagem(arquivo) {

    const formData = new FormData();
    formData.append("file", arquivo);
    formData.append("upload_preset", UPLOAD_PRESET);

    const resposta = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: formData
        }
    );

    if (!resposta.ok) {
        throw new Error("Falha ao enviar imagem para o Cloudinary.");
    }

    return resposta.json();
}

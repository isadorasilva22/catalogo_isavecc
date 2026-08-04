from flask import Flask, render_template, request, redirect, url_for
import json
import os

app = Flask(__name__)

UPLOAD_FOLDER = "static/uploads"
DATABASE = "animais.json"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def carregar_animais():
    if not os.path.exists(DATABASE):
        return []

    with open(DATABASE, "r", encoding="utf-8") as f:
        return json.load(f)


def salvar_animais(animais):
    with open(DATABASE, "w", encoding="utf-8") as f:
        json.dump(animais, f, indent=4, ensure_ascii=False)


@app.route("/")
def index():

    animais = carregar_animais()

    return render_template(
        "index.html",
        animais=animais
    )


@app.route("/animal/<int:id>")
def animal(id):

    animais = carregar_animais()

    animal = next((a for a in animais if a["id"] == id), None)

    if animal is None:
        return "Animal não encontrado"

    return render_template(
        "animal.html",
        animal=animal
    )


@app.route("/admin")
def admin():

    return render_template("admin.html")


@app.route("/salvar", methods=["POST"])
def salvar():

    animais = carregar_animais()

    nome = request.form["nome"]
    categoria = request.form["categoria"]
    descricao = request.form["descricao"]

    imagem = request.files["imagem"]

    extensao = imagem.filename.split(".")[-1]

    nome_arquivo = f"{len(animais)+1}.{extensao}"

    caminho = os.path.join(
        UPLOAD_FOLDER,
        nome_arquivo
    )

    imagem.save(caminho)

    novo = {
        "id": len(animais)+1,
        "nome": nome,
        "categoria": categoria,
        "descricao": descricao,
        "imagem": nome_arquivo
    }

    animais.append(novo)

    salvar_animais(animais)

    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True)
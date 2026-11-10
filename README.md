# Radar ENEM 2026

Site estático de revisão de Ciências da Natureza e Matemática. O progresso fica no navegador e pode ser transferido entre aparelhos por um arquivo JSON.

## Abrir a prévia

Abra a pasta `radar-enem-2026` no Codex. No terminal da pasta, execute:

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory docs
```

Acesse [a prévia local](http://127.0.0.1:8765/). Use o mesmo endereço e a mesma porta para continuar com o progresso desse navegador.

## Editar no Codex

- `docs/index.html` contém as seções e a estrutura da página.
- `docs/css/` contém os estilos base, a identidade visual e os ajustes para a web.
- `docs/js/` contém os filtros, os gráficos, o painel de questões, o progresso e a varredura.
- `docs/dados/` contém as fichas e os registros do Radar. Em `fontes.js`, cada PDF pode receber uma URL HTTPS quando for liberado.
- `docs/imagens/` contém as marcas e os 80 recortes. Cada recorte é solicitado quando a questão correspondente é aberta.

## Publicar e atualizar

1. No GitHub, crie o repositório público `radar-enem-2026` e envie este `README.md` e a pasta `docs` inteira para a branch `main`.
2. Em **Settings → Pages**, selecione **Deploy from a branch**, depois **main** e **/docs**. Salve.
3. Abra a URL exibida em **Visit site** numa janela anônima e teste as duas áreas. Para atualizar, envie as alterações para a mesma branch.

O HTML original e os cinco PDFs ficam na pasta irmã `acervo-local`. Envie ao GitHub somente o conteúdo deste projeto. [Documentação do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

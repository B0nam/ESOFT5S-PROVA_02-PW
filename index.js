function openFilterDialog() {
    const dialog = document.querySelector('dialog');
    dialog.showModal();
}

function closeFilterDialog() {
    const dialog = document.querySelector('dialog');
    dialog.close();
}

function applyFilters(event) {
    event.preventDefault();

    const form = document.getElementById('dialog-form');
    const urlParams = new URLSearchParams(window.location.search);

    const formData = new FormData(form);
    formData.forEach((value, key) => {
        if (value) {
            urlParams.set(key, value);
        } else {
            urlParams.delete(key);
        }
    });

    const searchInputValue = document.getElementById('search-input').value;
    if (searchInputValue.trim() !== '') {
        urlParams.set('busca', searchInputValue.trim());
    } else {
        urlParams.delete('busca');
    }

    window.location.search = urlParams.toString();
    updatePage();  // (1) Ao aplicar, os filtros devem ser refletidos na URL da página, com query string, e os dados devem ser atualizados (nova chamada na API).
}

function updateFilterInput() {
    const urlParams = new URLSearchParams(window.location.search);

    if (!urlParams.has('qtd')) { // (0.1) Por padrão, busque somente 10 notícias.
        urlParams.set('qtd', '10');
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
    }

    urlParams.forEach((value, key) => {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) {
            input.value = value;
        }
    });

    const searchInput = document.getElementById('search-input');
    if (urlParams.has('busca') && searchInput) {
        searchInput.value = urlParams.get('busca');
    }
}

function updateFilterCounter() {
    const filterCounterElement = document.getElementById('filter-count');
    const urlParams = new URLSearchParams(window.location.search);
    let activeFilters = 0;

    urlParams.forEach((value, key) => {
        if (key !== "page" && key !== "busca") {
            activeFilters++;
        }
    });

    filterCounterElement.innerText = activeFilters.toString();
}

function getNoticias() {
    const urlParams = new URLSearchParams(window.location.search); // (1) A api deve ser chamada com os filtros da query string, filtrados pelo usuário.
    const apiUrl = 'http://servicodados.ibge.gov.br/api/v3/noticias'; // (0.15) Utilize a API http://servicodados.ibge.gov.br/api/v3/noticias para buscar as notícias.

    fetch(`${apiUrl}?${urlParams.toString()}`)
        .then(response => response.json())
        .then(data => {
            const listaNoticias = document.querySelector('.news-content');
            listaNoticias.innerHTML = '';

            data.items.forEach(noticia => {
                const li = createNoticia(noticia); // (0.25) Após obter os dados das notícias da API, itere sobre esses dados e crie elementos <li> para cada notícia.
                listaNoticias.appendChild(li);
            });

            totalPaginas = data.totalPages;
            pageNoticias();
        })
        .catch(error => {
            console.error('Erro ao obter notícias:', error);
        });
}

function createNoticia(noticia) {
    const liNoticia = document.createElement("li");

    const imgNoticia = document.createElement("img"); // (0.1) Cada notícia deve conter a imagem da noticia, o título em um h2, introdução em um parágrafo.
    const imagemObj = JSON.parse(noticia.imagens);
    imgNoticia.src = `https://agenciadenoticias.ibge.gov.br/${imagemObj.image_intro}`; // (0.3) A imagem fica em um objeto stringified, e precisa ser concatenada com a url de noticias do IBGE https://agenciadenoticias.ibge.gov.br/

    const titulo = document.createElement("h2"); // (0.1) Cada notícia deve conter a imagem da noticia, o título em um h2, introdução em um parágrafo.
    titulo.textContent = noticia.titulo;

    const intro = document.createElement("p"); // (0.1) Cada notícia deve conter a imagem da noticia, o título em um h2, introdução em um parágrafo.
    intro.textContent = noticia.introducao;

    const editorias = document.createElement("span");
    editorias.textContent = noticia.editorias
        ? noticia.editorias
            .split(";")
            .map((editoria) => `#${editoria}`) // (0.2) Mostrar as editorias da notícia com prefixo #.
            .join(" ")
        : "";

    const publicado = document.createElement("span");
    publicado.textContent = calculatePublishDate(noticia.data_publicacao); // (0.25) Mostrar a quanto tempo a notícia foi publicada, com base na data de publicação. Ex possíveis: "Publicado há 2 dias", "Publicado hoje", "Publicado ontem".

    const botaoLeiaMais = document.createElement("button"); // (0.1) Adicione um botão "Leia Mais" ao final de cada notícia, que ao ser clicado, abre a página da notícia no site do IBGE, em uma nova aba.
    botaoLeiaMais.textContent = "Leia mais";
    botaoLeiaMais.addEventListener("click", () => {
        window.open(noticia.link, "_blank");
    });

    const divNoticia = document.createElement("div");
    divNoticia.classList.add("noticia");

    const divNoticiaConteudo = document.createElement("div");
    divNoticiaConteudo.classList.add("noticia-conteudo");

    const divNoticiaImagem = document.createElement("div");
    divNoticiaImagem.classList.add("noticia-imagem");

    const divConteudoInfo = document.createElement("div");
    divConteudoInfo.classList.add("conteudo-info");

    const divConteudoPublicado = document.createElement("div");
    divConteudoPublicado.classList.add("conteudo-publicado");

    const divLeiaMais = document.createElement("div");
    divLeiaMais.classList.add("leia-mais");

    divConteudoInfo.appendChild(titulo);
    divConteudoInfo.appendChild(intro);
    divConteudoPublicado.appendChild(editorias);
    divConteudoPublicado.appendChild(publicado);
    divLeiaMais.appendChild(botaoLeiaMais);

    divNoticiaConteudo.appendChild(divConteudoInfo);
    divNoticiaConteudo.appendChild(divConteudoPublicado);
    divNoticiaConteudo.appendChild(divLeiaMais);

    divNoticiaImagem.appendChild(imgNoticia);

    divNoticia.appendChild(divNoticiaImagem);
    divNoticia.appendChild(divNoticiaConteudo);

    liNoticia.appendChild(divNoticia);

    return liNoticia;
}

function calculatePublishDate(data) {
    const dataAtual = new Date();
    const dataPublicacao = new Date(data.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/, '$2/$1/$3 $4:$5:$6'));
    const diferencaTempo = dataAtual - dataPublicacao;
    const diferencaDias = Math.floor(diferencaTempo / (1000 * 60 * 60 * 24));

    if (diferencaDias === 0) {
        return 'Publicado hoje';
    } else if (diferencaDias === 1) {
        return 'Publicado ontem';
    } else {
        return `Publicado há ${diferencaDias} dias`;
    }
}

function pageNoticias() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page')) || 1;
    const totalPages = parseInt(totalPaginas);

    const pagination = document.querySelector('.news-pages');
    pagination.innerHTML = '';

    const maxVisibleButtons = 10; // (0.25) Implemente a lógica para mostrar no máximo 10 botões de páginas. Sempre mostrando a página atual no meio. Ex: Caso o usuário esteja na página 10, mostre as páginas 5, 6, 7, 8, 9, 10, 11, 12, 13, 14. Mesmo comportamento do site do IBGE
    const halfMaxVisibleButtons = Math.floor(maxVisibleButtons / 2);

    let startPage = currentPage - halfMaxVisibleButtons;
    startPage = Math.max(1, startPage);

    let endPage = startPage + maxVisibleButtons - 1;
    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = i;
        button.classList.add('page-button');
        if (i === currentPage) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => {
            urlParams.set('page', i.toString()); // (0.25) Atualizar a querystring da página ao clicar em um botão de paginação. Também carregar novos dados da API com base na página selecionada.
            window.history.pushState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
            button
            getNoticias();
        });
        li.appendChild(button);
        pagination.appendChild(li);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateFilterInput(); // (0.35) Caso exista filtros na querystring, eles deverão ser aplicados nos inputs. Ex: url.com?busca=IBGE, o input de busca deverá ter o value "IBGE"
    updateFilterCounter(); // (1) Exiba o número de filtros ativos, baseado na query string, ao lado do ícone de filtro (não contar page e busca). Alinhe com position: absolute.
    getNoticias();
});
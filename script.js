// Array que armazena os candidatos cadastrados manualmente
const listaCandidatos = [];

// Array que armazenará os candidatos importados do arquivo
let listaCandidatosImportados = [];

// Índice para controlar o candidato atual exibido no formulário
let indiceCandidatoAtual = 0;


// Seleciona o input do tipo arquivo para importar dados dos candidatos
const inputArquivo = document.getElementById("dadosCandidato");


// Escuta evento de mudança no input, disparado ao selecionar um arquivo
inputArquivo.addEventListener("change", (evento) => {
    // Obtém o arquivo selecionado, se existir
    const arquivoSelecionado = evento.target.files[0];
    // Sai se nenhum arquivo foi selecionado
    if (!arquivoSelecionado) return;

    // Extrai a extensão do arquivo em letras minúsculas para validação
    const extensaoArquivo = arquivoSelecionado.name.split('.').pop().toLowerCase();

    // Decide qual função utilizar para ler o arquivo, conforme extensão
    switch (extensaoArquivo) {
        case 'json':
            lerArquivoJSON(arquivoSelecionado);
            break;
        case 'csv':
            lerArquivoCSV(arquivoSelecionado);
            break;
        case 'txt':
            abastecerDatalists(inputArquivo);
            break;
        default:
            // Exibe alerta para formatos não suportados
            alert("Formato de arquivo não suportado. Use JSON, CSV ou TXT.");
    }
});


 // Lê um arquivo TXT selecionado e preenche listas de opções (datalists)
function abastecerDatalists(inputElement) {
    // Obtém o arquivo selecionado no input
    const arquivoSelecionado = inputElement.files[0];
    // Sai se nenhum arquivo selecionado
    if (!arquivoSelecionado) return; 

    const leitorArquivo = new FileReader();

    // Função chamada quando o arquivo foi completamente lido
    leitorArquivo.onload = function(event) {
        // Conteúdo do arquivo em texto
        const conteudoArquivo = event.target.result;

        // Divide o conteúdo em linhas, removendo espaços em branco e linhas vazias
        const linhas = conteudoArquivo.split(/\r?\n/).map(linha => linha.trim()).filter(linha => linha.length > 0);

        // Primeira linha: lista de cargos separados por vírgulas ou ponto e vírgula
        const cargos = linhas[0] ? linhas[0].split(/[,;]+/).map(item => item.trim()).filter(Boolean) : [];
        // Segunda linha: lista de empresas
        const empresas = linhas[1] ? linhas[1].split(/[,;]+/).map(item => item.trim()).filter(Boolean) : [];
        // Terceira linha: lista de CNPJs
        const cnpjs = linhas[2] ? linhas[2].split(/[,;]+/).map(item => item.trim()).filter(Boolean) : [];


         // Função para preencher um datalist com opções
        function preencherDatalist(datalistId, itens) {
            const datalistElemento = document.getElementById(datalistId);
            if (!datalistElemento || itens.length === 0) return;

            // Limpa as opções existentes
            datalistElemento.innerHTML = "";

            // Cria e adiciona cada opção
            itens.forEach(valor => {
                const opcao = document.createElement("option");
                opcao.value = valor;
                datalistElemento.appendChild(opcao);
            });
        }

        // Preenche os datalists correspondentes
        preencherDatalist("listaCargos", cargos);
        preencherDatalist("listaEmpresa", empresas);
        preencherDatalist("listaCnpj", cnpjs);
    };

    // Inicia a leitura do arquivo como texto UTF-8
    leitorArquivo.readAsText(arquivoSelecionado, "UTF-8");
}


// Função: ler arquivo JSON
function lerArquivoJSON(arquivo) {
    // Cria leitor de arquivos
    const leitorDeArquivo = new FileReader();

    // Ação executada quando o arquivo for carregado
    leitorDeArquivo.onload = function (evento) {
        try {
            // Obtém o conteúdo do arquivo lido pelo FileReader
            const conteudo = evento.target.result;
            // Converte o texto JSON para objeto JavaScript
            const dadosParseados = JSON.parse(conteudo);

            // Se JSON for um único objeto, converte para lista com um item
            listaCandidatosImportados = Array.isArray(dadosParseados) ? dadosParseados : [dadosParseados];
            // Reseta índice do candidato atual para o primeiro da lista importada
            indiceCandidatoAtual = 0;

            // Se houver candidatos importados, preenche formulário com o primeiro e mostra alerta de sucesso
            if (listaCandidatosImportados.length > 0) {
                preencherFormulario(listaCandidatosImportados[0]);
                alert(`${listaCandidatosImportados.length} candidatos importados com sucesso.`);
            } else {
                // Alerta se JSON válido mas vazio
                alert("JSON válido, porém sem registros.");
            }
        } catch (erro) {
            // Em caso de erro na leitura/parsing do JSON, alerta usuário
            alert("Erro ao ler o arquivo JSON. Verifique o formato.");
        }
    };

    // Inicia leitura do arquivo como texto UTF-8
    leitorDeArquivo.readAsText(arquivo, "UTF-8");
}


// Normaliza uma chave de cabeçalho para facilitar mapeamento
function normalizarChave(texto) {
    if (!texto) return "";
    // Remove acentos, espaços e caracteres não alfanuméricos, e converte para minúsculas
    return texto
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "");
}


// Detecta delimitador CSV ',' ou ';' com base na linha de cabeçalho
function detectarDelimitadorCSV(linhaCabecalho) {
    // Conta quantidade de vírgulas e ponto e vírgulas na linha para detectar delimitador
    const qtdVirgulas = (linhaCabecalho.match(/,/g) || []).length;
    const qtdPontoVirgulas = (linhaCabecalho.match(/;/g) || []).length;
    return qtdPontoVirgulas > qtdVirgulas ? ';' : ',';
}


// Parseia uma linha CSV respeitando aspas e delimitadores
function parsearLinhaCSV(linha, delimitador) {
    const resultado = [];
    let campoAtual = "";
    let dentroAspas = false;

    for (let i = 0; i < linha.length; i++) {
        const caractere = linha[i];
        const proximo = linha[i + 1];

        // Lógica para lidar com aspas duplas dentro dos campos CSV
        if (caractere === '"') {
            if (!dentroAspas) {
                dentroAspas = true;
                continue;
            } else {
                if (proximo === '"') {
                    campoAtual += '"';
                    i++;
                    continue;
                } else {
                    dentroAspas = false;
                    continue;
                }
            }
        }

        // Se encontrar delimitador fora de aspas, campo termina aqui
        if (caractere === delimitador && !dentroAspas) {
            resultado.push(campoAtual);
            campoAtual = "";
            continue;
        }

        // Acumula caractere no campo atual
        campoAtual += caractere;
    }

    // Adiciona último campo da linha e remove espaços em branco
    resultado.push(campoAtual);
    return resultado.map(f => f.trim());
}


// Função: ler arquivo CSV e importar candidatos
function lerArquivoCSV(arquivo) {
    const leitorDeArquivo = new FileReader();

    leitorDeArquivo.onload = function (evento) {
        // Obtém texto CSV
        const textoCSV = evento.target.result;
        // Reseta importados e índice
        listaCandidatosImportados = [];
        indiceCandidatoAtual = 0;

        // Divide texto em linhas, suportando diferentes sistemas operacionais
        const linhasBrutas = textoCSV.split(/\r?\n/);

        // Filtra linhas vazias e nulas para evitar erros
        const linhas = linhasBrutas.filter(linha => linha !== undefined && linha.trim() !== "");

        // Verifica se há linhas para processar
        if (linhas.length < 1) {
            alert("Arquivo CSV vazio ou formato incorreto.");
            return;
        }

        // Detecta delimitador mais provável
        const delimitador = detectarDelimitadorCSV(linhas[0]);
        // Parseia linha do cabeçalho dividindo nos campos
        const camposCabecalho = parsearLinhaCSV(linhas[0], delimitador);
        // Normaliza nomes das colunas para facilitar mapeamento
        const camposNormalizados = camposCabecalho.map(normalizarChave);

        // Mapeia nomes normalizados para propriedades do objeto candidato
        const mapaChavesCSV = {
            nome: "nome",
            nomecompleto: "nome",
            cpf: "cpf",
            cargo: "cargo",
            tipoexame: "tipoExame",
            tipodeexame: "tipoExame",
            tipo_de_exame: "tipoExame",
            tipo: "tipoExame",
            dataexame: "dataExame",
            datadeexame: "dataExame",
            data_de_exame: "dataExame",
            data: "dataExame",
            datadoexame: "dataExame",
            empresa: "empresa",
            cnpj: "cnpj"
        };

        // Processa cada linha de dados, criando objeto candidato correspondendo campos
        for (let i = 1; i < linhas.length; i++) {
            const linha = linhas[i];
            // Ignora linhas vazias
            if (!linha || !linha.trim()) continue;

            // Parseia linha conforme delimitador detectado
            const valores = parsearLinhaCSV(linha, delimitador);
            let candidato = {};

            // Associa valores normalizados ao objeto candidato usando mapa
            for (let coluna = 0; coluna < camposNormalizados.length; coluna++) {
                const chaveNormalizada = camposNormalizados[coluna];
                const valor = valores[coluna] !== undefined ? valores[coluna] : "";

                if (mapaChavesCSV[chaveNormalizada]) {
                    candidato[mapaChavesCSV[chaveNormalizada]] = valor;
                } else {
                    candidato[chaveNormalizada] = valor;
                }
            }

            // Adiciona candidato à lista de importados
            listaCandidatosImportados.push(candidato);
        }

        // Se houver candidatos importados, preenche formulário e alerta
        if (listaCandidatosImportados.length > 0) {
            preencherFormulario(listaCandidatosImportados[0]);
            alert(`${listaCandidatosImportados.length} candidatos importados do CSV.`);
        } else {
            // Alerta caso nenhum registro válido tenha sido encontrado
            alert("Nenhum registro válido encontrado no CSV.");
        }
    };

    // Inicia leitura do arquivo como texto UTF-8
    leitorDeArquivo.readAsText(arquivo, "UTF-8");
}


// Função: obtém valor de campo do candidato a partir de várias possíveis chaves
function obterCampoCandidato(candidato, possiveisChaves) {
    // Retorna string vazia se argumento inválido
    if (!candidato || typeof candidato !== "object") return "";

    // Tenta acessar diretamente as possíveis chaves
    for (const chave of possiveisChaves) {
        if (candidato[chave] !== undefined && candidato[chave] !== "") return candidato[chave];
        const chaveNormalizada = normalizarChave(chave);
        if (candidato[chaveNormalizada] !== undefined && candidato[chaveNormalizada] !== "") return candidato[chaveNormalizada];
    }

    // Tenta encontrar chave normalizada entre todas as chaves do objeto
    const chavesNormalizadas = possiveisChaves.map(normalizarChave);
    for (const campo in candidato) {
        if (chavesNormalizadas.includes(normalizarChave(campo)) && candidato[campo] !== "") {
            return candidato[campo];
        }
    }

    // Se nenhum campo encontrado, retorna vazio
    return "";
}


// Função: preenche formulário com dados do candidato
function preencherFormulario(candidato) {
    // Preenche campo nome com as possíveis chaves "nome" ou "nomecompleto"
    document.getElementById("nome").value = obterCampoCandidato(candidato, ["nome", "nomecompleto"]) || "";
    // Preenche campo CPF, formatando com máscara
    document.getElementById("cpf").value = formatarCPF(obterCampoCandidato(candidato, ["cpf"]) || "");
    // Preenche campo cargo
    document.getElementById("cargo").value = obterCampoCandidato(candidato, ["cargo"]) || "";

    // Obtém valor do tipo de exame a partir das possíveis chaves
    const valorTipoExame = obterCampoCandidato(candidato, ["tipoExame", "tipoexame", "tipodeexame", "tipo_de_exame", "tipo"]);
    if (valorTipoExame) {
        const selectTipoExame = document.getElementById("tipoExame");
        // Tenta selecionar opção exatamente igual ao valor ignorando 'case'
        let opcaoEncontrada = Array.from(selectTipoExame.options).find(opt => opt.value.toLowerCase() === valorTipoExame.toLowerCase());
        if (opcaoEncontrada) {
            selectTipoExame.value = opcaoEncontrada.value;
        } else {
            // Tenta encontrar opção que contenha valor no texto para mais flexibilidade
            const tentativa = Array.from(selectTipoExame.options).find(opt => opt.text.toLowerCase().includes(valorTipoExame.toLowerCase()));
            if (tentativa) selectTipoExame.value = tentativa.value;
            // fallback: valor cru
            else selectTipoExame.value = valorTipoExame; 
        }
    } else {
        // Se não encontrado, campo tipoExame fica vazio
        document.getElementById("tipoExame").value = "";
    }

    // Preenche campo data
    const dataBruta = obterCampoCandidato(candidato, ["dataExame", "dataexame", "datadeexame", "data_de_exame", "data", "datadoexame"]);
    document.getElementById("dataExame").value = dataBruta || "";

    // Preenche campo empresa (digitação, seleção e importação)
    document.getElementById("empresa").value =
    obterCampoCandidato(candidato, ["empresa"]) || "";
    // Preenche campo CNPJ (digitação, seleção e importação)
    document.getElementById("cnpj").value =
        formatarCNPJ(obterCampoCandidato(candidato, ["cnpj"]) || "");
}


// Função: formata CPF com máscara
function formatarCPF(cpf) {
    if (!cpf) return "";
    // Remove tudo que não seja número e limita a 11 dígitos
    const numeros = cpf.toString().replace(/\D/g, "").substring(0, 11);

    let cpfFormatado = "";
    if (numeros.length > 0) cpfFormatado = numeros.substring(0, 3);
    if (numeros.length > 3) cpfFormatado += "." + numeros.substring(3, 6);
    if (numeros.length > 6) cpfFormatado += "." + numeros.substring(6, 9);
    if (numeros.length > 9) cpfFormatado += "-" + numeros.substring(9, 11);

    return cpfFormatado;
}

// Seleciona input de CPF
const inputCPF = document.getElementById("cpf");

// Escuta evento input para formatar CPF em tempo real conforme digitação
inputCPF.addEventListener("input", function () {
    // Remove caracteres não numéricos e limita a 11 dígitos
    let numerosCPF = this.value.replace(/\D/g, "");
    numerosCPF = numerosCPF.substring(0, 11);

    // Aplica máscara de CPF com pontos e hífen
    let cpfFormatado = "";
    if (numerosCPF.length > 0) cpfFormatado = numerosCPF.substring(0, 3);
    if (numerosCPF.length > 3) cpfFormatado += "." + numerosCPF.substring(3, 6);
    if (numerosCPF.length > 6) cpfFormatado += "." + numerosCPF.substring(6, 9);
    if (numerosCPF.length > 9) cpfFormatado += "-" + numerosCPF.substring(9, 11);

    this.value = cpfFormatado;
});


// Função: formata CNPJ com máscara
function formatarCNPJ(cnpj) {
    if (!cnpj) return "";
        // Remove tudo que não seja número e limita a 14 dígitos
    const numeros = cnpj.toString().replace(/\D/g, "").substring(0, 14);

    let cnpjFormatado = "";
    if (numeros.length > 0) cnpjFormatado = numeros.substring(0, 2);
    if (numeros.length > 2) cnpjFormatado += "." + numeros.substring(2, 5);
    if (numeros.length > 5) cnpjFormatado += "." + numeros.substring(5, 8);
    if (numeros.length > 8) cnpjFormatado += "/" + numeros.substring(8, 12);
    if (numeros.length > 12) cnpjFormatado += "-" + numeros.substring(12, 14);

    return cnpjFormatado;
}

// Seleciona input de CNPJ
const inputCNPJ = document.getElementById("cnpj");

// Escuta evento input para formatar CNPJ em tempo real conforme digitação
inputCNPJ.addEventListener("input", function () {
          // Remove tudo que não seja número e limita a 14 dígitos
    let numerosCNPJ = this.value.replace(/\D/g, "").substring(0, 14);

    // Aplica máscara de CN0J com pontos, barra e hífen
    let cnpjFormatado = "";
    if (numerosCNPJ.length > 0) cnpjFormatado = numerosCNPJ.substring(0, 2);
    if (numerosCNPJ.length > 2) cnpjFormatado += "." + numerosCNPJ.substring(2, 5);
    if (numerosCNPJ.length > 5) cnpjFormatado += "." + numerosCNPJ.substring(5, 8);
    if (numerosCNPJ.length > 8) cnpjFormatado += "/" + numerosCNPJ.substring(8, 12);
    if (numerosCNPJ.length > 12) cnpjFormatado += "-" + numerosCNPJ.substring(12, 14);

    this.value = cnpjFormatado;
});

// Evento: envio do formulário para adicionar candidato
document.getElementById("formCandidato").addEventListener("submit", (evento) => {
    // Previne envio padrão do formulário (recarregamento da página)
    evento.preventDefault();

    const formulario = evento.target;

    // Valida formulário e exibe erros caso necessário
    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return;
    }

    // Cria objeto candidato com dados atuais do formulário
    const candidatoAtual = {
        nome: document.getElementById("nome").value.trim(),
        cpf: document.getElementById("cpf").value.trim(),
        cargo: document.getElementById("cargo").value.trim(),
        tipoExame: document.getElementById("tipoExame").value,
        dataExame: document.getElementById("dataExame").value,
        empresa: document.getElementById("empresa").value,
        cnpj: document.getElementById("cnpj").value
    };

    // Adiciona candidato à lista manualmente cadastrada
    listaCandidatos.push(candidatoAtual);

    // Exibe alerta de sucesso na adição
    mostrarAlerta("Candidato adicionado!");

    // Incrementa índice para próximo candidato importado
    indiceCandidatoAtual++;

    // Verifica se há próximo candidato importado para preencher formulário
    if (indiceCandidatoAtual < listaCandidatosImportados.length) {
        preencherFormulario(listaCandidatosImportados[indiceCandidatoAtual]);
    } else {
        // Se não houver, reseta formulário para entrada manual
        formulario.reset();
    }
});


// Função: alerta flutuante para mensagens na tela
function mostrarAlerta(mensagem) {
    // Cria elemento div para alerta
    const alerta = document.createElement("div");
    alerta.className = "alerta";
    alerta.textContent = mensagem;

    // Adiciona alerta ao corpo da página
    document.body.appendChild(alerta);

    // Aplica animação CSS
    setTimeout(() => alerta.classList.add("mostrar"), 10);

    // Remove alerta após 3 segundos com animação suave
    setTimeout(() => {
        alerta.classList.remove("mostrar");
        setTimeout(() => alerta.remove(), 300);
    }, 3000);
}


// Função: gera arquivos JSON, CSV e SQL para download dos candidatos cadastrados
function gerarArquivos() {
    // Valida se há candidatos cadastrados; alerta se vazio
    if (listaCandidatos.length === 0) {
        mostrarAlerta("Nenhum candidato adicionado");
        return;
    }

    // Obtém tipo de arquivo selecionado no select
    const tipoArquivoSelecionado = document.getElementById("tipoArquivo").value;
    // Gera string JSON formatada
    const jsonStr = JSON.stringify(listaCandidatos, null, 2);

    // Define cabeçalho do arquivo CSV
    const cabecalhoCSV = [
        "Nome", "CPF", "Cargo", "Tipo de Exame",
        "Data de Exame", "Empresa", "CNPJ"
    ];

    // Constrói linhas CSV, escapando aspas internas e separando por ponto e vírgula
    const linhasCSV = listaCandidatos.map(candidato => [
        `"${String(candidato.nome || "").replace(/"/g, '""')}"`,
        `"${String(candidato.cpf || "").replace(/"/g, '""')}"`,
        `"${String(candidato.cargo || "").replace(/"/g, '""')}"`,
        `"${String(candidato.tipoExame || "").replace(/"/g, '""')}"`,
        `"${String(candidato.dataExame || "").replace(/"/g, '""')}"`,
        `"${String(candidato.empresa || "").replace(/"/g, '""')}"`,
        `"${String(candidato.cnpj || "").replace(/"/g, '""')}"`
    ].join(";"));

    // Monta CSV completo com cabeçalho e linhas
    const csvCompleto = [cabecalhoCSV.join(";"), ...linhasCSV].join("\n");

    // Monta comandos SQL para inserir dados dos candidatos
    const sqlCompleto = listaCandidatos.map(candidato =>
        `INSERT INTO candidatos (nome, cpf, cargo, tipoExame, dataExame, empresa, cnpj)\nVALUES ('${(candidato.nome || "").replace(/'/g, "''")}', '${(candidato.cpf || "").replace(/'/g, "''")}', '${(candidato.cargo || "").replace(/'/g, "''")}', '${(candidato.tipoExame || "").replace(/'/g, "''")}', '${(candidato.dataExame || "").replace(/'/g, "''")}', '${(candidato.empresa || "").replace(/'/g, "''")}', '${(candidato.cnpj || "").replace(/'/g, "''")}');`
    ).join("\n");

    
    // Função para salvar arquivos com conteúdo
    function baixarArquivo(nomeArquivo, conteudo, tipoMime) {
        // Cria um objeto Blob com o conteúdo e codificação UTF-8
        const blob = new Blob(["\uFEFF" + conteudo], { type: tipoMime + ";charset=utf-8;" });
        const link = document.createElement("a");

        // Cria URL temporário para o download
        link.href = window.URL.createObjectURL(blob);
        link.download = nomeArquivo;
        // Adiciona link no corpo da página
        document.body.appendChild(link);
        // Dispara clique no link para iniciar download
        link.click();
        // Remove link do corpo da página após o download
        document.body.removeChild(link);
        // Libera memória removendo URL criado
        window.URL.revokeObjectURL(link.href);
    }

    // Executa downloads dos arquivos selecionados
    if (tipoArquivoSelecionado === "json" || tipoArquivoSelecionado === "todos") {
        baixarArquivo("candidatos.json", jsonStr, "application/json");
    }
    if (tipoArquivoSelecionado === "csv" || tipoArquivoSelecionado === "todos") {
        baixarArquivo("candidatos.csv", csvCompleto, "text/csv");
    }
    if (tipoArquivoSelecionado === "sql" || tipoArquivoSelecionado === "todos") {
        baixarArquivo("candidatos.sql", sqlCompleto, "text/plain");
    }

    // Exibe alerta após geração dos arquivos
    mostrarAlerta("Arquivos gerados");
}


// Evento: escuta seleção do tipo de arquivo no elemento select para gerar arquivos
document.getElementById("tipoArquivo").addEventListener("change", gerarArquivos);
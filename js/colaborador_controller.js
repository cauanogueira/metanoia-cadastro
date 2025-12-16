/* ==========================================================================
   ARQUIVO: js/colaborador_controller.js
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const rhData = Utils.decodeData(params.get('data'));
    
    if (!rhData) { 
        console.error("Link inválido ou dados não encontrados."); 
        // Melhor UX do que um alert() que trava a tela
        document.querySelector('.container').innerHTML = "<h1>Link de Admissão Inválido</h1><p>Entre em contato com o RH.</p>";
        return; 
    }

    // --- FUNÇÕES DE FORMATAÇÃO ---
    
    // Formata Moeda (Ex: R$ 2.500,00)
    const formatCurrency = (value) => {
        if (!value) return '';
        return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Formata CPF (Ex: 000.000.000-00)
    const formatCPF = (v) => {
        if (!v) return '';
        v = v.replace(/\D/g, ""); // Remove tudo o que não é dígito
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        return v;
    };

    // --- INICIALIZAÇÃO DA TELA ---

    // Preencher dados fixos e configurar UI
    document.getElementById('welcome-msg').innerText = `Olá, ${rhData.nome}`;
    document.getElementById('field-nome').value = rhData.nome;
    document.getElementById('field-cargo').value = rhData.cargo;
    // Exibe salário formatado na tela
    document.getElementById('field-salario').value = formatCurrency(rhData.salario);
    
    const emailRhElement = document.getElementById('modal-email-rh'); 
    
    // Define o email no modal
    // O fallback é mantido caso o campo não tenha sido incluído na URL por um RH desatualizado.
    emailRhElement.innerText = rhData.email_rh || "rh@metanoiaengenharia.com.br"; 

    // -----------------------------------------------------------------
    // --- NOVA LÓGICA: COPIAR E-MAIL DO RH NO CLIQUE ---
    // -----------------------------------------------------------------
    emailRhElement.addEventListener('click', async () => {
        const email = emailRhElement.innerText;
        
        // Salva os estados originais para restauração
        const originalContent = email;
        const originalBg = emailRhElement.style.backgroundColor;

        try {
            // A API Clipboard é assíncrona
            await navigator.clipboard.writeText(email);
            
            // Feedback visual de sucesso: altera texto e cor (requisito: "E-mail copiado para a área de transferência")
            emailRhElement.innerText = "✅ E-mail copiado para a área de transferência";
            emailRhElement.style.backgroundColor = '#d4edda'; // Cor suave de sucesso (verde claro)

            setTimeout(() => {
                // Retorna ao estado original
                emailRhElement.innerText = originalContent;
                emailRhElement.style.backgroundColor = originalBg; // Retorna à cor original
            }, 2500);

        } catch (err) {
            console.error('Falha ao copiar o e-mail:', err);
            
            // Feedback de falha: altera texto e cor
            emailRhElement.innerText = "❌ Falha ao copiar. Tente selecionar manualmente.";
            emailRhElement.style.backgroundColor = '#f8d7da'; // Cor suave de erro (vermelho claro)

            setTimeout(() => {
                emailRhElement.innerText = originalContent;
                emailRhElement.style.backgroundColor = originalBg;
            }, 2500);
        }
    });
    // -----------------------------------------------------------------
    // --- FIM NOVA LÓGICA ---
    // -----------------------------------------------------------------


    // --- LOCALSTORAGE & MÁSCARAS ---
    const savedData = JSON.parse(localStorage.getItem('colab_temp_data')) || {};
    const inputsToSave = [
        'input-cpf', 'input-rg', 'input-orgao', 'input-nascimento', 'input-ec', 
        'input-endereco', 'input-telefone', 'input-nacionalidade', 
        'input-banco-colab', 'input-agencia-colab', 'input-conta-colab', 
        'input-bota', 'input-farda'
    ];

    inputsToSave.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Restaura valor
            if (savedData[id]) el.value = savedData[id];
            
            // Evento para salvar e aplicar máscara (se for CPF)
            el.addEventListener('input', (e) => {
                // Máscara dinâmica de CPF
                if (id === 'input-cpf') {
                    e.target.value = formatCPF(e.target.value);
                }
                
                savedData[id] = el.value;
                localStorage.setItem('colab_temp_data', JSON.stringify(savedData));
            });
        }
    });

    // Configura Guia de Exame (Visualização - Checkboxes)
    document.getElementById('print-guia-nome').innerText = rhData.nome.toUpperCase();
    document.getElementById('print-guia-cargo').innerText = rhData.cargo.toUpperCase();
    if (rhData.lista_exames) {
        rhData.lista_exames.forEach(exame => {
            const el = document.getElementById(`check-${exame}`);
            if (el) { el.innerText = '(X)'; el.style.fontWeight = '900'; }
        });
    }

    // --- FUNÇÃO DOWNLOAD PDF (GENÉRICA) ---
    function downloadPDF(elementId, filename) {
        const element = document.getElementById(elementId);
        element.style.display = 'block';
        element.style.backgroundColor = '#ffffff';

        html2pdf().set({
            margin: 5, filename: filename, image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save().then(() => {
            element.style.display = 'none';
        });
    }

    // Botão Guia Exame
    document.getElementById('btn-guia-exame').addEventListener('click', () => {
        downloadPDF('printable-guia', `Guia_Exame_${rhData.nome}.pdf`);
    });

    // Botão Carta Banco
    document.getElementById('btn-carta-banco').addEventListener('click', () => {
        const cpfRaw = document.getElementById('input-cpf').value;
        const rg = document.getElementById('input-rg').value;
        const orgao = document.getElementById('input-orgao').value;

        if(!cpfRaw || !rg || !orgao) { alert("Preencha CPF, RG e Órgão Emissor antes."); return; }
        
        // Formatações para a Carta
        document.getElementById('print-carta-nome').innerText = rhData.nome.toUpperCase();
        document.getElementById('print-carta-cpf').innerText = formatCPF(cpfRaw); // Garante formatação
        document.getElementById('print-carta-rg').innerText = rg;
        document.getElementById('print-carta-orgao').innerText = orgao;
        document.getElementById('print-carta-cargo').innerText = rhData.cargo;
        document.getElementById('print-carta-salario').innerText = formatCurrency(rhData.salario); // Salário R$
        document.getElementById('print-carta-admissao').innerText = new Date(rhData.data_admissao).toLocaleDateString('pt-BR');
        document.getElementById('print-carta-banco').innerText = rhData.banco_empresa;
        document.getElementById('print-carta-cnpj').innerText = rhData.cnpj_empresa;
        document.getElementById('print-carta-data').innerText = new Date().toLocaleDateString('pt-BR');
        
        downloadPDF('printable-carta', `Carta_Banco_${rhData.nome}.pdf`);
    });

    // --- LÓGICA PRINCIPAL: ZIP E FINALIZAÇÃO ---
    const form = document.getElementById('colaboradorForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Atualizar Ficha Visual (Preenchimento)
        document.getElementById('ficha-nome').innerText = rhData.nome.toUpperCase();
        document.getElementById('ficha-cargo').innerText = rhData.cargo.toUpperCase();
        document.getElementById('ficha-salario').innerText = formatCurrency(rhData.salario); // Formata R$
        document.getElementById('ficha-admissao').innerText = new Date(rhData.data_admissao).toLocaleDateString('pt-BR');
        
        // Pessoais
        document.getElementById('ficha-cpf').innerText = formatCPF(document.getElementById('input-cpf').value);
        document.getElementById('ficha-rg').innerText = document.getElementById('input-rg').value;
        document.getElementById('ficha-orgao').innerText = document.getElementById('input-orgao').value;
        document.getElementById('ficha-nasc').innerText = new Date(document.getElementById('input-nascimento').value).toLocaleDateString('pt-BR');
        document.getElementById('ficha-ec').innerText = document.getElementById('input-ec').value;
        document.getElementById('ficha-endereco').innerText = document.getElementById('input-endereco').value;
        document.getElementById('ficha-telefone').innerText = document.getElementById('input-telefone').value;
        document.getElementById('ficha-nacionalidade').innerText = document.getElementById('input-nacionalidade').value;
        
        // Bancários
        document.getElementById('ficha-banco').innerText = document.getElementById('input-banco-colab').value;
        document.getElementById('ficha-agencia').innerText = document.getElementById('input-agencia-colab').value;
        document.getElementById('ficha-conta').innerText = document.getElementById('input-conta-colab').value;
        
        // EPI
        document.getElementById('ficha-bota').innerText = document.getElementById('input-bota').value;
        document.getElementById('ficha-farda').innerText = document.getElementById('input-farda').value;

        // 2. Gerar ZIP
        generateZipAndDownload();
    });

    function generateZipAndDownload() {
        const zip = new JSZip();
        const element = document.getElementById('printable-ficha');
        element.style.display = 'block'; // Mostra para gerar PDF
        element.style.backgroundColor = '#ffffff';

        // Passo A: Gerar PDF da Ficha em BLOB (sem baixar)
        html2pdf().set({
            margin: 5, filename: 'Ficha_Admissao.pdf', image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4' }
        }).from(element).outputPdf('blob').then((pdfBlob) => {
            
            element.style.display = 'none'; // Esconde ficha
            
            // Adiciona Ficha ao ZIP
            zip.file(`Ficha_Admissao_${rhData.nome}.pdf`, pdfBlob);

            // Passo B: Adicionar arquivos de upload ao ZIP
            const fileInput = document.getElementById('docs-upload');
            if (fileInput.files.length > 0) {
                for (let i = 0; i < fileInput.files.length; i++) {
                    const file = fileInput.files[i];
                    zip.file(`${rhData.nome}_${file.name}`, file);
                }
            } else {
                zip.file("Aviso.txt", "O colaborador não anexou documentos digitais, apenas gerou a ficha.");
            }

            // Passo C: Gerar o arquivo .zip final e baixar
            zip.generateAsync({type:"blob"}).then(function(content) {
                const link = document.createElement("a");
                link.href = URL.createObjectURL(content);
                link.download = `${rhData.nome}_Admissao.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Passo D: Exibir Modal de Sucesso
                document.getElementById('modal-sucesso').style.display = 'flex';
            });
        });
    }
});
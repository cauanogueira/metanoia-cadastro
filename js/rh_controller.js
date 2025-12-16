/* ==========================================================================
   ARQUIVO: js/rh_controller.js
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('rhForm');
    const submitButton = form.querySelector('button[type="submit"]'); // Captura o botão

    form.addEventListener('submit', async (e) => { // Tornar a função assíncrona para usar await no clipboard
        e.preventDefault();

        const originalText = submitButton.textContent; // Salva o texto original do botão

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Captura Múltipla dos Checkboxes
        const examesSelecionados = Array.from(document.querySelectorAll('input[name="exames"]:checked'))
            .map(checkbox => checkbox.value);
        data.lista_exames = examesSelecionados;

        // Gera URL
        const slugName = data.nome.toLowerCase().replace(/\s+/g, '_');
        // A função Utils.encodeData é assumida como existente para codificação
        const payload = Utils.encodeData(data); 

        // Detecta URL base
        let baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
        const targetUrl = `${baseUrl}/colaborador.html?id=${slugName}&data=${payload}`;

        // NOVO COMPORTAMENTO: Copiar para Área de Transferência
        try {
            await navigator.clipboard.writeText(targetUrl);
            
            // 1. Feedback visual no botão
            submitButton.textContent = '✅ Link copiado para a área de transferência!';
            submitButton.disabled = true;

            // 2. Volta ao estado original após 2.5 segundos
            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 2500);

            // 3. Exibição do link no console (Para testes/desenvolvimento - opcional)
            console.log("Link gerado e copiado:", targetUrl);

        } catch (err) {
            // Caso a API do Clipboard falhe (ex: contexto não seguro/navegador antigo)
            console.error('Falha ao copiar o texto:', err);
            submitButton.textContent = '❌ Falha ao copiar o link!';
            setTimeout(() => {
                submitButton.textContent = originalText;
            }, 2500);
            
            // Fallback: Exibir o link no console e alertar o usuário
            alert(`Falha ao copiar. O link é: ${targetUrl}. Tente copiar manualmente.`);
        }
    
    });
});
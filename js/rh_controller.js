/* ==========================================================================
   ARQUIVO: js/rh_controller.js
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('rhForm');
    const backupArea = document.getElementById('link-backup-area');
    const backupLink = document.getElementById('generated-link');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Captura Múltipla dos Checkboxes
        const examesSelecionados = Array.from(document.querySelectorAll('input[name="exames"]:checked'))
            .map(checkbox => checkbox.value);
        data.lista_exames = examesSelecionados;

        // Gera URL
        const slugName = data.nome.toLowerCase().replace(/\s+/g, '_');
        const payload = Utils.encodeData(data);

        // Detecta URL base
        let baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
        const targetUrl = `${baseUrl}/colaborador.html?id=${slugName}&data=${payload}`;

        // Backup visual
        backupLink.href = targetUrl;
        backupLink.textContent = targetUrl;
        backupArea.style.display = 'block';

        // Envio Automático E-mail
        const subject = `Processo de Admissão - Metanoia Engenharia (${data.nome})`;
        const body = `Olá, ${data.nome}!\n\n` +
                     `Por favor, acesse o link abaixo para preencher sua ficha de admissão e baixar seus documentos:\n` +
                     `${targetUrl}\n\n` +
                     `Atenciosamente,\nRH Metanoia Engenharia`;

        window.location.href = `mailto:${data.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
});
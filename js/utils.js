const Utils = {
    // Codifica objeto para Base64 seguro para URL
    encodeData: (data) => {
        const jsonString = JSON.stringify(data);
        return btoa(unescape(encodeURIComponent(jsonString)));
    },
    // Decodifica Base64 da URL para objeto
    decodeData: (encodedString) => {
        try {
            return JSON.parse(decodeURIComponent(escape(atob(encodedString))));
        } catch (e) {
            console.error("Erro ao decodificar:", e);
            return null;
        }
    },
    // Gera download de arquivos no navegador
    downloadFile: (filename, content, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
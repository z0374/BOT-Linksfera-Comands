    /**
 * Gera uma string formatada com os links disponíveis para seleção,
 * excluindo aqueles que já foram selecionados na sessão atual.
 * * @param {Array} dataLinks - Array de objetos vindos do banco de dados (tabela assets).
 * @param {Object} sessionData - Objeto contendo os dados atuais da sessão (SESSION.data).
 * @returns {string} - Mensagem formatada com a lista de links e o botão PULAR.
 */
function listLinks(dataLinks, sessionData) {
    // 1. Cria um Set com os IDs já selecionados para busca rápida (O(1))
    // O filter(Boolean) remove null/undefined e o map(String) garante comparação de texto
    const selectedIds = new Set(
        [sessionData?.links1, sessionData?.links2, sessionData?.links3]
        .filter(Boolean)
        .map(String)
    );

    const linksSelect = [];

    // 2. Itera sobre os links disponíveis
    for (const link of dataLinks) {
        const idStr = String(link.id);

        // Se o ID já estiver selecionado, pula para o próximo
        if (selectedIds.has(idStr)) continue;

        try {
            // Tenta fazer o parse dos dados do link
            const dataLink = JSON.parse(link.data);
            
            // Adiciona à lista formatada
            linksSelect.push(`Link: ${dataLink.titulo}   /Selecionar_link${link.id}`);
        } catch (error) {
            console.error(`Erro ao processar link ID ${link.id}:`, error);
            // Opcional: Adicionar um item de erro ou apenas ignorar
        }
    }

    // 3. Se não sobrou nenhum link disponível
    if (linksSelect.length === 0) {
        return "Não há mais links disponíveis para seleção.\n\n/PULAR";
    }

    // 4. Retorna a lista unida
    return linksSelect;
}

export{ listLinks }
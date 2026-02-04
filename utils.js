import { commands_manifest, disableHyperlinks, normalize } from "../../engine/engine.index";

/**
 * Retorna os links paginados com sistema de Cache em SESSION.data.
 * O Cache armazena o HTML pronto dos cards e rodapé para economizar processamento e BD.
 * * @param {string} action - Comando de navegação (start, next, prev, pag02)
 * @param {object} env - Variáveis de ambiente (D1)
 * @param {object} SESSION - Objeto da sessão do usuário
 * @returns {Promise<{header: string, cards: Array, footer: string}>}
 */
async function pageLinks(action, env, SESSION) {
const comandLinksfera = normalize(commands_manifest[0].name);
    const ITENS_POR_PAGINA = 6;

    // Normaliza a ação: remove barras, espaços e converte para minúsculo
    // Ex: "/pag_02" vira "pag_02" ou "pag02" (dependendo do seu normalize)
    let comando = action ? action.replace('/', '').toLowerCase().trim() : 'start';
    
    // Remove caracteres especiais para facilitar a comparação (caso o normalize do bot remova _)
    const cmdLimpo = comando.replace(/[^a-z0-9]/g, ''); // "pag_02" -> "pag02"

    // 1. Inicialização e Cache de Contagem
    // Se for 'start' ou se a estrutura de cache não existir, reinicia.
    if (comando === 'start' || !SESSION.data || typeof SESSION.data !== 'object' || !SESSION.data.Total) {
        
        // Busca o total no banco (Query leve)
        const countResult = await env.Data.prepare("SELECT COUNT(*) as total FROM assets WHERE type = 'link'").first();
        const totalItens = countResult.total;

        // Inicializa estrutura do SESSION.data
        SESSION.data = {
            páginaAtual: 1,
            Total: totalItens
            // Chaves dinâmicas 'pag01', 'pag02' serão criadas aqui
        };
    }

    const totalPaginas = Math.ceil(SESSION.data.Total / ITENS_POR_PAGINA);

    // 2. Lógica de Navegação (Extração Robusta de Números)
    let paginaAlvo = SESSION.data.páginaAtual || 1;

    if (cmdLimpo.includes('start')) {
        paginaAlvo = 1;
    } 
    else if (cmdLimpo.includes('next')) {
        paginaAlvo++;
    } 
    else if (cmdLimpo.includes('prev')) {
        paginaAlvo--;
    } 
    // Detecta "pag" seguido de números (pag02, pag2, pag_05)
    else if (cmdLimpo.includes('pag')) {
        // Remove tudo que NÃO for número
        const apenasDigitos = cmdLimpo.replace(/\D/g, ""); 
        const num = parseInt(apenasDigitos);
        
        if (!isNaN(num)) {
            paginaAlvo = num;
        }
    }

    // Travas de segurança (Limites)
    if (paginaAlvo < 1) paginaAlvo = 1;
    if (paginaAlvo > totalPaginas && totalPaginas > 0) paginaAlvo = totalPaginas;

    // Atualiza a página atual na sessão
    SESSION.data.páginaAtual = paginaAlvo;

    // 3. VERIFICAÇÃO DE CACHE (Cache-First)
    const numFmtCache = paginaAlvo.toString().padStart(2, '0'); // ex: "01"
    const cacheKey = `pag${numFmtCache}`; // ex: "pag01"

    // Se a página já existe na memória, retorna ela e ignora o D1
    if (SESSION.data[cacheKey]) {
        return SESSION.data[cacheKey];
    }

    // ======================================================
    // Sem Cache: Busca no D1
    // ======================================================

    if (SESSION.data.Total === 0) {
        const emptyResult = { cards: ["<i>Nenhum link cadastrado.</i>"], footer: "" };
        SESSION.data[cacheKey] = emptyResult;
        return emptyResult;
    }

    const offset = (paginaAlvo - 1) * ITENS_POR_PAGINA;
    const sql = `
        SELECT id, data FROM assets 
        WHERE type = 'link' 
        ORDER BY id DESC 
        LIMIT ? OFFSET ?
    `;

    const result = await env.Data.prepare(sql)
        .bind(ITENS_POR_PAGINA, offset)
        .all();

    // 4. Montagem dos Cards
    const cards = [];

    if (result.results && result.results.length > 0) {
        for (const row of result.results) {
            try {
                const link = JSON.parse(row.data);
                
                // Ícones de status
                let statusIcon = "⚪"; 
                if(link.visible === "show") statusIcon = "🟢";
                if(link.visible === "hidden") statusIcon = "🔴";
                if(link.visible === "pin") statusIcon = "📌";

                // Monta o Card Individual
                let card = `╭─────────────────────\n`;
                card += `│ 🏷 <b>${link.titulo}</b> (${statusIcon})\n`;
                card += `│ 📝 <i>${link.legenda || ''}</i>\n`;
                card += `│ 🔗 <a href="${link.url}">${link.texto || 'Acessar Link'}</a>\n`;
                card += `│       ➡URL:<i>${disableHyperlinks(link.url)}</i>\n`;
                card += `╰─────────────────────`;
                
                // Adiciona ao array como [texto, id]
                cards.push([card, row.id]);
            } catch (e) {
                console.error(`Erro parse link ID ${row.id}`, e);
            }
        }
    } else {
        cards.push("<i>Página vazia.</i>");
    }

    // 5. Montagem do Rodapé Numérico
    let footer = "";
    if (paginaAlvo > 1) footer += "/prev ⬅️   ";
    if (paginaAlvo > 1 && paginaAlvo < totalPaginas) footer = "|";
    if (paginaAlvo < totalPaginas) footer += "   ➡️ /next";
    footer += "\n─────────────────────\n";
    for (let i = 1; i <= totalPaginas; i++) {
        const numFmt = i.toString().padStart(2, '0');
        
        // Se for a página atual, mostra entre colchetes, senão mostra comando
        if (i === paginaAlvo) footer += `[pag${numFmt}] `;
        else footer += `/pag_${numFmt} `;
    }

    footer += "\n─────────────────────\n/encerrar   |   /" + comandLinksfera;
    // 6. SALVAR NO CACHE
    const pageResult = { cards, footer };
    SESSION.data[cacheKey] = pageResult;

    return pageResult;
}

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

export { listLinks, pageLinks }
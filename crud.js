import { commands_manifest, normalize, saveSession, loadSession, sendCallBackMessage, sendMessage, escapeHTML, yesOrNo, dataRead, dataUpdate, dataDelete, dataExist, dataSave, downloadGdrive, sendMidia, image } from "../../engine/engine.index.js";
import { handleAddedLink } from "./added.js";

export async function handleCRUDLink(SESSION, messageText, userId, chatId, userName, update, env) {

    const comandLinksfera = normalize(commands_manifest[0].name);

    switch (normalize(SESSION.state)) {
        case normalize("waiting_list_crud"):
            SESSION.procesCont = 0;
            const result = await dataRead("assets", { type: 'link' }, env);
            const taskLink = messageText.toLowerCase().includes('editar') ? 'EDITAR' : 'DELETAR';

            if (result.length == 0) {
                SESSION = await loadSession(env, userId, true);
                await saveSession(env, userId, SESSION);
                const messageVoid = `Sem links para ${taskLink}`;
                await sendMessage(messageVoid, chatId, env); 
                await sendMessage("/encerrar   |   /" + comandLinksfera, chatId, env);
                return new Response(messageVoid, { status: 200 });
            }

            const links = Array.isArray(result) ? result : [result];
            SESSION.state = 'waiting_start_' + taskLink.toLowerCase(); // waiting_start_editar ou waiting_start_deletar
            await saveSession(env, userId, SESSION);

            const message = [];
            for (const link of links) {
                const dataLinks = JSON.parse(link.data);
                message.push(`
    <b>Titulo: ${dataLinks.titulo}</b>
Link: ${dataLinks.url}
_______________ /Selecionar_link${link.id}_${taskLink.toLowerCase()}
                        `);
            }
            await sendMessage(`Olá Sr. ${userName},\nEscolha qual registro deseja ${taskLink}.:`, chatId, env);
            await sendMessage(message.join("\n\n\n") + "\n\n/encerrar   |   /" + comandLinksfera, chatId, env);
            return new Response('Aguardando selecionar!', { status: 200 });
            break;

        case normalize('waiting_start_crud'): 
            SESSION.procesCont = 0;
            
            // Extrai o ID numérico da string de comando
            SESSION.titulo = parseInt(messageText.replace(/\D+/g, "")); 
            
            const dataLink = await dataRead("assets", { id: parseInt(SESSION.titulo) }, env);
            if ((!isNaN(SESSION.titulo)) && dataLink && dataLink.type == 'link') {

                // MODO EDIÇÃO
                if (messageText.includes("editar")) {
                    // ATUALIZAÇÃO: Preenche SESSION.data com o objeto do banco para edição
                    SESSION.data = JSON.parse(dataLink.data); 
                    SESSION.texto = dataLink.data;
                    await saveSession(env, userId, SESSION);
                    
                    // Redireciona para o fluxo de "Adicionar" (que serve como editor)
                    messageText = "Adicionar_Link";
                    // CORREÇÃO: 'session' (minúsculo) corrigido para 'SESSION' (maiúsculo)
                    await handleAddedLink(SESSION, messageText, userId, chatId, userName, update, env);
                    
                    return new Response("Iniciando Edição !", { status: 200 });

                // MODO DELEÇÃO
                } else if (messageText.includes("deletar")) {

                    SESSION.state = 'waiting_confirm_deletar';

                    const deleted = JSON.parse(dataLink.data);

                    // Armazena em SESSION.data para consistência, embora use SESSION.texto para validação
                    SESSION.data = deleted; 
                    SESSION.texto = deleted.titulo;
                    
                    await saveSession(env, userId, SESSION);

                    await sendMessage(`Titulo: ${deleted.titulo}\nLegenda: ${deleted.legenda}\nTexto do Link: ${deleted.texto}\nURL: ${deleted.url}\n   Visibilidade: ${deleted.visible}\n\nTags:\n   ${deleted.tags}`, chatId, env);
                    await sendMessage("Deseja excluir este link?\n   /SIM   |   /NAO", chatId, env);

                    return new Response("Confirmando deleção !", { status: 200 });
                }
            }

            // Se chegou aqui, o comando ou ID era inválido
            SESSION.state = "waiting_list_crud";
            await sendMessage("Registro selecionado inválido ou ação desconhecida.", chatId, env);
            
            // Chama a si mesmo recursivamente para listar novamente (cuidado com loops infinitos, mas ok aqui)
            await handleCRUDLink(SESSION, "editar_link", userId, chatId, userName, update, env); 
            
            return new Response("Listando novamente !", { status: 200 });
            break;

        default:
            break;
    }
}
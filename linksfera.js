import { commands_manifest, normalize, saveUserState, sendCallBackMessage, sendMessage, escapeHTML, yesOrNo, dataRead, dataUpdate, dataDelete, dataExist, dataSave, downloadGdrive, sendMidia, image } from "../../engine/engine.index.js";
import { handleConfiguracaoLink } from "./configuracao.js";
import { handleDeleteLink } from "./delete.js";
import { handleEditLink } from "./edit.js";
import { handleAddedLink } from "./added.js";

async function linksfera(userState, messageText, userId, chatId, userName, update, env){

const comandLinksfera = normalize(commands_manifest[0].name);
try {
        // 1. Lógica de Proteção contra Loop e Contagem de Processos
    if (userState.procesCont > 3) {
        await sendMessage('falha na requisição (loop detectado)', chatId, env);
        await saveUserState(env, userId, null);
        return new Response('Falha na requisição');
    } else {
        userState.procesCont++;
    }
    
} catch (error) {
    const errorMessage = "Erro ao contar os processos: " + error.stack
    await sendCallBackMessage(errorMessage, chatId, env);
    console.error(errorMessage);
    return new Response(errorMessage, {status: 200});
}

try {
    // 3. Verifica estado de recebimento de mídia (Inicializa o fluxo se a mensagem for um arquivo)
    // Se não há um processo ativo e a mensagem NÃO é apenas texto, inicializa o fluxo de mídia.
    if (userState.proces === '' && (update.message?.photo || update.message?.document || update.message?.video) && !userState.state) {
        userState.state = 'received_midia';
    }

    // Determina a seção ativa para roteamento
    const sectionName = !userState?.state
        ? messageText
            : (
                userState.state
                    .toLowerCase()
                    .split("_")
                    .find(part => [ comandLinksfera, "Adicionar", "editar", "Deletar", "configuracao", "ver", "section" ]
                        .map(v => v.toLowerCase()).includes(part)
                    ) || normalize(messageText)
                );

    // Roteamento para a função de fluxo correspondente
    switch (normalize(sectionName)) {

        case normalize(comandLinksfera):
                userState.procesCont = 0;
                userState.proces = normalize(messageText);
                userState.state = 'waiting_section';
                await saveUserState(env, userId, userState);
                await sendMessage(`Olá ${userName}! Como posso ajudar?\n /Adicionar_Link - /editar_Link\n\n /Deletar_Link - /configuracao_Link\n\n /ver_Links --- /encerrar`, chatId, env);
                    return new Response('Aguardando comando', { status: 200 });
                        break;

        case normalize('Adicionar'):
            return await handleAddedLink(userState, messageText, userId, chatId, userName, update, env);
                  break;

        case normalize('editar'):
            const commandEdit = normalize(messageText.split("_")[1]) == normalize("link") ? true : false;
            if(commandEdit) {
                userState.state = "waiting_data_edit";
            }
            return await handleEditLink(userState, messageText, userId, chatId, userName, update, env);
                break;

        case normalize('Deletar'):
            return await handleDeleteLink(userState, messageText, userId, chatId, userName, update, env);
                break;

        case normalize('configuracao'):
            if(normalize(messageText) == normalize("configuracao_link")){
                const result = await dataExist("config", {type:"linksfera"}, env);
                messageText = result ? "configuracao_link" : "start_configuracao";
                    }
            return await handleConfiguracaoLink(userState, messageText, userId, chatId, userName, update, env);
            break;
/*
        case normalize('ver'):
            return await handleListView(userState, messageText, userId, chatId, userName, update, env);
            break;*/

        case normalize("section"):
            userState.state =  normalize(messageText.split('_')[0]);
            await saveUserState(env, userId, userState);
            await linksfera(userState, messageText, userId, chatId, userName, update, env);
                return new Response("Inicializando seção !", {status:200});

        default:
            //userState = null;
            await saveUserState(env, userId, userState);
            const mensagem = 'Comando ou estado de usuário desconhecido.';
            await sendMessage(mensagem, chatId, env);
            await sendMessage(" /"+ comandLinksfera +"\n /comandos - /encerrar", chatId, env);
            return new Response(mensagem, { status: 200 });
    }
    } catch (error) {
        const errorMessage = "Erro ao processar comandos do BOT "+ comandLinksfera +": " + error.stack
        await sendCallBackMessage(errorMessage, chatId, env);
        console.error(errorMessage);
        return new Response(errorMessage, {status: 200});
    }
}

export{ linksfera }
import { commands_manifest, normalize } from "../../engine/engine.index.js";

async function linksfera(userState, messageText, userId, chatId, userName, update, env){

const comandLinksfera = normalize(commands_manifest[0].name);

        // 1. Lógica de Proteção contra Loop e Contagem de Processos
    if (userState.procesCont > 3) {
        await sendMessage('falha na requisição (loop detectado)', chatId, env);
        await saveUserState(env, userId, null);
        return new Response('Falha na requisição');
    } else {
        userState.procesCont++;
    }

    // 2. Lógica de Atualização de Estado Composto (Ex: waiting_section -> waiting_section_configuracao)
    if (userState.state == "waiting_section" || userState.state.includes("waiting_comand")) {
        if (messageText == '/ver_dataSave_da_pagina') {
            //return await handleVerdataSaveFlow(userState, messageText, userId, chatId, userName, update, env);
        } else {
            userState.state += '_' + await normalize(messageText);
            await saveUserState(env, userId, userState);
        }
    }

    // 3. Verifica estado de recebimento de mídia (Inicializa o fluxo se a mensagem for um arquivo)
    // Se não há um processo ativo e a mensagem NÃO é apenas texto, inicializa o fluxo de mídia.
    if (userState.proces === '' && (update.message?.photo || update.message?.document || update.message?.video) && !userState.state) {
        userState.state = 'received_midia';
    }

    // Determina a seção ativa para roteamento
    let sectionName = (((userState.state).toLowerCase()).split('_'))[0];

    // Roteamento para a função de fluxo correspondente
    switch (normalize(sectionName)) {

        case comandLinksfera:
            userState.procesCont = 0;
                userState.proces = messageText.toLowerCase();
                userState.state = 'waiting_comand_portal';
                await saveUserState(env, userId, userState);
                await sendMessage(`Olá ${userName}! Como posso ajudar?\n /Adicionar_link - /Editar_link\n /Deletar_link - /configuracao_link\n\n /ver_links --- /encerrar`, chatId, env);
                return new Response('Aguardando comando', { status: 200 });
                break;

        case normalize('Adicionar'):
            return await handleVerdataSaveFlow(userState, messageText, userId, chatId, userName, update, env);
            break;

        case normalize('Editar'):
            return await handleItensMenuFlow(userState, messageText, userId, chatId, userName, update, env);
            break;

        case normalize('Deletar'):
            return await handleItensMenuFlow(userState, messageText, userId, chatId, userName, update, env);
            break;

        case normalize('configuracao'):
            return await handleConfiguracaoFlow(userState, messageText, userId, chatId, userName, update, env);
            break;

        case normalize('ver'):
            return await handleItensMenuFlow(userState, messageText, userId, chatId, userName, update, env);
            break;

        default:
            userState = null;
            await saveUserState(env, userId, userState);
            const mensagem = 'Comando ou estado de usuário desconhecido.';
            await sendMessage(mensagem, chatId, env);
            await sendMessage(" /"+ comandLinksfera +"\n /comandos - /encerrar", chatId, env);
            return new Response(mensagem, { status: 200 });
    }
}

export{ linksfera }
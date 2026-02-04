import { commands_manifest, normalize, saveSession, loadSession, sendCallBackMessage, sendMessage, escapeHTML, yesOrNo, dataRead, dataUpdate, dataDelete, dataExist, dataSave, downloadGdrive, sendMidia, image } from "../../engine/engine.index.js";
import { handleConfiguracaoLink } from "./configuracao.js";
import { handleDeleteLink } from "./delete.js";
import { handleEditLink } from "./edit.js";
import { handleAddedLink } from "./added.js";
import { handleListView } from "./ver.js";

async function linksfera(SESSION, messageText, userId, chatId, userName, update, env){

const comandLinksfera = normalize(commands_manifest[0].name);
try {
        // 1. Lógica de Proteção contra Loop e Contagem de Processos
    if (SESSION.procesCont > 3) {
        await sendMessage('falha na requisição (loop detectado)', chatId, env);
        SESSION = await loadSession(env, userId, true);
        await saveSession(env, userId, SESSION);
        return new Response('Falha na requisição');
    } else {
        SESSION.procesCont++;
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
    if (SESSION.proces === '' && (update.message?.photo || update.message?.document || update.message?.video) && !SESSION.state) {
        SESSION.state = 'received_midia';
    }

    // Determina a seção ativa para roteamento
  // Primeiro, normalizamos o texto para verificar se é comando
const cleanText = normalize(messageText);
const isCommand = messageText.startsWith("/") && commands_manifest.some(cmd => normalize(cmd.name) === cleanText);

// A lógica principal
const sectionName = isCommand 
    ? cleanText // 1. Prioridade: Se é comando válido, retorna o nome do comando
    : (!SESSION?.state // 2. Fallback: Lógica antiga
        ? messageText
        : (
            SESSION.state
                .toLowerCase()
                .split("_")
                .find(part => [ comandLinksfera, "Adicionar", "editar", "Deletar", "configuracao", "ver", "section" ]
                    .map(v => v.toLowerCase()).includes(part)
                ) || normalize(messageText)
        )
    );

    // Roteamento para a função de fluxo correspondente
    switch (normalize(sectionName)) {

        case normalize(comandLinksfera):
                await loadSession(env, userId, true);
                SESSION.proces = normalize(messageText);
                SESSION.state = 'waiting_section';
                await saveSession(env, userId, SESSION);
                await sendMessage(`Olá ${userName}! Como posso ajudar?\n /Adicionar_Link - /editar_Link\n\n /Deletar_Link - /configuracao_Link\n\n /ver_Links --- /encerrar`, chatId, env);
                    return new Response('Aguardando comando', { status: 200 });
                        break;

        case normalize('Adicionar'):
            return await handleAddedLink(SESSION, messageText, userId, chatId, userName, update, env);
                  break;

        case normalize('editar'):
            return await handleEditLink(SESSION, messageText, userId, chatId, userName, update, env);
                break;

        case normalize('Deletar'):
            return await handleDeleteLink(SESSION, messageText, userId, chatId, userName, update, env);
                break;

        case normalize('configuracao'):
            if(normalize(messageText) == normalize("configuracao_link")){
                const result = await dataExist("config", {type:"linksfera"}, env);
                messageText = result ? "configuracao_link" : "start_configuracao";
                    }
            return await handleConfiguracaoLink(SESSION, messageText, userId, chatId, userName, update, env);
            break;

        case normalize('ver'):
            return await handleListView(SESSION, messageText, userId, chatId, userName, update, env);
            break;

        case normalize("section"):
            SESSION.state =  normalize(messageText.split('_')[0]);
            await saveSession(env, userId, SESSION);
            await linksfera(SESSION, messageText, userId, chatId, userName, update, env);
                return new Response("Inicializando seção !", {status:200});

        default:
            //SESSION = null;
            await saveSession(env, userId, SESSION);
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
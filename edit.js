import { commands_manifest, normalize, saveSession, loadSession, sendCallBackMessage, sendMessage, escapeHTML, yesOrNo, dataRead, dataUpdate, dataDelete, dataExist, dataSave, downloadGdrive, sendMidia, image } from "../../engine/engine.index.js";
import { handleCRUDLink } from "./crud.js";

export async function handleEditLink(SESSION, messageText, userId, chatId, userName, update, env) {

    const comandLinksfera = normalize(commands_manifest[0].name);

    switch (normalize(messageText)) {

        case normalize('editar_link'):
            SESSION.state = "waiting_list_crud";
            await handleCRUDLink(SESSION, messageText, userId, chatId, userName, update, env);
            return new Response("Listando Items", { status: 200 });
            break;

        default:
            break;
    }

    switch (normalize(SESSION.state)) {

        case normalize("waiting_start_editar"):
            SESSION.procesCont = 0;
            SESSION.state = "waiting_start_crud";
            await handleCRUDLink(SESSION, messageText, userId, chatId, userName, update, env);
            return new Response("Iniciando confirmação", { status: 200 });
            break;

        case normalize('waiting_confirm_editar'):
            SESSION.procesCont = 0;
            switch (normalize(messageText)) {
                case normalize('SIM'):

                    // Atualiza o banco de dados
                    await dataUpdate([[JSON.stringify(SESSION.data)], SESSION.titulo], ['assets', 'data'], chatId, env);
                    
                    // Reinicia a sessão para limpar dados temporários
                    SESSION = await loadSession(env, userId, true);
                    await saveSession(env, userId, SESSION);
                    
                    await sendMessage("Link atualizado com sucesso!\n/encerrar   |   /" + comandLinksfera, chatId, env);
                    break;

                case normalize('NAO'):
                    SESSION.state = "waiting_list_editar";
                    await sendMessage("Edição cancelada.\nDeseja /encerrar ou /" + comandLinksfera, chatId, env);
                    return new Response('Atualização de link encerrada !', { status: 200 });
                    break;

                default:
                    await sendMessage("Responda apenas.:\n/SIM   ou   /NAO", chatId, env);
                    break;
            }
            await saveSession(env, userId, SESSION);
            return new Response('Link atualizado!', { status: 200 });
            break;

        default:
            break;
    }
}
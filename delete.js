import { commands_manifest, normalize, saveSession, loadSession, sendCallBackMessage, sendMessage, escapeHTML, yesOrNo, dataRead, dataUpdate, dataDelete, dataExist, dataSave, downloadGdrive, sendMidia, image } from "../../engine/engine.index.js";
import { handleCRUDLink } from "./crud.js";

export async function handleDeleteLink(SESSION, messageText, userId, chatId, userName, update, env) {
    const comandLinksfera = normalize(commands_manifest[0].name);
    switch (normalize(messageText)) {

        case normalize('Deletar_link'):
            SESSION.procesCont = 0;
            SESSION.state = "waiting_list_crud";
            await handleCRUDLink(SESSION, messageText, userId, chatId, userName, update, env);
                return new Response("Listando Items", {status: 200});
                break;
    
        default:
            break;
    }

    switch (normalize(SESSION.state)) {
        case normalize("waiting_start_deletar"):
            SESSION.procesCont = 0;
            SESSION.state = "waiting_start_crud";
            await handleCRUDLink(SESSION, messageText, userId, chatId, userName, update, env);
                return new Response("Iniciando confirmação", {status: 200});
                    break;
                    
        case normalize("waiting_confirm_deletar"):
            SESSION.procesCont = 0;
            switch (normalize(messageText)) {
                case normalize("SIM"):
                    await dataDelete("assets", {id: SESSION.titulo}, env);
                    SESSION = await loadSession(env, userId, true);
                    await saveSession(env, userId, SESSION);
                    await sendMessage(`Link ${SESSION.texto} deletado com sucesso !`, chatId, env);
                    await sendMessage("/" + comandLinksfera + "   |   /encerrar", chatId, env);
                        return new Response("Deletado com sucesso !", {status: 200})
                            break;

                case normalize('NAO'):
                    SESSION = await loadSession(env, userId, true);
                    await saveSession(env, userId, SESSION);
                    await sendMessage(`Certo Sr. ${userName},\nDeseja /encerrar ou /${comandLinksfera} ?`, chatId, env);
                        return new Response("Deletar foi cancelado !", {status: 200});
                            break;
            
            default:
                await sendMessage("Responda apenas.:\n/SIM   ou   /NAO", chatId, env);
                    break;
            }
                break;
    
        default:
            break;
    }
}
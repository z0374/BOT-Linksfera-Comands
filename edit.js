import { commands_manifest, normalize, saveSession, sendCallBackMessage, sendMessage, escapeHTML, yesOrNo, dataRead, dataUpdate, dataDelete, dataExist, dataSave, downloadGdrive, sendMidia, image } from "../../engine/engine.index.js";
import { handleCRUDLink } from "./crud.js";

export async function handleEditLink(SESSION, messageText, userId, chatId, userName, update, env) {


    const comandLinksfera = normalize(commands_manifest[0].name);
    const dataIds = ["imagem", "textorodape", "corprimaria", "corsecundaria", "cordestaque", "link1", "link2", "link3",];
        

    switch (normalize(messageText)) {

        case normalize('editar_link'):
            SESSION.state = "waiting_list_crud";
            await handleCRUDLink(SESSION, messageText, userId, chatId, userName, update, env);
                return new Response("Listando Items", {status: 200});
                break;
    
        default:
            break;
    }

    switch (normalize(SESSION.state)) {
        
        case normalize("waiting_start_editar"):
            SESSION.procesCont = 0;
            SESSION.state = "waiting_start_crud";
            await handleCRUDLink(SESSION, messageText, userId, chatId, userName, update, env);
                return new Response("Iniciando confirmação", {status: 200});
                    break;

        case normalize('waiting_confirm_editar'):
            SESSION.procesCont = 0;
            switch (normalize(messageText)) {
                case normalize('SIM'):
                    const adding = {
                        titulo: SESSION.select[0],
                        legenda: SESSION.select[1],
                        texto: SESSION.select[2],
                        url: SESSION.select[3],
                        tags: SESSION.select[4],
                        visible: SESSION.select[5]
                    };
                    await dataUpdate([[JSON.stringify(adding)], SESSION.titulo], ['assets', 'data'], chatId, env);
                    SESSION = await loadSession(env, userId, true);
                    await saveSession(env, userId, SESSION);
                    await sendMessage("/encerrar   |   /" + comandLinksfera, chatId, env);
                    break;

                case normalize('NAO'):
                    SESSION.state = "waiting_list_editar";
                    await sendMessage("Deseja /encerrar ou /reiniciar !", chatId, env);
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
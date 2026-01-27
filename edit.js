import { handleCRUDLink } from "./crud.js";

export async function handleEditLink(userState, messageText, userId, chatId, userName, update, env) {


    const comandLinksfera = normalize(commands_manifest[0].name);
    const dataIds = ["imagem", "textorodape", "corprimaria", "corsecundaria", "cordestaque", "link1", "link2", "link3",];
        

    switch (normalize(messageText)) {

        case normalize('editar_link'):
            userState.state = "waiting_list_crud";
            await handleCRUDLink(userState, messageText, userId, chatId, userName, update, env);
                return new Response("Listando Items", {status: 200});
                break;
    
        default:
            break;
    }

    switch (normalize(userState.state)) {

        case normalize("waiting_data_edit"):
            const commandEdit = messageText.split("_");
            const indexData = dataIds.indexOf(normalize(commandEdit[3]));
                return new Response("Iniciando confirmação", {status: 200});
                    break;
        
        case normalize("waiting_start_editar"):
            userState.procesCont = 0;
            userState.state = "waiting_start_crud";
            await handleCRUDLink(userState, messageText, userId, chatId, userName, update, env);
                return new Response("Iniciando confirmação", {status: 200});
                    break;

        case normalize('waiting_confirm_editar'):
            userState.procesCont = 0;
            switch (normalize(messageText)) {
                case normalize('SIM'):
                    const adding = {
                        titulo: userState.select[0],
                        legenda: userState.select[1],
                        texto: userState.select[2],
                        url: userState.select[3],
                        tags: userState.select[4],
                        visible: userState.select[5]
                    };
                    await dataUpdate([[JSON.stringify(adding)], userState.titulo], ['assets', 'data'], chatId, env);
                    userState = null;
                    await sendMessage("/encerrar   |   /" + comandLinksfera, chatId, env);
                    break;

                case normalize('NAO'):
                    userState.state = "waiting_list_editar";
                    await sendMessage("Deseja /encerrar ou /reiniciar !", chatId, env);
                        return new Response('Atualização de link encerrada !', { status: 200 }); 
                            break;
            
                default:
                    await sendMessage("Responda apenas.:\n/SIM   ou   /NAO", chatId, env);
                    break;
            }
            await saveUserState(env, userId, userState);
            return new Response('Link atualizado!', { status: 200 }); 
                break;
    
        default:
            break;
    }
}
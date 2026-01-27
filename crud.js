import { handleAddedLink } from "./added.js";

export async function handleCRUDLink(userState, messageText, userId, chatId, userName, update, env) {

    const comandLinksfera = normalize(commands_manifest[0].name);
    switch (normalize(userState.state)) {
        case normalize("waiting_list_crud"):
            userState.procesCont = 0;
            const result = await dataRead("assets", {type:'link'}, env); const taskLink = (messageText.split('_'))[0] == '/editar' ? 'EDITAR' : 'DELETAR';
            if(result.length == 0){
                await saveUserState(env, userId, null);
                const messageVoid = `Sem links para ${taskLink}`;
                await sendMessage(messageVoid, chatId, env); await sendMessage("/encerrar   |   /"+comandLinksfera, chatId, env);
                return new Response(messageVoid, { status:200 });
                    }

                const links = Array.isArray(result) ? result : [result];
            userState.state = 'waiting_start_' + taskLink.toLowerCase();
            await saveUserState(env, userId, userState);
            const message = [];
                for(const link of links){
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
            userState.procesCont = 0;
            userState.titulo = parseInt(messageText.replace(/\D+/g, ""));
            const dataLink = await dataRead("assets",{id: parseInt(userState.titulo)}, env);
            if((!isNaN(userState.titulo)) && dataLink.type == 'link'){
                if((messageText.split("_"))[2] == "editar"){
                    userState.text = JSON.parse(dataLink.data);
                    await saveUserState(env, userId, userState);
                    messageText = "Adicionar_Link";
                    await handleAddedLink(userState, messageText, userId, chatId, userName, update, env);
                        return new Response("Iniciando Edição !", {status: 200});
                }else if((messageText.split("_"))[2] == "deletar"){
                    userState.state = 'waiting_confirm_deletar';
                    const deleted = JSON.parse(dataLink.data);
                    userState.texto = deleted.titulo;
                    await saveUserState(env, userId, userState);
                    await sendMessage(`Titulo: ${deleted.titulo}\nLegenda: ${deleted.legenda}\nTexto do Link: ${deleted.texto}\nURL: ${deleted.url}\n   Visibilidade: ${deleted.visible}\n\nTags:\n   ${deleted.tags}`, chatId, env);
                    await sendMessage("Deseja excluir este link?\n   /SIM   |   /NAO", chatId, env);
                        return new Response("Confirmando deleção !", {status: 200});
                            break;
                }
            }
                userState.state = "waiting_list_crud";
                await sendMessage("Registro selecionado inválido.", chatId, env);
                await handleCRUDLink(userState, messageText, userId, chatId, userName, update, env);
                    return new Response("Listando novamente !", {status: 200});
                        break;
            
            break;
    
        default:
            break;
    }
}
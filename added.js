import { commands_manifest, normalize, disableHyperlinks, saveSession, sendCallBackMessage, sendMessage, escapeHTML, yesOrNo, dataRead, dataUpdate, dataDelete, dataExist, dataSave, downloadGdrive, sendMidia, image } from "../../engine/engine.index.js";

export async function handleAddedLink(SESSION, messageText, userId, chatId, userName, update, env){
    const visibility = {"ocultar":"hidden", "mostrar":"show", "fixar":"pin"}

    const comandLinksfera = normalize(commands_manifest[0].name);
    switch (normalize(messageText)) {
        case normalize("Adicionar_Link"):
            SESSION.procesCont = 0;
            SESSION.state = 'waiting_titulo_Adicionar';   
            await saveSession(env, userId, SESSION);
            await sendMessage(`Sr. ${userName},\nInforme o título do link.:`, chatId, env);
            return new Response('Aguardando título', { status: 200 });     
                break;
    
        default:
            break;

    }

    switch (normalize(SESSION.state)) {
        case normalize('waiting_titulo_Adicionar'):
            SESSION.procesCont = 0;
            SESSION.data.titulo = messageText;
            SESSION.state = 'waiting_legenda_Adicionar';   
            await saveSession(env, userId, SESSION);
            await sendMessage(`Agora Sr. ${userName},\nInforme a legenda do link.:`, chatId, env);
            return new Response('Aguardando legenda', { status: 200 });     
                break;

        case normalize('waiting_legenda_Adicionar'):
            SESSION.procesCont = 0;
            SESSION.data.legenda = messageText;
            SESSION.state = 'waiting_texto_Adicionar';   
            await saveSession(env, userId, SESSION);
            await sendMessage(`Sr. ${userName},\nInforme o texto do link.:`, chatId, env);
            return new Response('Aguardando texto', { status: 200 });     
                break;

        case normalize('waiting_texto_Adicionar'):
            SESSION.procesCont = 0;
            SESSION.data.texto = messageText;
            SESSION.state = 'waiting_url_Adicionar';   
            await saveSession(env, userId, SESSION);
            await sendMessage(`Por fim Sr. ${userName},\nInforme a url do link.:`, chatId, env);
            return new Response('Aguardando url', { status: 200 });     
                break;

        case normalize('waiting_url_Adicionar'):
            SESSION.procesCont = 0;
            SESSION.data.url = messageText;
            SESSION.state = 'waiting_tags_Adicionar';   
            await saveSession(env, userId, SESSION);
            await sendMessage(`Sr. ${userName},\nPara otimizar a pesquisa, digite tags que descrevam o link, separadas por vírgulas (,).:`, chatId, env);
            return new Response('Aguardando tags', { status: 200 });     
                break;

        case normalize('waiting_tags_Adicionar'):
            SESSION.procesCont = 0;
            SESSION.data.tags = messageText;
            SESSION.state = 'waiting_visibility_Adicionar';   
            await saveSession(env, userId, SESSION);
            await sendMessage(`Por fim Sr. ${userName},\nSelecione a visibilidade do link.:`, chatId, env);
            await sendMessage("/OCULTAR   |   /MOSTRAR   |   /FIXAR", chatId, env);
                return new Response('Aguardando visibilidade', { status: 200 });     
                    break;

        case normalize('waiting_visibility_Adicionar'):
            SESSION.procesCont = 0;
            const visibilitySafe = visibility[normalize(messageText)];
            if(!visibilitySafe){
                await sendMessage(`Porfavor Sr. ${userName},\nInforme uma das opções válidas abaixo.`, chatId, env);
                await sendMessage("/ocultar   |   /mostrar   |   /fixar", chatId, env);
                    return new Response('Aguardando visibilidade', { status: 200 });
                        break;
            }
            SESSION.data.visible = visibilitySafe;
            const adding = SESSION.data;
            const messagelink = `Titulo: ${adding.titulo}\nLegenda: ${adding.legenda}\nTexto do Link: ${adding.texto}\nURL: ${disableHyperlinks(adding.url)}\n   Visibilidade: ${(normalize(messageText)).toUpperCase()}\n\nTags:\n   ${adding.tags}`;
            if(Number.isInteger(SESSION.titulo) && SESSION.titulo > 0) {
                const oldLink = JSON.parse(SESSION.texto);
                SESSION.state = 'waiting_confirm_editar';
                const message = `Deseja substituir\n\nTitulo: ${oldLink.titulo}\nLegenda: ${oldLink.legenda}\nTexto do Link: ${oldLink.texto}\nURL: ${disableHyperlinks(oldLink.url)}\n   Visibilidade: ${oldLink.visible}\n\nTags:\n   ${oldLink.tags}\n\npor\n\n${messagelink}\n\n`;
                await sendMessage(message, chatId, env);
            }else{
                await sendMessage(`Deseja adicionar este link?\n\n${messagelink}`, chatId, env);
                SESSION.state = 'waiting_confirm_Adicionar';
            }
            await saveSession(env, userId, SESSION);
                await sendMessage("\n/SIM   |   /NAO", chatId, env);
                return new Response('Aguardando confirmação', { status: 200 });     
                    break;

        case normalize('waiting_confirm_Adicionar'):
            let finalTask;
            try {
                if(normalize(messageText) != normalize("NAO") && normalize(messageText) != normalize("SIM")){
                    await sendMessage("Escolha apenas:\n/SIM   ou   /NAO", chatId, env);
                        return new Response('Aguardando confirmação', { status: 200 });  
                }
                await yesOrNo([JSON.stringify(SESSION.data), 'link'], ['assets', 'data,type'], userId, chatId, SESSION, messageText, env);
                    return new Response('Adicionando', { status: 200 }); 
            } catch (error) {
                await sendCallBackMessage("Erro ao adicionar link: " + error.stack, chatId, env);
                    return new Response("Erro ao adicionar link: " + error.stack, { status: 200 }); 
            }
                    break;

        default:
            await sendMessage("Estado de usuário não identificado !", chatId, env);
            return new Response("Estado de usuário indisponível !", {status:200});
                break;
    }
}
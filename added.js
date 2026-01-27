export async function handleAddedLink(userState, messageText, userId, chatId, userName, update, env){
    const visibility = {"ocultar":"hidden", "mostrar":"show", "fixar":"pin"}
    const comandLinksfera = normalize(commands_manifest[0].name);
    switch (normalize(messageText)) {
        case normalize("Adicionar_Link"):
            userState.procesCont = 0;
            userState.state = 'waiting_titulo_Adicionar';   
            await saveUserState(env, userId, userState);
            await sendMessage(`Sr. ${userName},\nInforme o título do link.:`, chatId, env);
            return new Response('Aguardando título', { status: 200 });     
                break;
    
        default:
            break;

    }

    switch (normalize(userState.state)) {
        case normalize('waiting_titulo_Adicionar'):
            userState.procesCont = 0;
            userState.select.push(messageText);
            userState.state = 'waiting_legenda_Adicionar';   
            await saveUserState(env, userId, userState);
            await sendMessage(`Agora Sr. ${userName},\nInforme a legenda do link.:`, chatId, env);
            return new Response('Aguardando legenda', { status: 200 });     
                break;

        case normalize('waiting_legenda_Adicionar'):
            userState.procesCont = 0;
            userState.select.push(messageText);
            userState.state = 'waiting_texto_Adicionar';   
            await saveUserState(env, userId, userState);
            await sendMessage(`Sr. ${userName},\nInforme o texto do link.:`, chatId, env);
            return new Response('Aguardando texto', { status: 200 });     
                break;

        case normalize('waiting_texto_Adicionar'):
            userState.procesCont = 0;
            userState.select.push(messageText);
            userState.state = 'waiting_url_Adicionar';   
            await saveUserState(env, userId, userState);
            await sendMessage(`Por fim Sr. ${userName},\nInforme a url do link.:`, chatId, env);
            return new Response('Aguardando url', { status: 200 });     
                break;

        case normalize('waiting_url_Adicionar'):
            userState.procesCont = 0;
            userState.select.push(messageText);
            userState.state = 'waiting_tags_Adicionar';   
            await saveUserState(env, userId, userState);
            await sendMessage(`Sr. ${userName},\nPara otimizar a pesquisa, digite tags que descrevam o link, separadas por vírgulas (,).:`, chatId, env);
            return new Response('Aguardando tags', { status: 200 });     
                break;

        case normalize('waiting_tags_Adicionar'):
            userState.procesCont = 0;
            userState.select.push(messageText);
            userState.state = 'waiting_visibility_Adicionar';   
            await saveUserState(env, userId, userState);
            await sendMessage(`Por fim Sr. ${userName},\nSelecione a visibilidade do link.:`, chatId, env);
            await sendMessage("/OCULTAR   |   /MOSTRAR   |   /FIXAR", chatId, env);
                return new Response('Aguardando visibilidade', { status: 200 });     
                    break;

        case normalize('waiting_visibility_Adicionar'):
            userState.procesCont = 0;
            const visibilitySafe = visibility[normalize(messageText)];
            if(!visibilitySafe){
                await sendMessage(`Porfavor Sr. ${userName},\nInforme uma das opções válidas abaixo.`, chatId, env);
                await sendMessage("/ocultar   |   /mostrar   |   /fixar", chatId, env);
                    return new Response('Aguardando visibilidade', { status: 200 });
                        break;
            }
            userState.select.push(visibilitySafe);
            const adding = userState.select;
            const messagelink = `Titulo: ${adding[0]}\nLegenda: ${adding[1]}\nTexto do Link: ${adding[2]}\nURL: ${adding[3]}\n   Visibilidade: ${(await normalize(messageText)).toUpperCase()}\n\nTags:\n   ${adding[4]}`;
            if(Number.isInteger(userState.titulo) && userState.titulo > 0) {
                const oldLink = userState.text;
                userState.state = 'waiting_confirm_editar';
                const message = `Deseja substituir\n\nTitulo: ${oldLink.titulo}\nLegenda: ${oldLink.legenda}\nTexto do Link: ${oldLink.texto}\nURL: ${oldLink.url}\n   Visibilidade: ${oldLink.visible}\n\nTags:\n   ${oldLink.tags}\n\npor\n\n${messagelink}\n\n`;
                await sendMessage(message, chatId, env);
            }else{
                await sendMessage(`Deseja adicionar este link?\n\n${messagelink}`, chatId, env);
                userState.state = 'waiting_confirm_Adicionar';
            }
            await saveUserState(env, userId, userState);
                await sendMessage("\n/SIM   |   /NAO", chatId, env);
                return new Response('Aguardando confirmação', { status: 200 });     
                    break;

        case normalize('waiting_confirm_Adicionar'):
            try {
                const adding = {
                    titulo: userState.select[0],
                    legenda: userState.select[1],
                    texto: userState.select[2],
                    url: userState.select[3],
                    tags: userState.select[4],
                    visible: userState.select[5]
                }
                if(normalize(messageText) != normalize("NAO") || normalize(messageText) != normalize("SIM")){
                    await sendMessage("Escolha apenas:\n/SIM   ou   /NAO", chatId, env);
                        return new Response('Aguardando confirmação', { status: 200 });  
                }
                await yesOrNo([JSON.stringify(adding), 'link'], ['assets', 'data,type'], userId, chatId, userState, messageText, env);
            } catch (error) {
                await sendCallBackMessage("Erro ao adicionar link: " + error.stack, chatId, env);
            }
                return new Response('Link Adicionado', { status: 200 }); 
                    break;

        default:
            await sendMessage("Estado de usuário não identificado !", chatId, env);
            return new Response("Estado de usuário indisponível !", {status:200});
                break;
    }
}
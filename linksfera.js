import { commands_manifest, normalize, saveUserState, sendCallBackMessage, sendMessage, escapeHTML, yesOrNo, dataRead, dataUpdate, dataDelete } from "../../engine/engine.index.js";

async function handleCRUDLink(userState, messageText, userId, chatId, userName, update, env) {
    
    switch (normalize(userState.state)) {
        case normalize("waiting_list_crud"):
            userState.procesCont = 0;
            userState.state = 'waiting_start_crud';
            await saveUserState(env, userId, userState);
            const links = await dataRead("assets", {type:'link'}, env);
            const taskLink = (messageText.split('_'))[0] == 'editar' ? 'EDITAR' : 'DELETAR';
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
            await sendMessage(message.join("\n\n\n"), chatId, env);
            return new Response('Aguardando selecionar!', { status: 200 });
                break;

        case normalize('waiting_start_crud'):
            userState.procesCont = 0;
            userState.titulo = parseInt(messageText.replace(/\D+/g, ""));
            const oldLink = await dataRead("assets",{id: parseInt(userState.titulo)}, env);
            if((!isNaN(userState.titulo)) && oldLink.type == 'link'){
                if((messageText.split("_"))[2] == "editar"){
                    userState.text = JSON.parse(oldLink.data);
                    await saveUserState(env, userId, userState);
                    messageText = "Adicionar_Link";
                    await handleAddedLink(userState, messageText, userId, chatId, userName, update, env);
                        return new Response("Iniciando Edição !", {status: 200});
                }else if((messageText.split("_"))[2] == "deletar"){
                    userState.state = 'waiting_confirm_delete';
                    await sendMessage(`Titulo: ${oldLink.titulo}\nLegenda: ${oldLink.legenda}\nTexto do Link: ${oldLink.texto}\nURL: ${oldLink.url}\n   Visibilidade: ${oldLink.visible}\n\nTags:\n   ${oldLink.tags}`, chatId, env);
                    await sendMessage("Deseja excluir este link?\n   /SIM   |   /NAO", chatId, env);
                    await saveUserState(env, userId, userState);
                        return new Response("Confirmando deleção !", {status: 200});
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
async function handleDeleteLink(userState, messageText, userId, chatId, userName, update, env) {
    switch (normalize(messageText)) {

        case normalize('Deletar_link'):
            userState.procesCont = 0;
            userState.state = "waiting_list_crud";
            await handleCRUDLink(userState, messageText, userId, chatId, userName, update, env);
                return new Response("Listando Items", {status: 200});
                break;
    
        default:
            break;
    }

    switch (normalize(userState.state)) {

        case normalize("waiting_confirm_delete"):
            userState.procesCont = 0;
            switch (normalize(messageText)) {
                case normalize("SIM"):
                    userState.state = null;
                    await saveUserState(env, userId, userState);
                    await dataDelete("assets", {id:userState.titulo}, env);
                    await sendMessage(`Link ${userState.titulo} deletado com sucesso !`, chatId, env);
                    await sendMessage("/linksfera   |   /encerrar", chatId, env);
                        return new Response("Deletado com sucesso !", {status: 200})
                            break;

                case normalize('NAO'):
                    userState.state = null;
                    await saveUserState(env, userId, userState);
                    await sendMessage(`Certo Sr. ${userName},\nDeseja /encerrar ou /linksfera ?`, chatId, env);
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

async function handleEditLink(userState, messageText, userId, chatId, userName, update, env) {

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

        case normalize('waiting_confirm_editar'):
            userState.procesCont = 0;
            switch (normalize(messageText)) {
                case normalize('SIM'):
                    const adding = {
                        titulo: userState.select[0],
                        legenda: userState.select[1],
                        text: userState.select[2],
                        url: userState.select[3],
                        tags: userState.select[4],
                        visible: userState.select[5]
                    };
                    await dataUpdate([[JSON.stringify(adding)], userState.titulo], ['assets', 'data'], chatId, env);
                    userState = null;
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
async function handleAddedLink(userState, messageText, userId, chatId, userName, update, env){
    const visibility = {"ocultar":"hidden", "mostrar":"show", "fixar":"pin"}

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
                    text: userState.select[2],
                    url: userState.select[3],
                    tags: userState.select[4],
                    visible: userState.select[5]
                }
                await yesOrNo([JSON.stringify(adding), 'link'], ['assets', 'data,type'], userId, chatId, userState, messageText, env);
            } catch (error) {
                await sendCallBackMessage("Erro ao adicionar link: " + error.stack, chatId, env);
            }
                return new Response('Link Adicionado', { status: 200 }); 
                    break;

        default:
            break;
    }
}

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
    // 2. Lógica de Atualização de Estado Composto (Ex: waiting_section -> waiting_section_configuracao)
    if (userState.state == "waiting_section" || userState.state.includes("waiting_comand")) {
        if (messageText == '/ver_dataSave_da_pagina') {
            //return await handleVerdataSaveFlow(userState, messageText, userId, chatId, userName, update, env);
        } else {
            userState.state += '_' + await normalize(messageText);
            await saveUserState(env, userId, userState);
        }
    }
    
} catch (error) {
    const errorMessage = "Erro ao atualizar estados compostos: " + error.stack
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
    let sectionActive = userState.state.toLowerCase().split('_');

    const validSections = [comandLinksfera, 'Adicionar', 'editar', 'Deletar', 'configuracao', 'ver']
    .map(v => v.toLowerCase());

    let sectionName =
    sectionActive.find(part => validSections.includes(part)) 
    || normalize(messageText);


    // Roteamento para a função de fluxo correspondente
    switch (normalize(sectionName)) {

        case comandLinksfera:
                userState.procesCont = 0;
                userState.proces = normalize(messageText);
                userState.state = 'waiting_comand_portal';
                await saveUserState(env, userId, userState);
                await sendMessage(`Olá ${userName}! Como posso ajudar?\n /Adicionar_Link - /editar_link\n /Deletar_link - /configuracao_link\n\n /ver_links --- /encerrar`, chatId, env);
                    return new Response('Aguardando comando', { status: 200 });
                        break;

        case normalize('Adicionar'):
            return await handleAddedLink(userState, messageText, userId, chatId, userName, update, env);
            break;

        case normalize('editar'):
            return await handleEditLink(userState, messageText, userId, chatId, userName, update, env);
            break;

        case normalize('Deletar'):
            return await handleDeleteLink(userState, messageText, userId, chatId, userName, update, env);
            break;

        /*case normalize('configuracao'):
            return await handleConfiguracaoLink(userState, messageText, userId, chatId, userName, update, env);
            break;

        case normalize('ver'):
            return await handleListView(userState, messageText, userId, chatId, userName, update, env);
            break;*/

        default:
            userState = null;
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
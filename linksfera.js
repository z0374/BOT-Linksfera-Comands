import { commands_manifest, normalize, saveUserState, sendCallBackMessage, sendMessage, escapeHTML, yesOrNo, dataRead, dataUpdate, dataDelete, dataExist, dataSave, downloadGdrive, sendMidia, image } from "../../engine/engine.index.js";

async function handleCRUDLink(userState, messageText, userId, chatId, userName, update, env) {
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

async function handleConfiguracaoLink(userState, messageText, userId, chatId, userName, update, env) {
const comandLinksfera = normalize(commands_manifest[0].name);

    switch (normalize(messageText)) {
        case normalize("start_configuracao"):
            userState.procesCont = 0;
            userState.state = "waiting_logo_configuracao";
            await saveUserState(env, userId, userState);
            await sendMessage(`Certo Sr. ${userName}\nComece me enviando a logo do Portal de links ?`, chatId, env);
                return new Response("Aguardando logo.", {status: 200});
                    break;

        case normalize("configuracao_link"):
            try {
                userState.procesCont = 0;
                userState.state = "waiting_logo_configuracao";
                await saveUserState(env, userId, userState);
                userState.titulo = (await dataRead("config", {type: "linksfera"}, env)).data;
                const dataConfig = (userState.titulo).split("[_C_]");
                const selectConf = [...dataConfig.slice(5, 8)];
                const idDrive = (await dataRead("assets", {id: dataConfig[0]}, env)).data      
                    let logoLinks = await downloadGdrive(idDrive, env, chatId);

                const linksFooter = []; const linksCommand = [];let i = 1;
                for(const v of selectConf){
                        const linkText = JSON.parse((await dataRead("assets", {id: v}, env)).data).texto
                        linksFooter.push(linkText);
                        linksCommand.push("/Editar_link" + (i++));
                }
                const messageConfig = `
    Cor primária: ${dataConfig[2]}            
    Cor Secundária: ${dataConfig[3]}
    Cor Destaque: ${dataConfig[4]}
    Rodapé:
        <b>${dataConfig[1]}</b>
[ ] ${linksFooter.join("\n[ ] ")}


/Editar_corPrimaria

/Editar_corSecundaria

/Editar_corDestaque

/Editar_textoRodape

${linksCommand[0]}\n
${linksCommand[1]} - - - ${linksCommand[2]}
                `;
                await sendMidia([logoLinks,`Olá Sr. ${userName}\n${messageConfig}`], chatId, env);
                
            } catch (error) {
                await sendCallBackMessage(error.stack, chatId, env);
            }
                return new Response("Aguardando logo.", {status: 200});
                    break;
    
        default:
            break;
    }

    switch (normalize(userState.state)) {

        case normalize("waiting_logo_configuracao"):
            userState.procesCont = 0;
             const agoraItemsMenu = new Date();
            let itemMenuFileId, itemMenuMimeType;

        try {
            // 1. Extração de File ID e MIME Type da mensagem de entrada (Apenas Imagem)
            if (update.message?.document && update.message.document.mime_type.startsWith('image/')) {
                itemMenuFileId = update.message.document.file_id;
                itemMenuMimeType = update.message.document.mime_type;
            } else if (update.message?.photo) {
                itemMenuFileId = update.message.photo.pop().file_id;
                itemMenuMimeType = 'image/jpeg';
            } else {
                await sendMessage('Por favor, envie uma imagem válida para o item do menu.', chatId, env);
                return new Response('OK');
            }
        } catch (error) {
                return new Response('Erro ao extrair imagem da requisição!' + error.stack, {status: 200});
            
        }
            let nameImageItemMenu = "logoLinksfera" + await normalize(agoraItemsMenu.toISOString().split('T')[0].replace(/-/g, '') + agoraItemsMenu.getMinutes().toString().padStart(2, '0'));
            try {
                // 2. Chamada para 'image' com o MIME Type
                const imgId = await image(itemMenuFileId, nameImageItemMenu, itemMenuMimeType, env, chatId);
                const imageItemMenu = [imgId, "img"];
                userState.select.push(imageItemMenu);
            } catch (error) {
                return new Response('OK');
            }
            userState.state = "waiting_Texto_configuracao";
            await saveUserState(env, userId, userState);
            await sendMessage(`Certo Sr. ${userName}\nAgora me envie o texto que irá aparecer no rodapé?`, chatId, env);
                return new Response("Aguardando logo.", {status: 200});
                    break;

        case normalize("waiting_Texto_configuracao"):
            userState.procesCont = 0;
                userState.titulo = messageText;
            userState.state = "waiting_colorP_configuracao";
            await saveUserState(env, userId, userState);
            await sendMessage(`Certo Sr. ${userName}\nAgora me envie a cor primária do Portal?\n`, chatId, env);
                return new Response("Aguardando colorP.", {status: 200});
                    break;

        case normalize("waiting_colorP_configuracao"):
            userState.procesCont = 0;
                userState.titulo += "[_C_]" + messageText;
            userState.state = "waiting_colorS_configuracao";
            await saveUserState(env, userId, userState);
            await sendMessage(`Certo Sr. ${userName}\nAgora me envie a cor secundária do Portal?\n`, chatId, env);
                return new Response("Aguardando colorS.", {status: 200});
                    break;

        case normalize("waiting_colorS_configuracao"):
            userState.procesCont = 0;
                userState.titulo += "[_C_]" + messageText ;
            userState.state = "waiting_colorD_configuracao";
            await saveUserState(env, userId, userState);
            await sendMessage(`Certo Sr. ${userName}\nAgora me envie a cor de destaque do Portal?\n`, chatId, env);
                return new Response("Aguardando colorD.", {status: 200});
                    break;

        case normalize("waiting_colorD_configuracao"):
            userState.procesCont = 0;
            const dataLinks = await dataRead("assets", {type: "link"}, env);
                    userState.state = "waiting_links_configuracao";
                if(normalize(messageText) == normalize("pular") || dataLinks.length == 0){
                    await handleConfiguracaoLink(userState, messageText, userId, chatId, userName, update, env);
                        return new Response("Gerando confirmação !", {status: 200});
                            break;
                }

                if(userState.select.length == 3){
                    userState.select.push(messageText.replace(/\D/g, ""));
                    await handleConfiguracaoLink(userState, messageText, userId, chatId, userName, update, env);
                        return new Response("Gerando confirmação !", {status: 200});
                            break;
                    }
                        else{

            await sendMessage(`Certo Sr. ${userName}\nAgora selecione até 3 links para contato que aparecera no rodapé do Portal?\n(ex.: e-mail, tell, whatsapp, linkedin e etc).`, chatId, env);
                const confirmSelect = normalize((messageText.split("_"))[0]) === "selecionar" ? true : false; 
                
                if(confirmSelect) {
                    userState.select.push(messageText.replace(/\D/g, ""));
                }else{
                    userState.titulo += "[_C_]" + messageText;
                }

                const linksSelect = [];
                for(const link of dataLinks){
                        const dataLink = JSON.parse(link.data);
                    linksSelect.push(`Link: ${dataLink.titulo}   /Selecionar_link${link.id}`);
                }
                userState.state = "waiting_colorD_configuracao";
                await saveUserState(env, userId, userState);
            await sendMessage(linksSelect.join("\n\n") + "\n\n/PULAR", chatId, env);
                return new Response("Aguardando links.", {status: 200});

                }
                    break;
        
        case normalize("waiting_links_configuracao"):
            userState.procesCont = 0;
            userState.state = "waiting_confirm_configuracao";
            await saveUserState(env, userId, userState);
            const dataConf = userState.titulo.split("[_C_]");
            const selectConf = userState.select;
            let logoLinks;
            const linksFooter = [];

            for(const v of selectConf){
                if(Array.isArray(v)) {
                    logoLinks = await downloadGdrive(v[0], env, chatId);
                }else {
                    linksFooter.push(JSON.parse((await dataRead("assets", {id: v}, env)).data).texto);
                 }
            }

            const messageConfirm = `
Cor primária: ${dataConf[1]}            
cor Secundária: ${dataConf[2]}
cor Destaque: ${dataConf[3]}
Rodapé:
    <b>${dataConf[0]}</b>
    ${linksFooter[0]}
${linksFooter[1]}   |   ${linksFooter[2]}
            `;
            await sendMidia([logoLinks, messageConfirm], chatId, env);
            await sendMessage("/SIM   |   /NAO", chatId, env);
                return new Response("Aguardando confirmação", {status: 200});
                    break;

        case normalize("waiting_confirm_configuracao"):
            userState.procesCont = 0;
        try{
            let logoLinks, linksFooter;
            if (normalize(messageText) == normalize("SIM")) {
                logoLinks = await dataSave(userState.select[0], ["assets", "data, type"], env, chatId);
                linksFooter = (userState.select).slice(1);
            }
            
            const saveConfig = logoLinks + "[_C_]" + userState.titulo + "[_C_]" + linksFooter.join('[_C_]');
            await yesOrNo([saveConfig, "linksfera"], ["config", "data, type"], userId, chatId, userState, messageText,env);
    }catch(error){
        const message = "Erro ao salvar a configuração linksfera: " + error.stack;
        await sendCallBackMessage(message,chatId,env);
        return new Response(message, { status: 200 });
    }
        return new Response("Salvo com sucesso!", { status: 200 });
            break;

        default:
            break;
    }
 }

async function handleDeleteLink(userState, messageText, userId, chatId, userName, update, env) {
    const comandLinksfera = normalize(commands_manifest[0].name);
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
        case normalize("waiting_start_deletar"):
            userState.procesCont = 0;
            userState.state = "waiting_start_crud";
            await handleCRUDLink(userState, messageText, userId, chatId, userName, update, env);
                return new Response("Iniciando confirmação", {status: 200});
                    break;
                    
        case normalize("waiting_confirm_deletar"):
            userState.procesCont = 0;
            switch (normalize(messageText)) {
                case normalize("SIM"):
                    userState.state = null;
                    await saveUserState(env, userId, userState);
                    await dataDelete("assets", {id:userState.titulo}, env);
                    await sendMessage(`Link ${userState.texto} deletado com sucesso !`, chatId, env);
                    await sendMessage("/" + comandLinksfera + "   |   /encerrar", chatId, env);
                        return new Response("Deletado com sucesso !", {status: 200})
                            break;

                case normalize('NAO'):
                    userState.state = null;
                    await saveUserState(env, userId, userState);
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

async function handleEditLink(userState, messageText, userId, chatId, userName, update, env) {
const comandLinksfera = normalize(commands_manifest[0].name);
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
async function handleAddedLink(userState, messageText, userId, chatId, userName, update, env){
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
    // 3. Verifica estado de recebimento de mídia (Inicializa o fluxo se a mensagem for um arquivo)
    // Se não há um processo ativo e a mensagem NÃO é apenas texto, inicializa o fluxo de mídia.
    if (userState.proces === '' && (update.message?.photo || update.message?.document || update.message?.video) && !userState.state) {
        userState.state = 'received_midia';
    }

    // Determina a seção ativa para roteamento
    const sectionName = !userState?.state
        ? messageText
            : (
                userState.state
                    .toLowerCase()
                    .split("_")
                    .find(part => [ comandLinksfera, "Adicionar", "editar", "Deletar", "configuracao", "ver", "section" ]
                        .map(v => v.toLowerCase()).includes(part)
                    ) || normalize(messageText)
                );

    // Roteamento para a função de fluxo correspondente
    switch (normalize(sectionName)) {

        case normalize(comandLinksfera):
                userState.procesCont = 0;
                userState.proces = normalize(messageText);
                userState.state = 'waiting_section';
                await saveUserState(env, userId, userState);
                await sendMessage(`Olá ${userName}! Como posso ajudar?\n /Adicionar_Link - /editar_link\n\n /Deletar_link - /configuracao_link\n\n /ver_links --- /encerrar`, chatId, env);
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

        case normalize('configuracao'):
            if(normalize(messageText) == normalize("configuracao_link")){
                const result = await dataExist("config", {type:"linksfera"}, env);
                messageText = result ? "configuracao_link" : "start_configuracao";
                    }
            return await handleConfiguracaoLink(userState, messageText, userId, chatId, userName, update, env);
            break;
/*
        case normalize('ver'):
            return await handleListView(userState, messageText, userId, chatId, userName, update, env);
            break;*/

        case normalize("section"):
            userState.state =  normalize(messageText.split('_')[0]);
            await saveUserState(env, userId, userState);
            await linksfera(userState, messageText, userId, chatId, userName, update, env);
                return new Response("Inicializando seção !", {status:200});

        default:
            //userState = null;
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
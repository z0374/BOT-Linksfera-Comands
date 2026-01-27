import { commands_manifest, normalize, saveUserState, sendCallBackMessage, sendMessage, escapeHTML, yesOrNo, dataRead, dataUpdate, dataDelete, dataExist, dataSave, downloadGdrive, sendMidia, image } from "../../engine/engine.index.js";

export async function handleConfiguracaoLink(userState, messageText, userId, chatId, userName, update, env) {

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
                        linksCommand.push("/Editar_config_link" + (i++));
                }
                const messageConfig = `
Cor primária: ${dataConfig[2]}            
Cor Secundária: ${dataConfig[3]}
Cor Destaque: ${dataConfig[4]}\n
Texto do Rodapé: <b>${dataConfig[1]}</b>
LINK 01: ${linksFooter[0]}
LINK 02: ${linksFooter[1]}
LINK 03: ${linksFooter[2]}\n\n
/Editar_config_Imagem\n
/Editar_config_corPrimaria\n
/Editar_config_corSecundaria\n
/Editar_config_corDestaque\n
/Editar_config_textoRodape\n
${linksCommand[0]}\n
${linksCommand[1]}\n
${linksCommand[2]}\n\n/encerrar
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
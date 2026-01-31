import { commands_manifest, normalize, saveSession, sendCallBackMessage, sendMessage, escapeHTML, yesOrNo, dataRead, dataUpdate, dataDelete, dataExist, dataSave, downloadGdrive, sendMidia, image } from "../../engine/engine.index.js";

//todos os SESSION são inicializados externamente
export async function handleConfiguracaoLink(SESSION, messageText, userId, chatId, userName, update, env) {
const dataIds = ["imagem", "textorodape", "corprimaria", "corsecundaria", "cordestaque", "link1", "link2", "link3",];
    const comandLinksfera = normalize(commands_manifest[0].name);

    switch (normalize(messageText)) {

        case normalize("start_configuracao"):
            SESSION.procesCont = 0;
            SESSION.state = "waiting_logo_configuracao";
            await saveSession(env, userId, SESSION);
            await sendMessage(`Certo Sr. ${userName}\nComece me enviando a logo do Portal de links ?`, chatId, env);
            return new Response("Aguardando logo.", { status: 200 });
            break;

        case normalize("configuracao_link"):
            try {
                SESSION.procesCont = 0;
                SESSION.state = "waiting_edit_configuracao";
                await saveSession(env, userId, SESSION);
                SESSION.titulo = (await dataRead("config", { type: "linksfera" }, env)).data;

                if (!SESSION.titulo) {
                    await sendMessage('Erro: configuração não encontrada.', chatId, env);
                    return new Response('Config não encontrada', { status: 200 });
                }

                let dataConfig;
                try {
                    dataConfig = JSON.parse(SESSION.titulo);
                } catch (e) {
                    await sendMessage('Erro: configuração inválida.', chatId, env);
                    return new Response('Config inválida', { status: 200 });
                }

                // Get logo with validation
                let logoLinks;
                try {
                    if (Array.isArray(dataConfig.logo)) {
                        const idDrive = (await dataRead("assets", { id: dataConfig.logo[0] }, env)).data;
                        logoLinks = await downloadGdrive(idDrive, env, chatId);
                    } else {
                        logoLinks = null;
                    }
                } catch (e) {
                    logoLinks = null;
                }

                // Collect link IDs dynamically from config object
                const linkIds = ['links1', 'links2', 'links3']
                    .map((k, i) => ({ key: k, index: i + 1, id: dataConfig[k] }))
                    .filter(x => x.id);

                // Parallelize reads
                const linksData = await Promise.allSettled(
                    linkIds.map(x => dataRead("assets", { id: x.id }, env))
                );

                // Build arrays dynamically
                const linksFooter = [];
                const linksCommand = [];
                for (let i = 0; i < linksData.length; i++) {
                    const r = linksData[i];
                    if (r.status === 'fulfilled' && r.value?.data) {
                        try {
                            const parsed = JSON.parse(r.value.data);
                            linksFooter.push(escapeHTML(parsed.texto || ''));
                            linksCommand.push("/Editar_config_link" + linkIds[i].index);
                        } catch (e) {
                            linksFooter.push('[Indisponível]');
                        }
                    } else {
                        linksFooter.push('[Indisponível]');
                    }
                }

                // Build message dynamically based on actual link count
                let messageConfig = `
Cor primária: ${escapeHTML(dataConfig.colorP || '')}            
Cor Secundária: ${escapeHTML(dataConfig.colorS || '')}
Cor Destaque: ${escapeHTML(dataConfig.colorD || '')}\n
Texto do Rodapé: <b>${escapeHTML(dataConfig.text || '')}</b>`;

                if (linksFooter.length > 0) {
                    messageConfig += '\n';
                    linksFooter.forEach((link, i) => {
                        messageConfig += `LINK 0${i + 1}: ${link}\n`;
                    });
                }

                messageConfig += `\n/Editar_config_Imagem\n
/Editar_config_corPrimaria\n
/Editar_config_corSecundaria\n
/Editar_config_corDestaque\n
/Editar_config_textoRodape\n`;

                linksCommand.forEach(cmd => {
                    messageConfig += `${cmd}\n`;
                });

                messageConfig += `______________________________\n/encerrar`;

                if (logoLinks) {
                    await sendMidia([logoLinks, `Olá Sr. ${userName}\n${messageConfig}`], chatId, env);
                } else {
                    await sendMessage(`Olá Sr. ${userName}\n${messageConfig}`, chatId, env);
                }

            } catch (error) {
                const message = "Erro em config_link: " + (error && error.stack ? error.stack : String(error));
                await sendCallBackMessage(message, chatId, env);
                return new Response(message, { status: 200 });
            }
            return new Response("Aguardando logo.", { status: 200 });
            break;

        default:
            break;
    }

    switch (normalize(SESSION.state)) {
    
            case normalize("waiting_edit_configuracao"):
                const commandEdit = messageText.split("_");
                const indexData = dataIds.indexOf(commandEdit[2].toLowerCase());
                const data = JSON.parse((await dataRead("config",{type: "linksfera"}, env)).data);
                const key = (Object.keys(data))[indexData];
                SESSION.data = { ...data }
                SESSION.list.push(key, data[key]);
                SESSION.state = "waiting_new_configuracao" ;
                await saveSession(env, userId, SESSION);
                await sendMessage(`Certo Sr. ${userName},\nInforme oª novoª ${commandEdit[2]} :`, chatId, env);
                    return new Response("Iniciando confirmação", {status: 200});
                        break;

        case normalize("waiting_new_configuracao"):
            SESSION.state = "waiting_confirm_configuracao" ;
            SESSION.data[SESSION.list[0]] = messageText;
                await saveSession(env, userId, SESSION);
            await sendMessage(`Certo Sr. ${userName},\nDeseja substituir ${SESSION.list[1]}\nPOR\n${messageText} ?`, chatId, env);
            await sendMessage("/SIM   |   /NAO", chatId, env);
                return new Response("Iniciando confirmação", {status: 200});
                    break;

        case normalize("waiting_logo_configuracao"):
            try {
                SESSION.procesCont = 0;
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
                    const message = 'Erro ao extrair imagem da requisição! ' + (error && error.stack ? error.stack : String(error));
                    await sendCallBackMessage(message, chatId, env);
                    return new Response(message, { status: 200 });

                }
                let nameImageItemMenu = "logoLinksfera" + normalize(agoraItemsMenu.toISOString().split('T')[0].replace(/-/g, '') + agoraItemsMenu.getMinutes().toString().padStart(2, '0'));
                try {
                    // 2. Chamada para 'image' com o MIME Type
                    const imgId = await image(itemMenuFileId, nameImageItemMenu, itemMenuMimeType, env, chatId);
                    const imageItemMenu = [imgId, "img"];
                    if (!Array.isArray(SESSION.select)) SESSION.select = [];
                    SESSION.data.logo = imageItemMenu;
                } catch (error) {
                    const message = 'Erro ao processar imagem: ' + (error && error.stack ? error.stack : String(error));
                    await sendCallBackMessage(message, chatId, env);
                    return new Response(message, { status: 200 });
                }
                SESSION.state = "waiting_Texto_configuracao";
                await saveSession(env, userId, SESSION);
                await sendMessage(`Certo Sr. ${userName}\nAgora me envie o texto que irá aparecer no rodapé?`, chatId, env);
                return new Response("Aguardando logo.", { status: 200 });

            } catch (error) {
                const message = "Erro ao receber a logo: " + (error && error.stack ? error.stack : String(error));
                await sendCallBackMessage(message, chatId, env);
                return new Response(message, { status: 200 });
            }
            break;

        case normalize("waiting_Texto_configuracao"):
            try {
                SESSION.procesCont = 0;
                SESSION.data.text = messageText;
                SESSION.state = "waiting_colorP_configuracao";
                await saveSession(env, userId, SESSION);
                await sendMessage(`Certo Sr. ${userName}\nAgora me envie a cor primária do Portal?\n`, chatId, env);
                return new Response("Aguardando colorP.", { status: 200 });
            } catch (error) {
                const message = 'Erro em waiting_Texto_configuracao: ' + (error && error.stack ? error.stack : String(error));
                await sendCallBackMessage(message, chatId, env);
                return new Response(message, { status: 200 });
            }
            break;

        case normalize("waiting_colorP_configuracao"):
            try {
                SESSION.procesCont = 0;
                SESSION.data.colorP = messageText;
                SESSION.state = "waiting_colorS_configuracao";
                await saveSession(env, userId, SESSION);
                await sendMessage(`Certo Sr. ${userName}\nAgora me envie a cor secundária do Portal?\n`, chatId, env);
                return new Response("Aguardando colorS.", { status: 200 });
            } catch (error) {
                const message = 'Erro em waiting_colorP_configuracao: ' + (error && error.stack ? error.stack : String(error));
                await sendCallBackMessage(message, chatId, env);
                return new Response(message, { status: 200 });
            }
            break;

        case normalize("waiting_colorS_configuracao"):
            try {
                SESSION.procesCont = 0;
                SESSION.data.colorS = messageText;
                SESSION.state = "waiting_colorD_configuracao";
                await saveSession(env, userId, SESSION);
                await sendMessage(`Certo Sr. ${userName}\nAgora me envie a cor de destaque do Portal?\n`, chatId, env);
                return new Response("Aguardando colorD.", { status: 200 });

            } catch (error) {
                const message = 'Erro em waiting_colorS_configuracao: ' + (error && error.stack ? error.stack : String(error));
                await sendCallBackMessage(message, chatId, env);
                return new Response(message, { status: 200 });
            }
            break;

        case normalize("waiting_colorD_configuracao"):
            try {
                SESSION.procesCont = 0;
                if (!SESSION.data || typeof SESSION.data !== 'object') SESSION.data = {};
                const dataLinks = await dataRead("assets", { type: "link" }, env);
                SESSION.state = "waiting_links_configuracao";

                // Se pular ou não houver links cadastrados, avança para confirmação
                if (normalize(messageText) == normalize("pular") || !dataLinks || dataLinks.length == 0) {
                    await handleConfiguracaoLink(SESSION, messageText, userId, chatId, userName, update, env);
                    return new Response("Gerando confirmação !", { status: 200 });
                }

                // Conta quantos links já foram selecionados em SESSION.data
                let linksCount = ['links1', 'links2', 'links3'].reduce((acc, k) => acc + (SESSION.data[k] ? 1 : 0), 0);

                // Se já tiver 3 links, avança para confirmação
                if (linksCount >= 3) {
                    await handleConfiguracaoLink(SESSION, messageText, userId, chatId, userName, update, env);
                    return new Response("Gerando confirmação !", { status: 200 });
                }

                // Detecta comando de seleção mais robusto (remove barra inicial se existir)
                const cmd = normalize((messageText || '').replace(/^\//, '')).split('_')[0];
                const confirmSelect = cmd === 'selecionar';

                if (confirmSelect) {
                    const id = messageText.replace(/\D/g, "");
                    if (!id) {
                        await sendMessage('ID de link inválido. Use /Selecionar_link<ID>.', chatId, env);
                        return new Response('ID inválido', { status: 200 });
                    }
                    if (!SESSION.data.links1) SESSION.data.links1 = id;
                    else if (!SESSION.data.links2) SESSION.data.links2 = id;
                    else if (!SESSION.data.links3) SESSION.data.links3 = id;
                    // incrementa contagem e salva
                    linksCount++;
                    await saveSession(env, userId, SESSION);
                    if (linksCount >= 3) {
                        await handleConfiguracaoLink(SESSION, messageText, userId, chatId, userName, update, env);
                        return new Response("Gerando confirmação !", { status: 200 });
                    }
                } else {
                    // usuário enviou a cor de destaque
                    SESSION.data.colorD = messageText;
                    await saveSession(env, userId, SESSION);
                }

                // Monta lista de links para seleção (exclui links já selecionados)
                const selectedIds = new Set([SESSION.data && SESSION.data.links1, SESSION.data && SESSION.data.links2, SESSION.data && SESSION.data.links3].filter(Boolean).map(String));
                const linksSelect = [];
                for (const link of dataLinks) {
                    const idStr = String(link.id);
                    if (selectedIds.has(idStr)) continue;
                    const dataLink = JSON.parse(link.data);
                    linksSelect.push(`Link: ${dataLink.titulo}   /Selecionar_link${link.id}`);
                }
                SESSION.state = "waiting_colorD_configuracao";
                await saveSession(env, userId, SESSION);
                await sendMessage(linksSelect.join("\n\n") + "\n\n/PULAR", chatId, env);
                return new Response("Aguardando links.", { status: 200 });
            } catch (error) {
                const message = 'Erro em waiting_colorD_configuracao: ' + (error && error.stack ? error.stack : String(error));
                await sendCallBackMessage(message, chatId, env);
                return new Response(message, { status: 200 });
            }
            break;

        case normalize("waiting_links_configuracao"):
            try {
                SESSION.procesCont = 0;
                SESSION.state = "waiting_confirm_configuracao";
                await saveSession(env, userId, SESSION);
                const dataConf = { ...SESSION.data };
                let logoLinks;
                const linksFooter = [];

                logoLinks = await downloadGdrive(dataConf.logo[0], env, chatId);

                // Parallelize link reads with Promise.allSettled
                const linkIds = [dataConf.links1, dataConf.links2, dataConf.links3].filter(Boolean);
                if (linkIds.length) {
                    const reads = await Promise.allSettled(linkIds.map(id => dataRead("assets", { id }, env)));
                    for (const r of reads) {
                        if (r.status === 'fulfilled' && r.value && r.value.data) {
                            try {
                                const parsed = JSON.parse(r.value.data);
                                linksFooter.push(escapeHTML(parsed.texto || ''));
                            } catch (e) {
                                linksFooter.push('');
                            }
                        } else {
                            linksFooter.push('');
                        }
                    }
                }
                while (linksFooter.length < 3) linksFooter.push('');

                const messageConfirm = `
Cor primária: ${escapeHTML(dataConf.colorP || '')}            
cor Secundária: ${escapeHTML(dataConf.colorS || '')}
cor Destaque: ${escapeHTML(dataConf.colorD || '')}\n
Rodapé:
    <b>${escapeHTML(dataConf.text || '')}</b>
        ${linksFooter[0]}
        ${linksFooter[1]}
        ${linksFooter[2]}
            `;
                await sendMidia([logoLinks, messageConfirm], chatId, env);
                await sendMessage("/SIM   |   /NAO", chatId, env);
                return new Response("Aguardando confirmação", { status: 200 });
            } catch (error) {
                const message = 'Erro em waiting_links_configuracao: ' + (error && error.stack ? error.stack : String(error));
                await sendCallBackMessage(message, chatId, env);
                return new Response(message, { status: 200 });
            }
            break;

        case normalize("waiting_confirm_configuracao"):
            try {
                SESSION.procesCont = 0;
                const response = normalize(messageText);
                let saveConfig;
                if (response === normalize("SIM")) {
                    try {
                        const logoLinks = await dataSave(SESSION.data.logo, ["assets", "data, type"], env, chatId);
                        saveConfig = JSON.stringify({ ...SESSION.data, logo: logoLinks });
                        
                    } catch (error) {
                        const message = "Erro ao salvar a configuração linksfera: " + (error && error.stack ? error.stack : String(error));
                        await sendCallBackMessage(message, chatId, env);
                        return new Response(message, { status: 200 });
                    }
                } else {
                    await sendMessage("Responda com /SIM ou /NAO para confirmar.", chatId, env);
                    return new Response("Resposta inválida", { status: 200 });
                }
                await yesOrNo([saveConfig, "linksfera"], ["config", "data, type"], userId, chatId, SESSION, messageText, env);
                        return new Response("Salvo com sucesso!", { status: 200 });
            } catch (error) {
                const message = 'Erro em waiting_confirm_configuracao: ' + (error && error.stack ? error.stack : String(error));
                await sendCallBackMessage(message, chatId, env);
                return new Response(message, { status: 200 });
            }
            break;

        default:
            break;
    }
}
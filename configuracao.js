import { commands_manifest, normalize, saveSession, sendCallBackMessage, sendMessage, escapeHTML, yesOrNo, dataRead, dataUpdate, dataDelete, dataExist, dataSave, downloadGdrive, sendMidia, image, recFile, downloadFile, deleteGdrive } from "../../engine/engine.index.js";
import { listLinks } from "./utils.js";
//todos os SESSION são inicializados externamente
export async function handleConfiguracaoLink(SESSION, messageText, userId, chatId, userName, update, env) {
    const dataIds = ["imagem", "textorodape", "corprimaria", "corsecundaria", "cordestaque", "link1", "link2", "link3",];
    const comandLinksfera = normalize(commands_manifest[0].name);

    switch (normalize(messageText)) {

        case normalize("start_configuracao"):
            SESSION.procesCont = 0;
            SESSION.state = "waiting_logo_configuracao";
            await saveSession(env, userId, SESSION);
            await sendMessage(`Certo  ${userName}\nComece me enviando a logo do Portal de links ?`, chatId, env);
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
                    if (dataConfig.logo) {
                        const idDrive = (await dataRead("assets", { id: dataConfig.logo }, env)).data;
                        logoLinks = await downloadGdrive(idDrive, env, chatId);
                    } else {
                        logoLinks = null;
                    }
                } catch (e) {
                    await sendCallBackMessage(`Erro ao obter Imagem da Logo ` + e.stack, chatId, env);
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
let messageConfig = `⚙️ <b>CONFIGURAÇÕES ATUAIS</b>\n\n`;

// Seção de Cores com formatação de código para fácil leitura (ou cópia)
messageConfig += `🎨 <b>Paleta de Cores:</b>\n`;
messageConfig += `├ Primária: <code>${escapeHTML(dataConfig.colorP || 'Não definida')}</code>\n`;
messageConfig += `├ Secundária: <code>${escapeHTML(dataConfig.colorS || 'Não definida')}</code>\n`;
messageConfig += `└ Destaque: <code>${escapeHTML(dataConfig.colorD || 'Não definida')}</code>\n\n`;

// Seção de Rodapé
messageConfig += `📝 <b>Texto do Rodapé:</b>\n`;
messageConfig += `<i>${escapeHTML(dataConfig.text || 'Sem texto definido')}</i>\n`;

// Lógica de Links (com ícones)
if (linksFooter.length > 0) {
    messageConfig += `\n🔗 <b>Links do Rodapé:</b>\n`;
    linksFooter.forEach((link, i) => {
        messageConfig += `• Link ${i + 1}: ${link}\n`;
    });
}

// Separador visual
messageConfig += `\n━━━━━━━━━━━━━━━━━━━━\n`;
messageConfig += `🛠 <b>MENU DE EDIÇÃO</b>\n\n`;

// Comandos agrupados
messageConfig += `/Editar_config_Imagem\n\n`;
messageConfig += `/Editar_config_corPrimaria\n\n`;
messageConfig += `/Editar_config_corSecundaria\n\n`;
messageConfig += `/Editar_config_corDestaque\n\n`;
messageConfig += `/Editar_config_textoRodape\n`;

// Comandos dinâmicos (links)
if (linksCommand.length > 0) {
    messageConfig += `\n<b>Links:</b>\n`;
    linksCommand.forEach(cmd => {
        messageConfig += `${cmd}\n\n`;
    });
}

messageConfig += `\n❌ /encerrar`;

                if (logoLinks) {
                    await sendMidia([logoLinks, `Olá  ${userName}\n${messageConfig}`], chatId, env);
                } else {
                    await sendMessage(`Olá  ${userName}\n${messageConfig}`, chatId, env);
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
            const data = JSON.parse((await dataRead("config", { type: "linksfera" }, env)).data);
            const key = (Object.keys(data))[indexData];
            let valueConfig;
            let verbo = "Informe";
            let selectLinks;
            if(key.toLowerCase().includes("link")){
                verbo = "Selecione";
                const dataLinks = await dataRead("assets", {type: "link"}, env);
                selectLinks = listLinks(dataLinks, SESSION.data);
                valueConfig = JSON.parse((await dataRead("assets", {id: data[key]}, env)).data).titulo;
            }else{
                valueConfig = data[key];
            }
            SESSION.data = { ...data }
            SESSION.list.push(key, valueConfig);
            SESSION.state = "waiting_new_configuracao";
            await saveSession(env, userId, SESSION);
            await sendMessage(`Certo  ${userName},\n${verbo} oª novoª ${commandEdit[2]} :`, chatId, env);
            if(key.toLowerCase().includes("link")) await sendMessage(selectLinks.join("\n\n") + "\n\n/PULAR", chatId, env);
            return new Response("Iniciando confirmação", { status: 200 });
            break;

        case normalize("waiting_new_configuracao"):
            try {
                SESSION.state = "waiting_confirm_configuracao";
                if (SESSION.list[0] == 'logo') {
                    let logoFileId, logoMimeType;
                    const agoraItemsMenu = new Date();
                    try {
                        // 1. Extração de File ID e MIME Type da mensagem de entrada (Apenas Imagem)
                        if (update.message?.document && update.message.document.mime_type.startsWith('image/')) {
                            logoFileId = update.message.document.file_id;
                            logoMimeType = update.message.document.mime_type;
                        } else if (update.message?.photo) {
                            logoFileId = update.message.photo.pop().file_id;
                            logoMimeType = 'image/jpeg';
                        } else {
                            await sendMessage('Por favor, envie uma imagem válida.', chatId, env);
                            return new Response('OK');
                        }
                    } catch (error) {
                        const message = 'Erro ao extrair imagem da requisição! ' + (error && error.stack ? error.stack : String(error));
                        await sendCallBackMessage(message, chatId, env);
                        return new Response(message, { status: 200 });
                    }
                    let nameImageLogo = "logoLinksfera" + normalize(agoraItemsMenu.toISOString().split('T')[0].replace(/-/g, '') + agoraItemsMenu.getMinutes().toString().padStart(2, '0'));
                    const imgId = await image(logoFileId, nameImageLogo, logoMimeType, env, chatId);
                    SESSION.data.logo = [imgId, "img"];
                    const newFile = await downloadFile((await recFile(logoFileId, env, chatId)), env, chatId);
                    const oldFile = await downloadGdrive(((await dataRead('assets', { id: SESSION.list[1] }, env)).data), env, chatId);
                    await sendMessage(`Certo  ${userName},\nDeseja substituir:`, chatId, env);
                    await sendMidia([oldFile, ""], chatId, env);
                    await sendMessage(`POR:`, chatId, env);
                    await sendMidia([newFile, ""], chatId, env);
                } else {
                    let newValue, newId;
                    if(SESSION.list[0].toLowerCase().includes('link')){
                        newId = messageText.replace(/\D/g, '');
                        newValue = JSON.parse((await dataRead("assets", { id: newId }, env)).data).titulo;
                    }else{
                        newValue = messageText;
                        newId = messageText;
                    }
                    SESSION.data[SESSION.list[0]] = newId;
                    await sendMessage(`Certo  ${userName},\nDeseja substituir ${SESSION.list[1]}\nPOR\n${newValue} ?`, chatId, env);
                }
                await sendMessage("/SIM   |   /NAO", chatId, env);
                await saveSession(env, userId, SESSION);
                return new Response("Iniciando confirmação", { status: 200 });
                break;
            } catch (error) {
                const message = 'Erro ao gerar confirmação ' + (error && error.stack ? error.stack : String(error));
                await sendCallBackMessage(message, chatId, env);
                return new Response(message, { status: 200 });
            }


        case normalize("waiting_logo_configuracao"):
            try {
                SESSION.procesCont = 0;
                const agoraItemsMenu = new Date();
                let logoFileId, logoMimeType;

                try {
                    // 1. Extração de File ID e MIME Type da mensagem de entrada (Apenas Imagem)
                    if (update.message?.document && update.message.document.mime_type.startsWith('image/')) {
                        logoFileId = update.message.document.file_id;
                        logoMimeType = update.message.document.mime_type;
                    } else if (update.message?.photo) {
                        logoFileId = update.message.photo.pop().file_id;
                        logoMimeType = 'image/jpeg';
                    } else {
                        await sendMessage('Por favor, envie uma imagem válida.', chatId, env);
                        return new Response('OK');
                    }
                } catch (error) {
                    const message = 'Erro ao extrair imagem da requisição! ' + (error && error.stack ? error.stack : String(error));
                    await sendCallBackMessage(message, chatId, env);
                    return new Response(message, { status: 200 });
                }

                let nameImageLogo = "logoLinksfera" + normalize(agoraItemsMenu.toISOString().split('T')[0].replace(/-/g, '') + agoraItemsMenu.getMinutes().toString().padStart(2, '0'));
                try {
                    // 2. Chamada para 'image' com o MIME Type
                    const imgId = await image(logoFileId, nameImageLogo, logoMimeType, env, chatId);
                    if (!Array.isArray(SESSION.select)) SESSION.select = [];
                    SESSION.data.logo = [imgId, "img"];
                } catch (error) {
                    const message = 'Erro ao processar imagem: ' + (error && error.stack ? error.stack : String(error));
                    await sendCallBackMessage(message, chatId, env);
                    return new Response(message, { status: 200 });
                }
                SESSION.state = "waiting_Texto_configuracao";
                await saveSession(env, userId, SESSION);
                await sendMessage(`Certo  ${userName}\nAgora me envie o texto que irá aparecer no rodapé?`, chatId, env);
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
                await sendMessage(`Certo  ${userName}\nAgora me envie a cor primária do Portal?\n`, chatId, env);
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
                await sendMessage(`Certo  ${userName}\nAgora me envie a cor secundária do Portal?\n`, chatId, env);
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
                await sendMessage(`Certo  ${userName}\nAgora me envie a cor de destaque do Portal?\n`, chatId, env);
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

                // Leitura do banco
                const dataLinks = await dataRead("assets", { type: "link" }, env);
                SESSION.state = "waiting_links_configuracao";

                // --- BLOCO 1: Validação Inicial ---
                // Se pular ou não houver links cadastrados, avança
                if (normalize(messageText) == normalize("pular") || !dataLinks || dataLinks.length == 0) {
                    await handleConfiguracaoLink(SESSION, messageText, userId, chatId, userName, update, env);
                    return new Response("Gerando confirmação !", { status: 200 });
                }

                // --- BLOCO 2: Contagem de Links ---
                let linksCount = ['links1', 'links2', 'links3'].reduce((acc, k) => acc + (SESSION.data[k] ? 1 : 0), 0);

                if (linksCount >= 3) {
                    await handleConfiguracaoLink(SESSION, messageText, userId, chatId, userName, update, env);
                    return new Response("Gerando confirmação !", { status: 200 });
                }

                // --- BLOCO 3: Processamento da Entrada do Usuário ---
                const cmd = normalize((messageText || '').replace(/^\//, '')).split('_')[0];
                const confirmSelect = cmd === 'selecionar';

                if (confirmSelect) {
                    const id = messageText.replace(/\D/g, "");
                    if (!id) {
                        await sendMessage('ID de link inválido. Use /Selecionar_link<ID>.', chatId, env);
                        return new Response('ID inválido', { status: 200 });
                    }

                    // Preenche o slot vazio
                    if (!SESSION.data.links1) SESSION.data.links1 = id;
                    else if (!SESSION.data.links2) SESSION.data.links2 = id;
                    else if (!SESSION.data.links3) SESSION.data.links3 = id;

                    linksCount++;
                    await saveSession(env, userId, SESSION);

                    if (linksCount >= 3) {
                        await handleConfiguracaoLink(SESSION, messageText, userId, chatId, userName, update, env);
                        return new Response("Gerando confirmação !", { status: 200 });
                    }
                } else {
                    // Se não for comando de selecionar, assume que é a entrada da Cor Destaque (etapa anterior)
                    SESSION.data.colorD = messageText;
                    await saveSession(env, userId, SESSION);
                }

                // --- BLOCO 4: Geração da Lista (USANDO A NOVA FUNÇÃO) ---
                // Aqui a mágica acontece: chamamos a função externa
                const mensagemLista = listLinks(dataLinks, SESSION.data);

                // Prepara o estado para receber a seleção
                SESSION.state = "waiting_colorD_configuracao"; // Mantém no loop até preencher ou pular
                await saveSession(env, userId, SESSION);

                await sendMessage(mensagemLista, chatId, env);
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
                if (Array.isArray(SESSION.data.logo)) {
                    if (response === normalize("SIM")) {
                        try {
                            const logoLinks = await dataSave(SESSION.data.logo, ["assets", "data, type"], env, chatId);
                            SESSION.data.logo = logoLinks;
                            saveConfig = JSON.stringify({ ...SESSION.data });
                        } catch (error) {
                            const message = "Erro ao salvar a configuração linksfera: " + (error && error.stack ? error.stack : String(error));
                            await sendCallBackMessage(message, chatId, env);
                            return new Response(message, { status: 200 });
                        }
                        if (SESSION.list[0] == 'logo') {
                            const dataDel = await dataDelete('assets', { id: SESSION.list[1] }, env);
                            await deleteGdrive(dataDel.rows[0].data, env, chatId);
                        }
                    } else if (response === normalize("NAO")) {
                        await deleteGdrive(SESSION.data.logo[0], env, chatId);
                    } else {
                        await sendMessage("Responda com /SIM ou /NAO para confirmar.", chatId, env);
                        return new Response("Resposta inválida", { status: 200 });
                    }
                }else{
                    saveConfig = JSON.stringify({ ...SESSION.data });
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
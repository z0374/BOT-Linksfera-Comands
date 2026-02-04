import { normalize, saveSession, sendMessage, sendCallBackMessage, dataRead } from "../../engine/engine.index.js";
import { handleCRUDLink } from "./crud.js";
import { pageLinks } from "./utils.js";

async function handleListView(SESSION, messageText, userId, chatId, userName, update, env) {
const visibility = {"ocultar":"hidden", "mostrar":"show", "fixar":"pin"}

    // Normaliza a entrada
    const msgNorm = normalize(messageText);

    // 1. COMANDOS DE TEXTO
    switch (normalize(messageText)) {

        case normalize("ver_links"):
            try {
                SESSION.procesCont = 0;
                SESSION.state = "waiting_pagination_ver";

                const startPag = await pageLinks('start', env, SESSION);

                // Salva Cache Inicial
                await saveSession(env, userId, SESSION);

                await sendMessage(`Sr. ${userName}\n📂 <b>Listando seus LINKS</b>:`, chatId, env);

                for (const item of startPag.cards) {
                    const textoMensagem = Array.isArray(item) ? item[0] : item;
                    const linkID = Array.isArray(item) ? item[1] : ""; // Pega o ID para usar no template

                    // Se não tiver ID (ex: msg de lista vazia), não exibe o menu de edição
                    let editLink = "";
                    
                    if (linkID) {
                        editLink = `\n\n🛠 <b>Painel de Edição (ID: ${linkID})</b>
──────────────────

🏷 /editar_titulo_${linkID}

📝 /editar_legenda_${linkID}

🔤 /editar_texto_${linkID}

🔗 /editar_url_${linkID}

#️⃣ /editar_tags_${linkID}

👁 /editar_visible_${linkID}

──────────────────
🗑 /deletar_link${linkID}`;
                    }

                    await sendMessage(textoMensagem + editLink, chatId, env);
                }

                if (startPag.footer) {
                    await sendMessage(startPag.footer, chatId, env);
                }
                
                return new Response("Listagem iniciada", { status: 200 });

            } catch (error) {
                const errorMessage = "Erro ao iniciar listagem (ver_links): " + (error.stack || error);
                console.error(errorMessage);
                await sendCallBackMessage(errorMessage, chatId, env);
                return new Response(errorMessage, { status: 200 });
            }
            break;

        default:
            break;
    }

    // 2. NAVEGAÇÃO (ESTADOS)
    switch (normalize(SESSION.state)) {
        case normalize("waiting_property_ver"):
            try {
                SESSION.procesCont = 0;
                SESSION.state = "waiting_confirm_editar";
                let oldData, newData;
                if(SESSION.list[1].includes("visible")){
                    const visibilitySafe = visibility[normalize(messageText)];
                    if(!visibilitySafe){
                        await sendMessage(`Porfavor Sr. ${userName},\nInforme uma das opções válidas abaixo.`, chatId, env);
                        await sendMessage("/OCULTAR   |   /MOSTRAR   |   /FIXAR", chatId, env);
                            return new Response('Aguardando visibilidade', { status: 200 });
                                break;
                    }
                    oldData = Object.keys(visibility).find(key => visibility[key] === SESSION.data[SESSION.list[1]]);
                    newData = normalize(messageText);
                    SESSION.data[SESSION.list[1]] = visibilitySafe;
                }else{
                    oldData = SESSION.data[SESSION.list[1]];
                    newData = messageText;
                    SESSION.data[SESSION.list[1]] = messageText;
                }
            await sendMessage(`Deseja substituir:\n<b>${oldData}</b>\nPOR\n<b>${newData}</b>`, chatId, env);
            await sendMessage("/SIM   |   /NAO", chatId, env);
            await saveSession(env, userId, SESSION);
                return new Response("Aguardando Confirmação", { status:200 });
            } catch (error) {
                const errorMessage = "Erro ao confirmar edição (ver_links): " + (error.stack || error);
                console.error(errorMessage);
                await sendCallBackMessage(errorMessage, chatId, env);
                return new Response(errorMessage, { status: 200 });
            }
                break;

        case normalize("waiting_edit_ver"):
            try {
                SESSION.procesCont = 0;
                SESSION.state = "waiting_property_ver";
                SESSION.list = [messageText.replace(/\D/g, ''), normalize(messageText.split("_")[1])];
                SESSION.data = JSON.parse((await dataRead("assets", {id: SESSION.list[0]}, env)).data);
                if(SESSION.list.includes("visible")){
                    await sendMessage(`Sr. ${userName},\nPor Favor selecione a nova <b>visibilidade</b> :`, chatId, env);
                    await sendMessage("/OCULTAR   |   /MOSTRAR   |   /FIXAR", chatId, env);
                }else{
                    await sendMessage(`Sr. ${userName},\nPor Favor envie oª novoª <b>${SESSION.list[1]}</b> :`, chatId, env);
                }
                await saveSession(env, userId, SESSION);
                return new Response("Editando propriedade do link", { status: 200 });
            } catch (error) {
                const errorMessage = "Erro ao iniciar edição (ver_links): " + (error.stack || error);
                console.error(errorMessage);
                await sendCallBackMessage(errorMessage, chatId, env);
                return new Response(errorMessage, { status: 200 });
            }
                break;

        case normalize("waiting_pagination_ver"):
            try {
                SESSION.procesCont = 0;
                // Verifica navegação permitindo underline no pag_02
                const isNavCommand =
                    msgNorm === normalize("next") ||
                    msgNorm === normalize("prev") ||
                    /^pag_?\d+$/.test(msgNorm);

                if (isNavCommand) {
                    // Passa o comando normalizado (pag_02)
                    const action = msgNorm;

                    const resultado = await pageLinks(action, env, SESSION);
                    await saveSession(env, userId, SESSION);

                    await sendMessage(`Sr. ${userName}\n📂 <b>Listando seus LINKS</b>:`, chatId, env);

                    for (const item of resultado.cards) {
                        const textoMensagem = Array.isArray(item) ? item[0] : item;
                        const linkID = Array.isArray(item) ? item[1] : "";

                        let editLink = "";

                        if (linkID) {
                        editLink = `\n\n🛠 <b>Painel de Edição (ID: ${linkID})</b>
──────────────────

🏷 /editar_titulo_${linkID}

📝 /editar_legenda_${linkID}

🔤 /editar_texto_${linkID}

🔗 /editar_url_${linkID}

#️⃣ /editar_tags_${linkID}

👁 /editar_visible_${linkID}

──────────────────
🗑 /deletar_link${linkID}`;
                    }
                        
                        await sendMessage(textoMensagem + editLink, chatId, env);
                    }

                    if (resultado.footer) {
                        await sendMessage(resultado.footer, chatId, env);
                    }

                    return new Response("Página navegada", { status: 200 });
                }else if(( normalize(messageText)).includes("deletar")){
                    SESSION.state = "waiting_start_crud";
                    SESSION.titulo = parseInt(messageText.replace(/\D+/g, ""));
                    await handleCRUDLink(SESSION, messageText, userId, chatId, userName, update, env);
                        return new Response("Iniciando tarefa!", {status: 200});
                }
                else if ( (await normalize(messageText)).includes("editar") ){
                    SESSION.state = "waiting_edit_ver";
                    SESSION.titulo = parseInt(messageText.replace(/\D+/g, ""));
                    await handleListView(SESSION, messageText, userId, chatId, userName, update, env);
                        return new Response("Iniciando tarefa!", {status: 200});
                }else {
                    await sendMessage("⚠️ Comando inválido.\nUse os botões do rodapé ou /comandos para sair.", chatId, env);
                    // Opcional: Salvar sessão aqui se necessário, mas geralmente não precisa se nada mudou
                    // await saveSession(env, userId, SESSION); 
                    return new Response("Comando inválido", { status: 200 });
                }
            } catch (error) {
                const errorMessage = "Erro na paginação (waiting_pagination_ver): " + (error.stack || error);
                console.error(errorMessage);
                await sendCallBackMessage(errorMessage, chatId, env);
                return new Response(errorMessage, { status: 200 });
            }
            break;

        default:
            break;
    }
}

export { handleListView };
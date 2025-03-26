require('dotenv').config(); // Carrega variáveis de ambiente

// Use NODE_ENV como variável padrão
const ENVIRONMENT = process.env.NODE_ENV || 'development';

if (ENVIRONMENT !== 'production') {
    console.warn(`Aviso: NODE_ENV está configurado como "${ENVIRONMENT}".`);
}

const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Inicializando o cliente
const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Necessário para ambientes como Railway
    },
});

client.on('qr', qr => {
    console.log('QR Code gerado, escaneie para autenticar.');
    qrcode.generate(qr, { small: true }); // Exibe o QR Code no terminal
});

client.on('ready', () => {
    console.log('Cliente está pronto e conectado ao WhatsApp!');
});

// Certifique-se de que a função delay está definida
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Função para centralizar envio de mensagens
const sendMessageWithTyping = async (chat, message, delayTime = 2000) => {
    try {
        await chat.sendStateTyping(); // Simulando digitação
        await delay(delayTime); // Delay configurável
        await client.sendMessage(chat.id._serialized, message);
    } catch (error) {
        console.error(`Erro ao enviar mensagem para ${chat.id._serialized}:`, error.message);
    }
};

client.on('message', async msg => {
    console.log(`Mensagem recebida: ${msg.body} de ${msg.from}`);
    try {
        const chat = await msg.getChat();

        // Mensagem de boas-vindas
        if (msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola)/i) && msg.from.endsWith('@c.us')) {
            const contact = await msg.getContact();
            const name = contact.pushname || "Cliente";
            const welcomeMessage = `Olá, ${name.split(" ")[0]}!\nBem-vindo(a) ao Escondidinho & Cia. Como podemos ajudar?\n\nPor favor, digite uma das opções abaixo:\n1 - Cardápio\n2 - Fazer Pedido`;
            await sendMessageWithTyping(chat, welcomeMessage);
        }

        // Opção 1: Enviar link do cardápio
        else if (msg.body === '1' && msg.from.endsWith('@c.us')) {
            const menuMessage = 'Acesse nosso Cardápio pelo link:\nhttp://bit.ly/CardapioEscondidinhoeCia.';
            await sendMessageWithTyping(chat, menuMessage);
        }

        // Opção 2: Fazer pedido
        else if (msg.body === '2' && msg.from.endsWith('@c.us')) {
            const orderMessage = 'Em instantes iremos te atender.';
            const addressMessage = 'Para onde seria a entrega?\nLogradouro:\nNúmero:\nComplemento:\nBairro:\nCidade:';
            await sendMessageWithTyping(chat, orderMessage);
            await sendMessageWithTyping(chat, addressMessage, 3000);
        }

        // Mensagem genérica para pedidos feitos em outras plataformas
        else if (msg.body.match(/(fiz|Fiz|Ifood|ifood|Falei|falei|pedido|Pedido|Chat|chat|Pelo|pelo)/i) && msg.from.endsWith('@c.us')) {
            const contact = await msg.getContact();
            const name = contact.pushname || "Cliente";
            const responseMessage = `Olá, ${name.split(" ")[0]}! Já iremos te atender.`;
            await sendMessageWithTyping(chat, responseMessage);
        }

        // Mensagem de agradecimento
        else if (msg.body.match(/(obrigado|Obrigado|obrigada|Obrigada|valeu|Valeu)/i) && msg.from.endsWith('@c.us')) {
            const thankYouMessage = 'Nós que agradecemos! Estamos à disposição para ajudar. 😊';
            await sendMessageWithTyping(chat, thankYouMessage);
        }

        // Resposta padrão para mensagens não reconhecidas
        else {
            const defaultMessage = 'Desculpe, não entendi sua mensagem. Por favor, escolha uma das opções:\n1 - Cardápio\n2 - Fazer Pedido';
            await sendMessageWithTyping(chat, defaultMessage);
        }
    } catch (error) {
        console.error(`Erro ao processar mensagem de ${msg.from}:`, error.message);
    }
});

client.initialize();
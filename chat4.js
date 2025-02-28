const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client, List, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = 3000;

// Middleware para processar JSON no Express
app.use(express.json());

// Configuração do cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({ clientId: "bot-session", dataPath: './auth_data' }),
    puppeteer: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Exibe o QR Code para login
client.on('qr', (qr) => {
    console.log("📲 Escaneie o QR Code abaixo para conectar:");
    qrcode.generate(qr, { small: true });
});

// Confirma conexão bem-sucedida
client.on('ready', () => {
    console.log('✅ Bot conectado com sucesso!');
});

// Evento para reconectar se o bot cair
client.on('disconnected', async (reason) => {
    console.log(`❌ Desconectado: ${reason}`);
    console.log('🔄 Tentando reconectar...');
    try {
        await client.destroy();
        client.initialize();
    } catch (error) {
        console.error("Erro ao tentar reiniciar:", error);
    }
});

// Processamento de mensagens recebidas
client.on('message', async (msg) => {
    try {
        const message = msg.body.trim().toLowerCase();
        const chat = await msg.getChat();

        console.log(`📩 Mensagem recebida: "${msg.body}" de ${msg.from}`);

        await chat.sendStateTyping();
        await new Promise(resolve => setTimeout(resolve, 500));

        if (/Bruno/i.test(message)) {
            console.log('✅ Gatilho de inicialização!');

            const list = new List(
                'Escolha uma opção abaixo:',
                'Ver opções',
                [
                    {
                        title: 'Atendimento',
                        rows: [
                            { id: 'vendas', title: 'Vendas' },
                            { id: 'locacao', title: 'Locação' },
                            { id: 'financeiro', title: 'Financeiro' }
                        ]
                    }
                ],
                'Selecione uma opção:',
                'Bot de Atendimento'
            );

            await client.sendMessage(msg.from, 'Olá! 👋 Bem-vindo ao nosso atendimento.');
            await new Promise(resolve => setTimeout(resolve, 500));
            await client.sendMessage(msg.from, list);
            return;
        }

        await client.sendMessage(msg.from, '⚠ Desculpe, não entendi sua mensagem. Digite "menu" para ver as opções.');
    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
        await client.sendMessage(msg.from, '⚠ Ocorreu um erro ao processar sua mensagem. Tente novamente mais tarde.');
    }
});

// Rota API para enviar mensagem via HTTP
app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ error: "Número e mensagem são obrigatórios!" });
    }

    try {
        await client.sendMessage(number + "@c.us", message);
        res.json({ success: true, message: "Mensagem enviada!" });
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        res.status(500).json({ error: "Erro ao enviar mensagem!" });
    }
});

// Inicia o servidor Express
app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});

// Inicializa o cliente do WhatsApp
client.initialize();

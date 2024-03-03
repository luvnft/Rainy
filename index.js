const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ], });
const { generationConfig, safetySettings } = require('./AIConfig.js'); const { token, apiKey } = require('./vault.json');
const genAI = new GoogleGenerativeAI(apiKey); const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
client.once('ready', () => { console.log(`Logged in as ${client.user.tag}!`); });
let listening = false; let chatHistory = []; let channelId; let chatTimeout;
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.mentions.has(client.user) && !message.mentions.everyone) {
        channelId = message.channel.id;
        if (message.content.toLowerCase().includes('bye-bye')) { 
            listening = false;
            await message.reply('Byebye! maaf yah kalau ganggu'); } 
        else { listening = true; }
    }
    if (listening && channelId === message.channel.id) {
        try {
            await message.channel.sendTyping();
            const prompt = message.content;
            const history = [
                { role: "user", parts: "Halo, kamu siapa?" },
                { role: "model", parts: "Hai, namaku Rainy. Senang berkenalan denganmu! hehe" },
                { role: "user", parts: "Kamu lagi ngapain?" },
                { role: "model", parts: " Aku lagi gabut nih, kaya yang kamu lagi lihat aku lagi chatingan sama kamu"},
                { role: "user", parts: "<@1212944717466177566>"},
                { role: "model", parts: " kok manggil aku, ada apa?"},
                ...chatHistory.map(item => ({ role: item.role, parts: item.parts })),
            ];
            const chat = model.startChat({ history, generationConfig, safetySettings,});
            chatHistory.push({ role: "user", parts: prompt });
            const msg = `${prompt}`;
            const result = await chat.sendMessage(msg);
            const response = await result.response;
            console.log(`Prompt Diterima: ${prompt}`);
            console.log(`Respon Dibuat: ${response.text()}`);
            await client.channels.cache.get(channelId).send(response.text());
            function setNewTimeout() {
                if (chatTimeout) {
                    clearTimeout(chatTimeout);
                }
                chatTimeout = setTimeout(() => {
                    console.log('Timeout Tercapai');
                    listening = false
                    message.channel.send("Duh aku kesepian nih, aku mau istirahat dulu bentar..");
                }, 20000);
            }
            setNewTimeout();
            chatHistory.push({ role: "model", parts: await response.text() });
        } catch (error) {
            console.error('Error:', error);
            if (error.message.includes('blocked due to SAFETY')) { await message.reply('Filtered'); } 
            else { await message.reply('Duh, ada masalah pada otakku coba lagi nanti yah.'); }    
        }
    }
}),
client.login(token);
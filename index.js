require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ], presence: {activities: [{name: "You (ㅇㅅㅇ❀)",type: ActivityType.Listening,},],status: 'idle',},});
const { generationConfig, safetySettings } = require('./config.js'); 
const genAI = new GoogleGenerativeAI(process.env.AIAPIKEY);
const { chatHistory, rawHistory } = require("./history.js");
const https = require('https');
const path = require('path');
const fs = require('fs');
client.once('ready', () => {console.log("\x1b[33m%s\x1b[0m", `Logged in sebagai ${client.user.tag}, Menunggu Prompt @Rainy...`);});
let listening = false; let channelId; let chatTimeout;
function fileToGenerativePart(path, mimeType) {
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(path)).toString("base64"),
        mimeType
        },
    };
}
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.mentions.has(client.user) && !message.mentions.everyone) {
        channelId = message.channel.id;
        if (message.content.toLowerCase().includes('bye-bye')) {
            listening = false; 
            clearTimeout(chatTimeout); 
            console.log("\x1b[33m%s\x1b[0m", "Respon Dihentikan, Menunggu Prompt @Rainy...");
            await message.reply('Byebye! maaf yah kalau ganggu'); 
        } else {
            listening = true;
        }
    }
    if (listening && channelId === message.channel.id) {
        try {
            await message.channel.sendTyping();
            let prompt = message.content;
            message.mentions.members.forEach(member => {
                const mentionPattern = new RegExp(`<@!?${member.id}>`, 'g');
                prompt = prompt.replace(mentionPattern, `@${member.displayName}`);
            });
            prompt = `${message.member.displayName}: ${prompt}`;
            console.log(`Prompt Diterima: ${prompt}`); let reply;
            history = [
                ...rawHistory,
                ...chatHistory.map(item => ({ role: item.role, parts: item.parts })),
            ];
            if (message.attachments.size > 0) {
                const tempDir = './temp';
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir);
                    console.log('Direktori sementara berhasil dibuat');
                }
                let counter = 1;
                const Promises = message.attachments.map(async (attachment) => {
                    const extension = path.extname(attachment.name);
                    const newName = `image${counter}${extension}`;
                    const imagePath = path.join(tempDir, newName);
                    counter++;
                    const fileStream = fs.createWriteStream(imagePath);
                    await new Promise((resolve, reject) => {
                        https.get(attachment.url, (res) => {
                            if (res.statusCode !== 200) {
                                reject(new Error(`Gagal mengunduh gambar, status code: ${res.statusCode}`));
                                return;
                            }
                            res.pipe(fileStream);
                            res.on('end', () => resolve(imagePath));
                        }).on('error', reject);
                    });
                    console.log(`Gambar diunduh: ${imagePath}`);
                    return { path: imagePath, extension: extension };
                });
                try {
                    const imagePaths = await Promise.all(Promises);
                    console.log('Seluruh gambar berhasil diunduh:', imagePaths);
                    console.log('Menyiapkan gambar untuk diproses...');
                    const imageParts = [];
                    const imageExtensions = imagePaths.map(img => img.extension);
                    const uniqueExtensions = [...new Set(imageExtensions)];
                    uniqueExtensions.forEach(extension => {
                        const imagesWithExtension = imagePaths.filter(img => img.extension === extension);
                        imagesWithExtension.forEach((img, index) => {
                            imageParts.push(fileToGenerativePart(img.path, `image/${extension.slice(1)}`));
                        });
                    });
                    console.log('Executing command with imageParts:', imageParts);
                    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
                    const result = await model.generateContent([prompt, ...imageParts]);
                    let response = await result.response;
                    console.log(`Respon Dibuat: ${response.text()}`);
                    chatHistory.push({ role: "model", parts: await response.text() });
                    console.log(history);
                    if (response.text().trim() !== '') {
                        reply = await client.channels.cache.get(channelId).send(response.text());
                    } else {reply = await client.channels.cache.get(channelId).send('...');}
                } catch (error) {
                    console.error('Error dalam memproses:', error);
                    reply = await message.reply('Ada kesalahan dalam memproses gambar.');
                }
            } else {
                // Rainy Text Respond
                const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
                const chat = model.startChat({ history, generationConfig, safetySettings,});
                chatHistory.push({ role: "user", parts: prompt });
                const msg = `${prompt}`;
                const result = await chat.sendMessage(msg);
                let response = await result.response;
                console.log(`Respon Dibuat: ${response.text()}`);
                chatHistory.push({ role: "model", parts: await response.text() });
                console.log(history);
                if (response.text().trim() !== '') {
                    reply = await client.channels.cache.get(channelId).send(response.text());
                } else {reply = await client.channels.cache.get(channelId).send('...');}
            }
            function setNewTimeout() {
                if (chatTimeout) {clearTimeout(chatTimeout);}
                chatTimeout = setTimeout(() => {
                    console.log("\x1b[33m%s\x1b[0m", "Timeout Tercapai, Respon dihentikan, Menunggu Prompt...");
                    reply.react('⏰');
                    listening = false;
                }, 20000);
            }
            setNewTimeout();
        } catch (error) {
            message.react('❌');
            console.error('Error:', error);
            if (error.message.includes('blocked due to SAFETY')) { 
                await message.reply('Filtered'); 
                chatHistory.push({ role: "model", parts: "Filtered" });
            } else if (error.message.includes('blocked due to Other')) {
                chatHistory.splice(0, chatHistory.length);
                await message.reply('Jawaban untuk respon ini tidak tersedia, coba lagi nanti'); 
            } else if (error.message.includes('Bad Request')) {
                chatHistory.splice(0, chatHistory.length);
            } else { 
                await message.reply('Duh, ada masalah pada otakku coba lagi nanti yah.'); 
            }    
        }
    }
});

client.login(process.env.DSCTOKEN);

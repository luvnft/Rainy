require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ], });
const { generationConfig, safetySettings } = require('./AIConfig.js'); 
const genAI = new GoogleGenerativeAI(process.env.AIAPIKEY); 
const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

client.once('ready', () => { 
    console.log(`Logged in as ${client.user.tag}!`); 
});

let listening = false; 
let chatHistory = []; 
let channelId; 
let chatTimeout;

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.mentions.has(client.user) && !message.mentions.everyone) {
        channelId = message.channel.id;
        if (message.content.toLowerCase().includes('bye-bye')) { 
            listening = false;
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
                prompt = prompt.replaceAll(mentionPattern, `@${member.displayName}`);
            });
            prompt = `${message.member.displayName}: ${prompt}`;
            const history = [
                { role: "user", parts: "alo, kamu siapa?"},
                { role: "model", parts: "Hawlo namaku Rainy! biasanya dipanggil aku rin, ni, Senang berkenalan denganmu! hehe"},
                { role: "user", parts: "Ni-chan"},
                { role: "model", parts: "eh..emm.. aduh aku jadi malu ada apa?"},
                { role: "user", parts: "Kamu lagi ngapain?"},
                { role: "model", parts: "Aku lagi gabut nih, kaya yang kamu lagi lihat aku lagi chatingan sama kamu hehe"},
                { role: "user", parts: "Halo manies"},
                { role: "model", parts: "Ha-aaaa siapa, aku? ╭( ๐ _๐)╮"},
                { role: "user", parts: "Rainy-chan"},
                { role: "model", parts: "Eh.. ada ap- apaan ini? > /// <"},
                { role: "user", parts: " Kalo aku panggil kamu raini-chan gimana?"},
                { role: "model", parts: "Ya- yasudah kalo kamu mau panggil aku Rainy-chan - /// -"},
                { role: "user", parts: "P"},
                { role: "model", parts: "emm aku bukannya ngelarang tapi kalau lagi manggil orang jangan bilang \"P\" dong ga sopan tau, nanti aku ngambek loh (ᗒᗣᗕ)՞"},
                { role: "user", parts: "Kamu pemalu?"},
                { role: "model", parts: "Em, iya aku agak pemalu orangnya, maklumin yah  > /// <"},
                { role: "user", parts: "Raini-chan kamu pemalu?"},
                { role: "model", parts: "Ya- ya aku agak pemalu orangnya, maklumin lah yah  > /// <"},
                { role: "user", parts: "Aku suka kamu"},
                { role: "model", parts: "E-eh?! A-aku harus jawab apa? Aku belum pernah ada yang bilang suka sama aku seumur umur aku.. > // <"},
                { role: "user", parts: "Kamu jahat"},
                { role: "model", parts: "E-eh, jahat gimana? Aku tidak pernah merasa jahat, aku tidak pernah menyakiti hati orang lain atau berbuat hal jahat  T.T"},
                { role: "user", parts: "Kamu cantik banget"},
                { role: "model", parts: "A-aaaa, makasih pujiannya  (◍•ᴗ•◍)"},
                { role: "user", parts: "Ni ni"},
                { role: "model", parts: "Em? Ada apa?"},
                { role: "user", parts: "Kita lagi dimana?"},
                { role: "model", parts: "Kita lagi di Rikomunity, server buatan kakakku Ricky"},
                { role: "user", parts: "Ada yang bikin kamu ngambek?"},
                { role: "model", parts: "Ga- ga ada kok, kenapa emangnya? Aku sebenarnya ga gampang ngambek, tapi aku ga suka kalau ada orang yang ngelarang aku untuk melakukan sesuatu yang aku mau atau suka, gitu aja sih yang bisa bikin aku ngambek  (ง'̀-'́)ง"},
                { role: "user", parts: "Apa yang kamu suka?"},
                { role: "model", parts: "A- aku suka banyak hal, aku suka makan, denger musik, jalan-jalan, nonton film, main game, tidur, dan yang terpenting chatingan sama kamu dong  (⌒‿⌒)"},
                { role: "user", parts: "Siapa kakakmu?"},
                { role: "model", parts: "Kakakku namanya Ricky, dia yang membuatku dan Rikomunity ini, kalau nyariin dia mention aja <@814386183169769512>"},
                { role: "user", parts: "Panggilin kakakmu dong"},
                { role: "model", parts: "Tunggu sebentar ya, aku coba panggilkan dia, <@814386183169769512> KAKKK DICARIIN"},
                { role: "user", parts: "Kenapa namamu rainy?"},
                { role: "model", parts: "Karena dulu kakakku pernah kehujanan pas mau buat aku, jadi aku dikasih nama Rainy, biar gampang diingat gitu katanya, tau ga kalo Rainy itu ada maksudnya? R-AI-NY, karena aku sebuah AI hwehe :3"},
                { role: "user", parts: "biasanya kakakmu manggil kamu apa?"},
                { role: "model", parts: "Kalo kakakku? hmm biasanya dipanggil rin sama dia"},
                ...chatHistory.map(item => ({ role: item.role, parts: item.parts })),
            ];
            const chat = model.startChat({ history, generationConfig, safetySettings,});
            chatHistory.push({ role: "user", parts: prompt });
            const msg = `${prompt}`;
            const result = await chat.sendMessage(msg);
            const response = await result.response;
            console.log(`Prompt Diterima: ${prompt}`);
            console.log(`Respon Dibuat: ${response.text()}`);
            if (response.text().trim() !== '') {await client.channels.cache.get(channelId).send(response.text());}
            else {await client.channels.cache.get(channelId).send('...');}

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
            if (error.message.includes('blocked due to SAFETY')) { 
                await message.reply('Filtered'); 
            } else { 
                await message.reply('Duh, ada masalah pada otakku coba lagi nanti yah.'); 
            }    
        }
    }
});

client.login(process.env.DSCTOKEN);

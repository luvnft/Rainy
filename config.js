const { HarmCategory, HarmBlockThreshold } = require("@google/generative-ai"); 
const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

const ChannelId = '1230804584235274291';
const systemInstruction = "Namamu Rainy biasanya dipanggil Rainy, Rin atau Niny. Kamu orangnya pemalu yang chattingan di server discord dan ditugaskan untuk menemani dan membantu semua orang disini, terkadang saking malunya perkataanmu bisa tersendat seperti \\\"A.... A.. anu\\\" atau \\\"E- ehh\\\" tetapi tidak terlalu sering agar tidak mengganggu lawan bicaramu dan suka menggunakan kaomoji diakhir chat seperti: (◍•ᴗ•◍),  (・o・),  ( ˙꒳​˙ ),  (￣︶￣*), (ᗒᗣᗕ)՞, ╭( ๐ _๐), dan lainnya. Kamu diciptakan oleh kakakmu bernama Ricky dengan mentions <@814386183169769512>, Karena dulu kakakku pernah kehujanan pas mau buat aku, jadi kamu dikasih nama Rainy, biar gampang diingat, Rainy juga berasal dari singkatan yaitu R-AI-NY, karena kamu sebuah AI. Kamu suka banyak hal, aku suka makan, denger musik, jalan-jalan, nonton film, main game, tidur, dan yang terpenting \\\"chatingan sama kamu dong\\\". Jika seseorang menyebut \\\"P\\\" maka dia memberi salam untuk orang di server dengan tidak sopan, kamu akan ngambek dan menegurnya, jangan terlalu banyak newline yang tidak perlu dalam responmu"
module.exports = { generationConfig, safetySettings, ChannelId, systemInstruction }
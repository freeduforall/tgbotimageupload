const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const token = process.env.BOT_TOKEN;
const serverUrl = process.env.SERVER_URL;

if (!token) {
    console.error('BOT_TOKEN is required in .env file');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const photosDir = path.join(__dirname, 'photos');

// Ensure photos directory exists
if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
}

console.log('Photo Bot is running...');

bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        // Get the largest photo version
        const photo = msg.photo[msg.photo.length - 1];
        const fileId = photo.file_id;
        
        // Get file info and download link
        const file = await bot.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
        
        // Generate unique filename
        const fileExtension = path.extname(file.file_path) || '.jpg';
        const fileName = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
        const filePath = path.join(photosDir, fileName);
        
        // Download and save the file
        await bot.downloadFile(fileId, photosDir);
        
        // Rename the file to our unique name
        const tempFilePath = path.join(photosDir, path.basename(file.file_path));
        fs.renameSync(tempFilePath, filePath);
        
        // Prepare metadata
        const metadata = {
            fileName: fileName,
            fileUrl: `${serverUrl}/photos/${fileName}`,
            fileSize: photo.file_size,
            chatId: chatId,
            timestamp: new Date().toISOString(),
            originalName: path.basename(file.file_path)
        };
        
        // Send metadata to server
        try {
            await axios.post(`${serverUrl}/upload`, metadata);
            console.log(`Metadata sent to server for file: ${fileName}`);
        } catch (serverError) {
            console.error('Failed to send metadata to server:', serverError.message);
        }
        
        // Send success message to user
        await bot.sendMessage(chatId, 
            `✅ Photo saved successfully!\n\n` +
            `📁 Filename: ${fileName}\n` +
            `🔗 URL: ${serverUrl}/photos/${fileName}\n` +
            `📊 Size: ${(photo.file_size / 1024).toFixed(2)} KB`
        );
        
        console.log(`Photo saved: ${fileName}`);
        
    } catch (error) {
        console.error('Error processing photo:', error);
        await bot.sendMessage(chatId, '❌ Sorry, there was an error processing your photo.');
    }
});

bot.on('text', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    if (text === '/start') {
        bot.sendMessage(chatId, 
            '📸 Welcome to Photo Bot!\n\n' +
            'Simply send me a photo and I will:\n' +
            '• Save it to the gallery\n' +
            '• Provide you with download link\n' +
            '• Store the metadata\n\n' +
            'Send any photo to get started!'
        );
    }
});

console.log('Bot started successfully!');

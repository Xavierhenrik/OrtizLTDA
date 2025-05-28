require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdminUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB');

        const adminUser = new User({
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            isAdmin: true
        });

        await adminUser.save();
        console.log('Usuário administrador criado com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro ao criar usuário administrador:', error);
        process.exit(1);
    }
}

createAdminUser(); 
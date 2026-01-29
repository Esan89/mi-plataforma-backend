const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log('Hash for "admin123":', hash);
}

generateHash();

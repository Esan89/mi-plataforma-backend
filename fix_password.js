const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function fixPassword() {
    const client = new Client({
        user: 'Sanchez',
        host: 'localhost',
        database: 'proyectos',
        password: 'admin123',
        port: 5433,
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const password = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        console.log('Generated Hash:', hash);

        const query = 'UPDATE users SET password_hash = $1 WHERE email = $2';
        const values = [hash, 'eusebiosanchez1989@gmail.com'];

        const res = await client.query(query, values);
        console.log('Update result:', res.rowCount);

        // Verify
        const verifyRes = await client.query('SELECT password_hash FROM users WHERE email = $1', ['eusebiosanchez1989@gmail.com']);
        console.log('Stored Hash in DB:', verifyRes.rows[0].password_hash);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

fixPassword();

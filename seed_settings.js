const { Client } = require('pg');

async function seedSettings() {
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

        const settings = [
            { key: 'FERROVALLE_USER', value: 'WADUMI', description: 'Usuario para el scraper de Ferrovalle' },
            { key: 'FERROVALLE_PASSWORD', value: 'Transitoexpos.112025', description: 'Contraseña para el scraper de Ferrovalle' },
        ];

        for (const setting of settings) {
            const query = `
        INSERT INTO settings (key, value, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (key) DO UPDATE 
        SET value = EXCLUDED.value, description = EXCLUDED.description;
      `;
            await client.query(query, [setting.key, setting.value, setting.description]);
            console.log(`Seeded setting: ${setting.key}`);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

seedSettings();

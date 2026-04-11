require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./config/db');
const { startReminderScheduler, sendTomorrowReminders } = require('./services/reminderScheduler');

const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/razorpay', require('./routes/razorpay'));
app.use('/api/reviews', require('./routes/reviews'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', clinic: 'The Smile Dental Clinic' }));

// Manual trigger for testing day-before reminders (admin only in production)
app.post('/api/test/send-reminders', async (req, res) => {
    await sendTomorrowReminders();
    res.json({ success: true, message: 'Reminder job triggered manually.' });
});

// ============================================================
// AUTO MIGRATIONS — adds new columns safely if not present
// ============================================================
const runMigrations = async () => {
    try {
        // Check if is_hidden exists
        const [hiddenCols] = await db.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'is_hidden'`,
            [process.env.DB_NAME]
        );
        if (hiddenCols.length === 0) {
            await db.query(`ALTER TABLE appointments ADD COLUMN is_hidden TINYINT(1) NOT NULL DEFAULT 0`);
            console.log('Migration: added is_hidden to appointments');
        } else {
            console.log('Migration: is_hidden already exists');
        }

        // Check if is_read exists
        const [readCols] = await db.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reminders' AND COLUMN_NAME = 'is_read'`,
            [process.env.DB_NAME]
        );
        if (readCols.length === 0) {
            await db.query(`ALTER TABLE reminders ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0`);
            console.log('Migration: added is_read to reminders');
        } else {
            console.log('Migration: is_read already exists');
        }

        // Check if is_archived exists on payments
        const [archivedCols] = await db.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'is_archived'`,
            [process.env.DB_NAME]
        );
        if (archivedCols.length === 0) {
            await db.query(`ALTER TABLE payments ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0`);
            console.log('Migration: added is_archived to payments');
        } else {
            console.log('Migration: is_archived already exists');
        }

        // Check if is_deleted exists on reminders
        const [deletedCols] = await db.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reminders' AND COLUMN_NAME = 'is_deleted'`,
            [process.env.DB_NAME]
        );
        if (deletedCols.length === 0) {
            await db.query(`ALTER TABLE reminders ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0`);
            console.log('Migration: added is_deleted to reminders');
        } else {
            console.log('Migration: is_deleted already exists');
        }

        console.log('Migrations complete.');
    } catch (err) {
        console.error('Migration FAILED:', err.message);
    }
};

// ============================================================
// ADMIN SEED — runs on every startup, safe (no duplicates)
// Creates admin1 and doctor if fewer than 2 admins exist
// ============================================================
const seedAdmins = async () => {
    try {
        const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM admin');
        if (parseInt(count) >= 2) {
            console.log('Admins already seeded. Skipping.');
            return;
        }

        const admins = [
            { username: 'admin1', password: 'admin123' },
            { username: 'doctor', password: 'doctor123' }
        ];

        for (const admin of admins) {
            const [existing] = await db.query('SELECT id FROM admin WHERE username = ?', [admin.username]);
            if (existing.length === 0) {
                const hashed = await bcrypt.hash(admin.password, 12);
                await db.query('INSERT INTO admin (username, password) VALUES (?, ?)', [admin.username, hashed]);
                console.log(`Admin seeded: ${admin.username}`);
            }
        }
    } catch (err) {
        console.error('Admin seed error:', err.message);
    }
};

const PORT = process.env.PORT || 5002;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await runMigrations();
    await seedAdmins();
    startReminderScheduler();
});

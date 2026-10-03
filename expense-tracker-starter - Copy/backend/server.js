require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'expense_tracker'
});

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

// Shared column list: numeric as number, date as YYYY-MM-DD
const COLUMNS = `id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date`;

// Returns an error message, or null if the data is valid
function validateExpense({ title, amount, category, date }) {
    if (typeof title !== 'string' || !title.trim()) return 'Title is required.';
    if (title.trim().length > 100) return 'Title must be 100 characters or less.';

    const num = Number(amount);
    if (amount === '' || amount == null || !Number.isFinite(num) || num <= 0) {
        return 'Amount must be a number greater than 0.';
    }

    if (!CATEGORIES.includes(category)) {
        return `Category must be one of: ${CATEGORIES.join(', ')}.`;
    }

    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        !isNaN(Date.parse(date)) &&
        new Date(date).toISOString().slice(0, 10) === date;
    if (!validDate) return 'Date must be a valid YYYY-MM-DD.';

    return null;
}

const isValidId = (id) => /^\d+$/.test(id);

// GET all expenses
app.get('/api/expenses', async (req, res) => {
    try {
        const result = await pool.query(`SELECT ${COLUMNS} FROM expenses ORDER BY id`);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET one expense
app.get('/api/expenses/:id', async (req, res) => {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(404).json({ message: 'Invalid ID.' });

    try {
        const result = await pool.query(`SELECT ${COLUMNS} FROM expenses WHERE id = $1`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Expense not found.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// POST new expense
app.post('/api/expenses', async (req, res) => {
    const body = req.body || {};
    const error = validateExpense(body);
    if (error) return res.status(400).json({ message: error });

    const { title, amount, category, date } = body;
    try {
        const result = await pool.query(
            `INSERT INTO expenses (title, amount, category, date)
             VALUES ($1, $2, $3, $4)
             RETURNING ${COLUMNS}`,
            [title.trim(), amount, category, date]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Could not add the expense.' });
    }
});

// PUT update expense
app.put('/api/expenses/:id', async (req, res) => {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(404).json({ message: 'Invalid ID.' });

    const body = req.body || {};
    const error = validateExpense(body);
    if (error) return res.status(400).json({ message: error });

    const { title, amount, category, date } = body;
    try {
        const result = await pool.query(
            `UPDATE expenses
             SET title = $1, amount = $2, category = $3, date = $4
             WHERE id = $5
             RETURNING ${COLUMNS}`,
            [title.trim(), amount, category, date, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Expense not found.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Could not update the expense.' });
    }
});

// DELETE expense
app.delete('/api/expenses/:id', async (req, res) => {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(404).json({ message: 'Invalid ID.' });

    try {
        const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Expense not found.' });
        }
        res.status(200).json({ message: 'Expense deleted.', id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Could not delete the expense.' });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient(); // Back to clean & simple

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "success", message: "Workmesh Backend & Database are completely connected!" });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Database connection failed.", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Workmesh server is running live on http://localhost:${PORT}`);
});
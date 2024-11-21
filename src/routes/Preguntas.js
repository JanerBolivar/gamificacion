import express from 'express';
import fs from 'fs/promises'; // Usa fs/promises para promesas
import path from 'path';
import { fileURLToPath } from 'url';

const preguntasRouter = express.Router();

// Obtener __dirname en ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta para obtener una pregunta aleatoria
preguntasRouter.get('/pregunta', async (req, res) => {
    try {
        // Leer el archivo JSON
        const filePath = path.join(__dirname, 'preguntas.json');
        const data = await fs.readFile(filePath, 'utf-8');
        const preguntas = JSON.parse(data);

        // Seleccionar una pregunta aleatoria
        const preguntaAleatoria = preguntas[Math.floor(Math.random() * preguntas.length)];

        // Enviar la pregunta como respuesta
        res.json(preguntaAleatoria);
    } catch (error) {
        console.error('Error al obtener una pregunta:', error);
        res.status(500).json({ error: 'No se pudo obtener la pregunta' });
    }
});

export default preguntasRouter;

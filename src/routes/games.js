import express from 'express';
import { createConnection } from '../config/database.js';

const gameRouter = express.Router();

// Ruta para obtener el estado
gameRouter.get('/status', async (req, res) => {
    try {
        res.status(200).json({
            status: "true"
        });
    } catch (error) {
        res.status(500).json({
            status: "false"
        });
    }
});

// Generar un game_id único basado en el año, mes y tres números aleatorios
const generateGameId = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = ("0" + (new Date().getMonth() + 1)).slice(-2);
    const randomNum = Math.floor(Math.random() * 900) + 100;
    return `${year}${month}${randomNum}`;
};

// Ruta para registrar un nuevo juego
gameRouter.post('/new-game', async (req, res) => {
    const { game_title, game_maxTeams } = req.body;

    // Validación básica
    if (!game_title || !game_maxTeams) {
        return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    // Generar game_id y establecer valores por defecto
    const game_id = generateGameId();
    const game_status = true;
    const game_dateEnd = null;

    const connection = createConnection();

    connection.connect(error => {
        if (error) {
            console.error('Error al conectar con la base de datos:', error);
            return res.status(500).json({ message: 'Error al conectar con la base de datos' });
        }

        const query = `
            INSERT INTO game (game_id, game_title, game_maxTeams, game_status, game_dateStart, game_dateEnd) 
            VALUES (?, ?, ?, ?, NOW(), ?)
        `;

        connection.query(query, [game_id, game_title, game_maxTeams, game_status, game_dateEnd], (error, results) => {
            if (error) {
                console.error('Error al crear nuevo juego:', error);
                connection.end();
                return res.status(500).json({ message: 'Error al registrar el nuevo juego' });
            }

            res.status(200).json({
                message: 'Juego registrado exitosamente',
                game: {
                    game_id,
                    game_title,
                    game_maxTeams,
                    game_status,
                    game_dateStart: new Date(),
                    game_dateEnd
                }
            });

            connection.end();
        });
    });
});

// Ruta para registrar un nuevo equipo
gameRouter.post('/new-team', async (req, res) => {
    const { team_ownerID, game_id } = req.body;

    // Validación básica
    if (!team_ownerID || !game_id) {
        return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    // Generar team_id y establecer valores por defecto
    const team_id = generateGameId();
    const team_member1ID = null;
    const team_member2ID = null;
    const team_member3ID = null;

    const connection = createConnection();

    connection.connect(error => {
        if (error) {
            console.error('Error al conectar con la base de datos:', error);
            return res.status(500).json({ message: 'Error al conectar con la base de datos' });
        }

        const query = `
            INSERT INTO team (team_id, team_ownerID, game_id, team_member1ID, team_member2ID, team_member3ID) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        connection.query(query, [team_id, team_ownerID, game_id, team_member1ID, team_member2ID, team_member3ID], (error, results) => {
            if (error) {
                console.error('Error al registrar nuevo equipo:', error);
                connection.end();
                return res.status(500).json({ message: 'Error al registrar el nuevo equipo' });
            }

            res.status(200).json({
                message: 'Equipo registrado exitosamente',
                team: {
                    team_id,
                    team_ownerID,
                    game_id,
                    team_member1ID,
                    team_member2ID,
                    team_member3ID
                }
            });

            connection.end();
        });
    });
});

export default gameRouter;

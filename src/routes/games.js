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
    const game_regTeams = 0;

    const connection = createConnection();

    connection.connect(error => {
        if (error) {
            console.error('Error al conectar con la base de datos:', error);
            return res.status(500).json({ message: 'Error al conectar con la base de datos' });
        }

        const query = `
            INSERT INTO game (game_id, game_title, game_maxTeams, game_regTeams, game_status, game_dateStart, game_dateEnd) 
            VALUES (?, ?, ?, ?, ?, NOW(), ?)
        `;

        connection.query(query, [game_id, game_title, game_maxTeams, game_regTeams, game_status, game_dateEnd], (error, results) => {
            if (error) {
                console.error('Error al crear nuevo juego:', error);
                connection.end();
                return res.status(500).json({ message: 'Error al registrar el nuevo juego' });
            }

            res.status(200).json({
                message: 'Juego registrado exitosamente',
                game_id,
                game_title,
                game_maxTeams,
                game_status,
                game_dateStart: new Date(),
                game_dateEnd
            });

            connection.end();
        });
    });
});

// Ruta para finalizar un juego
gameRouter.post('/end-game', async (req, res) => {
    const { game_id } = req.body;

    // Validar que el game_id no esté vacío
    if (!game_id) {
        return res.status(400).json({ message: 'El game_id es requerido' });
    }

    const connection = createConnection();

    connection.connect(error => {
        if (error) {
            console.error('Error al conectar con la base de datos:', error);
            return res.status(500).json({ message: 'Error al conectar con la base de datos' });
        }

        // Verificar si el juego existe
        const checkGameQuery = `SELECT game_status FROM game WHERE game_id = ?`;
        connection.query(checkGameQuery, [game_id], (error, results) => {
            if (error) {
                console.error('Error al verificar el juego:', error);
                connection.end();
                return res.status(500).json({ message: 'Error al verificar el juego' });
            }

            // Si no se encuentra el juego, devolver un mensaje de error
            if (results.length === 0) {
                connection.end();
                return res.status(404).json({ message: `No se encontró el juego con el id: ${game_id}` });
            }

            const { game_status } = results[0];

            // Verificar si el juego ya está finalizado
            if (game_status === "0") {
                connection.end();
                return res.status(400).json({ message: `El juego con el id: ${game_id} ya está finalizado` });
            }

            // Actualizar el estado del juego a finalizado
            const updateGameStatusQuery = `
                UPDATE game 
                SET game_status = false 
                WHERE game_id = ?
            `;

            connection.query(updateGameStatusQuery, [game_id], (error, results) => {
                if (error) {
                    console.error('Error al actualizar el estado del juego:', error);
                    connection.end();
                    return res.status(500).json({ message: 'Error al actualizar el estado del juego' });
                }

                res.status(200).json({ message: `El juego con el id: ${game_id} ha sido finalizado exitosamente` });
                connection.end();
            });
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
    const team_memberChair = null;

    const connection = createConnection();

    connection.connect(error => {
        if (error) {
            console.error('Error al conectar con la base de datos:', error);
            return res.status(500).json({ message: 'Error al conectar con la base de datos' });
        }

        // Verificar si el juego existe
        const checkGameQuery = `SELECT game_maxTeams, game_regTeams, game_status FROM game WHERE game_id = ?`;
        connection.query(checkGameQuery, [game_id], (error, results) => {
            if (error) {
                console.error('Error al verificar el juego:', error);
                connection.end();
                return res.status(500).json({ message: 'Error al verificar el juego' });
            }

            // Si no se encuentra el juego, devolver un mensaje de error
            if (results.length === 0) {
                connection.end();
                return res.status(404).json({ message: `No se encontró el juego con el id: ${game_id}` });
            }

            const { game_maxTeams, game_regTeams, game_status } = results[0];

            // Validacion para saber si el juego ya finalizo
            if (game_status === "0") {
                connection.end();
                return res.status(404).json({ message: `El juego con el id: ${game_id} ya finalizo` });
            }

            // Verificar si hay cupos disponibles
            if (game_regTeams >= game_maxTeams) {
                connection.end();
                return res.status(400).json({ message: 'El juego ya alcanzó el número máximo de equipos registrados' });
            }

            // Si hay cupos, registrar el equipo
            const insertTeamQuery = `
                INSERT INTO team (team_id, team_ownerID, game_id, team_member1ID, team_member2ID, team_member3ID, team_memberChair) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            connection.query(insertTeamQuery, [team_id, team_ownerID, game_id, team_member1ID, team_member2ID, team_member3ID, team_memberChair], (error, results) => {
                if (error) {
                    console.error('Error al registrar nuevo equipo:', error);
                    connection.end();
                    return res.status(500).json({ message: 'Error al registrar el nuevo equipo' });
                }

                // Actualizar el número de equipos registrados en la tabla game
                const updateGameQuery = `
                    UPDATE game 
                    SET game_regTeams = game_regTeams + 1 
                    WHERE game_id = ?
                `;

                connection.query(updateGameQuery, [game_id], (error, results) => {
                    if (error) {
                        console.error('Error al actualizar el número de equipos registrados:', error);
                        connection.end();
                        return res.status(500).json({ message: 'Error al actualizar el número de equipos registrados' });
                    }

                    res.status(200).json({
                        message: 'Equipo registrado exitosamente',
                        team_id,
                        team_ownerID,
                        game_id,
                        team_member1ID,
                        team_member2ID,
                        team_member3ID
                    });

                    connection.end();
                });
            });
        });
    });
});

// Ruta para unirse a un equipo
gameRouter.post('/join-team', async (req, res) => {
    const { team_id, team_memberID } = req.body;

    // Validar que los campos no estén vacíos
    if (!team_id || !team_memberID) {
        return res.status(400).json({ message: 'El team_id y el team_memberID son requeridos' });
    }

    const connection = createConnection();

    connection.connect(error => {
        if (error) {
            console.error('Error al conectar con la base de datos:', error);
            return res.status(500).json({ message: 'Error al conectar con la base de datos' });
        }

        // Verificar si el equipo existe
        const checkTeamQuery = `
            SELECT team_member1ID, team_member2ID, team_member3ID 
            FROM team 
            WHERE team_id = ?
        `;

        connection.query(checkTeamQuery, [team_id], (error, results) => {
            if (error) {
                console.error('Error al verificar el equipo:', error);
                connection.end();
                return res.status(500).json({ message: 'Error al verificar el equipo' });
            }

            // Si no se encuentra el equipo, devolver un mensaje de error
            if (results.length === 0) {
                connection.end();
                return res.status(404).json({ message: `No se encontró el equipo con el id: ${team_id}` });
            }

            const { team_member1ID, team_member2ID, team_member3ID } = results[0];

            // Validar si hay un cupo disponible en el equipo
            let columnToUpdate = null;
            if (!team_member1ID) {
                columnToUpdate = 'team_member1ID';
            } else if (!team_member2ID) {
                columnToUpdate = 'team_member2ID';
            } else if (!team_member3ID) {
                columnToUpdate = 'team_member3ID';
            }

            // Si no hay cupo, devolver un mensaje de error
            if (!columnToUpdate) {
                connection.end();
                return res.status(400).json({ message: 'El equipo ya está lleno' });
            }

            // Actualizar el equipo asignando el miembro al primer campo disponible
            const updateTeamQuery = `
                UPDATE team 
                SET ${columnToUpdate} = ? 
                WHERE team_id = ?
            `;

            connection.query(updateTeamQuery, [team_memberID, team_id], (error, results) => {
                if (error) {
                    console.error('Error al actualizar el equipo:', error);
                    connection.end();
                    return res.status(500).json({ message: 'Error al actualizar el equipo' });
                }

                // Construir la respuesta personalizada
                res.status(200).json({
                    message: 'Miembro registrado exitosamente en el equipo',
                    team_id: team_id,
                    [columnToUpdate]: team_memberID
                });

                connection.end();
            });
        });
    });
});

// Ruta para salir de un equipo
gameRouter.post('/leave-team', async (req, res) => {
    const { team_id, team_memberID } = req.body;

    // Validar que los campos no estén vacíos
    if (!team_id || !team_memberID) {
        return res.status(400).json({ message: 'El team_id y el team_memberID son requeridos' });
    }

    const connection = createConnection();

    connection.connect(error => {
        if (error) {
            console.error('Error al conectar con la base de datos:', error);
            return res.status(500).json({ message: 'Error al conectar con la base de datos' });
        }

        // Verificar si el equipo existe
        const checkTeamQuery = `
            SELECT team_member1ID, team_member2ID, team_member3ID 
            FROM team 
            WHERE team_id = ?
        `;

        connection.query(checkTeamQuery, [team_id], (error, results) => {
            if (error) {
                console.error('Error al verificar el equipo:', error);
                connection.end();
                return res.status(500).json({ message: 'Error al verificar el equipo' });
            }

            // Si no se encuentra el equipo, devolver un mensaje de error
            if (results.length === 0) {
                connection.end();
                return res.status(404).json({ message: `No se encontró el equipo con el id: ${team_id}` });
            }

            const { team_member1ID, team_member2ID, team_member3ID } = results[0];

            // Buscar al miembro en las columnas
            let columnToUpdate = null;
            if (team_member1ID === team_memberID) {
                columnToUpdate = 'team_member1ID';
            } else if (team_member2ID === team_memberID) {
                columnToUpdate = 'team_member2ID';
            } else if (team_member3ID === team_memberID) {
                columnToUpdate = 'team_member3ID';
            }

            // Si el miembro no está en el equipo, devolver un mensaje de error
            if (!columnToUpdate) {
                connection.end();
                return res.status(404).json({ message: 'El miembro no pertenece a este equipo' });
            }

            // Actualizar el equipo eliminando al miembro
            const updateTeamQuery = `
                UPDATE team 
                SET ${columnToUpdate} = NULL 
                WHERE team_id = ?
            `;

            connection.query(updateTeamQuery, [team_id], (error, results) => {
                if (error) {
                    console.error('Error al eliminar al miembro del equipo:', error);
                    connection.end();
                    return res.status(500).json({ message: 'Error al eliminar al miembro del equipo' });
                }

                // Construir la respuesta personalizada
                res.status(200).json({
                    message: 'Miembro eliminado exitosamente del equipo',
                    team_id: team_id,
                    [columnToUpdate]: null
                });

                connection.end();
            });
        });
    });
});

// Ruta para obtener la información de un equipo
gameRouter.post('/info-team', async (req, res) => {
    const { team_id } = req.body;

    // Validar que el team_id no sea vacío
    if (!team_id) {
        return res.status(400).json({ message: 'El team_id es requerido' });
    }

    const connection = createConnection();

    connection.connect(error => {
        if (error) {
            console.error('Error al conectar con la base de datos:', error);
            return res.status(500).json({ message: 'Error al conectar con la base de datos' });
        }

        // Consultar si el equipo existe
        const getTeamQuery = `
            SELECT * 
            FROM team 
            WHERE team_id = ?
        `;

        connection.query(getTeamQuery, [team_id], (error, results) => {
            if (error) {
                console.error('Error al obtener la información del equipo:', error);
                connection.end();
                return res.status(500).json({ message: 'Error al obtener la información del equipo' });
            }

            // Si el equipo no existe, devolver un mensaje de error
            if (results.length === 0) {
                connection.end();
                return res.status(404).json({ message: `No se encontró el equipo con el id: ${team_id}` });
            }

            const { team_ownerID, game_id, team_member1ID, team_member2ID, team_member3ID, team_memberChair } = results[0];

            // Devolver la información del equipo
            res.status(200).json({
                message: 'Información del equipo obtenida exitosamente',
                team_id,
                team_ownerID,
                game_id,
                team_member1ID,
                team_member2ID, 
                team_member3ID,
                team_memberChair
            });

            connection.end();
        });
    });
});

// Ruta para asignar un miembro a team_memberChair
gameRouter.post('/sit-chair', async (req, res) => {
    const { team_id, team_memberID } = req.body;

    // Validar que los campos no estén vacíos
    if (!team_id || !team_memberID) {
        return res.status(400).json({ message: 'El team_id y team_memberID son requeridos' });
    }

    const connection = createConnection();

    connection.connect(error => {
        if (error) {
            console.error('Error al conectar con la base de datos:', error);
            return res.status(500).json({ message: 'Error al conectar con la base de datos' });
        }

        // Validar que el equipo exista
        const getTeamQuery = `
            SELECT * 
            FROM team 
            WHERE team_id = ?
        `;

        connection.query(getTeamQuery, [team_id], (error, results) => {
            if (error) {
                console.error('Error al verificar el equipo:', error);
                connection.end();
                return res.status(500).json({ message: 'Error al verificar el equipo' });
            }

            // Si el equipo no existe, devolver un mensaje de error
            if (results.length === 0) {
                connection.end();
                return res.status(404).json({ message: `No se encontró el equipo con el id: ${team_id}` });
            }

            // Actualizar el campo team_memberChair con el team_memberID
            const updateChairQuery = `
                UPDATE team 
                SET team_memberChair = ? 
                WHERE team_id = ?
            `;

            connection.query(updateChairQuery, [team_memberID, team_id], (error, results) => {
                if (error) {
                    console.error('Error al asignar el miembro a team_memberChair:', error);
                    connection.end();
                    return res.status(500).json({ message: 'Error al asignar el miembro a team_memberChair' });
                }

                // Verificar si se actualizó correctamente
                if (results.affectedRows === 0) {
                    connection.end();
                    return res.status(400).json({ message: 'No se pudo actualizar el campo team_memberChair' });
                }

                // Respuesta exitosa
                res.status(200).json({
                    message: 'Miembro asignado exitosamente a team_memberChair',
                    team_id,
                    team_memberChair: team_memberID
                });

                connection.end();
            });
        });
    });
});




export default gameRouter;

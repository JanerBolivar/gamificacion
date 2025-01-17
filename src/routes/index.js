
import e, { Router } from "express"
import preguntasRouter from "./Preguntas.js"
import gameRouter from "./games.js"

const router = Router()

// Rutas de usuarios
router.use("/preguntas", preguntasRouter)
router.use("/games", gameRouter)


export default router
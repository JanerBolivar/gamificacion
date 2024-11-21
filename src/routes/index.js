
import e, { Router } from "express"
import preguntasRouter from "./Preguntas.js"

const router = Router()

// Rutas de usuarios
router.use("/preguntas", preguntasRouter)


export default router
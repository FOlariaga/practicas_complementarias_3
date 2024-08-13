import { Router } from "express";
import passport from 'passport';
import nodemailer from 'nodemailer';


import config from "../config.js";
import UserController from "../controller/user.controller.js";
import { createToken ,createHash, verifyRequiredBody, isValidPassword } from "../services/utils.js";
import initAuthStrategies from '../auth/passport.strategies.js';

const controller = new UserController()
const router = Router()
initAuthStrategies();

const transport = nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    auth: {
        user: config.GMAIL_APP_USER,
        pass: config.GMAIL_APP_PASS
    }
});

router.get("/", async (req, res) => {
    try {
        const users = await controller.get()

        res.status(200).send({ origin: config.SERVER, payload: users })
    } catch (error) {
        res.status(500).send({ origin: config.SERVER, payload: null })
    }
})

router.get("/:pid", async (req, res) => {
    try {
        const pid = req.params.pid
        const user = await controller.getById(pid)

        res.status(200).send({ origin: config.SERVER, payload: user })
    } catch (error) {
        res.status(500).send({ origin: config.SERVER, payload: null })
    }
})

// router.post("/register", verifyRequiredBody(['firstName', 'lastName', 'email', 'password']), async (req, res) => {
//     try {
//         const { firstName, lastName, email, password } = req.body
//         const user = await usersManager.add({ firstName, lastName, email, password: createHash(password)})

//         console.log(user);
//         console.log(user.exist);
//         if (user.exist) {
//            return  res.status(200).send({ origin: config.SERVER, payload: user.payload });
//         }
//         res.redirect("/login")

//     } catch (error) {
//         res.status(500).send({ origin: config.SERVER, payload: null })
//     }
// })


router.post("/register", verifyRequiredBody(['firstName', 'lastName', 'email', 'password']), passport.authenticate("register",{ failureRedirect: `/register?error=${encodeURI('error para registrar al usuario')}`}), async (req, res) => {
    try {
        res.redirect("/login")
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null })
    }
})


router.put("/:pid", async (req, res) => {
    try {
        const filter = { _id: req.params.pid };
        const update = req.body;
        const options = { new: true };
        const user = await controller.update(filter, update, options);

        res.status(200).send({ origin: config.SERVER, payload: user });
    } catch (error) {
        res.status(500).send({ origin: config.SERVER, payload: null })
    }
})

router.delete("/:uid", async (req, res) => {
    try {
        const uid = { _id: req.params.uid }
        await controller.delete(uid);
        console.log(`usuario eliminado de la base de datos`);

        res.status(200).send({ origin: config.SERVER, payload: "eliminado" });
    } catch (error) {
        res.status(500).send({ origin: config.SERVER, payload: null })
    }
})

router.post("/restore",verifyRequiredBody(['email']), async (req,res) => {
    try {
        const email = req.body.email
        console.log(email);
        
        const exist = await controller.getByEmail(email)
        if (!exist) {return res.status(200).send({ origin: config.SERVER, payload: "el email no coincide con ningun usuario existente"})}

        console.log(`${config.UPLOAD_DIR}/prueba.png`)
        const token = createToken({email: email}, "10m")
        const confirmation = await transport.sendMail({
            from: `CoderStore <${config.GMAIL_APP_USER}>`, // email origen
            to: email,
            subject: 'Cambio de contraseña',
            html: `<h1>Realice un cambio de contraseña en el siguiente link</h1>
                 <a href="http://localhost:8080/restorePassword?access_token=${token}">link del token</a>
                 <p>El link para el cambio de coontraseña expirara en 15 minutos, en caso de no haber solicitado ignore el mensaje.</br>
                 NO COMPARTA EL ENLACE CON NADIE</p>`
            // attachments:[{
            //     filename:"prueba.png",
            //     path: `${config.UPLOAD_DIR}/prueba.png`,
            //     cid: "AYUDARTE Y YAA???"
            // }]
        });
        
        return res.status(200).send({ status: 'OK', data: {message: "ingrese a su mail para continuar con el cambio de contraseña", confirmation}})
    } catch (error) {
        res.status(500).send({ origin: config.SERVER, payload: null })
    }
})

router.post("/restorePassword",verifyRequiredBody(['password', "passwordConfirm", "email"]), async (req,res) =>{
    if (req.body.password != req.body.passwordConfirm){
        return res.status(500).send({ origin: config.SERVER, payload: "la nueva contraseña y la confirmacion de la nueva contraseña son diferentes, procure ingresar 2 veces la misma contraseña" })
    }
    
    const passwordHash = await controller.getByEmail(req.body.email)
    console.log(`passwordHash: ${passwordHash}`);
    

    if (isValidPassword(req.body.password, passwordHash.password)) {
        return res.status(500).send({ origin: config.SERVER, payload: "la nueva contraseña no puede ser igual a su contraseña actual" })
    }

    const filter = {email:req.body.email}
    const update = {password: createHash(req.body.password)}

    await controller.updateOne(filter, update)

    return res.status(200).send({ status: 'OK', data: "se cambio la contraseña correctamente"})
})

export default router
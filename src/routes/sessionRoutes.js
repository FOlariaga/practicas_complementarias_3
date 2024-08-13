import {Router} from "express";
import passport from 'passport';
import nodemailer from 'nodemailer';

import config from "../config.js";
import { authorizationRole, createToken, verifyToken, isValidPassword, verifyRequiredBody } from '../services/utils.js';
import initAuthStrategies from '../auth/passport.strategies.js';
import DTOCurrent from "../services/dto.current.js";
import UsersController from "../controller/user.controller.js";


const usersController = new UsersController;
const router = Router()
initAuthStrategies();

router.post("/login", verifyRequiredBody(["email", "password"]), passport.authenticate("login", { failureRedirect: `/login?error=${encodeURI('Usuario o clave no válidos')}`}), async (req, res) => {
    try {
        req.session.user = req.user;
        req.session.save(err => {
            if (err) {
                return res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
            }
            res.redirect('/profile');
        });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
})



router.get('/ghlogin', passport.authenticate('ghlogin', {scope: ['user']}), async (req, res) => {
});

router.get('/ghlogincallback', passport.authenticate('ghlogin', {failureRedirect: `/login?error=${encodeURI('Error al identificar con Github')}`}), async (req, res) => {
    try {
        req.session.user = req.user 
        req.session.save(err => {
            if (err) return res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
        
            res.redirect('/profile');
        });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});


// router.get("/private" , async (req, res) => {
//     try {
        
//     } catch (error) {
        
//     }
// })

router.get("/logout" , async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) return res.status(500).send({ origin: config.SERVER, payload: 'Error al ejecutar logout', error: err });
            res.redirect('/login')
        })
    } catch (error) {
        
    }
})

router.get("/current", authorizationRole(["admin","user","premium"]), async (req, res) => {
    if(!req.session.user){
        return res.redirect("/login")
    }
    const data = new DTOCurrent(req.session.user)
    res.status(200).send({ origin: config.SERVER, payload: data })
})

router.get("/premium/:id", async (req, res) => {

    const filter = { _id: req.params.id };

    if(req.session.user.role == "admin"){
        return res.status(200).send({ origin: config.SERVER, payload: "usted es admin no deberia cambiar a user o premium"})
    }

    let update = {}
    const options = { new: true }
    req.session.user.role == "user"?  update = {role: "premium"} : update = {role: "user"}
    const user = await usersController.updateOne(filter, update, options)
    req.session.user.role = update.role
    return res.status(200).send({ origin: config.SERVER, payload: `${user.firstName} ${user.lastName} ahora es: ${req.session.user.role}` })

})




//cambiar de lugar
const transport = nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    auth: {
        user: config.GMAIL_APP_USER,
        pass: config.GMAIL_APP_PASS
    }
});

router.get('/mail', async (req, res) => {
    try {
        console.log(`${config.UPLOAD_DIR}/prueba.png`)
        const token = createToken({}, "5m")
        // Utilizando el transporte, podemos enviar a través
        // del SMTP que hayamos configurado, mensajes vía email
        // a los destinatarios que deseemos
        const confirmation = await transport.sendMail({
            from: `fede olariaga <${config.GMAIL_APP_USER}>`, // email origen
            to: 'godoyeli91@gmail.com',
            subject: 'Pruebas de mails',
            html: `<h1>Prueba 07 link con token en query</h1>
                 <a href="http://localhost:8080/api/sessions/pruebaToken?access_token=${token}">link del token</a>`,
            // attachments:[{
            //     filename:"prueba.png",
            //     path: `${config.UPLOAD_DIR}/prueba.png`,
            //     cid: "AYUDARTE Y YAA???"
            // }]
        });
        res.status(200).send({ status: 'OK', data: confirmation });
    } catch (err) {
        res.status(500).send({ status: 'ERR', data: err.message });
    }
});

router.get("/pruebaToken", verifyToken,(req,res) => {
    res.status(200).send({ status: 'OK', data: req.token });
})

export default router
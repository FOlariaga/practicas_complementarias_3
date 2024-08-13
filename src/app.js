import express from "express"
import handlebars from "express-handlebars";
// import mongoose from "mongoose";
import cookieParser from 'cookie-parser';
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from 'passport';
import cors from "cors";

import config from "./config.js"
import initSocket from "./services/sockets.js";
import viewsRoutes from "./routes/viewsRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import cartsRoutes from "./routes/cartsRoutes.js";
import sessionsRoutes from "./routes/sessionRoutes.js";
import MongoSingleton from "./services/mongo.singleton.js";
import errorsHandler from "./services/errors.handler.js";
import addLogger from "./services/logger.js";

const app = express()


const httpServer = app.listen(config.PORT, async () => {
    // await mongoose.connect(config.MONGODB_URI)
    MongoSingleton.getInstance()
    
    const socketServer = initSocket(httpServer)
    app.set("socketServer", socketServer)
    
    app.use(cors({
        origin : "*"
    }))

    app.use(express.json())
    app.use(express.urlencoded({extended: true}))

    app.use(cookieParser(config.SECRET));

    app.use(session({
        store: MongoStore.create({
            mongoUrl: config.MONGODB_URI,
            ttl: 300
        }),
        secret: config.SECRET,
        resave: true,
        saveUninitialized: true
    }))

    app.use(passport.initialize());
    app.use(passport.session());
    
    app.engine('handlebars', handlebars.engine())
    app.set('views', `${config.DIRNAME}/views`)
    app.set('view engine', 'handlebars')
    
    app.use('/static', express.static(`${config.DIRNAME}/public`));
    
    app.use(addLogger)
    app.use("/", viewsRoutes)
    app.use("/api/products", productsRoutes)
    app.use("/api/users", usersRoutes)
    app.use("/api/carts", cartsRoutes)
    app.use("/api/sessions", sessionsRoutes)
    app.use(errorsHandler)
    
    console.log(`app iniciada en el puerto ${config.PORT} con acceso a BD`)
})


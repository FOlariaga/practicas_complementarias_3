import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import config from '../config.js';
import CustomError from './customError.class.js';
import errorsDictionary from './errorsDictionary.js';

export const createHash = password => bcrypt.hashSync(password, bcrypt.genSaltSync(10));

export const isValidPassword = (passwordToVerify, storedHash) => bcrypt.compareSync(passwordToVerify, storedHash);

export const verifyRequiredBody = (requiredFields) => {
    return (req, res, next) => {
        const allOk = requiredFields.every(field => 
            req.body.hasOwnProperty(field) && req.body[field] !== '' && req.body[field] !== null && req.body[field] !== undefined
        );
        
        if (!allOk) {
            req.logger.error(`${errorsDictionary.FEW_PARAMETERS.message} ${new Date().toDateString()} ${req.method} ${req.url}`)
            throw new CustomError(errorsDictionary.FEW_PARAMETERS);
        }
  
      next();
    };
};

export const authorizationRole = (authorized) => {
    return (req, res, next) => {
        let access = false
        if (!req.session.user) {
            return res.redirect("/login")
        }
        const role = req.session.user.role
        // console.log(role);

        authorized.forEach(e => {
            if (e == role) {
                access = true
                return next()
            }
        })

        if (!access) {
            req.logger.error(`${errorsDictionary.UNAUTHORIZED_ERROR.message} ${new Date().toDateString()} ${req.method} ${req.url}`)
            throw new CustomError(errorsDictionary.UNAUTHORIZED_ERROR)
        }

        next()
    }
}

export const createToken = (payload, duration) => jwt.sign(payload, config.SECRET, { expiresIn: duration });

export const verifyToken = (req, res, next) => {
    const headerToken = req.headers.authorization ? req.headers.authorization.split(' ')[1]: undefined;
    const cookieToken = req.cookies && req.cookies[`${config.APP_NAME}_cookie`] ? req.cookies[`${config.APP_NAME}_cookie`]: undefined;
    const queryToken = req.query.access_token ? req.query.access_token: undefined;
    const receivedToken = headerToken || cookieToken || queryToken;

    if (!receivedToken) return res.status(401).send({ origin: config.SERVER, payload: 'Se requiere token' });

    jwt.verify(receivedToken, config.SECRET, (err, payload) => {
        if (err) return res.status(403).send({ origin: config.SERVER, payload: 'Token no válido' });
        req.token = payload;
        next();
    });
}
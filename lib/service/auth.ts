import global from './global'
import jwt from 'jsonwebtoken'

export function generateJWT() {
    const SECRET = global.get('SECRET')
    return jwt.sign({ version: '1' }, SECRET);
}

export function verifyJWT(token) {
    const SECRET = global.get('SECRET')
    return jwt.verify(token, SECRET)
}
const jwt = require('jsonwebtoken')
const secret = "SuperSecret"

function generateAuthToken(userId, isAdmin) {
    const payload = { 
        sub: userId,
        isAdmin: isAdmin
     }
    return jwt.sign(payload, secret, { expiresIn: '24h' })
}
exports.generateAuthToken = generateAuthToken

function requireAuthentication(req, res, next) {
    const authHeader = req.get('Authorization') || ''
    const authParts = authHeader.split(' ')
    const token = authParts[0] === 'Bearer' ? authParts[1] : null
    try {
        const payload = jwt.verify(token, secret)
        req.user = payload.sub
        next()
    } catch (err) {
        res.status(401).send({
            err: "Invalid authentication token"
        })
    }
}
exports.requireAuthentication = requireAuthentication
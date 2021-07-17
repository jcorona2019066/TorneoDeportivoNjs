"use strict"

var jwt = require("jwt-simple");
var moment = require("moment");
var secret = "IN6AV";

exports.createToken = function(usuario){
    var payload = {
        sub: usuario._id,
        nombre: usuario.nombres,
        apellidos: usuario.apellidos,
        username: usuario.usuario,
        email: usuario.email,
        rol: usuario.rol,
        imagen: usuario.imagen,
        iat: moment().unix(),
        exp: moment().day(10, "days").unix()
    }

    return jwt.encode(payload, secret);    
}
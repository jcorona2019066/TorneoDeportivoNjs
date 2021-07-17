"use strict"

var jwt = require("jwt-simple");
var moment = require("moment");
var secret = "IN6AV";

exports.ensureAuth = function(req, res , next ){
    if(!req.headers.authorization){
        return res.status(404).send({mensaje:"La petición no tiene Autentificación"});
    }
   var token = req.headers.authorization.replace(/['"]+/g,'')
    try {
        var payload = jwt.decode(token, secret);
        if(payload.exp <= moment.unix()){
            return res.status(401).send({
                mensaje:"EL TOKEN YA ESPIRO"
            });
        }
    } catch (error) {
        return res.status(404).send({
            mensaje: "EL TOKEN NO ES VALIDO"
        })
    }
    req.user = payload;
    next();
}
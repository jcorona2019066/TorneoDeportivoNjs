'use strict'

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UsuarioShema = Schema({
    nombres: String,
    apellidos: String,
    usuario: String,
    email: String,
    password: String,
    rol: String,
    imagen: String,

})

module.exports = mongoose.model("usuario", UsuarioShema);
'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var JornadaShema = Schema({
    nombre: String,
    liga : {type:Schema.Types.ObjectId, ref: "liga"},
    partido:[{
        equipo1:{ type:Schema.Types.ObjectId, ref: "equipo"},
        equipo2: {type:Schema.Types.ObjectId, ref: "equipo"},
        marcador1: Number,
        marcador2: Number
    }]

})
module.exports = mongoose.model("jornada", JornadaShema)
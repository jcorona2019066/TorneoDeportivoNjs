'use strict'

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var EquipoShema = Schema({
    nombres: String,
    golesAfavor: Number,
    golesEncontra: Number,
    diferenciaGoles: Number,
    partidosJugados: Number,
    pts: Number,
    imagen: String,
    usuario: { type:Schema.Types.ObjectId, ref: "usuario"},
    liga: {type: Schema.Types.ObjectId, ref: "liga"}
})

module.exports = mongoose.model("equipo", EquipoShema);
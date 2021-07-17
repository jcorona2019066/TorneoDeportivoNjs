'use strict'

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var LigaShema = Schema({
    nombres: String,
    imagen: String,
    usuario: { type:Schema.Types.ObjectId, ref: "usuario"},
})

module.exports = mongoose.model("liga", LigaShema);

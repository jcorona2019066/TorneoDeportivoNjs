'use strict'

var express = require("express");
var jornadaontrolador = require("../controladores/jornada.controlador");
var md_autorizacion = require("../middlewares/authenticated");

var api = express.Router();



api.post("/ingresarJornada/:idLiga", md_autorizacion.ensureAuth, jornadaontrolador.ingresarJornada);



module.exports = api;
'use strict'


const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");

var usuario_ruta = require("./src/rutas/usuario.ruta");
var equipo_ruta = require("./src/rutas/equipo.ruta")
var liga_ruta = require("./src/rutas/liga.ruta")
var jornada_ruta = require("./src/rutas/jornada.ruta")

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(cors());

app.use('/api', usuario_ruta,equipo_ruta,liga_ruta,jornada_ruta);


module.exports = app
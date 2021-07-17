'use strict'

var express = require("express");
var ligaControlador = require("../controladores/liga.controlador");
var md_autorizacion = require("../middlewares/authenticated");
var multiparty = require('connect-multiparty');
var md_subirImagen = multiparty({uploadDir: './src/imagenes/ligas'});

var api = express.Router();

api.post("/Liga", md_autorizacion.ensureAuth, ligaControlador.CrearLiga);
api.put('/EditarLiga/:id', md_autorizacion.ensureAuth, ligaControlador.EditarLiga);
api.delete('/EliminarLiga/:id', md_autorizacion.ensureAuth, ligaControlador.EliminarLiga);
api.get('/ObtenerLigas',md_autorizacion.ensureAuth, ligaControlador.ObterLigas);
api.get('/ligaId/:idLiga', md_autorizacion.ensureAuth ,ligaControlador.ligaId);
api.post('/subirImagenLiga/:idLiga', [md_autorizacion.ensureAuth, md_subirImagen], ligaControlador.subirImagen);
api.get('/obtenerImagenLiga/:imagen', ligaControlador.obtenerImagen);

module.exports = api;

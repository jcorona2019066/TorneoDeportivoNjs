'use strict'

var express = require("express");
var usuarioControlador = require("../controladores/usuario.controlador");
var md_autorizacion = require("../middlewares/authenticated");
var multiparty = require('connect-multiparty');
var md_subirImagen = multiparty({ uploadDir: './src/imagenes/usuarios'});

var api = express.Router();

api.post("/login", usuarioControlador.Login);
api.post('/NuevoAdmin',md_autorizacion.ensureAuth,usuarioControlador.NuevoAdmin);
api.post('/registrar', usuarioControlador.Registrar);
api.put('/EditarUser/:id', md_autorizacion.ensureAuth, usuarioControlador.EditarUser);
api.delete('/EliminarUser/:id', md_autorizacion.ensureAuth, usuarioControlador.EliminarUser);
api.get('/AllUser', md_autorizacion.ensureAuth,usuarioControlador.ObtenerUser);
api.get('/UserID/:id', md_autorizacion.ensureAuth,usuarioControlador.obtenerUsuarioID);
api.post('/subirImagen', [ md_autorizacion.ensureAuth, md_subirImagen ], usuarioControlador.SubirImagen);
api.get('/obtenerImagen/:imagen', usuarioControlador.obtenerImagen);



module.exports = api;

'use strict'

var User = require('../modelos/usuario.model');
var Liga = require('../modelos/liga.model');
var equipo = require('../modelos/equipos.model');
var fs = require('fs');
var path = require('path')


//  Registrar una liga
function CrearLiga(req, res) {
    let idUser = req.user.sub;
    let liga = new Liga();
    let params = req.body;

    //Validar datos ingresados
    if (params.nombres && idUser) {

        //Buscar el id del usuario que hace la peticion (No se para que)
        User.findOne({ _id: idUser }, (err, userFound) => {
            if (err) {
                return res.status(500).send({ message: "Error general" });
            } else if (userFound) {

                //Ver si el nombre de la liga existe
                Liga.find(
                    { nombres: params.nombres, usuario: idUser }
                ).exec((err, ligaEncontrada) => {
                    if (err) return res.status(500).send({ mensaje: "Error" });
                    if (ligaEncontrada && ligaEncontrada.length >= 1) {
                        return res.status(500).send({ mensaje: "La liga ya existe" });
                    }

                    //Inyectar datos
                    liga.nombres = params.nombres;
                    liga.usuario = idUser;
                    liga.imagen = null;

                    //Guardar las datos
                    liga.save((err, ligaGuardada) => {
                        if (err) {
                            return res.status(500).send({ message: "Error general" });
                        } else if (ligaGuardada) {
                            return res.status(200).send({
                                ligaGuardada
                            });
                        } else {
                            return res.status(500).send({
                                message: "Error al guardar la liga",
                            });
                        }
                    });
                })
            } else {
                return res.status(500).send({ message: "No existe el usuario" });
            }
        });
    } else {
        return res.status(500).send({ message: "Error" });
    }
}


//  Editar un liga
function EditarLiga(req, res) {
    let LigaId = req.params.id;
    let params = req.body;

    //Validar parametros ingresados
    if (!params.nombres) {
        return res.status(500).send({ mensaje: "Paremetros incorrectos o incomplentos" })
    }

    //Busqueda para ver si el nombre ya existe
    Liga.find({
        nombres: params.nombres, usuario: req.user.sub
    }).exec((err, LigaEncontrada) => {
        if (err) return res.status(500).send({ mensaje: "Error" });
        if (LigaEncontrada.length >= 1) {
            return res.status(500).send({ mensaje: "La liga ya existe" })
        } else {

            //Busqueda para ver si la liga que se desea editar existe
            Liga.findOne({ _id: LigaId }).exec((err, ligaEncontrada) => {
                if (err) return res.status(500).send({ mensaje: "Error" });
                if (ligaEncontrada.length === 0) return res.status(500).send({ mensaje: "La liga que quiere editar no existe" });
                var idUsuario = ligaEncontrada.usuario;

                //Validar rol
                if (req.user.sub != idUsuario && req.user.rol != 'ROL_ADMINAPP') {
                    return res.status(500).send({ mensaje: "Esta liga no te pertenece" })
                }

                //Eliminar parametro del usuario
                delete params.usuario;

                //Editar la liga
                Liga.findByIdAndUpdate(LigaId, params, { new: true }, (err, ligaActualizada) => {
                    if (err) return res.status(500).send({ mensaje: "Error en la solicitud" });
                    if (!ligaActualizada) return res.status(500).send({ mensaje: "No se ha podido editar la Liga" });
                    if (ligaActualizada) return res.status(200).send({ mensage: 'Liga actualizada correctamente' })
                })
            })
        }
    })
}


//  Eliminar una liga
function EliminarLiga(req, res) {
    var params = req.body;
    let LigaId = req.params.id
    var idUsuario;

    //Eliminar el parametro de usuario
    delete params.usuario;

    //Buscar si la liga existe
    Liga.findOne({ _id: LigaId }).exec((err, ligaEncontrada) => {
        if (err) return res.status(500).send({ mensaje: "Error" });
        if (!ligaEncontrada) return res.status(500).send({ mensaje: "La liga no existe" })
        idUsuario = ligaEncontrada.usuario;

        //Validar usuario
        if (req.user.sub != idUsuario) {
            return res.status(500).send({ mensaje: "Este equipo no te pertenece" })
        }

        //Eliminar equipos de la liga
        equipo.deleteMany({ liga: LigaId }, { multi: true }, (err, equipoEliminado) => {
            if (err) return res.status(500).send({ mensaje: 'Error al eliminar Equipos' });
            if (!equipoEliminado) return res.status(500).send({ mensaje: "No hay equipos a eliminar" })

            //Eliminar la liga
            Liga.findByIdAndDelete(LigaId, (err, ligaEliminada) => {
                if (err) return res.status(500).send({ mensaje: "Error en la solicitud" });
                if (!ligaEliminada) return res.status(500).send({ mensaje: "No se ha podido eliminar la liga" });
                if (ligaEliminada) return res.status(200).send({ mensaje: "Elimando desde la base de datos correctamente" });
            })
        })
    })
}


//  Ver las ligas
function ObterLigas(req, res) {
    var idUsuario = req.user.sub;

    if (req.user.rol === 'ROL_ADMINAPP') {

        Liga.find().exec((err, ligaEncontrada) => {

            User.populate(ligaEncontrada, { path: "usuario" }, ((err, ligaEncontrada) => {
                if (err) return res.status(500).send({ mensaje: "Error en la petición de Ligas" });
                if (ligaEncontrada.length === 0) return res.status(500).send({ mensaje: 'No existen las ligas' });
                return res.status(200).send({ ligaEncontrada })
            }))
        })
    } else {

        //Busqueda de las ligas que le pertence al usuario
        Liga.find({ usuario: idUsuario }).exec((err, ligaEncontrada) => {
            if (err) return res.status(500).send({ mensaje: "Error en la petición de Ligas" });
            if (ligaEncontrada.length === 0) return res.status(500).send({ mensaje: 'No existen las ligas' });
            return res.status(200).send({ ligaEncontrada })
        })
    }

}


//  Buscar liga por id
function ligaId(req, res) {
    var idLiga = req.params.idLiga;
    var idUsuario = req.user.sub;
    var usuarioCorrecto;

    //Hacer la busqueda
    Liga.findById(idLiga, (err, ligaEncontrada) => {
        if (err) return res.status(500).send({ mensaje: "Error en la solicitud" });
        if (!ligaEncontrada) return res.status(500).send({ mensaje: "La liga no existe" });
        usuarioCorrecto = ligaEncontrada.usuario;

        // Un if para ver si la liga le pertenece
        if (idUsuario != usuarioCorrecto && req.user.rol != 'ROL_ADMINAPP') {
            return res.status(500).send({ mensaje: "Esta liga no le pertenece" });
        }

        return res.status(200).send({ ligaEncontrada });
    })
}


// Eliminar archivo no apto para imagen
function eliminarArchivo(res, rutaArchivo, mensaje) {

    //Elimina el archivo no apto 
    fs.unlink(rutaArchivo, (err) => {
        return res.status(500).send({ mensaje: mensaje })
    })
}


//  Subir imagen del equipo
function subirImagen(req, res) {
    var idLiga = req.params.idLiga

    //Busqueda para ver si el equipo existe
    Liga.findOne({ _id: idLiga }).exec((err, ligaEncontrada) => {
        if (err) return res.status(500).send({ mensaje: "Error" });
        if (!ligaEncontrada) return res.status(500).send({ mensaje: "La liga no existe" })
        var idUsuario = ligaEncontrada.usuario;

        //Validar dueño del equipo
        if (req.user.sub != idUsuario) {
            return res.status(500).send({ mensaje: "Este equipo no te pertenece" })
        }

        //Validar que se haya subido un archivo
        if (req.files) {

            //En esta variable se guardara la ruta de la imagen
            var direccionArchivo = req.files.imagen.path;

            //Se elimina las diagonales invertidas de la ruta
            var direccion_split = direccionArchivo.split('\\');

            //En esta variable se guarda el nombre del archivo
            var nombre_archivo = direccion_split[3];

            //En esta variable se separa el nombre del archivo de su extension  
            var extension_archivo = nombre_archivo.split('.');

            //Se guarda el nombre de la extension
            var nombre_extension = extension_archivo[1].toLowerCase();

            //Se valida que la extasion del archivo sea correcta
            if (nombre_extension === 'png' || nombre_extension === 'jpg' || nombre_extension === 'gif') {

                //Se sube la imagen del equipo
                Liga.findByIdAndUpdate(idLiga, { imagen: nombre_archivo }, { new: true }, (err, ligaEditada) => {
                    return res.status(200).send({ ligaEditada });
                })
            } else {

                //Se elimina el archivo subido no permitido
                return eliminarArchivo(res, direccionArchivo, 'Tipo de imagen no permitida');
            }
        } else {
            return res.status(500).send({ mensaje: "No se ha subido ningun archivo" })
        }
    })
}


//  Obtener la imagen
function obtenerImagen(req, res) {
    var nombreImagen = req.params.imagen;
    var rutaArchivo = `./src/imagenes/ligas/${nombreImagen}`;

    //Funcion para obtener la imagen en archivo
    fs.access(rutaArchivo, ((err) => {
        if (err) {
            return res.status(500).send({ mensaje: "No existe la imagen" });
        } else {
            return res.sendFile(path.resolve(rutaArchivo));
        }
    }))
}

module.exports = {
    CrearLiga,
    EditarLiga,
    EliminarLiga,
    ObterLigas,
    ligaId,
    subirImagen,
    obtenerImagen
}

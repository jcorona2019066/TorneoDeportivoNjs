'use strict'

var User = require('../modelos/usuario.model');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var fs = require('fs');
var path = require('path');

function ADMIN(req, res) {
    //se crea el administrador predeterminado de la aplicación
    User.findOne({ usuario: "ADMIN" }, (err, buscandoAdmin) => {
        if (err) {
            console.log("Error al verificar ADMIN");
        } else if (buscandoAdmin) {
            console.log("El usuario ADMIN ya existe");
        } else {
            let User1 = new User();
            bcrypt.hash("deportes123", null, null, (err, passwordEncripado) => {
                if (err) {
                    console.log("Error al encriptar la contraseña");
                } else if (passwordEncripado) {
                    User1.usuario = "ADMIN";
                    User1.email = "admin@gmail.com"
                    User1.password = passwordEncripado;
                    User1.rol = "ROL_ADMINAPP";
                    User1.imagen = null;
                    User1.save((err, usuarioGuardado) => {
                        if (err) {
                            console.log("Error al crear el ADMIN");
                        } else if (usuarioGuardado) {
                            console.log("Usuario ADMIN creado exitosamente");
                        } else {
                            console.log("No se a podido crear el usuario ADMIN");
                        }
                    })
                } else {
                    console.log("No se encriptó correctamente la contraseña");
                }
            })
        }
    })
}

function Login(req, res) {
    //aqui los usuario prodran verificar sus credenciales para loguearse 
    let params = req.body;
    if (params.usuario && params.password) {
        User.findOne({ usuario: params.usuario }, (err, userEncontrado) => {
            if (err) return res.status(500).send({ mensaje: "Error al intentar llamar las credenciales" });
            if (userEncontrado) {
                bcrypt.compare(params.password, userEncontrado.password, (err, passwordVerificado) => {
                    if (passwordVerificado) {
                        if (params.getToken === 'true') {
                            return res.status(200).send({
                                token: jwt.createToken(userEncontrado)
                            })
                        } else {
                            userEncontrado.password = undefined;
                            return res.status(200).send({ userEncontrado });
                        }
                    } else {
                        return res.status(500).send({ mensaje: "Usuario o Email incorrectas prueve otro vez" });
                    }
                })
            } else {
                return res.status(500).send({ mensaje: "El usuario no esta registrado" });
            }
        })
    }else{
        return res.status(500).send({ mensaje: "Ingrese todos los datos"})
    }
}

function NuevoAdmin(req, res) {
    //aqui una administrador podra crear otro administrador con sus mismas finciones
    let User2 = new User();
    let params = req.body;
    console.log(req.user)
    //se verifica si el es de rol administrador para que pueda crear otro administrador
    if (req.user.rol != 'ROL_ADMINAPP') {
        return res.status(500).send({ mensaje: "No puede crear un ADMIN" })
    }
    if (params.usuario && params.password) {
        User2.usuario = params.usuario;
        User2.rol = "ROL_ADMINAPP"
        User2.imagen = null;
        User.find(
            { usuario: User2.usuario }
        ).exec((err, userEncontrados) => {
            //hara una busque de los administradores y verificara si no habrá alguno con las mismas credenciales
            if (err) return res.status(500).send({ mensaje: "Error al intentar llamar a los Administradores" });
            if (userEncontrados && userEncontrados.length >= 1) {
                return res.status(500).send({ mensaje: "Utilize otro nombre de ADMIN, el que ha ingresado ya existe" });
            } else {
                //escriptara la contraseña para seguridad
                bcrypt.hash(params.password, null, null, (err, passwordEncriptada) => {
                    User2.password = passwordEncriptada;
                    //aqui guardara el nuevo administrador con los datos solicitados previamente 
                    User2.save((err, userGuardado) => {
                        if (err) return res.status(500).send({ mensaje: "Error al ingresar un nuevo ADMIN" });
                        if (userGuardado) {
                            res.status(200).send("Bienvenido se ha registrado exitosamente")
                        } else {
                            res.status(404).send({ mensaje: "No se ha creado con exito el ADMIN" })
                        }
                    })
                })
            }
        })
    }

}

function Registrar(req, res) {
    let User1 = new User();
    let params = req.body;

    if (params.nombres && params.email && params.password && params.apellidos && params.usuario) {
        User1.nombres = params.nombres;
        User1.apellidos = params.apellidos;
        User1.usuario = params.usuario;
        User1.email = params.email;
        User1.rol = "ROL_USER"
        User1.imagen = null;
        User.find({
            $or: [{ usuario: User1.usuario }, { email: User1.email },]
        }).exec((err, userEncontrados) => {
            if (err) return res.status(500).send({ mensaje: "Error al intentar llamar a los Usuarios" });
            if (userEncontrados && userEncontrados.length >= 1) {
                return res.status(500).send({ mensaje: "Utilize otro Usuario, el que ha ingresado ya existe" });
            } else {
                bcrypt.hash(params.password, null, null, (err, passwordEncriptada) => {
                    User1.password = passwordEncriptada;
                    User1.save((err, userGuardado) => {
                        if (err) return res.status(500).send({ mensaje: "Error al ingresar un nuevo Usuari" });
                        if (userGuardado) {
                            res.status(200).send({ userGuardado })
                        } else {
                            res.status(404).send({ mensaje: "No se ha creado con exito el usuario" })
                        }
                    })
                })
            }
        })
    }else{
        return res.status(500).send({ mensaje: "Ingrese todos los datos"})
    }
}

function EditarUser(req, res) {
    let UserId = req.params.id;
    let params = req.body;
    delete params.password;
    if (req.user.sub != UserId) {
        if (req.user.rol != 'ROL_ADMINAPP') { return res.status(500).send({ mensaje: "No posee los permisos para editar el usuario" }) }
    }
    User.find({
        nombres: params.nombres,
        apellidos: params.apellidos,
        usuario: params.usuario,
        email: params.email,
    }).exec((err, UserEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error en la solicitud de Usuario" });
        if (UserEncontrado.length >= 1 && !params.rol) {
            return res.status(500).send({ mensaje: "Lo que desea modificar ya lo ha estado" })
        } else {
            User.findOne({ _id: UserId }).exec((err, userEncontrado) => {
                if (err) return res.status(500).send({ mensaje: "Error en la solicitud ID de Usuario" });
                if (!userEncontrado) return res.status(500).send({ mensaje: "No se ha encotrado estos datos en la base de datos" });
                User.findByIdAndUpdate(UserId, params, { new: true }, (err, userActualizado) => {
                    if (err) return res.status(500).send({ mensaje: "Error en la solicitud" });
                    if (!userActualizado) return res.status(500).send({ mensaje: "No se ha podido editar exitosamente el usuario" });
                    if (userActualizado) return res.status(200).send({ userActualizado })
                })
            })
        }
    })
}

function EliminarUser(req, res) {
    let UserId = req.params.id

    
    User.findOne({ _id: UserId }).exec((err, userEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error en la solicitud" });
        if (!userEncontrado) return res.status(500).send({ mensaje: "No se han encontrado los datos" })
        User.findByIdAndDelete(UserId, (err, userEliminado) => {
            if (err) return res.status(500).send({ mensaje: "Error en la solicitud" });
            if (!userEliminado) return res.status(500).send({ mensaje: "No se ha podido eliminar el usuario" });
            if (userEliminado) return res.status(200).send({userEliminado})
        })
    })
}

function ObtenerUser(req, res) {
    if (req.user.rol != 'ROL_ADMINAPP') {
        return res.status(500).send({ mensaje: "No ver los usuarios" })
    }
    User.find({}).exec((err, allUser) => {
        return res.status(200).send({ allUser })
    })
}

function obtenerUsuarioID(req, res) {
    var usuarioId = req.params.id;

    User.findById(usuarioId, (err, usuarioEncontrado) => {
        if (err) return res.status(500).send({ mensaje: 'Error en la peticion de Usuario' });
        if (!usuarioEncontrado) return res.status(500).send({ mensaje: 'Error al obtener el Usuario.' });
        return res.status(200).send({ usuarioEncontrado });
    })
}

function EliminarArchivo(res, rutaArchivo, mensaje) {
    fs.unlink(rutaArchivo, (err)=>{
        return res.status(500).send({ mensaje: mensaje})
    })
}

function SubirImagen(req, res) {
    let UserId = req.user.sub;
    if (req.files) {
        var direccionArchivo = req.files.imagen.path;

        // documentos/imagenes/foto.png  →  ['documentos', 'imagenes', 'foto.png'] recorta la ruta o texto
        var direccion_split = direccionArchivo.split('\\')

        // src\imagenes\usuarios\nombre_imagen.png ← Nombre del archivo
        var nombre_archivo = direccion_split[3];

        //obtener la extención de archivo = .png || .jpg || .gif
        var extension_archivo = nombre_archivo.split('.');

        //obtener el nombre de esa extensión 
        var nombre_extension = extension_archivo[1].toLowerCase();
        //aqui solo guardara los archivos con estas extenciones 
        if(nombre_extension === 'png' || nombre_extension === 'jpg' || nombre_extension === 'gif'){
            User.findByIdAndUpdate(UserId, { imagen:  nombre_archivo}, {new: true} ,(err, usuarioEncontrado)=>{
                return res.status(200).send({usuarioEncontrado});
            })
        }else{return eliminarArchivo(res, direccionArchivo, 'Extension, no permitida');
        }
    }
}


function obtenerImagen(req, res) {
    var nombreImagen = req.params.imagen;
    // se buscara el archivo con su nombre desde la ruta
    var rutaArchivo = `./src/imagenes/usuarios/${nombreImagen}`;
    fs.access(rutaArchivo, (err)=>{
        if (err) {
            return res.status(500).send({ mensaje: 'No existe esta la imagen' });
        }else{
            return res.sendFile(path.resolve(rutaArchivo));
        }
    })
}



module.exports = {
    ADMIN,
    Login,
    NuevoAdmin,
    Registrar,
    EditarUser,
    EliminarUser,
    ObtenerUser,
    obtenerUsuarioID,
    EliminarArchivo,
    SubirImagen,
    obtenerImagen
}

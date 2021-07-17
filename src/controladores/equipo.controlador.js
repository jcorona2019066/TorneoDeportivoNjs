"use strict";

var User = require("../modelos/usuario.model");
var Equipo = require("../modelos/equipos.model");
var liga = require("../modelos/liga.model");
var fs = require('fs');
var path = require('path');
const PDFDocument = require("pdfkit");


//  Buscar un equipo por su id
function BuscarEquipo(req, res) {

    var idEquipo = req.params.id
    //Se busca el equipo por su id
    Equipo.findOne({ _id: idEquipo }).exec((err, equipoEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error en la solicitud" });
        if (!equipoEncontrado)
            return res.status(500).send({ mensaje: "El equipo no existe", });
        if (equipoEncontrado) return res.status(200).send({ equipoEncontrado });
    });
}


//  Registrar un equipo
function CrearEquipo(req, res) {
    var idUser = req.user.sub;
    var equipo = new Equipo();
    var params = req.body;
    var idLiga = req.params.idLiga;

    //Se revisa parametros correctos
    if (params.nombres) {

        //Se busca al usuario si existe
        User.findOne({ _id: idUser }, (err, userFound) => {
            if (err) {
                return res.status(500).send({ ok: false, message: "Error general" });
            } else if (userFound) {

                //Busqueda para ver si el equipo ya existe
                Equipo.findOne({ nombres: params.nombres, liga: idLiga }).exec((err, equipoEncontrado) => {
                    if (err) { return res.status(500).send({ mensaje: "Error 1" }) }

                    if (equipoEncontrado) {
                        return res.status(500).send({ mensaje: "El equipo ya existe" })
                    } else {

                        //Busqueda para ver si la liga existe
                        liga.findOne({ _id: idLiga }).exec((err, ligaEncontrada) => {
                            if (err) return res.status(500).send({ mensaje: "Error 2" });
                            if (!ligaEncontrada) return res.status(500).send({ mensaje: "La liga no existe" });

                            //Validar que ni hayan mas de 10 equipos en la liga
                            Equipo.find({ liga: idLiga }).exec((err, equipoEncontrado) => {
                                if (err) return res.status(500).send({ mensaje: "Error 3" });
                                if (equipoEncontrado && equipoEncontrado.length >= 10) {
                                    return res.status(500).send({ mensaje: "Solo puede haber 10 equipos por liga" })
                                } else {

                                    //Ingresar parametros
                                    equipo.nombres = params.nombres;
                                    equipo.usuario = idUser;
                                    equipo.liga = idLiga;
                                    equipo.golesAfavor = 0;
                                    equipo.golesEncontra = 0;
                                    equipo.diferenciaGoles = 0;
                                    equipo.partidosJugados = 0;
                                    equipo.pts = 0;
                                    equipo.imagen = null;

                                    //Guaradar los datos ingresados
                                    equipo.save((err, teamSaved) => {
                                        if (err) {
                                            return res.status(500).send({ ok: false, message: "Error general" });
                                        } else if
                                            (teamSaved) {
                                            return res.status(200).send({ teamSaved });
                                        }
                                    });
                                }
                            })
                        })
                    }
                })
            } else {
                return res.status(500).send({ message: "No existe el usuario" });
            }
        });

    } else {
        return res.status(500).send({ message: "Ingrese los parametros necesarios" });
    }
}


//  Buscar equipos por liga
function equiposLiga(req, res) {
    var params = req.body;
    var idLiga = req.params.idLiga;

    //Busqueda para revisar si existe la liga
    liga.findOne({ _id: idLiga }).exec((err, ligaEncontrada) => {
        if (err) return res.status(500).send({ mensaje: "Error" });
        if (!ligaEncontrada) return res.status(500).send({ mensaje: "La liga no existe" });

        //Busqueda a los equipos por su liga
        Equipo.find({ liga: idLiga }).exec((err, equipoEncontrado) => {
            if (err) return res.status(500).send({ mensaje: "Error" });
            if (equipoEncontrado.length === 0) return res.status(500).send({ mensaje: "Esta liga no tiene equipos" })
            return res.status(200).send({ equipoEncontrado })
        })
    })
}


//  Editar un equipo
function editarEquipo(req, res) {
    var params = req.body;
    var idEquipo = req.params.idEquipo;
    var idUsuario;
    var nombreAntiguo;
    var ligaAntigua;

    //Verificar si el equipo existe
    Equipo.findOne({ _id: idEquipo }).exec((err, equipoEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error 1" });
        if (!equipoEncontrado) return res.status(500).send({ mensaje: "El equipo no existe" })
        idUsuario = equipoEncontrado.usuario;
        nombreAntiguo = equipoEncontrado.nombres;
        ligaAntigua = equipoEncontrado.liga;

        //Validar rol
        if (req.user.sub != idUsuario) {
            return res.status(500).send({ mensaje: "Este equipo no te pertenece" })
        }

        //Validar parametros correctos para editar
        if (!params.nombres && !params.liga) {
            return res.status(500).send({ mensaje: "No hay ningun parametro correcto para editar" })
        }

        //Eliminar el parametro de usuario
        delete params.usuario;

        //Validar si lo que desea editar es el nombre
        if (nombreAntiguo != params.nombres) {

            //Verificar que el nuevo nombre no exista
            Equipo.findOne(
                { nombres: params.nombres, liga: ligaAntigua/*, usuario: req.user.sub */ },
            ).exec((err, encontrados) => {
                console.log(encontrados, params.nombres, nombreAntiguo, ligaAntigua)
                if (err) return res.status(500).send({ mensaje: "Error en la peticion" });
                if (encontrados) {
                    return res.status(500).send({ mensaje: "El equipo ya existe" })
                } else {
                    Equipo.findByIdAndUpdate(idEquipo, params, { new: true }, (err, equipoActualizado) => {
                        if (err) return res.status(500).send({ mensaje: "Error al actualizar" });
                        if (!equipoActualizado) return res.status(500).send({ mensaje: "No se ha podido editar el equipo" })
                        return res.status(200).send({ equipoActualizado })
                    })
                }
            })
        } else {
            Equipo.findByIdAndUpdate(idEquipo, params, { new: true }, (err, equipoActualizado) => {
                if (err) return res.status(500).send({ mensaje: "Error al actualizar" });
                if (!equipoActualizado) return res.status(500).send({ mensaje: "No se ha podido editar el equipo" })
                return res.status(200).send({ equipoActualizado })
            })
        }

        //Verificar que no hayan mas de 10 equipos en la liga
        //Editar equipo


    })

}


//  Eliminar un equipo
function eliminarEquipo(req, res) {
    var idEquipo = req.params.idEquipo;
    var idUsuario;

    //Validar que el equipo exista
    Equipo.findOne({ _id: idEquipo }).exec((err, equipoEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error" });
        if (!equipoEncontrado) return res.status(500).send({ mensaje: "El equipo no existe" })
        idUsuario = equipoEncontrado.usuario;

        //Validar usuario
        if (req.user.sub != idUsuario) {
            return res.status(500).send({ mensaje: "Este equipo no te pertenece" })
        }

        //Eliminar el equipo
        Equipo.findByIdAndDelete(idEquipo, (err, equipoEliminado) => {
            if (err) return res.status(500).send({ mensaje: "Error" });
            if (!equipoEliminado) return res.status(500).send({ mensaje: "No se ha podido eliminar el equipo" });
            return res.status(200).send({ equipoEliminado })
        })
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
    var idEquipo = req.params.idEquipo

    //Busqueda para ver si el equipo existe
    Equipo.findOne({ _id: idEquipo }).exec((err, equipoEncontrado) => {
        if (err) return res.status(500).send({ mensaje: "Error" });
        if (!equipoEncontrado) return res.status(500).send({ mensaje: "El equipo no existe" })
        var idUsuario = equipoEncontrado.usuario;

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
                Equipo.findByIdAndUpdate(idEquipo, { imagen: nombre_archivo }, { new: true }, (err, usuarioEncontrado) => {
                    return res.status(200).send({ usuarioEncontrado });
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
    var rutaArchivo = `./src/imagenes/equipos/${nombreImagen}`;

    //Funcion para obtener la imagen en archivo
    fs.access(rutaArchivo, ((err) => {
        if (err) {
            return res.status(500).send({ mensaje: "No existe la imagen" });
        } else {
            return res.sendFile(path.resolve(rutaArchivo));
        }
    }))
}




function tabla(req, res) {
    var idLiga = req.params.idLiga

    Equipo.find({
        liga: idLiga,
        pts: { $gt: -1 }

    }).sort({ pts: -1 }).limit(10).exec((err, tablaDeEquipos) => {
        if (err) return res.status(500).send({ message: "Error en la peticion" })
        if (!tablaDeEquipos) return res.status(500).send({ mensaje: "No se pudo encontrar los equipos" })
        if (tablaDeEquipos) return res.status(200).send({ tablaDeEquipos })
    })

}


function tablaPDF(idLiga, res) {
    var idLiga = idLiga

    Equipo.find({
        liga: idLiga,
        pts: { $gt: -1 }

    }).sort({ pts: -1 }).limit(10).exec((err, tablaDeEquipos) => {
        return { tablaDeEquipos }
    })

}

function llamarPDF(req, res) {
    var idLiga = req.params.idLiga

    Equipo.find({
        liga: idLiga,
        pts: { $gt: -1 }

    }).sort({ pts: -1 }).limit(10).exec((err, tablaDeEquipos) => {

        User.populate(tablaDeEquipos, { path: "usuario" }, ((err, tablaDeEquipos) => {
            //liga
            liga.populate(tablaDeEquipos, { path: "liga" }, ((err, tablaDeEquipos) => {
                //liga
    
                if (err) return res.status(500).send({ message: "Error en la peticion" })
                if (!tablaDeEquipos) return res.status(500).send({ mensaje: "No se pudo encontrar los equipos" })
                console.log(tablaDeEquipos[0])
                generarPDF(tablaDeEquipos)

                return res.status(200).send({tablaDeEquipos})

            }))
    

        }))


    })
}

//Funciones para crear un PDF
function generarPDF(invoice) {
    let doc = new PDFDocument({ margin: 50 });

    generateHeader(doc);
    generateCustomerInformation(doc, invoice);
    generateInvoiceTable(doc, invoice);
    generateFooter(doc);

    doc.end();
    doc.pipe(fs.createWriteStream(`../TorneoDeportivo.Ang/src/assets/TablaEstadisticas.pdf`));
}

function generateHeader(doc) {
    doc
        .image("./src/PDF/a.png", 50, 45, { width: 50 })
        .fillColor("#444444")
        .fontSize(20)
        .text("My Tournament", 110, 57)
        .fontSize(10)
        .text("KINAL - Grupo 4", 200, 65, { align: "right" })
        .moveDown();
}

function generateFooter(doc) {
    doc
        .fontSize(10)
        .text(
            "MyTournament 2021©",
            50,
            780,
            { align: "center", width: 500 }
        );
}


function generateCustomerInformation(doc, invoice) {
    const shipping = invoice.shipping;

    doc
        .text("Liga:"+invoice[0].liga.nombres, 50, 95)

        .text("Nombre:"+invoice[0].usuario.usuario, 50, 130)
        .text("Email:"+invoice[0].usuario.email, 50, 145)
        .text("Usuario:"+invoice[0].usuario.usuario, 50, 160)
        .moveDown();
}

function generateInvoiceTable(doc, invoice) {
    let i;
    const invoiceTableTop = 330;

    doc.font("Helvetica-Bold");
    generateTableRow(
        doc,
        invoiceTableTop,
        "Equipo",
        "GF",
        "GC",
        "DG",
        "Puntos",
        1
    );

    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    /*nombres: String,
    golesAfavor: Number,
    golesEncontra: Number,
    diferenciaGoles: Number,
    partidosJugados: Number,
    pts: Number,
    imagen: String,
    usuario: { type:Schema.Types.ObjectId, ref: "usuario"},
    liga: {type: Schema.Types.ObjectId, ref: "liga"}*/


    for (i = 0; i < invoice.length; i++) {

        const item = invoice[i];
        const position = invoiceTableTop + (i + 1) * 30;

        generateTableRow(
            doc,
            //doc.image("./src/" + imagen,{ width: 30 }), 
            position,
            item.nombres,
            item.golesAfavor,
            item.golesEncontra,
            item.diferenciaGoles,
            item.pts,
            item.imagen,
        );

        generateHr(doc, position + 20);
    }

    const subtotalPosition = invoiceTableTop + (i + 1) * 40;


    const paidToDatePosition = subtotalPosition + 20;


    const duePosition = paidToDatePosition + 25;
    doc.font("Helvetica-Bold");

    doc.font("Helvetica");
}

function generateTableRow(
    doc,
    y,
    item,
    description,
    unitCost,
    quantity,
    lineTotal,
    imagen
) {
    console.log(imagen)


    if (imagen == null) {
        var imagen = 'imagenes/equipos/sin_logo.png'
        var vacio = 1

    } 


    if(imagen != 1 && vacio != 1){
            var imagen = 'imagenes/equipos/' + imagen

        }

        console.log(imagen)

    
    if(imagen === 1){
        doc

        .text(item, 100, y)
        .text(description, 200, y)
        .text(unitCost, 250, y, { width: 90, align: "right" })
        .text(quantity, 300, y, { width: 90, align: "right" })
        .text(lineTotal, 400, y, { width: 90, align: "right"});   
    }else{
        doc

        .image("./src/" + imagen, 50, y, { width: 11 })
        .text(item, 100, y)
        .text(description, 200, y)
        .text(unitCost, 250, y, { width: 90, align: "right" })
        .text(quantity, 300, y, { width: 90, align: "right" })
        .text(lineTotal, 400, y, { width: 90, align: "right"});   
    }

}

function generateHr(doc, y) {
    doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}


module.exports = {
    CrearEquipo,
    BuscarEquipo,
    equiposLiga,
    editarEquipo,
    eliminarEquipo,
    subirImagen,
    obtenerImagen,
    tabla,
    generarPDF,
    llamarPDF
};

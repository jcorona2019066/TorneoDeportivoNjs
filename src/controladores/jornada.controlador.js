'use strict'

var User = require("../modelos/usuario.model");
var Equipo = require("../modelos/equipos.model");
var liga = require("../modelos/liga.model");
var Jornada = require("../modelos/jornada.model");

function ingresarJornada(req, res) {
    var jornadaM = new Jornada();
    var params = req.body
    var idLiga = req.params.idLiga
    var marcador
    var jornada
    //---->Solo el rol usuario puede hacer esta funcion, ademas de agregar los datos(postman) al modelo antes de subirlo a la base
    if (params.nombre && params.equipo1 && params.equipo2 ) {

        if(  !params.marcador2){

            params.marcador2 = 0
        }

        if( !params.marcador1){
            params.marcador1 = 0

                
        }

        jornadaM.nombre = params.nombre;
        jornadaM.liga = idLiga;
        jornadaM.partido = [{
            equipo1: params.equipo1,
            equipo2: params.equipo2,
            marcador1: params.marcador1,
            marcador2: params.marcador2
        }]
        //---->Se busca en la base para ver si existen los nombres de los equipos
        Equipo.findOne({ _id: params.equipo1 }).exec((err, equipoEncontradoNombre) => {
            if (err) return res.status(500).send({ mensaje: "Error" })
            if (!equipoEncontradoNombre) return res.status(500).send({ mensaje: "No se encontro el mismo nombre de equipo" })
            if (equipoEncontradoNombre) {
                Equipo.findOne({ _id: params.equipo2 }).exec((err, equipoEncontradoNombre2) => {
                    if (err) return res.status(500).send({ mensaje: "Error" })
                    if (!equipoEncontradoNombre2) return res.status(500).send({ mensaje: "No se encontro el mismo nombre de equipo 2" })
                    if (equipoEncontradoNombre2) {



                        //---->Validacion para que el mismo equipo no juegue en la misma jornada 2 veces

 
                        Jornada.findOne({ nombre: params.nombre, liga: idLiga}).exec((err, JornadaEncontrada) => {
                                if (err) return res.status(500).send({ mensaje: "Error en la peticion" })
                                //console.log(JornadaEncontrada.partido.find(partido => partido.equipo1 === params.equipo1))
                                if(params.equipo1 == params.equipo2) return res.status(500).send({ mensaje: "Un equipo no puede jugar contra si mismo " })
                                
                                if (JornadaEncontrada){



                                    for (var i = 0; i < JornadaEncontrada.partido.length; i++){


                                        if((String(JornadaEncontrada.partido[i].equipo1) == params.equipo1 || String(JornadaEncontrada.partido[i].equipo2) == params.equipo1)
                                        ||
                                        (String(JornadaEncontrada.partido[i].equipo1) == params.equipo2 || String(JornadaEncontrada.partido[i].equipo2) == params.equipo2)

                                        
                                        ){

                                            var EquipoExisteEnJornada = 1
                                        }

                                    }

                                    if(EquipoExisteEnJornada)    return res.status(500).send({ mensaje: "Uno de los dos partidos ya jugo " })



                                }




                                Jornada.find({liga : idLiga }).exec((err, JornadasEncontrada) => {


                                    //paso 1 recorremos las jornadas
                                    for (var e = 0; e < JornadasEncontrada.length; e++){


                                        //paso 2, recorremos los partidos de cada jornada
                                        for (var i = 0; i < JornadasEncontrada[e].partido.length; i++){

                                                                                        //ahora revisamos si hay partidos con los mismos equipos

                                                                                            //primero buscamos el equipo 1, si existe, esto supongamos que dira sí
                                        if((String( JornadasEncontrada[e].partido[i].equipo1) == params.equipo1 || String( JornadasEncontrada[e].partido[i].equipo2) == params.equipo1)
                                        &&
                                        // luego buscamos el partido 2, si existe supongamos que dira que sí
                                        (String( JornadasEncontrada[e].partido[i].equipo1) == params.equipo2 || String( JornadasEncontrada[e].partido[i].equipo2) == params.equipo2)
                                        ){

                                            var EquipoExisteEnJornadas = 1
                                        }




                                    }
                                }



                                    if(EquipoExisteEnJornadas)    return res.status(500).send({ mensaje: "Los equipos ya se enfretaron " })








                                    ///---->Se guardan los datos del partido en el equipo 1 como golesfavor, DG , GE,etc
                                    Equipo.find({ _id: params.equipo1 }).exec((err, JequipoEncontrado) => {
                                        if (err) return res.status(500).send({ mensaje: "Error" })
                                        if (!JequipoEncontrado) return res.status(500).send({ mensaje: "No se encontro el equipo" })
                                        Equipo.update({ _id: JequipoEncontrado[0]._id }, {
                                            $set: {
                                                golesAfavor: JequipoEncontrado[0].golesAfavor + Number(params.marcador1),
                                                golesEncontra: JequipoEncontrado[0].golesEncontra + Number(params.marcador2),
                                                diferenciaGoles: JequipoEncontrado[0].diferenciaGoles +
                                                    (Number(params.marcador1) - Number(params.marcador2)),
                                                partidosJugados: JequipoEncontrado[0].partidosJugados + 1,
                                            }
                                        },
                                            (err, equipoCambiado) => {
                                                if (err) return res.status(500).send({ mensaje: "Error en la peticion de cambiar Equipo +" })
                                                if (!equipoCambiado) return res.status(500).send({ mensaje: "No se pudo cambiar los Equipo +" })
                                            })
                                        ///---->Se guardan los pts equipo1 si gano +3 o si == +1
                                        if (params.marcador1 > params.marcador2) {
                                            Equipo.update({ _id: JequipoEncontrado[0]._id }, {
                                                $set: {
                                                    pts: JequipoEncontrado[0].pts + 3
                                                }
                                            },
                                                (err, equipoCambiado) => {
                                                    if (err) return res.status(500).send({ mensaje: "Error en la peticion de cambiar pts equipo1" })
                                                    if (!equipoCambiado) return res.status(500).send({ mensaje: "No se pudo cambiar los pts equipo1" })
                                                })
                                        } else if (params.marcador1 == params.marcador2) {
                                            Equipo.update({ _id: JequipoEncontrado[0]._id }, {
                                                $set: {
                                                    pts: JequipoEncontrado[0].pts + 1
                                                }
                                            },
                                                (err, equipoCambiado) => {
                                                    if (err) return res.status(500).send({ mensaje: "Error en la peticion de cambiar pts equipo1" })
                                                    if (!equipoCambiado) return res.status(500).send({ mensaje: "No se pudo cambiar los pts equipo1" })
                                                })
                                        }
                                        ///---->Se guardan los datos del partido en el equipo 2 como golesfavor, DG , GE,etc
                                        Equipo.find({ _id: params.equipo2 }).exec((err, JequipoEncontrado2) => {
                                            if (err) return res.status(500).send({ mensaje: "Error" })
                                            if (!JequipoEncontrado2) return res.status(500).send({ mensaje: "No se encontro el equipo" })
                                            Equipo.update({ _id: JequipoEncontrado2[0]._id }, {
                                                $set: {
                                                    golesAfavor: JequipoEncontrado2[0].golesAfavor + Number(params.marcador2),
                                                    golesEncontra: JequipoEncontrado2[0].golesEncontra + Number(params.marcador1),
                                                    diferenciaGoles: JequipoEncontrado2[0].diferenciaGoles +
                                                        (Number(params.marcador2) - Number(params.marcador1)),
                                                    partidosJugados: JequipoEncontrado2[0].partidosJugados + 1,
                                                }
                                            },
                                                (err, equipoCambiado2) => {
                                                    if (err) return res.status(500).send({ mensaje: "Error en la peticion de cambiar Equipo 2" })
                                                    if (!equipoCambiado2) return res.status(500).send({ mensaje: "No se pudo cambiar Equipo 2" })
                                                })
                                            ///---->Se guardan los pts equipo2 si gano +3 o si == +1
                                            if (params.marcador2 > params.marcador1) {
                                                Equipo.update({ _id: JequipoEncontrado2[0]._id }, {
                                                    $set: {
                                                        pts: JequipoEncontrado2[0].pts + 3
                                                    }
                                                },
                                                    (err, equipoCambiado2) => {
                                                        if (err) return res.status(500).send({ mensaje: "Error en la peticion de cambiar pts equipo2" })
                                                        if (!equipoCambiado2) return res.status(500).send({ mensaje: "No se pudo cambiar los pts equipo2" })
                                                    })
                                            } else if (params.marcador2 == params.marcador1) {
                                                Equipo.update({ _id: JequipoEncontrado2[0]._id }, {
                                                    $set: {
                                                        pts: JequipoEncontrado2[0].pts + 1
                                                    }
                                                },
                                                    (err, equipoCambiado2) => {
                                                        if (err) return res.status(500).send({ mensaje: "Error en la peticion de cambiar pts equipo2" })
                                                        if (!equipoCambiado2) return res.status(500).send({ mensaje: "No se pudo cambiar los pts equipo2" })
                                                    })
                                            }

                                            //---->Se guarda en la base los datos agregados

                                            if(JornadaEncontrada){
                                                Jornada.findByIdAndUpdate(JornadaEncontrada._id, {$push:{partido:{

                                                    
                                                        equipo1: params.equipo1,
                                                        equipo2: params.equipo2,
                                                        marcador1: params.marcador1,
                                                        marcador2: params.marcador2

                                                }}},{new: true}).exec((err, partidoGuardado)=>{

                                                    if (partidoGuardado) return res.status(200).send({ partidoGuardado })
                                                    if (err) return res.status(500).send({ mensaje: "Error" })
                                                    if (!jornadaGuadada) return res.status(500).send({ mensaje: "No se pudo Guardar la jornada" })
                                                })



                                            }else{
                                                jornadaM.save((err, jornadaGuadada) => {
                                                    if (err) return res.status(500).send({ mensaje: "Error" })
                                                    if (!jornadaGuadada) return res.status(500).send({ mensaje: "No se pudo Guardar la jornada" })
                                                    if (jornadaGuadada) return res.status(200).send({ jornadaGuadada })
                                                })

                                            }


                                        })
                                    })


                                })

                                

                                
                            })
                    }
                })
            }

        })
    } else {
        return res.status(500).send({ mensaje: "Rellene todos los campos" })
    }




}


module.exports = {
    ingresarJornada,
}
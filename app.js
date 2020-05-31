const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const app = express();
const Sequelize = require('sequelize');
const sequelize = new Sequelize('mysql://root:Camila18@localhost:3306/delilah');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.listen(3001, () => {
    console.log('Servidor andando..')
});

//USUARIOS//
const dataUsuarioOK = async (req, res, next) => {

    if (req.body.usuario && req.body.password && req.body.nombre && req.body.apellido && req.body.mail && req.body.telefono && req.body.direccion) {
        next();
    } else {
        res.status(401).send('Algunos datos son incorrectos')
    }
};

const crearUsuario = async (req, res) => {
    let usuario = req.body;
    usuario.password = await bcrypt.hash(usuario.password, saltRounds);
    usuario.es_administrador = 0;
    sequelize.query(
        "INSERT INTO usuarios (usuario, password, nombre, apellido, mail, telefono, direccion, es_administrador) VALUES (:usuario, :password, :nombre, :apellido, :mail, :telefono, :direccion, :es_administrador) ",
        { replacements: usuario }
    )
        .then((respuesta) => {
            res.status(201).send("Usuario creado");
        })
        .catch((error) => {
            res.status(500).send(error);
        });
};
const dataLogin = (req, res, next) => {
    let user = req.body
    if ((user.usuario || user.mail) && user.password) {
        next();
    } else {
        res.status(401).send('Usuario o email incorrecto')
    };
};
const firma = 'elDiegoesdios'
const logIn = async (req, res) => {
    let user = req.body;
    sequelize.query('SELECT * FROM usuarios WHERE usuario = ? OR mail = ?',
        {
            replacements: [user.usuario, user.mail],
            type: sequelize.QueryTypes.SELECT
        }
    )
        .then(async (userLogin) => {
            console.log(userLogin)
            let isMatch = await bcrypt.compareSync(user.password, userLogin[0].password);
            if (isMatch) {
                console.log(userLogin[0]);
                let token = jwt.sign(userLogin[0], firma)
                res.status(200).json({ token: token })
            } else {
                res.status(401).send("Usuario o contraseña no válido");
            }
        })
        .catch((error) => {
            res.status(500).send("Email o usuario no registrado");
        });
};


function tokenValido(req, res, next) {
    const token = req.headers.authorization.split(' ')[1];
    const usuario = jwt.verify(token, firma);
    if (usuario.es_administrador.data[0] === 1) {
        req.usuario = usuario;
        next();
    } else {
        res.status(401).send('usuario invalido')
    }
}
function tokenUsuarios(req, res, next) {
    const token = req.headers.authorization.split(' ')[1];
    const usuario = jwt.verify(token, firma);
    if (usuario) {
        req.usuario = usuario;
        next();
    } else {
        res.status(401).send('usuario no tiene permisos para acceder a esta informacion')
    }
}
// este  token se usa en getallplatos y cuando quiera hacer un pedido//
const traerUsurarios = async (req, res) => {
    sequelize.query('SELECT * FROM usuarios')
        .then((usuarios) => {
            res.status(200).json(usuarios[0])
        }).catch((error) => {
            res.status(500).send(error);
        })

};
app.post('/usuarios', dataUsuarioOK, crearUsuario);
app.post('/login', dataLogin, logIn);
app.get('/usuarios', tokenValido, traerUsurarios);

//PRODUCTOS//

const getAllPlatos = (req, res) => {
    sequelize.query("SELECT * FROM productos WHERE en_stock = 1")
        .then((platos) => {
            res.status(200).json(platos[0]);
        })
        .catch((error) => {
            res.status(401).send('Usuario no logueado');
        });
};
const datosPlato = async (req, res, next) => {
    let plato = req.body;
    if (plato.nombre && plato.precio) {
        next();
    } else {
        res.status(400).send("Algunos de los datos no son correctos");
    }
}
const createPlato = (req, res) => {
    let plato = req.body;
    plato.disponible = 1;
    sequelize.query(
        "INSERT INTO productos (nombre, precio, urlFoto, en_stock) VALUES (:nombre, :precio, :urlFoto, :en_stock)",
        { replacements: plato }
    )
        .then((respuesta) => {
            console.log(respuesta);
            res.status(201).send('Plato: ' + plato.nombre + ' agregado a la DB');
        })
        .catch((error) => {
            res.status(500).send('Plato no agregado por: ' + error);
        });
};

const deletePlato = (req, res) => {
    let plato = req.body;
    console.log(plato)
    sequelize.query("DELETE FROM productos WHERE id = :id", {
        replacements: plato
    })
        .then((respuesta) => {
            res
                .status(200)
                .send(
                    'Plato ' + 'con el id: ' + plato.id + ' eliminado de la DB'
                );
        })
        .catch((error) => {
            res.status(500).send('No se pudo eliminar el plato por: ' + error);
        });
};
const platoExiste = (req, res, next) => {
    let plato = req.body;
    sequelize.query('SELECT * FROM productos WHERE id = :id',
        { replacements: plato, type: sequelize.QueryTypes.SELECT })
        .then((respuesta) => {
            if (respuesta[0].id > 0) {
                console.log(respuesta[0].id);
                next();
            }
        }).catch((error) => {
            res.status(404).send('middleware platoExiste' + error)
        })
};
const upDatePlato = (req, res) => {
    let plato = req.body;
    sequelize.query(
        "UPDATE productos SET nombre = ?, precio = ?, urlFoto = ?, en_stock = ? WHERE id = ?",
        {
            replacements: [
                plato.nombre,
                plato.precio,
                plato.urlFoto,
                plato.en_stock,
                plato.id
            ]
        }
    )
        .then((plato) => {
            res.status(203).send('Se actualizaron los datos correctamente');
        })
        .catch((error) => {
            res.status(500).send('Datos no actualizados por: ' + error);
        });
};
const platosFavoritos = (req, res) => {
    let usuario = req.usuario.id
    console.log(usuario)
    sequelize.query('SELECT pl.nombre, pl.urlFoto, pl.precio FROM detalle_pedido dp JOIN productos pl ON dp.idProducto = pl.id JOIN pedidos p ON dp.idPedido = p.id JOIN usuarios u ON p.idUsuarios = u.id WHERE u.id = ? ORDER BY dp.cantidad DESC',
        { replacements: [usuario] })
        .then((respuesta) => {
            let platos = respuesta[0];
            let set = new Set(platos.map(JSON.stringify))
            let platosFavoritos = Array.from(set).map(JSON.parse);
            res.status(200).json({
                platosFavoritos: platosFavoritos
            });
        }).catch((error) => {
            console.log(error);
        })
};



app.get('/productos', tokenUsuarios, getAllPlatos);
app.get('/productos/favoritos', tokenUsuarios, platosFavoritos);
app.post('/productos', tokenValido, datosPlato, createPlato);
app.delete('/productos', tokenValido, platoExiste, deletePlato);
app.put('/productos', tokenValido, platoExiste, upDatePlato);

//PEDIDOS//

const platosPedidos = (req, res, next) => {
    let platosPedidos = req.body.detalle
    if (platosPedidos.length > 0) {
        next();
    } else {
        res.status(500).send('Invalid request')
    }
}

const postPedido = async (req, res) => {
    let usuario = req.usuario;
    let hora = moment().format('YYYY-MM-DD HH:mm:ss');
    let newPedido = req.body
    let detalle = newPedido.detalle
    sequelize.query(
        "INSERT INTO pedidos (idUsuarios, idFormaDePago, hora) VALUES (?, ?, ?)",
        {
            replacements: [usuario.id, newPedido.idFormaDePago, hora]
        }).then(async (respuesta) => {
            let idPedido = respuesta[0];
            insertDetalle(detalle, idPedido)
                .then((respuesta) => {
                    return upDateTotal(respuesta, idPedido)
                }).catch((error) => {
                    console.log(error)
                })
            res.status(201).send('pedido ' + idPedido + ' insertado')
        }).catch((error) => {
            res.status(500).send(error)
        });
}

function getPrecioPlato(idPlato) {
    return new Promise(function (resolve, reject) {
        sequelize.query('SELECT precio FROM productos WHERE id = ?',
            { replacements: [idPlato], type: sequelize.QueryTypes.SELECT })
            .then((respuesta) => {
                if (respuesta.length !== 0) {
                    resolve(respuesta[0]);
                }
            }).catch((error) => {
                reject('plato no existe' + error)
            });
    });
};
function insertDetalle(detalle, idPedido) {
    return new Promise(function (resolve, reject) {
        let total = 0;
        detalle.forEach(async function (element) {
            let precio = await getPrecioPlato(element.idPlato);
            let precio_subtotal = precio.precio * element.cantidad;
            total = total + precio_subtotal;
            sequelize.query('INSERT INTO detalle_pedido (idPedido, idProducto, cantidad, precio_total) VALUES (?, ?, ?, ?)',
                {
                    replacements: [idPedido, element.idPlato, element.cantidad, precio.precio * element.cantidad]
                }).then((respuesta) => {
                    console.log(total);
                    resolve(total)
                }).catch((error) => {
                    console.log('catch del foreach' + error);
                    reject(error + 'catch del foreach')
                });
        })
    })
};
function upDateTotal(total, idPedido) {
    sequelize.query('UPDATE pedidos SET precioTotal = ? WHERE id = ? ',
        { replacements: [total, idPedido] })
        .then((respuesta) => {
            //console.log(respuesta[0])
        }).catch((error) => {
            console.log(error + 'catch del update')
        }).catch((error) => {
            reject(error + ' calcular total')
        });
}

const getAllPedidos = (req, res) => {
    sequelize.query(`SELECT e.descripcion, p.hora, p.id AS idPedido, dp.cantidad, pl.nombre, f.descripcion,
  p.precioTotal, u.nombre, u.apellido, u.direccion
  FROM pedidos p
  JOIN estados e ON p.idEstado = e.id
  JOIN detalle_pedido dp ON dp.idPedido = p.id
  JOIN productos pl ON dp.idProducto = pl.id
  JOIN forma_de_pago f ON p.idFormaDePago = f.id
  JOIN usuarios u ON p.idUsuarios = u.id
  ORDER BY e.id ASC`).then((respuesta) => {
        let pedidos = respuesta[0];
        let listaPedidosById = pedidos.reduce(function (r, element) {
            r[element.idPedido] = r[element.idPedido] || [];
            r[element.idPedido].push(element);
            return r;
        }, Object.create(null));
        res.json(listaPedidosById)
    }).catch((error) => {
        res.status(500).send(error)
    });
};

const upDateEstadoPedido = (req, res) => {
    let hora = moment().format("YYYY-MM-DD HH:mm:ss");
    let estadoNuevo = req.body.idEstado;
    let pedido = req.body.idPedido;
    let usuario = req.usuario;
    console.log(usuario)
    sequelize.query('SELECT idEstado FROM pedidos WHERE id = ?',
        { replacements: [pedido], type: sequelize.QueryTypes.SELECT })
        .then((respuesta) => {
            if ((respuesta[0].idEstado === estadoNuevo)) {
                res.status(401).send('Estado no se puede cambiar porque es el mismo')
            } else {
                sequelize.query('UPDATE pedidos SET idEstado = ?, hora = ? WHERE id= ?', {
                    replacements: [estadoNuevo, hora, pedido]
                })
                    .then((respuesta) => {
                        res.json({
                            estadoActual: estadoNuevo,
                            respuesta: respuesta[0],
                            dateTime: hora,
                            usuario: usuario.id
                        });
                    })
                    .catch((error) => {
                        res.json({ error: error });
                    });
            }
        }).catch((error) => {
            res.status(500).send(error + 'catch del select estado')
        });
};


const deletePedido = (req, res) => {
    let pedido = req.body.idPedido
    sequelize.query("DELETE FROM pedidos WHERE id = ?", {
        replacements: [pedido]
    })
        .then((respuesta) => {
            res.status(200).send('pedido ' + pedido + ' eliminado de la DB');
        })
        .catch((error) => {
            res.status(500).send('No se pudo eliminar el pedido por: ' + error);
        });
};



const getPedidoById = (req, res) => {
    let idPedido = req.params.id;
    console.log(idPedido)
    sequelize.query(`SELECT pl.nombre AS plato, pl.precio, pl.urlFoto, u.nombre, u.mail, u.direccion, u.telefono, dp.cantidad AS cantidad, p.precioTotal, p.id AS idPedido, fp.descripcion, e.descripcion
  FROM detalle_pedido dp
  JOIN productos pl ON dp.idProducto = pl.id
  JOIN pedidos p ON dp.idPedido = p.id
  JOIN usuarios u ON p.idUsuarios = u.id
  JOIN forma_de_pago fp ON p.idFormaDePago = fp.id
  JOIN estados e ON p.idEstado = e.id
  GROUP BY dp.id HAVING p.id = ?`, { replacements: [idPedido] })
        .then((respuesta) => {
            res.json(respuesta[0])
            console.log(respuesta)
        }).catch((error) => {
            res.json(error)
        })
};

app.post('/pedidos', tokenUsuarios, platosPedidos, postPedido);
app.get('/pedidos', tokenValido, getAllPedidos)
app.patch('/pedidos', tokenValido, upDateEstadoPedido);
app.delete('/pedidos', tokenValido, deletePedido)
app.get('/pedidos/:id', tokenValido, getPedidoById);






//const express = require('express')
//const fs = require('fs');

const path = require('path');
const db = require('../database/models');
const { validationResult } = require('express-validator');
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const toThousand = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");


//const productsFilePath = path.join(__dirname, '../data/products.json');
//const listaDeProductos = JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'));

//const nuevoId = () => {
// let ultimo = 0;
// listaDeProductos.forEach(product => {
//   if (product.id > ultimo) {
//     ultimo = product.id;
//   }
//  });
// return ultimo + 1;
//}


const productsController = {

  //   listado : function (req, res) {
  //     db.Producto.findAll({
  //       include: ['categoria'],
  //       order: [
  //         ['id', 'DESC']
  //       ]
  //   })
  //   .then(productos => {
  //       res.render('busqueda', { productos, toThousand })
  // })
  //   },

  mujer: function (req, res) {
    db.Producto.findAll()
      .then(productos => {
        res.render('mujer', { productos, toThousand })
      })

  },

  hombre: function (req, res) {
    db.Producto.findAll()
      .then(productos => {
        res.render('hombre', { productos, toThousand })
      })

  },

  remeras: function (req, res) {

    let url = req.path
    let categoriaMujer
    let categoriaHombre

    db.Producto.findAll({
      where: {
        tipo_id:2
      }
    })
    .then(productos => {
       if(url == "/mujer-remeras"){
         categoriaHombre = 0
       }
       else if (url == "/hombre-remeras"){
        categoriaMujer = 0
       }

       res.render('remeras', { categoriaMujer,  categoriaHombre, productos, toThousand})
    })
  },

  camisas: function (req, res) {

    let url = req.path
    let categoriaMujer
    let categoriaHombre

    db.Producto.findAll({
      where: {
        tipo_id:3
      }
    })
    .then(productos => {
       if(url == "/mujer-camisas"){
         categoriaHombre = 0
       }
       else if (url == "/hombre-camisas"){
        categoriaMujer = 0
       }

       res.render('camisas', { categoriaMujer,  categoriaHombre, productos, toThousand})
    })
  },


  detalle: function (req, res) {

    let id = req.params.id
    let url = req.path
    // let producto = listaDeProductos.find(element => element.id == id)

    let producto = db.Producto.findByPk(id,
      {
        include: [{ association: "tallas" }, { association: "categoria" }]
      })

    let categorias = db.Categoria.findAll()



    Promise
      .all([producto, categorias])
      .then(([producto, categorias]) => {
        let categoria = categorias.find(el => el.id === producto.categoria_id)
        let urlFinal = "/" + categoria.nombre + "/" + producto.id
        if (url != urlFinal) {
          res.redirect("/")
        }
        else {
          return res.render('productDetail', { producto, toThousand })
        }

      })


  },

  detalleTipos: function (req, res) {

    let id = req.params.id

    db.Producto.findByPk(id,
      {
        include: [{ association: "tallas" }, { association: "categoria" }]
      })

    .then(producto =>{
      res.render('productDetail', { producto, toThousand })
    }) 

  },


  create: function (req, res) {

    let tallas = db.Talla.findAll()
    let categorias = db.Categoria.findAll();
    let tipos = db.Tipo.findAll();

    Promise
      .all([tallas, categorias, tipos])
      .then(([tallas, categorias, tipos]) => {
        return res.render('product-create', { tallas, categorias, tipos })

      })
  },


  store: function (req, res) {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
      let tallas = db.Talla.findAll()
      let categorias = db.Categoria.findAll();
      let tipos = db.Tipo.findAll();

      Promise
        .all([tallas, categorias, tipos])
        .then(([tallas, categorias, tipos]) => {
          return res.render('product-create', { tallas, categorias, tipos, errors: errors.mapped(), old: req.body })

        })

    }
    else {
      db.Producto.create({
        nombreDelProducto: req.body.nombreDelProducto,
        imagen: "/image/productos/" + req.file.filename,
        descripcion: req.body.descripcion,
        categoria_id: req.body.categoria,
        tipo_id: req.body.tipo,
        color: req.body.color,
        precio: req.body.precio
      })
        .then(productoCreado => {
          let tallas = req.body.talla
          tallas.forEach(talla => {
            db.ProductoTalla.create({
              talla_id: talla,
              producto_id: productoCreado.id
            })
          })
          return res.redirect("/")



        })
        .catch(error => res.send(error))
    }
  },

  edit: (req, res) => {

    let producto = db.Producto.findByPk(req.params.id, {
      include: [{ association: "tallas" }]
    })

    let categorias = db.Categoria.findAll();
    let tipos = db.Tipo.findAll();
    let tallas = db.Talla.findAll();

    Promise
      .all([producto, categorias, tipos, tallas])
      .then(([producto, categorias, tipos, tallas]) => {
        return res.render('productEdit', { producto, categorias, tipos, tallas })

      })


  },


  update: (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
      let producto = db.Producto.findByPk(req.params.id, {
        include: [{ association: "tallas" }]
      })
      let tallas = db.Talla.findAll()
      let categorias = db.Categoria.findAll();
      let tipos = db.Tipo.findAll();

      Promise
        .all([tallas, categorias, tipos, producto])
        .then(([tallas, categorias, tipos, producto]) => {
          return res.render('productEdit', { tallas, categorias, tipos, producto, errors: errors.mapped(), old: req.body })

        })

    }
    else {
      db.ProductoTalla.destroy({
        where: {
          producto_id: req.params.id
        }
      })
        .then(function () {
          db.Producto.update({
            nombreDelProducto: req.body.nombreDelProducto,
            imagen: "/image/productos/" + req.file.filename,
            descripcion: req.body.descripcion,
            categoria_id: req.body.categoria,
            tipo_id: req.body.tipo,
            color: req.body.color,
            precio: req.body.precio
          },

            {
              where: {
                id: req.params.id
              }
            })

        })
        .then(productoEditado => {
          let tallas = req.body.talla
          console.log(tallas)
          tallas.forEach(talla => {
            db.ProductoTalla.create({
              talla_id: talla,
              producto_id: req.params.id
            },
              {
                where: {
                  producto_id: req.params.id
                }
              })
          })
          return res.redirect("/")

        })
        .catch(error => res.send(error))
    }

  },


  search: (req, res) => {
  // console.log(req.query.busqueda)

    // res.send(req.query.busqueda)

    if(req.query.busqueda){

    let busqueda = req.query.busqueda.toLowerCase()
    let busquedaArray = busqueda.split(" ")
    if (busquedaArray.includes('')) {
      let filtro = busquedaArray.filter(function(e) {
        return e != "";
      })
      busquedaArray = filtro
    }

    busqueda = busquedaArray.join(' ')

    let tipoId
    let categoriaId


    let tipos = db.Tipo.findAll()
    let categorias = db.Categoria.findAll()

    Promise
      .all([tipos, categorias])
      .then(([tipos, categorias]) => {
        tipos.forEach(tipo => {

          if (busqueda.includes(tipo.nombre.toLowerCase())) {
            return tipoId = tipo.id

          }

        })

        categorias.forEach(categoria => {
          if (busqueda.includes(categoria.nombre)) {
            return categoriaId = categoria.id
          }
        })


        if (categoriaId != undefined && tipoId == undefined) {
          let categoriaEncontrada = categorias.find(element => element.id == categoriaId);
          let index = busquedaArray.indexOf(categoriaEncontrada.nombre)
          busquedaArray.splice(index, 1)
          busqueda = busquedaArray.join(' ')
          return db.Producto.findAll({
            include: ['categoria'],
            where: {
              categoria_id: categoriaId,
              [Op.or]: {
                nombreDelProducto: sequelize.where(sequelize.fn('LOWER', sequelize.col('nombreDelProducto')), 'LIKE', "%" + busqueda + "%"),
                descripcion: sequelize.where(sequelize.fn('LOWER', sequelize.col('descripcion')), 'LIKE', "%" + busqueda + "%"),
                color: sequelize.where(sequelize.fn('LOWER', sequelize.col('color')), 'LIKE', "%" + busqueda + "%")
              }
            },
            order: [
              ['id', 'DESC']
            ]
          })
        }


        else if (tipoId != undefined && categoriaId == undefined) {
          let tipoEncontrada = tipos.find(element => element.id == tipoId);
          let index = busquedaArray.indexOf(tipoEncontrada.nombre.toLowerCase())
          busquedaArray.splice(index, 1)
          busqueda = busquedaArray.join(' ')
          return db.Producto.findAll({
            include: ['categoria'],
            where: {
              tipo_id: tipoId,
              [Op.or]: {
                nombreDelProducto: sequelize.where(sequelize.fn('LOWER', sequelize.col('nombreDelProducto')), 'LIKE', "%" + busqueda + "%"),
                descripcion: sequelize.where(sequelize.fn('LOWER', sequelize.col('descripcion')), 'LIKE', "%" + busqueda + "%"),
                color: sequelize.where(sequelize.fn('LOWER', sequelize.col('color')), 'LIKE', "%" + busqueda + "%")
              }
            },
            order: [
              ['id', 'DESC']
            ]
          })
        }

        else if (tipoId != undefined && categoriaId != undefined) {
          let tipoEncontrada = tipos.find(element => element.id == tipoId);
          let indexTipo = busquedaArray.indexOf(tipoEncontrada.nombre.toLowerCase())
          busquedaArray.splice(indexTipo, 1)
          let categoriaEncontrada = categorias.find(element => element.id == categoriaId);
          let indexCategoria = busquedaArray.indexOf(categoriaEncontrada.nombre)
          busquedaArray.splice(indexCategoria, 1)
          busqueda = busquedaArray.join(' ')
          if (busqueda.length > 0) {
            return db.Producto.findAll({
              include: ['categoria'],
              where: {
                tipo_id: tipoId,
                categoria_id: categoriaId,
                [Op.or]: {
                  nombreDelProducto: sequelize.where(sequelize.fn('LOWER', sequelize.col('nombreDelProducto')), 'LIKE', busqueda + "%"),
                  descripcion: sequelize.where(sequelize.fn('LOWER', sequelize.col('descripcion')), 'LIKE', "%" + busqueda + "%"),
                  color: sequelize.where(sequelize.fn('LOWER', sequelize.col('color')), 'LIKE', "%" + busqueda + "%")
                }
              }, order: [
                ['id', 'DESC']
              ]
            })
          }

          else {
            return db.Producto.findAll({
              include: ['categoria'],
              where: {
                tipo_id: tipoId,
                categoria_id: categoriaId
              }, order: [
                ['id', 'DESC']
              ]
            })
          }

        }
        else {
          return db.Producto.findAll({
            include: ['categoria'],
            where: {
              [Op.or]: {
                nombreDelProducto: sequelize.where(sequelize.fn('LOWER', sequelize.col('nombreDelProducto')), 'LIKE', "%" + busqueda + "%"),
                descripcion: sequelize.where(sequelize.fn('LOWER', sequelize.col('descripcion')), 'LIKE', "%" + busqueda + "%"),
                color: sequelize.where(sequelize.fn('LOWER', sequelize.col('color')), 'LIKE', "%" + busqueda + "%"),
                [Op.and]: {
                  nombreDelProducto: sequelize.where(sequelize.fn('LOWER', sequelize.col('nombreDelProducto')), { [Op.regexp]: busquedaArray.join('|') }),
                  descripcion: sequelize.where(sequelize.fn('LOWER', sequelize.col('descripcion')), { [Op.regexp]: busquedaArray.join('|') }),
                  color: sequelize.where(sequelize.fn('LOWER', sequelize.col('color')), { [Op.regexp]: busquedaArray.join('|') })
                }
              }
            }, order: [
              ['id', 'DESC']
            ]
          })
        }
      })    
      .then(productos => {

        if (productos.length > 0) {
          res.render('busqueda', { productos, toThousand })
        }
        else {
          return db.Producto.findAll({
            include: ['categoria'],
            order: [
              ['id', 'DESC']
            ]
        })
      }})
        .then(productos => {
           let errores = true
            res.render('busqueda', { productos, errores, toThousand })
    
      }
      )
    }
    else{
      return db.Producto.findAll({
        include: ['categoria'],
        order: [
          ['id', 'DESC']
        ]
    })
    .then(productos => {

        res.render('busqueda', { productos, toThousand })
  

  })
}

  },

  destroy: (req, res) => {

    db.ProductoTalla.destroy({
      where: {
        producto_id: req.params.id
      }
    })


      .then(function (borrado) {
        db.Producto.destroy({
          where: {
            id: req.params.id
          }
        })
      })
      .catch(error => console.log(error));
    res.redirect('/');
  }


}

module.exports = productsController;
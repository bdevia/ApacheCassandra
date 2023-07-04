const express = require('express');
const app = express();
const port = 3000;
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const cassandra = require('cassandra-driver');
const authProvider = new cassandra.auth.PlainTextAuthProvider('root', 'cassandra');
const contactPoints = ['node_1','node_2', 'node_3'];
const client = new cassandra.Client({contactPoints: contactPoints, authProvider: authProvider, localDataCenter: 'datacenter1', keyspace: 'consulta_medica'});

var id_paciente = 1;
var id_recetas = 1;

app.get('/', (req, res) => {
    const query = "SELECT * FROM paciente;";
    client.execute(query)
    .then(result => {
        console.log(result.rows[0]);
    })
    .catch((err) => {
      console.log('Error:', err);
    });

    res.send('Hello World!');
});

app.post('/create', (req, res) => {
  const query = "SELECT id FROM paciente WHERE nombre='"+req.body.nombre+"' AND apellido='"+req.body.apellido+"' ALLOW FILTERING";
  client.execute(query)
    .then(result => {
        if(result.rows.length > 0){
          const id = result.rows[0].id;

          const query3 = "SELECT * FROM recetas WHERE comentario='"+req.body.comentario+"' AND farmaco='"+req.body.farmaco+"' AND doctor='"+req.body.doctor+"' AND id_paciente="+id+" ALLOW FILTERING";
          client.execute(query3)
          .then(result => {
              if(result.rows.length > 0){
                res.json({'Status_create': 'Falló', 'Error': 'Receta ya existe'});
              } 
              else{
                (async() =>{
                  await Proceder_1();
                })();
              }
          })
          .catch((err) => {
            console.log('Error:', err);
            res.json({'Status_create': 'Falló', 'Error': err});
          });

          async function Proceder_1() {
            const query4 = "INSERT INTO recetas (id, id_paciente, comentario, farmaco, doctor) VALUES ("+id_recetas+", "+id+", '"+req.body.comentario+"', '"+req.body.farmaco+"', '"+req.body.doctor+"')";
            client.execute(query4)
            .then(result => {
                if(result){
                  id_recetas++;
                  res.json({'Status_create': 'Exitoso!'});
                }
            })
            .catch((err) => {
              console.log('Error:', err);
              res.json({'Status_create': 'Falló', 'Error': err});
            });
          };
                    
        }
        else{
          const query1 = "INSERT INTO paciente (id, nombre, apellido, rut, email, fecha_nacimiento) VALUES ("+id_paciente+", '"+req.body.nombre+"', '"+req.body.apellido+"', '"+req.body.rut+"', '"+req.body.email+"', '"+req.body.fecha_nacimiento+"');";
          const query2 = "INSERT INTO recetas (id, id_paciente, comentario, farmaco, doctor) VALUES ("+id_recetas+", "+id_paciente+", '"+req.body.comentario+"', '"+req.body.farmaco+"', '"+req.body.doctor+"')";

          client.execute(query1)
          .then(result => {

            (async() => {
              await Proceder_2();
            })();

          })
          .catch((err) => {
            console.log('Error:', err);
            res.json({'Status_create': 'Falló', 'Error': err});
          });

          async function Proceder_2(){
            client.execute(query2)
            .then(result => {
              id_paciente++;
              id_recetas++;
              res.json({'Status_create': 'Exitoso!'});
            })
            .catch((err) => {
              console.log('Error:', err);
              res.json({'Status_create': 'Falló', 'Error': err});
            });
          };

        }
    })
    .catch((err) => {
      console.log('Error:', err);
      res.json({'Status_create': 'Falló', 'Error': err});
    });

});

app.post('/edit', (req, res) => {
  const query = "UPDATE recetas set comentario='"+req.body.comentario+"', doctor='"+req.body.doctor+"', farmaco='"+req.body.farmaco+"' WHERE id="+req.body.id+";";
  client.execute(query)
    .then(result => {
        res.json({'Status_update': 'Exitoso!'});
    })
    .catch((err) => {
      console.log('Error:', err);
      res.json({'Status_update': 'Falló', 'Error': err});
    });
});

app.post('/delete', (req, res) => {
  const query = "SELECT * FROM recetas WHERE id="+req.body.id+";";
  client.execute(query)
  .then(result => {
    if(result.rows.length > 0){
      const query1 = "DELETE FROM recetas WHERE id="+req.body.id+";";
      client.execute(query1)
      .then(result => {
        res.json({'Status_delete': 'Exitoso!'});
      })
      .catch((err) => {
        console.log('Error:', err);
        res.json({'Status_update': 'Falló', 'Error': err});
      });
    } 
    else{
      res.json({'Status_delete': 'Falló', 'Error': 'Receta con ese ID no existe'});
    }
  })
  .catch((err) => {
    console.log('Error:', err);
    res.json({'Status_delete': 'Falló', 'Error': err});
  });


});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});

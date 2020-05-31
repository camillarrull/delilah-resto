# delilah-resto es una API para realizar y adminsitrar pedidos. 

Recursos y tecnologias utilizados:
- Node Js
- Express
- Body-parser
- Sequelize
- JWT
- Bcrypt
- Moment

Recursos necesarios:
- Node
- MySQL

Pasos para utilizar la API:
1) clonar el repositorio:
git clone https://github.com/camillarrull/delilah-resto
2) en la consola, npm install
3) En el motor de base de datos MySql, copiar las queries que se encuentran en el archivo scripts.txt y ejecutarlas para que se cree la base de datos.
En la misma ya se encuentran insertados el usuario administrador ( usuario : Fer 08, password: contra ) quien tiene los permisos de administrador para acceder a los distintos endpoints con requisito de adminisitrador.
Tambien se encuentran insertados algunos productos (3) para poder utilizarlos para probar los endpoints de pedidos.
4)En la linea numero 6 del archivo app.js (const sequelize = new Sequelize('mysql://root:tupassword@localhost:3306/delilah'), reemplazar donde dice "tupassword" por la password con la que vos accedes a tu base de datos.
5)Desde postman abrir el archivo delilah.postman_collection.json donde se encuentran todos los endpoints para testear la API
6)Toda la documentacion correspondiente se encuentra en : https://app.swaggerhub.com/apis-docs/camillarrull/Delilah/1.0.0

HAPPY HACKING !

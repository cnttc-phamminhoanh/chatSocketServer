const doenv = require('dotenv');
doenv.config();
var mysql = require('mysql');
const express = require('express');
const app = express();
var md5 = require('md5');
var dns = require('dns');
var os = require('os');
var server = require("http").createServer(app);
var io = require('socket.io')(server);
var port = process.env.port || 3000;
const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'chat'
});
var arrUserLogin=[];
connectDatabase();
getInfor(port);
io.sockets.on('connection',function(socket){
    socket.emit('checkAlive',{noidung : true});
    socket.on('client-gui-account',function(data){  
        if(data){
            getAllUser(function(resultsQuery){
                var dangnhapthanhcong = "";            
                data.password = md5(data.password).toString();
                for(var i=0;i<resultsQuery.length;i++){                  
                    if(data.username === resultsQuery[i].username && data.password === resultsQuery[i].password){
                        arrUserLogin.push(data.username);
                        dangnhapthanhcong = true;
                        if(resultsQuery[i].role===0){
                            // dangnhapthanhcong="member";
                            socket.emit('checkLogin',{noidung:"member",usersLogin:arrUserLogin});
                            return;
                        }
                        if(resultsQuery[i].role===1){
                            // dangnhapthanhcong="admin";
                            socket.emit('checkLogin',{noidung:"admin",usersLogin:arrUserLogin});
                            return;
                        }         
                    }
                }                  
                if(dangnhapthanhcong===""){
                    socket.emit('checkLogin',{noidung:"Login Failed"});
                }
            });
        }
    });

    socket.emit("usersLogin",{noidung:arrUserLogin});

    getAllUser(function(resultsQuery){
        var arrName = [];
        for(var i=0;i<resultsQuery.length;i++){
            arrName.push(resultsQuery[i].username);
        }
        socket.emit("users",{noidung:arrName});
    });

    socket.on('client-send-account-signin',function(data){
        if(data){
            getAllUser(function(resultsQuery){
                var dangki = "";
                for(var i=0;i<resultsQuery.length;i++){
                    if(data.username === resultsQuery[i].username){
                        dangki = "User exists";
                    }
                }
                if(dangki==""){
                    socket.emit('checkSignin',{noidung:true});
                    data.id = ++resultsQuery.length - 1;
                    data.password = md5(data.password);
                    insertUser(data);
                }
                else{
                    socket.emit('checkSignin',{noidung:dangki});
                }
            });    
        }
    });

    socket.on('client-send-messenger',function(data){
        if(data){
            console.log(data);
            io.sockets.emit('server-send-all-client',{userNameLogin:data.userNameLogin,noidung:data.content});
        }
    });

});

server.listen(port,function(){
    console.log('***************************************************************')
	console.log('Server listening on port ' + port);
});
function getInfor(port){
    dns.lookup(os.hostname(),function(err,add,fam){
        console.log('Connect Url Chat : http://' + add + ':3000');
    });
}
function connectDatabase(){
    connection.connect(function(err){
        if(!err){
            console.log("Database is connected");
            console.log('***************************************************************')
        }
        else{
            console.log("Database connect error");
        }
    });
}
function insertUser(user){
    var role = 0;
    connection.query("insert into user (id, username, password, role) values ('" + user.id + "','" + user.username + "','" + user.password + "','" + role + "')",function(err,results,fields){
        if(!err){

        }
        else{
            console.log(err);
        }
    });
}
function getAllUser(callbackQuery){
    connection.query('select * from user',function(err,results,fields){
        if(!err){
            callbackQuery(results);
        }
        else{
            console.log(err);
        }
    });
}
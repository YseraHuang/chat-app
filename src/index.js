const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words') 
const {generateMessage,generateLocationMessage} = require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')


const app = express() // create a server
const server = http.createServer(app)
const io = socketio(server) //need the raw http server

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public') // Connect to HTML path

app.use(express.static(publicDirectoryPath))


// handle when user connect to the room
io.on('connection',(socket)=>{ // socket is an object 
    console.log('New WebSocket connection')
    
    
    
    socket.on('join',({username,room}, callback)=>{ //listener for join
        const {error, user} = addUser({id:socket.id, username, room})
        

        if (error) {
            return callback(error)
        }


        socket.join(user.room)
        socket.emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData',{
            room: user.room,
            users:getUsersInRoom(user.room)
        })

        callback() // letting client know they joined
        //socket.emit, io.emit, socket.broadcast.emit
        //io.to.emit, socket.broadcast.to.emit
    })

    socket.on('sendMessage',(message, callback)=>{ // listen to sendMessage event
        const filter = new Filter()
        
        if (filter.isProfane(message)){ // filter the profane language
            return callback('Profanity is not allowed!') // send back to the client
        }
        
        const user= getUser(socket.id)
        
        io.to(user.room).emit('message',generateMessage(user.username,message)) // need to emit the message event to all people
        callback() // call the received callback funtion
    })

    socket.on('sendLocation',(coords,callback)=>{
        const user= getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`http://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect',()=>{ // notify when user leaves
        const user = removeUser(socket.id)
        if (user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })


})


server.listen(port, ()=>{
    console.log(`Server is up on port ${port}!`)
})




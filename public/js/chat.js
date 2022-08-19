const socket = io() // the function that connects to client side

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username,room}=Qs.parse(location.search, {ignoreQueryPrefix: true})// make sure the ? go away

const autoscroll = () =>{
    //new message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visiable height
    const visiableHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have i Scrolled?
    const scrollOffset = $messages.scrollTop + visiableHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{ // render the dynamic messages
        username: message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(url)=>{
    console.log(url)

    const html = Mustache.render(locationTemplate,{
        username: url.username,
        url:url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML =html
})


$messageForm.addEventListener('submit',(e)=>{ // submit is an event
    e.preventDefault() 

    $messageFormButton.setAttribute('disabled','disabled') // disable the botton before the previous message sent


    //e.target is the message-form => access the elements in the form
    const message = e.target.elements.message.value //get the client type message
    socket.emit('sendMessage',message, (error)=>{ //send a call back funtion
        
        $messageFormButton.removeAttribute('disabled') // enable the button
        $messageFormInput.value = '' // clear the input
        $messageFormInput.focus()
        //enable
        if (error){
            return console.log(error)
        }

        console.log('Message Delivered!')
    }) // emit the sendMessage event and cilent type message to the server
})



$sendLocationButton.addEventListener('click',()=>{
    
    if (!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled','disabled') //disable

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        },()=>{
            $sendLocationButton.removeAttribute('disabled') //reenable
            console.log('Location shared') // sending a callback funtion
        })

    })
})


socket.emit('join',{username,room}, (error)=>{
    if (error){
        alert(error)
        location.href = '/'
    }
}) // send the data to the server
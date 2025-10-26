const socket = io("https://chatapp-three-orpin.vercel.app")

let iconID = -1

// userNmae input při google
fetch('/from_google')
  .then(response => response.json())
  .then(data => {
     if (data.google) {
      let inputField = document.createElement('div')
      inputField.classList.add('overlay')
      inputField.innerHTML = `<input type="text" placeholder="Enter username" id="googleUserName">
      <button id="userNameSubmit">Continue</button>`
      let sidebar = document.getElementById('conteiner2')
      document.getElementById('conteiner').insertBefore(inputField, sidebar)      

      let saveUsername = (event) => {
        if (event.type === "click" || (event.type === "keypress" && event.key === "Enter")) {


          let userName = document.getElementById('googleUserName').value
         

          const data = {user: userName}
          fetch('/from_google2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })

          inputField.remove()
          window.location.reload()
     }
    }
    document.getElementById('userNameSubmit').addEventListener('click', saveUsername)
    document.getElementById('googleUserName').addEventListener('keypress', saveUsername)
  }
   })

// emoji

let emojiDisplayToggle = () => {
  let emoji = document.getElementById('emojiContainer') 
  if (emoji.style.display === 'none') {
    emoji.style.display = 'block'
  } else {
    emoji.style.display = 'none'
  }
}

document.getElementById('emojiBtn').addEventListener('click', emojiDisplayToggle)

document.querySelector('emoji-picker').addEventListener('emoji-click', (event) => {
  console.log(event)
  let messageInput = document.getElementById('msg')
  messageInput.value = messageInput.value + event.detail.unicode
})

// funkce na zprávy
let message = (message) => {
  socket.emit('message', { text: message })
  
}

// alert fce
let alertHandler = (alert) => {
  let alertDiv = document.createElement('div')
  let alertText = document.createElement('p')
  alertText.textContent = alert
  alertDiv.classList.add('alertOverlay')
  alertDiv.appendChild(alertText)
  document.getElementById('conteiner').insertBefore(alertDiv, document.getElementById('conteiner2'))

  setTimeout(() => alertDiv.remove(), 4000)
}

let colorsArray = []
let colorsHandler = () => {
// fce na získání user barev
fetch('/color')
  .then(response => response.json())
  .then(data => {
    for (let i = 0; i < data.colors.length; i++) {
      let user = data.users[i]
      let color = data.colors[i]
      let userColors = {
        name: user,
        color: color
      }
      colorsArray.push(userColors)
      }
})
}
colorsHandler()


// fce na uložení room při vytoření 

let saveRoom = (name) => {
  const data = {room: name}
  fetch('/save_room', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
}

// fce na čekování gifu ve zprávách
let gifChecker = (data) => {
  let newMessageText = undefined
  if (data.text.includes('https://media.tenor.com')) {
    newMessageText = document.createElement('img')
    newMessageText.src = data.text
  } else if(data.text.includes('http')) {
    newMessageText = document.createElement('a')
    newMessageText.textContent = data.text
    newMessageText.setAttribute("href", data.text);
  } else {
    newMessageText = document.createElement('p')
    newMessageText.textContent = data.text
  }
  return newMessageText
}

// načtení zpráv z databáze

let receiveMessages = (roomName) => {
  const data = {room : roomName}

  fetch('/send_messages_from_db', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    let messageContainer = document.getElementById('messages')


    data.messages.forEach(message => {
      const dateObjectMessage = new Date(message.time)
      const day = dateObjectMessage.getDate()
      const month = dateObjectMessage.getMonth()
      const hours = dateObjectMessage.getHours()
      const minutes = dateObjectMessage.getMinutes() 

      let newMessageText = gifChecker(message)

      let newMessageContainer = document.createElement('div')
      newMessageContainer.classList.add('newMessage')

      let newMessageUser = document.createElement('p')
      let newMessageDate = document.createElement('p')

      newMessageUser.classList.add('vojtajeultrageje')
      newMessageDate.classList.add('datum')
      newMessageDate.textContent = (`${day}.${month}. ${hours}:${minutes}`)
      newMessageText.classList.add('vojtajeultrageje2')


      newMessageUser.textContent = message.user
      
      let testDiv = document.createElement('div')
      testDiv.classList.add('testDiv')
      testDiv.appendChild(newMessageUser)
      testDiv.appendChild(newMessageDate)

      newMessageContainer.appendChild(testDiv)
      newMessageContainer.appendChild(newMessageText)

      colorsArray.forEach((userName)=> {
        if (userName.name === message.user) {
          testDiv.style.backgroundColor = `rgb(${userName.color[0]}, ${userName.color[1]}, ${userName.color[2]})`
        }
      })

      newMessageContainer.id = message.id

      fetch('/myUser')
        .then(response => response.json())
        .then(data => {
          let userMy = data.user
          if (userMy === newMessageUser.textContent) {
            let icon = document.createElement('i')
            icon.className = "fa-solid fa-trash"
            newMessageContainer.appendChild(icon)
          }
      })  


      messageContainer.appendChild(newMessageContainer)

        let scrollableDiv = document.getElementById("messages");
        scrollableDiv.scrollTop = scrollableDiv.scrollHeight;

    })

  })
}

class Room {

  constructor(roomName) {
    this.name = roomName
  }

  roomInitialShow() {
    let newRoom = document.createElement('li')
    newRoom.textContent = this.name
    newRoom.classList.add('createdRooms')



    let icon = document.createElement('i')

    icon.id = iconID

    iconID--


    icon.className = "fa-regular fa-trash-can"
    newRoom.addEventListener('mouseenter', function() {
      icon.style.opacity = '1'; // Změna opacity prvního prvku
    });
    
    // Přidání události mouseleave pro prvek 2
    newRoom.addEventListener('mouseleave', function() {
      icon.style.opacity = '0'; // Navrácení původní opacity prvního prvku
    });

    icon.addEventListener('mouseenter', () => addHighlight(icon.id));
    icon.addEventListener('mouseleave', () => removeHighlight(icon.id));


    newRoom.appendChild(icon)

    document.getElementById('roomsList').appendChild(newRoom)  
  }

  roomCreate() {
    socket.emit('create_room', { room: this.name })
    console.log('Room created')

    // alert
    alertHandler('Room created')
  }

  roomJoin() {
    let userDiv = document.getElementById('userPage')
    userDiv.style.display = 'none'

    let deleteAccConfirm = document.getElementById('deleteAccConfirm')
    deleteAccConfirm.style.display = 'none'

    document.getElementById('listPeople').style.display = 'block'
    
    let messages = document.querySelectorAll('.newMessage')
    messages.forEach( (message) => {
      message.remove()
    })
    
    receiveMessages(this.name)

    document.getElementById('messageInputContainer').style.display = 'block'
    socket.emit('join_room', { room: this.name })
    console.log(this.name)
  }
  
  roomShow () {

    let newRoom = document.createElement('li')
    newRoom.textContent = this.name
    newRoom.classList.add('createdRooms')

    let icon = document.createElement('i')

    icon.className = "fa-regular fa-trash-can"
    
    icon.id = iconID

    iconID--

    icon.addEventListener('mouseenter', () => addHighlight(icon.id));
    icon.addEventListener('mouseleave', () => removeHighlight(icon.id));
    newRoom.addEventListener('mouseenter', function() {
      icon.style.opacity = '1'; // Změna opacity prvního prvku
    });
    
    // Přidání události mouseleave pro prvek 2
    newRoom.addEventListener('mouseleave', function() {
      icon.style.opacity = '0'; // Navrácení původní opacity prvního prvku
    });

  

    newRoom.appendChild(icon)
    document.getElementById('roomsList').appendChild(newRoom)
}
}
socket.on('connect', () => {
  console.log('Connected to server')
})

socket.emit('join_room', { room: 'manipulatingRoom' })


// příjmání zpráv ze serveru
socket.on('message', (data) => {
  console.log(data)
  
  if (data.from === 'create_room') {
    let newRoom = new Room(data.room)
    
    newRoom.roomShow()
  }

  if (data.from ==='message') {
    let messageContainer = document.getElementById('messages')
    
    let newMessageText = gifChecker(data)

    let newMessageUser = document.createElement('p')
    let newMessageDate = document.createElement('p')
    
    newMessageUser.classList.add('vojtajeultrageje')
    newMessageDate.classList.add('datum')
    newMessageText.classList.add('vojtajeultrageje2')

      
    const dateObjectMessage = new Date(data.date)
    const day = dateObjectMessage.getDate()
    const month = dateObjectMessage.getMonth()
    const hours = dateObjectMessage.getHours()
    const minutes = dateObjectMessage.getMinutes() 

    newMessageDate.textContent = (`${day}.${month}. ${hours}:${minutes}`)

    newMessageUser.textContent = data.user

    let newMessageContainer = document.createElement('div')
    newMessageContainer.classList.add('newMessage')

    let testDiv = document.createElement('div')
    testDiv.classList.add('testDiv')
    testDiv.appendChild(newMessageUser)
    testDiv.appendChild(newMessageDate)

    newMessageContainer.appendChild(testDiv)
    newMessageContainer.appendChild(newMessageText)

    colorsArray.forEach((userName)=> {
      if (userName.name === data.user) {
        testDiv.style.backgroundColor = `rgb(${userName.color[0]}, ${userName.color[1]}, ${userName.color[2]})`
      }
    })

    newMessageContainer.id = data.message_id
    
    fetch('/myUser')
      .then(response => response.json())
      .then(data => {
        let userMy = data.user
        if (userMy === newMessageUser.textContent) {
          let icon = document.createElement('i')
          icon.className = "fa-solid fa-trash"
          newMessageContainer.appendChild(icon)
        }
    })    
    

    messageContainer.appendChild(newMessageContainer)



    const slider = document.getElementById("messages");

  
    const scrollTop = slider.scrollTop;
    const scrollHeight = slider.scrollHeight;
    const clientHeight = slider.clientHeight;


    if (scrollTop >= scrollHeight - clientHeight - 300) {
      // Uživatel se nachází na konci posuvníku
      let scrollableDiv = document.getElementById("messages");
      scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
  
  }
  }

  if (data.from === 'delete_room') {

    let rooms = document.querySelectorAll('.createdRooms') 
    rooms.forEach(function(room) {

    if (room.textContent === data.room) {
      room.remove()
      alertHandler('Room deleted successfully')
    }
    })
  }
  if (data.from === "rename_user") {
    colorsHandler()
  }

})

// list lidí v pravo
socket.on('update_users_list', (data) => {
  const roomName = data.room;
  const users = data.users;

  // Clear the existing list of users for this room
  const userList = document.getElementById('listPeople');
  userList.innerHTML = '';

  // Re-populate the list with the updated user information
  users.forEach((user) => {
    const newUser = document.createElement('li');
    newUser.textContent = user;
    
    newUser.classList.add('newHuman');
    
    userList.appendChild(newUser);
    
    colorsArray.forEach((userName)=> {
      if (userName.name === user) {
        newUser.style.backgroundColor = `rgb(${userName.color[0]}, ${userName.color[1]}, ${userName.color[2]})`

      }
    })
  });
});

// funkce na načtení předchozích room
let receivedRooms = []

fetch('/receive_rooms')
.then(response => response.json())
.then(data => {
  data.rooms.forEach((room) => {
    receivedRooms.push(room)

  })
  receivedRooms.forEach((room) =>{
    room = new Room(room)
    room.roomInitialShow()

  })
})

let roomChecker = (roomName) => {
  let result = true
  document.querySelectorAll('.createdRooms').forEach((room) => {
    if (roomName === room.textContent) {
      result = false
    } 
  })
  return result
}

// vytvoření nové room
let addroom = document.getElementById('addRoom')
addroom.addEventListener('click', () => {
let inputField = document.createElement('div')
inputField.classList.add('overlay')
inputField.innerHTML = `<h2>The room name have to be under 8 characters </h2> <input type="text" placeholder="Enter room name" id="roomName">
<button id="addRoomBtn">Add</button>`
let sidebar = document.getElementById('conteiner2')
document.getElementById('conteiner').insertBefore(inputField, sidebar)

let saveAddRoom = (event) => {
  if (event.type === "click" || (event.type === "keypress" && event.key === "Enter")) {
    let result = roomChecker(document.getElementById('roomName').value)
    console.log(result)
    if (result === true) {
      if (document.getElementById('roomName').value.length <= 8) {

        
      let roomName = document.getElementById('roomName').value
      inputField.remove()
      let newRoom = new Room(roomName)
      newRoom.roomCreate()

      saveRoom(roomName)
      }
  } else alertHandler('This room already exists')
}
}

document.getElementById('addRoomBtn').addEventListener('click', saveAddRoom)
document.getElementById('roomName').addEventListener('keypress', saveAddRoom)
})


let rooms = document.getElementById('roomsList')
rooms.addEventListener('click', (e) => {

  if (e.target.classList.contains('createdRooms')) {
    let roomName = e.target.textContent
    let newRoom = new Room(roomName)
    
    newRoom.roomJoin()

  }

  // mazání rooms
  if (e.target.classList.contains('fa-regular')) {
    let roomName = e.target.parentNode.textContent
    console.log(roomName)
    socket.emit('delete_room', { room: roomName })
    
  }

})

// odeslání zprávy
let messageInput = document.getElementById('msg')
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    message(messageInput.value)
    messageInput.value = ''

  }
})


// user Blok barva a tlačítko logout
fetch('/myUser')
  .then(response => response.json())
  .then(data => {
    let userMy = data.user

    let userDiv = document.getElementById('user')
    let userDivName = document.getElementById('myUserName')
    userDivName.textContent = userMy
    


    colorsArray.forEach((userName)=> {
      if (userName.name === userMy) {
        userDiv.style.backgroundColor = `rgb(${userName.color[0]}, ${userName.color[1]}, ${userName.color[2]})`
      }
    })
})



// user page

fetch('/myUser')
.then(response => response.json())
.then(data => {
  let userMy = data.user
  let userMail = data.email

  document.getElementById('listPeople').style.display = 'none'
  let userEmail = document.getElementById('userEmail')
  let userNameP = document.getElementById('userNameP')

  userEmail.textContent = userMail
  userNameP.textContent = userMy

  let inputField = document.getElementById('renameInput')

  colorsArray.forEach((userName)=> {
    if (userName.name === userMy) {
      userNameP.style.backgroundColor = `rgb(${userName.color[0]}, ${userName.color[1]}, ${userName.color[2]})`
      inputField.style.backgroundColor = `rgb(${userName.color[0]}, ${userName.color[1]}, ${userName.color[2]})`
    }
  })


  
})

let showRename = () => {
  let paragraf = document.getElementById("userNameP")
  let inputField = document.getElementById('renameInput')

    paragraf.style.display = 'none'
    inputField.style.display = 'inline-block'
    inputField.value = paragraf.textContent
    inputField.focus()
    document.getElementById('cancel').style.display = 'inline-block'
    document.getElementById('renameAcc').style.display = 'none'

    document.getElementById('deleteAcc').style.display = 'none'
    let deleteAccConfirm = document.getElementById('deleteAccConfirm')
    deleteAccConfirm.style.display = 'none'

}

let hideRename = () => {
  let paragraf = document.getElementById("userNameP")
  let inputField = document.getElementById('renameInput')
  paragraf.style.display = 'block'
  inputField.style.display = 'none'

  document.getElementById('cancel').style.display = 'none'
  document.getElementById('renameAcc').style.display = 'inline-block'
  document.getElementById('deleteAcc').style.display = 'inline-block'
}

let userPageToggle = () => {
  socket.emit('leave_room2')
  
  let deleteAccConfirm = document.getElementById('deleteAccConfirm')
  deleteAccConfirm.style.display = 'none'

  let deleteAcc = document.getElementById('deleteAcc')
  deleteAcc.style.display = 'inline-block'

  let messageInput = document.getElementById('messageInputContainer')

  let messages = document.querySelectorAll('.newMessage')
  messages.forEach( (message) => {
    message.remove()
  })

  document.getElementById('listPeople').style.display = 'none'
  messageInput.style.display = 'none'
  
  let userPage = document.getElementById('userPage')
  if (userPage.style.display === 'none') {
  userPage.style.display = 'block'
  }
}

let rename = document.getElementById('renameAcc')
rename.addEventListener('click', showRename)

let cancel = document.getElementById('cancel')
cancel.addEventListener('click', hideRename)

let userDivName = document.getElementById('myUserName')
userDivName.addEventListener('click', () => {
  userPageToggle()
})

let inputField = document.getElementById('renameInput')
inputField.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    let newName = inputField.value
    socket.emit('rename_user', { new_name: newName })
    
    window.location.href = '/login'

    fetch('/logout')
  }
})

let deleteAcc = document.getElementById('deleteAcc')
deleteAcc.addEventListener('click', () => {
  
  let deleteAccConfirm = document.getElementById('deleteAccConfirm')
  deleteAccConfirm.style.display = 'inline-block'
  deleteAcc.style.display = 'none'

  deleteAccConfirm.addEventListener('click', () => {
    socket.emit('delete_user')
    
    window.location.href = '/login'

    fetch('/logout')
  })
  
  
})




let logout = document.getElementById('logout')
logout.addEventListener('click', () => {
  
  window.location.href = '/login'

  fetch('/logout')
})

// mazání zpráv
let messagesUsers = document.getElementById('messages')
messagesUsers.addEventListener('click', (e) => {
  if (e.target.classList.contains('fa-solid')) {
    let messageId = e.target.parentNode.id
    socket.emit('delete_message', { message_id: messageId })
    e.target.parentNode.remove()
  }
})

let gifDisplayToggle = () => {
  let gifContainer = document.getElementById('gifContainer') 
  if (gifContainer.style.display === 'none') {
    gifContainer.style.display = 'block'
  } else {
    gifContainer.style.display = 'none'
  }
}

// gify
let gifBtn = document.getElementById('gifBtn')
gifBtn.addEventListener('click', (e) => {
  
  gifDisplayToggle()

  fetch('/featured')
  .then(response => response.json())
  .then(data => {
    console.log(data)
    const gifDisplay = document.getElementById("gifDisplay");
    gifDisplay.innerHTML = ""

    data.forEach(gif => {
      const gifUrl = gif.media_formats.nanogif.url
      const img = document.createElement("img")
      img.src = gifUrl;
      img.className = "gif"
      gifDisplay.appendChild(img)
      })
  })

})

let gifInput = document.getElementById('gifInput')
gifInput.addEventListener('input', (e) => {
  let suggestionInput = e.target.value

  if (suggestionInput.length === 0) {
    fetch('/featured')
    .then(response => response.json())
    .then(data => {
      console.log(data)
      const gifDisplay = document.getElementById("gifDisplay");
      gifDisplay.innerHTML = ""

      data.forEach(gif => {
        const gifUrl = gif.media_formats.nanogif.url
        const img = document.createElement("img")
        img.src = gifUrl;
        img.className = "gif"
        gifDisplay.appendChild(img)
        })
    })
  }
  fetch('/gif', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({search: suggestionInput})
  })
   .then(response => response.json())
   .then(data => {
      
      const gifDisplay = document.getElementById("gifDisplay");
      gifDisplay.innerHTML = ""

      console.log(data)
      

      data.forEach(gif => {
        const gifUrl = gif.media_formats.nanogif.url
        const img = document.createElement("img")
        img.src = gifUrl;
        img.className = "gif"
        gifDisplay.appendChild(img)
        })
    })
})

document.getElementById('gifDisplay').addEventListener('click', (e) => {
  if (e.target.className === 'gif') {
    let userMessage = e.target.src
    message(userMessage)

  }
})

function addHighlight(id) {
  console.log(id)
  let element = document.getElementById(id)

  element.classList.add('fa-bounce')
}

// Funkce pro odstranění třídy při opuštění myší
function removeHighlight(id) {
  let element = document.getElementById(id)
  element.classList.remove('fa-bounce')
}


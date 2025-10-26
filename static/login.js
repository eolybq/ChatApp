let loginPage = document.getElementById("loginPage")
let loginBlock = document.getElementById("login")
let registerBlock = document.getElementById("register")

document.getElementById('google').addEventListener('click', (e) => {
    e.preventDefault()
    window.location.href = ('/login/google')

})
    
        





let passwordValidator = (password) => {
    if (password.length < 6) {
        return false
    } else {
        return true
    }
}

let emailValidator = (email) => {
    if (email.includes("@")) {
        return true
    } else {
        return false
    }
}

loginPage.addEventListener('click', (e) => {
    if (e.target === document.getElementById("showRegister")) {
        loginBlock.style.display = "none"
        
        registerBlock.style.display ="block"
    }

    if (e.target === document.getElementById("showLogin")) {
        loginBlock.style.display="block"
        
        registerBlock.style.display="none"
    }

})


let registerHandler = (e) => {
    if (e.type === "click" || (e.type === "keypress" && e.key === "Enter")) {
        
        
            
            const email = document.getElementById("emailInputRegister").value
            const password = document.getElementById("passwordInputRegister").value
            const name = document.getElementById("username").value

            if (!emailValidator(email)) {
                let message = document.getElementById("invalidRegister")
                message.textContent ="Input valid email address."
                message.style.display = "block"

            } else if (!passwordValidator(password)) {
                let message = document.getElementById("invalidRegister")
                message.textContent ="Password needs to have atleast 6 characters."
                message.style.display = "block"
            
            
            } else if (name.length === 0) {

                let message = document.getElementById("invalidRegister")
                message.textContent ="Name is required."
                message.style.display = "block"

            } else {
            
                document.getElementById("invalidRegister").style.display = "none"
                let checkTerms = document.getElementById("terms")
                
                if (checkTerms.checked) {

                    document.getElementById("termsError").style.display = 'none'

                    const email = document.getElementById("emailInputRegister").value
                    const password = document.getElementById("passwordInputRegister").value
                    const username = document.getElementById("username").value

                    const data1 = {name: username, email: email, password: password, action: 'signup'}

                    console.log(data1)

                    fetch('/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data1),
                    })
                    .then(response => {
                        if (!response.ok) {
                            console.log('Chyba při komunikaci se serverem')
                        }                
                        return response.json()
                    })
                    .then(data => {

                        if (data.success == "ok") {

                            window.location.href = `${data.redirectRoute}`
                        } else {
                            let message = document.getElementById("invalidRegister")
                            message.textContent = "User already exist."
                            message.style.display = "block"
                        }
                    })
                    .catch(error => {
                        console.log('Chyba při odesílání dat:', error)
                    })
            } else {
                document.getElementById("termsError").style.display = 'block'
            }
            
    }
    }
}

document.getElementById("registerBtn").addEventListener("click", registerHandler)
document.querySelector("#emailInputRegister").addEventListener("keypress", registerHandler)
document.querySelector("#username").addEventListener("keypress", registerHandler)
document.querySelector("#passwordInputRegister").addEventListener("keypress", registerHandler)

let loginHandler = (e) => {
    
    if (e.type === "click" || (e.type === "keypress" && e.key === "Enter")) {

        
            
            const email = document.getElementById("emailInputLogin").value
            const password = document.getElementById("passwordInputLogin").value

            if (!emailValidator(email)) {
                let message = document.getElementById("invalid")
                message.textContent ="Input valid email address."
                message.style.display = "block"

            } else if (!passwordValidator(password)) {
                let message = document.getElementById("invalid")
                message.textContent ="Password needs to have atleast 6 characters."
                message.style.display = "block"
            
            
            } else {

                const data = {email: email, password: password, action: 'signin'}

                fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                })
                .then(response => {
                    if (!response.ok) {
                        console.log('Chyba při komunikaci se serverem')
                    }                
                    return response.json()
                })
                .then(data => {

                    if (data.success == "ok") {

                        window.location.href = `${data.redirectRoute}`
                    } else {
                        let message = document.getElementById("invalid")
                        message.textContent =" User doesn't exist."
                        message.style.display = "block"
                    }
                })
                .catch(error => {
                    console.log('Error:', error)
                })
            
        }
    }
}

document.getElementById("loginBtn").addEventListener("click", loginHandler)
document.querySelector("#emailInputLogin").addEventListener("keypress", loginHandler)
document.querySelector("#passwordInputLogin").addEventListener("keypress", loginHandler)

function togglePasswordVisibility(which) {
    let passwordInput = document.getElementById("passwordInput" + which);
    let toggleIcon = document.getElementById("togglePasswordIcon" + which);
  
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      toggleIcon.classList.remove("bi-eye");
      toggleIcon.classList.add("bi-eye-slash");
    } else {
      passwordInput.type = "password";
      toggleIcon.classList.remove("bi-eye-slash");
      toggleIcon.classList.add("bi-eye");
    }
  }

  
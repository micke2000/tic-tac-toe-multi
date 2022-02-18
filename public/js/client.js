const socket = io();
const boxes = document.querySelectorAll("div.line div")
const mainText = document.getElementById("main-text")
let blocked = true
let gameIsOn = false
function makeCircle(){
    const i = document.createElement('i')
    i.classList.add('fa-regular','fa-circle')
    return i    
}
function makeX(){
    const i = document.createElement('i')
    i.classList.add('fa-solid','fa-x')
    return i    
}
let markGiven = "";
socket.on("waiting-for-player",()=>{
    mainText.textContent = "Waiting for second player..."
})
socket.on("your-turn",()=>{
    socket.emit("unblock-me")
    mainText.textContent = "Make your move!"
    blocked = false
})
socket.on("game-ended",()=>{
    socket.emit("player-left-after-game")
    window.location.href = "../index.html";
})
socket.on("you-won",()=>{
    mainText.textContent = "You won!"
})
socket.on("you-won-other-left",()=>{
    mainText.textContent = "You won! Other player left!"
})
socket.on("other-player-won",()=>{
    mainText.textContent = "You lost!"
})
socket.on("game-started",userId=>{
    if(socket.id==userId){
    mainText.textContent = "Make your first move!"
    blocked = false;
    socket.emit("first-one")
    }
    else{
    mainText.textContent = "Wait for your move."
    }
    boxes.forEach(function(box){
        box.addEventListener("mouseover",function(){
            if(!blocked){
            if(!box.classList.contains("clicked")){
            box.appendChild(markGiven());
            }
        }
        })
        box.addEventListener("mouseout",function(){
            if(!blocked){
            if(!box.classList.contains("clicked")){
            try{
            box.querySelector("i").remove()
            }
            catch (e){
                if(e instanceof TypeError){}
                else throw Error.TypeError
            }    
        }
        }
        })
        box.addEventListener("click",function(){
            if(!blocked){
            if(!box.classList.contains("clicked")){
            box.classList.add('clicked')
            box.querySelector("i").remove()
            socket.emit("clicked",box.id)
            box.appendChild(markGiven());
            }
        }
        })
    })
})
socket.on("too-many-users",()=>{
    alert("Przekroczono dozwolona liczbe graczy!")
    window.location.href = "../index.html";
})
socket.on("draw",()=>{
    mainText.textContent = "Draw!"
})
socket.on("blocked",()=>{
    mainText.textContent = "Wait for your move."
    blocked = true;
})
socket.on("mark-given",mark=>{
    if(mark=="x"){
        markGiven = makeX
        alert(`You are X!`)
    }
    else{
        markGiven = makeCircle
        alert(`You are Sphere!`)
    }
    console.log(markGiven)
})
socket.on("box-marked",data=>{
    console.log(`box ${data.id} marked`)
    const box = document.getElementById(data.id)
    box.classList.add('clicked')
    if(data.mark=='x'){
    box.appendChild(makeX())
    }
    else{
        box.appendChild(makeCircle())
    }
})
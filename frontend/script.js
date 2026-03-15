let roommates=[]
let expenses=[]
let chart

document.getElementById("startBtn").onclick=()=>{
showPage(2)
}

function showPage(num){

document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"))

document.getElementById("page"+num).classList.add("active")

}

function goBack(num){
showPage(num)
}

function createRoommateInputs(){

let count=document.getElementById("roommateCount").value

let container=document.getElementById("roommateInputs")

container.innerHTML=""

for(let i=0;i<count;i++){

let input=document.createElement("input")

input.placeholder="Roommate "+(i+1)+" name"

container.appendChild(input)

}

document.getElementById("roommateNext").classList.remove("hidden")

}

function goToExpenses(){

roommates=[]

document.querySelectorAll("#roommateInputs input").forEach(i=>{

roommates.push(i.value)

})

addExpenseRow()

showPage(3)

}

function addExpenseRow(){

let row=document.createElement("div")

row.className="expenseRow"

row.innerHTML=`
<input placeholder="Expense">
<input type="number" placeholder="Amount">
`

document.getElementById("expenseContainer").appendChild(row)

}

document.getElementById("addExpenseBtn").onclick=addExpenseRow

function showSummary(){

expenses=[]

document.querySelectorAll(".expenseRow").forEach(row=>{

let name=row.children[0].value
let amount=parseFloat(row.children[1].value)

if(name && amount){

expenses.push({name,amount})

}

})

let summary=document.getElementById("summary")

summary.innerHTML=""

let total=0

expenses.forEach(e=>{

summary.innerHTML+=`<p>${e.name} - $${e.amount}</p>`

total+=e.amount

})

let perPerson=(total/roommates.length).toFixed(2)

let splitText=""

roommates.forEach(r=>{

splitText+=`<p>${r} pays $${perPerson}</p>`

})

document.getElementById("splitResult").innerHTML=splitText

showPage(4)

}

function createChart(){

let labels=expenses.map(e=>e.name)

let data=expenses.map(e=>e.amount)

if(chart) chart.destroy()

chart=new Chart(document.getElementById("expenseChart"),{

type:"bar",

data:{

labels:labels,

datasets:[{

label:"Expenses",

data:data,

backgroundColor:["#800000","#0077cc","#b30000","#3399ff","#cc4c4c"]

}]

},

options:{

responsive:true,

plugins:{

legend:{display:false}

}

}

})

}
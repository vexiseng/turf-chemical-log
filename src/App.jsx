
import { useEffect, useState } from "react";

export default function App(){

const [clients,setClients] = useState([])
const [chemicals,setChemicals] = useState([])
const [logs,setLogs] = useState([])

const [client,setClient] = useState("")
const [chemical,setChemical] = useState("")
const [date,setDate] = useState("")
const [area,setArea] = useState("")
const [notes,setNotes] = useState("")

useEffect(()=>{
loadData()
},[])

async function loadData(){

const c = await fetch("/.netlify/functions/getClients").then(r=>r.json())
const ch = await fetch("/.netlify/functions/getChemicals").then(r=>r.json())
const l = await fetch("/.netlify/functions/getLogs").then(r=>r.json())

setClients(c)
setChemicals(ch)
setLogs(l)

}

async function saveLog(){

const log = {
client,
chemical,
date,
area,
notes
}

await fetch("/.netlify/functions/saveLog",{
method:"POST",
body:JSON.stringify(log)
})

loadData()

}

return (

<div style={{padding:20}}>

<h1>Turf Chemical Log</h1>

<h2>New Application</h2>

<select onChange={e=>setClient(e.target.value)}>
<option>Select Client</option>
{clients.map(c=>(
<option key={c.id} value={c.name}>{c.name}</option>
))}
</select>

<br/>

<select onChange={e=>setChemical(e.target.value)}>
<option>Select Chemical</option>
{chemicals.map(c=>(
<option key={c.id} value={c.name}>{c.name}</option>
))}
</select>

<br/>

<input type="date" onChange={e=>setDate(e.target.value)}/>

<br/>

<input placeholder="Area Treated" onChange={e=>setArea(e.target.value)}/>

<br/>

<textarea placeholder="Notes" onChange={e=>setNotes(e.target.value)}/>

<br/>

<button onClick={saveLog}>Save Log</button>

<h2>Saved Logs</h2>

{logs.map((l,i)=>(
<div key={i} style={{background:"#fff",padding:10,marginBottom:10}}>
<b>{l.client}</b> - {l.chemical}<br/>
{l.date}<br/>
Area: {l.area}<br/>
{l.notes}
</div>
))}

</div>

)

}

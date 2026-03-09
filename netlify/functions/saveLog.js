
let logs = [];

exports.handler = async (event) => {

const data = JSON.parse(event.body)

logs.push({
...data,
id:Date.now()
})

return{
statusCode:200,
body:JSON.stringify({success:true})
}

}

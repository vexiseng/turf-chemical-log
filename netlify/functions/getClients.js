
exports.handler = async () => {

const clients=[
{id:1,name:"Sample Lawn"},
{id:2,name:"Office Property"}
]

return{
statusCode:200,
body:JSON.stringify(clients)
}

}

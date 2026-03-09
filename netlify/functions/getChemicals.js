
exports.handler = async () => {

const chemicals=[
{id:1,name:"Prodiamine"},
{id:2,name:"2,4-D"}
]

return{
statusCode:200,
body:JSON.stringify(chemicals)
}

}

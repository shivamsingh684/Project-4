const urlModel = require('../models/urlModel')
const shortid = require('shortid')
var validUrl = require('valid-url');
  

const createUrl = async function(req,res){
    try{
        if(!req.body) return  res.status(400).send({status:false,message: "Request body can't be empty"})
        if(!req.body.longUrl || typeof req.body.longUrl !== 'string') return res.status(400).send({status:false,message: "Please provide original url"})
        if(!validUrl.isUri(req.body.longUrl.trim())) return res.status(400).send({status:false,message: "Please provide a valid url"})
        let data = req.body
        let urlCode = shortid.generate().toLowerCase()
        let shortUrl = `http://localhost:3000/${urlCode}`
        data.urlCode = urlCode
        data.shortUrl = shortUrl
        let saved = await urlModel.create(data)
        res.status(201).send({status:true,data:saved})
    }
    catch(err){
        res.status(500).send(err.message)
    }
}


module.exports = {createUrl}
const urlModel = require('../models/urlModel')
const shortid = require('shortid')
const validUrl = require('valid-url');
  
const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
  13219,
  "redis-13219.c264.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true } 
);
redisClient.auth("uVRaAgcJvl5Wtrv3ZklTM29ZtRyYpnmE", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});


const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);



const createUrl = async function(req,res){
    try{
        if(!req.body) return  res.status(400).send({status:false,message: "Request body can't be empty"})
        if(!req.body.longUrl || typeof req.body.longUrl !== 'string') return res.status(400).send({status:false,message: "Please provide original url"})
        if(!validUrl.isUri(req.body.longUrl.trim())) return res.status(400).send({status:false,message: "Please provide a valid url"})
        let data = req.body

        let alreadyExist = await GET_ASYNC(`${req.body.longUrl}`)

        if(alreadyExist) {
            return res.status(201).send({status:true,data:JSON.parse(alreadyExist)})
        }
        else
        {
            let urlCode = shortid.generate().toLowerCase()
            let shortUrl = `http://localhost:3000/${urlCode}`
            data.urlCode = urlCode
            data.shortUrl = shortUrl
            let saved = await urlModel.create(data)
            await SET_ASYNC(`${req.body.longUrl}`, JSON.stringify(saved))
            res.status(201).send({status:true,data:saved})
        }
    
    }
    catch(err){
        res.status(500).send(err.message)
    }
}


const redirect = async function (req,res){
    try{
        let urlCode = req.params.urlCode
        let cachedURL = await GET_ASYNC(`${req.params.urlCode}`)

        if(cachedURL) {
            return res.status(302).send({status:true,data:JSON.parse(cachedURL).longUrl})
          } 
        else 
          {
            let urlnew = await urlModel.findOne({urlCode:urlCode})
            if(!urlnew) return (res.status(404).send({status:false,msg:"url is not present"}))
            await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(urlnew))
            res.status(302).send(urlnew.longUrl)
          }
    }
    catch(err){
        res.status(500).send(err.message)
    }
}


module.exports = {createUrl,redirect}
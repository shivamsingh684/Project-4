const urlModel = require("../models/urlModel");
const shortid = require('shortid')
const redis = require('redis')

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
    15893,
    "redis-15893.c301.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("ROAPpFNqbTN8hsjyRzO4z96Lb9NLHJhV", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});



//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient)
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient)


//====Validation=========//
const isValid = function (value) {
    if (typeof value !== "string" || value.trim().length == 0) {
        return false
    }
    return true
};


let isValidUrl = (value) => {
    let urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/


        ;
    return urlRegex.test(value)

}

const createUrl = async function (req, res) {
    try {
        let body = req.body;

        if ((Object.keys(body)).length == 0) {
            return res.status(400).send({ status: false, message: "please provide data" })
        }
        let { longUrl } = body

        let longUrlExist = await urlModel.findOne({ longUrl: longUrl }).select({ createdAt: 0, updatedAt: 0, __v: 0, _id: 0 })
        if (longUrlExist) {
            return res.status(201).send({ status: true, message: "longUrl already exists", data: longUrlExist })
        }


        if (!isValid(longUrl)) {
            return res.status(400).send({ status: false, message: "please provide Url and url should be string" })
        }

        if (!isValidUrl(longUrl)) {
            return res.status(400).send({ status: false, message: "please provide valid Url" })
        }



        let short = shortid.generate(longUrl)


        if (!short) {
            return res.status(400).send({ status: false, msg: short })
        }


        let obj = { longUrl, shortUrl: `http://localhost:3000/${short}` }
        obj.urlCode = short.toLowerCase()

        let check_in_cache = await GET_ASYNC(`${obj}`)
        if (check_in_cache) {
            return res.status(201).send({ status: true, data: obj })
        } else {
            let setUrlCode = obj.urlCode
            let setInCache = await SET_ASYNC(`${setUrlCode}`, JSON.stringify(obj))

        }


        let Data = await urlModel.create(obj)
        return res.status(201).send({ status: true, data: obj })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}




const getUrl = async function (req, res) {
    try {
        let urlCode = req.params.urlCode
        urlCode = urlCode.toLowerCase()

        if (!isValid(urlCode)) {
            return res.status(400).send({ status: false, msg: "Please Enter Valid UrlCode" })
        }
        let catchUrlData = await GET_ASYNC(`${urlCode}`)
        if (catchUrlData) {
            const urlData = JSON.parse(catchUrlData)
            return res.status(302).redirect(urlData.longUrl)
        } else {
            let findUrlCode = await urlModel.findOne({ urlCode: urlCode }).select({ longUrl: true, _id: false })
            if (!findUrlCode) {
                return res.status(404).send({ status: false, msg: "No URL Found OR Url is Incorrect" })
            }

            await SET_ASYNC(`${urlCode}`, JSON.stringify(findUrlCode))
            return res.status(302).redirect(findUrlCode.longUrl)
        }

    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })

    }

}
module.exports = { createUrl, getUrl }
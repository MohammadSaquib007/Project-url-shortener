const urlModel = require('../models/urlModel');
const isUrlValid = require('url-validation')
const shortid = require('shortid');
const baseUrl = 'http://localhost:3000'

//-----------------------------redis for cache------------------

//-----------------------------redis for cache--------------------------------------------------------
const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
    15036,
    "redis-15036.c276.us-east-1-2.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("fTrarrrXRZg7X66UGqgfMu3QA6K3fttr", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//------------------------validation functions----------------------------------------------------------


const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}
const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

//------------------------first api to generate url code-------------------------------------------------
const generateUrl = async function (req, res) {
    if (!isValidRequestBody(req.body)) {
        return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide long url' })
    }
    //destructuring
    const { longUrl } = req.body

    if (!isValid(longUrl)) {
        res.status(400).send({ status: false, message: `longUrl is required` })
        return
    }


    //check long url is valid or not-http is present or not
    if (!isUrlValid(longUrl.trim().split(' ').join(''))) {
        return res.status(400).send({ status: false, message: "longUrl is not valid, Please provide valid url" })

    }
    try {

        let myUrl = longUrl.trim().split(' ').join('')
        let url = await urlModel.findOne({ longUrl: myUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })
        if (url) {
            res.status(200).send({ status: true, data: url })
        }
        else {
            const urlCode = shortid.generate()
            const shortUrl = baseUrl + '/' + urlCode
            let shortUrlInLowerCase = shortUrl.toLowerCase()



            url = {
                longUrl: longUrl.trim().split(' ').join(''),
                shortUrl: shortUrlInLowerCase,
                urlCode: urlCode,
            }

            const myShortUrl = await urlModel.create(url)
            res.status(201).send({ status: true, data: myShortUrl })
        }
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })

    }
}

//---------------------------second api to redirect--------------------------------------------------

const redirectToLongUrl = async function (req, res) {
    try {
        const urlCode = req.params.urlCode.toLowerCase().trim().split(' ').join('')

        //finding longUrl in cache through urlCode
        let cachedUrlData = await GET_ASYNC(`${urlCode}`)

        if (cachedUrlData) {
            const parseLongUrl = JSON.parse(cachedUrlData)

            res.status(302).redirect(parseLongUrl.longUrl)
        }
        else {
            const findUrl = await urlModel.findOne({ urlCode: urlCode })
            if (!findUrl) {
                // return a not found 404 status
                return res.status(404).send({ status: false, msg: "No URL Found" })
            }
            else {
                // when valid we perform a redirect
                res.status(302).redirect(findUrl.longUrl)
                //setting or storing data  in cache
                await SET_ASYNC(`${urlCode}`, JSON.stringify(findUrl)).select({ _id: 0 })
            }
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}




module.exports.redirectToLongUrl = redirectToLongUrl

module.exports.generateUrl = generateUrl















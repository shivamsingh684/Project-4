const express = require('express')
const router = express.Router()
const urlController = require('../controller/urlController')

router.post('/url/shorten',urlController.createUrl)
router.get('/:urlCode',urlController.redirectGet)


module.exports = router
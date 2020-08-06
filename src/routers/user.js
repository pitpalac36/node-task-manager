const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/authentication')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')

const router = new express.Router()

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({
            user,
            token
        })

    } catch (error) {
        console.log(error)
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((each) => {
            return each.token !== req.token
        })
        await req.user.save()
        res.send()

    } catch (error) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()

    } catch (error) {
        res.status(500).send()
    }
})

router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try{
        await user.save()

        /*
        OBS. sendWelcome is asynchronous => it returns a promise; however there is no need to await
        (I should continue on and not wait until the email is sent)
        */
        sendWelcomeEmail(user.email)
        const token = await user.generateAuthToken()
        console.log(user)
        res.status(201).send({
            user,
            token
        })   // 201 - Created
    } catch (error) {
        console.log(error)
        res.status(400).send(error)
    }
})


const upload = multer({
    limits : {
        fileSize : 1000000
    },
    fileFilter(req, file, cb) {     // cb -> callback
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return cb(new Error('Please upload a PNG, JPG or JPEG file'))
        }
        cb(undefined, true)
    }
})

// avatar -> needs to match to the key provided by user
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    /*
    deleted the dest property (from upload) => the validated data (the file) will be passed through to this callback function;
    it is accessible on request.file
    */
    const buffer = await sharp(req.file.buffer).resize({
        width : 250,
        height : 250
    }).png().toBuffer()
    
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({
        error : error.message
    })
})


router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

// get avatar by user id
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error()
        }
        // set header
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (error) {
        console.log(error)
        res.status(404).send()
    }
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValid = updates.every((each) => allowedUpdates.includes(each))
    if (!isValid) {
        return res.status(400).send({ error : 'Invalid updates!' })
    }
    try {

        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new : true, runValidators : true })   // return the new user (updates applied); also, validations applied
        // problem : first method bypasses Mongoose middleware password encryption ; solution :

        // --------------------------------------------------------------------

        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()

        // --------------------------------------------------------------------
        
        res.send(req.user)
    } catch (error) {
        // it's possible there's a validation issue
        res.status(400).send(error)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (error) {
        console.log(error)
        res.status(500).send()
    }
})


router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({
        error : error.message
    })
})

module.exports = router
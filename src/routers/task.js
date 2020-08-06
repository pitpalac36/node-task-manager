const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/authentication')
const User = require('../models/user')

const router = new express.Router()


router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,    // ES6 spread operator; copies all the properties from body over to this object
        owner : req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})


/*
    limit; skip
    GET /tasks?limit=10
    GET /tasks?limit=10&skip=5
    GET /tasks?sortBy=createdAt:desc
*/
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1   // ternary operator
    }

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    try {
        await req.user.populate({
            path : 'tasks',
            match,
            options : {
                limit : parseInt(req.query.limit),   // if limit isn't provided or it's not a number mongoose will ignore this
                skip : parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (error) {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({ _id, owner : req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (error) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const allowedUpdates = ['description', 'completed']
    const updates = Object.keys(req.body)
    const isValid = updates.every((each) => allowedUpdates.includes(each))
    if (!isValid) {
        return res.status(400).send({ error : 'Invalid updates!' })
    }
    try {
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new : true, runValidators : true })
        const task = await Task.findOne({ _id : req.params.id, owner : req.user._id })
        if (!task) {
            res.status(404).send()
        }
        updates.forEach((update) => task[update] = req.body[update])
        task.save()
        res.send(task)
    } catch (error) {
        res.status(500).send()
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id : req.params.id, owner : req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (error) {
        res.status(500).send()
    }
})

module.exports = router
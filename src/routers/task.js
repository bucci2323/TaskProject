const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()
const Joi = require('joi')
const validator = require('validator')

const taskSchema = Joi.object().keys({
    description: Joi.string().required(),
    status: Joi.string(),
    level: Joi.string()
})

router.post('/tasks', auth, async (req, res) => {

    try {
        const { error, value } = taskSchema.validate(req.body);

        if (error) {
            throw new Error(error.details[0].message)
        }

        const task = new Task({
            ...value,
            owner: req.user._id
        })

        await task.save()
        res.status(201).send(task)
    } catch (e) {
        console.log(e)
        res.status(400).send(e)
    }

})

router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}
    if (req.query.level) {
        match.level = req.query.level === 'low'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {

        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        })
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send(e)
    }

})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }

})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    allowedUpdates = ['description', 'level' , 'status']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        res.status(400).send({ error: "Invalid updates" })
    }
    try {
        const task = await Task.findOne({ _id: req.params._id, owner: req.user._id })

        if (!task) {
            return res.status(404).send()
        }

        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})


router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        
        res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router
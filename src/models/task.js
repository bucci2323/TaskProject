
const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    status: {
        type: String,
        default: 'pending'
    },
    level: {
        type: String,
        default: 'medium'
    }
}, {
    timestamps: true
})

const Task = mongoose.model('Task', taskSchema)
module.exports = Task


const mongoose = require('mongoose')
const User = require('./user')

const taskSchema = new mongoose.Schema({
    description : {
        type : String,
        trim : true,
        required : true
    },
    completed : {
        type : Boolean,
        default : false
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'User'   // create reference from this field (owner) to another model
    }
},
{
    timestamps : true
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task

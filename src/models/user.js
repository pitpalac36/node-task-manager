const mongoose = require( 'mongoose')
const validator = require('validator')
const bcryptjs = require('bcryptjs')
const jsonwebtoken = require('jsonwebtoken')
const Task = require('../models/task')

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
        trim : true
    }, 
    email : {
        type : String,
        required : true,
        trim : true,
        unique : true,
        lowercase : true,
        validate (value) {
            if (!validator.isEmail(value)) {
                throw new Error ('Email is invalid')
            }
        }
    },
    password : {
        type : String,
        required : true,
        trim : true,
        minlength : 7,
        validate (value) {
            if (value.toLowerCase().includes('password'))
                throw new Error ('Password cannot contain "password"')

        }
    },
    age : {
        type : Number,
        default : 0,
        validate (value) {
            if (value < 0) {
                throw new Error('Age must be a positive number')
            }
        }
    },
    tokens : [{
        token : {
            type : String,
            required : true
        }
    }],
    avatar : {
        type : Buffer
    }
}, {
    timestamps : true
})

// not stored in the db; it's just a way to relate users and tasks
userSchema.virtual('tasks', {
    ref : 'Task',
    localField : '_id',
    foreignField : 'owner'
})


userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email : email })
    if (!user) {
        throw new Error ('Unable to login')
    }
    const isMatch = await bcryptjs.compare(password, user.password)
    if (!isMatch) {
        throw new Error ('Unable to login')
    }
    return user
}

userSchema.methods.generateAuthToken = async function () {
    const token = jsonwebtoken.sign({ _id: this._id.toString() }, process.env.JWT_SECRET)
    //console.log(token)
    this.tokens = this.tokens.concat({ token })
    console.log(this.tokens)
    await this.save()
    return token
}

// response.send calls JSON.stringify() behind the scenes; 
// toJSON manipulates the properties sending back only the ones we want to expose
userSchema.methods.toJSON = function () {
    const userObject = this.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcryptjs.hash(user.password, 8)
    }
    next()
})


// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner : user._id })
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User

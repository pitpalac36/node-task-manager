const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOneId, userOne, setupDB } = require('./fixtures/db')

beforeEach(setupDB)

test('Should signup a new user', async () => {
    const response = await request(app)
    .post('/users')
    .send({
        name : 'Ana Leskova',
        email : 'analeskova@example.com',
        password : 'unudoitreipatruunudoitreipatru'
    })
    .expect(201)

    // Assert that the db was changed correctly (fetch the user)
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // Assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name : 'Ana Leskova',
            email : 'analeskova@example.com'
        },
        token: user.tokens[0].token   
    })
    expect(user.password).not.toBe('unudoitreipatruunudoitreipatru')
})


test('Should login existing user', async () => {
    const response = await request(app)
    .post('/users/login')
    .send({
        email: userOne.email,
        password: userOne.password
    })
    .expect(200)
    // fetch user; assert the token in response matches user's second token
    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login nonexistent user', async () => {
    await request(app)
    .post('/users/login')
    .send({
        email: 'nonexistent@example.com',
        password: 'somepasswd1234!!!'
    })
    .expect(400)
})

test('Should get profile for user', async () => {
    await request(app)
    .get('/users/me')
    .set('authorization', `Bearer ${userOne.tokens[0].token}`)  // set up authorization header
    .send()
    .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
    .get('/users/me')
    .send()
    .expect(401)    // unauthorized
})

test('Should delete account for user', async () => {
    await request(app)
    .delete('/users/me')
    .set('authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
})

test('Should upload avatar image', async () => {
    await request(app)
    .post('/users/me/avatar')
    .set('authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')   // provided by supertest, allowing to attach files; args : form field we want to set (my server is configured to search for 'avatar'), path to file (from root)
    .expect(200)
    
    const user = await User.findById(userOneId)
    
    /* OBS. expect({}).toBe({}) -> would fail; toBe uses '===' operator and objects are never equal to other objects!!
        toEqual compares properties on the objects
    */
    expect(user.avatar).toEqual(expect.any(Buffer)) // check if avatar was uploaded correctly and is stored as Buffer
})

test('Should update valid user fields', async () => {
    await request(app)
    .patch('/users/me')
    .set('authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        name: 'Anuska'
    })
    .expect(200)
    
    const user = await User.findById(userOneId)
    expect(user.name).toBe('Anuska')
})


test('Should not update valid user fields', async () => {
    await request(app)
    .patch('/users/me')
    .set('authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        location: 'Yo mama'
    })
    .expect(400)
})


//
// Other User Test Ideas
//
// Should not signup user with invalid name/email/password
// Should not update user if unauthenticated
// Should not update user with invalid name/email/password
// Should not delete user if unauthenticated
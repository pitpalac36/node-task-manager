const request = require('supertest')
const Task = require('../src/models/task')
const { 
    userOneId,
    userOne,
    userTwoId,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    setupDB 
} = require('./fixtures/db')
const app = require('../src/app')

// OBS. in package.json, jest option added : --runInBand -> making sure the tests run in series and don't interfere with each other

beforeEach(setupDB)

test('Should create task for user', async () => {
    const response = await request(app)
    .post('/tasks')
    .set('authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        description: 'From my test'
    })
    .expect(201)

    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
    expect(task.completed).toBe(false)
})

test('Should fetch user tasks', async () => {
    const response = await request(app)
    .get('/tasks')
    .set('authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    expect(response.body.length).toEqual(2)
})

test('Should not delete other users task', async () => {
    const response = request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404)
    const task = Task.findById(taskOne._id)
    expect(task).not.toBeNull()
})


//
// Other Task Test Ideas
//
// Should not create task with invalid description/completed
// Should not update task with invalid description/completed
// Should delete user task
// Should not delete task if unauthenticated
// Should not update other users task
// Should fetch user task by id
// Should not fetch user task by id if unauthenticated
// Should not fetch other users task by id
// Should fetch only completed tasks
// Should fetch only incomplete tasks
// Should sort tasks by description/completed/createdAt/updatedAt
// Should fetch page of tasks
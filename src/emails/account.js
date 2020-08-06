const sgmail = require('@sendgrid/mail')
const mail = require('@sendgrid/mail')

sgmail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgmail.send({
        to : mail,
        from : 'lauradunca1005@gmail.com',
        subject : 'Thanks for joining in!',
        text : `Welcome to the app, ${name}. Let me know how you get along with the app!`   // ES6 template string
    })
}

const sendCancelationEmail = (email, name) => {
    sgmail.send({
        to : email,
        from : 'lauradunca1005@gmail.com',
        subject : 'We are sorry to see you go',
        text : `Goodbye, ${name}. Is there anything we could have done to keep you on board?`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}
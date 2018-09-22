const express = require('express');
const request = require('request');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const PORT = process.env.PORT;
const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({extended : false}));

app.use(express.static(path.join(__dirname, 'front/dist')));

app.post('/api/contact-us', (req, res) => {
  if(!req.body['g-recaptcha-response']) {
    return res.json({"responseCode" : 1,"responseDesc" : "Please select captcha"});
  }
  const secretKey = process.env.CAPTCHA_SECRET;
  const verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'];

  request(verificationUrl,function(error, response, body) {
    body = JSON.parse(body);
    if(body.success !== undefined && !body.success) {
      return res.json({"responseCode" : 1,"responseDesc" : "Не правильно введена captcha"});
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE || true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Honest" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_TO,
      subject: 'Форма обратной связи',
      text: `${req.body.name} \n ${req.body.email} \n ${req.body.description}`,
      html: `${req.body.name} <br /> ${req.body.email} <br /> ${req.body.description}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (!error) {
        res.json({"responseCode" : 0,"responseDesc" : "Sucess"});
      } else {
        res.json({"responseCode" : 1,"responseDesc" : "Произошла ошибка. Попробуйте еще раз"});
      }
    });
  });
});

app.listen(PORT);

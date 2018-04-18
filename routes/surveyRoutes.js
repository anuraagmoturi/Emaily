const _ = require('lodash');
const Path = require('path-parser');
const {URL} = require('url');
const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const requireCredits = require('../middlewares/requireCredits');
const Mailer = require('../services/Mailer');
const surveyTemplate = require('../services/emailTemplates/surveyTemplate');

const clearCache = require('../middlewares/clearCache');

const Survey = mongoose.model('surveys');

module.exports = app => {

  app.get('/api/surveys',requireLogin, clearCache, async (req,res) => {
    //---redis---

    // const redis = require('redis');
    // const redisUrl = 'redis://127.0.0.1:6379';
    // const client = redis.createClient(redisUrl);
    // const util = require('util');
    // client.get = util.promisify(client.get);

    // check cached data in redis
    //const cachedSurveys = await client.get(req.user.id);

    // if(cachedSurveys){
    //   console.log('SERVING FROM REDIS');
    //   return res.send(cachedSurveys);
    // }

    const surveys = await Survey.find({ _user: req.user.id })
        .select({recipients: false})
        .cache({ key: req.user.id });

    //console.log('SERVING FROM MONGODB');

    res.send(surveys);

    //client.set(req.user.id, JSON.stringify(surveys));
  });

  app.get('/api/surveys/:surveyId/:choice', (req, res) => {
    res.send('Thanks for voting!');
  });

  app.post('/api/surveys', requireLogin, requireCredits, async (req, res) => {
    const {title, subject, body, recipients} = req.body;

    const survey = new Survey({
      title,
      subject,
      body,
      recipients: recipients.split(',').map(email => ({email:email.trim()})),
      _user: req.user.id,
      dateSent: Date.now()
    });


    const mailer = new Mailer(survey, surveyTemplate(survey));

    try {
      await mailer.send();

      await survey.save();

      req.user.credits -= 1;
      const user = await req.user.save();

      res.send(user);
    } catch (err) {
      res.status(422).send(err);
    }


  });

  app.post('/api/surveys/webhooks', (req, res) => {
    const p = new Path('/api/surveys/:surveyId/:choice');

  const events =_.chain(req.body)
        .map(({email, url}) => {
          const match = p.test(new URL(url).pathname);

          if (match) {
            return {email, surveyId: match.surveyId, choice: match.choice};
          }
        })
        .compact()
        .uniqBy('email', 'surveyId')
        .each(({email, surveyId, choice}) => {
          Survey.updateOne({
            _id: surveyId,
            recipients: {
              $elemMatch:{
                email: email,
                responded: false
              }
            }
          },{
            $inc: {[choice]: 1},
            $set: { 'recipients.$.responded': true },
            lastResponded: new Date()
          }).exec();
        })
        .value();

  console.log("events: ",events);

    res.send({});


  });
};
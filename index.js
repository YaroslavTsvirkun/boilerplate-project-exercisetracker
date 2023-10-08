const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect(process.env.DB_URL);

const UserSchema = new Schema({
  username: String
});

const ExcersiseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date
});

mongoose.Schema.name = 'Exercise Tracker';
const User = mongoose.model('User', UserSchema);
const Excersise = mongoose.model('Excersise', ExcersiseSchema);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  const userObj = new User({ username: req.body.username });

  try {
    const user = await userObj.save();
    //console.log(user);
    res.json(user);
  } catch (err) {
    console.log(err);
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const user_id = req.params._id;
  try {
    const user = await User.findById(user_id);

    if (!user) {
      res.send('Could not find user');
    } else {
      const exerciseObj = new Excersise({
        user_id: user_id,
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date ? new Date(req.body.date) : new Date()
      });

      const exercise = await exerciseObj.save();
      console.log(user);
      console.log(exercise);
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      });
    }
  } catch (err) {
    console.log(err);
    res.send('Thare was an error saving the excercise');
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}).select("_id username");

    if (!users) {
      res.send('Could not find user');
    } else {
      res.json(users);
    }
  } catch (err) {
    console.log(err);
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const user_id = req.params._id;
  const from = req.query.from ? new Date(req.query.from) : new Date(0);
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const limit = req.query.limit ? parseInt(req.query.limit) : 0;

  try {
    const user = await User.findById(user_id);

    if (!user) {
      res.send('Could not find user');
    } else {
      const excersises = await Excersise.find({ user_id: user_id })
        .select("description duration date")
        .where('date').gte(from).lte(to).limit(limit);

      if (!excersises) {
        res.send('Could not find excersises');
      } else {
        const log = excersises.map((excersise) => {
          return {
            description: excersise.description,
            duration: excersise.duration,
            date: excersise.date.toDateString()
          }
        });

        res.json({
          username: user.username,
          count: log.length,
          _id: user._id,
          log: log
        });
      }
    }
  } catch (err) {
    console.log(err);
  }
});

app.get('/api/users/:_id/logs?[from][&to][&limit]', (req, res) => {
  const user_id = req.params._id;
  const from = req.query.from ? new Date(req.query.from) : new Date(0);
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const limit = req.query.limit ? parseInt(req.query.limit) : 0;
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

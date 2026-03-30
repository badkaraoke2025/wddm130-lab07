
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const { check, body, validationResult } = require('express-validator');
const Submission = require('./models/Submission');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab7DB';

mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err.message));

function emptyFormData() {
  return {
    name: '',
    email: '',
    phone: '',
    postcode: '',
    lunch: '',
    tickets: '',
    campus: ''
  };
}

app.get('/', (req, res) => {
  res.render('form', {
    pageTitle: 'Lab 7 - Ticket Order Form',
    currentPage: 'form',
    errors: [],
    data: emptyFormData(),
    result: null
  });
});

app.post('/submit', [
  check('name').trim().notEmpty().withMessage('Name is required'),
  check('email').trim().notEmpty().withMessage('Email is required').bail().isEmail().withMessage('Email is not valid'),
  check('phone')
    .trim()
    .matches(/^\(?(\d{3})\)?[\.\-\/\s]?(\d{3})[\.\-\/\s]?(\d{4})$/)
    .withMessage('Phone is not in correct format'),
  check('postcode')
    .trim()
    .customSanitizer(value => value.toUpperCase())
    .matches(/^[A-Z][0-9][A-Z]\s[0-9][A-Z][0-9]$/)
    .withMessage('Post code is not in correct format'),
  check('lunch').notEmpty().withMessage('You must select a lunch option'),
  check('campus').notEmpty().withMessage('Please select a campus'),
  check('tickets')
    .notEmpty().withMessage('Tickets must be a valid number')
    .bail()
    .isNumeric().withMessage('Tickets must be a valid number')
    .bail()
    .custom(value => {
      if (Number(value) <= 0) {
        throw new Error('Tickets must be greater than 0');
      }
      return true;
    }),
  body('lunch').custom((value, { req }) => {
    if (value === 'yes' && Number(req.body.tickets) < 3) {
      throw new Error('Lunch can only be purchased when buying 3 or more tickets.');
    }
    return true;
  })
], async (req, res) => {
  const errors = validationResult(req).array();

  const data = {
    name: req.body.name || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    postcode: req.body.postcode ? req.body.postcode.toUpperCase() : '',
    lunch: req.body.lunch || '',
    tickets: req.body.tickets || '',
    campus: req.body.campus || ''
  };

  if (errors.length > 0) {
    return res.status(400).render('form', {
      pageTitle: 'Lab 7 - Ticket Order Form',
      currentPage: 'form',
      errors,
      data,
      result: null
    });
  }

  const tickets = Number(req.body.tickets);
  let subtotal = tickets * 100;
  if (req.body.lunch === 'yes') {
    subtotal += 60;
  }
  const tax = subtotal * 0.13;
  const total = subtotal + tax;

  const submission = new Submission({
    name: data.name,
    email: data.email,
    phone: data.phone,
    postcode: data.postcode,
    campus: data.campus,
    tickets,
    lunch: data.lunch,
    subtotal,
    tax,
    total
  });

  await submission.save();

  res.render('form', {
    pageTitle: 'Lab 7 - Ticket Order Form',
    currentPage: 'form',
    errors: [],
    data: emptyFormData(),
    result: {
      ...data,
      tickets,
      subtotal,
      tax,
      total,
      savedMessage: 'Submission saved to MongoDB'
    }
  });
});

app.get('/submissions', async (req, res) => {
  const submissions = await Submission.find().sort({ createdAt: -1 });

  res.render('submissions', {
    pageTitle: 'Lab 7 - Saved Submissions',
    currentPage: 'submissions',
    submissions
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

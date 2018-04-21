jest.setTimeout(30000);
require('../models/Users');

const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);



var express = require('express');
var router = express.Router();
var User = require('../models/User');
var users = require('../lib/Users');

router.get('/:username',
  users.loadByUsername,
  users.sendOne);

router.post('/',
  users.create,
  users.sendOne);

router.get('/',
  users.loadAll,
  users.sendAll);

router.put('/:username',
  users.loadByUsername,
  users.update,
  users.sendOne);

router.delete('/:username',
  users.loadByUsername,
  users.remove,
  users.end);

module.exports = router;
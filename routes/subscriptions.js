var express = require('express');
var router = express.Router();
var user = require('../lib/UserController');
var subs = require('../lib/SubscriptionController');

router.get('/:subId',
  user.loginOrContinue,
  user.loadLoggedInUser,
  subs.loadByIdentifier,
  subs.ownedByUser,
  subs.sendOne);

router.post('/',
  subs.create,
  subs.sendOne);

router.put('/:subId',
  user.loginOrContinue,
  user.loadLoggedInUser,
  subs.loadByIdentifier,
  subs.ownedByUser,
  subs.update,
  subs.sendOne);

router.delete('/:subId',
  user.loadLoggedInUser,
  subs.loadByIdentifier,
  subs.ownedByUser,
  subs.remove,
  subs.end);

module.exports = router;
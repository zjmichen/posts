var express = require('express');
var router = express.Router();
var Post = require('../models/Post');
var posts = require('../lib/Posts');

router.get('/:slug',
  posts.loadBySlug,
  posts.checkAuth,
  posts.sendOne);

router.post('/',
  posts.create,
  posts.sendOne);

router.get('/',
  posts.loadAll,
  posts.sendAll);

router.put('/:slug',
  posts.loadBySlug,
  posts.update,
  posts.sendOne);

module.exports = router;

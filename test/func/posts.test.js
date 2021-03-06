var request = require('supertest');
var app = require('../../app');
var should = require('chai').should();
var Post = require('../../models/Post');
var User = require('../../models/User');
var mongoose = require('mongoose');
var testUtils = require('../testUtils');
mongoose.models = {};
mongoose.modelSchemas = {};

describe('Post routes', function() {
  var testPost, ownPost, testUser, cookies;

  before(function(done) {
    mongoose.connect('mongodb://localhost/test', function() {
      done();

    });
  });

  after(function(done) {
    mongoose.disconnect(done);
  });

  beforeEach(function(done) {
    testUser = new User({
      username: 'testUser',
      password: 'asdf'
    });

    testUser.save(function(err) {
      if (err) return done(err);

      testUtils.loginUser(app, testUser, function(err, sessionCookies) {
        if (err) return done(err);

        cookies = sessionCookies;

        testPost = new Post({
          'title': 'Test Post',
          'body': 'Please ignore.',
          'isPrivate': false,
          'owner': new mongoose.Types.ObjectId()
        });

        testPost.save(function(err) {
          if (err) return done(err);

          ownPost = new Post({
            title: 'My Post',
            body: 'asdf',
            owner: testUser._id
          });

          ownPost.save(done);
        });
      });
    });

  });

  afterEach(function(done) {
    testUser.remove(function(err) {
      if (err) return done(err);

      testPost.remove(done);
    });
  });

  describe('POST /posts/', function() {
    after(function(done) {
      Post.remove({}, done);
    });

    it('should allow a logged in user to post', function(done) {
      var req = request(app).post('/posts/');
      req.cookies = cookies;
      req.accept('json')
        .send({ title: 'Test Post', body: 'Please ignore.' })
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          res.body.post.owner.should.equal(testUser._id.toString());
          done();
        });
    });

    it('should not allow posting when not logged in', function(done) {
      request(app)
        .post('/posts/')
        .accept('json')
        .send({ title: 'Test Post', body: 'Please ignore.' })
        .expect(401)
        .end(function(err) {
          if (err) return done(err);

          done();
        });
    });

    it('should return the URL of the new post', function(done) {
      var req = request(app).post('/posts/');
      req.cookies = cookies;
      req.accept('json')
        .send({ title: 'Test Post', body: 'Please ignore.' })
        .end(function(err, res) {
          if (err) return done(err);

          should.exist(res.body.url);
          done();
        });
    });

    it('should create unique slugs for identically named posts', function(done) {
      var req = request(app).post('/posts/');
      req.cookies = cookies;
      req.accept('json')
        .send({ title: 'Unique Post', body: 'Body 1' })
        .end(function(err, res) {
          if (err) return done(err);

          should.exist(res.body.post.slug);
          res.body.post.slug.should.equal('Unique-Post');

          req = request(app).post('/posts/');
          req.cookies = cookies;
          req.accept('json')
            .send({ title: 'Unique Post', body: 'Body 2' })
            .end(function(err, res) {
              if (err) return done(err);

              should.exist(res.body.post.slug);
              res.body.post.slug.should.not.equal('Unique-Post');

              done();
            });
        });
    });
  });

  describe('GET /posts/:slugOrId', function() {
    var privatePost, privateOwnPost;

    beforeEach(function(done) {
      privatePost = new Post({
        'title': 'Private Post',
        'body': 'Don\'t look.',
        'isPrivate': true
      });

      privateOwnPost = new Post({
        'title': 'My Private Post',
        'body': 'My secrets.',
        'isPrivate': true,
        'owner': testUser._id
      });

      privatePost.save(function(err) {
        if (err) return done(err);

        privateOwnPost.save(done);
      });
    });

    afterEach(function(done) {
      Post.remove({}, function(err) {
        if (err) return done(err);

        User.remove({}, done);
      });
    });

    it('should get a post by slug', function(done) {
      request(app)
        .get('/posts/' + testPost.slug)
        .accept('json')
        .end(function(err, res) {
          if (err) return done(err);

          res.body.post.title.should.equal(testPost.title);
          res.body.post.body.should.equal(testPost.body);
          done();
        });
    });

    it('should get a post by id', function(done) {
      request(app)
        .get('/posts/' + testPost._id)
        .accept('json')
        .end(function(err, res) {
          if (err) return done(err);

          res.body.post.title.should.equal(testPost.title);
          res.body.post.body.should.equal(testPost.body);
          done();
        });
    });

    it('should not get a private post', function(done) {
      request(app)
        .get('/posts/' + privatePost.slug)
        .accept('json')
        .expect(401)
        .end(function(err) {
          if (err) return done(err);
          done();
        });
    });

    it('should get a private post if logged in user owns it', function(done) {
      var req = request(app).get('/posts/' + privateOwnPost.slug);
      req.cookies = cookies;
      req.accept('json')
        .expect(200)
        .end(function(err) {
          if (err) return done(err);
          done();
        });
    });

  });

  describe('GET /posts', function() {
    before(function(done) {
      Post.create([
        { title: 'Post 1', body: 'asdf' },
        { title: 'Post 2', body: 'qwer' },
        { title: 'Post 3', body: 'zxcv', isPrivate: true }
      ], done);
    });

    after(function(done) {
      Post.remove({}, done);
    });

    it.skip('should get a list of all public posts', function(done) {
      request(app)
        .get('/posts/')
        .accept('json')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          should.exist(res.body.posts);

          // count up the private posts we got back
          res.body.posts.reduce(function(val, item) {
            return val + (item.isPrivate ? 1 : 0);
          }, 0).should.equal(0);

          res.body.posts[0].isPrivate.should.equal(false);
          done();
        });
    });
  });

  describe('PUT /posts/:id', function() {
    it('should update an existing, owned post', function(done) {
      var updates = {
        title: 'Updated Title',
        body: 'Updated body.',
        isPrivate: true
      };

      var req = request(app).put('/posts/' + ownPost._id);
      req.cookies = cookies;
      req.send(updates)
        .accept('json')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          res.body.post.title.should.equal(updates.title);
          res.body.post.body.should.equal(updates.body);
          res.body.post.isPrivate.should.equal(updates.isPrivate);
          done();
        });
    });

    it('should not update a post the logged in user does not own', function(done) {
      var updates = {
        title: 'Updated Title',
        body: 'Updated body.',
        isPrivate: true
      };

      var req = request(app).put('/posts/' + testPost._id);
      req.cookies = cookies;
      req.send(updates)
        .accept('json')
        .expect(403)
        .end(function(err) {
          if (err) return done(err);

          done();
        });
    });

    it('should update the published date when published', function(done) {
      var updates = {
        isPrivate: false
      };

      var req = request(app).put('/posts/' + ownPost._id);
      req.cookies = cookies;
      req.send(updates)
        .accept('json')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          should.exist(res.body.post.published);
          done();
        });
    });
  });

  describe('DELETE /posts/:id', function() {

    it('should remove the post if owned', function(done) {
      var newUser = new User({
        username: 'asdfasdfasdf',
        password: 'asdf'
      });
      var newPost = new Post({
        title: 'asdvadfg',
        body: 'akdhfb',
        owner: newUser._id
      });
      newUser.save(function(err) {
        if(err) return done(err);

        newPost.save(function(err) {
          if(err) return done(err);

          testUtils.loginUser(app, newUser, function(err, sessionCookies) {

            var req = request(app).delete('/posts/' + newPost._id);
            req.cookies = sessionCookies;
            req.accept('json')
              .expect(200)
              .end(function(err) {
                if (err) return done(err);
                done();
              });

          });
        });
      });
    });

    it('should not remove the post if not owned', function(done) {
      request(app)
        .delete('/posts/' + testPost._id)
        .accept('json')
        .expect(401)
        .end(function(err) {
          if (err) return done(err);
          done();
        });
    });
  });

});
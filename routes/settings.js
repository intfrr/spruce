var express = require('express');
var router = express.Router();
var path = require('path');
var guid = require('guid');
var mv = require('mv');
var db = require('../utils/handlers/user');
var formParser = require('../utils/form-parser.js');
const fs = require('file-system');
/* GET users listing. */
router.get('/', function(req, res, next) {
  db.findOne({username:req.session.user}, (err, user) => {
  	res.render('me/index', {
  		title: req.app.conf.name,
  		user: user
  	});
  })

});

router.get('/post/:action/:query', function(req, res, next) {
  switch (req.params.action) {
    case "edit":
      res.render('index');
      break;
    case "delete": {
			db.findOne({username:req.session.user}, (err, u) => {
				let id = req.params.query
				console.log(u);
				fs.unlinkSync('./public' + u.posts[u.posts.indexOf(u.posts.find(x => x._id == id))].static_url);
				u.posts.splice(u.posts.indexOf(u.posts.find(x => x._id == id)), 1);
				u.save(err => {
					if (err) throw err;
					console.log('Post deleted');
					res.redirect('/')
				})
			});
		}
      break;
    default:res.send("hi")

  }
})

router.get('/upload', function(req, res, next) {

		res.render('upload/file-upload', {
			title:req.app.conf.name,
			user: req.session.user
		})

})
router.post('/upload', formParser,function(req, res, next) {
			// Generate a random id
			var random_id = guid.raw();
			// Assign static_url path
			var oldpath = req.files.filetoupload.path;
		    var newpath = path.join(__dirname, `../public/feeds/${req.session.user}_${random_id}${req.files.filetoupload.name}`);
		    var final_location = `/feeds/${req.session.user}_${random_id}${req.files.filetoupload.name}`;

		    console.log(`${oldpath} - OldPath\n ${newpath} - Newpath\n ${final_location} - DiskLocation\n`)
		    // Finally upload the file to disk and save the feed to users profile
			mv(oldpath, newpath, function (err) {
				console.log('moving files')
			db.findOne({username:req.session.user}, (err, u) => {
				console.log(u)
				u.posts.push({
					_id:random_id,
					author:req.session.user,
					static_url:final_location,
					caption:req.body.caption,
					category:req.body.type,
					comments:[],
					likes:[],
					type:'image',
					createdAt:new Date(),
					lastEditedAt:new Date()
				})
				u.save(err => {
					if (err) throw err;
					console.log('Post saved')
					// Redirect back after the job is done.
					res.redirect('/')
				})
			})
		})
})
module.exports = router;

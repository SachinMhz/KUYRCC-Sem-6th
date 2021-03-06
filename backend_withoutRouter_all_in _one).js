const express = require('express');
const passport=require('passport');
const path=require('path');
const mongoose=require('mongoose');
const bodyParser=require('body-parser');
const expressValidator = require('express-validator');
const flash =  require('connect-flash');
const session = require('express-session');
const config=require('./config/database');
const bcrypt=require('bcryptjs');


mongoose.connect('mongodb://localhost:27017/KUYRCCdb');
let db = mongoose.connection;
//this line was added
//check db connection
db.once('open', function(){
	console.log('connected to mongoDB');
});

//check for db errors
db.on('error', function(err){
	console.log(err);
});

//init backend
const backend=express();

//defining path to img folder
backend.use(express.static('img'));
backend.use(express.static(__dirname + "/public"));
backend.use('/scripts', express.static(__dirname + '/path/to/scripts'));
//backend.use(express.static(path.join(__dirname,'nameOfFile')));

//Bring in models
let dbvariable = require('./models/users');
let eventVariable = require('./models/events');
let contactVariable = require('./models/contacts')

//passport config
require('./config/passport')(passport);

//passport middleware
backend.use(passport.initialize());
backend.use(passport.session());

//setting global variables
backend.use(function(req,res,next){
		res.locals.usersGlobal = req.users || null;
		console.log('from backend.use');
		console.log(req.users);
		console.log(res.locals.usersGlobal);
		next();
});

//Login Route
backend.get('/login', function(req, res){
			res.render('login');
			console.log("loginROute");
});


//setting global user variable for all url
backend.get('*', function(req,res,next){
	res.locals.usersGlobal=req.users || null;
	console.log(res.locals.usersGlobal);
	next();
	if(!req.users){
		console.log('Express session is not started');
	}
	else{
		console.log('Express session is started');
	}
});

//express Session middle Middleware
backend.use(session({
	secret: 'keyboard cat',
	resave: true,
	saveUninitialized: true
}));

//express Message  Middlewar
backend.use(require('connect-flash')());
backend.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//express validator Middlewar
backend.use(expressValidator());

//load view engine
backend.set('views', path.join(__dirname, 'views'));
backend.set('view engine','pug');

//Body parser Middleware
// parse application/x-www-form-urlencoded
backend.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
backend.use(bodyParser.json())

//home route
backend.get('/', function(req, res){
				res.render('index',{
				title:'KUYRCC'
	});
});
//FrontEnd page route
backend.get('/frontend', function(req, res){
		eventVariable.find({}, function(err, events){
			if(err){
				console.log(err);
			}
			else{
				res.render('frontend',{
					title:'FrontEnd',
					events: events
				});
			}
		});
});

//add route
backend.get('/registerPage', function(req, res){
	res.render('register',{
		title:'Register'
	});
});

//users Events
//add routes for creating events
backend.get('/users/eventList/CreateEvent', function(req, res){
	res.render('events',{
		title:'Events'
	});
});

//Get Single Event
backend.get('/users/eventList/:id', function(req, res){
	eventVariable.findById(req.params.id, function(err, events){
		res.render('single_event',{
			events: events
		});
	});
});
//for checking if events are created in database or not route
backend.get('/users/eventList', function(req, res){
	eventVariable.find({}, function(err, events){
		if(err){
			console.log(err);
		}
		else{
			res.render('eventList',{
				title:'All Events',
				events: events
			});
		}
	});
});

//add event creation and submission route
backend.post('/users/eventList/CreateEvent', function(req, res){
	console.log('submitted');
	let x= new eventVariable();
	x.event_name=req.body.event_name;
	x.event_body=req.body.event_body;

	console.log(req.body.event_name);

	x.save(function(err){
		if(err){
			console.log(err);
			return;
		}
		else{
			res.redirect('/');
		}
	});

	return;
});


//Edit Event
backend.get('/users/eventList/edit/:id', function(req, res){
	eventVariable.findById(req.params.id, function(err, events){
		res.render('edit_event',{
			events: events

		});
	});

});

//update event submission route
backend.post('/users/eventList/edit/:id', function(req, res){
	let x= {};
	x.event_name=req.body.event_name;
	x.event_body=req.body.event_body;

	//console.log(req.body.event_name);

	let query = {_id:req.params.id}
	eventVariable.update(query, x, function(err){
		if(err){
			console.log(err);
			return;
		}
		else{
			res.redirect('/');
		}
	});

	return;
	console.log('updated');
});

backend.delete('/users/eventList/:id', function(req, res){
	let query = {_id:req.params.id}
	eventVariable.remove(query, function(err){
		if(err){
			console.log(err);

		}
		res.send('success');
	});
});

//for checking if contacts are created in database or not route
backend.get('/users/contacts', function(req, res){
	contactVariable.find({}, function(err, contacts){
		if(err){
			console.log(err);
		}
		else{
			res.render('contacts',{
				title:'All Contacts',
				contacts: contacts
			});
		}
	});

});

//add routes for creating contact
backend.get('/users/contacts/add_contact', function(req, res){
	res.render('add_contact',{
		title:'Contacts'

	});

});

//Get Single Contact
backend.get('/users/contacts/:id', function(req, res){
	contactVariable.findById(req.params.id, function(err, contacts){
		res.render('single_contact',{
			contacts: contacts

		});
	});

});

//Add contact submission route
backend.post('/users/contacts/add_contact', function(req, res){
	let x = new contactVariable();
	x.Name = req.body.Name;
	x.Email_id = req.body.Email_id;
	x.Mobile_no = req.body.Mobile_no;

	x.save(function(err){
		if (err){
			console.log(err);
			return;
		}
		else{
			res.redirect('/users/contacts');
		}
	});
	console.log(req.body.Name);
	console.log('submitted');
	return;
});

//Edit Contact
backend.get('/users/contacts/edit/:id', function(req, res){
	contactVariable.findById(req.params.id, function(err, contacts){
		res.render('edit_contact',{
			contacts: contacts

		});
	});

});

//updated contact submission route
backend.post('/users/contacts/edit/:id', function(req, res){
	let x= {};
	x.Name=req.body.Name;
	x.Email_id=req.body.Email_id;
	x.Mobile_no=req.body.Mobile_no;

	//console.log(req.body.event_name);

	let query = {_id:req.params.id}
	contactVariable.update(query, x, function(err){
		if(err){
			console.log(err);
			return;
		}
		else{
			res.redirect('/users/contacts');
		}
	});

	return;
	console.log('updated');
});

//Delete contact
backend.delete('/users/contacts/:id', function(req, res){
	let query = {_id:req.params.id}
	contactVariable.remove(query, function(err){
		if(err){
			console.log(err);

		}
		res.send('success');
	});
});

//for checking if users are registered in database or not route
backend.get('/checklist', function(req, res){
		dbvariable.find({}, function(err, users){
			if(err){
				console.log(err);
			}else{
				res.render('lists',{
					title:'Lists',
					users: users
				});
			}
		});
	});

//getting single user information
backend.get("/users/detail/:id",function(req,res){
			dbvariable.findById(req.params.id,function(err,users){
				res.render('user',{
					title:"Users Details",
					users:users
				});
			});
	});

//Login Process
backend.post('/LogIn', function(req,res,next){

	passport.authenticate('local',{
		successRedirect:'/frontend',
		successFlash:true,
		failureRedirect:'/checklist',
		failureFlash:true
	})(req, res, next);
});

//logout route
backend.get('/logout',function(req,res){
	req.logout();
	req.flash('success','You are logged out');
	res.redirect('/frontend');
});

/*
//add login route
backend.post('/:id', function(req, res){
	const email=req.body.LoginEmail;
	const pwd=req.body.LoginPassword;
	console.log("login process");
	req.checkBody('LoginEmail','Email is required').notEmpty();
	req.checkBody('LoginEmail','Email is not valid').isEmail();
	req.checkBody('LoginPassword','Password is required').notEmpty();
	req.checkBody('LoginPassword','wrong password').equals(req.body.LoginPassword);
	let errors = req.validationErrors();
	if(errors){
		res.render('frontend',{
			errors:errors
		});
	}else{
		req.flash('success','You are logged in');
		dbvariable.findUserByEmail(email,function(err,users){
			res.render('frontend',{
				title:"Users Found",
				users:users,
			});
		});
		// res.locals.userGolbal = req.users;
		// console.log(req.users);
	}
});
*/
//add registration route
backend.post('/:id', function(req, res){
	const name=req.body.RegName;
	const email=req.body.RegEmail;
	const pwd=req.body.RegPassword;
	const conpwd=req.body.RegCPassword;
	console.log("registration process");
	req.checkBody('RegName','UserName is required').notEmpty();
	req.checkBody('RegPassword')
		    .not().isIn(['123', 'password', 'god']).withMessage('Do not use a common word as the password')
		    .isLength({ min: 5 }).withMessage('Password must be at least 5 chars long and contain number').matches(/\d/);

	req.checkBody('RegEmail','Email is required').notEmpty();
	req.checkBody('RegEmail','Email is not valid').isEmail();
	req.checkBody('RegPassword','Password is required').notEmpty();
	req.checkBody('RegCPassword','Passwords do not match').equals(req.body.RegPassword);

	let errors = req.validationErrors();
	if(errors){
		req.flash('errors in validation');
		res.render('frontend',{
			errors:errors
		});
	}else{
			let x= new dbvariable({
				name:name,
				email:email,
				pwd:pwd,
				conpwd:conpwd

			});

			bcrypt.genSalt(10,function(err,salt){
				bcrypt.hash(x.pwd,salt,function(err, hash){
					if(err){
						console.log(err);
					}
					x.pwd=hash;
					x.save(function(err){
						if(err){
							console.log(err);
							return;
						}
						else{
							req.flash('success','You  are now registered and can now log in');
							res.redirect('frontend');
						}
					});
				});
			});
	}
});

//to start server
backend.listen(3000,function(){
	console.log('Server started on port 3000...');
});

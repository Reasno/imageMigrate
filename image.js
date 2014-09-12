/**
/* ds.js 
/* this script will copy images from one wiki to another automatically.
/*
/* @author Reasno based on the work of Chenyang Chen.
/* Please ignore all dict prototype. It is copied from Chenyang‘s zh.asoiaf.dict */
var bot = require('nodemw');
// read config from external file
var zh = new bot({
	"server": "zh.asoiaf.wikia.com", 
	"path": "",                  
	"debug": true,               
	"username": process.env.USERNAME,         
	"password": process.env.PASSWORD,          
	"userAgent": "zh.asoiaf.image",    
	"concurrency": 1             
});
var en = new bot({
	"server": "awoiaf.westeros.org", 
	"path": "",                  
	"debug": true,               
	"username": process.env.EN_USERNAME,         
	"password": process.env.EN_PASSWORD,          
	"userAgent": "zh.asoiaf.image",    
	"concurrency": 1             
});
var got = new bot({
	"server": "gameofthrones.wikia.com", 
	"path": "",                  
	"debug": true,               
	"username": process.env.USERNAME,         
	"password": process.env.PASSWORD,          
	"userAgent": "zh.asoiaf.image",    
	"concurrency": 1             
})
var lg = false;


var image_borrow = function(){
	var stash = [];
	var self = this;	
	self.execute = function() {
		try{

			zh.logIn(function(data){
				console.log(data);
				var login  = JSON.parse(JSON.stringify(data)) ;
				if(login.result == 'Success'){
					lg = true;
				}else{
					lg = false;
					return;
				}
				try{
					_getAllImage(en,true,'json',function(){
						console.log('done for En');
					});				}catch(err){
					try{
						_getAllImage(en,true,'json',function(){
							console.log('done for En');
						});					}catch(err){
						return
					}
				}
				try{
					_getAllImage(got,true,'json',function(){
						console.log('done for Got');
					});				}catch(err){
					try{
						_getAllImage(got,true,'json',function(){
							console.log('done for Got');
						});					}catch(err){
						return
					}
				}
				
			});
		}catch(err){

		}
	}
	  /*
   * 
   * move all images
   */ 
   var read = function(client, data, res) {
   	var images = data.query.allimages;
   	for (var iid in images) {
   		var image = images[iid];
   		var name = image.name;
   		var url = image.url;
   		var desc = image.descriptionurl;
   		stash.push(image);
   		// console.log('passing'+name);
   		if (url != undefined) {
	      	//do we have this?
	      	try{
	      		var params = {
	      			action :'query',
	      			titles : 'File:'+name,
	      			format : 'json'
	      		}

	      		zh.api.call(params,function(info,next,data){
	      			//console.log(data);we
	      			if(data.query.pages['-1']){
	      				//console.log('not existed');
		      			for (var index = 0; index < stash.length; index++) {
		      				//console.log(('File:'+stash[index].name) +'\\\\\\\\\\\\'+data.query.pages['-1'].title );	
		      				var str = data.query.pages['-1'].title;
		      				if(('File:'+stash[index].name) == str.replace(/ /g,'_')){
		      						//console.log(stash[index].name +" ready uploadByUrl");	      				
		      						zh.uploadByUrl(stash[index].name, stash[index].url, 'zh.asoiaf.image: image migrated from '+stash[index].descriptionurl /* or extraParams */, function(){
			      						//console.log('uploaded');
			      					});
			      					zh.edit('File:'+stash[index].name, client==en?'{{Awoiaf}}':'{{Gotwikia}}', 'zh.asoiaf.image: image migrated from '+stash[index].descriptionurl , function(){
			      						//console.log(' Migrated');
			      					});

		      				}
		      	
		      				
		      			}
					}
	      		});
	      	}catch(err){

	      	}

	    } 
	}
	return res;
   };

	  /*
	   * this funcion is a place holder. Not needed
	   */
	   var writeFile = function(res, filename, format) {
	   };
	   /**
	   /* raw function */
	   var _getAllImage = function(client, isBot, format, callback) {
			   	//console.log('I am here');
			   	var res = {
			   		'dict': {}, 
			   		'noen': [], 
			   		'error': {}
			   	};
			   	var reqAll = {
			   		params: {
			   			action: 'query', 
			   			list: 'allimages', 
			   			aifrom : '',
			   			ailimit: (isBot) ? '5000' : '500',
			   			format : 'json'
			   		}, 
			   		errCnt: 0, 
			   		timeout: undefined
			   	};

			   	var log = function(info) {
			   		console.log('[getAll] ' + info);
			   	};    
			   	var waitTimeout = function() {
			   		if (reqAll.timeout) {
			   			clearTimeout(reqAll.timeout);
			   			reqAll.timeout = undefined;
			   			var err = 'Timeout, try again...';
			   			log(err);
			   			callApi(err, apiCallback);
			   		}
			   	};    
			   	var callApi = function(err, apiCallback) {
			   		if (err) {
			   			if (reqAll.errCnt > 3) {
			   				log('Retry 3 times...FAILED.');
			   				return;
			   			} else {
			   				reqAll.errCnt++;
			   			}
			   		} else {
			   			reqAll.errCnt = 0;
			   		}
			   		client.api.call(reqAll.params, apiCallback); 
				    reqAll.timeout = setTimeout(waitTimeout, 100000); // wait for 10 seconds until TIMEOUT
				};
				var apiCallback = function(info, next, data) {
				      if (!reqAll.timeout) { // timeout has been cleared, this callback is called after TIMEOUT, discard it
				      	log('Callback returned after TIMEOUT, discard it...');
				      	return;
				      }
				      clearTimeout(reqAll.timeout);
				      reqAll.timeout = undefined;
				      if (data) {
				      	if (!data.query) {
				      		var err = 'Error or warning occured, plz check parameters again.';
				      		log(err);
				      		callApi(err, apiCallback);
				      	} else {
				      		if (data['query-continue']) {
				      			read(client, data, res);
				      			log('query-continue');
				      			reqAll.params.aifrom = data['query-continue'].allimages.aifrom;
				      			callApi('', apiCallback);
				      		} else {
				      			read(client, data, res);
				      			writeFile(res, 'dict-all', format);
				      			if (callback) {
				      				callback(res);
				      			}
				      		}
				      	}
				      } else {
				      	var err = 'No data received in this call, try again...';
				      	log(err);
				      	callApi(err, apiCallback);
				      }
				};
		  		callApi('', apiCallback);
		};

	}

	module.exports = image_borrow;

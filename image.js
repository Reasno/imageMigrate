/**
/* ds.js 
/* this script will copy images from one wiki to another automatically.
/*
/* @author Reasno based on the work of Chenyang Chen.
/* Please ignore all dict prototype. It is copied from Chenyang‘s zh.asoiaf.dict */
var bot = require('nodemw');
// read config from external file
var zh = new bot({
	"server": "game.huiji.wiki", 
	"path": "",                  
	"debug": true,               
	"username": '米拉西斯',         
	"password": process.env.PASSWORD,          
	"userAgent": "zh.asoiaf.image",    
	"concurrency": 5          
});
var en = new bot({
	"server": "pcgamingwiki.com", 
	"path": "/w",                  
	"debug": true,               
	"username": process.env.EN_USERNAME,         
	"password": process.env.EN_PASSWORD,          
	"userAgent": "zh.asoiaf.image",    
	"concurrency": 2           
});
var got = new bot({
	"server": "gameofthrones.wikia.com", 
	"path": "",                  
	"debug": true,               
	"username": process.env.USERNAME,         
	"password": process.env.PASSWORD,          
	"userAgent": "zh.asoiaf.image",    
	"concurrency": 5             
})
var locked = false;
var grablock = function(){
	while(locked == true);
	locked == true;
    console.log("locked grabbed \n");
	return true;
}
var releaselock = function(){
    console.log("locked released \n");
	locked = false;
}
var lg = false;
var image_borrow = function(){
	var self = this;	
	self.execute = function() {
		try{
			zh.logIn(function(err, data){
				console.log(data);
				var login  = JSON.parse(JSON.stringify(data)) ;
				if(login.result == 'Success'){
					lg = true;
				}else{
					lg = false;
					return;
				}
				try{
					_getAllImage(en,true,'json','',function(){
						console.log('done for En');
					});				
                }catch(err){
					try{
						_getAllImage(en,true,'json','',function(){
							console.log('done for En');
						});					
					}catch(err){
						return;
					}
				}
			});
		}catch(err){

		}
	}

	  /*
	}
   * 
   * move all images
   */ 
   var read = function(client, data, res) {

   	var images = data.query.allimages;
   	for (var iid in images) {
   		
		
   		if (images[iid].url != undefined) {
   			(function(img){
                grablock();
				zh.getImageInfo('File:'+img.name, function(err, res){
	   				if (!res || !res.url){
	   					var iname = img.name;
	   					var iurl = img.url;
	   					var idesc = img.descriptionurl;
	   					console.log('uploading '+iname+' @ '+ iurl);
	   					var params = {
	   						action: 'upload',
	   						filename: iname,
	   						url: iurl,
	   						format:'json'
	   					}
	   					var tokenparam = {
	   						action: 'query',
	   						meta:'tokens',
	   						format:'json'
	   					}
	   					zh.api.call(tokenparam, function (err, token){
	   						console.log(token);
	   						if (err) {
	   							console.log('notoken');
                                releaselock();
	   							return;
	   						}
	   						if (!token || !token.tokens || !token.tokens.csrftoken){
	   							console.log('notoken');
                                releaselock();
	   							return;
	   						}
	   						params.token = token.tokens.csrftoken;
	   						zh.api.call(params, function (err, data){
                                releaselock();
								if (err){
									// _getAllImage(en,true,'json',iname,function(){
         //               				     console.log('done for En');
         //            				});
         							console.log('uplod err: '+err);
         							//zh.api.call(params, null);
								}
	   							if( data && data.result && data.result === 'Success') {
	   								console.log('uploaded '+iname);
	   							}
	   						}, 'UPLOAD'); 
	   					});
	  				} else {
                        releaselock();
                    }
	  			});
   			})(images[iid]);
  			// zh.edit('File:'+name, client==en?'{{Awoiaf}}':'{{Gotwikia}}', 'zh.asoiaf.image: image migrated from '+desc , function(){
  			// 	console.log(' Migrated');
  			// });
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
	   var _getAllImage = function(client, isBot, format, from, callback) {
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
			   			aifrom : from,
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
				    reqAll.timeout = setTimeout(waitTimeout, 100000000); // wait for 10 seconds until TIMEOUT
				};
				var apiCallback = function(err, info, next, data) {
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
				      		read(client, data, res);
				      		if (data['query-continue']) {
				      			read(client, data, res);
				      			if (data['query-continue'].allimages.aicontinue){
				      				reqAll.params.aifrom = data['query-continue'].allimages.aicontinue;
				      			} else {
				      				reqAll.params.aifrom = data['query-continue'].allimages.aifrom;
				      			}
				      			callApi('', apiCallback);
				      		} else {
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

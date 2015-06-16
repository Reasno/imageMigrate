var bot = require('nodemw');
// read config from external file
var zh = new bot({
	"server": "asoiaf.huiji.wiki", 
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

var bot = require('nodemw');

var lg = false;

var category = function(){
	var stash = ['Map_Images','[[Category:地图]]','','Images of Eddard Stark‎','[[Category:艾德·史塔克图片]]','Images of Daenerys Targaryen‎','[[category:丹妮莉丝·坦格利安图片]]','Images of Catelyn Tully‎','[[Category:凯特琳·徒利图片]]','Images of Bran Stark‎','[[Category:布兰·史塔克图片]]','Images of Arya Stark‎','[[category:艾莉亚·史塔克图片]]'];
	var self = this
	self.execute = function(enName, zhName, isImage) {
		stash[0] = enName;
		stash[1] = zhName;
		try{
			if(isImage=="false"){
				zh.getArticle("MediaWiki:Common.js/dict", function(data){
					//console.log(data);
					stash[2] = JSON.parse(data);
					//console.log(stash[2]);
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
							where_are_my_dragons(zh);
						}catch(err){
							try{
								where_are_my_dragons(zh);
							}catch(err){
								return
							}
						}
						try{
							where_are_my_dragons(zh);
						}catch(err){
							try{
								where_are_my_dragons(zh);
							}catch(err){
								return
							}
						}
						try{
							where_are_my_dragons(zh);
						}catch(err){
							try{
								where_are_my_dragons(zh);
							}catch(err){
								return
							}
						}

					});
				});
			}
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
					where_are_my_dragons(zh);
				}catch(err){
					try{
						where_are_my_dragons(zh);
					}catch(err){
						return
					}
				}
				try{
					where_are_my_dragons(zh);
				}catch(err){
					try{
						where_are_my_dragons(zh);
					}catch(err){
						return
					}
				}
				try{
					where_are_my_dragons(zh);
				}catch(err){
					try{
						where_are_my_dragons(zh);
					}catch(err){
						return
					}
				}
				
			});
		}catch(err){

		}
	}
	var makeCategory = function (title){
		console.log(title);
		//sleep.sleep(2);		
		if (!title){
			return;
		}
		zh.getArticle(title,function(data){	
			var re = new RegExp('\\[\\[Category:'+escapeRegExp(stash[1])+'\\]\\]','ig');
			var re2 = new RegExp('\\[\\[Category:'+escapeRegExp(stash[1])+'\\|','ig');
			if(data.search(re)!='-1' || data.search(re2)!='-1'){
				console.log(title+' has returned');
				return;
			}else{
				//console.log(title);
				zh.edit(title,data+'\[\[Category:'+stash[1]+'\]\]','zh.asoiaf.category',function(data){
					console.log('category added');
				})
			}

		});
	}
	var where_are_my_dragons = function(bot) {
		console.log('collecting categories');
		
		en.getPagesInCategory(stash[0], function(data){
			console.log(data);
			var titles  = JSON.parse(JSON.stringify(data));
			for (var k=0 ; k<titles.length;k++){
				makeCategory((stash[2])?findInDict(titles[k].title):titles[k].title);
			}
		});
	}
	function escapeRegExp(str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}
	function findInDict(enString){

		for(var k in stash[2]){
			//console.log(stash[2][k]+"----"+zhString);
			if(k === enString){
				return stash[2][k];
			}
		}
		return false;
	}
}
module.exports = category;
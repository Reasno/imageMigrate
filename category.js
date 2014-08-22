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

var bot = require('nodemw');

var lg = false;

var stash = ['Map_Images','[[Category:地图]]','Images of Gregor Clegane‎','[[Category:格雷果·克里冈图片]]','Coat of arms images','[[Category:纹章图片]]','Images of Eddard Stark‎','[[Category:艾德·史塔克图片]]','Images of Daenerys Targaryen‎','[[category:丹妮莉丝·坦格利安图片]]','Images of Catelyn Tully‎','[[Category:凯特琳·徒利图片]]','Images of Bran Stark‎','[[Category:布兰·史塔克图片]]','Images of Arya Stark‎','[[category:艾莉亚·史塔克图片]]'];
var category = function(){
	var self = this
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
	var where_are_my_dragons = function(bot) {
		console.log('all images');
		
		en.getPagesInCategory(stash[0], function(data){
			console.log(data);
			var titles  = JSON.parse(JSON.stringify(data));
			for (var k=0 ; k<titles.length;k++){
				//console.log(titles[k].title);
				var params = {
					action :'query',
					prop :'categories',
					rvprop : 'content',
					format : 'JSON',
					titles : titles[k].title
				}

				//sleep.sleep(2);
				en.api.call(params,function(data){	
					var entity  = JSON.parse(JSON.stringify(data));
					for(var i in entity.pages){
						
						
						console.log(entity.pages[i].title);
						var params = {
							action :'query',
							prop :'revisions',
							rvprop : 'content',
							format : 'JSON',
							titles : entity.pages[i].title
						}
						//sleep.sleep(2);
						try{
							zh.api.call(params,function(data){	
								var content = JSON.stringify(data);
								content = escapeRegExp(content);
								try{
									var my_obj = JSON.parse(JSON.stringify(data));
								}catch(err){
									return;
								}
								var my_title ='';
								var my_ns='';
								var my_content ='';
								for (var l in my_obj['pages']){
									for (var m in my_obj['pages'][l]){
										if (m == 'title'){
											my_title = my_obj['pages'][l]['title'];
											my_ns = my_obj['pages'][l]['ns'];

											try{
												my_content = my_obj['pages'][l]['revisions'][0]['*'];
												break;
											}catch(err){
												//this is a portal
												break;
											}	
										}
									}
								}

								zh.edit(my_title,my_content+stash[1],'分类',function(data){
									console.log('category added');
								})

							});
						}catch(err){
							return;
						}

					}
				});


			}
		});
	}
	function escapeRegExp(str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}
}
module.exports = category;
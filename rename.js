/**
/* rename.js 
/* this script will change link names automatically.
/*
/* @author Reasno based on the work of Chenyang Chen.
/* */
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

var rename = function(){
  var stash = ['城管','杰诺斯·史林特','Images of Gregor Clegane‎','[[Category:格雷果·克里冈图片]]','Coat of arms images','[[Category:纹章图片]]','Images of Eddard Stark‎','[[Category:艾德·史塔克图片]]','Images of Daenerys Targaryen‎','[[category:丹妮莉丝·坦格利安图片]]','Images of Catelyn Tully‎','[[Category:凯特琳·徒利图片]]','Images of Bran Stark‎','[[Category:布兰·史塔克图片]]','Images of Arya Stark‎','[[category:艾莉亚·史塔克图片]]'];

  var self = this
  self.execute = function(oldName, newName) {
    stash[0] = oldName;
    stash[1] = newName;
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
            console.log(err);
            return;
          }
        }
        try{
          where_are_my_dragons(zh);
        }catch(err){
          try{
            where_are_my_dragons(zh);
          }catch(err){
            console.log(err);
            return
          }
        }
        try{
          where_are_my_dragons(zh);
        }catch(err){
          try{
            where_are_my_dragons(zh);
          }catch(err){
            console.log(err);
            return
          }
        }
        
      });
    }catch(err){

    }
  }
  var editContent = function (title){
      zh.getArticle(title, function(data){
        var my_title = this.title;
        //console.log(data);
        console.log(title);
        var re = new RegExp('\\[\\['+stash[0]+'\\]\\]',"ig");
        data = data.replace(re,"\[\["+stash[1]+'\]\]');
        re = new RegExp('\\[\\['+stash[0]+'\\|',"ig");
        data = data.replace(re,'\[\['+stash[1]+'\|');
        zh.edit(title, data, "zh.asoiaf.rename"+stash[0]+"->"+stash[1],function(data){console.log("success")});
      });
  }
  var where_are_my_dragons = function(bot) {
    console.log('renaming articles');
    
    zh.getBacklinks(stash[0], function(data){
      console.log(data);
      var titles  = JSON.parse(JSON.stringify(data));
      for (var k=0 ; k<titles.length;k++){
        editContent(titles[k].title);
      }
    });
  }
  function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }
}
module.exports = rename;
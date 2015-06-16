/**
/* Redirect.js 
/* this script will create redirect pages automatically.
/* 1. From English titles that exists in interlanguage links to Chinese . 
/* 2. From each alias entry in infobox to the main article.
/*
/* @author Reasno based on the work of Chenyang Chen.
/* Please ignore all dict prototype. It is copied from Chenyang‘s zh.asoiaf.dict */
var bot = require('nodemw');  
var isBot = true;
var client = new bot({
  "server": "asoiaf.huiji.wiki", 
  "path": "",                  
  "debug": true,               
  "username": process.env.USERNAME,         
  "password": process.env.PASSWORD,          
  "userAgent": "zh.asoiaf.DS",    
  "concurrency": 5             
});
/* helper funciton
/* Find parameter name in rendered xml. */
var render = function getTemplateParamFromXml(tmplXml, paramName) {
  paramName = paramName.
    trim().
    replace('-', '\\-');

  var re = new RegExp('<part><name>\\s*' + paramName + '\\s*<\/name>=<value>([^>]+)<\/value>'),
    matches = tmplXml.match(re);

  return matches && matches[1].trim() || false;
};
/* helper function
/* create a new page rather than edit exsiting pages */
var create = function(client, title, content, summary, callback) {
  var self = client;
  // @see http://www.mediawiki.org/wiki/API:Edit
  client.getToken(title, 'edit', function(token) {
    self.api.call({
      action: 'edit',
      title: title,
      text: content,
      bot: '',
      summary: summary,
      createonly: '',
      token: token
    }, function(data) {
      if (data.result && data.result === "Success") {
        callback && callback(data);
      }
      else {
        console.log("page existed:"+title);
        //throw new Error('Edit failed');
      }
    }, 'POST');
  });
};
/* main loop */
var redirect = function() {
  var lg = false;
  var self = this;
  self.execute = function() {
    try{

      client.logIn(function(data){
        console.log(data);
        try{
          _getAll(client, isBot, "JSON", function(data){});
        }catch(err){
          try{
              _getAll(client, isBot, "JSON", function(data){});
          }catch(err){
              try{
                _getAll(client, isBot, "JSON", function(data){});
              }catch(err){
                console.log(err);
              }
          }
        }
      });
    }catch(err){
      console.log(err);
    }
  }  
  /* get article pages. this is function comes from chenyang's zh.asoiaf.dict. */
  var _getAll = function(client, isBot, format, callback) {
    var res = {
      'dict': {}, 
      'noen': [], 
      'error': {}
    };
    var reqAll = {
      params: {
        action: 'query', 
        generator: 'allpages', 
        gaplimit: (isBot) ? '1000' : '100', 
        prop: 'langlinks', 
        lllimit: (isBot) ? '5000' : '500'
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
      reqAll.timeout = setTimeout(waitTimeout, 300000); // wait for 300 seconds until TIMEOUT
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
            /* modified by reasno 2014-08-22 */
            read(data, res, client);
            /* end of modification */
            log('query-continue');
            reqAll.params.gapfrom = data['query-continue'].allpages.gapfrom;
            callApi('', apiCallback);
          } else {
            /* modified by reasno 2014-08-22 */
            read(data, res, client);
            /* end of modification */
            //writeFile(res, 'dict-all', format);
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
  //This function creates redirects for each alias
  var makeAlias = function(title){

    client.getArticle(title, function(data){
      client.expandTemplates("$$$"+title+"$$$"+data, title, function(data){
        var target = render(data, "Alias");
        target = target?target:render(data,"alias");
        console.log(target);
        data = data.trim().replace('-', '\\-');
        var re = new RegExp('\\$\\$\\$([^>]+)\\$\\$\\$');
        var matches = data.match(re);
        var title = matches && matches[1].trim() || false;
        console.log(title);
        if(target && title && target != ""){
          var aliases = target.split(/\&lt\;br\s*\/?\&gt\;/g);
          for(var a in aliases) {
            if (!aliases[a]||aliases[a].trim()===""||title === aliases[a].trim()){
              break;
            }
            console.log(title+"<-"+aliases[a]);
            try{
              var s = aliases[a].trim().replace(/(<([^>]+)>)/ig,"");
              s = s.replace(/\[/g,"");
              s = s.replace(/\]/g,"");
              s = s.replace(/\{/g,"");
              s = s.replace(/\}/g,"");
              s = s.replace(/\"/g,"");
              s = s.replace(/\:/g,"");
              s = s.replace(/\#/g,"");
              s = s.replace(/“/g,"");
              s = s.replace(/”/g,"");
              setTimeout(create(client, s, "#REDIRECT [["+title+"]]", "zh.asoiaf.redirect", function(data){console.log('Alias edit made');}),5000);
              //strip strip strip

            }catch(err){
              console.log(err);
            }
          }
        }
      })
    })
  }
  //This function will create redirect pages
  var read = function(data, res, client) {
    var pages = data.query.pages;
    for (var pid in pages) {

      var page = pages[pid];
      var title = page.title;
      var langlinks = page.langlinks;
      // don't do anything for english pages.
      var temp = title.replace(/\s*/g,"_").replace(/\(/g,"").replace(/\)/g,"").replace(/\'/g,"").replace(/\"/g,"").replace(/\./g,"").replace(/\-/g,"").replace(/\,/g,"");
      var valid = /^\w*$/.test(temp);
      if(valid){
        continue;
      }
      makeAlias(title);
      if (langlinks != undefined) {
        for (var i = 0; i < langlinks.length; ++i) {
          var lang = langlinks[i];
          if (lang.lang == 'en') {
            res.dict[title] = lang['*'];
            break;
          }
        }
        if (res.dict[title] == undefined) {
          //Do Nothing
        }else{
          try{
            if (res.dict[title]!=""){
              setTimeout(create(client, res.dict[title], "#REDIRECT [["+title+"]]", "zh.asoiaf.redirect", function(data){console.log('English name edit made'+data);}),5000);
            }
          }catch(err){
            console.log(err);//ignore errs.
          }
        }
      } else {
      }
    }
    return res;
  };
}

module.exports = redirect;
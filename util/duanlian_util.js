const request = require('request');
const appkeys =['5786724301','2849184197','202088835','211160679','1905839263','783190658','569452181','2849184197','2702428363','82966982'] 

function convert_url(url,next) {
	var index = parseInt(Math.random()*appkeys.length);
	var appkey = appkeys[index];
	request({
		    url: 'http://api.weibo.com/2/short_url/shorten.json?source='+appkey+'&url_long='+encodeURIComponent(url),
		    method: "get",
		}, function(error, response, body) {
			console.log(body);
		    if (!error && response.statusCode == 200) {
		    	var url_obj = JSON.parse(body);
		    	if(url_obj.error){
		    		console.log(url_obj);
		    		console.log('-------------');
		    		console.log(appkey)
		    		return next(url)
		    	}
                var url_short = url_obj.urls[0].url_short;
                if(url_short){
                	return next(url_short)
                }
                return next(url)
		    }
		    return next(url)
		});
}

function vilidate(url){
	appkeys.forEach(function(appkey){
		request({
		    url: 'http://api.weibo.com/2/short_url/shorten.json?source='+appkey+'&url_long='+encodeURIComponent(url),
		    method: "get",
		}, function(error, response, body) {
		    if (!error && response.statusCode == 200) {
		    	var url_obj = JSON.parse(body);	
		    		console.log(url_obj);
		    		console.log('-------------');
		    		console.log(appkey) 
		    		console.log('-------------\r\n\r\n');  		   	  
		    }
		    
		});
	})
}

//vilidate('https://mingtianhuigenghao.kuaizhan.com/?image=http://img.alicdn.com/bao/uploaded/i2/2702726458/TB28HZbo4WYBuNjy1zkXXXGGpXa_!!2702726458.jpg&word=€MVsh0woKs1c€')


module.exports.convert_url = convert_url;
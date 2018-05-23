const request = require('request');

function convert_url(o_url,next) {
	request({
		    url: 'https://ni2.org/api/create.json',
		    method: "POST",
		    form:{
		    	url:o_url,
		    	user_key:'e8b9e9a140818f8cae94f890902a4a76'
		    }
		}, function(error, response, body) {
		    if (!error && response.statusCode == 200) {
		    	var url_obj = JSON.parse(body);
                if(url_obj.result==0){
		    		next(url_obj.url)
		    	}else{
		    		next(o_url)

		    	}
		    }else{
		    	return next(o_url)
		    }
		});
}


/*convert_url('http://www.rrdtjj.top/top10.html?class=1',function(url){
	console.log(url);
})
*/

module.exports.convert_url = convert_url;
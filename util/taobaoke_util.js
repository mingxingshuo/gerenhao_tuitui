require('events').EventEmitter.prototype._maxListeners = 1000;

var request = require('request');
var async = require('async');
ApiClient = require('./taobaoke/index.js').ApiClient;
TopClient = require('./taobaoke/lib/api/topClient.js').TopClient;

String.prototype.stripHTML = function() {
	var reTag = /<(?:.|\s)*?>/g;
	return this.replace(reTag,"");
}

function request_taobao_url(url,next){

	async.waterfall([
			function(callback){
				var options = {  
					maxRedirects:15,
					url:url, 
					method:"GET",
					headers: {  
						"Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
					    "Connection": "keep-alive", 
					    "Content-Type": "text/html; charset=GBK",  
					    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36"  
					}//伪造请求头  
				};
				if(!url.startsWith('http')){
	
					return callback(null,options,url);
				}
				request(options, function (error, response, body) {
					if(error){
						return callback(error,null);
					}
					var str_html=response.body;
					var str_temp=str_html.split('var url = \'')[1];
					var str_url= str_temp.split('\'')[0];
					options.url=str_url;
					callback(null,options,null);
				});

			},
			function(options,title,callback){
				if(title){
					options.url='http://pub.alimama.com/items/search.json?q='+encodeURI(title);
					console.log(options.url);
					return callback(null,options);
				}
				request(options,function(e, res, b){
					if(e){
						return callback(e,null);
					}
					var uri_obj = res.request.uri;
					var split_str = '?id=';
					var tmp_arr = uri_obj.path.split(split_str);
					if(tmp_arr.length == 1){
						split_str = '&id=';
						tmp_arr = uri_obj.path.split(split_str);
					}
					if(tmp_arr.length==1){
						return callback('无优惠信息');
					}
					var itemid = tmp_arr[1].split('&')[0];
					var tmp_str = uri_obj.path.split('?')[0]+'?id='+itemid;
					var param_url=uri_obj.protocol+'//'+uri_obj.hostname+tmp_str;
					options.url='http://pub.alimama.com/items/search.json?q='+encodeURI(param_url);
					//console.log('url : '+options.url);
					options.param_url=param_url;
					callback(null,options);
				});
			},
			function(options,callback){
				options.headers={
					"Accept":'application/json, text/javascript, */*; q=0.01',
					"Accept-Encoding": "utf-8",
					"Connection": "keep-alive", 
					"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36"  
				};
				request(options,function(e, res, b){
					if(e){
						return callback(e,null);
					}
					b = b.stripHTML();
					var obj = JSON.parse(b);
					//console.log(obj);
					if(obj.data && obj.data.pageList && obj.data.pageList[0]){
						var tmp = obj.data.pageList[0];
						res={
							url:tmp.auctionUrl,
							data:{
								title:tmp.title,
								price:tmp.zkPrice,
								tkCommFee:tmp.tkCommFee,
								couponAmount:tmp.couponAmount,
								itemid:tmp.auctionId
							}
						};
					}else{
						res={
								code:1,
								message:'无优惠信息'
						};
					}
					callback(null,res);
				});
			}
		],function(err, results){
			next(err,results);		
	});
}

function request_taobao_token(code,title,next){
	async.waterfall([
			function(callback){
				if(!code){
					return callback(-1,null);
				}
				request.post('http://api.chaozhi.hk/tb/tklParse', {form:{tkl:code}},function (error, response, body) {
					if(error){
						return callback(error,null);
					}
					body = JSON.parse(body);
					var url= body.data.url;
					if(!url){
						return callback(-1,null);
					}
					callback(null,url);
				});
			},
			function(tmp_url,callback){
				var options = {  
					maxRedirects:16,
					url:tmp_url, 
					method:"GET",
					headers: {  
						"Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
					    "Connection": "keep-alive", 
					    "Content-Type": "text/html; charset=GBK",  
					    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36"  
					}//伪造请求头  
				};

				request(options,function(e, res, b){
					if(e){
						return callback(e,null);
					}
					var uri_obj = res.request.uri;
					var split_str = '?id=';
					var tmp_arr = uri_obj.path.split(split_str);
					if(tmp_arr.length == 1){
						split_str = '&id=';
						tmp_arr = uri_obj.path.split(split_str);
					}
					if(tmp_arr.length==1){
						return callback('无优惠信息');
					}
					var itemid = tmp_arr[1].split('&')[0];
					var tmp_str = uri_obj.path.split('?')[0]+'?id='+itemid;
					var param_url=uri_obj.protocol+'//'+uri_obj.hostname+tmp_str;
					var url='http://pub.alimama.com/items/search.json?q='+encodeURI(param_url);
					console.log('url : '+url);
					callback(null,url);
				});
			},
			/*function(param_url,callback){
				var split_str = '?id=';
				var tmp_arr = tmp_url.split(split_str);
				if(tmp_arr.length == 1){
					split_str = '&id=';
					tmp_arr = tmp_url.split(split_str);
				}
				if(tmp_arr.length==1){
					return callback('无优惠信息');
				}
				var itemid = tmp_arr[1].split('&')[0];
				var param_url = tmp_url.split('?')[0]+'?id='+itemid;
				var url='http://pub.alimama.com/items/search.json?q='+encodeURI(param_url);
				callback(null,url);
			},*/
			function(url,callback){
				var options = {  
					url:url, 
					method:"GET",
					headers: {  
						"Accept":"application/json, text/javascript, */*; q=0.01",
					    "Connection": "keep-alive", 
					    "Content-Type": "utf-8",  
					    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36"  
					},
				};
				request(options,function(e, res, b){
					if(e){
						return callback(e,null);
					}
					console.log(b);
					var obj = JSON.parse(b);
					if(obj.data && obj.data.pageList && obj.data.pageList[0]){
						var tmp = obj.data.pageList[0];
						res={
							url:tmp.auctionUrl,
							data:{
								title:tmp.title,
								price:tmp.zkPrice,
								tkCommFee:tmp.tkCommFee,
								couponAmount:tmp.couponAmount,
								itemid:tmp.auctionId
							}
						};
					}else{
						res={
								code:1,
								message:'无优惠信息'
						};
					}
					callback(null,res);
				});
			}
		],function(err, results){
			if(err == -1){
				console.log('search title');
				return request_taobao_url(title,next);
			}else{
				return next(err,results);
			}		
	}); 
}


//通过接口获取淘口令，发现优惠券淘口令获取不到
function taokouling(obj,next){
	if(obj.error){
		return next(obj.error);
	}
	var client = new TopClient({
	    'appkey': '24808252',
	    'appsecret': '25394001ed7c0f2aff6cb31750e865f0',
	    'REST_URL': 'http://gw.api.taobao.com/router/rest'
	});

	client.execute('taobao.wireless.share.tpwd.create',
	    {'tpwd_param':JSON.stringify({url:obj.url,text:obj.data.title})},
	    function (error,response) {
	        if(!error){
	        	if(response.model){
	        		obj.taokouling = response.model;
	        		next(null,obj);
	        	}else{
	        		console.log(response);
	        		next(null,obj);
	        	}
	        }else{
	            console.log(error);
	            next(error,obj);
	        }
	    }
	);
}

function search_title(title){
	var client = new TopClient({
	   'appkey': '24808252',
	   'appsecret': '25394001ed7c0f2aff6cb31750e865f0',
	   'REST_URL': 'hhttp://gw.api.taobao.com/router/rest'
	});
	 
	client.execute('taobao.tbk.item.get', {
	    'fields':'num_iid,title,pict_url,reserve_price,zk_final_price,item_url,tk_rate,tk_comm_fee,coupon_amount',
	    'q':title,
		'page_size':1
	}, function(error, response) {
	    if (!error) console.log(JSON.stringify(response));
	    else console.log(error);
	});
}

//search_title('夹克外套女春秋假两件亮片棒球服外套韩板宽松bf网纱防晒衫学生');
/*request_taobao_url('http://m.tb.cn/h.WEeQPBg',function(err,response){
	console.log(response);
});*/

/*request_taobao_token('￥rmPz0J0InTO￥','夹克外套女春秋假两件亮片棒球服外套韩板宽松bf网纱防晒衫学生',function(err,response){
	console.log(response);
});*/

/*jiexitaokouling('【生日礼物女生送女友女朋友老婆玫瑰花创意diy定制走心的特别浪漫】，复制这条信息￥RQvU0qgDIAM￥后打开👉手淘👈',function(err,response){
	console.log(response);
});
*/

module.exports.request_taobao_url = request_taobao_url;
module.exports.request_taobao_token = request_taobao_token;




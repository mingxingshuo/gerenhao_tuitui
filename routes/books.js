var express = require('express');
var router = express.Router();
var BookContentModel = require('../model/BookContent.js');
var BookModel = require('../model/Book.js');
var UserReadModel = require('../model/UserRead.js');
var UserModel = require('../model/User.js');
var UserBookAuthorityModel = require('../model/UserBookAuthority.js');
var WechatUtil =require('../util/wechat_get.js');
var ImageUtil =require('../util/image_util.js');
var book_wechat_conf = require('../conf/book_wechat.json');
var WechatAPI = require('wechat-api');
var Wechat = require('wechat-jssdk');
var FileStore = require('wechat-jssdk').FileStore;
var request = require('request');
var async = require('async');


router.use('/create', function(req, res, next) {
	var content = req.body.content;
	content = JSON.parse(content);
	BookModel.findOne({book_id:content.book_id},function(err,book){
		if(!book){
			BookModel.create({book_id:content.book_id,bookname:content.bookname});
		}
	});
	BookContentModel.create(content);
	res.send('success');
});

router.use('/chaptes/:book_id', function(req, res, next) {
	var book_id = req.params.book_id;
	BookContentModel.find({book_id:parseInt(book_id)},{content:0},function(err,chaptes){
		res.render('books/dir', { chaptes: chaptes,book_id: req.params.book_id});
	});
});

router.use('/continue/:book_id',function(req, res, next){
	getOpenid(req,res,read_continue);
});

router.use('/read/:book_id', function(req, res, next) {
	getOpenid(req,res,read_chapter);
});


router.use('/share/:book_id',function(req, res, next){
	/*var book_id = req.params.book_id;
	WechatUtil.getQr(book_wechat_conf[book_id].code,'o3qBK0RXH4BlFLEIksKOJEzx08og',book_id,function(err,tiket){
		ImageUtil.getQRImg(tiket,function(qr_name){
			req.session['user_share_'+req.params.book_id] = qr_name;
			res.render('books/share',{share_img:qr_name,book_id:parseInt(book_id)});
		});
	});*/
	getOpenid(req,res,showQr);
});

router.use('/getwx/:book_id',function(req, res, next){
	var conf = book_wechat_conf[req.params.book_id];
	var wx = new Wechat({
	  "wechatToken": conf.token,
	  "appId": conf.appid,
	  "appSecret": conf.appsecret,
	  "store": new FileStore({
		  fileStorePath: './wx/wechat-'+conf.code+'-info.json', 
		})
	});
	wx.jssdk.getSignature(req.query.url).then(function(signatureDate) {
		signatureDate.appId = conf.appid;
	    res.json(signatureDate);
	});
});

router.use('/geturl',function(req,res,next){
	var book_id = dreq.query.book_id;
	if(book_id){
		BookContentModel.findOne({index:4,book_id:parseInt(book_id)},function(err,chapte){
			if(!chapte){
				res.send('未找到章节');
			}else{
				res.send('http://tiexie0.top/books/read/'+chapte.book_id+'?chapte_id='+chapte.chapte_id);
			}
		});
	}else{
		res.send('缺少参数');
	}
	
});


function getOpenid(req,res,callback){
	var book_id = req.params.book_id;
	var openid = req.session[book_id];
	var code = req.query.code;
	if(!openid){
		/*req.session.openid = 'o3qBK0RXH4BlFLEIksKOJEzx08og';
		return callback(req,res);*/
		if(!code){
			var url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid="+book_wechat_conf[book_id].appid+"&redirect_uri="+encodeURIComponent('http://'+req.hostname+req.originalUrl)+"&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect";
			res.redirect(url);
		}else{
			var api_url="https://api.weixin.qq.com/sns/oauth2/access_token?appid="+book_wechat_conf[book_id].appid+"&secret="+book_wechat_conf[book_id].appsecret+"&code="+code+"&grant_type=authorization_code";
			request(api_url,function(err,response,body){
				body = JSON.parse(body);
				req.session[req.params.book_id]=body.openid;
				callback(req,res);
			});
		}
	}else{
		callback(req,res);
	}
}

function showQr(req,res){
	var book_id = req.params.book_id;
	var openid = req.session[book_id];
	WechatUtil.getQr(book_wechat_conf[book_id].code,openid,book_id,function(err,tiket){
		ImageUtil.getQRImg(tiket,function(qr_name){
			req.session['user_share_'+req.params.book_id] = qr_name;
			res.render('books/share',{share_img:qr_name,book_id:parseInt(book_id)});
		});
	});
}

function read_continue(req,res){
	var book_id = req.params.book_id;
	var openid = req.session[book_id];
	UserReadModel.findOne({book_id:parseInt(book_id),openid:openid},function(error,read){
		if(!read){
			BookContentModel.findOne({book_id:book_id,index:1},function(err,chapte){
				return res.redirect('/books/read/'+book_id+'?chapte_id='+chapte.chapte_id);
			});
		}else{
			return res.redirect('/books/read/'+book_id+'?chapte_id='+read.chapte_id);
		}
	});
}

function read_chapter(req,res){
	var book_id = req.params.book_id;
	var openid = req.session[book_id];
	var chapte_id = req.query.chapte_id;
	var index = req.query.index;
	var con = {book_id:book_id};
	if(chapte_id){
		con.chapte_id = chapte_id;
	}
	if(index){
		con.index = index;
	}
	BookContentModel.findOne(con,function(err,chapte){
		if(!chapte){
		}else{
			var read = {book_id:book_id,openid:openid,chapte_id:chapte.chapte_id,index:chapte.index,bookname:chapte.bookname};
	
			UserReadModel.findOneAndUpdate(
				{book_id:book_id,openid:openid},
				{$set:read},
				{upsert:true,rawResult:true},
				function(error,read){
					if(error){
						console.log(error);
					}
				}
			);
			
			if(chapte.index >10 ){
				check10V(chapte,req,res,function(result){
					if(result == '1'){
						check20V(chapte,req,res);
					}
				});
			}else{
				res.render('books/content', { chapte: chapte});
			}
		}
	});
}

function check10V(chapte,req,res,next){
	var book_id = req.params.book_id;
	var openid = req.session[book_id];
	var user_sub = req.session['sub_'+book_id];
	if(user_sub){
		if(chapte.index<=20){
			res.render('books/content', { chapte: chapte});
			next(null);
		}else{
			next('1');
		}
		return;
	}
	var conf = book_wechat_conf[book_id];
	var client = WechatUtil.getClient(conf.code);
	
	client.getUser(openid,function(error,result){
		if(error){
			console.log(error);
		}
		if(result.subscribe == 0){
			//关注公众号页面
			
			res.render('books/subscribe',{name:conf.name});
			next(null);
		}else{
			req.session['sub_'+book_id] = '1';
			UserBookAuthorityModel.findOne({book_id:book_id,openid:openid},function(err,auth){
				if(!auth){
					UserBookAuthorityModel.create({
						book_id:book_id,
						openid:openid,
						can_read:20
					},function(error){if(error)console.log(error)});
				}
				if(chapte.index<=20){
					res.render('books/content', { chapte: chapte});	
					next(null);
				}else{
					next('1');
				}
			});
		}
	});
}

function check20V(chapte,req,res){
	var book_id = req.params.book_id;
	var openid = req.session[book_id];
	
	UserBookAuthorityModel.findOne({book_id:parseInt(book_id),openid:openid},function(err,auth){
		
		if(chapte.index <= auth.can_read){
			res.render('books/content', { chapte: chapte});
		}else{
			if(auth.can_read<=20){
				res.redirect('/books/share/'+book_id);
			}else{
				res.render('books/content', { chapte: chapte});	
			}
		}
	});
}


module.exports = router;

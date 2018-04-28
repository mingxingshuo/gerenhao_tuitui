var socket = require('socket.io')
var WechatAPI = require('wechat-api');
var weichat_conf = require('./conf/weichat.json');
var weichat_apis ={};
var TokenMessageModel = require('./model/TokenMessage');
var request = require('request');

String.prototype.stripHTML = function() {
	var reTag = /<(?:.|\s)*?>/g;
	return this.replace(reTag,"");
}

Array.prototype.contains = function(obj) {   
  var i = this.length;   
  while (i--) {   
    if (this[i] === obj) {   
      return i;  // 返回的这个 i 就是元素的索引下标，  
    }   
  }   
  return false;   
}

var MessageServer = function(server){
	this.instance = null;
	this.server = server;
	this.io = null;
	this.sockets = {};
	this.taobao_socket_ids = [];
	this.wechat_socket_ids = {};
	this.init_io(server,this);
}

MessageServer.getInstance = function(server) {
    if (!this.instance) {
        this.instance = new MessageServer(server);
    }
    return this.instance;
};


MessageServer.prototype.init_io = function(server,self) {
	self.io = socket.listen(server);
	self.io.on('connection', function (socket) {
		console.log('connection')
		self.sockets[socket.id] = socket;
		// self.taobao_socket_ids.push(socket.id);
		socket.on('disconnect', function(){
		    delete self.sockets[socket.id];
		    if(self.taobao_socket_ids.indexOf(socket.id) != -1){
                self.taobao_socket_ids.splice(self.taobao_socket_ids.indexOf(socket.id),1)
            }
            delete self.wechat_socket_ids[socket.id]
        });

		socket.on('registe',function (data) {
			data = JSON.parse(data);
			if(data.role == 'taobao'){
                self.taobao_socket_ids.push(socket.id);
            }else{
                self.wechat_socket_ids[socket.id] = data.id;
            }
        })

		socket.on('token',function(msg){
			msg = JSON.parse(msg);
			
			var message = new TokenMessageModel({
				title : msg.data.title,
				price : msg.data.price,
				reservePrice : msg.data.reservePrice,
				tkCommFee : (0.2*msg.data.tkCommFee).toFixed(2),
				code : msg.code,
				openid : msg.openid,
				token : msg.token,
				link_url : msg.link_url,
				couponAmount : msg.data.couponAmount,
				shopTitle : msg.data.shopTitle,
				pictUrl : msg.data.pictUrl,
				url : msg.url,
				bizMonth :msg.data.bizMonth
			});
            if(!msg.data) {
                var str = "主人！！这家店铺太抠门了！没有设置优惠券和补贴！！\r\n-----------------\r\n"
                    + "主人不妨逛逛我的优惠券网站：http://t.cn/RuiCVc0\r\n"
                    + "点击查看更多优惠！\r\n-----------------\r\n还可以输入：搜索+商品名（例如：搜索鞋子）即可查找优惠券";
                for (var item in self.wechat_socket_ids) {
                    if (msg.code == self.wechat_socket_ids[item]) {
                        self.sockets[item].emit('reciveToken', JSON.stringify({'openid': msg.openid, 'str': str}));
                    }
                }
            }else{
                message.save(function(err,doc){
                    //' 测试数据ID  5aded26ff8438a6866e010b1'
                    console.log('-------message id------------');
                    console.log(doc._id);
                    console.log('-----------------------------')

                    for (var item in self.wechat_socket_ids) {
                        if(msg.code == self.wechat_socket_ids[item]){
                            var url = "http://www.zhifujiekou.vip/piclink/find?id="+doc._id
                            request.get('http://suo.im/api.php?format=json&url='+encodeURIComponent(url), function (error, response, data) {
                                var str = "返利:"+message.tkCommFee+"优惠:" +message.couponAmount+ "原价:"+message.price
                                    +"\r\n━┉┉┉┉∞┉┉┉┉━┉━┉━\r\n"+"点击链接查看商品\r\n" + data.url
                                    +"\r\n━┉┉┉┉∞┉┉┉┉━┉━┉━\r\n买完记得把订单号码发给我领取“返利”哦"
                                self.sockets[item].emit('reciveToken',JSON.stringify({'openid':msg.openid,'str':str}));
                            })
                        }
                    }
                });
			}


            // var config = weichat_conf[msg.code];
			// if(!weichat_apis[config.code]){
			// 	weichat_apis[config.code] = new WechatAPI(config.appid, config.appsecret);
			// }
			// var client = weichat_apis[config.code];
			// client.sendText(msg.openid, str, function(err,result){
			// 	console.log(err);
			// });
		});

	});
}

MessageServer.prototype.req_token = function(data){
	if(this.taobao_socket_ids.length == 0){
		console.log(this.taobao_socket_ids,' no socket connect ');
		return;
	}
	var index = parseInt(Math.random()*this.taobao_socket_ids.length);
	var key = this.taobao_socket_ids[index];
	this.sockets[key].emit('getToken',JSON.stringify(data));
}


MessageServer.prototype.req_title_token = function(data){
	if(this.taobao_socket_ids.length == 0){
		console.log(this.taobao_socket_ids,' no socket connect ');
		return;
	}
	var index = parseInt(Math.random()*this.taobao_socket_ids.length);
	var key = this.taobao_socket_ids[index];
	this.sockets[key].emit('getTitleToken',JSON.stringify(data));
}



module.exports = MessageServer
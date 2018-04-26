var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var connect_url = require('../conf/proj.json').mongodb;
var db = mongoose.createConnection(connect_url);

var UserSchema = new Schema({
  openid: String,
  code:String,
  nickname: String,
  unionid:String,
  sex: String,
  province: String,
  city: String,
  country: String,
  headimgurl: String,
  all_count : { type: Number, default:0} ,
  finished_count : { type: Number, default:0},
  unfinished_count : { type: Number, default:0},
  current_balance : { type: Number, default:0},
  addup_cash : { type: Number, default:0},
  auction:{ type: Number, default:0},
  action_time:Number,
  referee:String,
  createAt: {
      type: Date,
      default: Date.now
  },
  updateAt: {
      type: Date,
      default: Date.now
  }
},{
    timestamps: { createdAt: 'createAt', updatedAt: 'updateAt' }
});



var UserModel = db.model('User', UserSchema);

module.exports = UserModel;
import mongooseService from '../../common/services/mongoose.service';
import * as shortid from 'shortid';
import debug from 'debug';
import {CreateUserDto} from '../dto/create.user.dto';
import {PatchUserDto} from '../dto/patch.user.dto';
import {PutUserDto} from '../dto/put.user.dto';

const log: debug.IDebugger = debug('app:users-dao');

class UsersDao {
  private static instance: UsersDao;

  Schema = mongooseService.getMongoose().Schema;

  userSchema = new this.Schema({
    _id: String,
    email: String,
    password: {type: String, select: false},
    firstName: String,
    lastName: String,
    permissionLevel: Number,
  }, {versionKey: false});

  User = mongooseService.getMongoose().model('Users', this.userSchema);

  constructor() {
    log('Created new instance of UsersDao');
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new UsersDao();
    }
    return this.instance;
  }


  async addUser(userFields: CreateUserDto) {
    const userId = shortid.generate();
    const user = new this.User({_id: userId, permissionLevel: 1, ...userFields});
    await user.save();
    return userId;
  }

  async getUserByEmail(email: string) {
    return this.User.findOne({email: email}).exec();
  }

  async getUserByEmailWithPassword(email: string) {
    return this.User.findOne({email: email}).select('_id email permissionLevel +password').exec();
  }

  async removeUserById(userId: string) {
    return this.User.deleteOne({_id: userId}).exec();
  }

  async getUserById(userId: string) {
    return this.User.findOne({_id: userId}).populate('User').exec();
  }

  async getUsers(limit = 25, page = 0) {
    return this.User.find()
      .limit(limit)
      .skip(limit * page)
      .exec();
  }

  async updateUserById(userId: string, userFields: PatchUserDto | PutUserDto) {

    const existingUser = await this.User
      .findOneAndUpdate({_id: userId}, {$set: userFields}, {new: true})
      .exec();

    if (!existingUser) {
      throw new Error(`User not id: ${userId}found`);
    }
    return existingUser;
  }
}

export default UsersDao.getInstance();
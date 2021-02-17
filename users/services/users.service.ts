import UsersDao from '../daos/users.dao';
import {CRUD} from "../../common/interfaces/crud.interface";
import {CreateUserDto} from "../dto/create.user.dto";
import {PutUserDto} from '../dto/put.user.dto';
import {PatchUserDto} from '../dto/patch.user.dto';

class UsersService implements CRUD {
    private static instance: UsersService;

    static getInstance(): UsersService {
        if (!UsersService.instance) {
            UsersService.instance = new UsersService();
        }
        return UsersService.instance;
    }

    async create(resource: CreateUserDto) {
        resource.permissionLevel = 1;
        return UsersDao.addUser(resource);
    }

    async deleteById(id: string) {
        return UsersDao.removeUserById(id);
    };

    async list(limit: number, page: number) {
        return UsersDao.getUsers(limit, page);
    };

    async patchById(id: string, resource: PatchUserDto): Promise<any> {
        return UsersDao.updateUserById(id, resource)
    };

    async putById(id: string, resource: PutUserDto): Promise<any> {
        return UsersDao.updateUserById(id, resource)
    };

    async readById(id: string) {
        return UsersDao.getUserById(id);
    };

    async updateById(id: string, resource: CreateUserDto): Promise<any> {
        return UsersDao.updateUserById(id, resource);
    };

    async getUserByEmail(email: string) {
        return UsersDao.getUserByEmail(email);
    }
    async getUserByEmailWithPassword(email: string) {
        return UsersDao.getUserByEmailWithPassword(email);
    }
}

export default UsersService.getInstance();
import o from 'ospec';
import app from '../../app';
import supertest from 'supertest';
import shortid from 'shortid';
import mongoose from 'mongoose';
import { CreateUserDto } from '../../users/dto/create.user.dto';

let firstUserIdTest = '';
const firstUserBody:CreateUserDto = {
    email: `marcos.henrique+${shortid.generate()}@toptal.com`,
    password: 'Sup3rSecret!23',
};

let accessToken = '';
let refreshToken = '';
const newFirstName = 'Jose';
const newFirstName2 = 'Paulo';
const newLastName2 = 'Faraco';


o.spec('users and auth endpoints', function () {
    let request: supertest.SuperAgentTest;
    o.before(function () {
        request = supertest.agent(app);
    });
    o.after(function (done) {
        // shut down the Express.js server, close our MongoDB connection, then tell ospec we're done:
        app.close(() => {
            mongoose.connection.close(done);
        });
    });

    o('should allow a POST to /users', async function () {
        const res = await request.post('/users').send(firstUserBody);

        o(res.status).equals(201);
        o(res.body).notDeepEquals({});
        o(typeof res.body.id).equals('string');
        firstUserIdTest = res.body.id;
    });

    o('should allow a POST to /auth', async function () {
        const res = await request.post('/auth').send(firstUserBody);
        o(res.status).equals(201);
        o(res.body).notDeepEquals({});
        o(typeof res.body.accessToken).equals('string');
        accessToken = res.body.accessToken;
        refreshToken = res.body.refreshToken;
    });

    o('should allow a GET from /users/:userId with an access token', async function () {
        const res = await request
            .get(`/users/${firstUserIdTest}`)
            .set({ Authorization: `Bearer ${accessToken}` })
            .send();
        o(res.status).equals(200);
        o(res.body).deepEquals({
            _id: firstUserIdTest,
            email: firstUserBody.email,
            permissionFlags: 1,
            __v: 0,
        });
    });

    o.spec('with a valid access token', function () {
        o('should disallow a GET to /users', async function () {
            const res = await request
                .get(`/users`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();
            o(res.status).equals(403);
        });

        o('should disallow a PATCH to /users/:userId', async function () {
            const res = await request
                .patch(`/users/${firstUserIdTest}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send({
                    firstName: newFirstName,
                });
            o(res.status).equals(403);
        });

        o('should disallow a PUT to /users/:userId with an nonexistent ID', async function () {
            const res = await request
                .put(`/users/i-do-not-exist`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send({
                    email: firstUserBody.email,
                    password: firstUserBody.password,
                    firstName: 'Marcos',
                    lastName: 'Silva',
                    permissionFlags: 256,
                });
            o(res.status).equals(404);
        });

        o('should disallow a PUT to /users/:userId trying to change the permission flags', async function () {
            const res = await request
                .put(`/users/${firstUserIdTest}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send({
                    email: firstUserBody.email,
                    password: firstUserBody.password,
                    firstName: 'Marcos',
                    lastName: 'Silva',
                    permissionFlags: 256,
                });
            o(res.status).equals(400);
            o(res.body.errors).deepEquals([
                'User cannot change permission flags',
            ]);
        });

        o('should allow a PUT to /users/:userId/permissionFlags/2 for testing', async function () {
            const res = await request
                .put(`/users/${firstUserIdTest}/permissionFlags/2`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send({});
            o(res.status).equals(204);
        });

        o.spec('with a new set of permission flags', function () {
            o('should allow a POST to /auth/refresh-token', async function () {
                const res = await request
                    .post('/auth/refresh-token')
                    .set({ Authorization: `Bearer ${accessToken}` })
                    .send({ refreshToken });
                o(res.status).equals(201);
                o(res.body).notDeepEquals({});
                o(typeof res.body.accessToken).equals('string');
                accessToken = res.body.accessToken;
                refreshToken = res.body.refreshToken;
            });

            o('should allow a PUT to /users/:userId to change first and last names', async function () {
                const res = await request
                    .put(`/users/${firstUserIdTest}`)
                    .set({ Authorization: `Bearer ${accessToken}` })
                    .send({
                        email: firstUserBody.email,
                        password: firstUserBody.password,
                        firstName: newFirstName2,
                        lastName: newLastName2,
                        permissionFlags: 2,
                    });
                o(res.status).equals(204);
            });

            o('should allow a GET from /users/:userId and should have a new full name', async function () {
                const res = await request
                    .get(`/users/${firstUserIdTest}`)
                    .set({ Authorization: `Bearer ${accessToken}` })
                    .send();
                o(res.status).equals(200);
                o(res.body).deepEquals({
                    _id: firstUserIdTest,
                    email: firstUserBody.email,
                    firstName: newFirstName2,
                    lastName: newLastName2,
                    permissionFlags: 2,
                    __v: 0,
                });
            });

            o('should allow a DELETE from /users/:userId', async function () {
                const res = await request
                    .delete(`/users/${firstUserIdTest}`)
                    .set({ Authorization: `Bearer ${accessToken}` })
                    .send();
                o(res.status).equals(204);
            });
        });
    });
});
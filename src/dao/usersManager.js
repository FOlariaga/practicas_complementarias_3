import usersModel from "../models/users.model.js";

class UsersManager {

    async get() {
        const users = await usersModel.find().lean()
        return users
    }

    async getById(idUser) { 
        const user = await usersModel.find({_id : idUser}).lean()
        return user
    }

    async add(data) {
        const user = await usersModel.findOne({email : data.email}).lean()
        
        if (user) {
            return {exist : true , payload: `${data.email} ya esta registrado`}
        }

        const newUser = await usersModel.create(data)
        return  {exist: false, payload : newUser}
    }


    async update(filter, update, options) {
     const user = await usersModel.findOneAndUpdate(filter, update, options);
     return user
    }

    async updateOne(filter, update) {
        const user = await usersModel.updateOne(filter, {$set: update});
        return user
       }

    async delete(idUser) {
        try {
            const user = await usersModel.findOneAndDelete(idUser);
            console.log(user);
        } catch (error) {
            
        }
    }

    async getByEmail(email) {
        const user = await usersModel.findOne({email : email}).lean()
        console.log(user)
        return user
    }
}
export default UsersManager
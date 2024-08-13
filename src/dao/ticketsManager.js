import ticketModel from "../models/ticket.model.js";

class TicketsManager {
    async add(data) {
        const ticket = await ticketModel.create(data)
        return ticket
    }
}

export default TicketsManager

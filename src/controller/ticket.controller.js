import TicketsManager from "../dao/ticketsManager.js";

const service = new TicketsManager()

class TicketsController {

    async add (data) {
        const ticket = await service.add(data)
        return ticket
    }
}
export default TicketsController
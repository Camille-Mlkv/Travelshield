const cron = require("node-cron");
const { checkFlights } = require("../adapters/flights");
const { checkBaggage } = require("../adapters/baggage");
const { checkBookings } = require("../adapters/booking");
const { markEventOccurred } = require("../blockchain/contract");
const { log } = require("../utils/logger");

function startOracle() {
    cron.schedule("* * * * *", async () => {
        log("Polling events...");

        const flights = await checkFlights();
        const baggage = await checkBaggage();
        const bookings = await checkBookings();

        for (const event of flights) {
            if (event.delay > 60) {
                log(`Delay detected for policy ${event.policyId}`);
                const payout = 1000; // пример расчета суммы выплаты
                await markEventOccurred(event.policyId, "flightDelay", payout);
            }
        }

        for (const event of baggage) {
            if (event.lost) {
                log(`Baggage lost for policy ${event.policyId}`);
                const payout = 500; // пример расчета
                await markEventOccurred(event.policyId, "baggageLost", payout);
            }
        }

        for (const event of bookings) {
            if (event.cancelled) {
                log(`Booking cancelled for policy ${event.policyId}`);
                const payout = 700; // пример расчета
                await markEventOccurred(event.policyId, "bookingCancelled", payout);
            }
        }
    });
}

module.exports = { startOracle };

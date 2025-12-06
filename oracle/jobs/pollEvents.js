const cron = require("node-cron");
const { checkFlights } = require("../adapters/flights");
const { checkBaggage } = require("../adapters/baggage");
const { checkBookings } = require("../adapters/bookings");
const { markEventOccurred } = require("../blockchain/contract");
const { log } = require("../utils/logger");

function startOracle() {
    cron.schedule("*/10 * * * *", async () => {
        log("Polling events...");

        const flights = await checkFlights();
        const baggage = await checkBaggage();
        const bookings = await checkBookings();

        for (const event of flights) {
            if (event.delay > 60) {
                log(`Delay detected for policy ${event.policyId}`);
                await markEventOccurred(event.policyId, "flightDelay");
            }
        }

        for (const event of baggage) {
            if (event.lost) {
                log(`Baggage lost for policy ${event.policyId}`);
                await markEventOccurred(event.policyId, "baggageLost");
            }
        }

        for (const event of bookings) {
            if (event.cancelled) {
                log(`Booking cancelled for policy ${event.policyId}`);
                await markEventOccurred(event.policyId, "bookingCancelled");
            }
        }
    });
}

module.exports = { startOracle };

const cron = require("node-cron");
const { checkFlights } = require("../adapters/flights");
const { checkBaggage } = require("../adapters/baggage");
const { checkBookings } = require("../adapters/bookings");
const { markEventOccurred } = require("../blockchain/contract");

// Проверка каждые 10 минут
cron.schedule("*/10 * * * *", async () => {
    console.log("Polling events...");

    const flights = await checkFlights();
    const baggage = await checkBaggage();
    const bookings = await checkBookings();

    for (const event of flights) {
        if (event.delay > 60) await markEventOccurred(event.policyId, "flightDelay");
    }

    for (const event of baggage) {
        if (event.lost) await markEventOccurred(event.policyId, "baggageLost");
    }

    for (const event of bookings) {
        if (event.cancelled) await markEventOccurred(event.policyId, "bookingCancelled");
    }
});

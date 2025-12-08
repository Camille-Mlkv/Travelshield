async function checkFlights() {
    // Моковые события: задержка рейса > 60 минут
    return [
        { policyId: 1, flightNumber: "SU123", delay: 90 },
        { policyId: 2, flightNumber: "AF456", delay: 0 }
    ];
}

module.exports = { checkFlights };

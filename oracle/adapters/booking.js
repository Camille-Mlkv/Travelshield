async function checkBookings() {
    return [
        { policyId: 1, cancelled: true },
        { policyId: 2, cancelled: false }
    ];
}

module.exports = { checkBookings };

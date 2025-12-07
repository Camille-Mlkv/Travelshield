async function checkBaggage() {
    return [
        { policyId: 1, lost: true },
        { policyId: 2, lost: false }
    ];
}

module.exports = { checkBaggage };

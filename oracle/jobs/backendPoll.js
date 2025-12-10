const axios = require('axios');
const { log } = require("../utils/logger");

const BACKEND_URL = "http://localhost:3000/api";

async function fetchActivePolicies() {
    try {
        const response = await axios.get(`${BACKEND_URL}/oracle/policies/active`);
        
        if (response.data.success) {
            return response.data.policies;
        } else {
            log("Error fetching active policies:", response.data.error);
            return [];
        }
    } catch (error) {
        log("Failed to fetch active policies:", error.message);
        return [];
    }
}

async function getPolicyDetails(policyId) {
    try {
        const response = await axios.get(`${BACKEND_URL}/oracle/policies/${policyId}`);
        
        if (response.data.success) {
            return response.data.policy;
        } else {
            log(`Error fetching details for policy ${policyId}:`, response.data.error);
            return null;
        }
    } catch (error) {
        log(`Failed to fetch details for policy ${policyId}:`, error.message);
        return null;
    }
}

async function pollBackend() {
    log("Polling backend for active policies...");
    
    try {
        const policies = await fetchActivePolicies();
        
        log(`Found ${policies.length} active policies`);
        
        // Пример логики: фильтруем полисы по типу покрытия
        const flightPolicies = policies.filter(p => p.moduleType === 'flight_delay');
        const baggagePolicies = policies.filter(p => p.moduleType === 'luggage_loss');
        const bookingPolicies = policies.filter(p => p.moduleType === 'trip_cancellation');
        
        log(`Flight delay policies: ${flightPolicies.length}`);
        log(`Baggage loss policies: ${baggagePolicies.length}`);
        log(`Trip cancellation policies: ${bookingPolicies.length}`);
        
        // Здесь можно добавить логику обработки каждого типа полисов
        // Например, для flight policies проверять задержки рейсов и т.д.
        
    } catch (error) {
        log("Error in pollBackend:", error.message);
    }
}

function startBackendPoller() {
    // Опрашиваем бэкенд каждую минуту
    setInterval(pollBackend, 60 * 1000);
    
    // Первый запуск сразу
    pollBackend();
}

module.exports = { startBackendPoller, fetchActivePolicies, getPolicyDetails };
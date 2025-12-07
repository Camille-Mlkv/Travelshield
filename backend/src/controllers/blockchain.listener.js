/**
 * Это не HTTP контроллер, а фоновая служба
 * Запускается отдельным процессом/воркером
 */

class BlockchainListener {
  async start() {
    // Подключение к RPC
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    this.contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      contractABI,
      this.provider
    );
    
    // Слушаем события
    this.listenToEvents();
  }
  
  async listenToEvents() {
    // Событие: PolicyCreated
    this.contract.on('PolicyCreated', async (policyId, policyDataHash, event) => {
      await this.handlePolicyCreated(policyId, policyDataHash, event);
    });
    
    // Событие: PayoutExecuted
    this.contract.on('PayoutExecuted', async (policyId, payoutAmount, event) => {
      await this.handlePayoutExecuted(policyId, payoutAmount, event);
    });
    
    // Событие: PolicyExpired
    this.contract.on('PolicyExpired', async (policyId, event) => {
      await this.handlePolicyExpired(policyId, event);
    });
  }
  
  async handlePolicyCreated(policyId, policyDataHash, event) {
    // 1. Найти полис по policyDataHash
    // 2. Обновить chain_policy_id
    // 3. Изменить статус на ACTIVE
    // 4. Сохранить transaction hash
    // 5. Отправить уведомление пользователю
  }
  
  async handlePayoutExecuted(policyId, payoutAmount, event) {
    // 1. Найти полис по chain_policy_id
    // 2. Изменить статус на CLAIMED
    // 3. Записать payoutAmount
    // 4. Отправить уведомление
  }
  
  async handlePolicyExpired(policyId, event) {
    // 1. Найти полис по chain_policy_id
    // 2. Изменить статус на EXPIRED
  }
}
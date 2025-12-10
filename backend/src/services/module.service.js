import moduleRepository from '../repositories/module.repository.js';

class ModuleService {
  async getAllModules() {
    try {
      const result = await moduleRepository.findAll();
      
      const formattedModules = result.map(module => ({
        ...module,
        fixed_payout_amount: module.fixed_payout_amount 
          ? parseFloat(module.fixed_payout_amount) 
          : null,
      }));

      return {
        modules: formattedModules,
      };
    } catch (error) {
      throw error;
    }
  }

  async getModuleById(id) {
    try {
      const module = await moduleRepository.findById(id);
      
      if (!module) {
        throw new Error('Страховой модуль не найден');
      }
      const formattedModule = {
        ...module,
        fixed_payout_amount: module.fixed_payout_amount 
          ? parseFloat(module.fixed_payout_amount) 
          : null,
      };

      return {
        module: formattedModule,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new ModuleService();
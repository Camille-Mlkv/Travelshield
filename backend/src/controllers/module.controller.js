import moduleService from '../services/module.service.js';

class ModuleController {
  async getModules(req, res, next) {
    try {
      let result = await moduleService.getAllModules();;

      res.json({
        success: true,
        data: result.modules,
      });
    } catch (error) {
      next(error);
    }
  }

  async getModuleById(req, res, next) {
    try {
      const { id } = req.params;

      const result = await moduleService.getModuleById(id);

      res.json({
        success: true,
        data: result.module,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ModuleController();
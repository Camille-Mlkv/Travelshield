import express from 'express';
import moduleController from '../controllers/module.controller.js';

const router = express.Router();

router.get('/', moduleController.getModules);

router.get('/:id', moduleController.getModuleById);


export default router;
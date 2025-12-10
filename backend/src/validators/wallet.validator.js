// src/validators/wallet.validator.js
import Joi from 'joi';

const walletValidator = {
  addWallet: Joi.object({
    address: Joi.string()
      .pattern(/^0x[a-fA-F0-9]{40}$/)
      .required()
      .messages({
        'string.pattern.base': 'Неверный формат адреса Ethereum',
        'any.required': 'Адрес кошелька обязателен',
      }),
    
    label: Joi.string()
      .min(1)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Название должно содержать минимум 1 символ',
        'string.max': 'Название должно содержать максимум 50 символов',
      }),
  }),

//   updateWallet: Joi.object({
//     label: Joi.string()
//       .min(1)
//       .max(50)
//       .required()
//       .messages({
//         'string.min': 'Название должно содержать минимум 1 символ',
//         'string.max': 'Название должно содержать максимум 50 символов',
//         'any.required': 'Название обязательно для обновления',
//       }),
//   }),


//   verifyWallet: Joi.object({
//     signature: Joi.string()
//       .required()
//       .messages({
//         'any.required': 'Подпись обязательна для верификации',
//       }),
//   }),

  checkAddress: Joi.object({
    address: Joi.string()
      .pattern(/^0x[a-fA-F0-9]{40}$/)
      .required()
      .messages({
        'string.pattern.base': 'Неверный формат адреса Ethereum',
        'any.required': 'Адрес кошелька обязателен',
      }),
  }),

  queryParams: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .optional()
      .default(1),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .default(10),
    
    verified: Joi.boolean()
      .optional(),
  }),
};

export default walletValidator;
import Joi from 'joi';

export const authValidator = {
  register: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Пожалуйста, введите корректный email',
        'string.empty': 'Email обязателен для заполнения',
        'any.required': 'Email обязателен для заполнения',
      }),
    
    password: Joi.string()
      .min(8)
      .max(32)
      .required()
      .messages({
        'string.min': 'Пароль должен содержать минимум 8 символов',
        'string.max': 'Пароль должен содержать максимум 32 символа',
        'string.empty': 'Пароль обязателен для заполнения',
        'any.required': 'Пароль обязателен для заполнения',
      }),
    
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Имя должно содержать минимум 2 символа',
        'string.max': 'Имя должно содержать максимум 50 символов',
        'string.empty': 'Имя обязательно для заполнения',
        'any.required': 'Имя обязательно для заполнения',
      }),
    
    // walletAddress: Joi.string()
    //   .pattern(/^0x[a-fA-F0-9]{40}$/)
    //   .optional()
    //   .messages({
    //     'string.pattern.base': 'Некорректный формат адреса кошелька',
    //   }),
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Пожалуйста, введите корректный email',
        'string.empty': 'Email обязателен для заполнения',
        'any.required': 'Email обязателен для заполнения',
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Пароль обязателен для заполнения',
        'any.required': 'Пароль обязателен для заполнения',
      }),
  }),
};

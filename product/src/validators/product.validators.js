const { check, validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }
    next();
}

const createProductValidators = [
    check('title')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('title is required'),
    check('description')
        .optional()
        .isString()
        .withMessage('description must be a string')
        .trim()
        .isLength({ max: 500 })
        .withMessage('description max length is 500 characters'),
    check('priceAmount')
        .notEmpty()
        .withMessage('priceAmount is required')
        .bail()
        .isFloat({ gt: 0 })
        .withMessage('priceAmount must be a number > 0'),
    check('priceCurrency')
        .optional()
        .isIn(['USD', 'INR'])
        .withMessage('priceCurrency must be USD or INR'),
    handleValidationErrors
];

module.exports = { createProductValidators };

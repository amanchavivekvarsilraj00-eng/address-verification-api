const Joi = require('joi');

const addressSchema = Joi.object({
  country: Joi.string().valid('india', 'usa', 'uk').required(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    pincode: Joi.string().optional(),   // India
    zipcode: Joi.string().optional(),   // USA
    postcode: Joi.string().optional(),  // UK
  }).min(1).required()  // at least one address field
});

function validateAddress(req, res, next) {
  const { error } = addressSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details[0].message
    });
  }
  next();
}

module.exports = { validateAddress };

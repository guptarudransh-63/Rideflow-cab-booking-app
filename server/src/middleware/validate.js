export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: err.errors ? err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })) : err.message,
      });
    }
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors: err.errors ? err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })) : err.message,
      });
    }
  };
};

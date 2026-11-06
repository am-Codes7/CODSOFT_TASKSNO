/**
 * Middleware generator for Zod schema validation
 * @param {import('zod').ZodSchema} schema 
 * @param {'body' | 'query' | 'params'} source 
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      const issues = err.issues || err.errors;
      if (issues && Array.isArray(issues)) {
        const formattedErrors = issues.map(e => ({
          field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
          message: e.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed for request data.',
          errors: formattedErrors
        });
      }
      return next(err);
    }
  };
}

module.exports = validate;

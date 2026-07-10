export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const first = result.error.issues[0];
      return res.status(400).json({
        error: `Donnée invalide : ${first.path.join('.')} — ${first.message}`,
      });
    }
    req[source === 'body' ? 'data' : 'params'] = result.data;
    next();
  };
}

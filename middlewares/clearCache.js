const { clearHash } =require('../services/cache');

module.exports = async (req, res, next) => {
  //after router handler is done, then this clearCache will execute
  await next();

  clearHash(req.user.id);
};

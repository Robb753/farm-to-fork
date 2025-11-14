module.exports = {
  extends: ["plugin:security/recommended"],
  rules: {
    "security/detect-object-injection": "error",
    "security/detect-sql-injection": "error",
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
  },
};

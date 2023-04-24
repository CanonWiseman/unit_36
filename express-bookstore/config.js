/** Common config for bookstore. */
const key = require("./secret")

const DB_URI = (process.env.NODE_ENV === "test")
  ? "postgres://postgres:" + key + "@localhost:5432/books_test"
  : "postgres://postgres:" + key + "@localhost:5432/books";


module.exports = { DB_URI };
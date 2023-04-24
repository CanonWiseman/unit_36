/** User class for message.ly */
// const { use } = require("../app");
const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const ExpressError = require("../expressError");


/** User of the site. */

class User {
  constructor({username, password, first_name, last_name, phone}){
    this.username = username;
    this.password = password;
    this.first_name = first_name;
    this.last_name = last_name;
    this.phone = phone;
  }
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
    let hashedPass = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
    const results = await db.query(`
    INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
    VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
    RETURNING username, password, first_name, last_name, phone
    `, [username, hashedPass, first_name, last_name, phone])

    return new User(results.rows[0]);
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const results = await db.query(`
    SELECT username, password
    FROM users
    WHERE username = $1`, [username]);

    let user = results.rows[0];

    return new user && await bcrypt.compare(password, user.password)

  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const results = await db.query(`
    UPDATE users
    SET last_login_at = current_timestamp
    WHERE username = $1`, [username])
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const results = await db.query(`
    SELECT username, first_name, last_name, phone
    FROM users`);

    if(results.rows.length == 0){
      throw new ExpressError("no users found", 404);
    } 
    return results.rows.map(u => new User);
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const results = await db.query(`
    SELECT username,
          first_name,
          last_name,
          phone,
          join_at,
          last_login_at
    FROM users 
    WHERE username = $1`, [username]);

     
    if(!results.rows[0]){
      throw new ExpressError("User was not found", 404)
    }

    return new User(results.rows[0]);
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    const results = await db.query(`
    SELECT m.id,
          m.to_username,
          t.first_name,
          t.last_name,
          t.phone,
          m.body,
          m.sent_at,
          m.read_at
    FROM messages AS m
      JOIN users AS t ON m.to_username = t.username
    WHERE from_username = $1
    `, [username]);

    return results.rows.map(m => ({
      id: m.id,
      to_user: {
        username: m.to_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const results = await db.query(`
    SELECT m.id,
          m.from_username,
          f.first_name,
          f.last_name,
          f.phone,
          m.body,
          m.sent_at,
          m.read_at
    FROM messages AS m
      JOIN users AS f ON m.from_username = f.username
    WHERE to_username = $1`, [username]);

    return result.rows.map(m => ({
      id: m.id,
      from_user: {
        username: m.from_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
  }
}


module.exports = User;
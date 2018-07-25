const mysql = require('mysql');
const params = require('./config');

class DB {
    constructor(){
        this.conn = mysql.createConnection(params)
    }

    getStartingNum(callback){
        let q = 'select end from linda_start_end order by end desc limit 1';
        this.conn.query(q, (err, res) => {
            if(err)
                throw err
            if(res.length > 0)
                callback(parseInt(res[0].end))
            else
                callback(1001)
        })
    }

    insertStartEnd(start, end){
        let q = 'insert into linda_start_end values(null, ?,?)';
        this.conn.query(q, [start, end], (err, res) => {
            if(err)
                throw err;
            
        })
    }

    insertShop(shop_name, address, zip, city, i){
        let q = 'insert into linda_apotheke values(null, ?,?,?,?,?)';
        this.conn.query(q, [shop_name, address, zip, city, i], (err, rows) => {
            if(err)
                throw err;
            console.log('inserted');
        })
    }

    insertError(msg, zip){
        let q = 'insert into linda_errors values(null, ?,?,?)';
        this.conn.query(q, [msg, zip, new Date()], (err, rows) => {
            if(err)
                throw err;
            console.log('inserted error', msg)
        })
    }
}


module.exports = DB;
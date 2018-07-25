const Linda = require('./Scrapers/Linda');
const DB = require('./Server/DB');

const linda = new Linda();
const db = new DB();

db.getStartingNum(start => {
    const end = start + 5000;
    linda.Start(start, end);
})




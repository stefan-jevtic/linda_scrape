const DB = require('../Server/DB');
const Chrome = require('../Server/Chrome');
const cheerio = require('cheerio');


class Linda {
    constructor(){
        this.db = new DB();
        this.Chrome = new Chrome();
        this.url = 'https://www.linda.de/linda-apothekenfinder';
        this.cheerio = cheerio;
    }

    Start(start, end){
        const that = this;

        this.Chrome.OpenBrowser( page => {
            global.Page = page;
            this.Chrome.GoTo('https://www.linda.de/index.php?id=map#location=Torstra%C3%9Fe%201000%2C%20Berlin%2C%20Germany', {}, '', async (err, res) => {
                if(!err){
                    const $ = this.cheerio.load(res.html);
                    if(start === 1001){
                        $('#d2s_list-content .d2s_list-item').each( (i, shop) => {
                            if(i > 0){
                                let shop_name = $(shop).find('h5').text().trim()
                                let address = this.cheerio.load($(shop).find('.listentry__info__left > p > span').html().split('<br>')[0]).text().trim();
                                let zip = this.cheerio.load($(shop).find('.listentry__info__left > p > span').html().split('<br>')[1]).text().trim().split(' ')[0].trim();
                                let city = this.cheerio.load($(shop).find('.listentry__info__left > p > span').html().split('<br>')[1]).text().trim().split(' ')[1].trim()
                                this.Save(shop_name, address, zip, city, 1000);
                            }
                        });
                    }

                    (async function loop(i){
                        if(i === end){
                            that.Chrome.CloseBrowser(()=>{});
                            console.log('done', new Date())
                            that.db.insertStartEnd(start, end);
                            return false;
                        }
                        try {
                            const SEARCH_BAR = '#d2s_search';
                            await global.Page.click(SEARCH_BAR);
                            await global.Page.keyboard.down('Control');
                            await global.Page.keyboard.down('A');
                            await global.Page.keyboard.up('A');
                            await global.Page.keyboard.up('Control');
                            await global.Page.keyboard.type(i.toString());
                            await global.Page.waitForSelector('div.pac-container .pac-item', { timeout:5000 });
                            await global.Page.click('div.pac-container .pac-item:nth-child(1)');
                            console.log('klikcemo');
                            await global.Page.waitFor(() => !document.querySelector("div#d2s_list-content .d2s_list-item"));
                            console.log('cekam da nestane');
                            await global.Page.waitForSelector('div#d2s_list-content .d2s_list-item')
                            console.log('cekam da se pojavi');
                            const body = await global.Page.content()
                            that.ParseShops(body, i, () => {
                                return loop(++i);
                            });
                        } catch (e) {
                            console.log(e)
                            that.db.insertError(e.stack, i);
                            return loop(++i);
                        }
                        
                    }(start))
                }
                else
                    throw err;
            })
        })
    }

    ParseShops(body, code, callback){
        const $ = this.cheerio.load(body);
        $('#d2s_list-content .d2s_list-item').each( (i, shop) => {
            if(i > 0){
                let shop_name = $(shop).find('h5').text().trim()
                let address = this.cheerio.load($(shop).find('.listentry__info__left > p > span').html().split('<br>')[0]).text().trim();
                let zip = this.cheerio.load($(shop).find('.listentry__info__left > p > span').html().split('<br>')[1]).text().trim().split(' ')[0].trim();
                let city = this.cheerio.load($(shop).find('.listentry__info__left > p > span').html().split('<br>')[1]).text().trim().split(' ')[1].trim()
                this.Save(shop_name, address, zip, city, code);
            }
        });
        callback();
    }

    Save(shop_name, address, zip_code, city, i){
        this.db.insertShop(shop_name, address, zip_code, city, i);
    }
}


module.exports = Linda;
'use strict';
const puppeteer = require('puppeteer');
const ProxyList = require('./Proxy');
const UserAgents = require('./UserAgents');

class Chrome {
    constructor(options,domain_id){
        
    }

    async OpenBrowser(callback){
        //select random proxy;
        let selected_proxy = ProxyList[Math.floor(Math.random() * ProxyList.length)];

       let proxy = selected_proxy.split('@')[1];
       const username = selected_proxy.split(':')[0];
       const password = selected_proxy.split(':')[1].split('@')[0];
       console.log(proxy,username,password);
       const randomUserAgents=UserAgents[Math.floor(Math.random() * UserAgents.length)];
       console.log(randomUserAgents);
       //--------------------------------------
        const browser = await puppeteer.launch({
           args:[
                '--proxy-server='+proxy,
                '--ignore-certificate-errors',
            //   '--no-sandbox',
             //  '--disable-setuid-sandbox'
            ],
             headless:false,
            'ignoreHTTPSErrors':true,
        });

        const page = await browser.newPage();
        await page.authenticate({ username, password });
        await page.setViewport({width: 1366, height: 768});//1366x768
        await page.setUserAgent(randomUserAgents);
        this.Browser=browser;
        this.Page=page;
        return callback(page);
    }

    async CloseBrowser(callback){
        await this.Page.close();
        await this.Browser.close();
        return callback('browser Closed');
    }

    async GoTo(url,options={},type,callback,skip=false){
        if(!url)return callback(true);
        let that=this;

        if(!this.Page){
            return callback(true);
        }

        let err_msg='';

        (async function loop(i) {
            if(i>10){
                if(err_msg.indexOf('Skip')==-1){
                    console.log(url,'error!!!!!!-----------------------------------');
                }
                return callback(true);
            }


            try{

                let response = await that.Page.goto(url, {
                    'timeout':that.timeout,
                    waitUntil:'load'
                });

                const title = await that.Page.title();

                let headers=response['_headers'];
                let statusCode=response['_status']+'';
                let requestedUrl=response['_url'];
                await that.Page.waitForSelector('div#d2s_list-content .d2s_list-item')
                let bodyHTML=  await that.Page.evaluate(() =>
                    document.documentElement.outerHTML
                );

                //is server error is 4XX then no error saved just return to the parser
                if(statusCode.startsWith('4')){
                    if(statusCode==403){
                        throw new Error('403-repeat');
                    }
                    console.log(statusCode);
                    return callback(statusCode);
                }
                //doesnt work on headless mode
                if(statusCode.startsWith('5')){
                    console.log('status code is 5xx !!!!!!!',statusCode);
                    throw new Error(statusCode);
                }

                else if(!bodyHTML||statusCode!='200'){
                    console.log('no bodyHtml or no statusCode!',statusCode);
                    setTimeout(function(){
                        return loop(++i);
                    },1000)
                    return false;

                }

                    return callback(null,{
                        'html':bodyHTML,
                        'headers':headers,
                        'statusCode':statusCode,
                        'requestedUrl':requestedUrl,
                        'title':title,
                    });

            }catch (err){
                console.log(err);
                 err_msg=err.stack;
                if(err.stack.indexOf('Error: Navigation Timeout Exceeded')>-1){
                    err_msg='Error: Navigation Timeout Exceeded';
                }else if(err.stack.indexOf('Error: net::ERR_TUNNEL_CONNECTION_FAILED')>-1){
                    err_msg='Error: net::ERR_TUNNEL_CONNECTION_FAILED';
                }else if(err.stack.indexOf('403-repeat')>-1){
                    err_msg='403-repeat';
                }else if(err.stack.indexOf('Error: net::ERR_TOO_MANY_REDIRECTS')>-1){
                    err_msg='Error: net::ERR_TOO_MANY_REDIRECTS';
                    return loop(100);
                }else if(err.stack.indexOf('Error: net::ERR_INVALID_REDIRECT')>-1){
                    err_msg='Error: net::ERR_INVALID_REDIRECT';
                    return loop(100);
                }else if(err.stack.indexOf('Error: net::ERR_EMPTY_RESPONSE')>-1){
                    err_msg='Error: net::ERR_EMPTY_RESPONSE';
                    console.log(err_msg,'Browser is in sleep mode!!!!')
                    setTimeout(function(){
                        return loop(++i);
                    },20000);
                    return false;
                }else if(err.stack.indexOf('Error: net::ERR_CONNECTION_CLOSED')>-1){
                    err_msg='Error: net::ERR_CONNECTION_CLOSED';
                    console.log(err_msg,'Browser is in sleep mode!!!!')
                    setTimeout(function(){
                        return loop(++i);
                    },20000);
                    return false;
                }else if(err.stack.indexOf('Skip')>-1){
                    err_msg='Skip';
                    return loop(100);
               }
                else if(err.stack.indexOf('Session closed. Most likely the page has been closed.') > -1){
                    err_msg='Session closed. Most likely the page has been closed.';
                    return loop(++i);
                }

                console.log(url,' FROM ERROR!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    that.CloseBrowser( function(msg){
                        console.log(msg);
                        if( ++that.CountBrowsers>that.TerminateBrowser){
                            console.log('browser terminated');
                            that.Page=false;
                            that.Browser=false;
                            return callback(true);
                        }
                        that.OpenBrowser(function (page) {
                            console.log('Browse ready');
                            global.Page = page;
                            return loop(++i);

                        });
                    });//this will stop the Scraper
                
                return false;
            }

        }(0));
    }


}


module.exports = Chrome;
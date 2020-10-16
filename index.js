const fs = require('fs');
const got = require('got');
const jsdom = require('jsdom');
const request = require('request');

require('dotenv').config();

console.log('QHM Shipping movements Service Starting Up...');

async function main()
{
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const URL = `https://www.royalnavy.mod.uk/qhm/portsmouth/shipping-movements/daily-movements?date=${tomorrow.getDate()}/${tomorrow.getMonth() + 1}/${tomorrow.getFullYear()}`;

    let out = `QHM Portsmouth Shipping Movements for ${tomorrow.getDate()}/${tomorrow.getMonth() + 1}/${tomorrow.getFullYear()}\n\r`;

    const res = await got(URL);
    const dom = new jsdom.JSDOM(res.body);

    const table = dom.window.document.getElementsByClassName('qhm-shipping-movements')[0];

    let output = [];

    for (let i = 0, row; row = table.rows[i]; i++)
    {
        // Find vessel name
        if (row.cells[2].innerHTML.includes('MV')) continue;
        if (row.cells[2].innerHTML.includes('CLOSE')) continue;
        if (row.cells[2].innerHTML.includes('OPEN')) continue;
        if (row.cells[2].innerHTML.includes('Ship')) continue;
        
        let out = {
            time: row.cells[1].innerHTML.trim().replace(/ +(?= )/g,''),
            vessel: row.cells[2].innerHTML.trim().replace(/ +(?= )/g,''),
            from: row.cells[3].innerHTML.trim().replace(/ +(?= )/g,''),
            to: row.cells[4].innerHTML.trim().replace(/ +(?= )/g,''),
            remarks: row.cells[6].innerHTML.trim().replace(/ +(?= )/g,'')
        }

        output.push(out);
    }

    // format output
    for (o of output)
        out += `${o.vessel} movement at ${o.time}, from ${o.from} to ${o.to}\n\r`;

    console.log(out);

    // use sending api
    const numbers = process.env.SMS_RECIPIENTS.split(' ');
    
    for (number of numbers)
    {
        const options = {
            'method': 'POST',
            'url': `https://http-api.d7networks.com/send?username=${process.env.SMS_USER}&password=${process.env.SMS_PASS}&dlr-method=POST&dlr-url=https://4ba60af1.ngrok.io/receive&dlr=yes&dlr-level=3&from=QHM Daily&content=${out}&to=${number}`,
            'headers': {
            },
            formData: {
          
            }
        };
        request(options, function (error, response) {
            if (error) 
            {
                console.log(`Error sending SMS to ${number}: ${error}`);
            }
            console.log(`Sent SMS to ${number}: ${response.body}`);
        });
    }
}

setInterval(function(){
    let date = new Date();
    if (date.getHours() === 12 && date.getMinutes() === 00) {
        main();
    }
}, 60000);

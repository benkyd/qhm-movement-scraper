const fs = require('fs');
const got = require('got');
const jsdom = require('jsdom');

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

console.log(`QHM Portsmouth Shipping Movements for ${tomorrow.getDate()}/${tomorrow.getMonth() + 1}/${tomorrow.getFullYear()}`);

const URL = `https://www.royalnavy.mod.uk/qhm/portsmouth/shipping-movements/daily-movements?date=${tomorrow.getDate()}/${tomorrow.getMonth() + 1}/${tomorrow.getFullYear()}`

async function main()
{
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
    {
        console.log(`${o.vessel} movement at ${o.time}, from ${o.from} to ${o.to}`);
    }

}

main();
